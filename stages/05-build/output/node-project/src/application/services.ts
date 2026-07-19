import { createHash, randomUUID } from "node:crypto";
import type { AssortedFields, Book, Box, CandidateFields, SearchMode } from "../domain/model.js";
import type { BibliographicProvider, Embedder, MediaStore, VectorIndex, VisionExtractor } from "../ports/index.js";
import { validatedIsbn } from "./isbn.js";
import { SqliteStore } from "../db/store.js";

export class DomainError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) { super(message); }
}

export function page(input: unknown): number {
  const value = Number(input ?? 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
}
export function limit(input: unknown): number {
  const value = Number(input ?? 20);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 50) : 20;
}

export function validateBox(input: Omit<Box, "id" | "createdAt" | "updatedAt">): void {
  if (!input.name.trim()) throw new DomainError("validation_error", 400, "Box name is required");
  const paired = (input.latitude === null) === (input.longitude === null);
  if (!paired) throw new DomainError("coordinates_must_be_paired", 400, "Latitude and longitude must be supplied together");
  if (input.latitude !== null && (input.latitude < -90 || input.latitude > 90 || input.longitude! < -180 || input.longitude! > 180)) {
    throw new DomainError("coordinates_out_of_range", 400, "Coordinates are outside valid ranges");
  }
}

export function validateBook(input: Omit<Book, "id" | "createdAt" | "updatedAt">, store: SqliteStore): void {
  if (!input.title.trim() || !input.author.trim()) throw new DomainError("validation_error", 400, "Title and author are required");
  if (!store.getBox(input.boxId)) throw new DomainError("box_not_found", 404, "Destination box does not exist");
}

export function candidateFields(value: unknown, requireIdentity = false): CandidateFields {
  if (!value || typeof value !== "object") throw new DomainError("invalid_model_output", 502, "Model output is not an object");
  const row = value as Record<string, unknown>;
  if (typeof row.title !== "string" || typeof row.author !== "string" || (requireIdentity && (!row.title.trim() || !row.author.trim()))) {
    throw new DomainError(requireIdentity ? "validation_error" : "invalid_model_output", requireIdentity ? 400 : 502, requireIdentity ? "Review requires a title and author" : "Model output must contain title and author strings");
  }
  const optional = (key: string) => row[key] === null || row[key] === undefined ? null : typeof row[key] === "string" ? row[key] : null;
  return {
    title: row.title, author: row.author, isbn: optional("isbn"), genre: optional("genre"),
    description: optional("description"), language: optional("language"), condition: optional("condition")
  };
}

export class CandidateService {
  constructor(private readonly store: SqliteStore, private readonly vision: VisionExtractor | undefined, private readonly media: MediaStore, private readonly bibliography?: BibliographicProvider) {}
  async analyze(boxId: string, mimeType: string, bytes: Uint8Array) {
    if (!this.store.getBox(boxId)) throw new DomainError("box_not_found", 404, "Destination box does not exist");
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new DomainError("unsupported_image", 400, "Use JPEG, PNG, or WebP");
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new DomainError("invalid_image_size", 400, "Image must be 1 byte through 10 MiB");
    const stored = await this.media.save(bytes, mimeType);
    const asset = this.store.createMediaAsset({ ...stored, mimeType });
    const activity = this.store.createActivity(boxId, asset.id);
    this.store.addActivityEvent(activity.id, "extraction.started", null, null, {});
    try {
      if (!this.vision) throw new DomainError("openai_unavailable", 503, "Vision extraction is not configured; the saved activity can be retried later");
      const extracted = await this.vision.extract({ mimeType, bytes });
      if (!Array.isArray(extracted.candidates) || !extracted.candidates.length || extracted.candidates.length > 15) throw new DomainError("invalid_model_output", 502, "Model output must contain 1 through 15 book candidates");
      const reviewedFields = extracted.candidates.map(value => { const fields = candidateFields(value); return { ...fields, isbn: validatedIsbn(fields.isbn) }; });
      const created = reviewedFields.map((fields, position) => this.store.createCandidate(boxId, fields, { ...extracted.provenance, batchId: activity.id, position, candidateCount: reviewedFields.length }, activity.id));
      for (const candidate of created.slice(0, 5)) {
        if (!this.bibliography || !candidate.fields.title.trim() || !candidate.fields.author.trim()) continue;
        try {
          const proposals = await this.bibliography.findEditions(candidate.fields);
          this.store.addMetadataProposals(candidate.id, proposals);
          this.store.addActivityEvent(activity.id, "metadata.proposed", candidate.id, null, { count: proposals.length, provider: "openlibrary" });
        } catch { this.store.addActivityEvent(activity.id, "metadata.unavailable", candidate.id, null, { provider: "openlibrary" }); }
      }
      this.store.updateActivity(activity.id, "pending_review", { provenance: extracted.provenance });
      this.store.addActivityEvent(activity.id, "extraction.succeeded", null, null, { candidateCount: created.length });
      return { ...this.store.getActivity(activity.id)!, imageUrl: "/api/manage/activities/" + activity.id + "/image", candidates: this.store.listActivityCandidates(activity.id) };
    } catch (error) {
      const code = error instanceof DomainError ? error.code : "openai_unavailable";
      const message = error instanceof Error ? error.message : "Vision extraction failed";
      this.store.updateActivity(activity.id, "failed", { errorCode: code, errorMessage: message });
      this.store.addActivityEvent(activity.id, "extraction.failed", null, null, { code });
      if (error instanceof DomainError) throw error;
      throw new DomainError("openai_unavailable", 503, "Vision extraction failed; the saved activity can be retried later");
    }
  }
}

export function assortedFields(value: unknown): AssortedFields {
  if (!value || typeof value !== "object") throw new DomainError("invalid_model_output", 502, "Assorted metadata is not an object");
  const row = value as Record<string, unknown>;
  if (typeof row.title !== "string" || !row.title.trim()) throw new DomainError("validation_error", 400, "A short item title is required");
  const optional = (key: string) => row[key] === null || row[key] === undefined || row[key] === "" ? null : typeof row[key] === "string" ? row[key] : null;
  const strings = (key: string) => Array.isArray(row[key]) ? row[key].filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map(item => item.trim()).slice(0, 12) : [];
  const quantity = row.quantity === null || row.quantity === undefined || row.quantity === "" ? null : Number(row.quantity);
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0 || quantity > 999)) throw new DomainError("validation_error", 400, "Quantity must be a whole number from 0 through 999");
  return {
    title: row.title.trim(), category: optional("category"), description: optional("description"),
    tags: strings("tags"), condition: optional("condition"), quantity,
    unknowns: strings("unknowns"), reviewQuestions: strings("reviewQuestions")
  };
}

export class AssortedCaptureService {
  constructor(private readonly store: SqliteStore) {}
  async capture(input: { boxId: string; mimeType: string; bytes: Uint8Array; title?: string; note?: string }) {
    if (!this.store.getBox(input.boxId)) throw new DomainError("box_not_found", 404, "Destination box does not exist");
    if (!["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) throw new DomainError("unsupported_image", 400, "Use JPEG, PNG, or WebP");
    if (!input.bytes.length || input.bytes.length > 10 * 1024 * 1024) throw new DomainError("invalid_image_size", 400, "Image must be 1 byte through 10 MiB");
    const manualTitle = input.title?.trim() || "Unidentified item";
    const manualNote = input.note?.trim() || null;
    const initial = assortedFields({
      title: manualTitle, category: null, description: manualNote, tags: [], condition: null, quantity: null,
      unknowns: [],
      reviewQuestions: []
    });
    return this.store.createAssorted({ boxId: input.boxId, mimeType: input.mimeType, bytes: input.bytes, fields: initial });
  }
}

export function representation(book: Book): string {
  return [
    `title: ${book.title.trim()}`, `author: ${book.author.trim()}`, `genre: ${book.genre?.trim() ?? ""}`,
    `description: ${book.description?.trim() ?? ""}`, `language: ${book.language?.trim() ?? ""}`
  ].join("\n").toLowerCase();
}

export class SearchService {
  constructor(private readonly store: SqliteStore, private readonly vectors: VectorIndex, private readonly embedder?: Embedder) {}
  async index(book: Book): Promise<void> {
    if (!this.embedder) return;
    const source = representation(book);
    const vector = await this.embedder.embed(source);
    this.vectors.put(book.id, vector, "book-search-v1", createHash("sha256").update(source).digest("hex"), "text-embedding-3-small");
  }
  async search(query: string, boxId?: string): Promise<{ data: Book[]; mode: SearchMode }> {
    if (!query.trim()) return { data: [], mode: "keyword" };
    if (!this.embedder) return { data: this.store.keyword(query, boxId), mode: "keyword" };
    try {
      return { data: this.vectors.search(await this.embedder.embed(query), 20, boxId), mode: "semantic" };
    } catch {
      return { data: this.store.keyword(query, boxId), mode: "keyword_fallback" };
    }
  }
}
