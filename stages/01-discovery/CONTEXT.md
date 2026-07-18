# Stage 01: Discovery

Define one node project, its learner relationship, and the problem worth solving.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Builder profile | `../../_config/builder-profile.md` | Full file | Durable ownership and preference rules |
| LLL domain | `../../shared/lll-domain.md` | Minimum useful outcome and Capability ladder | Bound the product discussion |
| Current run | User's request and answers | Full current request | Per-run working context |

## Process

1. Verify setup is complete. If not, route to `setup`.
2. Ask per-run questions about audience, first user journey, learner versus agent work, preferred technology, data ownership, privacy, offline needs, OpenAI capabilities, and semantic search.
3. Present independent own-domain, standalone LLL-compatible, hybrid own-domain plus LLL, LLL-hosted, and advanced managed-mesh paths. Record who owns domain or delegated hostname, DNS, TLS, hosting, data, credentials, backups, export, deletion, and migration to another host.
4. For connected paths, decide whether location means one box, a node centroid, or multi-box coverage; decide whether unknown-location results participate in proximity searches and how heartbeat freshness affects discovery.
5. Derive choices that follow from prior answers. Do not ask redundant questions.
6. Separate the minimum useful slice from optional capabilities.
7. State conflicts between requested outcomes and acceptable complexity.
8. Draft the node brief.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 6 | Minimum slice, connection path, capability options, and ownership split | Approve, remove, or defer capabilities |

## Audit

| Check | Pass condition |
|---|---|
| Outcome | One audience and first user journey are concrete |
| Ownership | Learner and agent work are explicit |
| Connection | Hosting ownership, public URLs, geographic meaning, and graduation path are explicit |
| Complexity | AI, vectors, identity, deployment, and network are selected or deferred |
| Non-goals | At least the excluded advanced features are named |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Node brief | `output/node-brief.md` | Markdown with decisions, non-goals, and open questions |
