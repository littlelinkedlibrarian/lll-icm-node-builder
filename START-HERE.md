# Start here: learn to build with an agent

This repository teaches you how to make decisions with a coding agent and build a library application in small, reviewed stages. You do not need to reproduce LLL Central, use AI, or join a network to finish a useful project.

## Choose your first activity

| I want to… | Start with | First outcome |
|---|---|---|
| Learn by building my own app | Say `setup`, then use the new-project prompt below | A reviewed brief for one small feature |
| Explore a completed example | README → local Docker quickstart → `stages/05-build/output/node-project/README.md` | Run and inspect the Happy Box reference app |
| Use the hosted Central API | [Central capability guide](https://beta.littlelinkedlibrarian.com/integrations) | Read public box/book data without running a server |
| Connect my independent node | `shared/connection-paths.md`, then Stage 07 after validation | A candidate manifest for human review |

New-project prompt:

> Read AGENTS.md and CONTEXT.md. I am starting a new learning run, not resuming the checked-in Happy Box example. Preserve that example. Guide me through setup and Stage 01 for a small local catalog. Ask which work I want to do myself. Do not inherit the example's approvals, configured profile, account details or completed-stage status. Explain the first artifact before writing application code.

The checked-in `_config/builder-profile.md` and stage outputs describe a completed reference run. They are examples, not your decisions. Work in your own fork/branch; have the agent explicitly identify your run and obtain approval before replacing example artifacts. A multi-run workspace/reset command is not implemented.

## How an agent traverses the repository

1. `AGENTS.md` gives global rules and command triggers.
2. Root `CONTEXT.md` maps your task to a stage or a reference.
3. Each `stages/NN-name/CONTEXT.md` has an Inputs table, process, checkpoint, audit and outputs.
4. The agent reads only the input files and sections needed for that stage.
5. You review the output artifact, correct it, and approve the next stage.

The tables are context-routing instructions, not a runtime library or an MCP server. You do not need a CONTEXT.md in every source directory. Generated application code has its own architecture; use the approved Stage 03 architecture to navigate it.

## Keep the first build small

Start with one box, manually add one book, list it, edit it and find it again after restarting. Choose AI scanning, semantic search, accounts, public hosting or LLL connectivity only when your own goal needs them. The reference example's TypeScript, SQLite and OpenAI choices are not requirements for your new app.

Before making a public deployment, review the example's demo flags and permissions. Public-demo mode is for disposable shared data and deliberate access; do not use it as a model for private accounts or production security.

## Keep the three contracts separate

- **Your product contract:** the behavior you approve in Stage 02.
- **LLL Lite compatibility:** six public read routes needed for the optional connected path.
- **Central's API:** a larger hosted service with its own identities, scan sessions, vaults and journeys.

Read [Central capability lessons](shared/central-capabilities.md) only if those lessons apply to your chosen feature. More Central endpoints do not mean a beginner node needs more features.

## Current review evidence

See [the learning-entry review](docs/reviews/LEARNING-ENTRY-REVIEW.md). The reference app’s clean install is currently blocked on Node 24.12.0/npm 11.6.2 by missing lockfile entries; the older test count in the README is historical evidence, not a fresh check. Instruction-only learning can proceed independently.
