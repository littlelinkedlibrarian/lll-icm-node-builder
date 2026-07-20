import { MemoryMediaStore } from "../adapters/media.js";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { CandidateService, SearchService, candidateFields } from "../application/services.js";
import type { Book, CandidateFields } from "../domain/model.js";
import { SqliteStore } from "../db/store.js";
import type { BibliographicProvider, Embedder, MediaStore, VisionExtractor } from "../ports/index.js";

const TEMPLATE_URI = "ui://little-green-library/catalog-v1.html";
const annotations = {
  read: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  write: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
} as const;
const candidateShape = {
  title: z.string().min(1), author: z.string().min(1), isbn: z.string().nullable(), genre: z.string().nullable(),
  description: z.string().nullable(), language: z.string().nullable(), condition: z.string().nullable()
};
const imageFile = z.object({ download_url: z.string().url(), file_id: z.string(), mime_type: z.string().optional(), file_name: z.string().optional() });

export interface McpDependencies {
  store: SqliteStore;
  vision?: VisionExtractor;
  embedder?: Embedder;
  media?: MediaStore;
  bibliography?: BibliographicProvider;
  publicBaseUrl: URL;
}

function conciseBook(book: Book, store: SqliteStore) {
  return { id: book.id, boxId: book.boxId, boxName: store.getBox(book.boxId)?.name ?? null, title: book.title, author: book.author, genre: book.genre, description: book.description };
}

async function downloadImage(reference: z.infer<typeof imageFile>): Promise<{ mimeType: string; bytes: Uint8Array }> {
  const url = new URL(reference.download_url);
  if (url.protocol !== "https:") throw new Error("The ChatGPT file URL must use HTTPS");
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "follow" });
  if (!response.ok) throw new Error("The temporary ChatGPT image could not be downloaded");
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > 10 * 1024 * 1024) throw new Error("The image is larger than 10 MiB");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("The image must be 1 byte through 10 MiB");
  return { mimeType: reference.mime_type ?? response.headers.get("content-type") ?? "application/octet-stream", bytes };
}

export function createMcpServer(deps: McpDependencies): McpServer {
  const server = new McpServer({ name: "little-green-library", version: "0.1.0" }, {
    instructions: "Read before writing. A photo creates one or more pending candidates only. Review each candidate independently. Call prepare_book_add with reviewed fields, then call add_book_to_box only after the user explicitly confirms the candidate and destination box in the current turn. Reuse idempotency keys on retries."
  });
  const candidates = new CandidateService(deps.store, deps.vision, deps.media || new MemoryMediaStore(), deps.bibliography);
  const search = new SearchService(deps.store, deps.store, deps.embedder);
  const widget = readFileSync(new URL("../../public/chatgpt-widget.html", import.meta.url), "utf8");

  registerAppResource(server, "Little Green Library catalog", TEMPLATE_URI, { description: "Compact box, map, candidate, and catalog view." }, async () => ({
    contents: [{ uri: TEMPLATE_URI, mimeType: RESOURCE_MIME_TYPE, text: widget, _meta: { ui: { prefersBorder: true, domain: deps.publicBaseUrl.origin, csp: { connectDomains: [deps.publicBaseUrl.origin], resourceDomains: [] } } } }]
  }));

  server.registerTool("list_my_boxes", {
    title: "List my library boxes", description: "Use this when the user wants to see the boxes owned by this node before choosing a destination.",
    inputSchema: {}, outputSchema: { boxes: z.array(z.object({ id: z.string(), name: z.string(), location: z.string().nullable(), latitude: z.number().nullable(), longitude: z.number().nullable(), bookCount: z.number() })) }, annotations: annotations.read
  }, async () => {
    const boxes = deps.store.listBoxes(1, 50).data.map(box => ({
      id: box.id,
      name: box.name,
      location: box.location,
      latitude: box.latitude,
      longitude: box.longitude,
      bookCount: deps.store.listBooks(1, 1, box.id).total
    }));
    return { structuredContent: { boxes }, content: [{ type: "text", text: `Found ${boxes.length} library boxes.` }] };
  });

  registerAppTool(server, "show_box_map", {
    title: "Show library box map", description: "Use this to render the user's already-fetched library boxes as a compact coordinate map and list.",
    inputSchema: { boxIds: z.array(z.string()).optional() }, outputSchema: { boxes: z.array(z.any()), renderMap: z.boolean() }, annotations: annotations.read,
    _meta: { ui: { resourceUri: TEMPLATE_URI }, "openai/toolInvocation/invoking": "Mapping boxes…", "openai/toolInvocation/invoked": "Boxes mapped." }
  }, async ({ boxIds }) => {
    const selected = deps.store.listBoxes(1, 50).data.filter(box => !boxIds?.length || boxIds.includes(box.id));
    const boxes = selected.map(box => ({ ...box, bookCount: deps.store.listBooks(1, 1, box.id).total }));
    return { structuredContent: { boxes, renderMap: true }, content: [{ type: "text", text: `Showing ${boxes.length} boxes. Coordinates come from the local node.` }] };
  });

  server.registerTool("search_catalog", {
    title: "Search the local book catalog", description: "Use this when the user describes a book, subject, author, or reading interest. Semantic search degrades to local keyword search.",
    inputSchema: { query: z.string().min(1), boxId: z.string().optional() }, outputSchema: { books: z.array(z.any()), mode: z.enum(["semantic", "keyword", "keyword_fallback"]) }, annotations: annotations.read
  }, async ({ query, boxId }) => {
    const result = await search.search(query, boxId); const books = result.data.map(book => conciseBook(book, deps.store));
    return { structuredContent: { books, mode: result.mode }, content: [{ type: "text", text: `Found ${books.length} books using ${result.mode.replaceAll("_", " ")}.` }] };
  });

  server.registerTool("get_book", {
    title: "Get one book", description: "Use this after a search when the user wants the current canonical details for one book ID.",
    inputSchema: { bookId: z.string() }, outputSchema: { book: z.any() }, annotations: annotations.read
  }, async ({ bookId }) => {
    const book = deps.store.getBook(bookId); if (!book) throw new Error("Book not found");
    return { structuredContent: { book: conciseBook(book, deps.store) }, content: [{ type: "text", text: `${book.title} by ${book.author}.` }] };
  });

  server.registerTool("list_scan_activities", {
    title: "List private scan activity", description: "Use this when the operator wants to revisit uploaded shelf photos and their result states.",
    inputSchema: { boxId: z.string().optional(), limit: z.number().int().min(1).max(50).optional() }, outputSchema: { activities: z.array(z.any()) }, annotations: annotations.read
  }, async ({ boxId, limit }) => {
    const activities = deps.store.listActivities(boxId, limit ?? 20).map(activity => ({ ...activity, candidateCount: deps.store.listActivityCandidates(activity.id).length, imageUrl: new URL("/api/manage/activities/" + activity.id + "/image", deps.publicBaseUrl).href }));
    return { structuredContent: { activities }, content: [{ type: "text", text: `Found ${activities.length} private scan activities.` }] };
  });

  server.registerTool("get_scan_activity", {
    title: "Get scan activity details", description: "Returns one private parent scan with every candidate, metadata proposal, and processing event.",
    inputSchema: { activityId: z.string() }, outputSchema: { activity: z.any(), candidates: z.array(z.any()), events: z.array(z.any()), imageUrl: z.string() }, annotations: annotations.read
  }, async ({ activityId }) => {
    const activity = deps.store.getActivity(activityId); if (!activity) throw new Error("Scan activity not found");
    const candidates = deps.store.listActivityCandidates(activityId), events = deps.store.listActivityEvents(activityId), imageUrl = new URL("/api/manage/activities/" + activityId + "/image", deps.publicBaseUrl).href;
    return { structuredContent: { activity, candidates, events, imageUrl }, content: [{ type: "text", text: `This image produced ${candidates.length} results; ${candidates.filter(item => item.state === "confirmed").length} are confirmed.` }] };
  });

  server.registerTool("select_book_edition", {
    title: "Select edition metadata", description: "Select one bibliographic proposal, or clear it, before final book confirmation. This never creates a book.",
    inputSchema: { candidateId: z.string(), proposalId: z.string().nullable() }, outputSchema: { candidate: z.any(), selected: z.any().nullable() }, annotations: annotations.write
  }, async ({ candidateId, proposalId }) => {
    if (!deps.store.getCandidate(candidateId)) throw new Error("Candidate not found");
    const selected = deps.store.selectMetadataProposal(candidateId, proposalId);
    return { structuredContent: { candidate: deps.store.getCandidate(candidateId), selected }, content: [{ type: "text", text: selected ? `Selected edition metadata from ${selected.provider}. Ask for final confirmation before adding the book.` : "Cleared the edition selection. The book can still be confirmed without an ISBN." }] };
  });

  server.registerTool("analyze_book_photo", {
    title: "Analyze a book or shelf photo", description: "Use this when the user supplies one cover or several shelf spines and has selected a destination box. This creates editable pending candidates, never books.",
    inputSchema: { boxId: z.string(), image: imageFile }, outputSchema: { batch: z.any() }, annotations: { ...annotations.write, openWorldHint: true },
    _meta: { "openai/fileParams": ["image"], "openai/toolInvocation/invoking": "Reading visible books…", "openai/toolInvocation/invoked": "Candidates ready for review." }
  }, async ({ boxId, image }) => {
    const downloaded = await downloadImage(image);
    const batch = await candidates.analyze(boxId, downloaded.mimeType, downloaded.bytes);
    return { structuredContent: { batch }, content: [{ type: "text", text: "Prepared " + batch.candidates.length + " pending book candidate" + (batch.candidates.length === 1 ? "" : "s") + ". Ask the user to review every candidate; no books have been added." }] };
  });

  server.registerTool("prepare_book_add", {
    title: "Prepare a reviewed book addition", description: "Use this to save the user's corrections to a pending candidate before asking for final confirmation. It does not add a book.",
    inputSchema: { candidateId: z.string(), fields: z.object(candidateShape) }, outputSchema: { candidate: z.any(), requiresConfirmation: z.boolean() }, annotations: annotations.write
  }, async ({ candidateId, fields }) => {
    const candidate = deps.store.updateFields(candidateId, candidateFields(fields, true)); if (!candidate) throw new Error("Only a pending candidate can be prepared");
    return { structuredContent: { candidate, requiresConfirmation: true }, content: [{ type: "text", text: `Prepared “${candidate.fields.title}” for ${deps.store.getBox(candidate.boxId)?.name ?? "the selected box"}. Ask for explicit confirmation before adding it.` }] };
  });

  server.registerTool("add_book_to_box", {
    title: "Add the confirmed book to its box", description: "Call only after the user explicitly confirms the reviewed candidate and destination box in the current turn. Retrying with the same idempotency key returns the original book.",
    inputSchema: { candidateId: z.string(), confirmed: z.literal(true), idempotencyKey: z.string().min(8) }, outputSchema: { book: z.any(), candidateId: z.string(), confirmed: z.boolean() }, annotations: annotations.write,
    _meta: { "openai/toolInvocation/invoking": "Adding the confirmed book…", "openai/toolInvocation/invoked": "Book added." }
  }, async ({ candidateId, idempotencyKey }) => {
    const reviewed = deps.store.getCandidate(candidateId); if (reviewed) candidateFields(reviewed.fields, true);
    const result = deps.store.confirm(candidateId, "chatgpt-operator", idempotencyKey); try { await search.index(result.book); } catch { /* keyword fallback remains available */ }
    return { structuredContent: { book: conciseBook(result.book, deps.store), candidateId, confirmed: true }, content: [{ type: "text", text: `Added “${result.book.title}” to ${deps.store.getBox(result.book.boxId)?.name ?? "the selected box"}.` }] };
  });
  return server;
}

export async function handleMcpRequest(req: IncomingMessage, res: ServerResponse, body: unknown, deps: McpDependencies): Promise<void> {
  const server = createMcpServer(deps);
  const transport = new StreamableHTTPServerTransport();
  await server.connect(transport as unknown as Parameters<McpServer["connect"]>[0]);
  try { await transport.handleRequest(req, res, body); } finally { await server.close(); }
}
