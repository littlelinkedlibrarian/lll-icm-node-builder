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
