import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { buildApp } from "../src/http/app.js";

describe("branded browser application", () => {
  let db: DatabaseSync;
  beforeEach(() => { db = openDatabase(":memory:"); });
  afterEach(() => db.close());

  it("serves the own-domain UX and idempotently seeds its canonical store", async () => {
    const store = new SqliteStore(db);
    const app = buildApp({ config: {
      host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Judge Box",
      publicBaseUrl: new URL("https://judge.example"), operatorToken: "secret",
      visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false
    }, db, store });
    const home = await app.inject({ method: "GET", url: "/" });
    expect(home.headers["content-type"]).toContain("text/html");
    expect(home.body).toContain("A library node with a life of its own");
    expect(home.body).toContain("Assorted Things");
    expect(home.body).toContain("Terminal");
    expect(home.body).toContain("Cosmic");
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("looking across the whole image");
    expect(home.body).toContain("One cover or several shelf spines");
    expect(home.body).toContain("capture=\"environment\"");
    expect(home.body).toContain("Take a shelf photo");
    expect(home.body).not.toContain("href=\"#assorted\"");
    expect((await app.inject({ method: "GET", url: "/api/meta" })).json()).toMatchObject({ name: "Judge Box", compatibilityVersion: "0.1.0" });
    expect((await app.inject({ method: "POST", url: "/api/manage/demo/seed", payload: {} })).statusCode).toBe(401);
    const request = { method: "POST" as const, url: "/api/manage/demo/seed", headers: { authorization: "Bearer secret" }, payload: {} };
    expect((await app.inject(request)).json()).toEqual({ boxes: 2, books: 3 });
    expect((await app.inject(request)).json()).toEqual({ boxes: 2, books: 3 });
    const managedBoxes = (await app.inject({ method: "GET", url: "/api/manage/boxes", headers: { authorization: "Bearer secret" } })).json();
    expect(managedBoxes.data).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Happy Box", location: "66 Colon Ave, St. Augustine, FL 32084", latitude: 29.927154, longitude: -81.325848 })]));
    expect((await app.inject({ method: "GET", url: "/api/manage/books", headers: { authorization: "Bearer secret" } })).json()).toMatchObject({ pagination: { total: 3 } });
    await app.close();
  });

  it("protects the MCP endpoint with the separate local management realm", async () => {
    const app = buildApp({ config: {
      host: "127.0.0.1", port: 3000, databasePath: ":memory:", nodeName: "Judge Box",
      publicBaseUrl: new URL("https://judge.example"), operatorToken: "secret",
      visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false
    }, db, store: new SqliteStore(db) });
    expect((await app.inject({ method: "POST", url: "/mcp", payload: {} })).statusCode).toBe(401);
    expect((await app.inject({ method: "OPTIONS", url: "/mcp" })).statusCode).toBe(204);
    await app.close();
  });
});
