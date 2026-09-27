#!/bin/bash
set -euo pipefail

PROGETTO="$HOME/Progetti/nutriai-backend"
DESTINAZIONE="$HOME/Backup-quadrio"
DA_TENERE=10

mkdir -p "$DESTINAZIONE"

set -a
source "$PROGETTO/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL non trovata nel .env"
  exit 1
fi

DATA=$(date +%Y-%m-%d-%H%M)
FILE="$DESTINAZIONE/quadrio-$DATA.dump"

echo "Backup in corso..."
pg_dump "$DATABASE_URL" -Fc --no-owner --no-privileges -n public -n auth -f "$FILE"

echo "Fatto:"
ls -lh "$FILE"

ls -1t "$DESTINAZIONE"/quadrio-*.dump | tail -n +$((DA_TENERE + 1)) | while read -r vecchio; do
  echo "Elimino il vecchio: $(basename "$vecchio")"
  rm -- "$vecchio"
done

echo "Backup presenti: $(ls -1 "$DESTINAZIONE"/quadrio-*.dump | wc -l | tr -d ' ')"
