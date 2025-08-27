#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Helpers (couleurs + logs)
# ─────────────────────────────────────────────────────────────────────────────
if command -v tput >/dev/null 2>&1; then
  BOLD="$(tput bold)"; DIM="$(tput dim)"; RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; RESET="$(tput sgr0)"
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi
info() { echo -e "${BOLD}▶${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}!${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" 1>&2; }

need() { command -v "$1" >/dev/null 2>&1 || { err "Missing dependency: $1"; exit 1; }; }

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight checks
# ─────────────────────────────────────────────────────────────────────────────
info "Checking prerequisites…"
need docker
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else need docker-compose; DC="docker-compose"; fi
docker info >/dev/null 2>&1 || { err "Docker daemon not running?"; exit 1; }

[ -f docker-compose.yml ] || { err "docker-compose.yml not found."; exit 1; }
[ -f Caddyfile ] || { err "Caddyfile not found."; exit 1; }

if [ ! -f .env ]; then
  err ".env not found. Please create it (you said it's filled)."
  echo "Hint: cp .env.example .env && edit DOMAIN, LE_EMAIL, NEXT_PUBLIC_SITE_URL, ADMIN_*"
  exit 1
fi

# Load env (DOMAIN/LE_EMAIL/NEXT_PUBLIC_SITE_URL…)
set -o allexport
# shellcheck disable=SC1091
source .env
set +o allexport

: "${DOMAIN:?DOMAIN must be set in .env (e.g., blog.example.com)}"
: "${LE_EMAIL:?LE_EMAIL must be set in .env (Let's Encrypt contact email)}"
: "${NEXT_PUBLIC_SITE_URL:?NEXT_PUBLIC_SITE_URL must be set in .env (https://$DOMAIN)}"
: "${ADMIN_USER:?ADMIN_USER must be set in .env}"
: "${ADMIN_PASS:?ADMIN_PASS must be set in .env}"

# Sanity on URLs
if [[ "$NEXT_PUBLIC_SITE_URL" != https://"$DOMAIN"* ]]; then
  warn "NEXT_PUBLIC_SITE_URL (${NEXT_PUBLIC_SITE_URL}) does not match https://${DOMAIN}."
  warn "Continuing, but SEO/links may be inconsistent."
fi

info "Preparing persistent folders…"
mkdir -p data public/images
# Permissions pragmatiques pour éviter les soucis d'écriture avec l'user non-root du conteneur
chmod -R 0777 data public/images || true
ok "Folders ready: data/, public/images/"

if [ ! -s data/site.json ]; then
  info "Seeding data/site.json"
  cat > data/site.json <<JSON
{
  "name": "Mon Super Blog",
  "url": "${NEXT_PUBLIC_SITE_URL}",
  "tagline": "Guides, articles et inspirations. Léger, rapide et SEO-friendly.",
  "twitter": "@monsite",
  "contactEmail": "",
  "defaultOg": "/og-default.jpg",
  "favicon": "/favicon.ico",
  "theme": "light"
}
JSON
  ok "Created data/site.json"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Build & run
# ─────────────────────────────────────────────────────────────────────────────
info "Building and starting containers (this may take a few minutes)…"
$DC pull caddy || true
$DC up -d --build --remove-orphans
ok "Containers are up."

info "Listing running services:"
$DC ps

# ─────────────────────────────────────────────────────────────────────────────
# Health checks (HTTP→HTTPS redirect, HTTPS 200 on /health)
# ─────────────────────────────────────────────────────────────────────────────
sleep 2
HEALTH_URL="https://${DOMAIN}/health"

# Wait for Caddy to provision certificate and proxy to be ready
info "Waiting for HTTPS to become available at ${HEALTH_URL} …"
attempts=0
until code=$(curl -sk -o /dev/null -w "%{http_code}" "$HEALTH_URL"); [ "$code" = "200" ] || [ $attempts -ge 30 ]; do
  attempts=$((attempts + 1))
  sleep 2
done

if [ "$code" != "200" ]; then
  warn "Healthcheck not 200 yet (code=$code)."
  warn "Recent logs (caddy):"
  $DC logs caddy --tail=50 || true
  warn "Recent logs (app):"
  $DC logs app --tail=50 || true
  err "Deployment did not pass healthcheck. Investigate the logs above."
  exit 1
fi

# Optional: check HTTP → HTTPS redirect
REDIR_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/")
if [ "$REDIR_CODE" != "301" ] && [ "$REDIR_CODE" != "308" ]; then
  warn "HTTP redirect not detected (code=$REDIR_CODE). Check port 80 and Caddyfile."
else
  ok "HTTP redirects to HTTPS."
fi

ok "Deployment successful!"

echo
echo -e "${BOLD}→ Visit:${RESET} https://${DOMAIN}"
echo -e "${DIM}(If you just pointed DNS, first issuance may take up to ~60s)${RESET}"
