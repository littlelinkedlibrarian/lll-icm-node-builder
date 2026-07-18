# Hackathon and Federation Plan

## Outcome

Demonstrate that one ICM-guided agent can help a learner build a useful library application, keep it on an independent domain, host it on an LLL-provided subdomain, connect it to the LLL network, or combine those paths without changing its internal language or datastore.

The hackathon story follows one box from learning and local ownership to optional federation. LLL Central remains a network participant and discovery gateway rather than the owner of every node's canonical data.

## Architecture decisions

1. PostgreSQL remains Central's authoritative node registry.
2. Istio is the managed transport, security, routing, resilience, and telemetry layer.
3. External HTTPS nodes do not need to join the Kubernetes mesh.
4. Managed hosted nodes may use Istio workload identity as an advanced deployment profile.
5. Node eligibility combines approval, privacy, heartbeat freshness, health, proximity, and capabilities.
6. Central local search and remote federation remain separate providers coordinated by a federated search service.
7. Nodes perform their own semantic search. Central merges ranks rather than assuming raw vector scores from different nodes are comparable.
8. The interoperability OpenAPI profile does not prescribe language, application framework, database, or UI.

## Repository roles

| Repository | Role |
|---|---|
| `lll-icm-node-builder` | Agent instructions, learner decisions, interoperability learning path, conformance and release guidance |
| `lll-central` | Registry, discovery, aggregate and federated search coordination, hosted-node control plane, Central UX, Istio reconciliation |
| `lll-lite-standalone` | Reference provider implementation and conformance target |
| `lll-network-nodes` | Human-reviewed registration manifests and registry workflow until absorbed by a versioned control-plane process |

## Phase 0: Baseline and evidence

- Preserve the deployed Central `main` branch.
- Mirror Central history to a private `lll-central` repository without replacing its deployment remote.
- Publish this ICM workspace as a private repository.
- Record build, OpenAPI, unit, integration, and environment-dependent validation separately.
- Do not promote merge-only history when branch trees are already identical.

Exit evidence: private repositories exist, default branches are protected by convention, and phase branches have named owners and validation gates.

## Phase 1: Hybrid path and discovery correctness

ICM work:

- Add independent, compatible, hybrid, LLL-hosted, and advanced mesh deployment choices.
- Ask who owns domain, DNS, TLS, hosting, data, OpenAI use, and operations.
- Keep product API and LLL interoperability adapter separate.

Central work:

- Translate aggregate `lat/lng` inputs to discovery `nearLat/nearLng` correctly.
- Define missing and zero-coordinate behavior.
- Separate administrative status from heartbeat freshness and observed reachability.
- Filter discovery by privacy, heartbeat freshness, observed health, and proximity.
- Add aggregate-level proximity and stale-node tests.

Exit evidence: eligible nodes are selected deterministically from documented policy.

## Phase 2: LLL node interoperability contract

- Publish a strict, versioned aggregator-facing OpenAPI profile.
- Define health, capabilities, books, boxes, box books, search, pagination, errors, authentication, source identity, `uiUrl`, and `apiBaseUrl`.
- Persist canonical capability identifiers and add capability-aware discovery only after that profile is pinned.
- Keep node control-plane endpoints separate from catalog and search endpoints.
- Add provider conformance tests usable by any stack.
- Add Central consumer-driven tests and a real Central-to-reference-node integration test.

Exit evidence: at least two independently structured providers pass the same suite.

## Phase 3: Federated keyword, semantic, and hybrid search

- Add a `FederatedSearchCoordinator` over local and remote providers.
- Select nodes using active, privacy, proximity, and capability policy.
- Send query text rather than raw embedding vectors.
- Use rank fusion across nodes and preserve node-local score metadata only for explanation.
- Apply result-level box distance after coarse node selection.
- Provide keyword fallback for nodes without vectors or during OpenAI outages.
- Preserve partial results, bounded concurrency, timeouts, and source attribution.

Exit evidence: a query returns Central and remote results, respects radius and privacy, and survives one offline node.

## Phase 4: Hosted learner nodes and Istio consolidation

- Offer delegated hostnames such as `<node>.littlelinkedlibrarian.com`.
- Define tenant isolation, quotas, secrets, backups, export, deletion, and graduation to an owner domain.
- Reconcile approved registry records into Istio egress or managed workload resources.
- Align manifests with the active `lll` namespace, `api` service, and runtime routes.
- Move Central internal traffic to strict mTLS after readiness validation.
- Use explicit SPIFFE principals for managed mesh identities and application signatures for external nodes.

Exit evidence: one managed hosted node and one external HTTPS node pass the same application interoperability contract.

## Phase 5: Hackathon demonstration and submission

Demo sequence:

1. Start with a learner describing a physical Free Little Library box.
2. Use the ICM checkpoints to choose build ownership, domain path, datastore, and optional OpenAI capabilities.
3. Generate or complete the node and run its external conformance suite.
4. Show it operating on its own branded or LLL-hosted domain.
5. Register it, advertise capabilities, and become eligible after human approval.
6. Search Central by text and proximity; show Central and remote results with source labels.
7. Open the remote result in the node's branded UI.
8. Explain how Codex accelerated contract extraction, implementation, testing, and learning handoffs.

Submission evidence:

- Working project and public judge-ready repository or approved private access
- Setup instructions and sample data
- Less-than-three-minute public demo video
- Codex and model-use explanation
- Contract and conformance evidence
- Session feedback identifier
- License and judge testing path

## Coordinated branch map

Branches are phase lanes, not promises that incomplete work is releasable. Central phase branches start from the mirrored `staging` tree; ICM phase branches start from `main`. Each phase should merge through a reviewed pull request after its exit evidence passes.

| Phase | `lll-icm-node-builder` | `lll-central` |
|---|---|---|
| 1 | `phase/01-hybrid-learning-path` | `phase/01-discovery-correctness` |
| 2 | `phase/02-interop-conformance` | `phase/02-node-interop-contract` |
| 3 | `phase/03-federated-search-learning` | `phase/03-federated-search` |
| 4 | `phase/04-hosted-node-learning` | `phase/04-istio-hosted-nodes` |
| 5 | `hackathon/build-week-submission` | `hackathon/build-week-submission` |

## Promotion policy

1. Keep Central's deployment remote and GitHub planning remote distinct until cutover is intentional.
2. Never merge directly into deployed `main` from an unvalidated phase branch.
3. Require OpenAPI lint, build, focused unit tests, provider/consumer conformance, and the relevant integration journey.
4. Classify missing infrastructure as blocked evidence, not a passing test and not automatically an application failure.
5. Promote sequentially: phase branch to `staging`, validate a release candidate, then merge the validated tree to `main`.
6. Tag the hackathon release and retain rollback instructions.

## Deferred work

- Raw embedding exchange between nodes
- Mandatory Istio mesh expansion for independently hosted nodes
- Central ownership of remote canonical book records
- Global identity federation beyond signed node requests
- Large-scale public metadata indexing until consent, freshness, and deletion semantics are approved
