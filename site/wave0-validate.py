#!/usr/bin/env python3
"""
WAVE 0 Validation Script
=========================
Validates that all Wave 0 changes are internally consistent BEFORE deployment.
Tests file system (not HTTP), checking:
1. Every self-canonical /pages/ file has a corresponding root slug/index.html
2. Every root slug/index.html has correct self-referencing canonical
3. _redirects has 301 for every /pages/ slug
4. _redirects has NO 200 rewrites to /pages/ (except catch-all comment)
5. sitemap.xml contains only URLs that resolve to real files
6. No redirect loops possible
7. No orphan /pages/ files without a 301 rule
"""

import os
import re
import sys
from collections import defaultdict

SITE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(SITE_DIR, 'pages')
DOMAIN = 'https://bio-clinic.it'

PASS = 0
FAIL = 0
WARN = 0

def check(condition, message, is_warning=False):
    global PASS, FAIL, WARN
    if condition:
        PASS += 1
        # Don't print passes to reduce noise
    else:
        if is_warning:
            WARN += 1
            print(f"  WARN: {message}")
        else:
            FAIL += 1
            print(f"  FAIL: {message}")

def get_canonical(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'rel="canonical"\s+href="([^"]*)"', content)
    if not match:
        match = re.search(r'href="([^"]*)"\s+rel="canonical"', content)
    return match.group(1) if match else None

print("=" * 70)
print("WAVE 0 VALIDATION REPORT")
print("=" * 70)

# ==============================================================================
# TEST 1: Every /pages/ file has a matching 301 rule
# ==============================================================================
print("\n--- TEST 1: Every /pages/ file covered by 301 redirect ---")

with open(os.path.join(SITE_DIR, '_redirects'), 'r') as f:
    redirects_content = f.read()
redirect_lines = [l.strip() for l in redirects_content.split('\n') if l.strip() and not l.strip().startswith('#')]

# Build set of 301 sources
redirect_sources = set()
for line in redirect_lines:
    parts = line.split()
    if len(parts) >= 3 and parts[2] == '301':
        redirect_sources.add(parts[0])

pages_files = [f[:-5] for f in os.listdir(PAGES_DIR) if f.endswith('.html') and not f.endswith('.backup')]

for slug in sorted(pages_files):
    has_rule = f'/pages/{slug}' in redirect_sources or f'/pages/{slug}.html' in redirect_sources
    check(has_rule, f"/pages/{slug} has NO 301 redirect rule")

t1_total = len(pages_files)
t1_covered = sum(1 for s in pages_files if f'/pages/{s}' in redirect_sources or f'/pages/{s}.html' in redirect_sources)
print(f"  Result: {t1_covered}/{t1_total} /pages/ files covered by 301 rules")

# ==============================================================================
# TEST 2: No 200 rewrites to /pages/ remain
# ==============================================================================
print("\n--- TEST 2: No 200 rewrites to /pages/ remain ---")

bad_rewrites = []
for line in redirect_lines:
    parts = line.split()
    if len(parts) >= 3 and parts[2] == '200' and '/pages/' in parts[1]:
        bad_rewrites.append(line)

for bw in bad_rewrites:
    check(False, f"200 rewrite to /pages/ found: {bw}")

if not bad_rewrites:
    check(True, "")
    print(f"  Result: 0 dangerous 200 rewrites to /pages/ — CLEAN")

# ==============================================================================
# TEST 3: Self-canonical pages have root directory
# ==============================================================================
print("\n--- TEST 3: Self-canonical /pages/ files have root slug/index.html ---")

self_canonical_count = 0
missing_root = []
for slug in sorted(pages_files):
    filepath = os.path.join(PAGES_DIR, f'{slug}.html')
    canonical = get_canonical(filepath)
    if not canonical:
        continue
    
    canonical_path = canonical.replace(DOMAIN, '').rstrip('/')
    is_self = canonical_path == f'/{slug}'
    
    if is_self:
        self_canonical_count += 1
        root_index = os.path.join(SITE_DIR, slug, 'index.html')
        has_root = os.path.exists(root_index)
        if not has_root:
            missing_root.append(slug)
        check(has_root, f"/{slug}/ has no index.html (self-canonical but no root dir)")

print(f"  Result: {self_canonical_count - len(missing_root)}/{self_canonical_count} self-canonical pages have root dirs")
if missing_root:
    print(f"  MISSING: {', '.join(missing_root)}")

# ==============================================================================
# TEST 4: Root pages have correct canonical tags
# ==============================================================================
print("\n--- TEST 4: Root pages have correct self-referencing canonical ---")

bad_canonicals = []
for slug in sorted(pages_files):
    filepath = os.path.join(PAGES_DIR, f'{slug}.html')
    canonical = get_canonical(filepath)
    if not canonical:
        continue
    canonical_path = canonical.replace(DOMAIN, '').rstrip('/')
    is_self = canonical_path == f'/{slug}'
    
    if is_self:
        root_index = os.path.join(SITE_DIR, slug, 'index.html')
        if os.path.exists(root_index):
            root_canonical = get_canonical(root_index)
            expected = f'{DOMAIN}/{slug}/'
            if root_canonical != expected:
                bad_canonicals.append((slug, root_canonical, expected))
                check(False, f"/{slug}/ canonical={root_canonical}, expected={expected}")
            else:
                check(True, "")

if not bad_canonicals:
    print(f"  Result: All root pages have correct canonical tags")
else:
    print(f"  Result: {len(bad_canonicals)} pages have wrong canonical")

# ==============================================================================
# TEST 5: Sitemap URLs correspond to real files
# ==============================================================================
print("\n--- TEST 5: Sitemap URLs resolve to real files ---")

with open(os.path.join(SITE_DIR, 'sitemap.xml'), 'r') as f:
    sitemap_content = f.read()

sitemap_urls = re.findall(r'<loc>([^<]*)</loc>', sitemap_content)
missing_files = []

for url in sitemap_urls:
    path = url.replace(DOMAIN, '').rstrip('/')
    if path == '':
        path = '/'
    
    # Check if file exists
    if path == '/':
        exists = os.path.exists(os.path.join(SITE_DIR, 'index.html'))
    else:
        # Try slug/index.html first, then slug.html
        slug = path.lstrip('/')
        exists = (
            os.path.exists(os.path.join(SITE_DIR, slug, 'index.html')) or
            os.path.exists(os.path.join(SITE_DIR, slug + '.html'))
        )
    
    if not exists:
        # Check if it's served by a _redirects rewrite
        path_with_slash = path + '/' if not path.endswith('/') else path
        served_by_rewrite = any(
            line.split()[0] == path_with_slash and line.split()[2] == '200'
            for line in redirect_lines
            if len(line.split()) >= 3
        )
        exists = served_by_rewrite
    
    if not exists:
        missing_files.append(url)
    check(exists, f"Sitemap URL has no file: {url}")

print(f"  Result: {len(sitemap_urls) - len(missing_files)}/{len(sitemap_urls)} sitemap URLs have backing files")
if missing_files:
    for mf in missing_files:
        print(f"    MISSING: {mf}")

# ==============================================================================
# TEST 6: No redirect loops detectable
# ==============================================================================
print("\n--- TEST 6: No redirect loops in _redirects ---")

# Build redirect graph
redirects = {}
for line in redirect_lines:
    parts = line.split()
    if len(parts) >= 3 and parts[2] == '301':
        redirects[parts[0]] = parts[1]

loops = []
for source, target in redirects.items():
    # Follow the chain
    visited = {source}
    current = target
    depth = 0
    while current in redirects and depth < 10:
        if current in visited:
            loops.append((source, current))
            break
        visited.add(current)
        current = redirects[current]
        depth += 1

for src, loop_at in loops:
    check(False, f"Redirect loop: {src} → ... → {loop_at} → ...")

if not loops:
    check(True, "")
    print(f"  Result: No redirect loops detected in {len(redirects)} rules")

# ==============================================================================
# TEST 7: Redirect chains (max 1 hop)
# ==============================================================================
print("\n--- TEST 7: No multi-hop redirect chains ---")

chains = []
for source, target in redirects.items():
    if target in redirects:
        chains.append((source, target, redirects[target]))

for src, mid, final in chains:
    check(False, f"Chain: {src} → {mid} → {final}", is_warning=True)

if not chains:
    check(True, "")
    print(f"  Result: No multi-hop chains — all redirects are single-hop")
else:
    print(f"  Result: {len(chains)} multi-hop chains found (should be flattened)")

# ==============================================================================
# TEST 8: _redirects line count within Cloudflare limit
# ==============================================================================
print("\n--- TEST 8: Cloudflare Pages limits ---")

total_rules = len(redirect_lines)
static_rules = sum(1 for l in redirect_lines if '*' not in l.split()[0] and ':' not in l.split()[0])
dynamic_rules = total_rules - static_rules

check(static_rules <= 2000, f"Static rules ({static_rules}) exceed Cloudflare limit of 2000")
check(dynamic_rules <= 100, f"Dynamic rules ({dynamic_rules}) exceed Cloudflare limit of 100")
print(f"  Static rules: {static_rules}/2000, Dynamic rules: {dynamic_rules}/100")

# ==============================================================================
# SUMMARY
# ==============================================================================
print("\n" + "=" * 70)
total = PASS + FAIL + WARN
print(f"VALIDATION SUMMARY: {PASS} PASS / {FAIL} FAIL / {WARN} WARN (total {total})")
if FAIL == 0:
    print("STATUS: ✓ ALL TESTS PASSED — READY FOR DEPLOYMENT")
else:
    print(f"STATUS: ✗ {FAIL} FAILURES — FIX BEFORE DEPLOYING")
print("=" * 70)

sys.exit(1 if FAIL > 0 else 0)

