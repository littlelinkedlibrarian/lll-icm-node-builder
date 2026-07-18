# Stage 03: Architecture

Choose a stack and operational design that satisfy the approved specification.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Brief | `../01-discovery/output/node-brief.md` | Technology, ownership, deployment | Human constraints |
| Specification | `../02-specification/output/product-spec.md` | Full file | Required behavior |
| Acceptance | `../02-specification/output/acceptance-matrix.md` | Full file | Proof targets |
| Builder | `../../_config/builder-profile.md` | Full file | Durable preferences |
| Boundaries | `../../shared/engineering-boundaries.md` | Full file | Architecture constraints |
| OpenAI | `../../shared/openai-capabilities.md` | Selected sections | Current AI and vector choices |
| Connection | `../../shared/connection-paths.md` | Selected path | Deployment shape |

## Process

1. Research current primary documentation for candidate technologies.
2. Choose the smallest stack that satisfies approved behavior and learner goals.
3. Assign contract, controller, service, repository, adapter, and composition owners.
4. Decide persistence, migrations, backup, object storage, jobs, configuration, secrets, and observability.
5. If vectors are selected, prove the datastore supports model dimensions, distance, indexes, filters, and re-embedding. Otherwise omit vector infrastructure.
6. Split implementation into vertical slices and assign learner versus agent work.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 5 | Stack, operations burden, AI/vector decision, and alternatives | Approve complexity before scaffolding |

## Audit

| Check | Pass condition |
|---|---|
| Fit | Every architecture component traces to approved behavior |
| Ownership | Every boundary has one owner |
| Operations | Deploy, restore, and degraded modes are designed |
| Learning | Learner work matches the approved ownership mode |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Architecture decision | `output/architecture.md` | Markdown |
| Vertical-slice plan | `output/build-plan.md` | Ordered Markdown checklist |
