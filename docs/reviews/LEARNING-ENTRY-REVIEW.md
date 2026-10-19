# Learning-entry review — 2026-10-19

Reviewed the ICM routing, seven stage contracts, shared rules, reference-app API/service/persistence boundaries, deployment guidance and tests, plus the companion registry. This is a source/entry review, not a production certification or a fresh live AI quality evaluation.

## What works well

- The filesystem gives an agent a clear task router, scoped Inputs tables, human checkpoints and explicit artifacts.
- Learners can start without AI, accounts, vectors or federation; technology choices belong to the approved project.
- The reference application separates its six public compatibility reads from local operator management.
- Candidate confirmation and assorted-content confirmation persist through SQLite transactions; private review media is separate from public catalog reads in normal protected mode.
- Registry compatibility, admission, heartbeat and approval are explicitly separate; four registry tests and five manifest validations passed in this review.

## Learning rough edges

| Priority | Finding | Approach |
|---|---|---|
| High | The repository opens with a judge/demo walkthrough before the novice entry path | START-HERE now separates build, inspect example, consume Central, and connect paths |
| High | A configured profile and completed outputs can be mistaken for a new learner's approvals | New-run guidance explicitly preserves the example and requires fresh decisions; a multi-run/reset tool remains future work |
| High | Fresh `npm ci --ignore-scripts` failed on Node 24.12.0/npm 11.6.2: lockfile missing @emnapi/core and @emnapi/wasi-threads | Treat local execution as blocked on that toolchain until the lockfile is repaired and CI/check rerun; historical 24-test result is not fresh evidence |
| Medium | Connection reference pointed to an unavailable public lll-lite repository | Route to the checked-in reference contract and public registry profile, recording exact commit and the difference from Central |
| Medium | Example application and Central expose different paths, identities and MCP tools | New optional Central capability guide explains the boundary; do not import all Central features into a novice node |
| Medium | Root AGENTS said there was no reference application while README/code includes one | Clarify instruction-first architecture with the checked-in example as evidence, not the required stack |
| Medium | Broad example acceptance reports can obscure source/contract drift | Keep dated evidence and separately verify current behavior at HTTP and MCP boundaries |

## Next small implementation slices

1. Repair the reference lockfile and prove the documented clean checkout command.
2. Make confirmation policy shared across HTTP and MCP; choose explicitly whether missing description/edition is allowed. Current MCP imposes extra conditions relative to HTTP.
3. Review demo deployment access and resource limits before treating the example as a public production template. Public demo flags require deliberate operator management; they are not a complete account/permission model.
4. Expand compatibility checks from route presence and HTTP success to response schemas, visibility, pagination and empty-catalog detail coverage. A skipped check must remain visible.
5. Add a small new-run convention only if the documented branch/preservation workflow proves confusing; avoid a framework before learners need one.

This documentation slice changes no runtime API, deployment flags, admission policy or external accounts. It does not make Central source public.
