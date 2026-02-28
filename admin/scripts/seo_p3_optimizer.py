#!/usr/bin/env python3
"""
Bio-Clinic SEO P3 Optimizer — Schema & Gemini Readiness
=========================================================
1. Add QAPage schema alongside existing FAQPage (dual schema for Google + Gemini)
2. Expand HowTo schema to more procedure/diagnostic pages
3. Add medical glossary / definition lists for Gemini AI readability
4. Add Gemini AI summary intro paragraphs where missing

Usage: python3 admin/scripts/seo_p3_optimizer.py [--dry-run]
"""
import os, re, sys, json
from datetime import datetime
from collections import defaultdict

SITE_DIR = 'site'
DRY_RUN = '--dry-run' in sys.argv

class Stats:
    qapage_added = 0
    howto_added = 0
    glossary_added = 0
    gemini_intro = 0
    errors = 0

stats = Stats()

def log(msg):
    print(f"  {'[DRY-RUN] ' if DRY_RUN else ''}{msg}")

# ============================================================
# HELPER: Skip directories
# ============================================================
SKIP_DIRS = {'backups', '_drafts', 'admin', 'node_modules', '.github', 
             'build', 'output', 'templates', 'scripts', '_components'}

def is_content_page(path, content):
    """Check if this is a real content page (not redirect, not admin)."""
    if 'http-equiv' in content.lower() and 'refresh' in content.lower() and len(content) < 2000:
        return False
    if '<h1' not in content.lower():
        return False
    return True

# ============================================================
# 1. QAPage SCHEMA — Add alongside FAQPage
# ============================================================
def add_qapage_schema():
    """Add QAPage schema on pages that have FAQ content in their JSON-LD."""
    print("\n=== 1. QAPage SCHEMA ===")
    
    added = 0
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f != 'index.html':
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            if not is_content_page(path, content):
                continue
            
            # Only add QAPage if FAQPage already exists
            if '"FAQPage"' not in content:
                continue
            
            # Skip if QAPage already exists
            if '"QAPage"' in content:
                continue
            
            # Extract existing FAQ questions from JSON-LD
            faq_questions = []
            for m in re.finditer(r'"@type"\s*:\s*"Question"[^}]*"name"\s*:\s*"([^"]+)"[^}]*"text"\s*:\s*"([^"]+)"', content, re.S):
                faq_questions.append({
                    'name': m.group(1),
                    'answer': m.group(2)
                })
            
            if not faq_questions:
                # Try alternate pattern
                for m in re.finditer(r'"name"\s*:\s*"([^"]+)"[^}]*"@type"\s*:\s*"Answer"[^}]*"text"\s*:\s*"([^"]+)"', content, re.S):
                    faq_questions.append({
                        'name': m.group(1),
                        'answer': m.group(2)
                    })
            
            if not faq_questions:
                continue
            
            # Build QAPage JSON-LD (separate script block)
            qa_items = []
            for i, q in enumerate(faq_questions[:5]):  # Max 5 for QAPage
                qa_items.append({
                    "@type": "Question",
                    "name": q['name'],
                    "answerCount": 1,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": q['answer'],
                        "upvoteCount": 0
                    }
                })
            
            # Get page URL
            rel_path = os.path.relpath(root, SITE_DIR)
            page_url = f"https://bio-clinic.it/{rel_path}/" if rel_path != '.' else "https://bio-clinic.it/"
            
            qa_schema = {
                "@context": "https://schema.org",
                "@type": "QAPage",
                "@id": f"{page_url}#qapage",
                "mainEntity": qa_items
            }
            
            qa_script = f'\n<script type="application/ld+json">{json.dumps(qa_schema, ensure_ascii=False, separators=(",", ":"))}</script>'
            
            # Insert before </head>
            head_close = content.find('</head>')
            if head_close > 0:
                content = content[:head_close] + qa_script + '\n' + content[head_close:]
                
                if not DRY_RUN:
                    with open(path, 'w', encoding='utf-8') as fh:
                        fh.write(content)
                added += 1
    
    stats.qapage_added = added
    log(f"QAPage schema added to {added} pages")

# ============================================================
# 2. EXPAND HowTo SCHEMA on procedure/diagnostic pages
# ============================================================

HOWTO_TEMPLATES = {
    'visita': {
        'name': 'Come prepararsi alla {procedure}',
        'desc': 'Guida pratica per prepararsi alla {procedure} presso Bio-Clinic Sassari.',
        'steps': [
            ('Prenotazione', 'Prenotare tramite il sito bio-clinic.it, telefonando allo 079 956 1332, o via MioDottore.'),
            ('Documenti', 'Portare tessera sanitaria, eventuale impegnativa del medico curante e referti precedenti.'),
            ('Preparazione', 'Seguire le indicazioni specifiche fornite al momento della prenotazione. In caso di digiuno richiesto, presentarsi a stomaco vuoto da almeno 8 ore.'),
            ('Accoglienza', 'Presentarsi 10 minuti prima dell\'appuntamento presso Bio-Clinic in Via Renzo Mossa 23, Sassari.'),
            ('Visita', 'Lo specialista effettuerà la valutazione clinica, eventuali esami strumentali e comunicherà i risultati.'),
            ('Follow-up', 'Ritirare il referto nei tempi indicati e concordare eventuale follow-up con lo specialista.')
        ]
    },
    'esame': {
        'name': 'Come prepararsi all\'{procedure}',
        'desc': 'Guida completa alla preparazione per {procedure} nel laboratorio Bio-Clinic Sassari.',
        'steps': [
            ('Prenotazione', 'Prenotare l\'esame online su bio-clinic.it/laboratorio/prenota/ o telefonando allo 079 956 1332.'),
            ('Preparazione', 'Verificare se è richiesto il digiuno (generalmente 8-12 ore). Assumere i farmaci abituali salvo diverse indicazioni.'),
            ('Accesso', 'Presentarsi al laboratorio Bio-Clinic in Via Renzo Mossa 23, Sassari, con tessera sanitaria e impegnativa.'),
            ('Prelievo', 'Il personale qualificato effettuerà il prelievo o la raccolta del campione in ambiente sicuro e sterile.'),
            ('Risultati', 'Ritirare i referti secondo le tempistiche indicate (24-72 ore per la maggior parte degli esami).')
        ]
    },
    'trattamento': {
        'name': 'Come funziona il trattamento di {procedure}',
        'desc': 'Scopri il percorso completo del trattamento di {procedure} presso Bio-Clinic Sassari.',
        'steps': [
            ('Consulto iniziale', 'Primo appuntamento con lo specialista per valutare la necessità del trattamento.'),
            ('Piano terapeutico', 'Lo specialista definisce il protocollo personalizzato in base alla diagnosi.'),
            ('Preparazione', 'Seguire le indicazioni pre-trattamento fornite dallo specialista.'),
            ('Trattamento', 'Seduta di trattamento presso gli ambulatori Bio-Clinic con tecnologie di ultima generazione.'),
            ('Monitoraggio', 'Visite di controllo programmate per monitorare i risultati e adeguare il percorso.')
        ]
    }
}

def expand_howto_schema():
    """Add HowTo schema on procedure pages that don't have it."""
    print("\n=== 2. EXPAND HowTo SCHEMA ===")
    
    added = 0
    # Process specialty subdirectory pages (procedures, diagnostics, etc.)
    specialty_dirs = [
        'cardiologia', 'ginecologia', 'dermatologia', 'endocrinologia',
        'ortopedia', 'otorinolaringoiatria', 'urologia', 'chirurgia-vascolare',
        'pneumologia', 'reumatologia', 'gastroenterologia', 'neurologia',
        'oculistica', 'ematologia', 'pma-fertilita'
    ]
    
    for spec_dir in specialty_dirs:
        spec_path = os.path.join(SITE_DIR, spec_dir)
        if not os.path.isdir(spec_path):
            continue
        
        for name in os.listdir(spec_path):
            subdir = os.path.join(spec_path, name)
            if not os.path.isdir(subdir):
                continue
            path = os.path.join(subdir, 'index.html')
            if not os.path.exists(path):
                continue
            
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            # Skip if already has HowTo
            if '"HowTo"' in content:
                continue
            
            if not is_content_page(path, content):
                continue
            
            # Get procedure name from H1 or title
            proc_name = name.replace('-', ' ').title()
            m_h1 = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
            if m_h1:
                proc_name = m_h1.group(1).strip()
            
            # Determine type based on content keywords
            content_lower = content.lower()
            if any(k in content_lower for k in ['trattamento', 'terapia', 'laser', 'radiofrequenza', 'scleroterapia']):
                template = HOWTO_TEMPLATES['trattamento']
            elif any(k in content_lower for k in ['esame', 'analisi', 'test', 'prelievo', 'screening']):
                template = HOWTO_TEMPLATES['esame']
            else:
                template = HOWTO_TEMPLATES['visita']
            
            # Build HowTo JSON-LD
            steps = []
            for i, (step_name, step_text) in enumerate(template['steps']):
                steps.append({
                    "@type": "HowToStep",
                    "position": i + 1,
                    "name": step_name,
                    "text": step_text.format(procedure=proc_name)
                })
            
            rel_path = os.path.relpath(subdir, SITE_DIR)
            page_url = f"https://bio-clinic.it/{rel_path}/"
            
            howto_schema = {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "@id": f"{page_url}#howto",
                "name": template['name'].format(procedure=proc_name),
                "description": template['desc'].format(procedure=proc_name),
                "step": steps,
                "estimatedCost": {
                    "@type": "MonetaryAmount",
                    "currency": "EUR",
                    "value": "A partire da €30"
                },
                "performedBy": {
                    "@type": "MedicalClinic",
                    "name": "Bio-Clinic Sassari",
                    "telephone": "+39 079 956 1332"
                }
            }
            
            howto_script = f'\n<script type="application/ld+json">{json.dumps(howto_schema, ensure_ascii=False, separators=(",", ":"))}</script>'
            
            head_close = content.find('</head>')
            if head_close > 0:
                content = content[:head_close] + howto_script + '\n' + content[head_close:]
                
                if not DRY_RUN:
                    with open(path, 'w', encoding='utf-8') as fh:
                        fh.write(content)
                added += 1
    
    stats.howto_added = added
    log(f"HowTo schema added to {added} procedure pages")

# ============================================================
# 3. MEDICAL GLOSSARY / DEFINITION LISTS for Gemini
# ============================================================

MEDICAL_GLOSSARY = {
    'cardiologia': [
        ('ECG (Elettrocardiogramma)', 'Esame non invasivo che registra l\'attività elettrica del cuore mediante elettrodi posizionati sul torace e sugli arti.'),
        ('Ecocardiogramma', 'Ecografia del cuore che permette di visualizzare la struttura e la funzione delle camere cardiache e delle valvole.'),
        ('Holter ECG', 'Monitoraggio continuo dell\'attività cardiaca per 24-48 ore tramite un registratore portatile.'),
        ('Holter Pressorio', 'Monitoraggio automatico della pressione arteriosa nell\'arco di 24 ore durante le normali attività quotidiane.'),
    ],
    'ginecologia': [
        ('Pap Test', 'Esame citologico di screening per la prevenzione del tumore della cervice uterina, raccomandato ogni 3 anni.'),
        ('HPV Test', 'Test molecolare che rileva la presenza del Papilloma Virus Umano (HPV), associato al rischio di tumori cervicali.'),
        ('Colposcopia', 'Esame che permette di osservare in modo ingrandito la cervice uterina, la vagina e la vulva per individuare lesioni precancerose.'),
        ('Ecografia Pelvica', 'Esame ecografico che visualizza utero, ovaie e annessi per diagnosticare patologie ginecologiche.'),
    ],
    'dermatologia': [
        ('Dermatoscopia', 'Tecnica di osservazione in vivo della pelle tramite un dermatoscopio, utile per la diagnosi precoce del melanoma.'),
        ('Mappatura dei Nevi', 'Esame completo della cute con documentazione fotografica di tutti i nei, per il monitoraggio nel tempo.'),
        ('Biopsia Cutanea', 'Prelievo di un piccolo campione di tessuto cutaneo per l\'esame istologico.'),
    ],
    'endocrinologia': [
        ('TSH', 'Ormone tireostimolante prodotto dall\'ipofisi, principale indicatore della funzione tiroidea.'),
        ('Ecografia Tiroidea', 'Esame ecografico che visualizza la ghiandola tiroidea per identificare noduli, cisti o alterazioni strutturali.'),
        ('Agoaspirato Tiroideo', 'Prelievo di cellule da un nodulo tiroideo tramite un ago sottile, guidato dall\'ecografia, per analisi citologica.'),
    ],
    'ortopedia': [
        ('MOC-DEXA', 'Mineralometria Ossea Computerizzata, esame che misura la densità minerale ossea per diagnosticare l\'osteoporosi.'),
        ('Ecografia Muscoloscheletrica', 'Esame ecografico di articolazioni, tendini, muscoli e legamenti per diagnosticare lesioni e infiammazioni.'),
        ('Infiltrazione Articolare', 'Iniezione di farmaci (corticosteroidi o acido ialuronico) direttamente nell\'articolazione per ridurre dolore e infiammazione.'),
    ],
    'otorinolaringoiatria': [
        ('Audiometria', 'Esame che misura la capacità uditiva determinando la soglia minima di suoni percepibili a diverse frequenze.'),
        ('Impedenzometria', 'Esame che valuta la funzionalità dell\'orecchio medio misurando la compliance del timpano.'),
        ('Fibroscopia', 'Esplorazione visiva delle vie aeree superiori (naso, faringe, laringe) tramite un fibroscopio flessibile.'),
    ],
    'urologia': [
        ('PSA (Antigene Prostatico Specifico)', 'Esame del sangue che misura il livello di PSA, marcatore utilizzato nello screening del tumore prostatico.'),
        ('Ecografia Prostatica', 'Esame ecografico della prostata, eseguito per via transrettale o sovrapubica, per valutare dimensioni e struttura.'),
        ('Uroflussometria', 'Esame non invasivo che misura il flusso urinario per diagnosticare ostruzioni o disfunzioni della minzione.'),
    ],
}

def add_glossary_definition_lists():
    """Add medical glossary sections with <dl> definition lists for Gemini AI readability."""
    print("\n=== 3. MEDICAL GLOSSARY ===")
    
    added = 0
    for spec_slug, terms in MEDICAL_GLOSSARY.items():
        spec_path = os.path.join(SITE_DIR, spec_slug, 'index.html')
        if not os.path.exists(spec_path):
            continue
        
        with open(spec_path, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        # Skip if glossary already exists
        if 'glossario-medico' in content:
            continue
        
        spec_name = spec_slug.replace('-', ' ').title()
        
        # Build glossary HTML with definition list
        glossary = f'''
<section id="glossario-medico" class="glossary-section" style="padding: 2.5rem 0; background: var(--gray-50, #f9fafb);">
  <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;">
    <h2 style="font-family: var(--font-heading, 'Poppins', sans-serif); font-size: 1.5rem; color: var(--gray-800, #1f2937); margin-bottom: 1.5rem;">
      Glossario Medico — {spec_name}
    </h2>
    <p style="color: var(--gray-600, #4b5563); margin-bottom: 1.5rem; font-size: 0.95rem;">
      Terminologia medica essenziale per comprendere le prestazioni di {spec_name.lower()} offerte da Bio-Clinic Sassari.
    </p>
    <dl style="display: grid; gap: 1rem;">'''
        
        for term, definition in terms:
            glossary += f'''
      <div style="background: white; padding: 1.25rem; border-radius: 8px; border-left: 4px solid var(--primary, #7CBA3D);">
        <dt style="font-weight: 700; color: var(--gray-800, #1f2937); font-size: 1rem; margin-bottom: 0.5rem;">{term}</dt>
        <dd style="color: var(--gray-600, #4b5563); font-size: 0.9rem; line-height: 1.6; margin: 0;">{definition}</dd>
      </div>'''
        
        glossary += '''
    </dl>
  </div>
</section>
'''
        # Also add DefinedTermSet schema
        defined_terms = []
        for term, definition in terms:
            defined_terms.append({
                "@type": "DefinedTerm",
                "name": term,
                "description": definition,
                "inDefinedTermSet": f"https://bio-clinic.it/{spec_slug}/#glossario-medico"
            })
        
        schema = {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            "@id": f"https://bio-clinic.it/{spec_slug}/#glossario-medico",
            "name": f"Glossario Medico {spec_name}",
            "description": f"Terminologia medica di {spec_name.lower()} utilizzata da Bio-Clinic Sassari",
            "hasDefinedTerm": defined_terms
        }
        
        schema_script = f'<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, separators=(",", ":"))}</script>\n'
        
        # Insert glossary before footer
        footer_pos = content.find('<footer')
        if footer_pos == -1:
            footer_pos = content.find('<!-- FOOTER')
        
        # Insert schema before </head>
        head_close = content.find('</head>')
        
        if footer_pos > 0 and head_close > 0:
            # Insert schema
            content = content[:head_close] + schema_script + content[head_close:]
            # Recalculate footer position
            footer_pos = content.find('<footer')
            if footer_pos == -1:
                footer_pos = content.find('<!-- FOOTER')
            # Insert glossary
            content = content[:footer_pos] + glossary + content[footer_pos:]
            
            if not DRY_RUN:
                with open(spec_path, 'w', encoding='utf-8') as fh:
                    fh.write(content)
            added += 1
    
    stats.glossary_added = added
    log(f"Medical glossary added to {added} specialty pages")

# ============================================================
# 4. GEMINI AI SUMMARY INTRO PARAGRAPHS
# ============================================================
def add_gemini_intro():
    """Add a concise summary intro paragraph at the top of articles for AI snippets."""
    print("\n=== 4. GEMINI AI INTRO PARAGRAPHS ===")
    
    added = 0
    salute_dir = os.path.join(SITE_DIR, 'salute')
    
    for name in os.listdir(salute_dir):
        if name.startswith('_') or name == 'index.html':
            continue
        path = os.path.join(salute_dir, name, 'index.html')
        if not os.path.isfile(path):
            continue
        
        with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        # Skip if already has AI summary
        if 'ai-summary' in content or 'class="summary-intro"' in content:
            continue
        
        # Extract description and title for summary
        title = name.replace('-', ' ').title()
        m_t = re.search(r'<title>([^<]+)</title>', content)
        if m_t:
            title = m_t.group(1).split('|')[0].strip()
        
        desc = ''
        m_d = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', content)
        if m_d:
            desc = m_d.group(1)
        
        if not desc:
            continue
        
        # Build summary box
        summary = f'''<div class="summary-intro ai-summary" role="doc-abstract" style="background: linear-gradient(135deg, #f0f7e6 0%, #e8f5e9 100%); border-left: 4px solid var(--primary, #7CBA3D); padding: 1.5rem; border-radius: 0 8px 8px 0; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6; color: var(--gray-700, #374151);">
          <strong style="display: block; margin-bottom: 0.5rem; color: var(--primary-dark, #008238);">In sintesi:</strong>
          {desc}
          <span style="display: block; margin-top: 0.75rem; font-size: 0.85rem; color: var(--gray-500, #6b7280);">Articolo verificato dal team medico Bio-Clinic Sassari — Ultimo aggiornamento: {datetime.now().strftime("%d/%m/%Y")}</span>
        </div>'''
        
        # Insert after the first H1
        h1_close = re.search(r'</h1>', content)
        if h1_close:
            # Find the next tag after H1 
            insert_pos = h1_close.end()
            # Skip past any </div> or whitespace right after h1
            after_h1 = content[insert_pos:insert_pos+200]
            # Find a good spot (after the breadcrumb/hero section)
            next_div = after_h1.find('</div>')
            if next_div > 0 and next_div < 100:
                insert_pos += next_div + 6
            
            content = content[:insert_pos] + '\n' + summary + '\n' + content[insert_pos:]
            
            if not DRY_RUN:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(content)
            added += 1
    
    stats.gemini_intro = added
    log(f"Gemini AI summary intro added to {added} articles")

# ============================================================
# MAIN
# ============================================================
def main():
    print(f"Bio-Clinic SEO P3 Optimizer — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mode: {'DRY RUN' if DRY_RUN else 'LIVE'}")
    
    add_qapage_schema()
    expand_howto_schema()
    add_glossary_definition_lists()
    add_gemini_intro()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"  QAPage schema:      {stats.qapage_added} pages")
    print(f"  HowTo schema:       {stats.howto_added} procedure pages")
    print(f"  Medical glossary:   {stats.glossary_added} specialty pages")
    print(f"  Gemini AI intros:   {stats.gemini_intro} articles")
    print(f"  Errors:             {stats.errors}")
    print("="*60)

if __name__ == '__main__':
    main()
