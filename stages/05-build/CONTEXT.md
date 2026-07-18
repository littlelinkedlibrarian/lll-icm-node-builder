# Stage 05: Build

Implement the approved vertical slices according to the learner and agent ownership plan.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Scaffold | `../04-scaffolding/output/node-project/` | Full project | Build starting point |
| Scaffold report | `../04-scaffolding/output/scaffold-report.md` | Open tasks | Known state |
| Specification | `../02-specification/output/product-spec.md` | Full file | Behavior authority |
| Acceptance | `../02-specification/output/acceptance-matrix.md` | Full file | Proof targets |
| Architecture | `../03-architecture/output/architecture.md` | Full file | Boundary authority |
| Plan | `../03-architecture/output/build-plan.md` | Full file | Slice order and ownership |
| OpenAI | `../../shared/openai-capabilities.md` | Selected sections only | AI implementation policy |

## Process

1. Copy the scaffold to `output/node-project/`.
2. Implement one vertical slice at a time in the approved order.
3. Before each slice, state the boundary and learner versus agent work.
4. Run its focused tests and demonstrate its user-visible outcome.
5. Pause after each slice according to the builder profile.
6. Record decisions in the project rather than relying on chat history.
7. Stop when approved scope is complete. Do not add deferred features.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 4 for each slice | Working outcome, tests, decisions, and remaining work | Accept, revise, or take over learner tasks |

## Audit

| Check | Pass condition |
|---|---|
| Traceability | Every change maps to specification and plan |
| Boundaries | Controllers, services, repositories, and adapters retain ownership |
| Evidence | Focused tests ran and outcome was observed |
| Scope | Deferred capabilities remain absent |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Built project | `output/node-project/` | Chosen stack |
| Build report | `output/build-report.md` | Markdown with slice evidence |
