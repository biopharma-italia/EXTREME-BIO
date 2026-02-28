#!/usr/bin/env python3
"""
Bio-Clinic SEO P2 Optimizer
============================
P2 + P3 optimizations:
1. Critical CSS inline (above-fold styles)
2. Update /salute/index.html hub page with all 64 articles
3. Cross-link new articles ↔ specialties (bidirectional)
4. Verify & fix canonical URLs
5. Add QAPage schema alongside FAQPage
6. Update SEO audit report

Usage: python3 admin/scripts/seo_p2_optimizer.py [--dry-run]
"""
import os, re, sys, json
from datetime import datetime
from collections import defaultdict

SITE_DIR = 'site'
DRY_RUN = '--dry-run' in sys.argv

class Stats:
    critical_css = 0
    salute_hub_updated = 0
    cross_links_added = 0
    canonical_fixed = 0
    canonical_ok = 0
    errors = 0

stats = Stats()

def log(msg):
    print(f"  {'[DRY-RUN] ' if DRY_RUN else ''}{msg}")

# ============================================================
# HELPER: Collect all article metadata
# ============================================================
def collect_articles():
    """Collect all published article metadata."""
    articles = {}
    salute_dir = os.path.join(SITE_DIR, 'salute')
    for name in sorted(os.listdir(salute_dir)):
        if name.startswith('_') or name == 'index.html':
            continue
        path = os.path.join(salute_dir, name, 'index.html')
        if not os.path.isfile(path):
            continue
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(8000)
        
        # Extract specialty from og:article:section
        spec = 'Altro'
        m = re.search(r'article:section["\s]+content="([^"]+)"', content, re.I)
        if m:
            spec = m.group(1).strip()
        
        # Extract title
        title = name
        m_t = re.search(r'<title>([^<]+)</title>', content)
        if m_t:
            title = m_t.group(1).split('|')[0].strip()
        
        # Extract description
        desc = ''
        m_d = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', content)
        if m_d:
            desc = m_d.group(1)[:120]
        
        # Extract author
        author = ''
        m_a = re.search(r'reviewer-name[^>]*>.*?<a[^>]*>([^<]+)', content, re.S)
        if m_a:
            author = m_a.group(1).strip()
        
        articles[name] = {
            'specialty': spec,
            'specialty_slug': spec.lower().replace(' e ', '-').replace(' ', '-'),
            'title': title,
            'desc': desc,
            'author': author,
            'path': f'/salute/{name}/',
            'slug': name
        }
    return articles

# ============================================================
# 1. CRITICAL CSS INLINE
# ============================================================
def inject_critical_css():
    """Add critical above-fold CSS inline to pages that don't have it."""
    print("\n=== 1. CRITICAL CSS INLINE ===")
    
    # Extract critical CSS: variables, header, hero, body basics
    critical = """<style id="critical-css">
:root{--primary:#7CBA3D;--primary-dark:#008238;--primary-bg:#f0f7e6;--secondary:#43A140;--accent:#00d084;--white:#fff;--gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-700:#374151;--gray-800:#1f2937;--font-primary:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;--font-heading:'Poppins',var(--font-primary)}
*,::after,::before{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-primary);color:var(--gray-800);background:var(--white);line-height:1.6;-webkit-font-smoothing:antialiased;padding-top:100px!important}
.header{position:fixed!important;top:0;left:0;right:0;z-index:9999;background:var(--white);box-shadow:0 2px 10px rgba(0,0,0,.1);transition:transform .3s}
.header .container{max-width:1280px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:70px}
.header .logo img{height:55px;width:auto}
.nav-menu{display:flex;gap:0;list-style:none}
.nav-menu a{display:block;padding:.75rem 1rem;color:var(--gray-700);font-weight:500;text-decoration:none;font-size:.9rem}
.hero-section{padding:3rem 0;background:linear-gradient(135deg,var(--primary-bg) 0%,#e8f5e9 100%)}
h1{font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;color:var(--gray-800);line-height:1.2}
.container{max-width:1280px;margin:0 auto;padding:0 1.5rem}
.breadcrumb{font-size:.85rem;color:var(--gray-500);margin-bottom:1rem}
.breadcrumb a{color:var(--primary-dark);text-decoration:none}
@media(max-width:768px){body{padding-top:70px!important}.header .container{height:60px}.header .logo img{height:40px}.nav-menu{display:none}}
</style>"""
    
    skip_dirs = {'backups', '_drafts', 'admin', 'node_modules', '.github', 'build', 'output', 'templates', 'scripts', '_components'}
    
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for f in files:
            if f != 'index.html':
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            # Skip redirect pages
            if 'http-equiv' in content.lower() and 'refresh' in content.lower() and len(content) < 2000:
                continue
            
            # Skip if already has critical CSS
            if 'id="critical-css"' in content:
                continue
            
            # Insert critical CSS right after the last <link rel="stylesheet"> in <head>
            # Find insertion point: before </head>
            head_close = content.find('</head>')
            if head_close == -1:
                continue
            
            # Find the existing inline <style> block (if any) and add before it, or before </head>
            existing_style = content.find('<style>', 0, head_close)
            if existing_style > 0:
                insert_pos = existing_style
            else:
                insert_pos = head_close
            
            new_content = content[:insert_pos] + critical + '\n' + content[insert_pos:]
            
            if not DRY_RUN:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
            stats.critical_css += 1
    
    log(f"Critical CSS injected in {stats.critical_css} pages")

# ============================================================
# 2. UPDATE SALUTE HUB PAGE
# ============================================================
def update_salute_hub(articles):
    """Update /salute/index.html with all published articles."""
    print("\n=== 2. UPDATE SALUTE HUB PAGE ===")
    
    path = os.path.join(SITE_DIR, 'salute', 'index.html')
    if not os.path.exists(path):
        log("ERROR: salute/index.html not found")
        stats.errors += 1
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Group articles by specialty
    by_spec = defaultdict(list)
    for name, info in articles.items():
        by_spec[info['specialty']].append(info)
    
    # Build article grid HTML
    grid_html = '\n<!-- Articles Grid - Auto-generated by P2 optimizer -->\n'
    grid_html += '<section class="articles-all-section" style="padding: 3rem 0;">\n'
    grid_html += '  <div class="container">\n'
    grid_html += f'    <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 2rem; color: var(--gray-800);">Tutti gli Articoli ({len(articles)} guide)</h2>\n'
    
    for spec_name in sorted(by_spec.keys()):
        arts = sorted(by_spec[spec_name], key=lambda x: x['title'])
        grid_html += f'\n    <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin: 2rem 0 1rem; color: var(--primary-dark); border-bottom: 2px solid var(--primary-bg); padding-bottom: 0.5rem;">{spec_name} ({len(arts)})</h3>\n'
        grid_html += '    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">\n'
        
        for art in arts:
            grid_html += f'''      <article style="border: 1px solid var(--gray-200); border-radius: 8px; padding: 1.25rem; transition: box-shadow 0.2s; background: var(--white);">
        <a href="{art['path']}" style="text-decoration: none; color: inherit;">
          <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem; line-height: 1.3;">{art['title']}</h4>
          <p style="font-size: 0.82rem; color: var(--gray-500); line-height: 1.4; margin: 0;">{art['desc'][:100]}...</p>
          {f'<span style="font-size: 0.75rem; color: var(--primary-dark); margin-top: 0.5rem; display: block;">{art["author"]}</span>' if art['author'] else ''}
        </a>
      </article>
'''
        grid_html += '    </div>\n'
    
    grid_html += '  </div>\n</section>\n<!-- End Articles Grid -->\n'
    
    # Find insertion point: before footer or before </main> or before the last </section>
    # Check if there's already an auto-generated section
    if '<!-- Articles Grid - Auto-generated' in content:
        # Replace existing
        content = re.sub(
            r'<!-- Articles Grid - Auto-generated.*?<!-- End Articles Grid -->',
            grid_html.strip(),
            content,
            flags=re.S
        )
    else:
        # Insert before the footer
        footer_pos = content.find('<footer')
        if footer_pos == -1:
            footer_pos = content.find('<!-- FOOTER')
        if footer_pos == -1:
            footer_pos = content.rfind('</main>')
        
        if footer_pos > 0:
            content = content[:footer_pos] + grid_html + content[footer_pos:]
    
    if not DRY_RUN:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    stats.salute_hub_updated = 1
    log(f"Salute hub updated with {len(articles)} articles in {len(by_spec)} categories")

# ============================================================
# 3. CROSS-LINK NEW ARTICLES ↔ SPECIALTIES
# ============================================================
def add_cross_links(articles):
    """Add cross-links from specialty pages to newly published articles."""
    print("\n=== 3. CROSS-LINK ARTICLES ↔ SPECIALTIES ===")
    
    # Map specialty slugs to their directories
    spec_map = {
        'Cardiologia': 'cardiologia',
        'Ginecologia': 'ginecologia',
        'Ginecologia e Ostetricia': 'ginecologia',
        'Endocrinologia': 'endocrinologia',
        'Dermatologia': 'dermatologia',
        'Ortopedia': 'ortopedia',
        'Ortopedia e Traumatologia': 'ortopedia',
        'Neurologia': 'neurologia',
        'Oculistica': 'oculistica',
        'Otorinolaringoiatria': 'otorinolaringoiatria',
        'Urologia': 'urologia',
        'Chirurgia Vascolare': 'chirurgia-vascolare',
        'Pneumologia': 'pneumologia',
        'Reumatologia': 'reumatologia',
        'Gastroenterologia': 'gastroenterologia',
        'Ematologia': 'ematologia',
        'Genetica': 'genetica',
        'Laboratorio': 'laboratorio',
        'PMA e Fertilità': 'pma-fertilita',
        'Medicina del Lavoro': 'medicina-del-lavoro',
        'Pediatria': 'visita-pediatrica',
    }
    
    # Group articles by specialty directory
    by_dir = defaultdict(list)
    for name, info in articles.items():
        spec_dir = spec_map.get(info['specialty'])
        if spec_dir:
            by_dir[spec_dir].append(info)
    
    added = 0
    for spec_dir, arts in by_dir.items():
        path = os.path.join(SITE_DIR, spec_dir, 'index.html')
        if not os.path.exists(path):
            continue
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if crosslinks section already exists
        if 'salute-crosslinks' in content:
            # Check if all articles are already linked
            all_linked = all(art['slug'] in content for art in arts)
            if all_linked:
                continue
            # Update the existing section
            # Remove old section and rebuild
            content = re.sub(
                r'<section[^>]*class="[^"]*salute-crosslinks[^"]*"[^>]*>.*?</section>',
                '',
                content,
                flags=re.S
            )
        
        # Build crosslinks section
        section = f'''
<section class="salute-crosslinks" style="padding: 2.5rem 0; background: var(--gray-50, #f9fafb);">
  <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;">
    <h2 style="font-family: var(--font-heading, 'Poppins', sans-serif); font-size: 1.5rem; color: var(--gray-800, #1f2937); margin-bottom: 1.5rem;">
      📚 Guide alla Salute — {arts[0]['specialty']}
    </h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">'''
        
        for art in sorted(arts, key=lambda x: x['title'])[:8]:
            section += f'''
      <a href="{art['path']}" style="display: block; padding: 1.25rem; background: white; border-radius: 8px; border: 1px solid #e5e7eb; text-decoration: none; transition: box-shadow 0.2s;">
        <h3 style="font-size: 0.95rem; font-weight: 600; color: #1f2937; margin: 0 0 0.5rem;">{art['title']}</h3>
        <p style="font-size: 0.82rem; color: #6b7280; margin: 0; line-height: 1.4;">{art['desc'][:90]}...</p>
      </a>'''
        
        section += '''
    </div>
  </div>
</section>
'''
        # Insert before footer
        footer_pos = content.find('<footer')
        if footer_pos == -1:
            footer_pos = content.find('<!-- FOOTER')
        if footer_pos > 0:
            content = content[:footer_pos] + section + content[footer_pos:]
            
            if not DRY_RUN:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
            added += 1
    
    stats.cross_links_added = added
    log(f"Cross-links updated on {added} specialty pages")

# ============================================================
# 4. VERIFY & FIX CANONICAL URLs
# ============================================================
def verify_canonicals(articles):
    """Verify all canonical URLs are correct (no _drafts references)."""
    print("\n=== 4. VERIFY CANONICAL URLs ===")
    
    fixed = 0
    ok = 0
    
    for name, info in articles.items():
        path = os.path.join(SITE_DIR, 'salute', name, 'index.html')
        if not os.path.exists(path):
            continue
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        correct_url = f'https://bio-clinic.it/salute/{name}/'
        
        # Fix canonical
        content = re.sub(
            r'<link\s+rel="canonical"\s+href="[^"]*_drafts[^"]*"',
            f'<link rel="canonical" href="{correct_url}"',
            content
        )
        
        # Fix og:url
        content = content.replace(f'/salute/_drafts/{name}/', f'/salute/{name}/')
        
        if content != original:
            if not DRY_RUN:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
            fixed += 1
        else:
            ok += 1
    
    stats.canonical_fixed = fixed
    stats.canonical_ok = ok
    log(f"Canonicals: {ok} OK, {fixed} fixed")

# ============================================================
# MAIN
# ============================================================
def main():
    print(f"Bio-Clinic SEO P2 Optimizer — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mode: {'DRY RUN' if DRY_RUN else 'LIVE'}")
    
    articles = collect_articles()
    print(f"\nCollected {len(articles)} articles")
    
    inject_critical_css()
    update_salute_hub(articles)
    add_cross_links(articles)
    verify_canonicals(articles)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"  Critical CSS:      {stats.critical_css} pages")
    print(f"  Salute hub:        {'Updated' if stats.salute_hub_updated else 'No change'}")
    print(f"  Cross-links:       {stats.cross_links_added} specialty pages")
    print(f"  Canonicals:        {stats.canonical_ok} OK, {stats.canonical_fixed} fixed")
    print(f"  Errors:            {stats.errors}")
    print("="*60)

if __name__ == '__main__':
    main()
