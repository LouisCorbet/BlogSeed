# syntax=docker/dockerfile:1

# ---- 1) Dépendances ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- 2) Build ----
FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Si tu as absolument besoin de variables à la compilation :
# COPY .env.production ./
RUN npm run build

# ---- 3) Runtime minimal ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Exécute en utilisateur non-root
USER node

# On copie le serveur standalone produit par Next
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/.next/static ./.next/static
COPY --chown=node:node --from=build /app/public ./public

EXPOSE 3000

# Petit healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').request({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},res=>process.exit(res.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"

# Le serveur Next standalone démarre via server.js
CMD ["node", "server.js"]
