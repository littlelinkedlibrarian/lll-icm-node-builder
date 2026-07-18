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

## Hybrid own-domain and LLL-compatible node

This is the recommended connected path. Treat brand ownership and network compatibility as separate surfaces:

- `uiUrl` is the owner's branded application, such as `https://mylittlebox.com`.
- `apiBaseUrl` is the versioned LLL interoperability adapter.
- Product routes, identity, writes, datastore, and private data remain owner-controlled.
- The adapter exposes only approved network capabilities and public or explicitly shared data.
- Disabling the adapter never prevents local operation.

Do not infer the UI URL from the API URL. Record both explicitly with contract version, capabilities, privacy tier, and geographic coverage.

## LLL-hosted node

Use this learning path when the learner is not ready to manage a domain, DNS, TLS, or hosting. LLL may provide a delegated hostname such as `happybox.littlelinkedlibrarian.com` and operate the platform boundary while the learner owns the node's content and approved product decisions.

Hosted placement is not automatic network approval. Keep operator identity, tenant isolation, credentials, backup, export, deletion, portability, limits, and graduation to an owner-controlled domain explicit. A hosted node may run inside the managed Kubernetes/Istio environment, but application domain code must not depend on Istio.

## Network registration

Compatibility is not membership. Verify contract evidence, stable TLS endpoint, truthful privacy and capabilities, separate node credentials, safe timeouts, and no secrets. A human reviews operator, location, visibility, endpoint, and capability data. Claim membership only after approval.

## Federation

Discovery is an adapter, not a Kubernetes, Istio, or registry dependency in domain code. Define query visibility, authentication, timeouts, concurrency, partial results, source labels, deduplication, cache, and abuse controls. Remote data never silently becomes local canonical data.

The application registry owns approval, operator, privacy, location, capabilities, contract version, heartbeat, and public URLs. Istio owns managed transport policy, retries, circuit breaking, telemetry, and optional mesh identity. External HTTPS nodes join through the application contract; full mesh membership is an optional managed deployment mode.
