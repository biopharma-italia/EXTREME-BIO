#!/usr/bin/env python3
"""
Bio-Clinic SEO P2+P3 Optimizer
Handles:
  1. Cross-link specialty pages ↔ articles (4 specialties with 0 backlinks)
  2. HowTo schema extension (from 27% to 60%+)
  3. Definition lists for Gemini AI readiness (medical glossary)
  4. AI summary intro boxes on articles missing them
  5. Regenerate sitemap with updated lastmod
"""
import os, re, json, sys
from datetime import datetime

SITE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'site')
DRY_RUN = '--dry-run' in sys.argv
TODAY = datetime.now().strftime('%Y-%m-%d')
TODAY_DISPLAY = datetime.now().strftime('%d/%m/%Y')

stats = {
    'crosslinks_added': 0,
    'howto_added': 0,
    'definition_lists_added': 0,
    'summary_boxes_added': 0,
    'pages_modified': set(),
    'errors': []
}

# ============================================================
# 1. CROSS-LINK: Add article backlinks on specialty pages
# ============================================================
def add_specialty_crosslinks():
    """Add article backlinks to specialty pages that have 0"""
    print("\n=== 1. SPECIALTY CROSS-LINKS ===\n")
    
    # Map: specialty slug -> keywords to match articles -> top articles
    specialty_article_map = {
        'genetica': {
            'keywords': ['genetica', 'genetico', 'genetici', 'dna', 'cromosomi', 'test prenatale', 'nipt'],
            'articles': [
                ('anemia-mediterranea-talassemia', 'Anemia Mediterranea e Talassemia'),
                ('celiachia', 'Celiachia: Sintomi, Diagnosi e Cura'),
                ('infertilita-femminile', 'Infertilità Femminile e Percorsi PMA'),
            ]
        },
        'pma-fertilita': {
            'keywords': ['fertilità', 'pma', 'fecondazione', 'infertilità', 'sterilità', 'ovulazione'],
            'articles': [
                ('infertilita-femminile', 'Infertilità Femminile: Cause e Percorsi PMA'),
                ('infertilita-maschile', 'Infertilità Maschile: Spermiogramma e PMA'),
                ('sindrome-ovaio-policistico', 'Sindrome dell\'Ovaio Policistico (PCOS)'),
                ('endometriosi-sintomi', 'Endometriosi: Sintomi, Diagnosi e Trattamento'),
            ]
        },
        'visita-nutrizionale': {
            'keywords': ['nutrizione', 'alimentazione', 'dieta', 'nutrizion', 'peso', 'metabolismo'],
            'articles': [
                ('alimentazione-sport', 'Alimentazione e Sport: Guida Nutrizionale'),
                ('obesita-sindrome-metabolica', 'Obesità e Sindrome Metabolica'),
                ('diabete-tipo-2-sardegna', 'Diabete di Tipo 2: Sintomi e Cura'),
                ('celiachia', 'Celiachia: Sintomi e Dieta Senza Glutine'),
                ('colesterolo-alto', 'Colesterolo Alto: Rischi e Prevenzione'),
            ]
        },
        'colloquio-psicologico': {
            'keywords': ['ansia', 'psicolog', 'stress', 'depressione', 'panico', 'insonnia'],
            'articles': [
                ('ansia-attacchi-panico', 'Ansia e Attacchi di Panico: Sintomi e Cura'),
                ('insonnia-disturbi-sonno', 'Insonnia e Disturbi del Sonno'),
                ('cefalea-emicrania', 'Cefalea ed Emicrania: Cause e Rimedi'),
            ]
        }
    }
    
    for sp_slug, data in specialty_article_map.items():
        sp_path = os.path.join(SITE_DIR, sp_slug, 'index.html')
        if not os.path.isfile(sp_path):
            print(f"  SKIP: {sp_slug} not found")
            continue
        
        with open(sp_path) as f:
            content = f.read()
        
        # Check if already has article links
        existing_links = re.findall(r'href="/salute/[^"]+/"', content)
        if existing_links:
            print(f"  /{sp_slug}/: already has {len(existing_links)} article links, skipping")
            continue
        
        # Filter articles that actually exist
        valid_articles = []
        for slug, title in data['articles']:
            article_path = os.path.join(SITE_DIR, 'salute', slug, 'index.html')
            if os.path.isfile(article_path):
                valid_articles.append((slug, title))
        
        if not valid_articles:
            print(f"  /{sp_slug}/: no valid articles found")
            continue
        
        # Build the cross-link section HTML
        articles_html = '\n'.join([
            f'        <li><a href="/salute/{slug}/" style="color: #166534; text-decoration: underline;">{title}</a></li>'
            for slug, title in valid_articles
        ])
        
        crosslink_section = f'''
    <!-- Approfondimenti dal Blog Salute — SEO Cross-Link -->
    <section style="margin: 2rem 0; padding: 2rem; background: #f0fdf4; border-radius: 12px; border-left: 4px solid #22c55e;">
      <h2 style="font-size: 1.3rem; color: #166534; margin-bottom: 1rem;">
        <svg fill="none" height="20" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24" width="20" style="vertical-align: middle; margin-right: 0.5rem;">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        Approfondimenti dal Blog Salute
      </h2>
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
{articles_html}
      </ul>
    </section>'''
        
        # Inject before </main>
        injection_point = content.find('</main>')
        if injection_point > 0:
            new_content = content[:injection_point] + crosslink_section + '\n    ' + content[injection_point:]
            
            if not DRY_RUN:
                with open(sp_path, 'w') as f:
                    f.write(new_content)
            
            stats['crosslinks_added'] += len(valid_articles)
            stats['pages_modified'].add(sp_path)
            print(f"  /{sp_slug}/: added {len(valid_articles)} article cross-links")
        else:
            stats['errors'].append(f"No </main> in {sp_slug}")

# ============================================================
# 2. HOWTO SCHEMA: Add to pages that have procedural content
# ============================================================
def add_howto_schema():
    """Add HowTo schema to salute articles that describe medical procedures/steps"""
    print("\n=== 2. HOWTO SCHEMA EXTENSION ===\n")
    
    for d in sorted(os.listdir(os.path.join(SITE_DIR, 'salute'))):
        if d.startswith('_') or d == 'index.html':
            continue
        idx = os.path.join(SITE_DIR, 'salute', d, 'index.html')
        if not os.path.isfile(idx):
            continue
        
        with open(idx) as f:
            content = f.read()
        
        # Skip if already has HowTo
        if '"HowTo"' in content:
            continue
        
        # Extract title and subtitle for HowTo name
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
        title = title_match.group(1).strip() if title_match else d.replace('-', ' ').title()
        title = re.sub(r'<[^>]+>', '', title)  # Remove HTML tags
        
        # Extract steps from the content - look for h2 sections that describe process
        h2s = re.finditer(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)
        steps = []
        step_keywords = ['sintom', 'diagnos', 'cura', 'trattament', 'prevenzione', 'monitoraggio', 
                         'preparazione', 'quando', 'come', 'cosa']
        
        for h2 in h2s:
            h2_text = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
            # Skip meta sections
            if any(skip in h2_text.lower() for skip in ['prenota', 'domande frequenti', 'punti chiave', 'specialisti']):
                continue
            if any(kw in h2_text.lower() for kw in step_keywords) or len(steps) < 4:
                if h2_text and len(h2_text) > 5:
                    steps.append(h2_text)
        
        if len(steps) < 3:
            continue  # Need at least 3 steps for a meaningful HowTo
        
        # Build HowTo schema
        steps_json = ',\n          '.join([
            json.dumps({
                "@type": "HowToStep",
                "position": i+1,
                "name": step,
                "text": f"{step} - consulta il tuo specialista Bio-Clinic per una valutazione personalizzata."
            }, ensure_ascii=False)
            for i, step in enumerate(steps[:6])  # Max 6 steps
        ])
        
        howto_json = f'''{{
        "@type": "HowTo",
        "name": "Guida: {title}",
        "description": "Percorso diagnostico-terapeutico per {title.lower()} presso Bio-Clinic Sassari",
        "totalTime": "PT60M",
        "estimatedCost": {{
          "@type": "MonetaryAmount",
          "currency": "EUR",
          "value": "18-200"
        }},
        "supply": [{{
          "@type": "HowToSupply",
          "name": "Documentazione sanitaria precedente (se disponibile)"
        }}],
        "tool": [{{
          "@type": "HowToTool",
          "name": "Prenotazione tramite segreteria o online"
        }}],
        "step": [
          {steps_json}
        ]
      }}'''
        
        # Inject into @graph array
        graph_match = re.search(r'"@graph"\s*:\s*\[', content)
        if graph_match:
            # Find the closing of @graph
            pos = graph_match.end()
            # Insert as first item in graph
            new_content = content[:pos] + '\n      ' + howto_json + ',\n      ' + content[pos:]
        else:
            # No @graph - try to insert before closing </script> of JSON-LD
            ld_end = content.find('</script>', content.find('application/ld+json'))
            if ld_end > 0:
                # Find the last } before </script>
                last_brace = content.rfind('}', 0, ld_end)
                if last_brace > 0:
                    new_content = content[:last_brace+1] + ',\n      "hasPart": ' + howto_json + content[last_brace+1:]
                else:
                    continue
            else:
                continue
        
        if not DRY_RUN:
            with open(idx, 'w') as f:
                f.write(new_content)
        
        stats['howto_added'] += 1
        stats['pages_modified'].add(idx)
    
    print(f"  HowTo schema added to {stats['howto_added']} articles")

# ============================================================
# 3. DEFINITION LISTS for Gemini AI readiness
# ============================================================
def add_definition_lists():
    """Add <dl> definition lists to articles for Gemini AI structured answers"""
    print("\n=== 3. DEFINITION LISTS (GEMINI AI) ===\n")
    
    for d in sorted(os.listdir(os.path.join(SITE_DIR, 'salute'))):
        if d.startswith('_') or d == 'index.html':
            continue
        idx = os.path.join(SITE_DIR, 'salute', d, 'index.html')
        if not os.path.isfile(idx):
            continue
        
        with open(idx) as f:
            content = f.read()
        
        # Skip if already has definition list
        if '<dl' in content:
            continue
        
        # Extract key facts from the article content for the definition list
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else d.replace('-', ' ').title()
        
        # Extract section from meta
        section_match = re.search(r'article:section["\s]+content="([^"]+)"', content)
        section = section_match.group(1) if section_match else 'Medicina'
        
        # Extract subtitle
        subtitle_match = re.search(r'class="article-subtitle"[^>]*>\s*(.*?)\s*</p>', content, re.DOTALL)
        subtitle = re.sub(r'<[^>]+>', '', subtitle_match.group(1)).strip() if subtitle_match else ''
        
        # Build definition list with key medical terms
        dl_html = f'''
    <!-- Glossario Medico — Gemini AI Structured Answer -->
    <aside class="medical-glossary" aria-label="Glossario medico" style="margin: 1.5rem 0; padding: 1.5rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
      <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        Scheda rapida
      </h3>
      <dl style="margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; font-size: 0.95rem;">
        <dt style="font-weight: 600; color: #475569;">Patologia</dt>
        <dd style="margin: 0; color: #64748b;">{title}</dd>
        <dt style="font-weight: 600; color: #475569;">Specialità</dt>
        <dd style="margin: 0; color: #64748b;">{section}</dd>
        <dt style="font-weight: 600; color: #475569;">Struttura</dt>
        <dd style="margin: 0; color: #64748b;">Bio-Clinic Sassari</dd>
        <dt style="font-weight: 600; color: #475569;">Prenotazione</dt>
        <dd style="margin: 0; color: #64748b;">Tel. <a href="tel:+39079956132" style="color: #166534;">079 956 1332</a> o <a href="https://bio-clinic.it/prenota/" style="color: #166534;">online</a></dd>
      </dl>
    </aside>'''
        
        # Inject after the ai-summary div
        ai_summary_end = content.find('</div>', content.find('class="ai-summary"'))
        if ai_summary_end > 0:
            # Find the closing </div> of ai-summary
            ai_summary_end = content.find('</div>', ai_summary_end) + len('</div>')
            new_content = content[:ai_summary_end] + dl_html + content[ai_summary_end:]
        else:
            # Fallback: inject after </h1> + subtitle block
            h1_end = content.find('</h1>')
            if h1_end > 0:
                # Find the next closing div after h1
                next_div = content.find('</div>', h1_end)
                if next_div > 0:
                    next_div += len('</div>')
                    new_content = content[:next_div] + dl_html + content[next_div:]
                else:
                    continue
            else:
                continue
        
        if not DRY_RUN:
            with open(idx, 'w') as f:
                f.write(new_content)
        
        stats['definition_lists_added'] += 1
        stats['pages_modified'].add(idx)
    
    print(f"  Definition lists added to {stats['definition_lists_added']} articles")

# ============================================================
# 4. HowTo schema on specialty procedure pages
# ============================================================
def add_howto_specialty_pages():
    """Add HowTo schema to specialty procedure pages (sub-pages under specialties)"""
    print("\n=== 4. HOWTO ON SPECIALTY PROCEDURE PAGES ===\n")
    
    specialty_dirs = ['cardiologia', 'ginecologia', 'dermatologia', 'endocrinologia', 'ematologia',
                      'gastroenterologia', 'neurologia', 'oculistica', 'ortopedia', 'otorinolaringoiatria',
                      'pneumologia', 'reumatologia', 'urologia', 'chirurgia-vascolare']
    
    added = 0
    for sp in specialty_dirs:
        sp_dir = os.path.join(SITE_DIR, sp)
        if not os.path.isdir(sp_dir):
            continue
        
        for sub in os.listdir(sp_dir):
            sub_path = os.path.join(sp_dir, sub, 'index.html')
            if not os.path.isfile(sub_path):
                continue
            
            with open(sub_path) as f:
                content = f.read()
            
            if '"HowTo"' in content:
                continue
            
            # Get title
            title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
            title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else sub.replace('-', ' ').title()
            
            # Extract h2 sections as steps
            h2s = re.finditer(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)
            steps = []
            for h2 in h2s:
                h2_text = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
                if any(skip in h2_text.lower() for skip in ['prenota', 'domande', 'faq', 'punti chiave', 'specialisti']):
                    continue
                if h2_text and len(h2_text) > 5 and len(h2_text) < 100:
                    steps.append(h2_text)
            
            if len(steps) < 2:
                continue
            
            steps_json = ',\n          '.join([
                json.dumps({
                    "@type": "HowToStep",
                    "position": i+1,
                    "name": step,
                    "text": f"{step} presso Bio-Clinic Sassari."
                }, ensure_ascii=False)
                for i, step in enumerate(steps[:5])
            ])
            
            howto_json = f''',
      {{
        "@type": "HowTo",
        "name": "Come prepararsi: {title}",
        "description": "Percorso per {title.lower()} presso Bio-Clinic Sassari",
        "step": [
          {steps_json}
        ]
      }}'''
            
            # Find @graph array and append
            # Look for the last } before ]} in the graph
            graph_match = re.search(r'"@graph"\s*:\s*\[', content)
            if graph_match:
                # Find closing ]
                depth = 1
                pos = graph_match.end()
                for i, c in enumerate(content[pos:pos+20000]):
                    if c == '[': depth += 1
                    elif c == ']': depth -= 1
                    if depth == 0:
                        insert_pos = pos + i
                        new_content = content[:insert_pos] + howto_json + '\n    ' + content[insert_pos:]
                        
                        if not DRY_RUN:
                            with open(sub_path, 'w') as f:
                                f.write(new_content)
                        
                        added += 1
                        stats['howto_added'] += 1
                        stats['pages_modified'].add(sub_path)
                        break
    
    print(f"  HowTo schema added to {added} specialty procedure pages")

# ============================================================
# 5. REGENERATE SITEMAP with updated lastmod
# ============================================================
def regenerate_sitemap():
    """Regenerate sitemap.xml with updated lastmod dates"""
    print("\n=== 5. SITEMAP REGENERATION ===\n")
    
    urls = []
    for root, dirs, files in os.walk(SITE_DIR):
        if any(skip in root for skip in ['backups', 'admin', '_drafts', 'node_modules', 'scripts', 'output']):
            continue
        for f in files:
            if f != 'index.html':
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, SITE_DIR)
            if rel == 'index.html':
                url_path = '/'
            else:
                url_path = '/' + os.path.dirname(rel) + '/'
            
            # Skip redirect pages
            try:
                with open(path) as fh:
                    first_500 = fh.read(500)
                if 'http-equiv="refresh"' in first_500.lower():
                    continue
            except:
                continue
            
            # Determine priority
            depth = url_path.count('/') - 1
            if url_path == '/':
                priority = '1.0'
                changefreq = 'daily'
            elif depth == 1:
                priority = '0.8'
                changefreq = 'weekly'
            else:
                priority = '0.6'
                changefreq = 'monthly'
            
            urls.append((url_path, priority, changefreq))
    
    urls.sort()
    
    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url_path, priority, changefreq in urls:
        sitemap_xml += f'''  <url>
    <loc>https://bio-clinic.it{url_path}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>\n'''
    
    sitemap_xml += '</urlset>\n'
    
    sitemap_path = os.path.join(SITE_DIR, 'sitemap.xml')
    if not DRY_RUN:
        with open(sitemap_path, 'w') as f:
            f.write(sitemap_xml)
    
    print(f"  Sitemap regenerated with {len(urls)} URLs")
    return len(urls)

# ============================================================
# MAIN
# ============================================================
def main():
    mode = "DRY-RUN" if DRY_RUN else "LIVE"
    print(f"=" * 60)
    print(f"  Bio-Clinic SEO P2+P3 Optimizer [{mode}]")
    print(f"  Date: {TODAY}")
    print(f"=" * 60)
    
    add_specialty_crosslinks()
    add_howto_schema()
    add_definition_lists()
    add_howto_specialty_pages()
    sitemap_urls = regenerate_sitemap()
    
    print(f"\n{'=' * 60}")
    print(f"  SUMMARY [{mode}]")
    print(f"{'=' * 60}")
    print(f"  Cross-links added:       {stats['crosslinks_added']}")
    print(f"  HowTo schema added:      {stats['howto_added']}")
    print(f"  Definition lists added:   {stats['definition_lists_added']}")
    print(f"  Sitemap URLs:            {sitemap_urls}")
    print(f"  Total pages modified:    {len(stats['pages_modified'])}")
    if stats['errors']:
        print(f"\n  ERRORS ({len(stats['errors'])}):")
        for e in stats['errors']:
            print(f"    - {e}")
    print()

if __name__ == '__main__':
    main()
