# syntax=docker/dockerfile:1.7

############################
# 1) Dépendances
############################
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Outils pour node-gyp (sharp, bcrypt, etc.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Copie manifest + éventuels lockfiles
COPY package.json ./
COPY package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Active corepack pour yarn & pnpm, puis installe selon le lockfile présent
RUN corepack enable \
 && if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

############################
# 2) Build
############################
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Récupère node_modules installés
COPY --from=deps /app/node_modules ./node_modules
# Copie le reste du code
COPY . .

# Si tu compiles avec des NEXT_PUBLIC_*, assure-toi qu'elles sont dispo ici (ENV ou .env.production)
RUN npm run build

############################
# 3) Runtime minimal
############################
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Exécute en user non-root
USER node

# Copie le bundle standalone
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/.next/static ./.next/static
COPY --chown=node:node --from=build /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').request({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"

CMD ["node", "server.js"]
