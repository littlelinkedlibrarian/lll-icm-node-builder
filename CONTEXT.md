# Workspace routing

Build a library application or LLL-compatible node through a sequential, human-reviewed ICM pipeline.

## Task routing

| Task | Go to | Purpose |
|---|---|---|
| Configure builder | `setup/questionnaire.md` | Set factory preferences once |
| Define project | `stages/01-discovery/CONTEXT.md` | Capture outcome and constraints |
| Define behavior | `stages/02-specification/CONTEXT.md` | Create product contracts |
| Choose architecture | `stages/03-architecture/CONTEXT.md` | Make implementation decisions |
| Create skeleton | `stages/04-scaffolding/CONTEXT.md` | Generate approved structure |
| Implement | `stages/05-build/CONTEXT.md` | Build vertical slices |
| Prove | `stages/06-validation/CONTEXT.md` | Run external checks |
| Package or connect | `stages/07-release/CONTEXT.md` | Prepare release or registration |

## Reference routing

| Need | Canonical source |
|---|---|
| ICM structure | `shared/icm-conventions.md` |
| LLL domain | `shared/lll-domain.md` |
| Engineering boundaries | `shared/engineering-boundaries.md` |
| OpenAI and vectors | `shared/openai-capabilities.md` |
| Deployment and network | `shared/connection-paths.md` |
| Completion evidence | `shared/quality-policy.md` |

## Handoff

Complete stages in order. Review each output before continuing. Human-edited artifacts are authoritative.
