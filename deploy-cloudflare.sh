#!/bin/bash
# =============================================================
# BIO-CLINIC: One-command deploy to Cloudflare Pages
# =============================================================
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
    echo "  3. Permission: Account > Cloudflare Pages > Edit"
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

echo "=== Bio-Clinic Cloudflare Pages Deploy ==="
echo "Project: bio-clinic"
echo "Site dir: $SITE_DIR"
echo "Account: $CLOUDFLARE_ACCOUNT_ID"
echo ""

# Verify site directory
if [ ! -f "$SITE_DIR/index.html" ]; then
    echo "ERROR: site/index.html not found. Are you in the repo root?"
    exit 1
fi

# Verify _redirects
REDIRECT_COUNT=$(wc -l < "$SITE_DIR/_redirects")
echo "Redirect rules: $REDIRECT_COUNT lines"

# Verify sitemap
SITEMAP_URLS=$(grep -c '<loc>' "$SITE_DIR/sitemap.xml" 2>/dev/null || echo 0)
echo "Sitemap URLs: $SITEMAP_URLS"

echo ""
echo "Deploying..."

cd "$SITE_DIR"
wrangler pages deploy . --project-name=bio-clinic

echo ""
echo "=== Deploy Complete ==="
echo "Live URL: https://bio-clinic.it"
echo "Pages URL: https://bio-clinic.pages.dev"
echo ""
echo "Next: run the validation script:"
echo "  bash audit-report/WAVE0-VALIDATION-SCRIPT.sh"
