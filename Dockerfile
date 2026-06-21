# =====================================================================
# Dockerfile multi-stage — Next.js production (standalone output)
# =====================================================================

# ----- Stage 1 : dépendances -----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ----- Stage 2 : build -----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génère le client Prisma puis build Next.js
RUN npx prisma generate
RUN npm run build

# ----- Stage 3 : runner (image finale, légère) -----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Désactive la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Sharp pour l'optimisation d'images
RUN apk add --no-cache vips-dev

# Copie du build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma : schéma + client généré (pour les migrations au démarrage)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Script d'entrée : applique les migrations puis démarre
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Dossier uploads (monté en volume)
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
