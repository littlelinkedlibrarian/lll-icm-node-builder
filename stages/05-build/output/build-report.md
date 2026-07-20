# Phase 1.5A Build Report

Status: IMPLEMENTED; validation complete for the foundation scope
Date: 2026-07-18
Branch: `phase/01.5a-product-foundation`

## Working outcome

The generated reference node boots as one Node 24 process with a portable SQLite database. It supports authenticated box/book CRUD, anonymous compatible reads, GPT-5.6 Sol vision candidates, idempotent human confirmation, local sqlite-vec search, keyword degradation, migration, and recovery boundaries.

The public adapter maps internal product fields to the pinned historical names (`libraryBoxId`, `bookCount`, and `hasMore`) instead of leaking the node's internal model. Private boxes/books cannot enter these reads.

## Slice evidence

| Slice | Outcome | Evidence |
|---|---|---|
| Runtime/config | Exact dependencies, Node 24 engine, secret-safe env, composition root | TypeScript check and clean npm audit |
| Contract | Six public reads plus separate management/search/candidate routes | YAML parse and public-write exclusion tests |
| SQLite | Forward migration, WAL, foreign keys, vector extension readiness | Every test opens a migrated real database |
| Box CRUD | Create/read/update/delete; paired/ranged coordinates; non-empty conflict | Injected HTTP journey includes zero coordinates, auth, paging, and 409 |
| Book CRUD | Create/read/update/move/delete; public mapping | Injected HTTP and repository journeys |
| Vision candidates | Strict adapter result, pending state, edit/reject/confirm, provenance | Fixture vision creates no book before confirmation |
| Safe confirmation | Actor/idempotency audit and exactly one canonical book | The same confirmation request returns the same book |
| Embeddings/search | Versioned 1,536-dimension local vectors and fallback | Real sqlite-vec ordering/filter/dimension tests |
| Recovery | SQLite backup, reopen, integrity, migrations, inventory | Temporary-file backup/restore test |
| Degradation | Manual path without key; keyword path without vector/OpenAI | No-key CRUD and forced vector failure tests |

## Observed commands

```text
npm install
added 102 packages; 0 vulnerabilities

npm run check
TypeScript: PASS
Test files: 3 passed
Tests: 6 passed
```

The final command is rerun during Stage 06; counts above describe the completed suite after the recovery slice.

## Decisions recorded in code

- Public compatibility is read-only; management identity is local.
- Vision output is untrusted and cannot mutate inventory.
- Canonical writes succeed even if embedding fails.
- `sqlite-vec@0.1.9` is exact-pinned because the package is pre-1.0.
- Vector keys cross the Node/SQLite boundary as integers, not floating-point values.
- Same-origin UI/API deployment preserves current Central navigation.

## Honest Phase 1.5B handoff

The foundation intentionally has no branded browser UI, map, persistent cover store, production session/login, Central registry heartbeat implementation, MCP server, ChatGPT component, deployment manifest, or live Central browser proof. Those are demo/application slices, not hidden claims of this branch.

The next branch should start with the branded UI and operator workflow, then prove Central refresh against this API, then add MCP tools that reuse these application operations and permissions.

## Later-phase status

The handoff above records what Phase 1.5A deliberately omitted. As of 2026-07-20, later merged phases provide the branded browser application, map, persistent media, metadata recovery, MCP tools, host deployment, and an optional Central heartbeat adapter. The adapter is disabled unless explicitly configured and never makes local catalog behavior depend on Central.
