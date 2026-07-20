import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { openDatabase } from "../src/db/database.js";
import { SqliteStore } from "../src/db/store.js";
import { buildApp } from "../src/http/app.js";
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
      "list_my_boxes", "show_box_map", "search_catalog", "get_book", "list_scan_activities", "get_scan_activity", "select_book_edition", "analyze_book_photo", "prepare_book_add", "add_book_to_box"
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

  it("serves declared box output over the deployed Streamable HTTP boundary", async () => {
    const store = new SqliteStore(db);
    const box = store.create({ name: "Strict Box", description: "Not part of the MCP output", location: "Park", latitude: 0, longitude: 0, visibility: "public" });
    const app = buildApp({ config: {
      host: "127.0.0.1", port: 0, databasePath: ":memory:", nodeName: "Strict MCP",
      publicBaseUrl: new URL("https://box.example"), operatorToken: "secret",
      visionModel: "gpt-5.6-sol", embeddingModel: "text-embedding-3-small", discoveryEnabled: false
    }, db, store });
    const origin = await app.listen({ host: "127.0.0.1", port: 0 });
    const client = new Client({ name: "http-test-client", version: "1.0.0" }, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(new URL("/mcp", origin), { requestInit: { headers: { authorization: "Bearer secret" } } });
    try {
      await client.connect(transport as unknown as Parameters<Client["connect"]>[0]);
      const listed = await client.callTool({ name: "list_my_boxes", arguments: {} });
      const boxes = (listed.structuredContent as { boxes: Array<Record<string, unknown>> }).boxes;
      expect(boxes).toEqual([{ id: box.id, name: "Strict Box", location: "Park", latitude: 0, longitude: 0, bookCount: 0 }]);
      expect(Object.keys(boxes[0]!).sort()).toEqual(["bookCount", "id", "latitude", "location", "longitude", "name"]);
    } finally {
      await client.close().catch(() => undefined);
      await app.close();
    }
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
