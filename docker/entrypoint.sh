#!/bin/sh
set -e

# Optional: use DATABASE_URL or discrete PG* vars
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_HOST" ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-postgres}?schema=public"
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
fi

# Run Prisma migrate deploy (idempotent)
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy || true
fi

exec "$@"
