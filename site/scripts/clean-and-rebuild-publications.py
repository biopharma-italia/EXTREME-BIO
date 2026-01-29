#!/usr/bin/env python3
"""
Script per pulire e ricostruire correttamente le sezioni pubblicazioni.
Rimuove duplicati e assicura formato corretto.
"""

import json
import re
from pathlib import Path

def load_physicians_data():
    with open("data/entities/physicians-extended.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_clean_publications_html(pubs, medico_name):
    """Genera HTML pubblicazioni pulito SENZA anno"""
    if not pubs:
        return ""
    
    pub_items = []
    for pub in pubs:
        journal = pub.get('journal', 'Journal')
        pub_html = f'''<div class="pub-item">
              <div class="pub-title">{pub['titolo']}</div>
              <div class="pub-meta">{journal}</div>
              <a href="{pub['url']}" target="_blank" rel="noopener" class="pub-link">🔗 Visualizza su PubMed</a>
            </div>'''
        pub_items.append(pub_html)
    
    pub_list = '\n            '.join(pub_items)
    
    return f'''
      <!-- Alcune delle Pubblicazioni Scientifiche -->
      <section class="pubblicazioni-section" id="pubblicazioni" style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #4caf50;">
        <h3 style="color: #2e7d32; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 1.2em;">
          <span style="font-size: 1.3em;">📚</span> Alcune delle Pubblicazioni Scientifiche 
          <span style="background: #4caf50; color: white; font-size: 0.6em; padding: 4px 10px; border-radius: 4px; font-weight: normal;">Ricerca verificata su PubMed</span>
        </h3>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 20px;">
          Queste pubblicazioni dimostrano l'attività di ricerca scientifica del {medico_name} e sono verificabili su database medici accreditati.
        </p>
        <div class="pub-list" style="display: flex; flex-direction: column; gap: 15px;">
            {pub_list}
        </div>
      </section>'''

def clean_and_rebuild(slug, info, equipe_dir):
    """Pulisce e ricostruisce il file HTML del medico"""
    html_file = equipe_dir / f"{slug}.html"
    if not html_file.exists():
        print(f"⚠️ File non trovato: {slug}")
        return False
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Estrai il nome del medico
    title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
    medico_name = title_match.group(1).strip() if title_match else slug.replace('-', ' ').title()
    
    # Rimuovi TUTTE le sezioni pubblicazioni esistenti (vari formati)
    patterns_to_remove = [
        # Sezione con section tag
        r'<!-- Alcune delle Pubblicazioni Scientifiche -->.*?</section>',
        r'<!-- Pubblicazioni Scientifiche -->.*?</section>',
        # Sezione con div
        r'<div class="pubblicazioni-section"[^>]*>.*?</div>\s*</div>\s*</div>',
        # CSS inline per pubblicazioni
        r'\.pubblicazioni-section\s*\{[^}]+\}',
        r'\.pub-badge\s*\{[^}]+\}',
        r'\.pub-item\s*\{[^}]+\}',
        r'\.pub-title\s*\{[^}]+\}',
        r'\.pub-meta\s*\{[^}]+\}',
        r'\.pub-link\s*\{[^}]+\}',
    ]
    
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Rimuovi linee vuote multiple
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # Genera nuova sezione pubblicazioni
    pubs = info.get('pubblicazioni', [])
    if pubs:
        new_pub_html = generate_clean_publications_html(pubs, medico_name)
        
        # Inserisci prima del footer o prima di </main>
        if '<footer' in content:
            content = content.replace('<footer', new_pub_html + '\n    <footer', 1)
        elif '</main>' in content:
            content = content.replace('</main>', new_pub_html + '\n    </main>', 1)
        else:
            # Inserisci prima di </body>
            content = content.replace('</body>', new_pub_html + '\n  </body>', 1)
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    print("=" * 60)
    print("PULIZIA E RICOSTRUZIONE SEZIONI PUBBLICAZIONI")
    print("=" * 60)
    
    data = load_physicians_data()
    equipe_dir = Path("equipe")
    
    success = 0
    total = len(data['physicians_extended'])
    
    for slug, info in data['physicians_extended'].items():
        if clean_and_rebuild(slug, info, equipe_dir):
            pubs_count = len(info.get('pubblicazioni', []))
            print(f"✅ {slug}: {pubs_count} pubblicazioni")
            success += 1
    
    print(f"\n{'=' * 60}")
    print(f"Completato: {success}/{total} profili aggiornati")
    print("=" * 60)

if __name__ == "__main__":
    main()
