#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-vibecity}"
DB_USER="${DB_USER:-vibecity}"
DB_PASSWORD="${DB_PASSWORD:-vibecity}"
DATABASE_URL="${DATABASE_URL:-mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_NAME}}"
export DATABASE_URL

log() {
  echo "[vibecity] $*"
}

# --- MySQL ---------------------------------------------------------------
mkdir -p /var/run/mysqld /var/lib/mysql
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

if [ ! -d /var/lib/mysql/mysql ]; then
  log "Инициализация каталога данных MySQL..."
  mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

log "Запуск MySQL..."
mysqld_safe --user=mysql --datadir=/var/lib/mysql &
MYSQL_SAFE_PID=$!

for _ in $(seq 1 60); do
  if mysqladmin ping --silent >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! mysqladmin ping --silent >/dev/null 2>&1; then
  log "MySQL не запустился за 60 секунд"
  exit 1
fi

log "Создание базы и пользователя..."
mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

log "Применение схемы Prisma..."
npx prisma db push --skip-generate

log "Наполнение демо-данными (пропускается, если база уже заполнена)..."
node dist/seed.js

log "Запуск VibeCity на порту ${PORT:-3000}..."
node dist/index.js &
APP_PID=$!

shutdown() {
  log "Остановка приложения..."
  kill -TERM "$APP_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
  log "Остановка MySQL..."
  mysqladmin -uroot shutdown >/dev/null 2>&1 || true
  kill -TERM "$MYSQL_SAFE_PID" 2>/dev/null || true
  exit 0
}

trap shutdown TERM INT

wait "$APP_PID"
