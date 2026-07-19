# Hackathon reference node product specification

Status: APPROVED
Decision date: 2026-07-18
Checkpoint basis: the owner approved the application plan and directed Phase 1.5A implementation.

## Contract sources and revision pin

The hackathon compatibility profile is derived from two inspected sources:

- Provider reference: `lll-lite-standalone/contracts/openapi.yaml`, OpenAPI 3.0.3, contract version `0.1.0`, repository commit `29f136cb0890519122370e052ecd99e5eb5e587a`.
- Central consumer behavior: `lll-central` commit `0e047519235156c52a37ca39ee6e12471efc2387`, especially aggregate routes, aggregate service, discovery service, and aggregate OpenAPI.

The node pins a minimal read-compatible profile from those sources. It does not claim that the historical contract is a finalized federation standard.

## Known contract conflict

The learning policy requires explicit `uiUrl` and `apiBaseUrl`; current Central derives `uiUrl` from the registered endpoint. The hackathon node therefore serves branded UI at the root and API at `/api` on one HTTPS origin. An explicit two-URL registry contract remains deferred. The deployment test must prove the derived link.

## Actors and ownership

- Anonymous visitor: reads public boxes and books and uses keyword or semantic search.
- Local operator: authenticates locally and performs box, book, candidate, and configuration writes.
- Central: anonymous or separately authenticated consumer of the narrow public compatibility adapter.
- GPT-5.6 adapter: prepares book candidates and Assorted Things metadata proposals only.
- Embedding adapter: creates vectors only for confirmed canonical books.
- MCP caller: Phase 1.5B adapter using the same operator permissions and application services.

The node owns canonical boxes, books, candidates, audit, and vector linkage. Central owns registry and aggregation records only.

## Primary journeys

### Central to branded node

1. Central calls the public compatible list endpoint.
2. Central labels the result with the node source.
3. The user opens a remote result and follows the derived branded link.
4. The node renders the same book or box data from its canonical store.

### Box CRUD

The operator creates, reads, updates, and deletes boxes. A box has a stable ID, name, description, human-readable location, optional paired coordinates, visibility, inventory count, and timestamps. Deleting a non-empty box returns a conflict until books are moved or deleted.

### Book CRUD

The operator creates, reads, updates, moves, and deletes books. A book has a stable ID, optional box ID, title, author, optional bibliographic fields, condition, AI provenance, and timestamps. Changes that affect the searchable representation schedule or perform a vector refresh. Deletion removes vector linkage.

### GPT-5.6 scan-to-box

1. The authenticated operator selects a destination box and supplies one supported image.
2. The server validates type and size and sends the image through an application-owned Responses API adapter using `gpt-5.6-sol`.
3. Structured output is validated into one or more candidates.
4. Candidates store provenance and remain separate from books.
5. The operator edits, rejects, or confirms each candidate.
6. Confirmation creates exactly one canonical book through the normal book service and records the actor and idempotency key.

### Search

Keyword search is always available. Semantic search embeds the query with `text-embedding-3-small`, searches 1,536-dimensional vectors through `sqlite-vec`, filters to visible canonical books, and reports `semantic`. If OpenAI or vector search is unavailable, the response uses keyword search and reports `keyword_fallback`.

## Product API

Product writes require local operator authentication. Controllers validate and delegate; services own workflows.

- Authentication/session endpoints selected during architecture.
- Full box CRUD.
- Full book CRUD, including moving a book between boxes.
- Candidate analysis, list, fetch, edit, reject, and confirm.
- Protected Assorted Things capture, image read, list/filter, edit, reject, and idempotent confirm; these routes never create books and are not Central-compatible public reads.
- Keyword and semantic search.
- Export and operational endpoints required by release scope.

## Central compatibility adapter

The public adapter exposes only approved visible records:

- `GET /health`
- `GET /api/books`
- `GET /api/books/{id}`
- `GET /api/boxes`
- `GET /api/boxes/{id}`
- `GET /api/boxes/{id}/books`

List responses use `{ data, pagination }`. Paging begins at 1, limit defaults to 20, and limit is capped at 50. Missing records return a stable `{ error, message }` envelope and 404.

Product write routes may share paths with the reference contract, but Central never receives or forwards local bearer credentials. The compatibility adapter can be disabled without preventing local CRUD or search.

## Data behavior

### Coordinates

Latitude and longitude are both absent or both present. Latitude is -90 through 90; longitude is -180 through 180; zero is valid. Public responses expose coordinates only when box visibility and consent permit it.

### Candidate state

Candidate states are `pending`, `confirmed`, and `rejected`. Terminal states cannot return to pending. Confirmation requires a valid destination box, current actor, reviewed fields, and idempotency key.

### Vector representation

Representation version `book-search-v1` concatenates normalized title, author, genre, description, and language with labeled fields. Vector records store book ID, model `text-embedding-3-small`, dimensions 1,536, representation version, source revision, and creation time.

A book can exist without a vector. Missing vectors never hide it from keyword search. Vector refresh failure leaves the canonical write successful but observable for retry.

### Images

Accepted formats are JPEG, PNG, and WebP. Default maximum size is 10 MiB. Book-scan image bytes are temporary and are not canonical book data. Assorted Things originals are deliberately retained as protected box history in the reference SQLite media adapter, limited to 10 MiB each. A future object-storage adapter may replace the BLOB without changing the application port.

## Error and degraded modes

- Validation: 400 with field-safe error details.
- Authentication: 401.
- Permission: 403.
- Missing record: 404.
- Delete a box containing books or Assorted Things captures, or duplicate idempotency conflict: 409.
- OpenAI unavailable: candidate request returns a retryable service error; manual entry remains available.
- Embedding unavailable: canonical write succeeds, vector state becomes pending/failed, and keyword search remains available.
- Central unavailable: local application behavior is unchanged.
- Partial Central aggregation errors are displayed by Central and do not mutate node data.

## Discovery policy observed by the demo

Human approval, public privacy, fresh heartbeat, fewer than three health failures, and any requested proximity filter determine whether Central queries the node. The registry coordinate is a service-area centroid. Unknown coordinates participate only when no radius is requested. Capability filtering remains deferred.

## Privacy and security

- Secrets are server-side and excluded from logs and responses.
- Public compatibility reads contain only public records.
- Local and Central authentication realms are separate.
- AI output, tool input, and external response data are untrusted and validated.
- Writes are auditable and safe to retry through idempotency.
- No membership claim is made before registration approval.

## Non-goals

Full federation, rank fusion, raw vector exchange, Istio expansion, hosted control plane, global identity, approximate-nearest-neighbor scale, automatic AI writes, and Central replication are not required.

## Stage 02 audit

- Observable: PASS — requirements map to external requests, responses, states, and journeys.
- Honest: PASS — local, compatible, and registered states are distinct.
- Safe writes: PASS — candidates require authenticated human confirmation.
- Scope: PASS — distributed and infrastructure work remains deferred.
- Network policy: PASS — eligibility, geography, heartbeat, health, and realm separation are testable.

Next allowed stage: Stage 03 architecture.

## Phase 1.5C approved amendment

### Assorted Things capture and review

1. The authenticated operator chooses a box, photo, and optional human label or note.
2. The node stores the original and manual pending-review record before contacting OpenAI.
3. When configured, the OpenAI adapter proposes a bounded title, category, description, tags, condition, quantity, explicit unknowns, and questions. Unsupported facts remain null; ownership, value, safety, brand, material, and identity are never invented.
4. OpenAI failure leaves the saved manual capture usable.
5. The operator edits, rejects, or idempotently confirms the capture. Confirmation records review; it never creates a book.
6. Captures and images require the local operator token and never appear in the six Central compatibility reads.

### Branded presentation

Garden is the accessible warm default. Terminal and Cosmic are alternate code-native themes. The browser persists the selected theme locally; keyboard access, readable contrast, and domain behavior remain consistent across themes.
