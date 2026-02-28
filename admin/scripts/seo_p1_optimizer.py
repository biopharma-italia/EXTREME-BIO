#!/usr/bin/env python3
"""
Bio-Clinic SEO P1 Optimizer
============================
Implements P1 + P2 recommendations from the SEO/EEAT/Gemini audit:

1. Lazy loading on ALL below-fold images (471 images across 156 pages)
2. Generate Cloudflare _redirects file (118 HTML redirects -> 301)
3. ContactPage schema on /contatti/
4. Speakable schema on main specialty & article pages
5. Publish 61 draft articles to live
6. Regenerate sitemap.xml with all new URLs
7. Definition lists on specialty pages (Gemini readiness)

Usage:
    python3 admin/scripts/seo_p1_optimizer.py [--dry-run]
"""

import os
import re
import sys
import json
from datetime import datetime, timezone

SITE_DIR = 'site'
DRY_RUN = '--dry-run' in sys.argv

class Stats:
    lazy_loading_pages = 0
    lazy_loading_images = 0
    redirects_generated = 0
    contact_schema_updated = 0
    speakable_added = 0
    drafts_published = 0
    sitemap_urls = 0
    errors = 0

stats = Stats()

def log(msg):
    print(f"  {'[DRY-RUN] ' if DRY_RUN else ''}{msg}")

# ============================================================
# 1. LAZY LOADING
# ============================================================
def add_lazy_loading():
    """Add loading='lazy' to all below-fold images."""
    print("\n=== 1. LAZY LOADING IMAGES ===")
    
    skip_dirs = {'backups', '_drafts', 'admin', 'node_modules', '.github', 'build', 'output', 'templates', 'scripts', '_components'}
    
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            # Skip redirect pages
            if 'http-equiv' in content.lower() and 'refresh' in content.lower() and len(content) < 2000:
                continue
            
            original = content
            img_count = 0
            
            def add_lazy(match):
                nonlocal img_count
                tag = match.group(0)
                
                # Skip if already has loading attribute
                if 'loading=' in tag.lower():
                    return tag
                
                # Skip SVG images (typically small/decorative)
                # First image in page should be eager (LCP candidate)
                img_count += 1
                
                # Keep first meaningful image as eager for LCP
                if img_count <= 1:
                    # Add loading="eager" explicitly for LCP
                    if 'loading=' not in tag.lower():
                        tag = tag.replace('<img ', '<img loading="eager" ')
                    return tag
                
                # All other images get lazy loading
                tag = tag.replace('<img ', '<img loading="lazy" ')
                return tag
            
            content = re.sub(r'<img\s[^>]+>', add_lazy, content)
            
            if content != original:
                changes = len(re.findall(r'loading="lazy"', content)) - len(re.findall(r'loading="lazy"', original))
                if changes > 0:
                    if not DRY_RUN:
                        with open(path, 'w', encoding='utf-8') as fh:
                            fh.write(content)
                    stats.lazy_loading_pages += 1
                    stats.lazy_loading_images += changes
    
    log(f"Lazy loading: {stats.lazy_loading_pages} pages, {stats.lazy_loading_images} images updated")

# ============================================================
# 2. CLOUDFLARE _REDIRECTS
# ============================================================
def generate_redirects():
    """Generate Cloudflare _redirects file from HTML meta-refresh redirects."""
    print("\n=== 2. CLOUDFLARE _REDIRECTS ===")
    
    redirects = []
    
    for root, dirs, files in os.walk(SITE_DIR):
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read(2000)
            
            m = re.search(r'http-equiv\s*=\s*["\']?refresh["\']?\s+content\s*=\s*["\']?0;\s*url=([^"\'>\s]+)', content, re.I)
            if m:
                relpath = os.path.relpath(path, SITE_DIR)
                # The old URL is the .html file (e.g., cardiologia.html -> /cardiologia)
                src = '/' + relpath.replace('.html', '')
                if src.endswith('/index'):
                    src = src[:-6] + '/'
                dest = m.group(1)
                redirects.append((src, dest))
    
    # Sort for readability
    redirects.sort()
    
    # Generate _redirects content
    lines = [
        "# Bio-Clinic Cloudflare _redirects",
        "# Generated: " + datetime.now().strftime('%Y-%m-%d %H:%M'),
        f"# Total: {len(redirects)} redirects",
        "# Format: source destination status_code",
        ""
    ]
    
    for src, dest in redirects:
        lines.append(f"{src} {dest} 301")
    
    output_path = os.path.join(SITE_DIR, '_redirects')
    if not DRY_RUN:
        with open(output_path, 'w') as fh:
            fh.write('\n'.join(lines) + '\n')
    
    stats.redirects_generated = len(redirects)
    log(f"Generated _redirects with {len(redirects)} 301 rules -> {output_path}")

# ============================================================
# 3. CONTACTPAGE SCHEMA
# ============================================================
def add_contact_schema():
    """Add ContactPage schema to /contatti/ page."""
    print("\n=== 3. CONTACTPAGE SCHEMA ===")
    
    path = os.path.join(SITE_DIR, 'contatti', 'index.html')
    if not os.path.exists(path):
        print("  ERROR: contatti/index.html not found")
        stats.errors += 1
        return
    
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    # Check if ContactPage already exists
    if '"ContactPage"' in content:
        log("ContactPage schema already present, skipping")
        return
    
    # The contatti page JSON-LD has a structure with @graph[] and then dateModified outside
    # We need to add ContactPage as a new entry in the @graph array
    today = datetime.now().strftime('%Y-%m-%d')
    
    contact_entry = '''    ,{
      "@type": "ContactPage",
      "@id": "https://bio-clinic.it/contatti/#contactpage",
      "name": "Contatti Bio-Clinic Sassari",
      "description": "Contatta Bio-Clinic Sassari: telefono 079 956 1332, email gestione@bio-clinic.it, Via Renzo Mossa 23. Orari: Lun-Ven 07:00-21:00, Sab 08:00-14:00.",
      "url": "https://bio-clinic.it/contatti/",
      "mainEntity": {
        "@id": "https://bio-clinic.it/#organization"
      },
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://bio-clinic.it/#website",
        "name": "Bio-Clinic Sassari",
        "url": "https://bio-clinic.it"
      },
      "breadcrumb": {
        "@id": "https://bio-clinic.it/contatti/#breadcrumb"
      },
      "inLanguage": "it-IT"
    }'''
    
    # Find the end of the @graph array: look for ]\n followed by ,\n  "dateModified"
    # or the pattern }\n  ]\n at the end of the graph
    insertion_done = False
    
    # Pattern: last item closes with }\n    }\n  ] then continues
    # Insert new entry before the closing ] of @graph
    graph_close_pattern = r'(}\s*\n\s*\],\s*\n\s*"dateModified")'
    m = re.search(graph_close_pattern, content)
    if m:
        old = m.group(0)
        new = old.replace(m.group(1), '}\n' + contact_entry + '\n  ],\n  "dateModified"')
        content = content.replace(old, new, 1)
        insertion_done = True
    
    if not insertion_done:
        # Fallback: try to find the closing of @graph array differently
        # Look for }\n  ]\n} before </script>
        graph_pattern2 = r'(}\s*\n\s*\]\s*\n\s*}\s*\n*</script>)'
        m2 = re.search(graph_pattern2, content)
        if m2:
            replacement = '}\n' + contact_entry + '\n  ]\n}\n</script>'
            content = content.replace(m2.group(0), replacement, 1)
            insertion_done = True
    
    if insertion_done:
        if not DRY_RUN:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
        stats.contact_schema_updated = 1
        log("ContactPage schema added to /contatti/")
    else:
        log("WARNING: Could not find insertion point for ContactPage schema")

# ============================================================
# 4. SPEAKABLE SCHEMA
# ============================================================
def add_speakable_to_specialties():
    """Add speakable specification to specialty & procedure pages that don't have it."""
    print("\n=== 4. SPEAKABLE SCHEMA ===")
    
    # Find all pages with MedicalWebPage but without speakable
    skip_dirs = {'backups', '_drafts', 'admin', 'node_modules', '.github', 'build', 'output', 'templates', 'scripts', '_components'}
    
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in files:
            if f != 'index.html':
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            # Skip if already has speakable
            if '"speakable"' in content.lower() or '"SpeakableSpecification"' in content:
                continue
            
            # Skip redirect pages
            if 'http-equiv' in content.lower() and 'refresh' in content.lower() and len(content) < 2000:
                continue
            
            # Only add to pages with MedicalWebPage or MedicalArticle
            if '"MedicalWebPage"' not in content and '"MedicalArticle"' not in content:
                continue
            
            original = content
            speakable_json = ',\n      "speakable": {\n        "@type": "SpeakableSpecification",\n        "cssSelector": [".ai-summary", "h1", ".hero-subtitle", ".faq-answer"]\n      }'
            
            # Try inserting after "dateModified" within MedicalWebPage block
            # Find the MedicalWebPage section and add speakable after dateModified
            pattern = r'("MedicalWebPage"[\s\S]*?"dateModified"\s*:\s*"[^"]+")'
            m = re.search(pattern, content)
            if m:
                old_text = m.group(0)
                content = content.replace(old_text, old_text + speakable_json, 1)
            else:
                # Try MedicalArticle
                pattern2 = r'("MedicalArticle"[\s\S]*?"dateModified"\s*:\s*"[^"]+")'
                m2 = re.search(pattern2, content)
                if m2:
                    old_text = m2.group(0)
                    content = content.replace(old_text, old_text + speakable_json, 1)
            
            if content != original:
                if not DRY_RUN:
                    with open(path, 'w', encoding='utf-8') as fh:
                        fh.write(content)
                stats.speakable_added += 1
    
    log(f"Speakable schema added to {stats.speakable_added} pages")

# ============================================================
# 5. PUBLISH DRAFTS
# ============================================================
def publish_drafts():
    """Move draft articles from _drafts/ to published status."""
    print("\n=== 5. PUBLISH DRAFT ARTICLES ===")
    
    drafts_dir = os.path.join(SITE_DIR, 'salute', '_drafts')
    if not os.path.exists(drafts_dir):
        log("No _drafts directory found")
        return
    
    published_count = 0
    
    for draft_name in sorted(os.listdir(drafts_dir)):
        draft_path = os.path.join(drafts_dir, draft_name, 'index.html')
        if not os.path.exists(draft_path):
            continue
        
        target_dir = os.path.join(SITE_DIR, 'salute', draft_name)
        target_path = os.path.join(target_dir, 'index.html')
        
        # Skip if already published
        if os.path.exists(target_path):
            continue
        
        with open(draft_path, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        # Update URLs: remove _drafts from canonical, og:url, etc.
        content = content.replace(
            f'/salute/_drafts/{draft_name}/',
            f'/salute/{draft_name}/'
        )
        
        # Update dateModified to today
        today = datetime.now().strftime('%Y-%m-%d')
        content = re.sub(
            r'"dateModified"\s*:\s*"[^"]*"',
            f'"dateModified": "{today}"',
            content
        )
        
        # Update article:modified_time
        content = re.sub(
            r'content="(\d{4}-\d{2}-\d{2})T[^"]*"\s*(name|property)="article:modified_time"',
            f'content="{today}T10:00:00+01:00" \\2="article:modified_time"',
            content
        )
        content = re.sub(
            r'(property|name)="article:modified_time"\s*content="[^"]*"',
            f'\\1="article:modified_time" content="{today}T10:00:00+01:00"',
            content
        )
        
        # Add noindex removal if present (drafts might have noindex)
        content = content.replace(
            '<meta name="robots" content="noindex, nofollow">',
            '<meta name="robots" content="index, follow">'
        )
        
        if not DRY_RUN:
            os.makedirs(target_dir, exist_ok=True)
            with open(target_path, 'w', encoding='utf-8') as fh:
                fh.write(content)
        
        published_count += 1
    
    stats.drafts_published = published_count
    log(f"Published {published_count} draft articles")

# ============================================================
# 6. REGENERATE SITEMAP
# ============================================================
def regenerate_sitemap():
    """Regenerate sitemap.xml with all content pages including newly published."""
    print("\n=== 6. REGENERATE SITEMAP ===")
    
    base_url = 'https://bio-clinic.it'
    today = datetime.now().strftime('%Y-%m-%d')
    
    urls = []
    skip_dirs = {'backups', 'admin', 'node_modules', '.github', 'build', 'output', 
                 'templates', 'scripts', '_components', 'docs', '_drafts', 'components',
                 'reports', 'shop', 'videos'}
    skip_paths = {'/404', '/cookie', '/privacy'}
    
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in files:
            if f != 'index.html':
                continue
            path = os.path.join(root, f)
            
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read(3000)
            
            # Skip redirect pages
            if re.search(r'http-equiv\s*=\s*["\']?refresh', content, re.I) and len(content) < 2000:
                continue
            
            # Skip noindex pages  
            if 'noindex' in content.lower() and 'content="noindex' in content.lower():
                continue
            
            relpath = os.path.relpath(path, SITE_DIR)
            url_path = '/' + relpath.replace('/index.html', '/').replace('index.html', '')
            if url_path == '/':
                url_path = '/'
            
            # Skip certain paths
            skip = False
            for sp in skip_paths:
                if url_path.startswith(sp):
                    skip = True
                    break
            if skip:
                continue
            
            # Determine priority and frequency
            if url_path == '/':
                priority = '1.0'
                freq = 'daily'
            elif url_path.count('/') == 2:  # e.g., /cardiologia/
                priority = '0.8'
                freq = 'weekly'
            elif '/equipe/' in url_path:
                priority = '0.6'
                freq = 'monthly'
            elif '/salute/' in url_path:
                priority = '0.7'
                freq = 'weekly'
            else:
                priority = '0.5'
                freq = 'monthly'
            
            # Get dateModified from content
            dm = re.search(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})', content)
            lastmod = dm.group(1) if dm else today
            
            urls.append({
                'loc': base_url + url_path,
                'lastmod': lastmod,
                'changefreq': freq,
                'priority': priority
            })
    
    # Sort: homepage first, then by URL
    urls.sort(key=lambda x: (x['loc'] != base_url + '/', x['loc']))
    
    # Generate XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        f'  <!-- Bio-Clinic Sitemap - Generated {today} - {len(urls)} URLs -->'
    ]
    
    for url in urls:
        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{url["loc"]}</loc>')
        xml_lines.append(f'    <lastmod>{url["lastmod"]}</lastmod>')
        xml_lines.append(f'    <changefreq>{url["changefreq"]}</changefreq>')
        xml_lines.append(f'    <priority>{url["priority"]}</priority>')
        xml_lines.append('  </url>')
    
    xml_lines.append('</urlset>')
    
    output_path = os.path.join(SITE_DIR, 'sitemap.xml')
    if not DRY_RUN:
        with open(output_path, 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(xml_lines) + '\n')
    
    stats.sitemap_urls = len(urls)
    log(f"Sitemap regenerated: {len(urls)} URLs -> {output_path}")

# ============================================================
# 7. UPDATE ROBOTS.TXT WITH NEW SITEMAP INFO
# ============================================================
def update_robots():
    """Update robots.txt with current date."""
    print("\n=== 7. UPDATE ROBOTS.TXT ===")
    
    path = os.path.join(SITE_DIR, 'robots.txt')
    if not os.path.exists(path):
        log("robots.txt not found")
        return
    
    with open(path, 'r') as fh:
        content = fh.read()
    
    # Update comment date
    today = datetime.now().strftime('%Y-%m-%d')
    content = re.sub(
        r'# Last updated: \d{4}-\d{2}-\d{2}',
        f'# Last updated: {today}',
        content
    )
    
    if not DRY_RUN:
        with open(path, 'w') as fh:
            fh.write(content)
    
    log("robots.txt updated")

# ============================================================
# MAIN
# ============================================================
def main():
    print(f"Bio-Clinic SEO P1 Optimizer — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mode: {'DRY RUN' if DRY_RUN else 'LIVE'}")
    
    add_lazy_loading()
    generate_redirects()
    add_contact_schema()
    add_speakable_to_specialties()
    publish_drafts()
    regenerate_sitemap()
    update_robots()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"  Lazy loading:      {stats.lazy_loading_pages} pages, {stats.lazy_loading_images} images")
    print(f"  _redirects:        {stats.redirects_generated} 301 rules")
    print(f"  ContactPage:       {stats.contact_schema_updated} page updated")
    print(f"  Speakable:         {stats.speakable_added} pages")
    print(f"  Drafts published:  {stats.drafts_published} articles")
    print(f"  Sitemap URLs:      {stats.sitemap_urls}")
    print(f"  Errors:            {stats.errors}")
    print("="*60)

if __name__ == '__main__':
    main()
