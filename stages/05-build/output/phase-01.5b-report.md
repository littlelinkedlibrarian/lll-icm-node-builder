# Phase 1.5B Build Report

Status: IMPLEMENTED locally; public deployment evidence remains Phase 1.5C
Date: 2026-07-18

## Completed slices

| Slice | Working outcome | Evidence |
|---|---|---|
| Shell and identity | Responsive own-domain page, branding metadata, node health, local operator token | Live `npm start`, UI route tests, separate unauthorized cases |
| Box UX | Cards, create/edit/delete, inventory counts, private management view | Browser/API handlers and integration tests |
| Map | Local coordinate plot plus list fallback, no external map provider | Browser asset and fixture coordinates |
| Book UX | Catalog, manual create/edit/move/delete | Browser/API handlers and existing transactional tests |
| Scanner | File selection, destination box, GPT-5.6 candidate, correction, rejection, confirmation | Browser handlers plus candidate-state tests |
| Search | Semantic result mode, box filter, keyword/fallback explanation | Real sqlite-vec integration and degraded-mode tests |
| Demo | Two boxes and three books, safe to invoke repeatedly | Idempotent seed integration test and observed live request |
| MCP Apps | Seven tools, versioned widget, file parameter, annotations, explicit confirmation, idempotency | In-memory protocol tests and observed live HTTP initialization |
| Packaging | Exact MCP/runtime pins and a live TypeScript start command | Clean launch after correcting the initial type-strip resolver defect |

## Observed local evidence

```text
npm run check
5 test files passed
10 tests passed

npm start
PASS on http://127.0.0.1:3115

GET /health
database=ready, vector=ready, openai=disabled

POST /api/manage/demo/seed (twice)
boxes=2, books=3 without duplicates

POST /mcp initialize
protocolVersion=2025-06-18
serverInfo.name=little-green-library
```

The system Firefox command resolved to an unavailable snap launcher, so a local automated screenshot was not claimed. HTML, CSS, JavaScript, live routes, and responsive source were inspected; browser screenshot/video evidence remains part of the deployed Phase 1.5C pass.

## OpenAI documentation decisions

Official guidance led to these changes:

- one user job per tool instead of a kitchen-sink connector;
- data tools separate from the map/widget render tool;
- `text/html;profile=mcp-app` and a versioned `ui://` template URI;
- `structuredContent` kept model-readable and concise;
- `_meta.ui` used for the widget resource and CSP;
- all tools declare `readOnlyHint`, `openWorldHint`, and `destructiveHint` accurately;
- the image argument is declared through `openai/fileParams` and consumed only during the current call; and
- the final write requires current-turn confirmation and an idempotency key.

## Known production gaps

- The demo operator token is not a production identity system.
- Uploaded cover bytes remain intentionally transient; cover persistence is not selected.
- Live GPT-5.6 and embedding smoke tests need an event API key.
- HTTPS, ChatGPT developer-mode, MCP Inspector, Central registration, and the end-to-end browser recording require the deployed Phase 1.5C environment.
