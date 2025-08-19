#!/bin/sh
set -e

# Prefer DATABASE_URL; if absent, build one from provided POSTGRES_* (default host 'db')
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER:-kiosk}:${POSTGRES_PASSWORD:-secret}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-pharmacy}?schema=public"
fi

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Waiting for database to be ready..."
  HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*$#\1#')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#.*:([0-9]+)/.*$#\1#')
  if [ -z "$DB_PORT" ] || [ "$DB_PORT" = "$DATABASE_URL" ]; then
    DB_PORT=5432
  fi
  # If PORT got accidentally set to the DB port, reset it to web port 3000
  if [ "${PORT:-}" = "$DB_PORT" ]; then
    export PORT=3000
  fi
  # Wait for TCP
  for i in $(seq 1 60); do
  if nc -z "$HOST" "$DB_PORT"; then
      echo "[entrypoint] Database is up."
      break
    fi
  echo "[entrypoint] Waiting ($i/60) for $HOST:$DB_PORT..."
    sleep 1
  done
  # Final check to prevent running with an unreachable DB
  if ! nc -z "$HOST" "$DB_PORT"; then
    echo "[entrypoint] Database not reachable after 60s; exiting." >&2
    exit 1
  fi
fi

# Ensure app web PORT has a sane default
export PORT=${PORT:-3000}

# Run Prisma migrate deploy (idempotent)
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy || true
fi

exec "$@"
