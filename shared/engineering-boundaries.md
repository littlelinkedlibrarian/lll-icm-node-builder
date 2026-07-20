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
- Entity presenters own card-to-detail transitions and keep primary selection separate from operator edit/delete controls.
- Controllers parse, authenticate, validate, and map errors.
- Services own workflows and business rules.
- Repositories own persistence.
- Adapters own OpenAI, storage, email, maps, metadata, and discovery. They normalize provider variation into application-owned types before data reaches a service; scalar-versus-list fields, nullable values, invalid dates, and incomplete records are ordinary provider behavior, not domain types.
- Composition roots wire interfaces to implementations.

## Discipline

- Specify behavior before implementation.
- Change one primary boundary per slice.
- Do not mix a framework rewrite, public contract change, and feature expansion.
- Keep one actor identity and error policy.
- Route one user event to one action; destructive success closes stale entity views before data refresh, while failure preserves context and shows the domain error.
- Treat persistence and its follow-up presentation as separate outcomes. If a write succeeds but refresh, navigation, or rendering fails, say that the write succeeded and offer a safe re-open or retry path; never invite an accidental duplicate write.
- When a real image exists, the presenter suppresses decorative placeholders and overlays. Close and destructive controls keep their semantic color, focus state, label, and contrast in every theme.
- Test without real external network calls.
- Document temporary behavior and compatibility shims.

## Operations

- Core catalog behavior survives OpenAI and network outages.
- Long work uses explicit queued job state.
- Secrets stay server-side and uncommitted.
- Deployable designs include migrations, backup, restore, and rollback.
