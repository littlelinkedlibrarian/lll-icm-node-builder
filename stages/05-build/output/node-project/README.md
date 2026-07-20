# LLL ICM Reference Node

This is the working Phase 1.5F application generated through the repository's Interpretable Context Methodology. It is both an independently branded, own-domain library service and an LLL Central-compatible read node, with a browser UI and an MCP interface for ChatGPT-compatible agents.

The node owns its boxes, books, scan candidates, audit trail, and vectors. Central discovers and reads public data; it does not become the node's database.

## What works

- A responsive branded library UI with local map, catalog, destination-first Books or Assorted Things scanner, operator controls, and a Garden/Terminal/Cosmic theme switcher.
- A real Happy Box at `66 Colon Ave, St. Augustine, FL 32084`, represented by an operator-provided box photo. **Prepare real demo** creates or refreshes that box but does not manufacture catalog records.
- Three metadata-stripped, operator-provided shelf photos are bundled as sample inputs. GPT-5.6 proposes the visible books during the walkthrough; only human confirmation creates catalog records.
- One cover or shelf-spine photo produces 1 through 15 book candidates in one review modal; edit only incomplete or incorrect results, then publish the selected books together.
- Box-scoped Assorted Things photos use durable human-only capture and confirm/reject without object recognition or book creation. Confirmed puzzles, note cards, art, and trinkets are zoomable inside their box.
- Dedicated box and book primary controls open associated detail modals; operator edit and delete controls are isolated so one click performs one action.
- Browser-based box and book CRUD, including moving books between boxes. Successful deletion closes stale detail views before refreshing the catalog.
- Ten MCP tools for catalog discovery, maps, photo analysis, review, scan activity history, edition selection, and confirmed book creation.
- A ChatGPT widget resource that renders box maps, books, and scan candidates.
- Full box and book CRUD behind a local operator bearer token.
- Anonymous LLL Lite 0.1.0-compatible reads for health, boxes, books, and box inventory.
- JPEG/PNG/WebP single-cover and multi-spine vision extraction through the OpenAI Responses API and `gpt-5.6-sol`.
- Editable pending candidates; only idempotent human confirmation creates a book.
- `text-embedding-3-small` embeddings stored and searched locally with exact-pinned `sqlite-vec`.
- Deterministic keyword fallback when OpenAI or vector search is unavailable.
- Book scans retain their parent image before AI runs. Protected Activity History groups every candidate and outcome under that zoomable image.
- Valid visible ISBNs are checked; otherwise bounded, concurrency-limited Open Library lookups offer edition choices for every detected book. Nothing is selected automatically. Failed lookups have an explicit retry, and an already-confirmed book can use **Find metadata & cover** to choose and apply an edition later. Confirmed selections persist ISBN, description, language, publication year, cover URL, and source provenance; unmatched books can still be confirmed.
- Catalog cards use the selected cover thumbnail when available and fall back to a colored spine. Provider cover bytes are not mirrored locally yet.
- SQLite migrations, integrity checking, safe backup boundary, and recovery tests.

The reference deployment uses HTTPS through the configured tunnel, durable local SQLite storage, content-addressed book-scan media, and an external backup path. The full Central round trip remains release evidence to capture. Assorted Things originals remain in the local SQLite reference adapter.

## Requirements

- Node.js 24 or newer
- An OpenAI API key only for live vision and semantic embeddings
- No external database
- Optional outbound HTTPS access to Open Library for edition and cover metadata

## Run locally

```bash
cp .env.example .env
```

Replace `OPERATOR_TOKEN` in `.env` with a long random value. Export the variables using your preferred process manager or shell, then:

For a temporary, publicly writable hackathon demonstration, set `PUBLIC_DEMO_OPERATOR=true`. This opens browser management routes without publishing the real token. The MCP endpoint remains token-protected. Disable the flag after judging and restore the demo data from a backup if visitors changed it.

To connect the same temporary demonstration directly from ChatGPT developer mode without OAuth, also set `PUBLIC_DEMO_MCP=true`. This makes every MCP tool—including write tools—publicly callable. Use it only for a time-bounded, backup-protected demo; disable it immediately after judging. Normal deployments should use OAuth 2.1 rather than this flag.

```bash
npm install
npm run check
npm start
```

The default origin is `http://localhost:3000`. SQLite data is created at `./data/lll-node.sqlite`; retained book-scan media is stored under `./data/media`.

Open that origin in a browser, choose **Operator access**, enter the configured token, then choose **Prepare real demo**. The operation is idempotent and creates or refreshes Happy Box at the St. Augustine address without adding books. Under **Use a real shelf photo**, download a bundled sample, upload it to the scanner, review the GPT-5.6 candidates, and explicitly confirm the books you want to publish.

Without `OPENAI_API_KEY`, manual CRUD, public reads, health, keyword search, and Assorted Things capture/review still work. Book candidate analysis returns an explicit unavailable response; Assorted Things behavior is unchanged because it never invokes OpenAI.

## API boundaries

Public LLL-compatible reads:

- `GET /health`
- `GET /api/books`
- `GET /api/books/{id}`
- `GET /api/boxes`
- `GET /api/boxes/{id}`
- `GET /api/boxes/{id}/books`

Local product routes use `/api/manage/*` and require:

```text
Authorization: Bearer <OPERATOR_TOKEN>
```

Protected book-scan history uses `GET /api/manage/activities`, `GET /api/manage/activities/{id}`, and `GET /api/manage/activities/{id}/image`; edition selection uses `POST /api/manage/candidates/{id}/metadata-selection`.

Assorted Things management routes live under `/api/manage/assorted`. Pending and rejected captures remain private. Confirmed items gain own-domain reads at `GET /api/boxes/{id}/assorted` and `GET /api/assorted/{id}/image`; these extensions remain deliberately outside the Central-compatible surface.

Search is `GET /api/search?q=ocean&boxId=<optional-uuid>`. Its response reports `semantic`, `keyword`, or `keyword_fallback`. Semantic mode embeds confirmed title, author, genre, description, and language metadata plus the query in the same OpenAI vector space, so a query may be written in another language. The application test matrix includes Spanish, Simplified Chinese, Italian, and French queries; model-quality relevance still requires a live evaluation. The node does not translate or duplicate catalog metadata; keyword fallback remains same-text matching.

The complete contract is [contracts/openapi.yaml](contracts/openapi.yaml).

## ChatGPT and MCP Inspector

The authenticated Streamable HTTP MCP endpoint is:

```text
http://localhost:3000/mcp
```

Inspect it locally with:

```bash
npx mcp-inspector \
  --transport http \
  --server-url http://localhost:3000/mcp \
  --header "Authorization: Bearer $OPERATOR_TOKEN"
```

Useful prompts include “show my library boxes,” “search my catalog for ocean books,” and “analyze this shelf photo for the Garden Gate box.” The write path deliberately separates analysis, editable preparation, and explicit confirmation. Reusing the same idempotency key returns the original confirmed book.

## Own domain and Central

For the current hackathon companion, serve the UI and API on one HTTPS origin:

```text
https://happybox.littlelinkedlibrarian.com/       branded UI
https://happybox.littlelinkedlibrarian.com/api/   compatible API
https://happybox.littlelinkedlibrarian.com/mcp    authenticated agent interface
```

Current Central derives the UI origin from the registered endpoint, so splitting UI and API across domains will break navigation until Central gains explicit `uiUrl` and `apiBaseUrl` fields. Registration is opt-in and disabled by default. When approved, set `DISCOVERY_ENABLED=true` plus the four `CENTRAL_*` values shown in `.env.example`; the app sends a bounded startup heartbeat and repeats it on the configured interval. Heartbeat failure is logged and never disables local operation. The single-purpose node key is distinct from both the local operator token and any Central user credential. Compatibility is not a claim of network membership.

## OpenAI ownership

The OpenAI adapter is limited to the book scanner. Book and shelf bytes are saved before model extraction and produce a bounded array of editable bibliographic candidates with shared batch provenance. Open Library receives only visible ISBN or extracted title, author, and optional language—not the uploaded image. Enrichment covers every complete candidate with at most three concurrent lookups, one transient retry, a 24-hour process cache, and an explicit per-book retry; it never blocks human review. Assorted Things never calls OpenAI: it stores a local photo for human description and confirmation. The adapter never writes repositories directly; application services validate book proposals and a local operator controls every canonical transition.

Embeddings are derived from the versioned `book-search-v1` text representation. A canonical book may exist without a vector, and a model outage never rolls back inventory.

## Data and recovery

The database uses foreign keys and WAL. Assorted Things originals are stored as bounded BLOBs in migration 002. Book-scan originals are content-addressed files referenced by migration 003, so SQLite and `data/media` form one consistency boundary. Include both in size planning, backups, restores, exports, and deletion policy. Migrations run at startup. Do not copy a live WAL database with a generic file copy; use the exported `backupDatabase` boundary or stop the process cleanly first. A valid restore must:

1. open through `openDatabase`;
2. pass `integrityCheck`;
3. report health/readiness; and
4. return expected public inventory.

The automated recovery test observes the SQLite drill against a copied database. The host backup script creates a matching SQLite backup and media archive with the same timestamp; restore that pair together.

## Verify

```bash
npm run typecheck
npm test
```

Ordinary tests use deterministic OpenAI fakes but load the real sqlite-vec extension. Live model use is intentionally credential-gated and is not part of CI.

See [the Phase 1.5B application narrative](../../../../docs/PHASE-1.5B-APPLICATION.md) for the architecture, portability contract, implementation decisions, and next steps.
