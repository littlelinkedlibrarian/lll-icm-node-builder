import { createHash } from "node:crypto";
import type { Book, Box, CandidateFields, SearchMode } from "../domain/model.js";
import type { Embedder, VectorIndex, VisionExtractor } from "../ports/index.js";
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

export function candidateFields(value: unknown): CandidateFields {
  if (!value || typeof value !== "object") throw new DomainError("invalid_model_output", 502, "Model output is not an object");
  const row = value as Record<string, unknown>;
  if (typeof row.title !== "string" || !row.title.trim() || typeof row.author !== "string" || !row.author.trim()) {
    throw new DomainError("invalid_model_output", 502, "Model output must contain title and author");
  }
  const optional = (key: string) => row[key] === null || row[key] === undefined ? null : typeof row[key] === "string" ? row[key] : null;
  return {
    title: row.title, author: row.author, isbn: optional("isbn"), genre: optional("genre"),
    description: optional("description"), language: optional("language"), condition: optional("condition")
  };
}

export class CandidateService {
  constructor(private readonly store: SqliteStore, private readonly vision?: VisionExtractor) {}
  async analyze(boxId: string, mimeType: string, bytes: Uint8Array) {
    if (!this.store.getBox(boxId)) throw new DomainError("box_not_found", 404, "Destination box does not exist");
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new DomainError("unsupported_image", 400, "Use JPEG, PNG, or WebP");
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new DomainError("invalid_image_size", 400, "Image must be 1 byte through 10 MiB");
    if (!this.vision) throw new DomainError("openai_unavailable", 503, "Vision extraction is not configured");
    try {
      const extracted = await this.vision.extract({ mimeType, bytes });
      return this.store.createCandidate(boxId, candidateFields(extracted.fields), extracted.provenance);
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError("openai_unavailable", 503, "Vision extraction is temporarily unavailable");
    }
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
