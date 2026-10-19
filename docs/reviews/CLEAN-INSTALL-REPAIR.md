# Reference clean-install repair — 2026-10-19

Scope: reproducibility of the existing Stage 05 reference app, not a new learner run, dependency upgrade, runtime feature or public demo deployment.

## Cause and change

`npm ci` rejected the lockfile because the dependency graph referenced missing entries for `@emnapi/core@1.11.3` and its `@emnapi/wasi-threads@1.2.3` dependency. `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` added exactly those two entries (23 lines). package.json and all pre-existing locked versions are unchanged.

## Evidence

Environment: Node 24.12.0, npm 11.6.2, Linux.

- `npm ci --ignore-scripts`: PASS after repair.
- `npm run check`: TypeScript PASS; 25 tests PASS across 9 files. Tests use isolated stores/provider doubles and the real MCP transport boundary; no live model calls or public writes.
- Exact README command `npm ci`: PASS with ordinary install scripts enabled.
- `git diff --check`: PASS.

`npm audit --omit=dev` reports 9 existing runtime dependency advisories (3 moderate, 5 high, 1 critical). These are dependency advisories, not proof every issue is exploitable in this app. They remain a separate scoped upgrade/security review; this repair does not claim a clean audit or production readiness. Do not run an unreviewed force upgrade as part of learning setup.

No hosted demo redeployment is necessary for the missing optional development dependency entries. Rollback is a lockfile/docs revert, which reintroduces the installation failure. Next work: review runtime advisories and the demo download/access safeguards, then unify HTTP/MCP confirmation policy.
