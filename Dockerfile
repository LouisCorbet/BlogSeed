# syntax=docker.io/docker/dockerfile:1

############################
# Base (Node 20 Alpine)
############################
FROM node:20-alpine AS base
WORKDIR /app

############################
# Dépendances
############################
FROM base AS deps
# outils utiles si modules natifs (sharp, etc.)
RUN apk add --no-cache libc6-compat python3 make g++ && corepack enable
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else echo "Lockfile not found." && exit 1; fi

############################
# Build (Next.js standalone)
############################
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Assure que next.config.* a: output: 'standalone'
RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    else echo "Lockfile not found." && exit 1; fi

############################
# Runner (image finale)
############################
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000

# user non-root uid/gid = 1001
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Bundle standalone + assets (public reste en lecture seule dans l'image)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dossier de données (persistance via volume nommé)
RUN mkdir -p /app/data && chown -R 1001:1001 /app/data
VOLUME ["/app/data"]

# Healthcheck (optionnel)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').request({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
