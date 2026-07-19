# Phase 1.5A Validation Report

Status: PASS for the product-foundation scope; NOT READY for hackathon release
Date: 2026-07-18
Target: `stages/05-build/output/node-project`

## Reproducible evidence

```text
npm install
102 packages installed; 0 audit vulnerabilities

npm run check
TypeScript: PASS
Test files: 3 passed
Tests: 6 passed

npm audit --omit=dev
0 vulnerabilities

git diff --check
PASS
```

Tests use temporary migrated SQLite databases, deterministic OpenAI fakes, the real sqlite-vec native extension, Fastify's external request injection, and a filesystem backup/restore cycle.

## Acceptance disposition

| Rows | Status | Evidence or reason |
|---|---|---|
| SET-01 | PASS | Exact lockfile, env template, ignore rules, clean install, no key required for tests |
| BOX-01 through BOX-06 | PASS | Authenticated HTTP lifecycle, paired zero coordinates, range checks, public reads, non-empty 409 |
| BOOK-01 through BOOK-05 | PASS | Authenticated create/update/move/delete implementation, public mapping, paging cap, vector cleanup transaction |
| AI-01 through AI-06 | PASS | File constraints, strict candidate validator, pending state, terminal rejection, actor/key confirmation, retry returns same book |
| VEC-01 through VEC-04 | PASS | Real 1,536-dimension insert/query/filter; wrong dimension rejection; keyword fallback mode |
| DEG-01 and DEG-02 | PASS | No-key CRUD test and discovery-disabled default |
| COMP-01 | PASS | Pinned public paths and historical field/pagination mapping tested |
| COMP-02, COMP-03, DISC-01, LINK-01 | DEFERRED | Require the Phase 1.5B UI/deployment and live Central companion journey |
| COMP-04 | PASS at node boundary | Public adapter has no mutation credential; management requires a distinct configured local token |
| PRIV-01 | PASS | Public queries join visible boxes and books; private records are excluded |
| AUD-01 | PASS for candidate confirmation | Actor and idempotency key are recorded transactionally; broad CRUD audit expansion remains a hardening task |
| REC-01 | PASS for backup/restore | Live-safe backup, reopen, integrity, migration, inventory, and vector query observed |
| MCP-01 | DEFERRED | Explicit Phase 1.5B scope |

## Degraded modes observed

- OpenAI absent: manual CRUD and public reads operate; analysis returns a retryable 503.
- Embedding/vector failure: canonical write succeeds and search reports keyword fallback.
- Central absent: no code path is required for local operation.
- Missing vector: keyword results remain visible.

## Known gaps before release

- No branded browser application or map.
- No production session/login implementation; the foundation uses one local operator token.
- No persistent cover storage.
- No active registry/heartbeat adapter or live Central refresh proof.
- No MCP server or ChatGPT component.
- No deployment/TLS/rollback exercise.
- CRUD audit events beyond candidate confirmation need expansion before production claims.

Stage 07 release is intentionally refused until the Phase 1.5B application journey and its deployment/companion evidence are complete.
