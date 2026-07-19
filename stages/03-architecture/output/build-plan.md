# Phase 1.5A Vertical-Slice Build Plan

Status: APPROVED
Branch: `phase/01.5a-product-foundation`
Exit: contract-tested API/data foundation ready for the branded UI and Central demo slice

The agent implements each slice and leaves a short evidence note. The learner/project owner reviews behavior at the marked checkpoints. No slice may hide a required product decision inside generated code.

## 1. Repository and runtime foundation

- [ ] Add Node 24/TypeScript workspace metadata, exact dependency versions, scripts, formatting, linting, and Vitest configuration.
- [ ] Add `.env.example`, validated configuration, safe defaults, and ignore rules for databases, images, keys, and generated output.
- [ ] Create domain, application, adapter, HTTP, database, contract, and composition directories without framework leakage across boundaries.
- [ ] Add a startup and health smoke test.

Evidence: clean install, typecheck, lint, test, and a server started through the composition root.

## 2. Contract and error vocabulary

- [ ] Add the node-owned OpenAPI contract with CRUD routes, scan-candidate routes, semantic search, health, and the exact LLL-compatible read subset.
- [ ] Preserve `{data, pagination}` lists and the agreed page defaults/caps.
- [ ] Define stable problem/error codes for validation, missing records, non-empty box deletion, invalid candidate transitions, unavailable AI, and unavailable embeddings.
- [ ] Add contract linting and tests that fail on undocumented route/status/schema drift.

Checkpoint: owner reviews paths and public-versus-management exposure before controller implementation.

## 3. SQLite foundation

- [ ] Add numbered forward-only migrations for metadata, boxes, books, candidates, embedding metadata, and the sqlite-vec virtual table.
- [ ] Enable foreign keys and WAL; record applied migrations transactionally.
- [ ] Implement database lifecycle, transaction, integrity-check, backup, and test-database helpers.
- [ ] Prove startup is idempotent and an unsupported/newer schema fails safely.

Evidence: migration and restore tests against temporary database files.

## 4. Box CRUD slice

- [ ] Implement box entity/invariants, repository port, SQLite adapter, use cases, controllers, and schemas.
- [ ] Implement list/get/create/update/delete with coordinates and timestamps.
- [ ] Reject deletion of a box that contains books with the specified conflict code.
- [ ] Add repository, service, HTTP, and contract tests.

Evidence: an injected HTTP test performs the complete box lifecycle and conflict path.

## 5. Book CRUD slice

- [ ] Implement book entity/invariants, repository port, SQLite adapter, use cases, controllers, and schemas.
- [ ] Implement list/get/create/update/delete and box-scoped list with the public pagination envelope.
- [ ] Preserve extraction provenance and make manual entry independent of OpenAI.
- [ ] Remove related vector state transactionally when a book is deleted.

Evidence: complete book lifecycle, box-scoped listing, pagination, missing-box, and cleanup tests.

## 6. GPT-5.6 scan-candidate boundary

- [ ] Define strict candidate and extraction schemas, state transitions, OpenAI port, and deterministic fake.
- [ ] Implement the Responses API adapter for `gpt-5.6-sol` vision input without persisting raw image bytes.
- [ ] Implement create/extract, read, correct, reject, and idempotent approve operations.
- [ ] Ensure only approval creates a book and a failed/unavailable model leaves ordinary CRUD working.
- [ ] Add fixture-image tests using the fake adapter and an opt-in live smoke command.

Checkpoint: owner reviews a schema-valid editable candidate and the provenance shown before approval.

## 7. Embedding and semantic-search slice

- [ ] Load the exact-pinned sqlite-vec extension and fail readiness clearly if it cannot load.
- [ ] Define `book-search-v1`, source hashing, embedding metadata, OpenAI embedding port, and deterministic fake.
- [ ] Embed approved/manual book representations and queue failed work for an in-process retry adapter.
- [ ] Implement semantic search with box filtering and deterministic keyword fallback.
- [ ] Add the real-extension dimension, ordering, filter, deletion, and rebuild proofs listed in `architecture.md`.

Evidence: integration tests run real sqlite-vec queries; no live OpenAI credential is required.

## 8. Central compatibility and discovery seam

- [ ] Add compatibility tests for `GET /health`, `/api/books`, `/api/books/{id}`, `/api/boxes`, `/api/boxes/{id}`, and `/api/boxes/{id}/books` against the pinned v0.1.0 Central contract.
- [ ] Add node metadata and registration/heartbeat ports with discovery disabled by default.
- [ ] Document the one-origin deployment rule and Central's currently derived UI URL.
- [ ] Add fixtures that let Central treat the reference node as active without claiming replication.

Evidence: contract suite and a recorded local Central lookup/read-through test plan.

## 9. Phase 1.5A hardening and handoff

- [ ] Run format, lint, typecheck, unit, integration, contract, migration, and dependency checks.
- [ ] Verify no secrets, databases, raw uploads, or model payloads are tracked.
- [ ] Write setup, test, architecture, AI usage, data ownership, backup/restore, and troubleshooting guidance.
- [ ] Record known limits and Phase 1.5B inputs: branded UI, production identity, persistent cover storage, map, Central live demo, and ChatGPT/MCP tools.
- [ ] Commit, push, and open a reviewable Phase 1.5A pull request.

Final evidence: a fresh clone can install, migrate, start, execute CRUD, produce a fake-backed scan candidate, and pass a real sqlite-vec semantic query.

## Phase 1.5C amendment: judge-ready Happy Box and Assorted Things

- [x] Seed Happy Box at 66 Colon Ave, St. Augustine, FL 32084 with paired approximate coordinates.
- [x] Add migration 002, domain types, repository port, SQLite media/history adapter, and guarded box deletion.
- [x] Save manual captures before optional OpenAI structured enrichment; retain unknowns and human questions.
- [x] Add protected managed routes for capture, list/filter, original image, edit, reject, and idempotent confirm.
- [x] Keep the workflow separate from books and outside the Central-compatible API.
- [x] Add Garden, Terminal, and Cosmic theme selection with local persistence and responsive layouts.
- [x] Add fake-backed integration evidence for offline save, protected images, AI proposals, confirmation, rejection, and no-book behavior.
- [ ] Observe the full browser journey and run an opt-in live OpenAI smoke with a synthetic/non-sensitive image.
- [ ] Deploy only after the owner approves environment, tunnel routing, operator token handling, backup path, and rollback.


## Phase 1.5D: personal box inventory and scanner modes

- [x] Fast-forward Phase 1.5C into main and branch from the merged state.
- [x] Replace the global Assorted Things menu with a destination-first Books or Assorted things scanner.
- [x] Extract 1 through 15 book candidates from a cover or shelf-spine photo and review each independently.
- [x] Add box inventory presentation for books and non-rejected operator captures.
- [x] Publish only confirmed Assorted Things through box-scoped own-domain reads and zoomable images.
- [x] Keep pending/rejected images protected and keep Assorted Things outside the Central compatibility profile.
- [x] Align the ChatGPT MCP photo tool with the multi-candidate batch contract.
- [ ] Add primary box-photo media behind the media port.
- [ ] Add approved cover lookup and AI introduction enrichment after confirmed book identity.
- [ ] Add lightweight append-only placed/taken/returned/moved events if hackathon time remains.

Checkpoint: human-test a photo containing at least three spines, confirm and reject different candidates, confirm one Assorted Thing, and verify its public zoom view appears only inside the selected box.
