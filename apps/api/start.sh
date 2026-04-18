#!/bin/sh
set -e

echo "[Deploy] Rodando migrações..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[Deploy] Iniciando servidor..."
exec node dist/server.js
