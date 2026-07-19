import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { createMcpServer } from "../src/mcp/server.js";

describe("MCP Apps adapter", () => {
  let db: DatabaseSync;
  beforeEach(() => { db = openDatabase(":memory:"); });
  afterEach(() => db.close());

  async function connected(store: SqliteStore) {
    const server = createMcpServer({ store, publicBaseUrl: new URL("https://box.example") });
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return { server, client };
  }

  it("publishes one-job tools with explicit impact annotations and a portable widget", async () => {
    const store = new SqliteStore(db); const { server, client } = await connected(store);
    const tools = await client.listTools();
    expect(tools.tools.map(tool => tool.name)).toEqual([
      "list_my_boxes", "show_box_map", "search_catalog", "get_book", "analyze_book_photo", "prepare_book_add", "add_book_to_box"
    ]);
    for (const tool of tools.tools) {
      expect(tool.annotations?.readOnlyHint).toBeTypeOf("boolean");
      expect(tool.annotations?.openWorldHint).toBeTypeOf("boolean");
      expect(tool.annotations?.destructiveHint).toBeTypeOf("boolean");
    }
    const resource = await client.readResource({ uri: "ui://little-green-library/catalog-v1.html" });
    const content = resource.contents[0]!;
    expect(content.mimeType).toBe("text/html;profile=mcp-app");
    expect("text" in content ? content.text : "").toContain("ui/notifications/tool-result");
    await client.close(); await server.close();
  });

  it("reads, prepares, and idempotently confirms through canonical application data", async () => {
    const store = new SqliteStore(db);
    const box = store.create({ name: "Chat Box", description: null, location: "Park", latitude: 0, longitude: 0, visibility: "public" });
    const candidate = store.createCandidate(box.id, { title: "Draft", author: "Reader", isbn: null, genre: null, description: null, language: null, condition: null }, { provider: "fixture" });
    const { server, client } = await connected(store);
    const listed = await client.callTool({ name: "list_my_boxes", arguments: {} });
    expect(listed.structuredContent).toMatchObject({ boxes: [{ id: box.id, bookCount: 0 }] });
    const prepared = await client.callTool({ name: "prepare_book_add", arguments: { candidateId: candidate.id, fields: { ...candidate.fields, title: "Reviewed" } } });
    expect(prepared.structuredContent).toMatchObject({ candidate: { fields: { title: "Reviewed" } }, requiresConfirmation: true });
    const args = { candidateId: candidate.id, confirmed: true, idempotencyKey: "chat-retry-1" };
    const first = await client.callTool({ name: "add_book_to_box", arguments: args });
    const second = await client.callTool({ name: "add_book_to_box", arguments: args });
    expect((first.structuredContent as { book: { id: string } }).book.id).toBe((second.structuredContent as { book: { id: string } }).book.id);
    expect(store.listBooks(1, 20).total).toBe(1);
    await client.close(); await server.close();
  });
});
