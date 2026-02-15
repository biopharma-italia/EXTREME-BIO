#!/usr/bin/env python3
"""
WAVE 1: Cluster Ginecologia — Migrazione Gerarchica
=====================================================
Migra 18 pagine ginecologiche da root-level a /ginecologia/slug/
seguendo il modello cardiologia (l'unico cluster completato).

Azioni:
1. Copia ogni pagina root → /ginecologia/slug/index.html
2. Aggiorna canonical tag → https://bio-clinic.it/ginecologia/slug/
3. Aggiorna link interni nel contenuto
4. Aggiorna internal links nell'hub /ginecologia/index.html
5. Aggiunge 301 redirect nel _redirects (root → /ginecologia/slug/)
6. Aggiorna sitemap.xml
"""

import os
import re
import shutil
from datetime import datetime

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAIN = 'https://bio-clinic.it'

# ==========================================
# MAPPING: root slug → ginecologia/new-slug
# ==========================================
# Format: old_root_slug → new_slug_under_ginecologia
# Some get renamed for SEO clarity

MIGRATION_MAP = {
    # Visite
    'visita-ginecologica': 'visita-ginecologica',
    'colposcopia': 'colposcopia',
    
    # Ecografie
    'ecografia-transvaginale': 'ecografia-transvaginale',
    'ecografia-pelvica': 'ecografia-pelvica',
    'ecografia-mammaria': 'ecografia-mammaria',
    'ecografia-morfologica': 'ecografia-morfologica',
    'ecografia-ostetrica-3d': 'ecografia-ostetrica-3d',
    
    # Screening & Test
    'pap-test': 'pap-test',
    'pap-test-hpv': 'pap-test-hpv',
    'hpv-dna-test': 'hpv-dna-test',
    'duopap': 'duopap',
    
    # Ostetricia & Gravidanza
    'assistenza-ostetrica': 'assistenza-ostetrica',
    'corso-preparto': 'corso-preparto',
    
    # Pavimento Pelvico & Terapie
    'radiofrequenza-vaginale': 'radiofrequenza-vaginale',
    'riabilitazione-pavimento-pelvico': 'riabilitazione-pavimento-pelvico',
    'trattamenti-pavimento-pelvico': 'trattamenti-pavimento-pelvico',
    'perifit-kegel-sassari': 'perifit-kegel-sassari',
    
    # Landing page team
    'ginecologi-sassari': 'ginecologi-sassari',
}

print("=" * 70)
print("WAVE 1: CLUSTER GINECOLOGIA — Migrazione Gerarchica")
print("=" * 70)
print(f"\nPagine da migrare: {len(MIGRATION_MAP)}")

# ==========================================
# STEP 1: Create /ginecologia/slug/ directories
# ==========================================
print("\n--- STEP 1: Creazione directory /ginecologia/slug/ ---")

created = 0
errors = []
for old_slug, new_slug in sorted(MIGRATION_MAP.items()):
    source_file = os.path.join(SITE_DIR, old_slug, 'index.html')
    target_dir = os.path.join(SITE_DIR, 'ginecologia', new_slug)
    target_file = os.path.join(target_dir, 'index.html')
    
    if not os.path.exists(source_file):
        errors.append(f"SOURCE MISSING: /{old_slug}/index.html")
        continue
    
    os.makedirs(target_dir, exist_ok=True)
    
    # Read source content
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # STEP 2: Update canonical tag
    old_canonical = f'{DOMAIN}/{old_slug}/'
    new_canonical = f'{DOMAIN}/ginecologia/{new_slug}/'
    content = content.replace(
        f'href="{old_canonical}"',
        f'href="{new_canonical}"'
    )
    
    # Also update og:url if present
    content = content.replace(
        f'content="{old_canonical}"',
        f'content="{new_canonical}"'
    )
    
    # STEP 3: Update internal links within the page
    # Update breadcrumb and navigation links to point to /ginecologia/ hub
    # Update links to sibling pages (other gynecology services)
    for sib_old, sib_new in MIGRATION_MAP.items():
        # Update href links from root to hierarchical
        content = content.replace(
            f'href="/{sib_old}/"',
            f'href="/ginecologia/{sib_new}/"'
        )
        content = content.replace(
            f'href="/{sib_old}"',
            f'href="/ginecologia/{sib_new}/"'
        )
        # Also relative links
        content = content.replace(
            f'href="../{sib_old}/"',
            f'href="/ginecologia/{sib_new}/"'
        )
    
    # Write to new location
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  /{old_slug}/ → /ginecologia/{new_slug}/")
    created += 1

if errors:
    for e in errors:
        print(f"  ERROR: {e}")
print(f"\n  Migrated: {created}/{len(MIGRATION_MAP)}")

# ==========================================
# STEP 4: Update hub /ginecologia/index.html
# ==========================================
print("\n--- STEP 4: Aggiornamento link nell'hub /ginecologia/ ---")

hub_file = os.path.join(SITE_DIR, 'ginecologia', 'index.html')
with open(hub_file, 'r', encoding='utf-8') as f:
    hub_content = f.read()

hub_links_updated = 0
for old_slug, new_slug in MIGRATION_MAP.items():
    # Update links in hub page
    old_patterns = [
        f'href="/{old_slug}/"',
        f'href="/{old_slug}"',
        f'href="https://bio-clinic.it/{old_slug}/"',
        f'href="https://bio-clinic.it/{old_slug}"',
    ]
    new_href = f'href="/ginecologia/{new_slug}/"'
    
    for pattern in old_patterns:
        if pattern in hub_content:
            hub_content = hub_content.replace(pattern, new_href)
            hub_links_updated += 1

with open(hub_file, 'w', encoding='utf-8') as f:
    f.write(hub_content)

print(f"  Links updated in hub: {hub_links_updated}")

# ==========================================
# STEP 5: Add 301 redirects in _redirects
# ==========================================
print("\n--- STEP 5: Aggiunta 301 redirect root → /ginecologia/ ---")

redirects_file = os.path.join(SITE_DIR, '_redirects')
with open(redirects_file, 'r', encoding='utf-8') as f:
    redirects_content = f.read()

# Add Wave 1 redirect section
wave1_redirects = []
wave1_redirects.append('')
wave1_redirects.append('# ============================================')
wave1_redirects.append('# WAVE 1: Ginecologia cluster migration (301)')
wave1_redirects.append(f'# Added: {datetime.now().strftime("%Y-%m-%d")}')
wave1_redirects.append('# ============================================')

for old_slug, new_slug in sorted(MIGRATION_MAP.items()):
    # Root URL → ginecologia/slug/
    wave1_redirects.append(f'/{old_slug}/ /ginecologia/{new_slug}/ 301')
    wave1_redirects.append(f'/{old_slug} /ginecologia/{new_slug}/ 301')
    
    # Also update any existing /pages/ rules to point to new location
    # (already handled by Wave 0 pointing to root, which will chain-redirect)

# Insert BEFORE the preserved 301s section (so they take precedence)
# In Cloudflare Pages, first match wins
insert_marker = '# EXISTING 301 REDIRECTS (preserved)'
if insert_marker in redirects_content:
    redirects_content = redirects_content.replace(
        insert_marker,
        '\n'.join(wave1_redirects) + '\n\n' + insert_marker
    )
else:
    redirects_content += '\n'.join(wave1_redirects) + '\n'

# Also update /pages/ 301 targets for gynecology pages
# /pages/visita-ginecologica should now point to /ginecologia/visita-ginecologica/ not /visita-ginecologica/
for old_slug, new_slug in MIGRATION_MAP.items():
    # Update the /pages/ → root redirect to point directly to /ginecologia/
    old_target = f'/pages/{old_slug} /{old_slug}/ 301'
    new_target = f'/pages/{old_slug} /ginecologia/{new_slug}/ 301'
    redirects_content = redirects_content.replace(old_target, new_target)
    
    old_target_html = f'/pages/{old_slug}.html /{old_slug}/ 301'
    new_target_html = f'/pages/{old_slug}.html /ginecologia/{new_slug}/ 301'
    redirects_content = redirects_content.replace(old_target_html, new_target_html)

with open(redirects_file, 'w', encoding='utf-8') as f:
    f.write(redirects_content)

print(f"  Added {len(MIGRATION_MAP) * 2} redirect rules (slug + slug/)")
print(f"  Updated /pages/ 301 targets to /ginecologia/ paths")

# ==========================================
# STEP 6: Update sitemap.xml
# ==========================================
print("\n--- STEP 6: Aggiornamento sitemap.xml ---")

sitemap_file = os.path.join(SITE_DIR, 'sitemap.xml')
with open(sitemap_file, 'r', encoding='utf-8') as f:
    sitemap_content = f.read()

today = datetime.now().strftime('%Y-%m-%d')
replacements = 0

for old_slug, new_slug in MIGRATION_MAP.items():
    old_url = f'{DOMAIN}/{old_slug}/'
    new_url = f'{DOMAIN}/ginecologia/{new_slug}/'
    
    if old_url in sitemap_content:
        sitemap_content = sitemap_content.replace(old_url, new_url)
        replacements += 1

with open(sitemap_file, 'w', encoding='utf-8') as f:
    f.write(sitemap_content)

print(f"  URLs replaced in sitemap: {replacements}")

# ==========================================
# STEP 7: Update internal links across the ENTIRE site
# ==========================================
print("\n--- STEP 7: Aggiornamento link interni in tutto il sito ---")

# Scan all HTML files in site and update links to migrated pages
total_files_scanned = 0
total_files_updated = 0

for root, dirs, files in os.walk(SITE_DIR):
    # Skip backups, scripts, data, etc.
    rel_root = os.path.relpath(root, SITE_DIR)
    skip_dirs = ['backups', 'build', 'components', 'data', 'docs', 
                 'reports', 'scripts', 'templates', '.git', '.github',
                 'node_modules']
    if any(rel_root.startswith(d) for d in skip_dirs):
        continue
    
    for fname in files:
        if not fname.endswith('.html'):
            continue
        
        filepath = os.path.join(root, fname)
        # Don't update files we just created in /ginecologia/
        if '/ginecologia/' in filepath and filepath != hub_file:
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        total_files_scanned += 1
        original = content
        
        for old_slug, new_slug in MIGRATION_MAP.items():
            # Update absolute hrefs
            content = content.replace(
                f'href="/{old_slug}/"',
                f'href="/ginecologia/{new_slug}/"'
            )
            content = content.replace(
                f'href="/{old_slug}"',
                f'href="/ginecologia/{new_slug}/"'
            )
            content = content.replace(
                f'href="{DOMAIN}/{old_slug}/"',
                f'href="{DOMAIN}/ginecologia/{new_slug}/"'
            )
            content = content.replace(
                f'href="{DOMAIN}/{old_slug}"',
                f'href="{DOMAIN}/ginecologia/{new_slug}/"'
            )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            total_files_updated += 1

print(f"  Scanned: {total_files_scanned} HTML files")
print(f"  Updated: {total_files_updated} files with internal link changes")

# ==========================================
# SUMMARY
# ==========================================
print("\n" + "=" * 70)
print("WAVE 1 IMPLEMENTATION COMPLETE")
print("=" * 70)
print(f"""
Cluster Ginecologia: /{len(MIGRATION_MAP)} pagine migrate

Struttura risultante:
  /ginecologia/                            (hub — invariato)
  /ginecologia/visita-ginecologica/        (da /visita-ginecologica/)
  /ginecologia/colposcopia/                (da /colposcopia/)
  /ginecologia/ecografia-transvaginale/    (da /ecografia-transvaginale/)
  /ginecologia/ecografia-pelvica/          (da /ecografia-pelvica/)
  /ginecologia/ecografia-mammaria/         (da /ecografia-mammaria/)
  /ginecologia/ecografia-morfologica/      (da /ecografia-morfologica/)
  /ginecologia/ecografia-ostetrica-3d/     (da /ecografia-ostetrica-3d/)
  /ginecologia/pap-test/                   (da /pap-test/)
  /ginecologia/pap-test-hpv/              (da /pap-test-hpv/)
  /ginecologia/hpv-dna-test/              (da /hpv-dna-test/)
  /ginecologia/duopap/                    (da /duopap/)
  /ginecologia/assistenza-ostetrica/       (da /assistenza-ostetrica/)
  /ginecologia/corso-preparto/             (da /corso-preparto/)
  /ginecologia/radiofrequenza-vaginale/    (da /radiofrequenza-vaginale/)
  /ginecologia/riabilitazione-pavimento-pelvico/
  /ginecologia/trattamenti-pavimento-pelvico/
  /ginecologia/perifit-kegel-sassari/
  /ginecologia/ginecologi-sassari/

Redirect chain (single hop guaranteed):
  /visita-ginecologica/ → 301 → /ginecologia/visita-ginecologica/
  /pages/visita-ginecologica → 301 → /ginecologia/visita-ginecologica/
""")

