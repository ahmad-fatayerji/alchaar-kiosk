#!/bin/sh
set -e

// Prefer DATABASE_URL; if absent, build one from provided POSTGRES_* (default host 'db')
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER:-kiosk}:${POSTGRES_PASSWORD:-secret}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-pharmacy}?schema=public"
fi

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Waiting for database to be ready..."
  HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*$#\1#')
  PORT=$(echo "$DATABASE_URL" | sed -E 's#.*:([0-9]+)/.*$#\1#')
  if [ -z "$PORT" ] || [ "$PORT" = "$DATABASE_URL" ]; then
    PORT=5432
  fi
  # Wait for TCP
  for i in $(seq 1 60); do
    if nc -z "$HOST" "$PORT"; then
      echo "[entrypoint] Database is up."
      break
    fi
    echo "[entrypoint] Waiting ($i/60) for $HOST:$PORT..."
    sleep 1
  done
  # Final check to prevent running with an unreachable DB
  if ! nc -z "$HOST" "$PORT"; then
    echo "[entrypoint] Database not reachable after 60s; exiting." >&2
    exit 1
  fi
fi

# Run Prisma migrate deploy (idempotent)
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy || true
fi

exec "$@"
