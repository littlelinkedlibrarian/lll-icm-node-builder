# Stage 07: Release

Package the validated application for its approved own-domain, standalone, or LLL network path.

## Inputs

| Source | File or location | Section or scope | Why |
|---|---|---|---|
| Project | `../05-build/output/node-project/` | Full project | Release candidate |
| Validation | `../06-validation/output/validation-report.md` | Full file | Release evidence |
| Brief | `../01-discovery/output/node-brief.md` | Connection and ownership | Intended destination |
| Architecture | `../03-architecture/output/architecture.md` | Deployment and operations | Packaging decisions |
| Connection | `../../shared/connection-paths.md` | Selected path only | Release rules |
| Quality | `../../shared/quality-policy.md` | Deployment and LLL | Release floor |

## Process

1. Refuse release when required validation is not PASS.
2. Produce deployment instructions, environment inventory, migration, backup, restore, monitoring, update, and rollback material.
3. For an own-domain app, verify domain, TLS, origins, privacy, and operator ownership.
4. For LLL compatibility, include pinned contract and conformance evidence without claiming membership.
5. For registration, generate only a candidate manifest with placeholders for human-reviewed operator data.
6. Produce a release checklist and remaining operator actions.

## Checkpoint

| After step | Agent presents | Human decides |
|---|---|---|
| 5 | Public claims, operator data, visibility, and release evidence | Approve deployment or manifest submission |

## Audit

| Check | Pass condition |
|---|---|
| Evidence | Validation report is fully PASS for required rows |
| Secrets | Package and manifest contain no credentials |
| Claims | Independent, compatible, registered, and mesh-native terms are accurate |
| Recovery | Backup, restore, update, and rollback steps are usable |

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Release packet | `output/release-packet.md` | Markdown |
| Candidate manifest | `output/node-manifest.yaml` when selected | YAML with reviewed placeholders |
