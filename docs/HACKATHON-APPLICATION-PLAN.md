# Build Week Application Plan

## Outcome

Demonstrate that GPT-5.6 and Codex can guide a learner through producing a complete, understandable, locally owned library-box application using the ICM stages in this repository.

The submission is `lll-icm-node-builder` plus the working node generated and validated through its stages. LLL Central is a separately operated, compatible companion used to prove discovery and live aggregation. Central is not part of the hackathon submission.

## Demo promise

The judged journey is one continuous loop:

1. Search or browse books and boxes in LLL Central.
2. See the generated node appear as a live remote source.
3. Open the node through its `uiUrl` and arrive at its own branded UX.
4. Create, read, update, and delete library boxes and books.
5. Select a box, upload a book or shelf photo, and use GPT-5.6 to prepare structured book candidates.
6. Review and confirm the candidates into that box.
7. Use OpenAI embeddings stored in a local vector-capable database for semantic search.
8. Return to Central and refresh its live aggregate views.
9. See the changed boxes and books with the node identified as their source.

Central already performs live reads for aggregate books, aggregate boxes, individual remote records, and books in a remote box. The demo uses those aggregate surfaces; Central does not copy or own the node's canonical records.

## Repository roles

| Repository | Hackathon role |
|---|---|
| `lll-icm-node-builder` | Submission, ICM instructions, decisions, working generated app, validation evidence, and judge setup |
| `lll-central` | Separately deployed discovery and aggregate companion used in the demo |
| `lll-lite-standalone` | Historical contract and implementation evidence; not the hackathon app |
| `lll-network-nodes` | Optional registration evidence; not required for judging |

## Scope decisions

- One entry: `lll-icm-node-builder`.
- A working generated application is required; instructions alone are not the outcome.
- Central is compatibility proof, not a second entry.
- Full federation, Istio expansion, hosted-node control plane, and multi-node rank fusion are outside the critical path.
- The node owns its box and book data and remains useful when Central or OpenAI is unavailable.
- Central reads current node data through its compatible API and links to the node UX.
- API and UI use one HTTPS origin so Central derives a reliable `uiUrl`.

## Hackathon technical profile

The reference run produced through ICM uses:

- TypeScript and a responsive branded web UX.
- SQLite for users, boxes, books, scan candidates, audit, and application state.
- Pinned `sqlite-vec` for vector search in the same local database boundary.
- OpenAI Responses API with `gpt-5.6-sol` for image understanding and structured extraction.
- `text-embedding-3-small` at 1,536 dimensions for the lightweight reference run, with model and decision date stored beside every vector.
- An MCP server and ChatGPT widget over the application services.
- OpenAPI as the Central compatibility boundary.
- Docker Compose or one documented local command for judge setup.

`sqlite-vec` adds no second database service and fits this local-sized catalog. Because it is pre-v1, pin its version and test judge platforms. If packaging fails, use PostgreSQL plus pgvector rather than text-serialized vectors.

## Data and AI rules

- GPT-5.6 creates review candidates, never canonical books directly.
- Validate structured output and store model, prompt/schema version, confidence, evidence, image reference, time, and confirming actor.
- Human confirmation selects the box and canonical fields.
- Manual CRUD works during OpenAI outages.
- Embed only confirmed books and regenerate after searchable-field changes.
- Store embedding model, dimensions, representation version, source revision, and time.
- Delete vectors with books.
- Keep Central user, node, application, and OpenAI credentials in separate trust boundaries.

## Phase 1 status

Phase 1 established deployment choices and deterministic Central discovery: ownership, proximity mapping, coordinate policy, privacy, heartbeat freshness, observed health, and credential isolation. It is the compatibility foundation. The remaining hackathon work is application delivery.

## Phase 1.5A: Product contract and local data foundation

### Goal

Freeze behavior before implementation and prove the datastore supports CRUD, reviewed extraction, and vector search.

### Implementation

1. Run ICM discovery and specification for the reference learner story and commit the reviewable decisions.
2. Define the branded box journey and full Central-to-node-to-Central acceptance scenario.
3. Pin the minimal Central-compatible OpenAPI surface:
   - `GET /health`
   - `GET/POST /api/books`
   - `GET/PATCH/DELETE /api/books/{id}`
   - `GET/POST /api/boxes`
   - `GET/PATCH/DELETE /api/boxes/{id}`
   - `GET /api/boxes/{id}/books`
4. Keep scan candidates, confirmation, semantic search, and MCP actions in the product API, outside the Central profile.
5. Specify stable IDs, paging, search, errors, timestamps, and paired coordinate validation.
6. Define SQLite migrations for users, boxes, books, scan candidates, extraction provenance, audit, and idempotency.
7. Define a pinned `sqlite-vec` table keyed to book IDs and embedding dimensions.
8. Define GPT-5.6 structured extraction and OpenAI embedding adapters.
9. Write contract, repository, migration, candidate-state, vector-lifecycle, and outage tests first.

### Exit evidence

- Human-approved specification and acceptance matrix.
- Pinned, externally testable Central profile.
- Clean migration up/down.
- Passing box and book repository CRUD.
- Passing vector insert/query/delete round trip.
- Fixture image produces a valid candidate without creating a book.
- Manual creation works with OpenAI off.

## Phase 1.5B: Working application and ChatGPT capability

Status: IMPLEMENTED locally on `phase/01.5b-working-application`; deployment evidence remains Phase 1.5C.

### Goal

Build the complete node and unique boxes UX, then expose its services safely through ChatGPT.

### Vertical slices

1. **Shell and identity** — brand, navigation, health, configuration, auth, and sample data.
2. **Box CRUD** — create/list/view/edit/delete; coordinate validation; identity, location, visibility, inventory count, and map/list fallback.
3. **Book CRUD** — create/list/view/edit/move/delete; current box inventories and details.
4. **GPT-5.6 scan-to-box** — cover or shelf photo; structured candidates; edit/reject/confirm into a selected box; provenance.
5. **Embeddings and vector search** — embed confirmed books; semantic search with box filters; transactional vector updates; keyword fallback.
6. **MCP and widget**:
   - `list_my_boxes`
   - `show_box_map`
   - `analyze_book_photo`
   - `prepare_book_add`
   - `add_book_to_box`
   - `search_catalog`
   - `get_book`
   - separate reads, previews, and writes
   - accurate impact annotations, current-turn confirmation, and idempotency
7. **Compatibility adapter** — serve the pinned Central endpoints, stable HTTPS origin, and branded `uiUrl` without coupling product or MCP routes to Central.

### Exit evidence

- Box and book CRUD pass through UI and API.
- GPT-5.6 photo extraction creates editable candidates.
- Confirmed books appear in the selected box.
- Semantic search proves an OpenAI vector stored and queried by `sqlite-vec`.
- MCP Inspector and ChatGPT developer-mode cover every tool.
- Retried writes do not duplicate data.
- Manual CRUD and keyword search survive OpenAI outage.
- Product operation survives the Central adapter being disabled.

## Phase 1.5C: Central companion loop and judge readiness

### Goal

Prove compatibility against Central and package a reproducible submission.

### Implementation

1. Deploy the node at one HTTPS origin with UI at root and API under `/api`.
2. Register it in Central with public visibility, valid location, fresh heartbeat, healthy status, API origin, and reviewed operator data.
3. Run provider conformance against the deployed node.
4. Run the browser journey:
   - Central aggregate books or boxes show the node.
   - The result is source-labeled and its modal opens.
   - The branded link opens the node UX.
   - Create or update a box.
   - Scan and confirm books into it.
   - Edit or delete one record to prove full CRUD.
   - Refresh Central aggregate books and boxes.
   - Confirm results reflect current node state.
5. Prove the refresh is a live remote read, not replicated Central data.
6. Seed a judge account, two boxes, ordinary books, and one semantic example.
7. Package the validated generated app in a judge-visible repository path while retaining ICM evidence.
8. Add root setup, environment, OpenAI, seed/reset, MCP, Central companion, test, and judge-account instructions.
9. Add a scripted smoke test and manual demo checklist.
10. Record Codex/GPT-5.6 evidence, model decisions, limits, rollback, license, demo URL, video, and feedback session ID.

### Exit evidence

- Clean clone runs from the README.
- Public app and MCP endpoints use HTTPS.
- Central discovers and live-reads the node.
- The complete loop records in under three minutes.
- Judges test without rebuilding infrastructure.
- No secrets, runtime DB, private images, or personal location are committed.

## Central companion boundary

No additional Central scope is planned unless integration exposes a mismatch. Central only needs to discover an eligible node, query compatible books and boxes, label sources, show remote details, link to the branded UX, re-query after changes, and preserve partial results.

Any integration fix stays in `lll-central` with its own tests and review. It is not copied into the submission or presented as learner-generated application code.

## Three-minute video

- **0:00-0:25** — ICM learner request and reviewed Codex/GPT-5.6 decisions.
- **0:25-0:50** — Central search and generated-node result.
- **0:50-1:25** — Branded boxes UX and box CRUD.
- **1:25-2:05** — GPT-5.6 photo candidates confirmed into the box.
- **2:05-2:25** — OpenAI embedding search through `sqlite-vec`.
- **2:25-2:45** — Central refresh shows current remote books and boxes.
- **2:45-3:00** — Passing evidence and Codex acceleration.

## Implementation order

1. Review Phase 1 without changing deployed Central main.
2. Complete 1.5A and freeze contracts.
3. Build 1.5B as independently tested vertical slices.
4. Begin Central integration as soon as compatible reads exist.
5. Complete 1.5C and freeze features.
6. Use remaining time for reliability, README, demo data, video, and submission.

## Primary implementation references

- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [Apps SDK tool design](https://developers.openai.com/apps-sdk/plan/tools)
- [Apps SDK MCP server and file inputs](https://developers.openai.com/apps-sdk/build/mcp-server)
- [Apps SDK ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui)
- [sqlite-vec documentation](https://alexgarcia.xyz/sqlite-vec/)

## Deferred

- multi-node semantic rank fusion
- raw vector exchange
- Istio mesh expansion
- hosted-node control plane
- generalized federation protocol
- global identity federation
- Central ownership or replication of node records
