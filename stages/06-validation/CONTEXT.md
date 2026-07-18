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
4. For connected paths, prove product operation with the LLL adapter disabled; prove paired-coordinate validation, zero coordinates, unknown-location policy, stale heartbeat, health-failure exclusion, privacy, partial network failure, and that one application's user bearer token is not forwarded into another authentication realm.
5. For LLL-hosted paths, prove tenant isolation, delegated hostname and TLS, operator access, backup, export, deletion, rollback, and the documented graduation path.
6. Run secret, dependency, license, migration, backup, restore, health, and recovery checks required by the architecture.
7. Compare observed evidence with every acceptance row.
8. Mark failures without weakening the specification. Fix Stage 05 output and rerun this stage.

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
