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
    expect(home.body).toContain("candidate-batch-dialog");
    expect(home.body).toContain("activity-history");
    expect(home.body).toContain("activity-dialog");
    expect(home.body).toContain("book-details-dialog");
    expect(home.body).toContain("book-detail-actions");
    expect(home.body).toContain("box-detail-actions");
    expect(home.body).toContain("scan-selection");
    expect(home.body).toContain("assorted-selection");
    expect(home.body).toContain("operator-logout");
    expect(home.body).toContain("Guests can browse public boxes, book details, search, maps, and confirmed Assorted Things");
    expect(home.body).toContain("Private scan evidence");
    expect(home.body).toContain("Add selected books");
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("metadata-selection");
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("setActivityZoom");
    const browserScript = (await app.inject({ method: "GET", url: "/assets/app.js" })).body;
    expect(browserScript).toContain("openBookDetails");
    expect(browserScript).toContain("makeOperatorAction");
    expect(browserScript).toContain("async function deleteBook");
    expect(browserScript).toContain("Photo saved safely");
    expect(browserScript).toContain("metadata-options");
    expect(browserScript).toContain("Retry metadata & covers");
    expect(home.body).toContain("Find metadata &amp; cover");
    expect(browserScript).toContain(`closeDialogIfOpen("book-details-dialog")`);
    expect(browserScript).toContain(`const target = event.target.closest("button")`);
    expect(browserScript).toContain(`openDialog("activity-dialog")`);
    expect(browserScript).toContain(`openDialog("book-details-dialog")`);
    expect(browserScript).not.toContain(`closest("button,[data-open-box]`);
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("1 image selected");
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("Saved — opening human review");
    expect((await app.inject({ method: "GET", url: "/assets/app.js" })).body).toContain("Logged out — public browsing remains available");
    expect(home.body).toContain("Save photo for human review");
    expect(home.body).toContain("data-scan-kind=\"books\"");
    expect(home.body).toContain("data-scan-kind=\"assorted\"");
    expect(home.body).toContain("capture=\"environment\"");
    expect(home.body).toContain("Take a shelf photo");
    expect(home.body).toContain("Prepare real demo");
    expect(home.body).toContain("/demo/shelf-mixed-catalog.jpg");
    const browserStyles = (await app.inject({ method: "GET", url: "/assets/styles.css" })).body;
    expect(browserStyles).toContain(".view-switch button.active");
    expect(browserStyles).toContain(".box-card-primary");
    expect(browserStyles).toContain(".dialog-close{background:#b42318!important");
    expect(browserStyles).toContain(".box-card-art.has-photo:before{content:none}");
    expect(browserStyles).toContain(".book-card-primary");
    expect((await app.inject({ method: "GET", url: "/assets/styles.css" })).body).toContain("background:#1d4ed8!important");
    expect(home.body).not.toContain("href=\"#assorted\"");
    expect((await app.inject({ method: "GET", url: "/api/meta" })).json()).toMatchObject({ name: "Judge Box", compatibilityVersion: "0.1.0" });
    expect((await app.inject({ method: "POST", url: "/api/manage/demo/seed", payload: {} })).statusCode).toBe(401);
    const request = { method: "POST" as const, url: "/api/manage/demo/seed", headers: { authorization: "Bearer secret" }, payload: {} };
    expect((await app.inject(request)).json()).toEqual({ boxes: 1, books: 0 });
    expect((await app.inject(request)).json()).toEqual({ boxes: 1, books: 0 });
    const managedBoxes = (await app.inject({ method: "GET", url: "/api/manage/boxes", headers: { authorization: "Bearer secret" } })).json();
    expect(managedBoxes.data).toEqual([expect.objectContaining({ name: "Happy Box", location: "66 Colon Ave, St. Augustine, FL 32084", latitude: 29.927154, longitude: -81.325848 })]);
    expect(store.listBooks(1, 50).total).toBe(0);
    for (const name of ["happy-box-outdoor.jpg", "shelf-mixed-catalog.jpg", "shelf-math-science.jpg", "shelf-thinking.jpg"]) {
      const photo = await app.inject({ method: "GET", url: "/demo/" + name });
      expect(photo.statusCode).toBe(200);
      expect(photo.headers["content-type"]).toContain("image/jpeg");
      expect(photo.rawPayload.byteLength).toBeGreaterThan(1_000);
    }
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
