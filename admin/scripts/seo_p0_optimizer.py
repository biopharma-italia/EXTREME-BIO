#!/usr/bin/env python3
"""
Bio-Clinic SEO P0 Optimizer
============================
Applies all P0 recommendations from the SEO/EEAT/Gemini audit:

1. Medical disclaimer on all /salute/ YMYL articles (published + drafts)
2. Upgrade MedicalWebPage → MedicalArticle in JSON-LD
3. Related articles section with cross-links
4. Cross-link specialty pages ↔ articles

Usage: python3 seo_p0_optimizer.py [--dry-run]
"""

import os
import re
import json
import sys
from datetime import datetime

SITE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'site')
DRY_RUN = '--dry-run' in sys.argv

# ============================================================================
# ARTICLE METADATA
# ============================================================================

ARTICLE_META = {
    'anemia-mediterranea-talassemia': {
        'title': 'Anemia Mediterranea (Talassemia)',
        'specialty': 'ematologia',
        'specialty_label': 'Ematologia',
        'icon': 'tint',
        'short_desc': 'Guida completa su talassemia in Sardegna: portatori sani, sintomi e prevenzione.',
    },
    'cervicalgia-dolore-collo': {
        'title': 'Cervicalgia e Dolore al Collo',
        'specialty': 'ortopedia',
        'specialty_label': 'Ortopedia',
        'icon': 'bone',
        'short_desc': 'Cause, sintomi e rimedi per il dolore cervicale con fisioterapia e trattamento.',
    },
    'diabete-tipo-2-sardegna': {
        'title': 'Diabete di Tipo 2 in Sardegna',
        'specialty': 'endocrinologia',
        'specialty_label': 'Endocrinologia',
        'icon': 'stethoscope',
        'short_desc': 'Sintomi, rischi e cura del diabete tipo 2 con endocrinologi specialisti.',
    },
    'endometriosi-sintomi': {
        'title': 'Endometriosi: Sintomi e Diagnosi',
        'specialty': 'ginecologia',
        'specialty_label': 'Ginecologia',
        'icon': 'venus',
        'short_desc': 'Diagnosi e trattamento dell\'endometriosi con ecografia 3D/4D e PMA.',
    },
    'ipertensione-arteriosa': {
        'title': 'Ipertensione Arteriosa',
        'specialty': 'cardiologia',
        'specialty_label': 'Cardiologia',
        'icon': 'heartbeat',
        'short_desc': 'Cause, sintomi e terapia per l\'ipertensione con Holter e ECG.',
    },
    'ipotiroidismo': {
        'title': 'Ipotiroidismo: Sintomi e Cura',
        'specialty': 'endocrinologia',
        'specialty_label': 'Endocrinologia',
        'icon': 'stethoscope',
        'short_desc': 'Diagnosi e trattamento dell\'ipotiroidismo con esami tiroidei.',
    },
    'noduli-tiroidei': {
        'title': 'Noduli Tiroidei',
        'specialty': 'endocrinologia',
        'specialty_label': 'Endocrinologia',
        'icon': 'stethoscope',
        'short_desc': 'Quando preoccuparsi per i noduli tiroidei: ecografia e agoaspirato.',
    },
    'reflusso-gastroesofageo': {
        'title': 'Reflusso Gastroesofageo',
        'specialty': 'gastroenterologia',
        'specialty_label': 'Gastroenterologia',
        'icon': 'medkit',
        'short_desc': 'Sintomi, cause e cura del reflusso con gastroscopia diagnostica.',
    },
}

# Specialty → URL mapping
SPECIALTY_URLS = {
    'cardiologia': '/cardiologia/',
    'ginecologia': '/ginecologia/',
    'endocrinologia': '/endocrinologia/',
    'ortopedia': '/ortopedia/',
    'ematologia': '/ematologia/',
    'gastroenterologia': '/gastroenterologia/',
    'dermatologia': '/dermatologia/',
    'neurologia': '/neurologia/',
    'urologia': '/urologia/',
    'oculistica': '/oculistica/',
    'pneumologia': '/pneumologia/',
    'reumatologia': '/reumatologia/',
    'otorinolaringoiatria': '/otorinolaringoiatria/',
    'chirurgia-vascolare': '/chirurgia-vascolare/',
}

# ============================================================================
# 1. DISCLAIMER MEDICO
# ============================================================================

DISCLAIMER_HTML = """
    <!-- Medical Disclaimer — EEAT/YMYL Compliance -->
    <div class="medical-disclaimer" role="complementary" aria-label="Disclaimer medico" style="margin: 2rem 0; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; font-size: 0.9rem; line-height: 1.6; color: #78350f;">
      <p style="margin: 0; font-weight: 600;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -3px; margin-right: 6px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        Disclaimer Medico
      </p>
      <p style="margin: 0.5rem 0 0 0;">Le informazioni contenute in questa pagina hanno <strong>esclusiva finalit&agrave; informativa e divulgativa</strong>. Non costituiscono e non devono essere interpretate come consulenza medica, diagnosi o prescrizione di trattamento. <strong>Consulta sempre il tuo medico curante</strong> o uno specialista prima di intraprendere qualsiasi percorso diagnostico o terapeutico. Bio-Clinic declina ogni responsabilit&agrave; per l'uso improprio delle informazioni qui riportate.</p>
    </div>
"""

def inject_disclaimer(content, filepath):
    """Inject medical disclaimer before </article> if not already present."""
    if 'medical-disclaimer' in content or 'Disclaimer Medico' in content:
        return content, False
    
    # Insert before </article>
    pattern = r'(  </article>)'
    if re.search(pattern, content):
        content = re.sub(pattern, DISCLAIMER_HTML + r'\1', content, count=1)
        return content, True
    
    # Fallback: insert before closing </main> 
    pattern = r'(    </main>)'
    if re.search(pattern, content):
        content = re.sub(pattern, DISCLAIMER_HTML + r'\1', content, count=1)
        return content, True
    
    return content, False

# ============================================================================
# 2. UPGRADE MedicalWebPage → MedicalArticle
# ============================================================================

def upgrade_schema_to_medical_article(content, filepath):
    """Add MedicalArticle alongside MedicalWebPage in JSON-LD."""
    # Check if MedicalArticle already exists
    if '"MedicalArticle"' in content:
        return content, False
    
    # Replace "MedicalWebPage" with ["MedicalWebPage", "MedicalArticle"]
    if '"@type": "MedicalWebPage"' in content:
        content = content.replace(
            '"@type": "MedicalWebPage"',
            '"@type": ["MedicalWebPage", "MedicalArticle"]'
        )
        return content, True
    
    return content, False

# ============================================================================
# 3. RELATED ARTICLES SECTION
# ============================================================================

def build_related_articles_html(current_slug):
    """Generate related articles section for a given article slug."""
    current_meta = ARTICLE_META.get(current_slug)
    if not current_meta:
        return ''
    
    current_specialty = current_meta['specialty']
    
    # Collect related: same specialty first, then others
    related = []
    for slug, meta in ARTICLE_META.items():
        if slug == current_slug:
            continue
        priority = 0 if meta['specialty'] == current_specialty else 1
        related.append((priority, slug, meta))
    
    # Sort: same specialty first, then alphabetically
    related.sort(key=lambda x: (x[0], x[2]['title']))
    
    # Take top 4
    related = related[:4]
    
    if not related:
        return ''
    
    cards = ''
    for _, slug, meta in related:
        spec_url = SPECIALTY_URLS.get(meta['specialty'], '')
        cards += f"""
        <a href="/salute/{slug}/" class="related-article-card" style="display: block; padding: 1rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; text-decoration: none; color: inherit; transition: all 0.2s;">
          <span style="display: inline-block; padding: 2px 8px; background: #f0fdf4; color: #166534; font-size: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; font-weight: 600;">{meta['specialty_label']}</span>
          <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; color: #1a1a2e;">{meta['title']}</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280; line-height: 1.4;">{meta['short_desc']}</p>
        </a>"""

    specialty_link = ''
    if current_specialty in SPECIALTY_URLS:
        spec_label = current_meta['specialty_label']
        spec_url = SPECIALTY_URLS[current_specialty]
        specialty_link = f"""
      <div style="text-align: center; margin-top: 1rem;">
        <a href="{spec_url}" style="color: #00704A; font-weight: 600; text-decoration: none; font-size: 0.9rem;">Scopri tutti i servizi di {spec_label} &rarr;</a>
      </div>"""

    return f"""
    <!-- Related Articles — Internal Linking + EEAT -->
    <div class="related-articles" style="margin: 2rem 0; padding: 1.5rem; background: #f8fafc; border-radius: 12px;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.15rem; color: #1a1a2e;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00704A" stroke-width="2" style="vertical-align: -3px; margin-right: 6px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        Potrebbe interessarti anche
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">{cards}
      </div>{specialty_link}
    </div>
"""

def inject_related_articles(content, filepath, current_slug):
    """Inject related articles section before the disclaimer (or before </article>)."""
    if 'related-articles' in content or 'Potrebbe interessarti anche' in content:
        return content, False
    
    related_html = build_related_articles_html(current_slug)
    if not related_html:
        return content, False
    
    # Insert before the disclaimer if it exists, otherwise before </article>
    if 'medical-disclaimer' in content:
        content = content.replace('    <!-- Medical Disclaimer', related_html + '    <!-- Medical Disclaimer')
        return content, True
    
    pattern = r'(  </article>)'
    if re.search(pattern, content):
        content = re.sub(pattern, related_html + r'\1', content, count=1)
        return content, True
    
    return content, False

# ============================================================================
# 4. CROSS-LINK SPECIALTY → ARTICLES (inject links into specialty pages)
# ============================================================================

def build_specialty_articles_section(specialty_slug):
    """Build an articles section for a specialty page."""
    articles_for_spec = []
    for slug, meta in ARTICLE_META.items():
        if meta['specialty'] == specialty_slug:
            articles_for_spec.append((slug, meta))
    
    if not articles_for_spec:
        return ''
    
    cards = ''
    for slug, meta in articles_for_spec:
        cards += f"""
          <a href="/salute/{slug}/" class="guide-card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: white; border-radius: 10px; border: 1px solid #e5e7eb; text-decoration: none; color: inherit; transition: box-shadow 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="flex-shrink: 0; width: 42px; height: 42px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00704A" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div>
              <div style="font-weight: 600; color: #1a1a2e; font-size: 0.95rem; margin-bottom: 2px;">{meta['title']}</div>
              <div style="font-size: 0.85rem; color: #6b7280; line-height: 1.3;">{meta['short_desc']}</div>
            </div>
          </a>"""

    return f"""
    <!-- Guida alla Salute — Cross-link SEO -->
    <section class="salute-crosslinks" style="padding: 2.5rem 0; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);">
      <div class="container">
        <h2 style="text-align: center; margin-bottom: 0.5rem; color: #1a1a2e; font-size: 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00704A" stroke-width="2" style="vertical-align: -5px; margin-right: 8px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          Guide alla Salute
        </h2>
        <p style="text-align: center; color: #6b7280; margin-bottom: 1.5rem; font-size: 0.95rem;">Approfondimenti medici a cura dei nostri specialisti</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; max-width: 800px; margin: 0 auto;">{cards}
        </div>
        <div style="text-align: center; margin-top: 1.25rem;">
          <a href="/salute/" style="color: #00704A; font-weight: 600; text-decoration: none; font-size: 0.9rem;">Vedi tutte le guide alla salute &rarr;</a>
        </div>
      </div>
    </section>
"""

def inject_specialty_crosslinks(content, filepath, specialty_slug):
    """Inject article cross-links into specialty pages before the CTA section."""
    if 'salute-crosslinks' in content or 'Guide alla Salute' in content:
        return content, False
    
    section_html = build_specialty_articles_section(specialty_slug)
    if not section_html:
        return content, False
    
    # Insert before the final CTA section or before footer
    # Try before class="cta" section
    m = re.search(r'(<section[^>]*class="cta")', content)
    if m:
        content = content[:m.start()] + section_html + content[m.start():]
        return content, True
    
    # Fallback: before footer
    m = re.search(r'(\{?<footer)', content)
    if m:
        content = content[:m.start()] + section_html + content[m.start():]
        return content, True
    
    return content, False

# ============================================================================
# MAIN
# ============================================================================

def main():
    today = datetime.now().strftime('%Y-%m-%d')
    
    stats = {
        'disclaimer_injected': 0,
        'schema_upgraded': 0,
        'related_injected': 0,
        'crosslinks_injected': 0,
        'drafts_disclaimer': 0,
        'errors': 0,
    }
    
    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Bio-Clinic SEO P0 Optimizer")
    print(f"Date: {today}")
    print("=" * 60)
    
    # ------------------------------------------------------------------
    # PROCESS PUBLISHED ARTICLES (/salute/*)
    # ------------------------------------------------------------------
    print("\n--- Published Articles ---")
    salute_dir = os.path.join(SITE_DIR, 'salute')
    
    for slug in sorted(ARTICLE_META.keys()):
        idx = os.path.join(salute_dir, slug, 'index.html')
        if not os.path.isfile(idx):
            print(f"  SKIP (not found): {slug}")
            continue
        
        content = open(idx, 'r', encoding='utf-8', errors='ignore').read()
        original = content
        changes = []
        
        # 1. Disclaimer
        content, changed = inject_disclaimer(content, idx)
        if changed:
            changes.append('disclaimer')
            stats['disclaimer_injected'] += 1
        
        # 2. MedicalArticle schema upgrade
        content, changed = upgrade_schema_to_medical_article(content, idx)
        if changed:
            changes.append('MedicalArticle')
            stats['schema_upgraded'] += 1
        
        # 3. Related articles
        content, changed = inject_related_articles(content, idx, slug)
        if changed:
            changes.append('related')
            stats['related_injected'] += 1
        
        if changes and not DRY_RUN:
            open(idx, 'w', encoding='utf-8').write(content)
        
        status = f"  {'[DRY]' if DRY_RUN else 'OK'} {slug}: {', '.join(changes) if changes else 'no changes'}"
        print(status)
    
    # ------------------------------------------------------------------
    # PROCESS DRAFT ARTICLES (/salute/_drafts/*)
    # ------------------------------------------------------------------
    print("\n--- Draft Articles ---")
    drafts_dir = os.path.join(salute_dir, '_drafts')
    if os.path.isdir(drafts_dir):
        for d in sorted(os.listdir(drafts_dir)):
            idx = os.path.join(drafts_dir, d, 'index.html')
            if not os.path.isfile(idx):
                continue
            
            content = open(idx, 'r', encoding='utf-8', errors='ignore').read()
            
            # Only disclaimer + schema upgrade for drafts
            changes = []
            
            content, changed = inject_disclaimer(content, idx)
            if changed:
                changes.append('disclaimer')
                stats['drafts_disclaimer'] += 1
            
            content, changed = upgrade_schema_to_medical_article(content, idx)
            if changed:
                changes.append('MedicalArticle')
            
            if changes and not DRY_RUN:
                open(idx, 'w', encoding='utf-8').write(content)
            
            if changes:
                print(f"  {'[DRY]' if DRY_RUN else 'OK'} _drafts/{d}: {', '.join(changes)}")
    
    # ------------------------------------------------------------------
    # PROCESS SPECIALTY PAGES (cross-links to articles)
    # ------------------------------------------------------------------
    print("\n--- Specialty Cross-Links ---")
    specialties_with_articles = set(meta['specialty'] for meta in ARTICLE_META.values())
    
    for spec_slug in sorted(specialties_with_articles):
        spec_url = SPECIALTY_URLS.get(spec_slug, '')
        if not spec_url:
            continue
        
        # Find the specialty index page
        spec_path = os.path.join(SITE_DIR, spec_slug.lstrip('/'), 'index.html')
        if not os.path.isfile(spec_path):
            print(f"  SKIP (not found): {spec_slug}/index.html")
            continue
        
        content = open(spec_path, 'r', encoding='utf-8', errors='ignore').read()
        content, changed = inject_specialty_crosslinks(content, spec_path, spec_slug)
        
        if changed:
            stats['crosslinks_injected'] += 1
            if not DRY_RUN:
                open(spec_path, 'w', encoding='utf-8').write(content)
        
        print(f"  {'[DRY]' if DRY_RUN else 'OK'} {spec_slug}: {'injected' if changed else 'no change'}")
    
    # ------------------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Disclaimers injected (published): {stats['disclaimer_injected']}")
    print(f"  Disclaimers injected (drafts):    {stats['drafts_disclaimer']}")
    print(f"  Schema upgraded to MedicalArticle:{stats['schema_upgraded']}")
    print(f"  Related articles injected:        {stats['related_injected']}")
    print(f"  Specialty cross-links injected:   {stats['crosslinks_injected']}")
    print(f"  Errors:                           {stats['errors']}")
    print("=" * 60)

if __name__ == '__main__':
    main()
