import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { buildApp } from "../src/http/app.js";

const config = { host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Happy Box", publicBaseUrl: new URL("https://happybox.littlelinkedlibrarian.com"), operatorToken: "secret", visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false };
const auth = { authorization: "Bearer secret" };

describe("Assorted Things capture history", () => {
  let db: DatabaseSync;
  beforeEach(() => { db = openDatabase(":memory:"); });
  afterEach(() => db.close());

  it("saves immediately for human review, protects the image, and never creates a book", async () => {
    const store = new SqliteStore(db); const box = store.create({ name: "Happy Box", description: null, location: "66 Colon Ave, St. Augustine, FL 32084", latitude: 29.927154, longitude: -81.325848, visibility: "public" });
    const app = buildApp({ config, db, store });
    const created = await app.inject({ method: "POST", url: "/api/manage/assorted/capture", headers: auth, payload: { boxId: box.id, mimeType: "image/png", imageBase64: Buffer.from("not-a-real-png").toString("base64"), note: "Needs a neighbor review" } });
    expect(created.statusCode).toBe(201); const capture = created.json();
    expect(capture).toMatchObject({ boxId: box.id, state: "pending_review", aiProcessed: false, fields: { title: "Unidentified item", description: "Needs a neighbor review" } });
    expect((await app.inject({ method: "GET", url: "/api/manage/assorted/" + capture.id + "/image" })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/api/assorted/" + capture.id + "/image" })).statusCode).toBe(404);
    const image = await app.inject({ method: "GET", url: "/api/manage/assorted/" + capture.id + "/image", headers: auth }); expect(image.statusCode).toBe(200); expect(image.rawPayload.equals(Buffer.from("not-a-real-png"))).toBe(true);
    expect((await app.inject({ method: "GET", url: "/api/manage/assorted", headers: auth })).json().data).toHaveLength(1);
    expect((await app.inject({ method: "GET", url: "/api/books" })).json().pagination.total).toBe(0);
    expect((await app.inject({ method: "DELETE", url: "/api/manage/boxes/" + box.id, headers: auth })).statusCode).toBe(409);
    const fields = { ...capture.fields, title: "Neighbor-reviewed object", category: "community supply" };
    expect((await app.inject({ method: "PATCH", url: "/api/manage/assorted/" + capture.id, headers: auth, payload: fields })).statusCode).toBe(200);
    const confirm = { method: "POST" as const, url: "/api/manage/assorted/" + capture.id + "/confirm", headers: auth, payload: { actor: "test-operator", idempotencyKey: "confirm-1" } };
    expect((await app.inject(confirm)).json()).toMatchObject({ state: "confirmed", actor: "test-operator" }); expect((await app.inject(confirm)).json()).toMatchObject({ state: "confirmed" });
    expect((await app.inject({ method: "GET", url: "/api/boxes/" + box.id + "/assorted" })).json().data).toEqual([expect.objectContaining({ id: capture.id, imageUrl: "/api/assorted/" + capture.id + "/image" })]);
    expect((await app.inject({ method: "GET", url: "/api/assorted/" + capture.id + "/image" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/api/books" })).json().pagination.total).toBe(0); await app.close();
  });

});
