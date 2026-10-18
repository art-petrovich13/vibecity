#!/bin/sh
set -e

log() {
  echo "[vibecity-backend] $*"
}

log "Ожидаем готовность MySQL..."
attempt=0

until ./node_modules/.bin/prisma db push --skip-generate; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    log "MySQL не ответил за 120 секунд"
    exit 1
  fi
  log "База ещё не готова (попытка $attempt)..."
  sleep 2
done

log "Схема применена. Наполняем демо-данными (если база пуста)..."
node dist/seed.js

log "Запускаем API на порту ${PORT:-3000}..."
exec node dist/index.js
