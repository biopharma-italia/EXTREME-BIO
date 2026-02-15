#!/usr/bin/env python3
"""
WAVE 0 Implementation: Bio-Clinic Infrastructure Stabilisation
================================================================
This script performs the ATOMIC deployment of Wave 0:
1. Creates root-level directories for all /pages/ with self-canonical URLs
2. Generates the new _redirects file with proper 301s
3. Fixes canonical tags
4. Generates clean sitemap.xml
5. Updates robots.txt
"""

import os
import re
import shutil
from datetime import datetime

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(SITE_DIR, 'pages')
DOMAIN = 'https://bio-clinic.it'

# ==============================================================================
# STEP 1: Map all /pages/ files → canonical targets
# ==============================================================================

def get_canonical(filepath):
    """Extract canonical URL from HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'rel="canonical"\s+href="([^"]*)"', content)
    if not match:
        match = re.search(r'href="([^"]*)"\s+rel="canonical"', content)
    return match.group(1) if match else None

def get_slug_from_canonical(canonical):
    """Extract slug path from canonical URL."""
    if canonical and canonical.startswith(DOMAIN):
        path = canonical[len(DOMAIN):]
        return path.rstrip('/')
    return None

# Build the mapping
pages_map = {}  # slug -> {file, canonical, canonical_slug, is_self_canonical}
for fname in sorted(os.listdir(PAGES_DIR)):
    if not fname.endswith('.html') or fname.endswith('.backup'):
        continue
    slug = fname[:-5]  # remove .html
    filepath = os.path.join(PAGES_DIR, fname)
    canonical = get_canonical(filepath)
    canonical_slug = get_slug_from_canonical(canonical) if canonical else None
    
    # Is it self-canonical? (canonical slug matches the page slug)
    is_self = canonical_slug and (canonical_slug == f'/{slug}' or canonical_slug == f'/{slug}/')
    
    pages_map[slug] = {
        'file': filepath,
        'canonical': canonical,
        'canonical_slug': canonical_slug,
        'is_self_canonical': is_self,
    }

print("=" * 70)
print("WAVE 0 IMPLEMENTATION - Bio-Clinic.it")
print("=" * 70)
print(f"\nTotal /pages/ files: {len(pages_map)}")
self_canonical = {k: v for k, v in pages_map.items() if v['is_self_canonical']}
cross_canonical = {k: v for k, v in pages_map.items() if not v['is_self_canonical']}
print(f"Self-canonical (need root dir): {len(self_canonical)}")
print(f"Cross-canonical (301 to hub/other): {len(cross_canonical)}")

# ==============================================================================
# STEP 2: Create root-level directories for self-canonical pages
# ==============================================================================

print("\n--- STEP 2: Creating root-level directories ---")
created = 0
already_exists = 0
skipped = 0

for slug, info in sorted(self_canonical.items()):
    target_dir = os.path.join(SITE_DIR, slug)
    target_file = os.path.join(target_dir, 'index.html')
    
    if os.path.exists(target_file):
        # Check if it's a real page or a redirect stub
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'http-equiv="refresh"' in content and len(content) < 2000:
            # It's a redirect stub — replace with real content
            print(f"  REPLACE stub: /{slug}/index.html")
            shutil.copy2(info['file'], target_file)
            created += 1
        else:
            # Already a real page
            already_exists += 1
    else:
        os.makedirs(target_dir, exist_ok=True)
        shutil.copy2(info['file'], target_file)
        print(f"  CREATE: /{slug}/index.html")
        created += 1

print(f"\n  Created: {created}, Already existed: {already_exists}")

# ==============================================================================
# STEP 3: Fix canonical tags on all new root pages
# ==============================================================================

print("\n--- STEP 3: Fixing canonical tags ---")
fixes = 0

# Fix canonicals on root-level pages to point to self (root URL, not /pages/)
for slug, info in sorted(self_canonical.items()):
    target_file = os.path.join(SITE_DIR, slug, 'index.html')
    if not os.path.exists(target_file):
        continue
    
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    correct_canonical = f'{DOMAIN}/{slug}/'
    
    # Check if canonical needs fixing
    current = re.search(r'(rel="canonical"\s+href=")([^"]*)("|href="([^"]*)"\s+rel="canonical")', content)
    if current:
        current_url = current.group(2) if current.group(2) else current.group(4)
        if current_url != correct_canonical:
            # Only fix if canonical points to self (self-canonical pages)
            # Don't change cross-canonical references
            new_content = re.sub(
                r'(rel="canonical"\s+href=")[^"]*(")',
                f'\\g<1>{correct_canonical}\\2',
                content
            )
            if new_content != content:
                with open(target_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                fixes += 1

print(f"  Canonical tags fixed: {fixes}")

# Also fix the special case: pages/visita-cardiologica-ecg
# This file has self-canonical pointing to itself instead of /cardiologia/visita-cardiologica-ecg/
vce_file = os.path.join(PAGES_DIR, 'visita-cardiologica-ecg.html') if os.path.exists(os.path.join(PAGES_DIR, 'visita-cardiologica-ecg.html')) else None
if vce_file and os.path.exists(vce_file):
    print("  NOTE: /pages/visita-cardiologica-ecg.html — will be handled by 301 redirect")

# ==============================================================================
# STEP 4: Generate new _redirects file
# ==============================================================================

print("\n--- STEP 4: Generating new _redirects file ---")

# Back up current _redirects
backup_path = os.path.join(SITE_DIR, f'_redirects.backup.wave0.{datetime.now().strftime("%Y%m%d%H%M%S")}')
current_redirects = os.path.join(SITE_DIR, '_redirects')
if os.path.exists(current_redirects):
    shutil.copy2(current_redirects, backup_path)
    print(f"  Backup: {os.path.basename(backup_path)}")

# Read existing _redirects to preserve non-/pages/ 301 rules
with open(current_redirects, 'r', encoding='utf-8') as f:
    existing_lines = f.readlines()

# Parse existing 301 rules that are NOT /pages/ rewrites
preserved_301s = []
for line in existing_lines:
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    parts = line.split()
    if len(parts) >= 3:
        source, target, code = parts[0], parts[1], parts[2]
        # Keep 301 redirects that don't start with /pages/ and aren't 200 rewrites to /pages/
        if code == '301' and not source.startswith('/pages/'):
            preserved_301s.append(line)

# Build new _redirects
new_redirects = []
new_redirects.append('# Cloudflare Pages Redirects')
new_redirects.append(f'# WAVE 0 DEPLOYMENT — {datetime.now().strftime("%Y-%m-%d")}')
new_redirects.append('# All /pages/ 200 rewrites REMOVED. Content now at root-level.')
new_redirects.append('# /pages/ URLs now 301 → canonical destinations.')
new_redirects.append('')

# SECTION 1: Equipe rewrites (these stay as 200 — /equipe/ still uses .html files)
new_redirects.append('# ============================================')
new_redirects.append('# EQUIPE REWRITES (200) — /equipe/ directory')
new_redirects.append('# ============================================')
equipe_dir = os.path.join(SITE_DIR, 'equipe')
if os.path.exists(equipe_dir):
    for fname in sorted(os.listdir(equipe_dir)):
        if fname.endswith('.html') and fname != 'index.html':
            name = fname[:-5]
            new_redirects.append(f'/equipe/{name}/ /equipe/{fname} 200')

# SECTION 2: Remaining 200 rewrites (only for files that CANNOT have root dirs)
new_redirects.append('')
new_redirects.append('# ============================================')
new_redirects.append('# SPECIAL REWRITES (200) — non-standard paths')
new_redirects.append('# ============================================')
new_redirects.append('/listino/ /listino-completo.html 200')
new_redirects.append('/pages/*.html /pages/:splat.html 200')

# SECTION 3: /pages/ → 301 redirects
new_redirects.append('')
new_redirects.append('# ============================================')
new_redirects.append('# /pages/ LEGACY → 301 TO CANONICAL (Wave 0)')
new_redirects.append('# ============================================')

# All self-canonical /pages/ → root slug
for slug in sorted(self_canonical.keys()):
    new_redirects.append(f'/pages/{slug} /{slug}/ 301')
    # Also handle .html variant
    new_redirects.append(f'/pages/{slug}.html /{slug}/ 301')

# All cross-canonical /pages/ → their canonical target
for slug, info in sorted(cross_canonical.items()):
    target = info['canonical_slug'] if info['canonical_slug'] else f'/{slug}/'
    # Ensure trailing slash
    if not target.endswith('/'):
        target += '/'
    new_redirects.append(f'/pages/{slug} {target} 301')
    new_redirects.append(f'/pages/{slug}.html {target} 301')

# SECTION 4: Preserved existing 301 redirects (non-/pages/)
new_redirects.append('')
new_redirects.append('# ============================================')
new_redirects.append('# EXISTING 301 REDIRECTS (preserved)')
new_redirects.append('# ============================================')
# Deduplicate and add
seen_sources = set()
for rule in preserved_301s:
    source = rule.split()[0]
    if source not in seen_sources:
        new_redirects.append(rule)
        seen_sources.add(source)

# Write new _redirects
with open(current_redirects, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_redirects) + '\n')

pages_301_count = sum(1 for l in new_redirects if '/pages/' in l and '301' in l)
print(f"  /pages/ 301 rules: {pages_301_count}")
print(f"  Equipe 200 rewrites: {sum(1 for l in new_redirects if '/equipe/' in l and '200' in l)}")
print(f"  Preserved 301s: {len(preserved_301s)}")
print(f"  Total lines: {len(new_redirects)}")

# ==============================================================================
# STEP 5: Generate clean sitemap.xml
# ==============================================================================

print("\n--- STEP 5: Generating clean sitemap.xml ---")

sitemap_urls = []
today = datetime.now().strftime('%Y-%m-%d')

# Add homepage
sitemap_urls.append(('/', '1.0', 'daily'))

# Add all hub pages (directories with index.html that are NOT service pages)
hubs = ['cardiologia', 'ginecologia', 'dermatologia', 'endocrinologia', 
        'neurologia', 'ortopedia', 'pma-fertilita', 'laboratorio',
        'ematologia', 'gastroenterologia', 'pneumologia', 'reumatologia',
        'urologia', 'oculistica', 'otorinolaringoiatria', 'slim-care',
        'slim-care-donna', 'chirurgia-vascolare', 'genetica',
        'isteroscopia', 'isterosalpingografia', 'medicina-del-lavoro',
        'mounjaro-tirzepatide-sassari', 'preparazione-esami',
        'prevenzione', 'screening-inps']

for hub in sorted(hubs):
    hub_dir = os.path.join(SITE_DIR, hub)
    if os.path.isdir(hub_dir) and os.path.exists(os.path.join(hub_dir, 'index.html')):
        sitemap_urls.append((f'/{hub}/', '0.9', 'weekly'))

# Add hierarchical pages (cardiologia cluster)
cardio_dir = os.path.join(SITE_DIR, 'cardiologia')
if os.path.isdir(cardio_dir):
    for item in sorted(os.listdir(cardio_dir)):
        item_path = os.path.join(cardio_dir, item)
        if os.path.isdir(item_path) and os.path.exists(os.path.join(item_path, 'index.html')):
            sitemap_urls.append((f'/cardiologia/{item}/', '0.8', 'weekly'))

# Add lab subpages
lab_dir = os.path.join(SITE_DIR, 'laboratorio')
if os.path.isdir(lab_dir):
    for item in sorted(os.listdir(lab_dir)):
        item_path = os.path.join(lab_dir, item)
        if os.path.isdir(item_path) and os.path.exists(os.path.join(item_path, 'index.html')):
            sitemap_urls.append((f'/laboratorio/{item}/', '0.8', 'weekly'))

# Add all self-canonical service pages (now at root level)
for slug in sorted(self_canonical.keys()):
    root_dir = os.path.join(SITE_DIR, slug)
    if os.path.isdir(root_dir) and os.path.exists(os.path.join(root_dir, 'index.html')):
        sitemap_urls.append((f'/{slug}/', '0.8', 'weekly'))

# Add institutional pages
institutional = ['chi-siamo', 'contatti', 'convenzioni', 'equipe',
                 'specialita', 'privacy', 'cookie', 'prestazioni']
for page in sorted(institutional):
    page_dir = os.path.join(SITE_DIR, page)
    if os.path.isdir(page_dir) and os.path.exists(os.path.join(page_dir, 'index.html')):
        sitemap_urls.append((f'/{page}/', '0.7', 'monthly'))

# Add equipe member pages (without trailing slash — their canonical format)
if os.path.exists(equipe_dir):
    for fname in sorted(os.listdir(equipe_dir)):
        if fname.endswith('.html') and fname != 'index.html' and fname != 'profilo.html':
            name = fname[:-5]
            sitemap_urls.append((f'/equipe/{name}/', '0.6', 'monthly'))

# Deduplicate
seen_urls = set()
unique_urls = []
for url_tuple in sitemap_urls:
    if url_tuple[0] not in seen_urls:
        seen_urls.add(url_tuple[0])
        unique_urls.append(url_tuple)

# Generate XML
xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for url_path, priority, changefreq in unique_urls:
    xml_lines.append('  <url>')
    xml_lines.append(f'    <loc>{DOMAIN}{url_path}</loc>')
    xml_lines.append(f'    <lastmod>{today}</lastmod>')
    xml_lines.append(f'    <changefreq>{changefreq}</changefreq>')
    xml_lines.append(f'    <priority>{priority}</priority>')
    xml_lines.append('  </url>')
xml_lines.append('</urlset>')

sitemap_path = os.path.join(SITE_DIR, 'sitemap.xml')
shutil.copy2(sitemap_path, os.path.join(SITE_DIR, f'sitemap.xml.backup.wave0'))
with open(sitemap_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml_lines) + '\n')

print(f"  Total URLs in sitemap: {len(unique_urls)}")
print(f"  Backup: sitemap.xml.backup.wave0")

# ==============================================================================
# STEP 6: Update robots.txt
# ==============================================================================

print("\n--- STEP 6: Updating robots.txt ---")

robots_content = """# Bio-Clinic.it Robots.txt
# Wave 0 deployment - {date}

User-agent: *
Crawl-delay: 1

# Allow all content
Allow: /

# Block legacy /pages/ directory (all content now at root URLs)
Disallow: /pages/

# Block utility paths
Disallow: /components/
Disallow: /templates/
Disallow: /data/
Disallow: /build/
Disallow: /scripts/
Disallow: /reports/
Disallow: /backups/
Disallow: /docs/
Disallow: /shop/
Disallow: /*.py$
Disallow: /*.sh$
Disallow: /*.backup*

# Sitemap
Sitemap: https://bio-clinic.it/sitemap.xml
""".format(date=today)

robots_path = os.path.join(SITE_DIR, 'robots.txt')
shutil.copy2(robots_path, os.path.join(SITE_DIR, 'robots.txt.backup.wave0'))
with open(robots_path, 'w', encoding='utf-8') as f:
    f.write(robots_content)

print(f"  robots.txt updated (Disallow: /pages/)")
print(f"  Backup: robots.txt.backup.wave0")

# ==============================================================================
# SUMMARY
# ==============================================================================

print("\n" + "=" * 70)
print("WAVE 0 IMPLEMENTATION COMPLETE")
print("=" * 70)
print(f"""
Actions performed:
  1. Created {created} root-level page directories with index.html
  2. Fixed {fixes} canonical tags 
  3. Generated new _redirects with {pages_301_count} /pages/ 301 rules
  4. Generated clean sitemap.xml with {len(unique_urls)} URLs
  5. Updated robots.txt to Disallow /pages/
  
Files modified:
  - _redirects (rewritten)
  - sitemap.xml (rewritten)
  - robots.txt (rewritten)
  
Files created:
  - {created} new slug/index.html directories
  
Backups created:
  - _redirects.backup.wave0.*
  - sitemap.xml.backup.wave0
  - robots.txt.backup.wave0
""")

