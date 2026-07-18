# Connection paths

## Independent application

The owner defines API, brand, identity, privacy, host, domain, TLS, database, backups, updates, and OpenAI account. Do not add LLL behavior or claims unless requested.

## Standalone LLL-compatible node

1. Pin a published LLL contract revision.
2. Record source and revision.
3. Implement behavior independently of language and datastore.
4. Pass conformance tests outside the app.
5. Isolate sync, discovery, and heartbeat behind adapters.
6. Preserve local operation with network adapters disabled.

Inspect current public sources:

- https://github.com/littlelinkedlibrarian/lll-lite
- https://github.com/littlelinkedlibrarian/lll-network-nodes

Stop if contract and onboarding sources disagree.

## Network registration

Compatibility is not membership. Verify contract evidence, stable TLS endpoint, truthful privacy and capabilities, separate node credentials, safe timeouts, and no secrets. A human reviews operator, location, visibility, endpoint, and capability data. Claim membership only after approval.

## Federation

Discovery is an adapter, not a Kubernetes, Istio, or registry dependency in domain code. Define query visibility, authentication, timeouts, concurrency, partial results, source labels, deduplication, cache, and abuse controls. Remote data never silently becomes local canonical data.
