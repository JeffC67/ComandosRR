#!/usr/bin/env bash
# ============================================================
# Restore de un dump de PostgreSQL sobre la BD en ejecución
# Uso:  ./infra/restore.sh backups/db-<fecha>.sql
# ⚠️  SOBRESCRIBE por completo los datos actuales de $POSTGRES_DB
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

DUMP="${1:?Uso: ./infra/restore.sh <archivo-dump.sql>}"

if [[ ! -f "$DUMP" ]]; then
  echo "ERROR: no existe el archivo $DUMP" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "ERROR: falta .env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

echo "⚠ Esto SOBRESCRIBE la base de datos '$POSTGRES_DB' con el contenido de:"
echo "   $DUMP"
read -r -p "Escribe el nombre de la BD para confirmar: " CONFIRM
if [[ "$CONFIRM" != "$POSTGRES_DB" ]]; then
  echo "Confirmación incorrecta. Abortado." >&2
  exit 1
fi

echo "==> Restaurando..."
docker compose exec -T postgres psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=on \
  < "$DUMP"

echo "==> Restore completado."
