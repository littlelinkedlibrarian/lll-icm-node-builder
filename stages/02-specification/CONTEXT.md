# Stage 02: Specification

Turn the approved node brief into observable product and compatibility behavior.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Discovery | `../01-discovery/output/node-brief.md` | Full file | Approved direction |
| Boundaries | `../../shared/engineering-boundaries.md` | Outside inward and Owners | Contract ownership |
| Domain | `../../shared/lll-domain.md` | Selected capability sections only | Domain behavior |
| Connection | `../../shared/connection-paths.md` | Selected path only | Compatibility requirements |
| OpenAI | `../../shared/openai-capabilities.md` | Selected capabilities only | AI and vector behavior |
| Quality | `../../shared/quality-policy.md` | Specification | Acceptance floor |

## Process

1. Define user journeys and public behavior before implementation.
2. Write data ownership, identity, privacy, confirmation, error, and degraded-mode behavior.
3. If LLL compatibility is selected, locate and pin the current public contract revision. Record conflicts without resolving them silently.
4. Convert each required capability into observable acceptance criteria.
5. Map each behavior to a contract owner without selecting framework internals.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 4 | Product boundaries, network claims, and acceptance matrix | Approve what the application promises |

## Audit

| Check | Pass condition |
|---|---|
| Observable | Every requirement can be tested outside its implementation |
| Honest | Standalone, compatible, and network-member claims are distinct |
| Safe writes | Model or agent candidates require approved confirmation behavior |
| Scope | No deferred capability appears as required behavior |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Product specification | `output/product-spec.md` | Markdown |
| Acceptance matrix | `output/acceptance-matrix.md` | Markdown table |
