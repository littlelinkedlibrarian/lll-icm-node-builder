# Phase 1.5F Validation Report

Status: AUTOMATED PASS; HUMAN RELEASE REVIEW REQUIRED
Date: 2026-07-20
Target revision: heartbeat-enabled Phase 1.5F release candidate
Local target: `stages/05-build/output/node-project`
Deployed target: `https://happybox.littlelinkedlibrarian.com`

## Release-candidate result

The node builds, passes its automated suite, runs with persistent SQLite and sqlite-vec storage, and serves the real Happy Box sample inputs. Its explicitly configured hackathon mode opens browser CRUD, scanning, review, activity history, and the ChatGPT-facing Streamable HTTP MCP endpoint without exposing the real operator token. Normal MCP deployments remain authenticated; the public MCP flag is a time-bounded judging exception. The previous MCP schema failure is fixed and covered by real transport tests.

The project is not yet marked hackathon-release complete. OAuth for ChatGPT and the browser/video walkthrough require explicit human work described below. The live Central registry, heartbeat, proximity, aggregation, detail, and inventory reads now pass; the human CRUD-refresh loop remains in the walkthrough.

## Reproducible automated evidence

```text
npm run check
TypeScript: PASS
Test files: 9 passed
Tests: 24 passed

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
- Central API and scan worker run image tag `staging-6279879-discovery`; readiness passed after applying the already-committed `20260703_add_library_box_location_provenance.sql` migration.
- The pre-migration Central dump is `/tmp/lll-central-pre-location-20260720T1738Z.sql` (203,979 bytes).
- `lll-happy-box` is active, public, healthy, and has a fresh authenticated heartbeat. Its single-purpose key is stored only in the host `0600` runtime environment.
- Live Central discovery returned one eligible node. Aggregate list, 5 km proximity, box detail, and box-inventory reads returned Happy Box with `nodesQueried: 1`, the correct source label, branded `uiUrl`, and three current books.
- A paired node backup was verified at `/app/backups/lll-node-20260720T174005Z.sqlite` before the heartbeat-enabled rebuild.
- Public hackathon mode was deployed with `PUBLIC_DEMO_OPERATOR=true` and `PUBLIC_DEMO_MCP=true`; an unauthenticated MCP SDK client completed the public HTTPS handshake and listed all 10 tools.
- The immediate pre-demo rollback backup is `/app/backups/lll-node-20260720T184001Z.sqlite`, with a paired media archive from the same timestamp.
- The immediate pre-public-MCP rollback backup is `/app/backups/lll-node-20260720T190830Z.sqlite`, with a paired media archive from the same timestamp.

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
| Scan activity and media | PASS automated and live | Durable parent image, zoomable history, child outcomes, and backup/restore coverage; public only while explicit hackathon mode is enabled |
| Assorted Things | PASS automated | Human-only box-scoped capture and review; no OpenAI inference and no Central projection |
| Metadata and covers | PASS automated | Every detected candidate receives a bounded concurrency-limited lookup; transient retry, explicit candidate retry, existing-book recovery, human edition selection, reindexing, provenance, and graceful no-match behavior |
| Vector semantic search | PASS application plumbing; MULTILINGUAL human check pending | Spanish, Simplified Chinese, Italian, and French query paths are tested against sqlite-vec with a deterministic embedder; live OpenAI cross-language relevance still needs walkthrough evidence |
| Browser UI | PASS automated and deployed; HUMAN pending | Responsive application, box/book detail modals, themes, map/card controls, scanner input state, public-demo labeling, and delete regressions |
| MCP application boundary | PASS automated and live smoke | 10 tools, widget resource, strict declared schemas, canonical application services, and a live no-auth ChatGPT-compatible handshake under the explicit demo flag |
| OAuth for ChatGPT | PENDING | Static bearer authentication works for local/operator testing; OAuth 2.1 discovery, authorization-code/PKCE flow, JWT validation, scopes, and ChatGPT connection are not configured |
| Central compatibility | PASS automated and live reads; HUMAN CRUD-refresh pending | Registry promotion, fresh heartbeat, health/privacy/proximity eligibility, aggregate lists, box detail, inventory, source label, and branded link passed live; the browser card/modal and one visible create/delete refresh remain in the human walkthrough |
| Broad audit trail | PARTIAL | Scan decisions are recorded; complete create/update/delete actor audit coverage remains hardening work |

## Required human release review

1. Hard-refresh the public application, confirm **Public demo mode** appears without a token, and follow `deploy/HUMAN-TEST.md`.
2. Confirm public use of the real outdoor and shelf photographs.
3. Decide whether to preserve the current live records, manually remove known obsolete demo fixtures after backup, or launch a separate clean hackathon data volume.
4. Run one real GPT-5.6 multi-spine scan, correct candidates, confirm multiple books, and verify metadata, covers, activity history, and semantic search.
5. Test mobile camera capture and the complete Assorted Things human-review path.
6. Register the public `/mcp` endpoint as a ChatGPT developer-mode app, list boxes, search the catalog, and run the photo-review flow; disable `PUBLIC_DEMO_MCP` immediately after judging.
7. Choose and configure an OAuth 2.1 provider before connecting the MCP app to ChatGPT.
8. Run the **Central companion loop** in `deploy/HUMAN-TEST.md` and decide whether to include it in the recorded submission demo or label it as the compatible companion.

## Release blockers versus follow-up

OAuth is a blocker only if the submitted experience promises direct ChatGPT app access. The Central machine loop is proven; its human CRUD-refresh walkthrough is a blocker only if the video promises that exact live journey. Neither blocks a truthful demo of the standalone AI-built node, its browser UI, GPT-5.6 extraction, local vector search, activity history, or Inspector-tested MCP interface.

Do not mark Stage 07 complete until the human walkthrough is recorded and every capability claimed in the submission has matching evidence.
