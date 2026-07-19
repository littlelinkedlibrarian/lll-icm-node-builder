# Hackathon reference node brief

Status: APPROVED
Decision date: 2026-07-18
Approval evidence: the project owner approved the application-focused plan and directed implementation of Phase 1.5A.

## Audience and problem

The primary audience is a learner or community library-box steward who wants to create and operate a recognizable local library application without surrendering ownership of its code, data, domain, or UX.

The first journey begins in LLL Central, where a remote book or box result identifies this node. The user follows the node link into its branded interface, manages boxes and books, scans a cover or shelf with GPT-5.6, confirms extracted candidates into a selected box, searches the local catalog semantically, and returns to Central to observe a fresh compatible read.

## Learner and agent relationship

- Mode: agent-led complete build with human review.
- Agent: contracts, architecture, scaffold, implementation, tests, documentation, and evidence.
- Learner: product decisions, brand and domain approval, credentials, deployment approval, candidate confirmation, and stage acceptance.
- Checkpoints: stage boundaries, each vertical slice, and infrastructure changes.

## Minimum useful slice

1. Branded responsive application with one documented local setup.
2. Complete CRUD for boxes and books through UI and API.
3. A selected-box workflow for adding, moving, updating, and deleting books.
4. GPT-5.6 image extraction into editable candidates; no direct AI write to canonical books.
5. Manual entry and keyword search when OpenAI is unavailable.
6. OpenAI embeddings stored and queried with SQLite plus `sqlite-vec`.
7. A narrow LLL-compatible read adapter for Central books, boxes, and box inventory.
8. A Central aggregate result that links to the branded node and reflects changes after refresh.
9. External contract, persistence, vector, outage, and journey evidence.
10. Box-scoped Assorted Things photos that save manually first, accept optional OpenAI metadata suggestions, expose unknowns, and require human review without creating books.

## Connection path

Hybrid own-domain plus LLL-compatible node.

- Product UI: branded owner-controlled HTTPS origin; exact hostname is selected before deployment.
- API: same origin under `/api` for the hackathon reference deployment.
- Central compatibility: an adapter over application services; disabling it does not disable local operation.
- Membership claim: none until human-reviewed Central registration succeeds.
- Central role: discovery and live aggregation companion only; it does not own or copy canonical node records.

## Geographic and discovery meaning

The node represents multiple library boxes. Each public box may have its own consented coordinates. The registry coordinate represents the primary service-area centroid used only for coarse node selection.

- Latitude and longitude are paired and range validated.
- Zero is valid.
- Unknown-location nodes may appear without a radius but not in radius-filtered discovery.
- The demo node must have a fresh heartbeat within Central's 24-hour policy and fewer than three observed health failures.

## Technology and data

- TypeScript application and responsive web UX.
- SQLite owns users, boxes, books, candidates, Assorted Things image history, audit, and idempotency state.
- Pinned `sqlite-vec` owns local vectors keyed to canonical book IDs.
- `gpt-5.6-sol` through the Responses API performs image understanding and structured extraction.
- `text-embedding-3-small` produces 1,536-dimensional searchable vectors.
- OpenAPI owns the Central compatibility contract.
- MCP and a ChatGPT widget are application adapters planned for Phase 1.5B.

The project owner owns the code, application data, OpenAI usage, images, deployment, domain, DNS, TLS, backups, exports, and deletion decisions. The Central operator owns Central infrastructure and registry records.

## Privacy and resilience

- Public demo records contain no personal or precise private location data.
- Book-scan images are temporary. Assorted Things originals are explicitly retained as protected box history, bounded to 10 MiB each, and included in backup and deletion policy.
- Model outputs remain candidates until human confirmation.
- Keys remain server-side.
- Manual CRUD and keyword search work without OpenAI.
- Local CRUD works without Central.
- Backup, export, deletion, and restore are release requirements.

## Optional after the minimum slice

- ChatGPT map widget and conversational actions.
- Multi-book shelf review refinements.
- Box photos and condition history.
- Multilingual descriptors.
- Recommendations and duplicate suggestions.

## Non-goals

- Full federation or multi-node rank fusion.
- Istio or mesh expansion.
- Hosted-node control plane.
- Central replication or ownership of node data.
- Raw vector exchange.
- Global identity federation.
- Automatic AI writes without confirmation.
- Production-scale approximate-nearest-neighbor indexing.

## Open questions deferred to later approved stages

- Production service routing and operator identity wiring.
- Authentication provider for the public judge deployment.
- Exact image retention duration.
- Whether the judge build uses an isolated test account or self-registration.

## Stage 01 audit

- Outcome: PASS — one audience and first journey are concrete.
- Ownership: PASS — learner and agent work are explicit.
- Connection: PASS — hybrid ownership, URL shape, geography, heartbeat, and graduation are explicit.
- Complexity: PASS — AI, vectors, identity boundary, deployment, and Central compatibility are selected.
- Non-goals: PASS — infrastructure and advanced distributed behavior are deferred.

Next allowed stage: Stage 02 specification.

## Phase 1.5C capability amendment

The owner approved a concrete Happy Box at `66 Colon Ave, St. Augustine, FL 32084` and the hostname `happybox.littlelinkedlibrarian.com`. The reference seed uses approximate public map coordinates `29.927154, -81.325848`; deployment remains a separate approval.

Assorted Things follows the existing Central semantics reviewed in `active/happy`: it is box-scoped capture history, not a book scan or book journey. Manual capture must succeed before optional enrichment. The protected original, timestamp, box, human context, proposed metadata, explicit unknowns, review questions, provenance, and confirming actor are retained locally. Central compatibility exposes none of this private workflow.

The branded application offers Garden, Terminal, and Cosmic themes. Theme choice is local presentation state and does not change domain behavior or the compatibility contract.
