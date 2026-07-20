# Little Linked Librarian domain

## Minimum useful outcome

A person can represent a library box or collection, record books or approved items, see what belongs there, and find the record again.

Authentication, AI, vectors, public deployment, and federation are capability choices.

A personal vault, patron account, checkout history, or private collection may be useful in a larger product, but none is required for a useful node or for LLL compatibility unless the selected contract explicitly says otherwise. Do not copy Central-only identity or vault behavior into a learner app by implication.

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

## Bibliographic identity and scan history

Treat the uploaded Books image as evidence and a private activity parent, not as the book cover. Persist it before extraction when retention is approved; connect every proposed, confirmed, rejected, or failed child result to that activity. Preserve the ability to inspect and zoom the original without making it public.

An ISBN identifies an edition, while title and author commonly identify a work with many editions. Accept a model ISBN only when visibly supported and checksum-valid. Otherwise request bounded edition proposals from the approved bibliographic adapter and require a human selection. Store provider identifiers, retrieval time, source URL, selected fields, and attribution. Cache low-volume lookups and keep manual confirmation available during provider failure.

Do not choose an edition automatically merely because a provider returned one result. Permit metadata lookup both during candidate review and later from an existing book detail view so a confirmed record can recover from an earlier provider outage or incomplete scan. Normalize every provider response at the adapter boundary before storing or presenting it.

Reference provider documentation:

- https://openlibrary.org/developers/api
- https://openlibrary.org/dev/docs/api/search
- https://openlibrary.org/dev/docs/api/covers

## Assorted Things and other approved items

An Assorted Things capture is box-scoped photo history, not a book or book journey. Preserve the original, time, box, human label or note, human-authored fields, and reviewer decision. Default to no AI object recognition: the photo exists so neighbors can look for themselves, while only human-confirmed metadata becomes public.

Use separate entities, prompts, review queues, and routes for captures and books even when one destination-first scanner selects between them. Confirmation records human review; it never creates a book. Pending and rejected captures remain protected. A confirmed capture may become visible through the owning box own-domain inventory, including a zoomable image, but remains outside the LLL Central compatibility contract unless that contract is explicitly revised. Ask the learner whether media belongs in SQLite, local files, or object storage based on scale, backup, and deployment needs; keep that choice behind a port.
