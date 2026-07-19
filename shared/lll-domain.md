# Little Linked Librarian domain

## Minimum useful outcome

A person can represent a library box or collection, record books or approved items, see what belongs there, and find the record again.

Authentication, AI, vectors, public deployment, and federation are capability choices.

## Capability ladder

1. Local catalog: box, item placement, exact search, export, backup, deletion.
2. Owned deployment: identity, persistence, domain, TLS, migrations, backup, restore, updates.
3. OpenAI capture: image candidates, evidence, confidence, human confirmation, manual fallback.
4. Semantic discovery: meaning-based, multilingual, recommendation, or similarity behavior.
5. Collaboration: consistent actors, scoped credentials, staged writes, provenance, audit.
6. LLL compatibility: pinned contract, external conformance, truthful node behavior.
7. Federation: approved nodes, authenticated transport, partial results, source labels, rate limits.

## Advanced lessons

- Queue scans that can outlive normal requests.
- Put correlation identifiers in job state and logs.
- Separate identity images from confirmation evidence.
- Hash uploads for idempotency, not semantic identity.
- Preserve location source, precision, and consent.
- Regenerate multilingual embeddings after approved translation changes.
- Keep metadata, storage, OpenAI, and discovery behind adapters.
- Route agent writes through normal permission paths.
- Treat registry and mesh discovery as provider choices.

## Assorted Things and other approved items

An Assorted Things capture is box-scoped photo history, not a book or book journey. Preserve the original, time, box, human label/note, proposed fields, uncertainty, provenance, and reviewer decision. Save the manual record before enrichment, keep AI optional, and never let enrichment failure block capture.

Use separate entities, prompts, review queues, and routes for captures and books even when one destination-first scanner selects between them. Confirmation records human review; it never creates a book. Pending and rejected captures remain protected. A confirmed capture may become visible through the owning box own-domain inventory, including a zoomable image, but remains outside the LLL Central compatibility contract unless that contract is explicitly revised. Ask the learner whether media belongs in SQLite, local files, or object storage based on scale, backup, and deployment needs; keep that choice behind a port.
