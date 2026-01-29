#!/usr/bin/env python3
"""
Bio-Clinic Profile Updater v2.0
================================
Aggiorna sistematicamente tutte le pagine profilo con:
- Schema.org completo (Physician + FAQPage + BreadcrumbList)
- Sintomi e pubblicazioni da physicians-extended.json
- Meta tags ottimizzati
- Sezioni visuali (tag sintomi, pubblicazioni, social)
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from html import escape

class ProfileUpdater:
    def __init__(self, site_path):
        self.site_path = Path(site_path)
        self.equipe_path = self.site_path / 'equipe'
        self.data_path = self.site_path / 'data' / 'entities'
        self.stats = {
            'updated': 0,
            'created': 0,
            'errors': 0,
            'skipped': 0
        }
        
    def load_data(self):
        """Carica tutti i dati necessari"""
        # Main DB
        with open(self.data_path / 'physicians-complete.json', 'r', encoding='utf-8') as f:
            self.main_db = json.load(f)
        
        # Extended DB
        with open(self.data_path / 'physicians-extended.json', 'r', encoding='utf-8') as f:
            self.extended_db = json.load(f)
        
        self.physicians = self.main_db.get('physicians', [])
        self.specialties = self.main_db.get('specialties', {})
        self.extended = self.extended_db.get('physicians_extended', {})
        self.specialty_map = self.extended_db.get('specialty_mapping_en', {})
        self.default_symptoms = self.extended_db.get('default_sintomi_by_specialty', {})
        
    def get_specialty_english(self, specialty_id):
        """Ottiene nome specialità in inglese"""
        return self.specialty_map.get(specialty_id, 'Medicine')
    
    def get_symptoms(self, slug, specialty_id):
        """Ottiene sintomi per il medico"""
        if slug in self.extended:
            return self.extended[slug].get('sintomi', [])
        return self.default_symptoms.get(specialty_id, [])
    
    def get_publications(self, slug):
        """Ottiene pubblicazioni per il medico"""
        if slug in self.extended:
            return self.extended[slug].get('pubblicazioni', [])
        return []
    
    def get_social(self, slug):
        """Ottiene link social per il medico"""
        if slug in self.extended:
            return self.extended[slug].get('social', [])
        return []
    
    def generate_schema(self, physician):
        """Genera Schema.org completo"""
        slug = physician.get('slug')
        name = physician.get('name')
        full_name = physician.get('full_name', name)
        title = physician.get('title', 'Dott.')
        specialty_id = physician.get('specialty_id')
        job_title = physician.get('job_title', '')
        bio = physician.get('bio', '')
        
        specialty_en = self.get_specialty_english(specialty_id)
        symptoms = self.get_symptoms(slug, specialty_id)
        publications = self.get_publications(slug)
        social = self.get_social(slug)
        
        # Build graph
        graph = {
            "@context": "https://schema.org",
            "@graph": []
        }
        
        # 1. Physician Schema
        physician_schema = {
            "@type": "Physician",
            "@id": f"https://bio-clinic.it/equipe/{slug}/#physician",
            "name": full_name,
            "givenName": name.split()[0] if name else "",
            "familyName": name.split()[-1] if name else "",
            "honorificPrefix": title,
            "jobTitle": job_title,
            "description": bio,
            "medicalSpecialty": f"https://schema.org/{specialty_en}",
            "isAcceptingNewPatients": True,
            "worksFor": {
                "@type": "MedicalClinic",
                "name": "Bio-Clinic Sassari",
                "url": "https://bio-clinic.it",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Via Renzo Mossa, 23",
                    "addressLocality": "Sassari",
                    "postalCode": "07100",
                    "addressRegion": "SS",
                    "addressCountry": "IT"
                },
                "telephone": "+39 079 956 1332"
            },
            "availableService": [
                {"@type": "MedicalProcedure", "name": proc.replace('-', ' ').title()}
                for proc in physician.get('procedures', [])[:5]
            ]
        }
        
        # Add knowsAbout
        if symptoms:
            physician_schema["knowsAbout"] = symptoms
        
        # Add citations (publications)
        if publications:
            physician_schema["citation"] = [
                {
                    "@type": "ScholarlyArticle",
                    "name": pub.get('titolo', ''),
                    "url": pub.get('url', ''),
                    "datePublished": str(pub.get('anno', '')),
                    "publisher": pub.get('journal', '')
                }
                for pub in publications
            ]
        
        # Add social links
        if social:
            physician_schema["sameAs"] = [s.get('url') for s in social if s.get('url')]
        
        graph["@graph"].append(physician_schema)
        
        # 2. FAQPage Schema
        faq_items = []
        
        # Q1: Patologie
        symptoms_list = ', '.join(symptoms[:8]) if symptoms else 'varie patologie della specializzazione'
        faq_items.append({
            "@type": "Question",
            "name": f"Quali patologie tratta il {title} {name.split()[-1] if name else ''}?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"Il {title} {name.split()[-1] if name else ''} è specializzato nel trattamento di: {symptoms_list}. Per prenotare una visita presso Bio-Clinic Sassari chiamare il 079 956 1332."
            }
        })
        
        # Q2: Pubblicazioni
        if publications:
            pub_titles = '; '.join([f"\"{p.get('titolo', '')}\"" for p in publications[:3]])
            faq_items.append({
                "@type": "Question",
                "name": f"Il {title} {name.split()[-1] if name else ''} ha pubblicazioni scientifiche?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"Sì, il {title} {name.split()[-1] if name else ''} ha {len(publications)} pubblicazioni indicizzate su PubMed, tra cui: {pub_titles}."
                }
            })
        else:
            faq_items.append({
                "@type": "Question",
                "name": f"Dove posso trovare informazioni sul {title} {name.split()[-1] if name else ''}?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"Il {title} {name.split()[-1] if name else ''} esercita presso Bio-Clinic Sassari. Per informazioni chiamare il 079 956 1332 o visitare il sito bio-clinic.it."
                }
            })
        
        # Q3: Sede
        faq_items.append({
            "@type": "Question",
            "name": f"Dove riceve il {title} {name.split()[-1] if name else ''}?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"Il {title} {name.split()[-1] if name else ''} riceve presso Bio-Clinic Sassari in Via Renzo Mossa 23, 07100 Sassari. Orari: Lun-Ven 07:00-21:00, Sab 08:00-14:00. Tel: 079 956 1332."
            }
        })
        
        # Q4: Prenotazione
        miodottore_url = physician.get('miodottore_url')
        if miodottore_url:
            faq_items.append({
                "@type": "Question",
                "name": f"Come posso prenotare una visita con il {title} {name.split()[-1] if name else ''}?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"È possibile prenotare una visita con il {title} {name.split()[-1] if name else ''} chiamando Bio-Clinic al 079 956 1332 oppure online tramite MioDottore.it."
                }
            })
        
        faq_schema = {
            "@type": "FAQPage",
            "mainEntity": faq_items
        }
        graph["@graph"].append(faq_schema)
        
        # 3. BreadcrumbList Schema
        breadcrumb_schema = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://bio-clinic.it/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Équipe",
                    "item": "https://bio-clinic.it/equipe/"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": full_name,
                    "item": f"https://bio-clinic.it/equipe/{slug}/"
                }
            ]
        }
        graph["@graph"].append(breadcrumb_schema)
        
        return json.dumps(graph, indent=2, ensure_ascii=False)
    
    def update_page_schema(self, html_content, physician):
        """Aggiorna lo schema nella pagina"""
        new_schema = self.generate_schema(physician)
        
        # Pattern per trovare schema esistente
        schema_pattern = r'<script type="application/ld\+json">[\s\S]*?</script>'
        
        # Rimuovi tutti gli schema esistenti nella head
        html_parts = html_content.split('</head>')
        if len(html_parts) >= 2:
            head_content = html_parts[0]
            # Rimuovi schema esistenti
            head_content = re.sub(schema_pattern, '', head_content)
            # Aggiungi nuovo schema prima di </head>
            new_schema_tag = f'''<script type="application/ld+json">
{new_schema}
</script>'''
            html_content = head_content + new_schema_tag + '\n</head>' + '</head>'.join(html_parts[1:])
        
        return html_content
    
    def add_visual_sections(self, html_content, physician):
        """Aggiunge sezioni visuali per sintomi e pubblicazioni"""
        slug = physician.get('slug')
        specialty_id = physician.get('specialty_id')
        
        symptoms = self.get_symptoms(slug, specialty_id)
        publications = self.get_publications(slug)
        social = self.get_social(slug)
        
        # CSS per le sezioni
        css_addition = '''
<style>
.sintomi-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }
.sintomo-tag { background: #e3f2fd; color: #1565c0; padding: 6px 12px; border-radius: 20px; font-size: 0.9em; }
.pubblicazioni-section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4caf50; }
.pubblicazioni-section h4 { color: #2e7d32; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
.pubblicazioni-section h4::before { content: "📚"; }
.pub-badge { background: #4caf50; color: white; font-size: 0.7em; padding: 3px 8px; border-radius: 4px; }
.pub-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0; }
.pub-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.pub-title { font-weight: 500; color: #333; }
.pub-meta { font-size: 0.85em; color: #666; margin-top: 4px; }
.pub-link { color: #1565c0; text-decoration: none; font-size: 0.9em; }
.pub-link:hover { text-decoration: underline; }
.social-links { display: flex; gap: 12px; margin-top: 10px; }
.social-link { display: inline-flex; align-items: center; gap: 6px; color: #555; text-decoration: none; font-size: 0.9em; }
.social-link:hover { color: #1565c0; }
</style>'''
        
        # Aggiungi CSS se non presente
        if '.sintomi-tags' not in html_content:
            html_content = html_content.replace('</head>', css_addition + '\n</head>')
        
        # Genera HTML sintomi
        if symptoms:
            symptoms_html = f'''
<div class="sintomi-section">
    <h4>Cosa Curo</h4>
    <div class="sintomi-tags">
        {''.join([f'<span class="sintomo-tag">{escape(s)}</span>' for s in symptoms[:12]])}
    </div>
</div>'''
            # Inserisci dopo la bio
            if 'class="bio-text"' in html_content and 'sintomi-section' not in html_content:
                html_content = re.sub(
                    r'(class="bio-text"[^>]*>.*?</[^>]+>)',
                    rf'\1\n{symptoms_html}',
                    html_content,
                    count=1,
                    flags=re.DOTALL
                )
        
        # Genera HTML pubblicazioni
        if publications:
            pubs_html = f'''
<div class="pubblicazioni-section" id="pubblicazioni">
    <h4>Pubblicazioni Scientifiche <span class="pub-badge">Ricerca verificata su PubMed</span></h4>
    {''.join([f"""
    <div class="pub-item">
        <div class="pub-title">{escape(pub.get('titolo', ''))}</div>
        <div class="pub-meta">{escape(str(pub.get('anno', '')))} - {escape(pub.get('journal', ''))}</div>
        <a href="{escape(pub.get('url', ''))}" target="_blank" rel="noopener" class="pub-link">Visualizza su PubMed →</a>
    </div>""" for pub in publications[:5]])}
</div>'''
            # Inserisci prima del footer o alla fine del main content
            if 'pubblicazioni-section' not in html_content:
                if '</main>' in html_content:
                    html_content = html_content.replace('</main>', pubs_html + '\n</main>')
        
        return html_content
    
    def process_all_profiles(self):
        """Processa tutti i profili"""
        print("=" * 60)
        print("BIO-CLINIC PROFILE UPDATER v2.0")
        print("=" * 60)
        print()
        
        self.load_data()
        print(f"Loaded {len(self.physicians)} physicians")
        print(f"Extended data for {len(self.extended)} physicians")
        print()
        
        for physician in self.physicians:
            slug = physician.get('slug')
            if not slug:
                continue
            
            html_file = self.equipe_path / f"{slug}.html"
            
            try:
                if not html_file.exists():
                    print(f"  ⚠ {slug}: File not found")
                    self.stats['skipped'] += 1
                    continue
                
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Update schema
                html_content = self.update_page_schema(html_content, physician)
                
                # Add visual sections
                html_content = self.add_visual_sections(html_content, physician)
                
                # Save
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                
                has_pubs = "📚" if slug in self.extended and self.extended[slug].get('pubblicazioni') else ""
                print(f"  ✓ {physician.get('name', slug):<35} {has_pubs}")
                self.stats['updated'] += 1
                
            except Exception as e:
                print(f"  ✗ {slug}: {str(e)}")
                self.stats['errors'] += 1
        
        print()
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Updated:  {self.stats['updated']}")
        print(f"Created:  {self.stats['created']}")
        print(f"Skipped:  {self.stats['skipped']}")
        print(f"Errors:   {self.stats['errors']}")
        print()
        
        return self.stats

def main():
    site_path = Path(__file__).parent.parent
    updater = ProfileUpdater(site_path)
    updater.process_all_profiles()

if __name__ == "__main__":
    main()
