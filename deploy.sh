#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$(dirname "$0")"
COMPOSE=(docker compose -f compose.production.yaml --env-file .env.production)

require_env() {
  if [[ ! -f .env.production ]]; then
    echo "Missing .env.production. Copy .env.production.example and set real secrets." >&2
    exit 1
  fi
  corepack pnpm env:production:check
}

case "${1:-help}" in
  deploy)
    require_env
    "${COMPOSE[@]}" build app migrate
    "${COMPOSE[@]}" up -d app
    ;;
  start)
    require_env
    "${COMPOSE[@]}" up -d
    ;;
  stop)
    require_env
    "${COMPOSE[@]}" down
    ;;
  status)
    require_env
    "${COMPOSE[@]}" ps
    ;;
  logs)
    require_env
    "${COMPOSE[@]}" logs -f "${2:-app}"
    ;;
  migrate)
    require_env
    "${COMPOSE[@]}" run --rm migrate
    ;;
  seed-review)
    require_env
    "${COMPOSE[@]}" --profile tools run --rm seed
    ;;
  backup)
    require_env
    mkdir -p data/backup
    timestamp=$(date +%Y%m%d_%H%M%S)
    "${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' > "data/backup/kanni_${timestamp}.sql"
    echo "Backup written to data/backup/kanni_${timestamp}.sql"
    ;;
  *)
    echo "Usage: ./deploy.sh deploy|start|stop|status|logs [service]|migrate|seed-review|backup"
    ;;
esac
