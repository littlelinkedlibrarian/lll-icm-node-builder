# Phase 1.5B: The Working Application

Status: IMPLEMENTED
Date: 2026-07-18
Branch: `phase/01.5b-working-application`

## What we built

Phase 1.5B turns the Phase 1.5A service foundation into the hackathon application: an independently branded little-library node with a browser experience and a ChatGPT/MCP Apps experience over the same canonical data.

The own-domain browser application now provides:

- a responsive branded home page and navigation shell;
- public box cards, inventory counts, catalog browsing, and health status;
- a local coordinate map with a list fallback and no third-party map data transfer;
- local operator access that remains separate from Central credentials;
- box create, read, update, and delete controls;
- book create, read, update, move, and delete controls;
- idempotent judge/demo fixtures;
- cover upload into a GPT-5.6 Sol extraction candidate;
- editable candidate review, rejection, and explicit confirmation;
- semantic catalog search through OpenAI embeddings and local `sqlite-vec`;
- visible keyword/fallback behavior when OpenAI or vector search is unavailable; and
- the same-origin `/` UI plus `/api` compatibility shape required by current Central navigation.

The conversational application now provides:

- an authenticated MCP Streamable HTTP endpoint at `/mcp`;
- a versioned `text/html;profile=mcp-app` widget resource;
- structured results suitable for both model reasoning and widget rendering;
- explicit tool impact annotations;
- a ChatGPT file parameter for temporary cover-image references;
- separate read, preview, and final-write operations; and
- an explicit-confirmation and idempotency boundary for adding a book.

## MCP tool surface

| Tool | Job | Impact |
|---|---|---|
| `list_my_boxes` | Return canonical box IDs and inventory counts before selection | Read-only |
| `show_box_map` | Render selected boxes in the portable MCP Apps widget | Read-only |
| `search_catalog` | Search semantically and degrade to keyword results | Read-only |
| `get_book` | Fetch one current canonical book | Read-only |
| `analyze_book_photo` | Download the current temporary ChatGPT file and create a pending candidate | Bounded write plus declared external file read |
| `prepare_book_add` | Save reviewed corrections without creating a book | Bounded, reversible write |
| `add_book_to_box` | Confirm one reviewed candidate using a retry-safe key | Bounded write requiring current-turn confirmation |

The final tool requires `confirmed: true` and an `idempotencyKey`. Its description and server instructions tell the model to call it only after explicit confirmation of the reviewed fields and destination box in the current turn.

## How we got here

The project began as a centralized Little Linked Librarian application. That version proved the core community story—boxes, books, scanning, and discovery—but the application and the network were too tightly identified with Central.

The standalone experiments then proved that a node could own its own database and expose an API. The historical OpenAPI contract captured useful interoperability evidence, but it did not yet provide a complete learning method, clear service ownership, a safe AI candidate workflow, or a polished independently useful product.

The ICM node builder reorganized that work into an interpretable sequence:

1. Discovery fixed the learner, operator, ownership, privacy, and demo journey.
2. Specification separated own-domain product behavior from the narrow Central read profile.
3. Architecture chose replaceable ports for HTTP, persistence, vectors, OpenAI, discovery, and MCP.
4. Scaffolding generated contracts and boundaries before feature code.
5. Phase 1.5A implemented and tested the canonical service/data foundation.
6. Phase 1.5B added two clients—the browser and ChatGPT—without making either client the owner of product rules.

This sequence matters because the hackathon story is not “we added AI to an old app.” It is “Codex and GPT-5.6 helped turn a centralized prototype into an understandable, locally owned application that can still participate in a compatible catalog.”

## Why the application has these boundaries

- The node is useful on its own because a learner should not need Central to own or operate their project.
- Central performs live compatible reads because aggregation should not silently become data ownership or replication.
- GPT-5.6 produces candidates because model output is evidence to review, not permission to mutate inventory.
- Embeddings are derived from confirmed books because vectors are an index, never the canonical record.
- Browser, MCP, and Central adapters are separate because each has different users, credentials, and public exposure.
- The map is local and dependency-free because publishing coordinates should not automatically disclose them to another vendor.
- SQLite plus sqlite-vec is the reference because it is easy to run and inspect, not because the method requires SQLite.

## Portable template claim

The ICM repository is technology-neutral; the checked-in reference run is TypeScript. A future agent can implement the same approved artifacts with almost any language or framework that can provide HTTP, validate schemas, manage transactions, call OpenAI, and implement MCP when selected.

The portable contracts are:

- the approved discovery brief and acceptance matrix;
- the node-owned OpenAPI document;
- the domain invariants and error vocabulary;
- repository and external-adapter responsibilities;
- the reviewed-candidate state machine;
- the versioned embedding representation;
- the MCP tool names, schemas, annotations, confirmation rules, and outputs; and
- external conformance and degraded-mode tests.

The generated UI may therefore be React, Vue, Svelte, Angular, Flutter Web, server-rendered templates, native mobile, or vanilla browser code. The API may be TypeScript, Python, Go, Java, Kotlin, C#, Rust, Ruby, PHP, or another environment with suitable web and OpenAI libraries. Persistence may be SQLite, PostgreSQL/pgvector, MySQL plus a vector layer, SQL Server, MongoDB with vector search, a cloud document database, or another durable store—provided its adapter proves the approved transactions, filtering, deletion, migration, backup, privacy, and vector behavior.

“Almost any” is deliberately not “anything without evidence.” A datastore without native vector support can still build the core application, but semantic search must either be omitted through the questionnaire or supplied through a separately owned vector adapter. A runtime without a maintained MCP implementation can still build the browser and OpenAPI application, but it cannot claim the ChatGPT capability until its MCP conformance tests pass.

## What an application generated from this template can do

At the complete reference level, it can:

- own and operate a branded domain independently;
- manage geographically described library boxes and their inventories;
- manage books through full CRUD and moves between boxes;
- accept manual entry when AI is disabled;
- use an OpenAI vision model to prepare editable records from images;
- preserve model, schema, timing, and confirmation provenance;
- embed approved records and perform filtered semantic search;
- degrade to local keyword search;
- expose safe conversational reads, previews, and confirmed writes through MCP Apps;
- publish a narrow anonymous compatibility API;
- appear in Central as a live source without surrendering canonical data;
- preserve private records outside public aggregation;
- migrate, back up, restore, export, and delete its local data; and
- replace its UI, API framework, datastore, OpenAI adapter, vector engine, identity provider, hosting, or Central connection independently.

## Remaining Phase 1.5C work

1. Deploy this branch at one stable HTTPS origin.
2. Replace the demo operator token with the selected production identity boundary.
3. Run MCP Inspector and ChatGPT developer-mode against the public `/mcp` endpoint.
4. Exercise a real GPT-5.6 image and a real OpenAI embedding with hackathon credentials.
5. Register the deployed node with the Central companion.
6. Record Central → node → CRUD/scan/search → Central refresh.
7. Add a scripted deployed smoke test, rollback drill, judge instructions, demo video, and submission evidence.
