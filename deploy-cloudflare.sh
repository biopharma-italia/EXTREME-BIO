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

# Verify credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "ERROR: CLOUDFLARE_API_TOKEN is not set."
    echo ""
    echo "To create a token:"
    echo "  1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "  2. Create Custom Token"
    echo "  3. Permissions:"
    echo "     - Account > Cloudflare Pages > Edit"
    echo "     - Zone > Cache Purge > Purge (recommended)"
    echo "  4. export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "ERROR: CLOUDFLARE_ACCOUNT_ID is not set."
    echo ""
    echo "To find your Account ID:"
    echo "  1. Go to https://dash.cloudflare.com"
    echo "  2. Check URL: https://dash.cloudflare.com/XXXXXXXXXX"
    echo "  3. export CLOUDFLARE_ACCOUNT_ID='XXXXXXXXXX'"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$SCRIPT_DIR/site"
DEPLOY_DIR="$SCRIPT_DIR/.deploy-staging"
PROJECT_NAME="bio-clinic"

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
mkdir -p "$DEPLOY_DIR"

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
    . | (cd "$DEPLOY_DIR" && tar xf -)
# Note: Root ginecologia directories (assistenza-ostetrica, colposcopia, etc.)
# are now meta-refresh redirects (~450B each) and MUST be deployed.
# Previously excluded when they contained full duplicate content.
# Remove any backup files that slipped through
find "$DEPLOY_DIR" -name '*.backup*' -o -name '*.bak' -o -name '*.orig' -o -name '*.py' -o -name '*.sh' 2>/dev/null | xargs rm -f 2>/dev/null || true

# Count files
TOTAL_FILES=$(find "$DEPLOY_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
echo "  Clean deploy: $TOTAL_FILES files, $TOTAL_SIZE"

# Verify critical files
echo "  Verifying critical files..."
for f in index.html _redirects _headers sitemap.xml robots.txt; do
    if [ ! -f "$DEPLOY_DIR/$f" ]; then
        echo "  ERROR: Missing critical file: $f"
        rm -rf "$DEPLOY_DIR"
        exit 1
    fi
done

REDIRECT_COUNT=$(grep -c "301" "$DEPLOY_DIR/_redirects" 2>/dev/null || echo 0)
SITEMAP_URLS=$(grep -c '<loc>' "$DEPLOY_DIR/sitemap.xml" 2>/dev/null || echo 0)
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
echo ""
echo "Step 2: Deploying to Cloudflare Pages (production)..."
cd "$DEPLOY_DIR"
wrangler pages deploy . --project-name="$PROJECT_NAME" --branch=main --commit-dirty=true

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
