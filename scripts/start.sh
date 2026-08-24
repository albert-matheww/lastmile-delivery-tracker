#!/bin/sh
# Production boot: apply pending migrations, optionally seed (set
# RUN_SEED=true once on first deploy), then start the server.
set -e

npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  npx tsx prisma/seed.ts
fi

exec next start -p "${PORT:-3000}"
