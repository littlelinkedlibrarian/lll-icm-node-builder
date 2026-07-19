import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import type { CandidateFields } from "../src/domain/model.js";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { buildApp } from "../src/http/app.js";
import type { Embedder, VisionExtractor } from "../src/ports/index.js";

const vector = (index: number) => Array.from({ length: 1536 }, (_, i) => i === index ? 1 : 0);
class FakeEmbedder implements Embedder {
  async embed(text: string) { return vector(text.toLowerCase().includes("ocean") ? 0 : 1); }
}
class FakeVision implements VisionExtractor {
  async extract() {
    const fields: CandidateFields = { title: "The Ocean Book", author: "Ada Reader", isbn: null, genre: "Nature", description: "Ocean life", language: "en", condition: null };
    return { fields, provenance: { provider: "fixture", model: "gpt-5.6-sol" } };
  }
}

describe("reference node", () => {
  let db: DatabaseSync;
  beforeEach(() => { db = openDatabase(":memory:"); });
  afterEach(() => db.close());

  it("runs public-compatible CRUD with paired zero coordinates and protects writes", async () => {
    const store = new SqliteStore(db);
    const app = buildApp({ config: {
      host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Test",
      publicBaseUrl: new URL("http://localhost:3000"), operatorToken: "secret",
      visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false
    }, db, store });
    expect((await app.inject({ method: "POST", url: "/api/manage/boxes", payload: {} })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/api/manage/boxes", headers: { authorization: "Bearer secret" }, payload: {
      name: "Invalid", description: null, location: null, latitude: 91, longitude: null, visibility: "public"
    } })).statusCode).toBe(400);
    const created = await app.inject({ method: "POST", url: "/api/manage/boxes", headers: { authorization: "Bearer secret" }, payload: {
      name: "Happy Box", description: null, location: "Park", latitude: 0, longitude: 0, visibility: "public"
    } });
    expect(created.statusCode).toBe(201);
    const box = created.json();
    const bookResponse = await app.inject({ method: "POST", url: "/api/manage/books", headers: { authorization: "Bearer secret" }, payload: {
      boxId: box.id, title: "Manual Book", author: "Human", isbn: null, genre: null, description: null,
      language: null, condition: null, visibility: "public", aiProvenance: null
    } });
    expect(bookResponse.statusCode).toBe(201);
    const book = bookResponse.json();
    const listed = await app.inject({ method: "GET", url: `/api/boxes/${box.id}/books?limit=100` });
    expect(listed.json()).toMatchObject({ data: [{ title: "Manual Book" }], pagination: { page: 1, limit: 50, total: 1 } });
    expect((await app.inject({ method: "DELETE", url: `/api/manage/boxes/${box.id}`, headers: { authorization: "Bearer secret" } })).statusCode).toBe(409);

    const secondResponse = await app.inject({ method: "POST", url: "/api/manage/boxes", headers: { authorization: "Bearer secret" }, payload: {
      name: "Second Box", description: null, location: null, latitude: null, longitude: null, visibility: "public"
    } });
    const second = secondResponse.json();
    expect((await app.inject({ method: "PATCH", url: `/api/manage/boxes/${second.id}`, headers: { authorization: "Bearer secret" }, payload: { name: "Renamed Box" } })).json().name).toBe("Renamed Box");
    expect((await app.inject({ method: "PATCH", url: `/api/manage/books/${book.id}`, headers: { authorization: "Bearer secret" }, payload: { boxId: second.id } })).json().boxId).toBe(second.id);
    store.put(book.id, vector(0), "book-search-v1", "cleanup", "text-embedding-3-small");
    expect((await app.inject({ method: "DELETE", url: `/api/manage/books/${book.id}`, headers: { authorization: "Bearer secret" } })).statusCode).toBe(204);
    expect(store.search(vector(0), 10)).toEqual([]);
    expect((await app.inject({ method: "DELETE", url: `/api/manage/boxes/${box.id}`, headers: { authorization: "Bearer secret" } })).statusCode).toBe(204);
    expect((await app.inject({ method: "DELETE", url: `/api/manage/boxes/${second.id}`, headers: { authorization: "Bearer secret" } })).statusCode).toBe(204);

    store.create({ name: "Private Box", description: null, location: null, latitude: null, longitude: null, visibility: "private" });
    const publicBoxes = (await app.inject({ method: "GET", url: "/api/boxes" })).json();
    expect(publicBoxes.data).toEqual([]);
    await app.close();
  });

  it("keeps a vision result pending until idempotent human confirmation", async () => {
    const store = new SqliteStore(db);
    const box = store.create({ name: "Scan Box", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const app = buildApp({ config: {
      host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Test",
      publicBaseUrl: new URL("http://localhost:3000"), operatorToken: "secret",
      visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false
    }, db, store, vision: new FakeVision() });
    const analyzed = await app.inject({ method: "POST", url: "/api/manage/candidates/analyze", headers: { authorization: "Bearer secret" }, payload: {
      boxId: box.id, mimeType: "image/jpeg", imageBase64: Buffer.from("fixture").toString("base64")
    } });
    expect(analyzed.statusCode).toBe(201);
    const candidate = analyzed.json();
    expect(candidate.state).toBe("pending");
    expect(store.listBooks(1, 20).total).toBe(0);
    const request = { method: "POST" as const, url: `/api/manage/candidates/${candidate.id}/confirm`, headers: { authorization: "Bearer secret" }, payload: { actor: "learner", idempotencyKey: "demo-1" } };
    const first = (await app.inject(request)).json();
    const second = (await app.inject(request)).json();
    expect(first.book.id).toBe(second.book.id);
    expect(store.listBooks(1, 20).total).toBe(1);

    const rejectedResponse = await app.inject({ method: "POST", url: "/api/manage/candidates/analyze", headers: { authorization: "Bearer secret" }, payload: {
      boxId: box.id, mimeType: "image/png", imageBase64: Buffer.from("fixture").toString("base64")
    } });
    const rejected = rejectedResponse.json();
    expect((await app.inject({ method: "POST", url: `/api/manage/candidates/${rejected.id}/reject`, headers: { authorization: "Bearer secret" } })).json().state).toBe("rejected");
    expect((await app.inject({ method: "POST", url: `/api/manage/candidates/${rejected.id}/confirm`, headers: { authorization: "Bearer secret" }, payload: {
      actor: "learner", idempotencyKey: "demo-2"
    } })).statusCode).toBe(409);
    await app.close();
  });

  it("runs a real 1536-dimension sqlite-vec query and keyword fallback", async () => {
    const store = new SqliteStore(db);
    const box = store.create({ name: "Vector Box", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const ocean = store.create({ boxId: box.id, title: "Ocean Atlas", author: "Blue", isbn: null, genre: null, description: "ocean", language: null, condition: null, visibility: "public", aiProvenance: null });
    const forest = store.create({ boxId: box.id, title: "Forest Atlas", author: "Green", isbn: null, genre: null, description: "trees", language: null, condition: null, visibility: "public", aiProvenance: null });
    store.put(ocean.id, vector(0), "book-search-v1", "a", "text-embedding-3-small");
    store.put(forest.id, vector(1), "book-search-v1", "b", "text-embedding-3-small");
    expect(store.search(vector(0), 2, box.id)[0]?.id).toBe(ocean.id);
    expect(() => store.put(ocean.id, [1], "book-search-v1", "bad", "text-embedding-3-small")).toThrow("embedding_dimension");
    const semantic = new (await import("../src/application/services.js")).SearchService(store, store, new FakeEmbedder());
    expect((await semantic.search("ocean", box.id)).mode).toBe("semantic");
    const fallback = new (await import("../src/application/services.js")).SearchService(store, { put() {}, search() { throw new Error("offline"); } }, new FakeEmbedder());
    expect(await fallback.search("ocean", box.id)).toMatchObject({ mode: "keyword_fallback", data: [{ id: ocean.id }] });
  });
});
