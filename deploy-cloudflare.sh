#!/bin/bash
# =============================================================
# BIO-CLINIC: Clean deploy to Cloudflare Pages
# =============================================================
# Creates a clean deploy directory (excluding build artifacts,
# backups, scripts) and deploys only production assets.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="your-token-here"
#   export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
#   bash deploy-cloudflare.sh
# =============================================================

set -e

# ── Load credentials from config file ONLY if env vars are empty ──
# (mai sovrascrivere i secrets di GitHub Actions con il file locale:
#  il file puo' contenere un token scaduto — bug che rompeva i deploy CI)
SCRIPT_DIR_INIT="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR_INIT/.cloudflare-config"
if [ -f "$CONFIG_FILE" ] && { [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; }; then
    _SAVED_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
    _SAVED_ACCOUNT="${CLOUDFLARE_ACCOUNT_ID:-}"
    source "$CONFIG_FILE"
    # Ripristina i valori gia' presenti nell'ambiente (hanno la precedenza)
    [ -n "$_SAVED_TOKEN" ] && CLOUDFLARE_API_TOKEN="$_SAVED_TOKEN"
    [ -n "$_SAVED_ACCOUNT" ] && CLOUDFLARE_ACCOUNT_ID="$_SAVED_ACCOUNT"
    unset _SAVED_TOKEN _SAVED_ACCOUNT
fi

# Verify credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "ERROR: CLOUDFLARE_API_TOKEN is not set."
    echo ""
    echo "Set it via environment variable or .cloudflare-config file."
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "ERROR: CLOUDFLARE_ACCOUNT_ID is not set."
    echo ""
    echo "Set it via environment variable or .cloudflare-config file."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$SCRIPT_DIR/site"
FUNCTIONS_DIR="$SCRIPT_DIR/functions"
DEPLOY_DIR="$SCRIPT_DIR/.deploy-staging"
PROJECT_NAME="bio-clinic"
# Staging layout (v2 — includes Pages Functions):
#   .deploy-staging/
#     wrangler.toml   (bindings D1/KV + vars, output dir ./public)
#     functions/      (Pages Functions — booking/contact/admin API)
#     public/         (static site, tar-filtered copy of site/)

# Auto-update dateModified before deploy (if script exists and python3 available)
if [ -f "$SCRIPT_DIR/scripts/update-date-modified.py" ] && command -v python3 &>/dev/null; then
    echo "=== Pre-deploy: updating dateModified ==="
    TODAY=$(TZ='Europe/Rome' date +%Y-%m-%d)
    python3 "$SCRIPT_DIR/scripts/update-date-modified.py" --date "$TODAY" || true
    echo ""
fi

echo "=== Bio-Clinic Cloudflare Pages Deploy ==="
echo "Project: $PROJECT_NAME"
echo "Site dir: $SITE_DIR"
echo "Account: ${CLOUDFLARE_ACCOUNT_ID:0:8}..."
echo ""

# Verify site directory
if [ ! -f "$SITE_DIR/index.html" ]; then
    echo "ERROR: site/index.html not found. Are you in the repo root?"
    exit 1
fi

# -------------------------------------------------------
# Step 1: Create clean deploy directory
# -------------------------------------------------------
echo "Step 1: Creating clean deploy directory..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/public"

# Copy with tar (excluding unwanted dirs/files) — works without rsync
cd "$SITE_DIR" && tar cf - \
    --exclude='./output' \
    --exclude='./backups' \
    --exclude='./build' \
    --exclude='./salute/_drafts' \
    --exclude='./data/cache' \
    --exclude='./data/v2' \
    --exclude='./data/*.xlsx' \
    --exclude='./data/SCHEMA-VALIDAZIONE.json' \
    --exclude='./data/unified-entities-schema.json' \
    --exclude='./templates' \
    --exclude='./pages' \
    --exclude='./.github' \
    --exclude='./node_modules' \
    --exclude='./*.py' \
    --exclude='./*.sh' \
    --exclude='./*.csv' \
    --exclude='./*.zip' \
    --exclude='./*.tar.gz' \
    --exclude='./*.tar' \
    --exclude='./*.md' \
    --exclude='./*.log' \
    --exclude='./*.map' \
    --exclude='./.env' \
    --exclude='./wrangler.toml' \
    --exclude='./package.json' \
    --exclude='./package-lock.json' \
    --exclude='./link-check-report.txt' \
    --exclude='./bio-clinic-site.zip' \
    --exclude='./.deploy-version.bak' \
    . | (cd "$DEPLOY_DIR/public" && tar xf -)
# Note: Root ginecologia directories (assistenza-ostetrica, colposcopia, etc.)
# are now meta-refresh redirects (~450B each) and MUST be deployed.
# Previously excluded when they contained full duplicate content.
# Remove any backup files that slipped through (static assets only —
# never touch functions/, which legitimately contains .js source)
find "$DEPLOY_DIR/public" -name '*.backup*' -o -name '*.bak' -o -name '*.orig' -o -name '*.py' -o -name '*.sh' 2>/dev/null | xargs rm -f 2>/dev/null || true

# ── Include Pages Functions (booking API, contact, admin) ──
# CRITICAL: without this, /api/* returns 404 in production.
if [ -d "$FUNCTIONS_DIR" ]; then
    cp -r "$FUNCTIONS_DIR" "$DEPLOY_DIR/functions"
    FN_COUNT=$(find "$DEPLOY_DIR/functions" -name '*.js' | wc -l)
    echo "  Pages Functions included: $FN_COUNT files"
else
    echo "  WARNING: functions/ directory not found — API will not be deployed!"
fi

# ── Generate staging wrangler.toml (bindings from repo root config) ──
# pages_build_output_dir must point at ./public inside the staging dir.
sed 's|pages_build_output_dir = "./site"|pages_build_output_dir = "./public"|' \
    "$SCRIPT_DIR/wrangler.toml" > "$DEPLOY_DIR/wrangler.toml"
echo "  Staging wrangler.toml generated (output dir ./public, D1+KV bindings)."

# Count files
TOTAL_FILES=$(find "$DEPLOY_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
echo "  Clean deploy: $TOTAL_FILES files, $TOTAL_SIZE"

# Verify critical files
echo "  Verifying critical files..."
for f in index.html _redirects _headers sitemap.xml robots.txt; do
    if [ ! -f "$DEPLOY_DIR/public/$f" ]; then
        echo "  ERROR: Missing critical file: $f"
        rm -rf "$DEPLOY_DIR"
        exit 1
    fi
done

REDIRECT_COUNT=$(grep -c "301" "$DEPLOY_DIR/public/_redirects" 2>/dev/null || echo 0)
SITEMAP_URLS=$(grep -c '<loc>' "$DEPLOY_DIR/public/sitemap.xml" 2>/dev/null || echo 0)
echo "  Redirect rules: $REDIRECT_COUNT (301)"
echo "  Sitemap URLs: $SITEMAP_URLS"

# Verify no /pages/ content leaked through output/backups
LEAKED=$(find "$DEPLOY_DIR" -path "*/output/*" -o -path "*/backups/*" 2>/dev/null | wc -l)
if [ "$LEAKED" -gt 0 ]; then
    echo "  ERROR: Leaked files from output/backups!"
    rm -rf "$DEPLOY_DIR"
    exit 1
fi
echo "  No leaked output/backup files."

# -------------------------------------------------------
# Step 2: Deploy to Cloudflare Pages
# -------------------------------------------------------
# --stage-only: build staging dir and stop (for testing the layout)
if [ "${1:-}" = "--stage-only" ]; then
    echo ""
    echo "=== --stage-only: staging built at $DEPLOY_DIR, skipping deploy ==="
    exit 0
fi
echo ""
echo "Step 2: Deploying to Cloudflare Pages (production)..."
cd "$DEPLOY_DIR"
# No positional dir: wrangler reads pages_build_output_dir from the staging
# wrangler.toml and auto-detects ./functions next to it (Pages Functions).
wrangler pages deploy --project-name="$PROJECT_NAME" --branch=main --commit-dirty=true

# -------------------------------------------------------
# Step 3: Cleanup
# -------------------------------------------------------
echo ""
echo "Step 3: Cleaning up staging directory..."
rm -rf "$DEPLOY_DIR"

# -------------------------------------------------------
# Step 4: Cache purge (optional, requires Zone:Cache Purge permission)
# -------------------------------------------------------
echo ""
echo "Step 4: Attempting cache purge..."
ZONE_ID=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=bio-clinic.it" 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['result'][0]['id'])" 2>/dev/null || echo "")

if [ -n "$ZONE_ID" ]; then
    PURGE_RESULT=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' 2>/dev/null)
    
    if echo "$PURGE_RESULT" | grep -q '"success":true'; then
        echo "  Cache purged successfully."
    else
        echo "  Cache purge failed (token may lack Zone:Cache Purge permission)."
        echo "  Stale cached pages will expire within max-age (1h) + stale-while-revalidate (24h)."
    fi
else
    echo "  Could not find zone ID. Skipping cache purge."
fi

echo ""
echo "=== Deploy Complete ==="
echo "Live URL: https://bio-clinic.it"
echo "Pages URL: https://bio-clinic.pages.dev"
echo "Deployed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "Next steps:"
echo "  1. Wait 30 seconds for propagation"
echo "  2. Run validation: bash audit-report/WAVE0-VALIDATION-SCRIPT.sh"
echo "  3. Check: curl -sI https://bio-clinic.it/.deploy-version"
