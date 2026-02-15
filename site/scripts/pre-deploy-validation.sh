#!/bin/bash
# Bio-Clinic Pre-Deploy Validation Script
# Run before every deployment

echo "🔍 Bio-Clinic Pre-Deploy Validation"
echo "===================================="

SITE_DIR="${1:-.}"
cd "$SITE_DIR"

ERRORS=0
WARNINGS=0

# 1. Check for problematic plain-relative .html links (not in templates)
echo -e "\n📋 1. Link Validation..."
BAD_LINKS=$(find . -name "*.html" -not -path "./templates/*" -not -path "./node_modules/*" | xargs grep -l 'href="[a-z][^"]*\.html"' 2>/dev/null | grep -v test | wc -l || echo 0)
if [ "$BAD_LINKS" -gt 3 ]; then
    echo "  ⚠️  Found $BAD_LINKS files with plain-relative links"
    ((WARNINGS++))
else
    echo "  ✅ Links OK"
fi

# 2. Check canonical tags
echo -e "\n📋 2. Canonical Tags..."
NO_CANONICAL=$(find . -name "*.html" -not -path "./templates/*" -not -path "./components/*" | xargs grep -L 'rel="canonical"' 2>/dev/null | grep -v test | wc -l || echo 0)
if [ "$NO_CANONICAL" -gt 5 ]; then
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
