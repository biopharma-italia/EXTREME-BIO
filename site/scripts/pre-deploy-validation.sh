#!/bin/bash
# Bio-Clinic Pre-Deploy Validation Script
# Run before every deployment

set -e
echo "🔍 Bio-Clinic Pre-Deploy Validation"
echo "===================================="

SITE_DIR="${1:-.}"
cd "$SITE_DIR"

ERRORS=0
WARNINGS=0

# 1. Check all internal links are root-relative
echo -e "\n📋 1. Link Validation..."
BAD_LINKS=$(grep -rh 'href="[^/#h][^"]*\.html"' --include="*.html" . 2>/dev/null | grep -v 'templates/' | wc -l)
if [ "$BAD_LINKS" -gt 5 ]; then
    echo "  ❌ Found $BAD_LINKS non-root-relative links"
    ((ERRORS++))
else
    echo "  ✅ Links OK ($BAD_LINKS minor issues)"
fi

# 2. Check canonical tags
echo -e "\n📋 2. Canonical Tags..."
NO_CANONICAL=$(grep -rL 'rel="canonical"' --include="*.html" . 2>/dev/null | grep -v 'templates/' | grep -v 'test' | wc -l)
if [ "$NO_CANONICAL" -gt 3 ]; then
    echo "  ⚠️  $NO_CANONICAL pages missing canonical"
    ((WARNINGS++))
else
    echo "  ✅ Canonical tags OK"
fi

# 3. Check sitemap exists and is valid
echo -e "\n📋 3. Sitemap..."
if [ -f "sitemap.xml" ]; then
    URL_COUNT=$(grep -c "<loc>" sitemap.xml)
    echo "  ✅ sitemap.xml exists ($URL_COUNT URLs)"
else
    echo "  ❌ sitemap.xml missing!"
    ((ERRORS++))
fi

# 4. Check _redirects
echo -e "\n📋 4. Redirects..."
if [ -f "_redirects" ]; then
    RULE_COUNT=$(grep -v '^#' _redirects | grep -v '^$' | wc -l)
    echo "  ✅ _redirects exists ($RULE_COUNT rules)"
else
    echo "  ⚠️  _redirects missing"
    ((WARNINGS++))
fi

# 5. Check robots.txt
echo -e "\n📋 5. Robots.txt..."
if [ -f "robots.txt" ]; then
    echo "  ✅ robots.txt exists"
else
    echo "  ⚠️  robots.txt missing"
    ((WARNINGS++))
fi

# Summary
echo -e "\n===================================="
echo "📊 VALIDATION SUMMARY"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"

if [ "$ERRORS" -gt 0 ]; then
    echo -e "\n❌ DEPLOY BLOCKED - Fix errors first!"
    exit 1
else
    echo -e "\n✅ READY TO DEPLOY"
    exit 0
fi
