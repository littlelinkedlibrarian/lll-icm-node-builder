import { MemoryMediaStore } from "../adapters/media.js";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { readFileSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "../config.js";
import type { AssortedCapture, Book, Box } from "../domain/model.js";
import { AssortedCaptureService, CandidateService, DomainError, SearchService, assortedFields, candidateFields, limit, page, validateBook, validateBox } from "../application/services.js";
import { readiness } from "../db/database.js";
import { SqliteStore } from "../db/store.js";
import { handleMcpRequest } from "../mcp/server.js";
import type { BibliographicProvider, Embedder, MediaStore, VisionExtractor } from "../ports/index.js";

type Id = { id: string };
type Paging = { page?: string; limit?: string };
const envelope = <T>(value: { data: T[]; page: number; limit: number; total: number }) => ({
  data: value.data,
  pagination: { page: value.page, limit: value.limit, total: value.total, hasMore: value.page * value.limit < value.total }
});
const compatibleBook = (book: Book) => ({
  id: book.id,
  libraryBoxId: book.boxId,
  addedByUserId: null,
  title: book.title,
  author: book.author,
  isbn: book.isbn,
  coverUrl: book.coverUrl ?? null,
  genre: book.genre,
  condition: book.condition ?? "good",
  description: book.description,
  summary: null,
  publicationYear: book.publicationYear ?? null,
  pageCount: null,
  language: book.language,
  aiExtracted: book.aiProvenance !== null,
  confidence: 0,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt
});

export function buildApp(input: { config: AppConfig; db: DatabaseSync; store: SqliteStore; vision?: VisionExtractor; embedder?: Embedder; media?: MediaStore; bibliography?: BibliographicProvider }) {
  const app = Fastify({ logger: false });
  const media = input.media ?? new MemoryMediaStore();
  const candidates = new CandidateService(input.store, input.vision, media, input.bibliography);
  const assorted = new AssortedCaptureService(input.store);
  const search = new SearchService(input.store, input.store, input.embedder);
  const auth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!input.config.operatorToken || request.headers.authorization !== `Bearer ${input.config.operatorToken}`) {
      return reply.code(401).send({ error: "unauthorized", message: "A local operator token is required" });
    }
  };

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) return reply.code(error.status).send({ error: error.code, message: error.message });
    if ((error as { code?: string }).code?.startsWith("SQLITE_CONSTRAINT")) return reply.code(409).send({ error: "conflict", message: "The write conflicts with current data" });
    return reply.code(500).send({ error: "internal_error", message: "The node could not complete the request" });
  });

  const web = {
    html: readFileSync(new URL("../../public/index.html", import.meta.url), "utf8"),
    css: readFileSync(new URL("../../public/styles.css", import.meta.url), "utf8"),
    js: readFileSync(new URL("../../public/app.js", import.meta.url), "utf8")
  };
  const demoPhotos = new Map([
    ["happy-box-outdoor.jpg", readFileSync(new URL("../../public/demo/happy-box-outdoor.jpg", import.meta.url))],
    ["shelf-mixed-catalog.jpg", readFileSync(new URL("../../public/demo/shelf-mixed-catalog.jpg", import.meta.url))],
    ["shelf-math-science.jpg", readFileSync(new URL("../../public/demo/shelf-math-science.jpg", import.meta.url))],
    ["shelf-thinking.jpg", readFileSync(new URL("../../public/demo/shelf-thinking.jpg", import.meta.url))]
  ]);
  app.get("/", async (_request, reply) => reply.type("text/html; charset=utf-8").send(web.html));
  app.get("/assets/styles.css", async (_request, reply) => reply.type("text/css; charset=utf-8").send(web.css));
  app.get("/assets/app.js", async (_request, reply) => reply.type("text/javascript; charset=utf-8").send(web.js));
  app.get("/demo/:name", async (request, reply) => {
    const photo = demoPhotos.get((request.params as { name: string }).name);
    return photo ? reply.header("cache-control", "public, max-age=3600").type("image/jpeg").send(photo) : reply.code(404).send({ error: "not_found", message: "Demo photo not found" });
  });
  app.get("/api/meta", async () => ({ name: input.config.nodeName, publicBaseUrl: input.config.publicBaseUrl.href, compatibilityVersion: "0.1.0" }));
  app.options("/mcp", async (_request, reply) => reply.headers({
    "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id"
  }).code(204).send());
  app.route({ method: ["GET", "POST", "DELETE"], url: "/mcp", preHandler: auth, handler: async (request, reply) => {
    reply.hijack();
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    await handleMcpRequest(request.raw, reply.raw, request.body, {
      store: input.store, publicBaseUrl: input.config.publicBaseUrl, media,
      ...(input.bibliography ? { bibliography: input.bibliography } : {}),
      ...(input.vision ? { vision: input.vision } : {}), ...(input.embedder ? { embedder: input.embedder } : {})
    });
  } });

  const compatibleBox = (box: Box) => ({
    id: box.id,
    name: box.name,
    description: box.description ?? "",
    location: box.location ?? "",
    latitude: box.latitude === null ? null : String(box.latitude),
    longitude: box.longitude === null ? null : String(box.longitude),
    imageUrl: null,
    ownerId: null,
    createdAt: box.createdAt,
    updatedAt: box.updatedAt,
    bookCount: input.store.listBooks(1, 1, box.id, true).total
  });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString(), ...readiness(input.db), openai: input.vision ? "configured" : "disabled" }));
  app.get("/api/boxes", async (request) => {
    const q = request.query as Paging, result = input.store.listBoxes(page(q.page), limit(q.limit), true);
    return envelope({ ...result, data: result.data.map(compatibleBox) });
  });
  app.get("/api/boxes/:id", async (request, reply) => {
    const value = input.store.getBox((request.params as Id).id, true);
    return value ? compatibleBox(value) : reply.code(404).send({ error: "not_found", message: "Box not found" });
  });
  app.get("/api/boxes/:id/books", async (request, reply) => {
    const id = (request.params as Id).id;
    if (!input.store.getBox(id, true)) return reply.code(404).send({ error: "not_found", message: "Box not found" });
    const q = request.query as Paging, result = input.store.listBooks(page(q.page), limit(q.limit), id, true);
    return envelope({ ...result, data: result.data.map(compatibleBook) });
  });
  app.get("/api/boxes/:id/assorted", async (request, reply) => {
    const id = (request.params as Id).id;
    if (!input.store.getBox(id, true)) return reply.code(404).send({ error: "not_found", message: "Box not found" });
    return { data: input.store.listPublicAssorted(id).map(capture => ({
      id: capture.id, boxId: capture.boxId, state: capture.state, fields: capture.fields,
      imageUrl: "/api/assorted/" + capture.id + "/image", createdAt: capture.createdAt, updatedAt: capture.updatedAt
    })) };
  });
  app.get("/api/assorted/:id/image", async (request, reply) => {
    const id = (request.params as Id).id;
    if (!input.store.getPublicAssorted(id)) return reply.code(404).send({ error: "not_found", message: "Assorted item not found" });
    const value = input.store.getAssortedImage(id);
    return value ? reply.type(value.mimeType).send(Buffer.from(value.bytes)) : reply.code(404).send({ error: "not_found", message: "Assorted item image not found" });
  });

  app.get("/api/books", async (request) => {
    const q = request.query as Paging, result = input.store.listBooks(page(q.page), limit(q.limit), undefined, true);
    return envelope({ ...result, data: result.data.map(compatibleBook) });
  });
  app.get("/api/books/:id", async (request, reply) => {
    const value = input.store.getBook((request.params as Id).id, true);
    return value ? compatibleBook(value) : reply.code(404).send({ error: "not_found", message: "Book not found" });
  });

  app.get("/api/manage/boxes", { preHandler: auth }, async (request) => {
    const q = request.query as Paging; return envelope(input.store.listBoxes(page(q.page), limit(q.limit), false));
  });
  app.get("/api/manage/books", { preHandler: auth }, async (request) => {
    const q = request.query as Paging; return envelope(input.store.listBooks(page(q.page), limit(q.limit), undefined, false));
  });

  app.post("/api/manage/boxes", { preHandler: auth }, async (request, reply) => {
    const body = request.body as Omit<Box, "id" | "createdAt" | "updatedAt">;
    validateBox(body); return reply.code(201).send(input.store.create(body));
  });
  app.patch("/api/manage/boxes/:id", { preHandler: auth }, async (request, reply) => {
    const id = (request.params as Id).id, current = input.store.getBox(id);
    if (!current) return reply.code(404).send({ error: "not_found", message: "Box not found" });
    const next = { ...current, ...(request.body as object) };
    validateBox(next); return input.store.update(id, request.body as Partial<Box>);
  });
  app.delete("/api/manage/boxes/:id", { preHandler: auth }, async (request, reply) => {
    const result = input.store.delete((request.params as Id).id);
    if (result === "not_empty") return reply.code(409).send({ error: "box_not_empty", message: "Move or remove books, Assorted Things captures, and private scan activities first" });
    if (result === "missing") return reply.code(404).send({ error: "not_found", message: "Box not found" });
    return reply.code(204).send();
  });

  app.post("/api/manage/books", { preHandler: auth }, async (request, reply) => {
    const body = request.body as Omit<Book, "id" | "createdAt" | "updatedAt">;
    validateBook(body, input.store);
    const book = input.store.create(body);
    try { await search.index(book); } catch { /* canonical write remains successful */ }
    return reply.code(201).send(book);
  });
  app.patch("/api/manage/books/:id", { preHandler: auth }, async (request, reply) => {
    const id = (request.params as Id).id, current = input.store.getBook(id);
    if (!current) return reply.code(404).send({ error: "not_found", message: "Book not found" });
    const next = { ...current, ...(request.body as object) };
    validateBook(next, input.store);
    const book = input.store.update(id, request.body as Partial<Book>) as Book;
    try { await search.index(book); } catch { /* searchable through keyword fallback */ }
    return book;
  });
  app.delete("/api/manage/books/:id", { preHandler: auth }, async (request, reply) => {
    return input.store.delete((request.params as Id).id) ? reply.code(204).send() : reply.code(404).send({ error: "not_found", message: "Book not found" });
  });

  app.post("/api/manage/demo/seed", { preHandler: auth }, async () => {
    const fixture = {
      name: "Happy Box",
      description: "A real neighborhood library box and the starting point for photo-backed cataloging in St. Augustine.",
      location: "66 Colon Ave, St. Augustine, FL 32084",
      latitude: 29.927154,
      longitude: -81.325848,
      visibility: "public" as const
    };
    const existing = input.store.listBoxes(1, 50).data.find(box => box.name === fixture.name);
    if (existing) input.store.update(existing.id, fixture); else input.store.create(fixture);
    return { boxes: input.store.listBoxes(1, 50).total, books: input.store.listBooks(1, 50).total };
  });

  const activityView = (id: string) => {
    const activity = input.store.getActivity(id);
    if (!activity) return null;
    const asset = input.store.getMediaAsset(activity.mediaAssetId);
    return { ...activity, imageUrl: "/api/manage/activities/" + activity.id + "/image", media: asset ? { mimeType: asset.mimeType, byteSize: asset.byteSize, width: asset.width, height: asset.height, sha256: asset.sha256 } : null, candidates: input.store.listActivityCandidates(activity.id), events: input.store.listActivityEvents(activity.id) };
  };
  app.get("/api/manage/activities", { preHandler: auth }, async (request) => {
    const query = request.query as { boxId?: string; limit?: string };
    return { data: input.store.listActivities(query.boxId, limit(query.limit)).map(activity => activityView(activity.id)) };
  });
  app.get("/api/manage/activities/:id", { preHandler: auth }, async (request, reply) => {
    return activityView((request.params as Id).id) ?? reply.code(404).send({ error: "not_found", message: "Scan activity not found" });
  });
  app.get("/api/manage/activities/:id/image", { preHandler: auth }, async (request, reply) => {
    const activity = input.store.getActivity((request.params as Id).id);
    const asset = activity ? input.store.getMediaAsset(activity.mediaAssetId) : undefined;
    if (!asset) return reply.code(404).send({ error: "not_found", message: "Scan image not found" });
    try { return reply.header("cache-control", "private, max-age=300").type(asset.mimeType).send(Buffer.from(await media.read(asset.storageKey))); }
    catch { return reply.code(404).send({ error: "not_found", message: "Scan image bytes not found" }); }
  });
  app.post("/api/manage/candidates/:id/metadata-selection", { preHandler: auth }, async (request, reply) => {
    const id = (request.params as Id).id;
    if (!input.store.getCandidate(id)) return reply.code(404).send({ error: "not_found", message: "Candidate not found" });
    const proposalId = (request.body as { proposalId?: string | null }).proposalId ?? null;
    try { return { selected: input.store.selectMetadataProposal(id, proposalId), candidate: input.store.getCandidate(id) }; }
    catch { return reply.code(404).send({ error: "metadata_proposal_not_found", message: "Metadata proposal does not belong to this candidate" }); }
  });

  app.post("/api/manage/candidates/analyze", { preHandler: auth, bodyLimit: 14 * 1024 * 1024 }, async (request, reply) => {
    const body = request.body as { boxId: string; mimeType: string; imageBase64: string };
    const value = await candidates.analyze(body.boxId, body.mimeType, Buffer.from(body.imageBase64, "base64"));
    return reply.code(201).send(value);
  });
  app.get("/api/manage/candidates/:id", { preHandler: auth }, async (request, reply) => {
    return input.store.getCandidate((request.params as Id).id) ?? reply.code(404).send({ error: "not_found", message: "Candidate not found" });
  });
  app.patch("/api/manage/candidates/:id", { preHandler: auth }, async (request, reply) => {
    const id = (request.params as Id).id;
    const value = input.store.updateFields(id, candidateFields(request.body, true));
    if (!value) return reply.code(409).send({ error: "invalid_candidate_state", message: "Only pending candidates can be edited" });
    if (input.bibliography) {
      try { input.store.addMetadataProposals(id, await input.bibliography.findEditions(value.fields)); } catch { /* reviewed fields remain usable */ }
    }
    return input.store.getCandidate(id);
  });
  app.post("/api/manage/candidates/:id/reject", { preHandler: auth }, async (request, reply) => {
    const value = input.store.reject((request.params as Id).id);
    return value ?? reply.code(409).send({ error: "invalid_candidate_state", message: "Only pending candidates can be rejected" });
  });
  app.post("/api/manage/candidates/:id/confirm", { preHandler: auth }, async (request) => {
    const body = request.body as { actor: string; idempotencyKey: string };
    if (!body.actor?.trim() || !body.idempotencyKey?.trim()) throw new DomainError("validation_error", 400, "Actor and idempotencyKey are required");
    const candidate = input.store.getCandidate((request.params as Id).id);
    if (candidate) candidateFields(candidate.fields, true);
    let result;
    try {
      result = input.store.confirm((request.params as Id).id, body.actor, body.idempotencyKey);
    } catch (error) {
      if (error instanceof Error && ["invalid_candidate_state", "idempotency_conflict"].includes(error.message)) {
        throw new DomainError(error.message, 409, "Candidate cannot be confirmed in its current state");
      }
      throw error;
    }
    try { await search.index(result.book); } catch { /* retry in a later job adapter */ }
    return result;
  });
  app.post("/api/manage/assorted/capture", { preHandler: auth, bodyLimit: 14 * 1024 * 1024 }, async (request, reply) => {
    const body = request.body as { boxId: string; mimeType: string; imageBase64: string; title?: string; note?: string };
    const value = await assorted.capture({ ...body, bytes: Buffer.from(body.imageBase64, "base64") });
    return reply.code(201).send(value);
  });
  app.get("/api/manage/assorted", { preHandler: auth }, async (request) => {
    const q = request.query as { boxId?: string; state?: AssortedCapture["state"] };
    if (q.state && !["pending_review", "confirmed", "rejected"].includes(q.state)) throw new DomainError("validation_error", 400, "Unknown review state");
    return { data: input.store.listAssorted(q.boxId, q.state) };
  });
  app.get("/api/manage/assorted/:id", { preHandler: auth }, async (request, reply) => {
    return input.store.getAssorted((request.params as Id).id) ?? reply.code(404).send({ error: "not_found", message: "Assorted capture not found" });
  });
  app.get("/api/manage/assorted/:id/image", { preHandler: auth }, async (request, reply) => {
    const value = input.store.getAssortedImage((request.params as Id).id);
    return value ? reply.type(value.mimeType).send(Buffer.from(value.bytes)) : reply.code(404).send({ error: "not_found", message: "Assorted capture image not found" });
  });
  app.patch("/api/manage/assorted/:id", { preHandler: auth }, async (request, reply) => {
    const value = input.store.updateAssorted((request.params as Id).id, assortedFields(request.body));
    return value ?? reply.code(409).send({ error: "invalid_assorted_state", message: "Only pending Assorted Things can be edited" });
  });
  app.post("/api/manage/assorted/:id/reject", { preHandler: auth }, async (request, reply) => {
    const value = input.store.rejectAssorted((request.params as Id).id);
    return value ?? reply.code(409).send({ error: "invalid_assorted_state", message: "Only pending Assorted Things can be rejected" });
  });
  app.post("/api/manage/assorted/:id/confirm", { preHandler: auth }, async (request) => {
    const body = request.body as { actor: string; idempotencyKey: string };
    if (!body.actor?.trim() || !body.idempotencyKey?.trim()) throw new DomainError("validation_error", 400, "Actor and idempotencyKey are required");
    try { return input.store.confirmAssorted((request.params as Id).id, body.actor, body.idempotencyKey); }
    catch (error) {
      if (error instanceof Error && ["invalid_assorted_state", "idempotency_conflict"].includes(error.message)) throw new DomainError(error.message, 409, "Assorted capture cannot be confirmed in its current state");
      throw error;
    }
  });

  app.get("/api/search", async (request) => {
    const q = request.query as { q?: string; boxId?: string };
    return search.search(q.q ?? "", q.boxId);
  });
  return app;
}
