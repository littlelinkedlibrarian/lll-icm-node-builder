import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { MemoryMediaStore } from "../src/adapters/media.js";
import { validIsbn } from "../src/application/isbn.js";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { buildApp } from "../src/http/app.js";
import type { BibliographicProvider, VisionExtractor } from "../src/ports/index.js";

const config = { host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Activity Box", publicBaseUrl: new URL("https://box.example"), operatorToken: "secret", visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false };
const auth = { authorization: "Bearer secret" };
class ShelfVision implements VisionExtractor {
  async extract() { return { candidates: [
    { title: "Ocean Atlas", author: "Ada Reader", isbn: "not-an-isbn", genre: "Nature", description: null, language: "en", condition: "good" },
    { title: "Forest Atlas", author: "Bea Reader", isbn: null, genre: "Nature", description: null, language: "en", condition: "good" }
  ], provenance: { provider: "openai", model: "fake" } }; }
}
class Editions implements BibliographicProvider {
  async findEditions(fields: Parameters<BibliographicProvider["findEditions"]>[0]) { return [{ provider: "openlibrary", workId: "OL1W", editionId: "OL1M", isbn10: null, isbn13: "9780306406157", title: fields.title, authors: [fields.author], description: "An enriched description.", language: "eng", publisher: "Example Press", publishedDate: "2024", subjects: ["Nature"], coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg?default=false", sourceUrl: "https://openlibrary.org/books/OL1M" }]; }
}
class FullShelfVision implements VisionExtractor {
  async extract() {
    return { candidates: Array.from({ length: 7 }, (_, index) => ({ title: "Shelf Book " + index, author: "Reader " + index, isbn: null, genre: null, description: null, language: "en", condition: null })), provenance: { provider: "openai", model: "fake" } };
  }
}
class CountingEditions extends Editions {
  calls = 0;
  override async findEditions(fields: Parameters<BibliographicProvider["findEditions"]>[0]) { this.calls += 1; return super.findEditions(fields); }
}

describe("scan activity and edition metadata", () => {
  let db: DatabaseSync;
  beforeEach(() => { db = openDatabase(":memory:"); });
  afterEach(() => db.close());

  it("stores the parent image before review and records every child outcome", async () => {
    const store = new SqliteStore(db), media = new MemoryMediaStore();
    const box = store.create({ name: "Shelf", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const app = buildApp({ config, db, store, media, vision: new ShelfVision(), bibliography: new Editions() });
    const bytes = Buffer.from("shelf-image");
    const scan = await app.inject({ method: "POST", url: "/api/manage/candidates/analyze", headers: auth, payload: { boxId: box.id, mimeType: "image/jpeg", imageBase64: bytes.toString("base64") } });
    expect(scan.statusCode).toBe(201);
    const activity = scan.json();
    expect(activity).toMatchObject({ state: "pending_review", candidates: [{ activityId: activity.id, fields: { isbn: null } }, { activityId: activity.id }] });
    expect(activity.candidates[0].metadataProposals).toHaveLength(1);
    expect((await app.inject({ method: "GET", url: "/api/manage/activities" })).statusCode).toBe(401);
    const image = await app.inject({ method: "GET", url: `/api/manage/activities/${activity.id}/image`, headers: auth });
    expect(image.rawPayload.equals(bytes)).toBe(true);
    const first = activity.candidates[0], second = activity.candidates[1], proposal = first.metadataProposals[0];
    await app.inject({ method: "POST", url: `/api/manage/candidates/${first.id}/metadata-selection`, headers: auth, payload: { proposalId: proposal.id } });
    const confirmed = await app.inject({ method: "POST", url: `/api/manage/candidates/${first.id}/confirm`, headers: auth, payload: { actor: "tester", idempotencyKey: "activity-confirm-1" } });
    expect(confirmed.json().book).toMatchObject({ isbn: "9780306406157", coverUrl: proposal.coverUrl, publicationYear: 2024 });
    await app.inject({ method: "POST", url: `/api/manage/candidates/${second.id}/reject`, headers: auth, payload: {} });
    const detail = (await app.inject({ method: "GET", url: `/api/manage/activities/${activity.id}`, headers: auth })).json();
    expect(detail.state).toBe("completed");
    expect(detail.candidates.map((item: { state: string }) => item.state)).toEqual(["confirmed", "rejected"]);
    expect(detail.events.map((item: { eventType: string }) => item.eventType)).toEqual(expect.arrayContaining(["upload.saved", "extraction.succeeded", "metadata.selected", "candidate.confirmed", "candidate.rejected"]));
    await app.close();
  });

  it("keeps a failed scan and its image when vision is unavailable", async () => {
    const store = new SqliteStore(db), media = new MemoryMediaStore();
    const box = store.create({ name: "Offline Shelf", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const app = buildApp({ config, db, store, media });
    const scan = await app.inject({ method: "POST", url: "/api/manage/candidates/analyze", headers: auth, payload: { boxId: box.id, mimeType: "image/png", imageBase64: Buffer.from("offline-image").toString("base64") } });
    expect(scan.statusCode).toBe(503);
    const activities = (await app.inject({ method: "GET", url: "/api/manage/activities", headers: auth })).json().data;
    expect(activities).toHaveLength(1); expect(activities[0]).toMatchObject({ state: "failed", errorCode: "openai_unavailable", candidates: [] });
    expect((await app.inject({ method: "GET", url: `/api/manage/activities/${activities[0].id}/image`, headers: auth })).statusCode).toBe(200);
    await app.close();
  });

  it("looks up metadata for every book in a full shelf rather than only the first five", async () => {
    const store = new SqliteStore(db), bibliography = new CountingEditions();
    const box = store.create({ name: "Full Shelf", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const app = buildApp({ config, db, store, media: new MemoryMediaStore(), vision: new FullShelfVision(), bibliography });
    const scan = await app.inject({ method: "POST", url: "/api/manage/candidates/analyze", headers: auth, payload: { boxId: box.id, mimeType: "image/jpeg", imageBase64: Buffer.from("full-shelf").toString("base64") } });
    expect(scan.statusCode).toBe(201);
    expect(scan.json().candidates).toHaveLength(7);
    expect(scan.json().candidates.every((candidate: { metadataProposals: unknown[] }) => candidate.metadataProposals.length === 1)).toBe(true);
    expect(bibliography.calls).toBe(7);
    await app.close();
  });

  it("requires an explicit edition choice when recovering metadata for an existing book", async () => {
    const store = new SqliteStore(db);
    const box = store.create({ name: "Recovery Shelf", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const book = store.create({ boxId: box.id, title: "Ocean Atlas", author: "Ada Reader", isbn: null, genre: null, description: null, language: null, condition: "good", visibility: "public", aiProvenance: { provider: "openai" } });
    const app = buildApp({ config, db, store, bibliography: new Editions() });
    expect((await app.inject({ method: "GET", url: `/api/manage/books/${book.id}/metadata-options` })).statusCode).toBe(401);
    const options = await app.inject({ method: "GET", url: `/api/manage/books/${book.id}/metadata-options`, headers: auth });
    const proposal = options.json().data[0];
    expect(proposal.coverUrl).toContain("covers.openlibrary.org");
    expect((await app.inject({ method: "POST", url: `/api/manage/books/${book.id}/metadata-apply`, headers: auth, payload: {} })).statusCode).toBe(400);
    const applied = await app.inject({ method: "POST", url: `/api/manage/books/${book.id}/metadata-apply`, headers: auth, payload: { sourceUrl: proposal.sourceUrl } });
    expect(applied.json()).toMatchObject({ isbn: "9780306406157", coverUrl: proposal.coverUrl, description: "An enriched description.", publicationYear: 2024, metadataProvenance: { provider: "openlibrary", selectedBy: "browser-operator" } });
    await app.close();
  });

  it("validates ISBN-10 and ISBN-13 checksums", () => {
    expect(validIsbn("0-306-40615-2")).toBe(true);
    expect(validIsbn("9780306406157")).toBe(true);
    expect(validIsbn("9780306406158")).toBe(false);
  });
});
