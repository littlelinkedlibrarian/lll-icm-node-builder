# LLL ICM Node Builder

This is an Interpretable Context Methodology workspace for producing library applications and LLL-compatible nodes. The filesystem is the orchestration layer. Do not look for a hidden reference application.

## Folder map

```text
CONTEXT.md                  workspace router
setup/                      one-time factory configuration
_config/                    stable builder preferences
shared/                     stable ICM, LLL, OpenAI, and quality references
stages/01-discovery/        define learner and outcome
stages/02-specification/    define observable behavior
stages/03-architecture/     choose implementation and operations
stages/04-scaffolding/      create approved skeleton
stages/05-build/            implement approved vertical slices
stages/06-validation/       verify outside the application
stages/07-release/          package own-domain or LLL path
```

## Triggers

| Keyword | Action |
|---|---|
| `setup` | Run `setup/questionnaire.md` and populate `_config/builder-profile.md` |
| `status` | Report COMPLETE or PENDING for every stage with artifact names |
| `build a node` | Read `CONTEXT.md`, then enter Stage 01 |
| `continue` | Enter the next pending stage after human approval of the previous artifact |

## Routing

Read `CONTEXT.md` on entry. For a stage, load only the files and sections named in that stage's Inputs table. Never load all stages or references by default.

Stage `CONTEXT.md` files route context. Stable rules have one canonical home in `_config/` or `shared/`. Per-run artifacts live in stage `output/` folders.

## Execution rules

- One stage, one job.
- Use plain Markdown or JSON handoffs.
- Human edits at a stage boundary are authoritative.
- Keep references one-way and non-circular.
- Point to canonical rules instead of duplicating them.
- Do not use previous runs as quality templates.
- Run each audit before writing output.
- Pause at every checkpoint.
- Do not create application code before Stage 04.
- Do not exceed the approved Stage 02 specification or Stage 03 architecture.
- Use ordinary tools for deterministic mechanical work.

## Compatibility

`AGENTS.md` is the canonical Layer 0 file. `CLAUDE.md` is a compatibility pointer only.
