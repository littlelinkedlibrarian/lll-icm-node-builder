# LLL ICM Reference Node

This is the working Phase 1.5B application generated through the repository's Interpretable Context Methodology. It is both an independently branded, own-domain library service and an LLL Central-compatible read node, with a browser UI and an MCP interface for ChatGPT-compatible agents.

The node owns its boxes, books, scan candidates, audit trail, and vectors. Central discovers and reads public data; it does not become the node's database.

## What works

- A responsive branded library UI with local map, catalog, scanner, operator controls, and demo data.
- Browser-based box and book CRUD, including moving books between boxes.
- Seven MCP tools for catalog discovery, maps, photo analysis, review, and confirmed book creation.
- A ChatGPT widget resource that renders box maps, books, and scan candidates.
- Full box and book CRUD behind a local operator bearer token.
- Anonymous LLL Lite 0.1.0-compatible reads for health, boxes, books, and box inventory.
- JPEG/PNG/WebP vision extraction through the OpenAI Responses API and `gpt-5.6-sol`.
- Editable pending candidates; only idempotent human confirmation creates a book.
- `text-embedding-3-small` embeddings stored and searched locally with exact-pinned `sqlite-vec`.
- Deterministic keyword fallback when OpenAI or vector search is unavailable.
- SQLite migrations, integrity checking, safe backup boundary, and recovery tests.

Production login, persistent image storage, HTTPS deployment, live-model evidence, and the Central round trip belong to Phase 1.5C.

## Requirements

- Node.js 24 or newer
- An OpenAI API key only for live vision and semantic embeddings
- No external database

## Run locally

```bash
cp .env.example .env
```

Replace `OPERATOR_TOKEN` in `.env` with a long random value. Export the variables using your preferred process manager or shell, then:

```bash
npm install
npm run check
npm start
```

The default origin is `http://localhost:3000`. SQLite data is created at `./data/lll-node.sqlite`.

Open that origin in a browser, choose **Operator access**, enter the configured token, then choose **Load demo library** for a judge-ready walkthrough.

Without `OPENAI_API_KEY`, manual CRUD, public reads, health, and keyword search still work. Candidate analysis returns an explicit unavailable response instead of inventing data.

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

Search is `GET /api/search?q=ocean&boxId=<optional-uuid>`. Its response reports `semantic`, `keyword`, or `keyword_fallback`.

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

Useful prompts include “show my library boxes,” “search my catalog for ocean books,” and “analyze this book photo for the Garden Gate box.” The write path deliberately separates analysis, editable preparation, and explicit confirmation. Reusing the same idempotency key returns the original confirmed book.

## Own domain and Central

For the current hackathon companion, serve the UI and API on one HTTPS origin:

```text
https://mylittlebox.example/       branded UI
https://mylittlebox.example/api/   compatible API
https://mylittlebox.example/mcp    authenticated agent interface
```

Current Central derives the UI origin from the registered endpoint, so splitting UI and API across domains will break navigation until Central gains explicit `uiUrl` and `apiBaseUrl` fields. Registration is opt-in and disabled by default. Compatibility is not a claim of network membership.

## OpenAI ownership

The OpenAI adapter receives temporary image bytes, asks for strict structured bibliographic fields, and stores only the resulting candidate plus provenance. It never calls a repository. The application service validates the candidate, and a local operator confirms it through the normal book service boundary.

Embeddings are derived from the versioned `book-search-v1` text representation. A canonical book may exist without a vector, and a model outage never rolls back inventory.

## Data and recovery

The database uses foreign keys and WAL. Migrations run at startup. Do not copy a live WAL database with a generic file copy; use the exported `backupDatabase` boundary or stop the process cleanly first. A valid restore must:

1. open through `openDatabase`;
2. pass `integrityCheck`;
3. report health/readiness; and
4. return expected public inventory.

The automated recovery test observes that drill against a copied database.

## Verify

```bash
npm run typecheck
npm test
```

Ordinary tests use deterministic OpenAI fakes but load the real sqlite-vec extension. Live model use is intentionally credential-gated and is not part of CI.

See [the Phase 1.5B application narrative](../../../../docs/PHASE-1.5B-APPLICATION.md) for the architecture, portability contract, implementation decisions, and next steps.
