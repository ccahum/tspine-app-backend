#!/bin/bash
# run-daily-sync.sh
# Descarga los Sheets más recientes y corre el pipeline completo de imports contra QA.
# Pensado para correr vía cron en el droplet (fuera de Docker), mientras los datos
# de Sheets sigan siendo la fuente de verdad — TEMPORAL, hasta el Go-Live productivo.
#
# Requiere en la raíz del repo (no se suben a git):
#   - google-credentials.json         (cuenta de servicio con acceso de lectura a los Sheets)
#   - .env.imports                    (DATABASE_URL apuntando a 127.0.0.1:<POSTGRES_HOST_PORT>)
#
# Instalar en crontab, por ejemplo todos los días a las 3am:
#   0 3 * * * /ruta/al/repo/prisma/run-daily-sync.sh

set -uo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.imports ]; then
  echo "❌ Falta .env.imports en la raíz del repo — no se puede continuar." >&2
  exit 1
fi
set -a
source .env.imports
set +a

mkdir -p logs/imports
LOG_FILE="logs/imports/$(date +'%Y-%m-%d_%H-%M-%S').log"

# Subshell con su propio "set -e": si falla la descarga, no intenta correr los
# imports con CSVs viejos o a medio escribir.
(
  set -e
  echo "═══════════════════════════════════════════════════════════"
  echo "  SYNC DIARIO DE SHEETS — inicio: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "═══════════════════════════════════════════════════════════"

  echo -e "\n[1/2] Descargando Sheets...\n"
  npx ts-node prisma/download-sheets.ts

  echo -e "\n[2/2] Corriendo pipeline de imports...\n"
  npx ts-node prisma/run-imports.ts

  echo -e "\n  fin: $(date '+%Y-%m-%d %H:%M:%S')"
) >> "$LOG_FILE" 2>&1
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "❌ Sync falló (código $STATUS) — revisa $LOG_FILE" >&2
fi
exit $STATUS
