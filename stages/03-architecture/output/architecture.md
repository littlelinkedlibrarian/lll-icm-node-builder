# Architecture Decision

Status: APPROVED for Phase 1.5A
Date: 2026-07-18
Decision owner: Learner/project owner
Implementation branch: `phase/01.5a-product-foundation`

## Decision summary

Build the hackathon reference node as a small TypeScript service on Node.js 24, using Fastify for HTTP, the built-in `node:sqlite` module for durable local data, and an exactly pinned `sqlite-vec` extension for semantic search. Keep the domain and application layers independent of Fastify, SQLite, OpenAI, and LLL Central so a learner can replace any adapter without rewriting the product.

The node has two equally valid identities:

1. an independently branded library application on its own HTTPS domain; and
2. an LLL-compatible node whose public read endpoints can be discovered and aggregated by Central.

The hackathon deployment uses one HTTPS origin: the branded UI is at `/` and the compatible API is under `/api`. This works with the current Central behavior, which derives the UI URL from the registered endpoint. An explicit `uiUrl` plus `apiBaseUrl` registry contract is a later Central evolution, not a Phase 1.5A dependency.

## Technology choices

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js 24 LTS, TypeScript, ESM | One accessible language across API, tests, and later UI; built-in synchronous SQLite API and extension loading reduce native dependency burden. |
| HTTP | Fastify 5 with JSON Schema route validation and response serialization | Small runtime, first-class injection tests, and explicit boundary schemas. |
| Persistence | `node:sqlite` `DatabaseSync`, WAL mode, foreign keys, plain numbered SQL migrations | A single portable database file, no external service, visible SQL for learners, and deterministic migration ownership. |
| Vectors | Exact-pinned `sqlite-vec@0.1.9`; 1,536-dimensional float embeddings | Supports local KNN search beside relational records. Exact pinning contains the pre-1.0 compatibility risk. |
| AI extraction | OpenAI Responses API adapter targeting `gpt-5.6-sol`; structured candidate schema | The model sees an uploaded book image and proposes editable metadata. AI never writes inventory directly. |
| Embeddings | OpenAI embeddings adapter targeting `text-embedding-3-small`; 1,536 dimensions | Small, economical embeddings with a dimension that the local vector table can enforce. |
| Contract | Versioned OpenAPI document plus contract tests | Central compatibility is a public boundary, not an accidental reflection of internal routes. |
| Tests | Vitest, Fastify `inject`, temporary SQLite files, adapter fakes | Fast, repeatable evidence without live credentials; optional live smoke tests remain separate. |
| Logging | Fastify/Pino structured logs with request IDs; never log image bytes or secrets | Useful local/deployment diagnostics with a clear privacy boundary. |

Primary documentation checked before this decision: [Node SQLite](https://nodejs.org/api/sqlite.html), [sqlite-vec JavaScript bindings](https://alexgarcia.xyz/sqlite-vec/js.html), [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [OpenAI models](https://developers.openai.com/api/docs/models), [vision inputs](https://developers.openai.com/api/docs/guides/images-vision), and [embeddings](https://developers.openai.com/api/docs/guides/embeddings).

## Boundaries and ownership

```text
HTTP/OpenAPI controllers
        |
application use cases -------- identity/policy ports
        |
domain entities + errors
        |
repository ports -------------- AI/vector/discovery ports
        |                              |
SQLite repositories       OpenAI, sqlite-vec, Central adapters
        \______________________  ______/
                               \/
                         composition root
```

| Boundary | Owns | Must not own |
|---|---|---|
| Contract | Paths, methods, schemas, status codes, compatibility version | SQL tables or model prompts |
| Controller | Parse/validate input, invoke one use case, map domain errors | Business rules or persistence |
| Application service | CRUD, candidate approval, search, and discovery workflows | Fastify request objects or SQL |
| Domain | Box, book, candidate, location, and lifecycle invariants | Framework or vendor SDK types |
| Repository port | Persistence operations expressed in domain terms | SQLite-specific syntax |
| SQLite adapter | SQL, transactions, migrations, row mapping | HTTP status codes |
| OpenAI adapter | Responses request, strict candidate parsing, embeddings request | Inventory mutation |
| Vector adapter | Representation version, vector writes, KNN queries, relational filters | Book CRUD ownership |
| Discovery adapter | Registry payload, heartbeat policy, compatibility version | UI navigation behavior |
| Composition root | Configuration, secrets, concrete dependency wiring | Product behavior |

## Data design

The first migration creates:

- `boxes`: UUID, name, description, latitude, longitude, created/updated timestamps;
- `books`: UUID, box UUID, title, authors JSON, ISBN, description, status, cover reference, extraction provenance, timestamps;
- `scan_candidates`: UUID, state, proposed fields JSON, confidence/provenance JSON, image metadata, approved book UUID, timestamps;
- `book_embeddings`: book UUID, representation version, source hash, model, dimensions, embedded timestamp;
- a sqlite-vec virtual table keyed to the embedding record for 1,536-dimension float vectors;
- `schema_migrations` and `node_metadata` for deterministic upgrades and node identity.

Foreign keys are enforced. Deleting a non-empty box returns a domain conflict instead of cascading. Book deletion removes its vector in the same transaction. Candidate approval is idempotent and is the only candidate operation allowed to create a book.

`book-search-v1` is the canonical embedding representation: normalized title, authors, ISBN, description, box name, and public status. The source hash prevents unnecessary re-embedding. A representation-version change creates new embeddings before the old version is retired.

## Vector proof requirements

Before Phase 1.5A is considered complete, an automated integration test must prove all of the following against the real extension:

- a 1,536-element vector can be inserted;
- KNN distance ordering returns the expected fixture;
- results can be limited to a selected box through a relational join/filter;
- deleting a book removes the searchable vector;
- an embedding with the wrong dimension is rejected;
- rebuilding `book-search-v1` embeddings is deterministic and resumable.

For the hackathon-sized dataset, exact KNN is the deliberate default. An ANN index is not justified until measurements show it is needed.

## OpenAI behavior

Image extraction is a proposal workflow:

1. validate file type and the 10 MiB limit;
2. send the image and constrained task to the Responses API;
3. parse a strict schema into a `draft` candidate;
4. let the human correct or reject it;
5. approve once to create the book; and
6. embed the approved record asynchronously from the inventory transaction boundary.

The OpenAI and embedding clients are ports. Tests use deterministic fakes and assert the exact request/response boundary. A credential-gated smoke test may exercise the live models, but ordinary test runs never require an API key. When OpenAI is unavailable, manual CRUD remains fully operational and candidates report a retryable failure without fabricating metadata. When embeddings fail, keyword search remains available and records are marked pending for retry.

## Operations

- Configuration is environment-driven and validated at startup. Secrets are never stored in the database or committed.
- The database defaults to a mounted `data/lll-node.sqlite` path. Startup applies forward-only migrations before serving traffic.
- Backup is a SQLite-safe backup/checkpoint operation plus copied media metadata. Restore is verified by opening the copied database, checking migrations, and running integrity checks.
- The Phase 1.5A API runs as one process. Extraction and embedding are explicit job interfaces executed in-process for the reference build; a durable queue can replace that adapter without changing use cases.
- Uploaded bytes are transient in Phase 1.5A. Persisted cover storage is deferred until the UI slice selects local filesystem or object storage.
- Health separates liveness from readiness. Readiness checks the database, migrations, and vector extension; it does not fail merely because OpenAI is temporarily unavailable.
- Registration and heartbeat are disabled by default. Enabling discovery requires an HTTPS public endpoint, node coordinates representing the service-area centroid, compatibility metadata, and explicit operator consent.
- Central considers a node active according to its current heartbeat policy (target: heartbeat within 24 hours and fewer than three consecutive failures). The node does not claim federation or replication.

## Security and privacy

Public compatible routes are read-only. Local mutation routes require the node's management identity boundary; Central credentials never grant mutation rights on the node. Phase 1.5A provides the policy/service seams and test identities, while production identity wiring is completed with the UI/deployment slice.

Coordinates describe the public box or service area, not a private residence by default. Image bytes are not retained after extraction unless a later storage choice is explicitly enabled. AI provenance is stored with candidates and approved books. Logs redact authorization values and exclude images and raw model payloads.

## Alternatives considered

| Alternative | Decision |
|---|---|
| Postgres plus pgvector | Rejected for the reference node because it adds a server and deployment burden; the repository/vector ports preserve a later migration path. |
| `better-sqlite3` | Rejected because Node 24 provides the required SQLite and extension APIs directly. |
| An ORM | Rejected for this small schema because explicit SQL better exposes migrations, joins, transactions, and vector behavior to learners. |
| Store image vectors in Phase 1.5A | Deferred. Vision is used for structured extraction; searchable book embeddings are text representations of approved inventory. |
| Let the model create books directly | Rejected. It breaks human control, auditability, and idempotency. |
| Replicate inventory into Central | Rejected. The approved demo relies on Central live aggregation and refresh. |

## Stage audit

- Fit: PASS — every component maps to approved behavior or an acceptance row.
- Ownership: PASS — every external technology is behind one adapter boundary.
- Operations: PASS — deploy, migrate, back up, restore, readiness, and degraded modes are specified.
- Learning: PASS — SQL, contracts, and service seams remain visible; agent work is reviewable at each vertical slice.

## Phase 1.5C Assorted Things amendment

Migration 002 adds `assorted_captures`, separate from `scan_candidates` and `books`. The reference media adapter stores bounded original bytes in the same SQLite file for one-file portability; the application port permits a later filesystem or S3 adapter. Capture does not invoke AI; a human describes the retained photo. State is `pending_review`, `confirmed`, or `rejected`; confirmation is idempotent, audited, and never creates inventory.

Images and metadata remain behind the local operator realm until human confirmation and outside the six public LLL compatibility reads. OpenAI remains available only to the separately bounded book scanner and embedding adapter.

The UI uses code-native CSS tokens with Garden, Terminal, and Cosmic themes and browser-local persistence. Theme state is a presentation adapter concern and does not enter SQLite or public contracts.
