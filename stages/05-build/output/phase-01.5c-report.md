# Phase 1.5C Build Report

Status: IMPLEMENTED locally; deployment intentionally not performed
Date: 2026-07-18
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

## Release work deliberately deferred

- Route the existing Cloudflare tunnel to the approved local service.
- Select and provision the production database/media mount and SQLite-safe backup destination.
- Create a production operator token and map the uncommitted hackathon key to `OPENAI_API_KEY` in the process environment.
- Observe the three themes and full capture/review flow in a real browser at the HTTPS hostname.
- Run Central lookup, node click-through, CRUD, refresh, and rollback evidence.
- Deployment, DNS mutation, Central registration, and public test credentials still require owner approval.
