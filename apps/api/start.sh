#!/bin/sh
set -e

echo "[Deploy] Compilando TypeScript..."
npx prisma generate --schema=./prisma/schema.prisma
npx tsc -p tsconfig.json

echo "[Deploy] Rodando migrações..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[Deploy] Iniciando servidor..."
exec node dist/server.js
