FROM node:20-slim
RUN npm install -g pnpm@10.33.0
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN cd packages/shared && npx tsc
RUN pnpm --filter web build

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
