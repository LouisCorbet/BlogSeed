#!/bin/sh
# =====================================================================
# Point d'entrée du container app
# Applique les migrations Prisma puis démarre le serveur Next.js
# =====================================================================
set -e

echo "→ Application des migrations Prisma..."
npx prisma migrate deploy

echo "→ Démarrage du serveur Next.js..."
exec node server.js
