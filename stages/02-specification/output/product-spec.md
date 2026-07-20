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
- GPT-5.6 adapter: prepares bounded book candidates only; Assorted Things is deliberately human-described.
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

### Entity cards and detail modals

Every box and every book has one dedicated primary card control that opens its own detail modal. A box detail modal presents description, location, counts, books, Assorted Things, and operator actions. A book detail modal presents cover, title, author, box, description, ISBN, genre, language, publication year, condition, catalog provenance, and operator actions. Edit and delete controls are siblings of the primary card control, never nested inside or multiplexed with it. One user event resolves to exactly one action. Successful deletion closes stale entity modals before refreshing lists; a failed deletion leaves the relevant detail context intact and displays the domain error. Anonymous visitors receive read-only details; operator actions appear only in the local management realm.

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
2. The node stores the original as a pending-review record without sending it to an AI model.
3. A human looks at the image and supplies only the metadata useful to neighbors.
4. The operator rejects or idempotently confirms the capture. Confirmation records review; it never creates a book.
5. Captures and images require the local operator token by default and never appear in the six Central compatibility reads. A time-bounded, explicitly configured hackathon demo may open browser management without exposing the real token; MCP remains authenticated and the owner must take a backup before enabling the mode.

### Branded presentation

Garden is the accessible warm default. Terminal and Cosmic are alternate code-native themes. The browser persists the selected theme locally; keyboard access, readable contrast, and domain behavior remain consistent across themes.


## Phase 1.5D approved amendment

### Box-scoped personal inventory

- A box is the public navigation boundary. Selecting it reveals that box story, location, books, and human-confirmed Assorted Things; the global Assorted Things menu is removed.
- Confirmed puzzles, note cards, art, trinkets, and other approved objects are visible and zoomable through own-domain box routes. Pending and rejected captures and their images remain operator-only. These product routes do not expand the six-read Central compatibility profile.
- The scanner starts with one destination box and an explicit Books or Assorted things choice. The paths share presentation context, not schemas, entities, prompts, or confirmation state.

### Multi-book scan batches

1. One image may contain a cover or several shelf spines.
2. GPT-5.6 returns a structured array of 1 through 15 visibly supported candidates in image order. Unsupported title or author text remains empty for human completion; ISBN is never invented.
3. Every candidate receives a shared batch identifier, position, count, and model provenance.
4. The browser presents every candidate in one review modal. Complete candidates are selected by default; the operator edits only incomplete or incorrect rows and may reject any result.
5. One final action confirms selected candidates independently and rejects unchecked candidates; MCP returns the same bounded batch and preserves the human gate.

## Phase 1.5E approved amendment

### Scan activity as the parent record

1. Every Books upload first creates a durable, private scan activity containing its box, original image, MIME type, SHA-256, timestamps, lifecycle state, and model provenance. The activity exists even when extraction or enrichment fails.
2. Scan candidates belong to the activity and retain image order, extracted evidence, edits, final decision, and any resulting canonical book ID. The activity is the parent; candidates, metadata proposals, and audit events are children.
3. Activity history shows one thumbnail per uploaded image. Opening an activity displays a zoomable and pannable original with every detected result and its pending, confirmed, rejected, or failed state. Confirmed results link to the created books.
4. Original scan images remain operator-private by default and never enter the Central-compatible reads. Retention and deletion are explicit owner policy; deleting a historical image must not delete confirmed books.

### Edition metadata and ISBN resolution

1. A visibly readable ISBN is evidence, not a model invention. Normalize it, validate its ISBN-10 or ISBN-13 checksum, and use it for exact bibliographic lookup.
2. When ISBN is absent, query the bibliographic adapter with confirmed title, author, and optional language. Return a small list of edition proposals containing source IDs, ISBNs, publisher/date, language, subjects, description, and cover identifiers.
3. Never silently choose an edition from title and author alone. The operator selects a proposal, chooses a different edition, or confirms the book without an ISBN.
4. The reference adapter uses low-volume Open Library Search and Covers APIs, identifies the application, caches bounded results, records retrieval time and source attribution, and does not send the scan image.
5. Selected metadata is copied into canonical local fields with provenance. External outages never block manual confirmation; covers use a local placeholder when unavailable.

### Activity events

Append-only events record upload, extraction start/success/failure, candidate edit, metadata proposal/selection, confirm/reject, book creation, and permitted image deletion. Formal checkout, patron accounts, due dates, holds, fines, and notifications remain out of scope.
