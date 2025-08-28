#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# UI helpers
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

# ─────────────────────────────────────────────────────────────────────────────
# Detect OS / Package manager
# ─────────────────────────────────────────────────────────────────────────────
OS_ID="" OS_VER="" PM="" SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi
if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  OS_ID="${ID:-}"; OS_VER="${VERSION_ID:-}"
fi

detect_pm() {
  case "$OS_ID" in
    ubuntu|debian) PM="apt" ;;
    fedora)        PM="dnf" ;;
    rhel|centos|rocky|almalinux) PM="$(command -v dnf >/dev/null 2>&1 && echo dnf || echo yum)" ;;
    alpine)        PM="apk" ;;
    opensuse*|sles) PM="zypper" ;;
    *) PM="" ;;
  esac
}

install_pkgs() {
  # $@: packages list
  case "$PM" in
    apt)
      $SUDO apt-get update -y
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@"  
        ;;
    dnf)
      $SUDO dnf install -y "$@"
      ;;
    yum)
      $SUDO yum install -y "$@"
      ;;
    apk)
      $SUDO apk add --no-cache "$@"
      ;;
    zypper)
      $SUDO zypper refresh
      $SUDO zypper install -y "$@"
      ;;
    *)
      err "Unsupported OS for automatic install. Install dependencies manually."
      exit 1
      ;;
  esac
}

install_docker() {
  info "Installing Docker Engine…"
  case "$PM" in
    apt)
      install_pkgs ca-certificates curl gnupg lsb-release
      $SUDO install -m 0755 -d /etc/apt/keyrings
      curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
      CODENAME="$(. /etc/os-release; echo "${VERSION_CODENAME:-$(lsb_release -cs 2>/dev/null || echo stable)}")"
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS_ID} ${CODENAME} stable" | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
      $SUDO apt-get update -y
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      $SUDO systemctl enable --now docker || true
      ;;
    dnf)
      install_pkgs dnf-plugins-core
      if [[ "$OS_ID" == "fedora" ]]; then
        $SUDO dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
      else
        $SUDO dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      fi
      install_pkgs docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      $SUDO systemctl enable --now docker || true
      ;;
    yum)
      install_pkgs yum-utils
      $SUDO yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      install_pkgs docker-ce docker-ce-cli containerd.io docker-compose-plugin
      $SUDO systemctl enable --now docker || true
      ;;
    apk)
      install_pkgs docker docker-cli-compose
      $SUDO rc-update add docker default || true
      ($SUDO service docker start || $SUDO rc-service docker start) || true
      ;;
    zypper)
      install_pkgs docker docker-compose
      $SUDO systemctl enable --now docker || true
      ;;
    *)
      err "Unsupported OS for automatic Docker install."
      exit 1
      ;;
  esac
  ok "Docker installed."
}

ensure_deps() {
  detect_pm
  [ -n "$PM" ] || { err "Cannot detect package manager. Aborting."; exit 1; }

  # Basic tools
  for bin in curl sed openssl; do
    if ! command -v "$bin" >/dev/null 2>&1; then
      info "Installing missing tool: $bin"
      install_pkgs "$bin" || true
    fi
  done

  # Docker
  if ! command -v docker >/dev/null 2>&1; then
    install_docker
  fi

  # Docker daemon up?
  if ! docker info >/dev/null 2>&1; then
    info "Starting Docker service…"
    ($SUDO systemctl start docker || $SUDO service docker start || $SUDO rc-service docker start) || true
    sleep 2
    docker info >/dev/null 2>&1 || { err "Docker daemon not running. Start it and re-run."; exit 1; }
  fi

  # Compose (prefer plugin `docker compose`)
  if docker compose version >/dev/null 2>&1; then
    export DC="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    export DC="docker-compose"
  else
    info "Installing Docker Compose…"
    case "$PM" in
      apt|dnf|yum) install_pkgs docker-compose-plugin || install_pkgs docker-compose || true ;;
      apk)         install_pkgs docker-cli-compose || install_pkgs docker-compose || true ;;
      zypper)      install_pkgs docker-compose || true ;;
    esac
    if docker compose version >/dev/null 2>&1; then
      export DC="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
      export DC="docker-compose"
    else
      err "Failed to install Docker Compose. Install it manually then re-run."
      exit 1
    fi
  fi

  ok "Dependencies ready. Using: ${DC}"
}

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight / repo sanity
# ─────────────────────────────────────────────────────────────────────────────
[ -f docker-compose.yml ] || { err "docker-compose.yml not found."; exit 1; }
[ -f Caddyfile ] || { err "Caddyfile not found."; exit 1; }
[ -f .env ] || { err ".env not found. Create it and fill DOMAIN, LE_EMAIL, NEXT_PUBLIC_SITE_URL, ADMIN_*"; exit 1; }

# Load env
set -o allexport
# shellcheck disable=SC1091
source .env
set +o allexport

: "${DOMAIN:?DOMAIN must be set in .env (e.g., blog.example.com)}"
: "${LE_EMAIL:?LE_EMAIL must be set in .env (Let s Encrypt contact email)}"
: "${NEXT_PUBLIC_SITE_URL:?NEXT_PUBLIC_SITE_URL must be set in .env (https://$DOMAIN)}"
: "${ADMIN_USER:?ADMIN_USER must be set in .env}"
: "${ADMIN_PASS:?ADMIN_PASS must be set in .env}"

# ─────────────────────────────────────────────────────────────────────────────
# Ensure deps (auto-install if missing)
# ─────────────────────────────────────────────────────────────────────────────
info "Ensuring required dependencies…"
ensure_deps

# Sanity on URL
if [[ "$NEXT_PUBLIC_SITE_URL" != https://"$DOMAIN"* ]]; then
  warn "NEXT_PUBLIC_SITE_URL (${NEXT_PUBLIC_SITE_URL}) != https://${DOMAIN} . Continuing."
fi

# ─────────────────────────────────────────────────────────────────────────────
# Prepare volumes / seed config
# ─────────────────────────────────────────────────────────────────────────────
info "Preparing persistent folders…"
mkdir -p data public/images
chmod -R 0777 data public/images || true
ok "Folders ready."

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
info "Building and starting containers (HTTPS via Caddy)…"
$DC pull caddy || true
$DC up -d --build --remove-orphans
ok "Containers are up."

info "Listing running services:"
$DC ps

# ─────────────────────────────────────────────────────────────────────────────
# Health checks
# ─────────────────────────────────────────────────────────────────────────────
sleep 2
HEALTH_URL="https://${DOMAIN}/health"
info "Waiting for HTTPS to become available at ${HEALTH_URL} …"
attempts=0
until code=$(curl -sk -o /dev/null -w "%{http_code}" "$HEALTH_URL"); [ "$code" = "200" ] || [ $attempts -ge 30 ]; do
  attempts=$((attempts + 1))
  sleep 2
done

if [ "${code:-}" != "200" ]; then
  warn "Healthcheck not 200 yet (code=${code:-N/A})."
  warn "Recent logs (caddy):"
  $DC logs caddy --tail=50 || true
  warn "Recent logs (app):"
  $DC logs app --tail=50 || true
  err "Deployment did not pass healthcheck. Investigate the logs above."
  exit 1
fi

# Check HTTP -> HTTPS redirect
REDIR_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/" || echo "000")
if [ "$REDIR_CODE" != "301" ] && [ "$REDIR_CODE" != "308" ]; then
  warn "HTTP redirect not detected (code=$REDIR_CODE). Check port 80 and your Caddyfile."
else
  ok "HTTP redirects to HTTPS."
fi

ok "Deployment successful!"
echo
echo -e "${BOLD}→ Visit:${RESET} https://${DOMAIN}"
echo -e "${DIM}(First certificate issuance can take ~30–60s after DNS is in place)${RESET}"
