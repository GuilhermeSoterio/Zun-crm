#!/bin/sh
set -e

if [ ! -f "dist/server.js" ]; then
  echo "[Deploy] Compilando TypeScript..."
  npx prisma generate --schema=./prisma/schema.prisma
  npx tsc -p tsconfig.json
fi

echo "[Deploy] Rodando migrações..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[Deploy] Iniciando servidor..."
exec node dist/server.js
