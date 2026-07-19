import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import type { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "../config.js";
import type { Book, Box } from "../domain/model.js";
import { CandidateService, DomainError, SearchService, candidateFields, limit, page, validateBook, validateBox } from "../application/services.js";
import { readiness } from "../db/database.js";
import { SqliteStore } from "../db/store.js";
import type { Embedder, VisionExtractor } from "../ports/index.js";

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
  coverUrl: null,
  genre: book.genre,
  condition: book.condition ?? "good",
  description: book.description,
  summary: null,
  publicationYear: null,
  pageCount: null,
  language: book.language,
  aiExtracted: book.aiProvenance !== null,
  confidence: 0,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt
});

export function buildApp(input: { config: AppConfig; db: DatabaseSync; store: SqliteStore; vision?: VisionExtractor; embedder?: Embedder }) {
  const app = Fastify({ logger: false });
  const candidates = new CandidateService(input.store, input.vision);
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
  app.get("/api/books", async (request) => {
    const q = request.query as Paging, result = input.store.listBooks(page(q.page), limit(q.limit), undefined, true);
    return envelope({ ...result, data: result.data.map(compatibleBook) });
  });
  app.get("/api/books/:id", async (request, reply) => {
    const value = input.store.getBook((request.params as Id).id, true);
    return value ? compatibleBook(value) : reply.code(404).send({ error: "not_found", message: "Book not found" });
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
    if (result === "not_empty") return reply.code(409).send({ error: "box_not_empty", message: "Move or remove books first" });
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

  app.post("/api/manage/candidates/analyze", { preHandler: auth, bodyLimit: 14 * 1024 * 1024 }, async (request, reply) => {
    const body = request.body as { boxId: string; mimeType: string; imageBase64: string };
    const value = await candidates.analyze(body.boxId, body.mimeType, Buffer.from(body.imageBase64, "base64"));
    return reply.code(201).send(value);
  });
  app.get("/api/manage/candidates/:id", { preHandler: auth }, async (request, reply) => {
    return input.store.getCandidate((request.params as Id).id) ?? reply.code(404).send({ error: "not_found", message: "Candidate not found" });
  });
  app.patch("/api/manage/candidates/:id", { preHandler: auth }, async (request, reply) => {
    const value = input.store.updateFields((request.params as Id).id, candidateFields(request.body));
    return value ?? reply.code(409).send({ error: "invalid_candidate_state", message: "Only pending candidates can be edited" });
  });
  app.post("/api/manage/candidates/:id/reject", { preHandler: auth }, async (request, reply) => {
    const value = input.store.reject((request.params as Id).id);
    return value ?? reply.code(409).send({ error: "invalid_candidate_state", message: "Only pending candidates can be rejected" });
  });
  app.post("/api/manage/candidates/:id/confirm", { preHandler: auth }, async (request) => {
    const body = request.body as { actor: string; idempotencyKey: string };
    if (!body.actor?.trim() || !body.idempotencyKey?.trim()) throw new DomainError("validation_error", 400, "Actor and idempotencyKey are required");
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
  app.get("/api/search", async (request) => {
    const q = request.query as { q?: string; boxId?: string };
    return search.search(q.q ?? "", q.boxId);
  });
  return app;
}
