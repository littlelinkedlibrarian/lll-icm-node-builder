# LLL ICM Node Builder

An instruction-driven workspace using Jake Van Clief and David McDermott's Interpretable Context Methodology (ICM) to guide one coding agent through building a library node.

The repository remains instruction-first: numbered folders are the orchestration layer. A generated reference run is checked in as evidence that the method produces a working application; it is not a required technology stack. Each stage reads explicitly routed context, writes a plain-file artifact, and pauses where human judgment matters. The next stage reads the reviewed artifact.

## What it can produce

- a skeleton the learner implements
- a paired learner and agent build
- a complete application in any suitable language and datastore
- an independent library app for the learner's domain
- a standalone LLL-compatible node
- a hybrid node with its own branded domain and an LLL interoperability adapter
- an LLL-hosted node for learners who are not ready to manage DNS or hosting
- a node prepared for human-reviewed LLL network registration

AI is optional. When selected, generated AI features use OpenAI models. Vector infrastructure is introduced only when an approved user experience needs semantic, multilingual, recommendation, deduplication, or similarity behavior.

## Start

Open the repository with a coding agent and say:

> setup

The agent asks the one-time factory questionnaire in `setup/questionnaire.md` and writes durable choices to `_config/builder-profile.md`.

Then say:

> Build a library node with me.

The agent enters `stages/01-discovery/CONTEXT.md` and moves through the pipeline. Inspect or edit each artifact in its stage's `output/` folder before continuing.

Use `status` to see completed and pending stages.

## Pipeline

```text
01-discovery -> 02-specification -> 03-architecture -> 04-scaffolding
             -> 05-build -> 06-validation -> 07-release
```

The current generated reference application lives under [`stages/05-build/output/node-project`](stages/05-build/output/node-project/). Future runs write their selected implementation under `stages/05-build/output/` without inheriting its language or datastore. Release evidence and any candidate LLL registration artifacts live under `stages/07-release/output/`.

The application-focused Build Week phases and Central companion demo are described in [`docs/HACKATHON-APPLICATION-PLAN.md`](docs/HACKATHON-APPLICATION-PLAN.md). The completed local 1.5B application narrative is in [`docs/PHASE-1.5B-APPLICATION.md`](docs/PHASE-1.5B-APPLICATION.md).

## Context layers

- Layer 0: `AGENTS.md`, global identity and routing
- Layer 1: `CONTEXT.md`, workspace task routing
- Layer 2: stage `CONTEXT.md` files, inputs/process/outputs contracts
- Layer 3: `_config/` and `shared/`, stable rules and references
- Layer 4: stage `output/` folders, per-run working artifacts

Agents load only the files named by the current stage.

## Attribution

This workspace adapts the open-source ICM and Model Workspace Protocol conventions:

- [Interpretable Context Methodology paper](https://arxiv.org/abs/2603.16021)
- [ICM reference repository](https://github.com/RinDig/Interpreted-Context-Methdology)

The LLL domain references are original adaptations informed by the Little Linked Librarian projects.

## License

MIT. See `LICENSE`.

## Phase 1.5D reference experience

The checked-in reference run includes Happy Box at `66 Colon Ave, St. Augustine, FL 32084`, a destination-first scanner for Books or Assorted Things, and Garden, Terminal, and Cosmic themes. One cover or shelf image creates a bounded set of book candidates reviewed together, with edits only where needed. Assorted Things uses human-only photo capture and description; confirmed puzzles, note cards, art, and trinkets appear as zoomable inventory inside their box; pending and rejected captures remain private and all Assorted Things stay outside the Central compatibility profile.
