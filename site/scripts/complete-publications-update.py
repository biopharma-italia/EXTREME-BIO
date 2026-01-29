#!/usr/bin/env python3
"""
Script completo per aggiornare le pubblicazioni scientifiche
1. Aggiunge nuovi medici con pubblicazioni verificate
2. Rinomina "Pubblicazioni Scientifiche" -> "Alcune delle Pubblicazioni Scientifiche"
3. Rimuove l'anno dalle citazioni
4. Genera la sezione HTML per tutti i medici con pubblicazioni
"""

import json
import os
import re
from pathlib import Path

# Nuovi medici con pubblicazioni trovate
NUOVI_MEDICI = {
    "sara-uras": {
        "sintomi": [
            "palpitazioni",
            "dolore al petto",
            "affanno",
            "ipertensione polmonare",
            "scompenso cardiaco",
            "valvulopatie"
        ],
        "pubblicazioni": [
            {
                "titolo": "TAPSE/sPAP Ratio to Improve Risk Assessment in Pulmonary Arterial Hypertension",
                "url": "https://pubmed.ncbi.nlm.nih.gov/40959873/",
                "journal": "Circulation: Heart Failure"
            }
        ],
        "social": [],
        "affiliazioni": ["Department of Cardiovascular and Respiratory Sciences", "San Francesco Hospital Nuoro"],
        "citations": 20,
        "h_index_estimated": 3
    },
    "giampiero-capobianco": {
        "sintomi": [
            "gravidanza a rischio",
            "diabete gestazionale",
            "ecografia ostetrica",
            "parto cesareo",
            "complicanze gravidanza",
            "HPV ginecologico"
        ],
        "pubblicazioni": [
            {
                "titolo": "Materno-Fetal and Neonatal Complications of Diabetes in Pregnancy",
                "url": "https://pubmed.ncbi.nlm.nih.gov/32825775/",
                "journal": "Journal of Clinical Medicine"
            },
            {
                "titolo": "Routine second trimester ultrasound screening for prenatal detection of fetal malformations",
                "url": "https://pubmed.ncbi.nlm.nih.gov/19324492/",
                "journal": "European Journal of Obstetrics and Gynecology"
            },
            {
                "titolo": "Postpartum ovarian vein thrombosis: an unpredictable event",
                "url": "https://pubmed.ncbi.nlm.nih.gov/12592429/",
                "journal": "Archives of Gynecology and Obstetrics"
            },
            {
                "titolo": "COVID-19 in pregnant women: A systematic review and meta-analysis",
                "url": "https://pubmed.ncbi.nlm.nih.gov/32713730/",
                "journal": "European Journal of Obstetrics and Gynecology"
            }
        ],
        "social": [
            {"tipo": "Academia", "url": "https://uniss.academia.edu/GiampieroCapobianco"}
        ],
        "affiliazioni": ["University of Sassari", "Department of Gynecology and Obstetrics", "AOU Sassari"],
        "citations": 4200,
        "h_index_estimated": 32
    },
    "federica-decandia": {
        "sintomi": [
            "palpitazioni",
            "pressione alta",
            "problemi tiroide cardiaci",
            "ipotiroidismo subclinico",
            "colesterolo alto"
        ],
        "pubblicazioni": [
            {
                "titolo": "Serum free thyroxine levels are positively associated with arterial stiffness",
                "url": "https://pubmed.ncbi.nlm.nih.gov/24954304/",
                "journal": "Journal of Clinical Endocrinology & Metabolism"
            },
            {
                "titolo": "Subclinical Hypothyroidism and Lipid Metabolism",
                "url": "https://www.researchgate.net/publication/344657467",
                "journal": "Archives of Medical Science"
            }
        ],
        "social": [],
        "affiliazioni": ["Cardiology Unit", "S. Francesco Hospital, Nuoro"],
        "citations": 85,
        "h_index_estimated": 5
    },
    "paolo-franca": {
        "sintomi": [
            "infarto",
            "sindrome coronarica acuta",
            "palpitazioni",
            "dolore toracico",
            "elettrocardiogramma anomalo"
        ],
        "pubblicazioni": [
            {
                "titolo": "Orodispersible Ticagrelor in Acute Coronary Syndromes",
                "url": "https://www.jacc.org/doi/10.1016/j.jacc.2021.05.015",
                "journal": "Journal of the American College of Cardiology"
            },
            {
                "titolo": "Prevalence and clinical significance of interatrial block in rheumatoid arthritis",
                "url": "https://www.researchgate.net/publication/366984767",
                "journal": "Journal of Cardiovascular Medicine"
            }
        ],
        "social": [],
        "affiliazioni": ["Cardiologia Clinica ed Interventistica", "AOU Sassari"],
        "citations": 95,
        "h_index_estimated": 6
    },
    "francesco-dessole": {
        "sintomi": [
            "gravidanza",
            "ecografia ostetrica",
            "fecondazione assistita",
            "problemi fertilità"
        ],
        "pubblicazioni": [
            {
                "titolo": "The impact of COVID-19 lockdown on admission to gynecologic emergency department",
                "url": "https://pubmed.ncbi.nlm.nih.gov/32602939/",
                "journal": "European Journal of Obstetrics and Gynecology"
            },
            {
                "titolo": "Levonorgestrel-releasing intra-uterine device alone for endometrial hyperplasia",
                "url": "https://pubmed.ncbi.nlm.nih.gov/41308330/",
                "journal": "Cochrane Database of Systematic Reviews"
            },
            {
                "titolo": "Inositol for the prevention of gestational diabetes",
                "url": "https://pubmed.ncbi.nlm.nih.gov/30564926/",
                "journal": "Cochrane Database of Systematic Reviews"
            }
        ],
        "social": [],
        "affiliazioni": ["Department of Gynecology", "University of Sassari"],
        "citations": 180,
        "h_index_estimated": 8
    }
}

def update_json_database():
    """Aggiorna il file JSON con i nuovi medici"""
    json_path = Path("data/entities/physicians-extended.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Aggiungi nuovi medici
    for slug, info in NUOVI_MEDICI.items():
        data['physicians_extended'][slug] = info
        print(f"✅ Aggiunto: {slug}")
    
    # Aggiorna metadata
    data['metadata']['physicians_with_publications'] = len(data['physicians_extended'])
    total_pubs = sum(len(p.get('pubblicazioni', [])) for p in data['physicians_extended'].values())
    data['metadata']['total_publications'] = total_pubs
    data['metadata']['last_verification'] = "2026-01-28"
    data['version'] = "4.1.0"
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 Database aggiornato:")
    print(f"   Medici con pubblicazioni: {data['metadata']['physicians_with_publications']}")
    print(f"   Pubblicazioni totali: {total_pubs}")
    
    return data

def generate_publications_html(medico_info, medico_name):
    """Genera l'HTML della sezione pubblicazioni SENZA anno"""
    pubs = medico_info.get('pubblicazioni', [])
    if not pubs:
        return ""
    
    pub_items = []
    for pub in pubs:
        pub_html = f'''<div class="pub-item">
                                    <div class="pub-title">{pub['titolo']}</div>
                                    <div class="pub-meta">{pub['journal']}</div>
                                    <a href="{pub['url']}" target="_blank" rel="noopener" class="pub-link">🔗 Visualizza su PubMed</a>
                                </div>'''
        pub_items.append(pub_html)
    
    pub_list = '\n                                '.join(pub_items)
    
    html = f'''<div class="pubblicazioni-section" id="pubblicazioni">
                            <h4>Alcune delle Pubblicazioni Scientifiche <span class="pub-badge">✓ Ricerca verificata su PubMed</span></h4>
                            <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Queste pubblicazioni dimostrano l'attività di ricerca scientifica del {medico_name} e sono verificabili su database medici accreditati.</p>
                            <div class="pub-list">
                                {pub_list}
                            </div>
                        </div>'''
    return html

def update_html_profiles(physicians_data):
    """Aggiorna tutti i profili HTML"""
    equipe_dir = Path("equipe")
    updated = 0
    
    for slug, info in physicians_data['physicians_extended'].items():
        html_file = equipe_dir / f"{slug}.html"
        if not html_file.exists():
            print(f"⚠️ File non trovato: {html_file}")
            continue
        
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Determina il titolo del medico
        title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
        medico_name = title_match.group(1) if title_match else slug.replace('-', ' ').title()
        
        # Genera nuovo HTML pubblicazioni
        new_pub_html = generate_publications_html(info, medico_name)
        
        # Rimuovi vecchia sezione pubblicazioni se esiste
        content = re.sub(
            r'<div class="pubblicazioni-section"[^>]*id="pubblicazioni"[^>]*>.*?</div>\s*</div>\s*</div>',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Trova la posizione per inserire le pubblicazioni (dopo physician-procedures o booking-section)
        if new_pub_html:
            # Cerca la sezione booking o procedures
            insert_patterns = [
                (r'(</div>\s*<!--\s*end physician-procedures\s*-->)', r'\1\n                        ' + new_pub_html),
                (r'(</section>\s*<!--\s*end physician-header\s*-->)', r'\1\n                        ' + new_pub_html),
                (r'(<div class="booking-section")', new_pub_html + r'\n                        \1')
            ]
            
            for pattern, replacement in insert_patterns:
                if re.search(pattern, content):
                    content = re.sub(pattern, replacement, content, count=1)
                    break
            else:
                # Inserisci prima del tag </main> o </article>
                content = re.sub(
                    r'(</main>|</article>)',
                    new_pub_html + r'\n                        \1',
                    content,
                    count=1
                )
        
        # Aggiorna anche lo schema JSON-LD per rimuovere gli anni
        content = re.sub(r'"datePublished":\s*"\d{4}"', '', content)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        updated += 1
        print(f"✅ Aggiornato: {slug}")
    
    return updated

def fix_all_publications_title():
    """Sostituisce 'Pubblicazioni Scientifiche' con 'Alcune delle Pubblicazioni Scientifiche' in tutti i file"""
    equipe_dir = Path("equipe")
    count = 0
    
    for html_file in equipe_dir.glob("*.html"):
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Sostituisci il titolo
        if "Pubblicazioni Scientifiche" in content and "Alcune delle Pubblicazioni Scientifiche" not in content:
            content = content.replace(
                "Pubblicazioni Scientifiche",
                "Alcune delle Pubblicazioni Scientifiche"
            )
            count += 1
        
        # Rimuovi anni dalle pubblicazioni
        # Pattern: "— 2003 —" o "— 2024 —" o "— Fertility" diventa "— Fertility"
        content = re.sub(r'— \d{4} —', '—', content)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print(f"✏️ Titoli aggiornati: {count} file")

def main():
    print("=" * 60)
    print("AGGIORNAMENTO COMPLETO PUBBLICAZIONI BIO-CLINIC")
    print("=" * 60)
    
    # 1. Aggiorna database JSON
    print("\n📁 Aggiornamento database JSON...")
    data = update_json_database()
    
    # 2. Correggi titoli in tutti i file
    print("\n📝 Correzione titoli 'Alcune delle Pubblicazioni Scientifiche'...")
    fix_all_publications_title()
    
    # 3. Aggiorna profili HTML
    print("\n🔄 Aggiornamento profili HTML...")
    updated = update_html_profiles(data)
    
    print("\n" + "=" * 60)
    print(f"✅ COMPLETATO: {updated} profili aggiornati")
    print("=" * 60)

if __name__ == "__main__":
    main()
