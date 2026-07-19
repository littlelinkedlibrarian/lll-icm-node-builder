# Hackathon reference node acceptance matrix

Status: APPROVED
Decision date: 2026-07-18

| ID | Required behavior | Contract owner | External evidence |
|---|---|---|---|
| SET-01 | A clean checkout installs and initializes without committed secrets | Release/setup | Clean-container setup test |
| BOX-01 | Operator creates a box and receives a stable ID | Product box API | API integration test and UI journey |
| BOX-02 | Public list and detail return visible box data and inventory count | Compatibility box API | OpenAPI conformance test |
| BOX-03 | Operator updates box fields and timestamps | Product box API | API integration test |
| BOX-04 | Coordinates are paired, ranged, and accept zero | Product box API | Boundary test matrix |
| BOX-05 | Deleting a non-empty box returns 409 without data loss | Box service | Service and API test |
| BOX-06 | Empty box deletion removes it from public reads | Product box API | API integration test |
| BOOK-01 | Operator creates a manual book in a selected box | Product book API | API integration test and UI journey |
| BOOK-02 | Public list/detail and box inventory use `{ data, pagination }` where applicable | Compatibility book API | Consumer/conformance tests |
| BOOK-03 | Operator updates and moves a book between boxes | Product book API | API integration test |
| BOOK-04 | Deleting a book removes it and its vector linkage | Book service/vector repository | Transactional integration test |
| BOOK-05 | Paging starts at 1, defaults to 20, and caps at 50 | Compatibility list contract | Contract boundary tests |
| AI-01 | JPEG, PNG, or WebP at or below 10 MiB can enter extraction | Candidate API | Upload validation tests |
| AI-02 | GPT-5.6 structured output becomes pending candidates only | Candidate service/OpenAI adapter | Adapter fixture and repository test |
| AI-03 | Invalid model output cannot create a candidate or book | Candidate service | Schema rejection test |
| AI-04 | Confirm requires actor, box, reviewed fields, and idempotency key | Candidate confirmation API | Permission and boundary tests |
| AI-05 | Retried confirmation returns the prior result without duplicate book | Candidate service | Idempotency integration test |
| AI-06 | Rejection is terminal and creates no book | Candidate service | State-machine test |
| VEC-01 | Confirmed searchable fields produce a 1,536-dimension vector with provenance | Embedding adapter/vector repository | Adapter and DB integration test |
| VEC-02 | Semantic query returns related visible books through `sqlite-vec` | Search service | Deterministic vector query test |
| VEC-03 | Missing or failed vectors never hide keyword results | Search service | Degraded-mode test |
| VEC-04 | Search reports semantic, keyword, or keyword fallback accurately | Search API | API integration test |
| DEG-01 | Manual CRUD works with OpenAI disabled | Product services | No-key end-to-end test |
| DEG-02 | Local operation works with Central adapter disabled | Composition/configuration | Disabled-adapter smoke test |
| COMP-01 | Health, books, boxes, and box inventory match the pinned profile | Compatibility adapter | External OpenAPI conformance |
| COMP-02 | Central aggregate reads identify the node source | Central companion | Central-to-node integration test |
| COMP-03 | Central refresh reflects current node data without replication | Central companion | Create/update/delete then re-query test |
| COMP-04 | Central bearer credentials are never accepted or forwarded as local auth | Auth boundary | Header-capture integration test |
| DISC-01 | Demo registration is public, fresh, healthy, and proximity-valid | Central registry/discovery | Registry and discovery evidence |
| LINK-01 | Central derived `uiUrl` opens the node branded UX | Deployment boundary | Browser journey |
| PRIV-01 | Private records and disallowed coordinates never enter public adapter responses | Visibility policy | Permission/conformance tests |
| AUD-01 | Candidate confirmation and CRUD writes record actor and correlation/idempotency data | Audit service | Repository integration test |
| REC-01 | Backup, restore, export, and deletion instructions are usable | Release packet | Observed recovery drill |
| MCP-01 | Phase 1.5B tools reuse application services and declare impact accurately | MCP adapter | Inspector and metadata tests |

## Stage 02 checkpoint

The owner-approved Phase 1.5 plan already selects these boundaries. Later changes that add capabilities, external services, retained image data, or new public writes require a new approval.

## Stage 02 audit

- Every required row has an observable external test.
- Product, compatibility, AI, vector, deployment, and Central owners are distinct.
- No deferred distributed capability appears as required behavior.
- Candidate confirmation is the only AI-to-canonical transition.
