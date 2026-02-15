#!/bin/bash
# Bio-Clinic Pre-Commit Validation
# Blocks commits with legacy patterns

echo "🔍 Pre-Commit Validation"
echo "========================"

ERRORS=0
EXCLUDE="--exclude-dir=templates --exclude-dir=node_modules --exclude-dir=output --exclude-dir=backups --exclude-dir=.git"

# 1. Check for /pages/ links in HTML
LEGACY=$(grep -rl $EXCLUDE 'href="/pages/' --include="*.html" . 2>/dev/null | wc -l)
if [ "$LEGACY" -gt 0 ]; then
    echo "❌ Found $LEGACY files with /pages/ links"
    grep -rl $EXCLUDE 'href="/pages/' --include="*.html" . 2>/dev/null
    ((ERRORS++))
else
    echo "✅ No /pages/ links"
fi

# 2. Check for plain relative .html links (dangerous)
RELATIVE=$(grep -rh $EXCLUDE 'href="[a-z][^/"]*\.html"' --include="*.html" . 2>/dev/null | head -5 | wc -l)
if [ "$RELATIVE" -gt 0 ]; then
    echo "⚠️ Found plain relative .html links (review manually)"
else
    echo "✅ No dangerous relative links"
fi

# 3. Check canonical has no /pages/
CANON_LEGACY=$(grep -rh $EXCLUDE 'canonical.*href="[^"]*\/pages\/' --include="*.html" . 2>/dev/null | wc -l)
if [ "$CANON_LEGACY" -gt 0 ]; then
    echo "❌ Found canonical pointing to /pages/"
    ((ERRORS++))
else
    echo "✅ No legacy canonical"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ COMMIT BLOCKED - Fix $ERRORS issues"
    exit 1
else
    echo "✅ All checks passed"
    exit 0
fi
