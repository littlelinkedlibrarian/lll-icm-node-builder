# Stage 06: Validation

Verify the built project against its contracts, user journeys, operations, and selected compatibility path.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Project | `../05-build/output/node-project/` | Full project | Validation target |
| Build report | `../05-build/output/build-report.md` | Full file | Claimed evidence |
| Specification | `../02-specification/output/product-spec.md` | Full file | Behavior authority |
| Acceptance | `../02-specification/output/acceptance-matrix.md` | Full file | Test matrix |
| Architecture | `../03-architecture/output/architecture.md` | Operations and degraded modes | Operational targets |
| Quality | `../../shared/quality-policy.md` | Selected evidence floors | Completion rules |

## Process

1. Start from a clean checkout or equivalent clean project state.
2. Run static checks, unit tests, integration tests, external contract tests, and selected end-to-end journeys.
3. Test restart persistence, OpenAI outage, network outage, and missing-vector behavior when applicable.
4. Run secret, dependency, license, migration, backup, restore, health, and recovery checks required by the architecture.
5. Compare observed evidence with every acceptance row.
6. Mark failures without weakening the specification. Fix Stage 05 output and rerun this stage.

## Audit

| Check | Pass condition |
|---|---|
| Reproducible | Commands and observed results are recorded |
| External | Public behavior is tested outside core services |
| Complete | Every acceptance row is PASS or explicitly BLOCKED |
| Honest | No successful report exists while required checks fail |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Validation report | `output/validation-report.md` | Markdown evidence table |
