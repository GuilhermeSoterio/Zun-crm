FROM node:20-alpine AS base
RUN npm install -g pnpm@10.33.0
WORKDIR /app

# Instala dependências
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Build shared
FROM deps AS builder
COPY packages/shared ./packages/shared
RUN pnpm --filter @reativa/shared build || true

# Build API
COPY apps/api ./apps/api
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# Runtime
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10.33.0
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api
EXPOSE 3003

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
