FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm@10.33.0
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN cd packages/shared && npx tsc && echo "Shared OK" && ls dist/index.js
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build && echo "Build OK" && ls apps/api/dist/server.js

WORKDIR /app/apps/api
EXPOSE 3003

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
