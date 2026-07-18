# Engineering boundaries

## Outside inward

1. user journey
2. public contract
3. controller
4. application service
5. repositories and adapters

## Owners

- Contracts own observable requests, responses, events, and errors.
- UI uses one shared transport.
- Controllers parse, authenticate, validate, and map errors.
- Services own workflows and business rules.
- Repositories own persistence.
- Adapters own OpenAI, storage, email, maps, metadata, and discovery.
- Composition roots wire interfaces to implementations.

## Discipline

- Specify behavior before implementation.
- Change one primary boundary per slice.
- Do not mix a framework rewrite, public contract change, and feature expansion.
- Keep one actor identity and error policy.
- Test without real external network calls.
- Document temporary behavior and compatibility shims.

## Operations

- Core catalog behavior survives OpenAI and network outages.
- Long work uses explicit queued job state.
- Secrets stay server-side and uncommitted.
- Deployable designs include migrations, backup, restore, and rollback.
