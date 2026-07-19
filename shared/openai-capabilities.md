# OpenAI capability policy

## Selection

AI is optional. If selected, use OpenAI models behind an application-owned adapter. Check current official guidance during the build and record model ID and decision date.

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/embeddings
- https://developers.openai.com/api/docs/guides/structured-outputs

## Vision

Use a current OpenAI image-input model for covers, spines, shelves, box condition, or bounded descriptors. Prefer the Responses API for new multimodal workflows when it supports the requirement.

Validate structured output. Store candidates separately from canonical data. Preserve model, schema or prompt version, confidence, evidence, and confirming actor.

Never infer ownership, identity, or precise location without an approved requirement, consent, and human review.

## Embeddings

Use an OpenAI embedding model for vectors. Do not treat chat or vision output as an embedding.

First name the required user outcome: semantic search, multilingual retrieval, recommendation, deduplication, or similarity. If exact search suffices, do not add vectors.

If justified:

- define and version the representation
- verify model dimensions against database schema
- store model ID, dimensions, representation version, source revision, and creation time
- embed confirmed records
- define distance, indexes, filters, missing-vector behavior, and re-embedding
- choose a vector-capable database, separate vector store, or defer with approval

Do not serialize vectors into text and call it vector search unless small-scale application comparison is intentional and bounded.

## Image similarity

When selected, use OpenAI vision to create a bounded descriptor and an OpenAI embedding model to vectorize it. Keep image, descriptor, and vector provenance separate.

## Resilience

Keep keys server-side. Limit data, size, rate, timeout, and retries. Queue slow work. Keep manual catalog behavior working without OpenAI. Production never returns fixture data as a successful extraction.

## Uncertain object metadata

For Assorted Things or mixed-object images, require the model to distinguish visible evidence from uncertainty. Use null for unsupported scalar fields, emit explicit `unknowns`, and ask short `reviewQuestions`. Never invent ownership, price, safety, brand, exact material, identity, or location. Save the manual capture before the model call, retain the original under the approved media policy, and require a human decision. This workflow must remain separate from book extraction.
