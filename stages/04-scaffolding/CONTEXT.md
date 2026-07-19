# Stage 04: Scaffolding

Generate only the approved project structure, contracts, configuration boundaries, and learning handoffs.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Specification | `../02-specification/output/product-spec.md` | Full file | Public behavior |
| Acceptance | `../02-specification/output/acceptance-matrix.md` | Full file | Test skeleton |
| Architecture | `../03-architecture/output/architecture.md` | Full file | Approved structure |
| Build plan | `../03-architecture/output/build-plan.md` | Full file | Ownership and order |
| Boundaries | `../../shared/engineering-boundaries.md` | Owners and Discipline | Separation rules |

## Process

1. Create the project under `output/node-project/`.
2. Add public contracts and tests before concrete feature behavior.
3. Add directories, interfaces, composition root, configuration schema, secret-safe environment template, migration shell, and run instructions required by the architecture.
4. For every approved box or book UI, scaffold a dedicated primary card control, its entity detail modal, and a sibling operator action region; never nest edit/delete inside the primary control.
5. Scaffold browser-structure tests that assert both detail modals and single-action routing before concrete CRUD behavior.
6. In skeleton mode, leave approved learner tasks explicit and test-described.
7. In pair or complete mode, add only enough implementation for the project to compile or boot without pretending features are complete.
8. Record generated files, unresolved placeholders, and the Stage 05 entry point.

## Audit

| Check | Pass condition |
|---|---|
| Scope | No unapproved feature or technology appears |
| Boundaries | Structure matches architecture owners |
| Secrets | No credential value is generated or committed |
| Runnable | Approved scaffold command compiles or boots as designed |
| Learnable | Learner tasks are bounded and explained |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Project scaffold | `output/node-project/` | Chosen stack |
| Scaffold report | `output/scaffold-report.md` | Markdown |
