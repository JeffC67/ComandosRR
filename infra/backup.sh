#!/usr/bin/env bash
# ============================================================
# Backup de PostgreSQL + uploads de Directus
# Uso:      ./infra/backup.sh [directorio_salida]
# Salida:   backups/db-<fecha>.sql  +  backups/uploads-<fecha>.tar.gz
# Restore:  ./infra/restore.sh backups/db-<fecha>.sql
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: falta .env (cp .env.example .env)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="$BACKUP_DIR/db-$STAMP.sql"
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Dump de PostgreSQL ($POSTGRES_DB)"
docker compose exec -T postgres pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --clean --if-exists --no-owner \
  > "$DB_FILE"

if [[ ! -s "$DB_FILE" ]]; then
  echo "ERROR: el dump está vacío" >&2
  exit 1
fi

echo "==> Volumen de uploads de Directus (/datadir)"
docker compose exec -T directus tar czf - -C /datadir . > "$UPLOADS_FILE"

if [[ ! -s "$UPLOADS_FILE" ]]; then
  echo "ERROR: el tar de uploads está vacío" >&2
  exit 1
fi

echo
echo "Backup completado:"
ls -lh "$DB_FILE" "$UPLOADS_FILE"
echo
echo "⚠ Recuerda copiar estos archivos a otro disco/NAS (el backup en el mismo servidor no protege contra fallas del equipo)."
