# Central capability lessons: optional inputs, not requirements

Use this reference when a learner asks to consume Central or selects a workflow that benefits from lessons learned there. Do not expand the approved scope automatically.

## Public sources

- [Central capability guide](https://beta.littlelinkedlibrarian.com/integrations)
- [Live Central OpenAPI](https://beta.littlelinkedlibrarian.com/api/openapi.json)
- [Machine-readable workflow discovery](https://beta.littlelinkedlibrarian.com/.well-known/lll.json)
- [API and MCP setup](https://beta.littlelinkedlibrarian.com/api/docs.md)
- [Public node registry and six-route profile](https://github.com/littlelinkedlibrarian/lll-network-nodes)

Central source is private. The public learning workspace is this repository; the hosted API contract can be read without access to Central source. Fetch and record the deployed contract revision/hash when implementing against it. A live contract is not an immutable dependency pin.

## Borrow lessons, not Central's infrastructure

| If your approved feature needs… | Useful design lesson | Keep optional |
|---|---|---|
| Photo-assisted cataloging | Select a destination, retain the actor, separate extraction from review and save | AI provider, queue infrastructure and Central session shape |
| Slow or uncertain writes | Record progress and define how to recover a lost response before retrying | A queue for a tiny synchronous local feature |
| Metadata enrichment | Keep reviewed input and provenance; make provider outage behavior explicit | Automatic edition selection or mandatory enrichment |
| Multiple clients | Put validation and confirmation policy in shared application services; HTTP/MCP should agree | MCP itself |
| Physical-copy history | ISBN identifies an edition; exact copy identity needs explicit evidence/identifier | Checkout, QR and journeys in a basic catalog |
| Retryable actions | Define the key scope, payload conflicts and whether replay returns history or current state | Durable receipts for every read or trivial edit |
| Accounts | Keep guest, operator, Central user and node credentials distinct | Central account/vault features in an independent app |
| Public discovery | Offer readable HTML, Markdown, OpenAPI and clear permission boundaries | Network membership or public writes |

Central's read-only MCP and Happy Box's richer operator/demo MCP are different deployments. Do not assume a tool offered by one exists on the other. Inspect tools/list and that deployment's contract.

## Compatibility scope

LLL Lite 0.1.0 is six anonymous reads: `/health`, `/api/books`, `/api/books/{id}`, `/api/boxes`, `/api/boxes/{id}`, `/api/boxes/{id}/books`.

Central uses `/api/library-boxes` for its own local catalog. Those paths are not interchangeable. An independent node implements the compatibility adapter, not the entire Central API. Product writes and private media stay at the node. Registry review, heartbeat and approval remain separate steps.

The checked-in reference contract is `stages/05-build/output/node-project/contracts/openapi.yaml`; it includes product extensions beyond the six-route profile. Record its exact Git commit when using it. The registry README defines the public admission profile. If they disagree, document the conflict before implementing compatibility.

## Before claiming parity

A contract addition is not automatically an implementation, a successful test, or network membership. Verify behavior through the selected client boundary, including validation, denied access, retry, provider failure and the user-visible outcome. Label source findings, tested behavior and proposed behavior separately.
