#!/usr/bin/env python3
"""
============================================================================
CGE CONSENT MODE v2 DEPLOYMENT
============================================================================
Injects Google Consent Mode v2 default settings BEFORE the GTM snippet
on ALL pages. This is CRITICAL because consent defaults must fire before
GTM loads to properly block analytics/ads tags until consent is given.

Target: 264 content pages
Container: GTM-PWZWX5RS
GA4: G-9EXCL016VJ

GDPR Compliance:
- ad_storage: denied (default)
- ad_user_data: denied (default)
- ad_personalization: denied (default)
- analytics_storage: denied (default)
- wait_for_update: 500ms (for Iubenda CMP to load)

Author: CGE Implementation
Date: 2026-02-16
============================================================================
"""

import os
import re
import json
from pathlib import Path

SITE_DIR = Path('/home/user/webapp/site')

# The consent mode v2 snippet that MUST fire before GTM
CONSENT_MODE_SNIPPET = """<!-- Google Consent Mode v2 (MUST fire before GTM) -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'granted',
  'personalization_storage': 'denied',
  'security_storage': 'granted',
  'wait_for_update': 500
});
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'region': ['IT', 'EU']
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
</script>
<!-- End Consent Mode v2 -->"""

# Patterns to detect existing consent mode injection
CONSENT_PATTERN = re.compile(
    r'<!-- Google Consent Mode v2.*?<!-- End Consent Mode v2 -->', re.S
)

# Pattern to detect GTM snippet
GTM_PATTERN = re.compile(
    r'(<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)\{.*?GTM-PWZWX5RS.*?</script>\s*<!-- End Google Tag Manager -->)',
    re.S
)


def is_redirect_page(content):
    return 'http-equiv="refresh"' in content.lower() and 'noindex' in content.lower()


def process_file(filepath):
    """Inject Consent Mode v2 before the GTM snippet."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        return False, f"read_error: {e}"

    if len(content) < 200:
        return False, "too_small"

    if is_redirect_page(content):
        return False, "redirect"

    if '<html' not in content.lower():
        return False, "not_html"

    original = content

    # Step 1: Remove existing consent mode snippet if present
    content = CONSENT_PATTERN.sub('', content)

    # Step 2: Find the GTM snippet
    gtm_match = GTM_PATTERN.search(content)
    if not gtm_match:
        return False, "no_gtm_found"

    # Step 3: Check if consent mode already exists before GTM
    before_gtm = content[:gtm_match.start()]
    if "gtag('consent', 'default'" in before_gtm:
        return False, "consent_already_present"

    # Step 4: Insert consent mode snippet RIGHT BEFORE the GTM snippet
    insert_pos = gtm_match.start()
    content = content[:insert_pos] + CONSENT_MODE_SNIPPET + "\n" + content[insert_pos:]

    # Step 5: Write back if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "consent_injected"

    return False, "no_changes"


def main():
    print("=" * 70)
    print("CGE CONSENT MODE v2 DEPLOYMENT")
    print("=" * 70)

    # Find all HTML files
    exclude_dirs = {'backups', 'build', 'output', 'reports', 'components',
                    'templates', 'docs', 'scripts', 'data', '.github', '.wrangler'}

    html_files = []
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.html'):
                html_files.append(Path(root) / f)

    html_files.sort()
    print(f"Found {len(html_files)} HTML files")
    print("-" * 70)

    stats = {
        'total': 0,
        'injected': 0,
        'skipped_redirect': 0,
        'skipped_small': 0,
        'skipped_no_gtm': 0,
        'skipped_already': 0,
        'errors': 0,
    }

    for filepath in html_files:
        rel = filepath.relative_to(SITE_DIR)
        stats['total'] += 1

        modified, result = process_file(filepath)

        if modified:
            stats['injected'] += 1
            print(f"  [OK] {rel}")
        else:
            if result == 'redirect':
                stats['skipped_redirect'] += 1
            elif result == 'too_small':
                stats['skipped_small'] += 1
            elif result == 'no_gtm_found':
                stats['skipped_no_gtm'] += 1
            elif result == 'consent_already_present':
                stats['skipped_already'] += 1
            elif result.startswith('read_error'):
                stats['errors'] += 1
                print(f"  [ERR] {rel}: {result}")

    # Verification pass
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)

    total_content = 0
    has_consent = 0
    consent_before_gtm = 0
    missing = []

    for filepath in html_files:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                c = f.read()
        except:
            continue

        if is_redirect_page(c) or len(c) < 200:
            continue

        total_content += 1
        rel = str(filepath.relative_to(SITE_DIR))

        if "gtag('consent', 'default'" in c:
            has_consent += 1
            # Check if consent is BEFORE GTM
            consent_pos = c.index("gtag('consent', 'default'")
            gtm_pos = c.find('GTM-PWZWX5RS')
            if gtm_pos > -1 and consent_pos < gtm_pos:
                consent_before_gtm += 1
            else:
                missing.append(f"{rel} (consent AFTER GTM!)")
        else:
            missing.append(rel)

    print(f"Content pages:         {total_content}")
    print(f"Has Consent Mode:      {has_consent}/{total_content} ({has_consent/max(total_content,1)*100:.1f}%)")
    print(f"Consent BEFORE GTM:    {consent_before_gtm}/{total_content} ({consent_before_gtm/max(total_content,1)*100:.1f}%)")

    if missing:
        print(f"\nMissing/misplaced ({len(missing)}):")
        for p in missing[:20]:
            print(f"  - {p}")
        if len(missing) > 20:
            print(f"  ... +{len(missing)-20} more")
    else:
        print("\n*** 100% CONSENT MODE v2 COVERAGE (before GTM) ***")

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Total files:        {stats['total']}")
    print(f"  Consent injected:   {stats['injected']}")
    print(f"  Skipped redirect:   {stats['skipped_redirect']}")
    print(f"  Skipped small:      {stats['skipped_small']}")
    print(f"  Skipped no GTM:     {stats['skipped_no_gtm']}")
    print(f"  Already present:    {stats['skipped_already']}")
    print(f"  Errors:             {stats['errors']}")

    return stats


if __name__ == '__main__':
    main()
