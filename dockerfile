# ── deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── run (standalone)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# user non-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
# fichiers standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# assets publics (les uploads /public/images seront montés en volume)
COPY --from=builder /app/public ./public

# dossiers persistants (montés via volumes)
VOLUME ["/app/data", "/app/public/images"]
ENV PORT=3000
EXPOSE 3000
USER nextjs
CMD ["node", "server.js"]
