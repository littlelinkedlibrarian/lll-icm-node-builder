import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { backupDatabase, integrityCheck, openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";

describe("recovery", () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

  it("backs up and restores canonical data with migrations and vectors intact", async () => {
    const directory = mkdtempSync(join(tmpdir(), "lll-node-"));
    directories.push(directory);
    const source = openDatabase(join(directory, "source.sqlite"));
    const store = new SqliteStore(source);
    const box = store.create({ name: "Recovery Box", description: null, location: null, latitude: null, longitude: null, visibility: "public" });
    const book = store.create({ boxId: box.id, title: "Durable Book", author: "Operator", isbn: null, genre: null, description: null, language: null, condition: null, visibility: "public", aiProvenance: null });
    const vector = Array.from({ length: 1536 }, (_, index) => index === 7 ? 1 : 0);
    store.put(book.id, vector, "book-search-v1", "source", "text-embedding-3-small");
    await backupDatabase(source, join(directory, "backup.sqlite"));
    source.close();

    const restored = openDatabase(join(directory, "backup.sqlite"));
    integrityCheck(restored);
    const restoredStore = new SqliteStore(restored);
    expect(restoredStore.listBooks(1, 20).data[0]?.title).toBe("Durable Book");
    expect(restoredStore.search(vector, 1)[0]?.id).toBe(book.id);
    restored.close();
  });
});
