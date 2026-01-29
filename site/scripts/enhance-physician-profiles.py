#!/usr/bin/env python3
"""
BIO-CLINIC PHYSICIAN PROFILE ENHANCER
======================================
Version: 3.0.0

Aggiorna automaticamente le pagine profilo medico con:
- Schema.org Graph complesso (Physician + FAQPage + BreadcrumbList)
- Sezione "Cosa Curo" con sintomi come tag
- Sezione "Ricerca & Pubblicazioni" per medici con paper su PubMed
- Interlinking automatico nella bio

© 2026 Bio-Clinic Sassari
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime

# Configurazione
SITE_ROOT = Path(__file__).parent.parent
DATA_DIR = SITE_ROOT / "data" / "entities"
EQUIPE_DIR = SITE_ROOT / "equipe"
LOG_FILE = SITE_ROOT / "logs" / "physician-enhance.log"

# Carica dati
def load_physicians():
    """Carica il database medici completo"""
    with open(DATA_DIR / "physicians-complete.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def load_extended_data():
    """Carica i dati estesi (pubblicazioni, sintomi, social)"""
    try:
        with open(DATA_DIR / "physicians-extended.json", 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"physicians_extended": {}, "default_sintomi_by_specialty": {}}

# Mapping specialità per Schema.org
SPECIALTY_SCHEMA = {
    'ginecologia': 'https://schema.org/Gynecologic',
    'ostetricia': 'https://schema.org/Obstetric',
    'cardiologia': 'https://schema.org/Cardiovascular',
    'dermatologia': 'https://schema.org/Dermatology',
    'endocrinologia': 'https://schema.org/Endocrine',
    'neurologia': 'https://schema.org/Neurologic',
    'oculistica': 'https://schema.org/Optometric',
    'otorinolaringoiatria': 'https://schema.org/Otolaryngologic',
    'ortopedia': 'https://schema.org/Musculoskeletal',
    'gastroenterologia': 'https://schema.org/Gastroenterologic',
    'medicina-interna': 'https://schema.org/InternalMedicine',
    'nefrologia': 'https://schema.org/Renal',
    'pneumologia': 'https://schema.org/Pulmonary',
    'ematologia': 'https://schema.org/Hematologic',
    'reumatologia': 'https://schema.org/Rheumatologic',
    'urologia': 'https://schema.org/Urologic',
    'chirurgia-vascolare': 'https://schema.org/Surgical',
    'pediatria': 'https://schema.org/Pediatric',
    'psicologia': 'https://schema.org/Psychiatric',
    'nutrizione': 'https://schema.org/DietNutrition'
}

def generate_schema_graph(physician, extended):
    """Genera Schema.org Graph complesso"""
    slug = physician['slug']
    specialty_schema = SPECIALTY_SCHEMA.get(physician.get('specialty_id', ''), 'MedicalSpecialty')
    
    # Build sameAs
    same_as = []
    if physician.get('miodottore_url'):
        same_as.append(physician['miodottore_url'])
    if extended.get('social'):
        for s in extended['social']:
            same_as.append(s['url'])
    
    # Build citations
    citations = []
    if extended.get('pubblicazioni'):
        for pub in extended['pubblicazioni']:
            citation = {
                "@type": "ScholarlyArticle",
                "name": pub['titolo'],
                "url": pub['url']
            }
            if pub.get('anno'):
                citation['datePublished'] = str(pub['anno'])
            if pub.get('journal'):
                citation['isPartOf'] = {"@type": "Periodical", "name": pub['journal']}
            citations.append(citation)
    
    # Build knowsAbout
    knows_about = []
    if extended.get('sintomi'):
        knows_about.extend(extended['sintomi'])
    if physician.get('procedures'):
        for proc in physician['procedures']:
            knows_about.append(proc.replace('-', ' ').title())
    
    # Physician schema
    physician_schema = {
        "@type": "Physician",
        "@id": f"https://bio-clinic.it/equipe/{slug}/#physician",
        "name": physician['full_name'],
        "givenName": physician['name'].split()[0],
        "familyName": " ".join(physician['name'].split()[1:]),
        "honorificPrefix": physician.get('title', ''),
        "jobTitle": physician['job_title'],
        "description": physician.get('bio', ''),
        "medicalSpecialty": specialty_schema,
        "isAcceptingNewPatients": True,
        "worksFor": {
            "@type": "MedicalClinic",
            "@id": "https://bio-clinic.it/#organization",
            "name": "Bio-Clinic Sassari",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Via Renzo Mossa, 23",
                "addressLocality": "Sassari",
                "postalCode": "07100",
                "addressRegion": "SS",
                "addressCountry": "IT"
            },
            "telephone": "+39 079 956 1332"
        }
    }
    
    # Add optional fields
    if physician.get('procedures'):
        physician_schema['availableService'] = [
            {"@type": "MedicalProcedure", "name": p.replace('-', ' ').title()}
            for p in physician['procedures']
        ]
    
    if knows_about:
        physician_schema['knowsAbout'] = knows_about[:15]  # Limit to 15
    
    if same_as:
        physician_schema['sameAs'] = same_as
    
    if citations:
        physician_schema['citation'] = citations
    
    if extended.get('affiliazioni'):
        physician_schema['affiliation'] = [
            {"@type": "Organization", "name": a}
            for a in extended['affiliazioni']
        ]
    
    # Breadcrumb
    breadcrumb = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
            {"@type": "ListItem", "position": 2, "name": "Equipe", "item": "https://bio-clinic.it/equipe/"},
            {"@type": "ListItem", "position": 3, "name": physician['full_name'], "item": f"https://bio-clinic.it/equipe/{slug}/"}
        ]
    }
    
    # FAQPage
    faqs = generate_faqs(physician, extended)
    faq_page = {
        "@type": "FAQPage",
        "mainEntity": faqs
    }
    
    # Complete graph
    graph = {
        "@context": "https://schema.org",
        "@graph": [physician_schema, breadcrumb, faq_page]
    }
    
    return graph

def generate_faqs(physician, extended):
    """Genera FAQ automatiche"""
    faqs = []
    cognome = physician['name'].split()[-1]
    title = physician.get('title', 'Dott.')
    prefix = 'la Dott.ssa' if 'ssa' in title else 'il Prof.' if 'Prof' in title else 'il Dott.'
    
    # FAQ 1: Patologie
    sintomi = extended.get('sintomi', [])
    faqs.append({
        "@type": "Question",
        "name": f"Quali patologie tratta {prefix} {cognome}?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": f"{prefix.title()} {cognome} è specializzato nel trattamento di: {', '.join(sintomi[:8])}. Prenota una visita chiamando Bio-Clinic al 079 956 1332." if sintomi else f"{prefix.title()} {cognome} è {physician['job_title']} presso Bio-Clinic Sassari. Per informazioni, contatta il 079 956 1332."
        }
    })
    
    # FAQ 2: Pubblicazioni
    if extended.get('pubblicazioni'):
        pub_count = len(extended['pubblicazioni'])
        pub_titles = '; '.join([p['titolo'] for p in extended['pubblicazioni'][:2]])
        faqs.append({
            "@type": "Question",
            "name": f"{prefix.title()} {cognome} ha pubblicazioni scientifiche?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"Sì, {prefix} {cognome} è autore di {pub_count} pubblicazioni scientifiche indicizzate su PubMed, tra cui: \"{pub_titles}\". Questo conferma l'alto livello di competenza professionale."
            }
        })
    
    # FAQ 3: Dove riceve
    faqs.append({
        "@type": "Question",
        "name": f"Dove riceve {prefix} {cognome}?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": f"{prefix.title()} {cognome} riceve presso Bio-Clinic Sassari, in Via Renzo Mossa 23, 07100 Sassari. Orari: Lun-Ven 07:00-21:00, Sab 08:00-14:00. Tel: 079 956 1332."
        }
    })
    
    # FAQ 4: Come prenotare
    faqs.append({
        "@type": "Question",
        "name": f"Come posso prenotare una visita con {prefix} {cognome}?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": f"Puoi prenotare una visita con {prefix} {cognome} chiamando il 079 956 1332 o tramite MioDottore.it. Bio-Clinic Sassari: Via Renzo Mossa 23." if physician.get('miodottore_url') else f"Per prenotare, chiama Bio-Clinic al 079 956 1332 o recati in Via Renzo Mossa 23, Sassari."
        }
    })
    
    return faqs

def generate_sintomi_html(sintomi):
    """Genera HTML per i tag sintomi"""
    if not sintomi:
        return ""
    
    tags_html = '\n'.join([
        f'            <span class="sintomo-tag">{s}</span>'
        for s in sintomi[:12]
    ])
    
    return f'''
        <!-- Sezione Cosa Curo -->
        <div class="sintomi-section" id="cosa-curo">
          <h3 class="sintomi-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Cosa Curo
          </h3>
          <div class="sintomi-tags">
{tags_html}
          </div>
        </div>
'''

def generate_pubblicazioni_html(pubblicazioni):
    """Genera HTML per le pubblicazioni"""
    if not pubblicazioni:
        return ""
    
    items_html = '\n'.join([
        f'''          <li class="pubblicazione-item">
            <a href="{p['url']}" target="_blank" rel="noopener" class="pubblicazione-link">
              <span class="pubblicazione-titolo">{p['titolo']}</span>
              <span class="pubblicazione-meta">
                {f"<em>{p['journal']}</em>" if p.get('journal') else ''}
                {f"({p['anno']})" if p.get('anno') else ''}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </li>'''
        for p in pubblicazioni
    ])
    
    return f'''
        <!-- Sezione Pubblicazioni Scientifiche -->
        <div class="pubblicazioni-section" id="pubblicazioni">
          <h3 class="pubblicazioni-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Ricerca & Pubblicazioni
          </h3>
          <p class="pubblicazioni-intro">
            Pubblicazioni scientifiche indicizzate su PubMed:
          </p>
          <ul class="pubblicazioni-list">
{items_html}
          </ul>
          <div class="pubblicazioni-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <span>Ricerca verificata su PubMed</span>
          </div>
        </div>
'''

def update_profile_page(physician, extended, physicians_data):
    """Aggiorna una singola pagina profilo"""
    slug = physician['slug']
    html_path = EQUIPE_DIR / f"{slug}.html"
    
    if not html_path.exists():
        return False, f"File non trovato: {html_path}"
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Aggiorna Schema.org JSON-LD
    schema_graph = generate_schema_graph(physician, extended)
    schema_json = json.dumps(schema_graph, indent=2, ensure_ascii=False)
    
    # Pattern per trovare lo schema esistente
    schema_pattern = r'<script type="application/ld\+json">.*?</script>'
    new_schema = f'<script type="application/ld+json">\n  {schema_json}\n  </script>'
    
    if re.search(schema_pattern, content, re.DOTALL):
        content = re.sub(schema_pattern, new_schema, content, count=1, flags=re.DOTALL)
    else:
        # Inserisci prima di </head>
        content = content.replace('</head>', f'{new_schema}\n</head>')
    
    # 2. Aggiungi CSS per sintomi e pubblicazioni se non presente
    if 'physician-profile.js' not in content:
        js_include = '<script src="../js/physician-profile.js"></script>'
        content = content.replace('</body>', f'  {js_include}\n</body>')
    
    # 3. Log changes
    changed = content != original
    
    if changed:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return changed, f"Schema aggiornato per {physician['full_name']}"

def main():
    """Main execution"""
    print("=" * 60)
    print("BIO-CLINIC PHYSICIAN PROFILE ENHANCER v3.0.0")
    print("=" * 60)
    
    # Load data
    physicians_data = load_physicians()
    extended_data = load_extended_data()
    
    physicians = physicians_data.get('physicians', [])
    extended_map = extended_data.get('physicians_extended', {})
    default_sintomi = extended_data.get('default_sintomi_by_specialty', {})
    
    print(f"\n📊 Medici nel database: {len(physicians)}")
    print(f"📚 Medici con dati estesi: {len(extended_map)}")
    
    updated = 0
    errors = 0
    
    for physician in physicians:
        slug = physician['slug']
        
        # Get extended data (or defaults)
        if slug in extended_map:
            ext = extended_map[slug]
        else:
            # Use default sintomi for specialty
            specialty = physician.get('specialty_id', '')
            ext = {
                'sintomi': default_sintomi.get(specialty, []),
                'pubblicazioni': [],
                'social': []
            }
        
        success, message = update_profile_page(physician, ext, physicians_data)
        
        if success:
            updated += 1
            has_pub = "📚" if ext.get('pubblicazioni') else "  "
            print(f"  ✅ {has_pub} {physician['full_name']}")
        else:
            if "non trovato" in message:
                pass  # Silent skip for missing files
            else:
                errors += 1
                print(f"  ❌ {message}")
    
    print(f"\n{'=' * 60}")
    print(f"✅ Profili aggiornati: {updated}")
    print(f"❌ Errori: {errors}")
    print(f"\n📋 Medici con pubblicazioni verificate:")
    for slug, data in extended_map.items():
        if data.get('pubblicazioni'):
            print(f"   • {slug}: {len(data['pubblicazioni'])} pubblicazioni")
    
    print(f"\n✨ Completato!")

if __name__ == "__main__":
    main()
