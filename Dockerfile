# ──────────────────────────────────────────────────────────────────────────────
# STAGE 1 — BUILD
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

RUN npm prune --omit=dev

# ──────────────────────────────────────────────────────────────────────────────
# STAGE 2 — RUNNER (imagen final ligera)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/prisma      ./prisma
COPY package.json ./

RUN mkdir -p logs

EXPOSE 3000

# Corre migraciones pendientes y arranca el servidor
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]
