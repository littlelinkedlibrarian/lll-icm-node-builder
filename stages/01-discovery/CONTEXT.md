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
2. Ask per-run questions about audience, first user journey, learner versus agent work, preferred technology, deployment target, connection path, data ownership, privacy, offline needs, OpenAI capabilities, and semantic search.
3. Derive choices that follow from prior answers. Do not ask redundant questions.
4. Separate the minimum useful slice from optional capabilities.
5. State conflicts between requested outcomes and acceptable complexity.
6. Draft the node brief.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 4 | Minimum slice, capability options, and ownership split | Approve, remove, or defer capabilities |

## Audit

| Check | Pass condition |
|---|---|
| Outcome | One audience and first user journey are concrete |
| Ownership | Learner and agent work are explicit |
| Complexity | AI, vectors, identity, deployment, and network are selected or deferred |
| Non-goals | At least the excluded advanced features are named |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Node brief | `output/node-brief.md` | Markdown with decisions, non-goals, and open questions |
