# syntax=docker.io/docker/dockerfile:1

########################################
# Base (Node 18 Alpine)
########################################
FROM node:18-alpine AS base
WORKDIR /app

########################################
# Dépendances (installe node_modules)
########################################
FROM base AS deps
# libc6-compat: utile pour certaines libs
# outils build: utiles si modules natifs (bcrypt, sharp, etc.)
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

########################################
# Build (Next.js)
########################################
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Assure-toi d’avoir `output: 'standalone'` dans next.config.{js,ts}
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

########################################
# Runner (image finale minimale)
########################################
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Crée l'utilisateur d'exécution (uid/gid = 1001)
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Fichiers statiques et bundle standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dossier de données persistant + droits corrects
RUN mkdir -p /app/data && chown -R 1001:1001 /app/data
VOLUME ["/app/data"]

# Santé (optionnel)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').request({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"

USER nextjs
EXPOSE 3000

# Next standalone génère server.js
CMD ["node", "server.js"]
