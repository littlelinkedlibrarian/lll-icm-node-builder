# LLL ICM Node Builder

An instruction-driven workspace using Jake Van Clief and David McDermott's Interpretable Context Methodology (ICM) to guide one coding agent through building a library node.

The repository remains instruction-first: numbered folders are the orchestration layer. A generated reference run is checked in as evidence that the method produces a working application; it is not a required technology stack. Each stage reads explicitly routed context, writes a plain-file artifact, and pauses where human judgment matters. The next stage reads the reviewed artifact.

## Judge quickstart

### Live experience

| Surface | URL | What to try |
|---|---|---|
| Happy Box node | [happybox.littlelinkedlibrarian.com](https://happybox.littlelinkedlibrarian.com) | Prepare the real box, scan a bundled shelf photo, review several GPT-5.6 candidates, confirm books, and search them semantically |
| LLL Central companion | [beta.littlelinkedlibrarian.com/boxes](https://beta.littlelinkedlibrarian.com/boxes) | Find the independently hosted Happy Box through the compatible network view and follow its branded link |
| Public MCP demo | `https://happybox.littlelinkedlibrarian.com/mcp` | Connect from ChatGPT developer mode and use the same canonical boxes, catalog, scanner, review, and activity services |

The live node is intentionally in a time-bounded, publicly writable hackathon mode. No account, operator token, or OAuth flow is required for the judge experience. Browser access and MCP access are controlled by separate explicit deployment flags; both are enabled for judging and must be disabled after the event. Writes affect the shared demo, so use disposable records where appropriate.

For the shortest product walkthrough:

1. Open the Happy Box node and choose **Prepare real demo**. This idempotently creates or refreshes the real box at `66 Colon Ave, St. Augustine, FL 32084`; it does not invent book records.
2. In **Scanner**, download one of the supplied shelf photos, select **Books** and Happy Box, then upload it. Review the multi-book GPT-5.6 result as one batch and confirm selected books.
3. Inspect book metadata, cover, AI description, parent scan image, and child decisions in Activity History. Try a Spanish, Simplified Chinese, Italian, or French semantic query.
4. Open LLL Central, find the Happy Box network card, inspect its current catalog, and return to the node through its branded link.
5. Connect the MCP endpoint in ChatGPT and ask it to list boxes or books. Then attach a book photo and ask it to analyze the image for Happy Box; review before confirming any write.

### Connect ChatGPT to MCP

Enable developer mode in ChatGPT, add a custom app/connector using `https://happybox.littlelinkedlibrarian.com/mcp`, and refresh its metadata if an older configuration is cached. The public demo flag permits the direct connection: OAuth is not required for this explicit judging deployment. The server exposes 10 tools plus an MCP Apps widget, including catalog discovery, maps, photo analysis, batch review, scan history, edition selection, and confirmed book creation.

### Run locally with Docker

Requirements: Docker with Compose and an OpenAI API key.

```bash
cd stages/05-build/output/node-project
cp .env.example .env
```

Edit `.env`: set `OPENAI_API_KEY`, change `HOST` to `0.0.0.0`, and keep `PUBLIC_BASE_URL=http://localhost:3000`. For ordinary protected local use, also replace `OPERATOR_TOKEN` with a long random value. Leave both public-demo flags `false` unless you deliberately want an unauthenticated local demo.

```bash
mkdir -p data backups
HAPPYBOX_ENV_FILE="$PWD/.env" \
HAPPYBOX_BIND_ADDRESS=127.0.0.1 \
HAPPYBOX_PORT=3000 \
HAPPYBOX_DATA_DIR="$PWD/data" \
HAPPYBOX_BACKUP_DIR="$PWD/backups" \
docker compose -f compose.production.yaml up --build
```

Open `http://localhost:3000`. Stop with `docker compose -f compose.production.yaml down`; the bind-mounted `data/` directory preserves the SQLite database and media.

### Sample photos and tests

The metadata-stripped judge photos are in [`stages/05-build/output/node-project/public/demo`](stages/05-build/output/node-project/public/demo/): one real Happy Box image and three real multi-book shelf images. Originals and EXIF/GPS metadata are not committed.

The automated suite uses temporary databases, deterministic OpenAI fakes, real `sqlite-vec`, Fastify request injection, and a real Streamable HTTP MCP client/server boundary:

```bash
cd stages/05-build/output/node-project
npm ci
npm run check
docker compose -f compose.production.yaml config
```

Expected result for the submitted revision: TypeScript passes and 24 tests across 9 files pass.

### Architecture summary

| Boundary | Submitted reference implementation |
|---|---|
| Browser | Responsive semantic HTML, CSS, and vanilla JavaScript with replaceable Garden, Terminal, and Cosmic themes |
| Application API | TypeScript on Node.js 24 with Fastify; browser and MCP adapters call the same application services |
| Persistence and search | Local SQLite plus `sqlite-vec`; media stays with its parent node and backups include database and files |
| OpenAI | GPT-5.6 for bounded multi-book vision extraction and descriptions; `text-embedding-3-small` for multilingual semantic retrieval |
| Metadata | Open Library edition lookup and cover discovery, with explicit human edition review before publication |
| ChatGPT | Streamable HTTP MCP endpoint and MCP Apps widget with strict declared tool schemas |
| LLL interoperability | Pinned Central-compatible OpenAPI reads and authenticated heartbeat, kept separate from the node's richer product API |
| Deployment | One Docker container behind a Cloudflare Tunnel; the app remains independently owned at its own domain |

The generated TypeScript application is one evidence-bearing run of the ICM instructions, not a stack requirement. The staged contracts keep UX, application services, persistence, vectors, OpenAI, MCP, and LLL compatibility replaceable so another learner and agent can choose a suitable language, framework, and datastore.

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

