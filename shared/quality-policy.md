# Quality policy

## Specification

- outcome, non-goals, learner work, and agent work are explicit
- each capability has observable acceptance evidence
- AI, vector, privacy, and connection choices are explicit

## Architecture

- contracts, controllers, services, repositories, and adapters have owners
- stack satisfies approved capabilities
- secrets and configuration boundaries are defined
- operational complexity has human approval

## Build

- setup works from a clean checkout
- approved journeys run end to end
- persistence survives restart when required
- errors are observable
- no unapproved capabilities appear

## OpenAI and vectors

- current model guidance is checked and dated
- keys stay server-side
- outputs are validated and confirmed
- model and schema or prompt versions are recorded
- vector dimensions match schema
- representation, index, missing-vector, and re-embedding behavior are tested

## Deployment and LLL

- package, migrations, backup, restore, health, logs, and recovery are proven
- domain, TLS, origins, and secrets are correct
- hybrid releases prove local operation with the network adapter disabled and keep product and node credentials separate
- hosted releases prove tenant isolation, delegated DNS/TLS, export, deletion, backup, and graduation to an owner domain
- LLL contract revision is pinned and external conformance passes
- registry artifact validates and human approval precedes membership claims

## Reporting

Every stage records decisions, observed evidence, risks, deferred work, and the next allowed stage. A test is evidence only after it runs.
