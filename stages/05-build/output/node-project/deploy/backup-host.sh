#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"
runtime_env="${HAPPYBOX_ENV_FILE:-/home/zaxaz/lll-happybox/runtime.env}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

docker compose --project-name happybox --env-file "${runtime_env}" \
  -f "${project_dir}/compose.production.yaml" exec -T \
  -e "BACKUP_DESTINATION=/app/backups/lll-node-${stamp}.sqlite" \
  app npm run backup

docker compose --project-name happybox --env-file "${runtime_env}" \
  -f "${project_dir}/compose.production.yaml" exec -T app \
  sh -lc "if [ -d /app/data/media ]; then tar -C /app/data -czf /app/backups/lll-media-${stamp}.tar.gz media; fi"
