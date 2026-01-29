#!/usr/bin/env python3
"""
Bio-Clinic - Add Publications & Symptoms Sections
==================================================
Aggiunge le sezioni visive per pubblicazioni e sintomi alle pagine profilo.
"""

import json
import os
import re
from pathlib import Path
from html import escape

def load_extended_data(site_path):
    """Carica i dati estesi dei medici"""
    ext_path = site_path / 'data' / 'entities' / 'physicians-extended.json'
    with open(ext_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_physicians(site_path):
    """Carica database medici"""
    db_path = site_path / 'data' / 'entities' / 'physicians-complete.json'
    with open(db_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_symptoms_html(symptoms):
    """Genera HTML per la sezione sintomi"""
    if not symptoms:
        return ""
    
    tags = ''.join([f'<span class="sintomo-tag">{escape(s)}</span>' for s in symptoms[:12]])
    return f'''
          <div class="sintomi-section" style="margin-top: 20px;">
            <h4 style="font-size: 1.1em; margin-bottom: 12px; color: #333;">Cosa Curo</h4>
            <div class="sintomi-tags" style="display: flex; flex-wrap: wrap; gap: 8px;">
              {tags}
            </div>
          </div>'''

def generate_publications_html(publications, name):
    """Genera HTML per la sezione pubblicazioni"""
    if not publications:
        return ""
    
    pub_items = ''
    for pub in publications[:5]:
        pub_items += f'''
            <div class="pub-item" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
              <div class="pub-title" style="font-weight: 500; color: #333; margin-bottom: 5px;">{escape(pub.get('titolo', ''))}</div>
              <div class="pub-meta" style="font-size: 0.85em; color: #666; margin-bottom: 5px;">{escape(str(pub.get('anno', '')))} - {escape(pub.get('journal', ''))}</div>
              <a href="{escape(pub.get('url', ''))}" target="_blank" rel="noopener" class="pub-link" style="color: #1565c0; text-decoration: none; font-size: 0.9em;">Visualizza su PubMed →</a>
            </div>'''
    
    return f'''
      <!-- Pubblicazioni Scientifiche -->
      <section class="pubblicazioni-section" id="pubblicazioni" style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #4caf50;">
        <h3 style="color: #2e7d32; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 1.2em;">
          <span style="font-size: 1.3em;">📚</span> Pubblicazioni Scientifiche 
          <span style="background: #4caf50; color: white; font-size: 0.6em; padding: 4px 10px; border-radius: 4px; font-weight: normal;">Ricerca verificata su PubMed</span>
        </h3>
        <p style="color: #666; margin-bottom: 20px; font-size: 0.95em;">
          Le seguenti pubblicazioni scientifiche dimostrano l'impegno nella ricerca e l'expertise clinica di {escape(name)}.
        </p>
        <div class="publications-list">
          {pub_items}
        </div>
      </section>'''

def process_profile(html_path, extended_data, default_symptoms, physicians):
    """Processa un singolo profilo"""
    slug = html_path.stem
    
    # Trova dati del medico
    physician = None
    for p in physicians.get('physicians', []):
        if p.get('slug') == slug:
            physician = p
            break
    
    if not physician:
        return False, "Physician not found in DB"
    
    # Carica HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Verifica se già processato
    if 'id="pubblicazioni"' in html or 'class="sintomi-section"' in html:
        return False, "Already has sections"
    
    # Ottieni dati estesi o default
    ext = extended_data.get('physicians_extended', {}).get(slug, {})
    specialty_id = physician.get('specialty_id', '')
    
    symptoms = ext.get('sintomi', [])
    if not symptoms:
        symptoms = default_symptoms.get(specialty_id, [])
    
    publications = ext.get('pubblicazioni', [])
    
    # Genera HTML sezioni
    symptoms_html = generate_symptoms_html(symptoms)
    pubs_html = generate_publications_html(publications, physician.get('full_name', physician.get('name', '')))
    
    # Trova punto di inserimento per sintomi (dopo physician-bio)
    if symptoms_html:
        # Pattern: dopo </div> che chiude physician-bio
        pattern = r'(<div class="physician-bio">.*?</div>)'
        match = re.search(pattern, html, re.DOTALL)
        if match:
            insert_point = match.end()
            html = html[:insert_point] + symptoms_html + html[insert_point:]
    
    # Trova punto di inserimento per pubblicazioni (prima di </main>)
    if pubs_html:
        # Inserisci prima della chiusura di </section> delle procedure o prima di </main>
        if '</section>' in html and 'physician-procedures' in html:
            # Trova la section delle procedure
            pattern = r'(</section>\s*</div>\s*</main>)'
            html = re.sub(pattern, pubs_html + r'\n    \1', html)
        else:
            html = html.replace('</main>', pubs_html + '\n  </main>')
    
    # Aggiungi CSS inline se non presente
    if '.sintomo-tag {' not in html:
        css = '''
<style>
.sintomo-tag {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  display: inline-block;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sintomo-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 101, 192, 0.2);
}
</style>
'''
        html = html.replace('</head>', css + '</head>')
    
    # Salva
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    has_pubs = "📚" if publications else ""
    return True, f"Updated {has_pubs}"

def main():
    site_path = Path(__file__).parent.parent
    equipe_path = site_path / 'equipe'
    
    print("=" * 60)
    print("BIO-CLINIC - ADDING PUBLICATIONS & SYMPTOMS SECTIONS")
    print("=" * 60)
    print()
    
    # Carica dati
    extended_data = load_extended_data(site_path)
    physicians = load_physicians(site_path)
    default_symptoms = extended_data.get('default_sintomi_by_specialty', {})
    
    updated = 0
    skipped = 0
    errors = 0
    with_pubs = 0
    
    for html_file in sorted(equipe_path.glob('*.html')):
        if html_file.name in ['index.html', 'profilo.html']:
            continue
        
        success, message = process_profile(html_file, extended_data, default_symptoms, physicians)
        
        if success:
            if "📚" in message:
                with_pubs += 1
            updated += 1
            print(f"  ✓ {html_file.stem:<35} {message}")
        elif "Already" in message:
            skipped += 1
            print(f"  - {html_file.stem:<35} {message}")
        else:
            errors += 1
            print(f"  ✗ {html_file.stem:<35} {message}")
    
    print()
    print("=" * 60)
    print(f"Updated:          {updated}")
    print(f"With publications: {with_pubs}")
    print(f"Skipped:          {skipped}")
    print(f"Errors:           {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()
