# Phase 1.5C Build Report

Status: DEPLOYED for human review; Central registration intentionally not performed
Date: 2026-07-19
Branch: `phase/01.5c-judge-readiness`

## Working outcome

The reference application now seeds Happy Box at `66 Colon Ave, St. Augustine, FL 32084`, retains protected box-scoped Assorted Things capture history, optionally proposes bounded metadata with GPT-5.6, and provides a human edit/confirm/reject gate that never creates a book. Garden, Terminal, and Cosmic themes are selectable and persist in the browser.

This follows the reviewed LLL Central behavior: Assorted Things is box history, not a book scan or book journey. The reference node augments Central’s manual capture idea with optional post-save enrichment while keeping the manual path canonical and operational during model failure.

## Observed evidence

- `npm run check`: PASS
- TypeScript: PASS
- Test files: 6 passed
- Tests: 12 passed
- Real `sqlite-vec` loaded in ordinary tests.
- Live `gpt-5.6-sol` Assorted Things smoke: PASS using the non-sensitive 256px LLL logo.
- Live result contained a grounded title, 5 explicit unknowns, and 3 human review questions.
- No API key value, response ID, raw model payload, or user image was recorded.

## Boundaries proven

- Manual image and note persist before the OpenAI call.
- OpenAI failure leaves a pending manual capture.
- Original image reads require the local operator bearer token.
- Edit, reject, and idempotent confirm are terminal-state guarded.
- Confirming a capture records an audit event and creates zero books.
- Boxes containing books or capture history cannot be deleted accidentally.
- Assorted Things routes remain outside the six anonymous Central-compatible reads.
- Migration 002 preserves the single-file reference deployment while a media-storage port keeps S3 or filesystem replacement possible.

## Remaining release work

- Complete the owner-led browser checklist across all three themes and write workflows.
- Decide daily backup scheduling and retention after observing database/image growth.
- Run Central registration, lookup, node click-through, CRUD, refresh, and rollback evidence.
- Choose longer-term production identity or judge test credentials; the current local operator token is suitable for owner review only.

## 2026-07-19 deployment evidence

- Docker image `lll-happybox:phase-01.5c` built from a clean `npm ci` after pinning the validated npm 11.6.2 installer.
- Container `lll-happybox` is healthy and binds only the host LAN address `192.168.0.141:13056`.
- Canonical database: `/home/zaxaz/lll-happybox/data/lll-node.sqlite`.
- Runtime configuration: `/home/zaxaz/lll-happybox/runtime.env`, mode `0600`.
- First verified backup: `/home/zaxaz/lll-happybox/backups/lll-node-20260719T120601Z.sqlite`.
- Cloudflare already routed the hostname to Istio; exact-host `happybox-route` now sends only Happy Box traffic through `happybox-docker` and its EndpointSlice.
- Public HTTPS health, metadata, themed UI, Happy Box address, anonymous reads, and `401` management boundary passed.
- Existing `beta.littlelinkedlibrarian.com` Central health remained `healthy` after routing.
- Restart persistence passed with 2 boxes, 3 books, and 1 pending AI-assisted Assorted Things fixture.

Human browser review remains the next checkpoint. See `node-project/deploy/HUMAN-TEST.md`.
