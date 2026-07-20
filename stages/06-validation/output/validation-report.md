# Phase 1.5F Validation Report

Status: AUTOMATED PASS; HUMAN RELEASE REVIEW REQUIRED
Date: 2026-07-20
Target commit: `d630a9c` on `main`
Local target: `stages/05-build/output/node-project`
Deployed target: `https://happybox.littlelinkedlibrarian.com`

## Release-candidate result

The node builds, passes its automated suite, runs with persistent SQLite and sqlite-vec storage, serves the real Happy Box sample inputs, and exposes the same application behavior through its browser and authenticated Streamable HTTP MCP boundaries. The previous MCP schema failure is fixed and covered by a real transport test.

The project is not yet marked hackathon-release complete. OAuth for ChatGPT, the Central discovery/aggregation loop, and the browser/video walkthrough require explicit human work described below.

## Reproducible automated evidence

```text
npm run check
TypeScript: PASS
Test files: 7 passed
Tests: 16 passed

npm audit --omit=dev
0 vulnerabilities

docker compose -f compose.production.yaml config
PASS

docker build -t lll-happybox:validation-01.5f .
PASS
Image: sha256:7225d9870e60...

git diff --check
PASS
```

Tests use temporary migrated SQLite databases, deterministic OpenAI fakes, the real sqlite-vec extension, Fastify request injection, and a real Streamable HTTP MCP client/server boundary. The strict MCP regression asserts that `list_my_boxes` returns exactly its six declared fields and no datastore-only properties.

## Deployment evidence

- A pre-deploy SQLite backup was verified at `/app/backups/lll-node-20260720T154023Z.sqlite`.
- Docker image `lll-happybox:phase-01.5f` was rebuilt from `main`; container `lll-happybox` reports healthy.
- Public health reports database ready, vector ready, and OpenAI configured.
- The browser loads asset revision `phase-01.5f.2`.
- The outdoor Happy Box photo and all three shelf-scan samples return HTTP 200 as JPEGs.
- Authenticated public MCP smoke test: 10 tools; `list_my_boxes` succeeded; returned box keys exactly `bookCount`, `id`, `latitude`, `location`, `longitude`, and `name`.
- Existing persistent records were preserved. No live reset or deletion was performed.

## Demo-data disposition

- The demo action idempotently creates or refreshes only the real Happy Box at `66 Colon Ave, St. Augustine, FL 32084`.
- It creates no book records and never deletes existing operator data.
- Four operator-provided JPEG derivatives are committed: one box image and three real multi-book shelf inputs.
- The committed derivatives contain no EXIF/GPS metadata; original photos are not committed.
- Books become canonical only after GPT-5.6 proposes candidates and a human confirms selected results.
- Older live records from prior demo versions remain until the operator explicitly chooses a cleanup or a clean hackathon database.

## Acceptance disposition

| Area | Status | Evidence or remaining condition |
|---|---|---|
| Setup, boxes, books, privacy | PASS automated | Locked install, validation, authenticated CRUD, public filtering, pagination, and relationship rules |
| Book scan and confirmation | PASS automated | Bounded multi-book extraction, one batch review, edition proposals, idempotent human confirmation, and retry behavior |
| Scan activity and media | PASS automated | Durable parent image, protected zoomable history, child outcomes, and backup/restore coverage |
| Assorted Things | PASS automated | Human-only box-scoped capture and review; no OpenAI inference and no Central projection |
| Metadata and covers | PASS automated | ISBN normalization, explicit edition selection, Open Library adapter, provenance, and graceful no-match behavior |
| Vector semantic search | PASS automated; MULTILINGUAL human check pending | OpenAI embedding adapter, real sqlite-vec query/filter tests, and keyword fallback; cross-language relevance still needs walkthrough evidence |
| Browser UI | PASS automated; HUMAN pending | Responsive application, box/book detail modals, themes, map/card controls, scanner input state, operator logout, and delete regressions |
| MCP application boundary | PASS automated and live smoke | 10 authenticated tools, widget resource, strict declared schemas, and canonical application services |
| OAuth for ChatGPT | PENDING | Static bearer authentication works for local/operator testing; OAuth 2.1 discovery, authorization-code/PKCE flow, JWT validation, scopes, and ChatGPT connection are not configured |
| Central compatibility | PASS at node contract; LIVE LOOP pending | OpenAPI compatibility exists, but registry heartbeat, active-node discovery, proximity/vector aggregation, and the Central-to-node-to-Central demo are not yet evidenced |
| Broad audit trail | PARTIAL | Scan decisions are recorded; complete create/update/delete actor audit coverage remains hardening work |

## Required human release review

1. Hard-refresh the public application and follow `deploy/HUMAN-TEST.md`.
2. Confirm public use of the real outdoor and shelf photographs.
3. Decide whether to preserve the current live records, manually remove known obsolete demo fixtures after backup, or launch a separate clean hackathon data volume.
4. Run one real GPT-5.6 multi-spine scan, correct candidates, confirm multiple books, and verify metadata, covers, activity history, and semantic search.
5. Test mobile camera capture and the complete Assorted Things human-review path.
6. Test the MCP endpoint with MCP Inspector using the operator token.
7. Choose and configure an OAuth 2.1 provider before connecting the MCP app to ChatGPT.
8. Decide whether Central registration/aggregation is part of the recorded submission demo or a clearly labeled compatible companion.

## Release blockers versus follow-up

OAuth is a blocker only if the submitted experience promises direct ChatGPT app access. Central registration is a blocker only if the video promises live federated discovery. Neither blocks a truthful demo of the standalone AI-built node, its browser UI, GPT-5.6 extraction, local vector search, activity history, or Inspector-tested MCP interface.

Do not mark Stage 07 complete until the human walkthrough is recorded and every capability claimed in the submission has matching evidence.
