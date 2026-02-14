#!/usr/bin/env python3
"""
Script per:
1. Spostare il badge E-E-A-T in basso (prima della CTA/footer)
2. Aggiornare il testo del badge a "Informazioni verificate dall'équipe medica Bio-Clinic"
3. Aggiungere nota variabilità prezzi dove necessario
"""

import os
import re
from pathlib import Path

# Badge E-E-A-T da inserire in basso
EEAT_BADGE_BOTTOM = '''<!-- E-E-A-T Medical Verification Badge -->
    <section style="padding: 1.5rem 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <div class="container">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap; text-align: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style="color: #166534; font-size: 0.9rem;">
            <strong>Informazioni verificate dall'équipe medica Bio-Clinic</strong> • 
            Aggiornato: 01/02/2026 •
            <a href="../equipe/salvatore-dessole.html" style="color: #166534; text-decoration: underline;">Dir. Sanitario: Prof. S. Dessole</a>
          </span>
        </div>
      </div>
    </section>

'''

def process_file(filepath):
    """Process a single HTML file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = []
    
    # Skip cardiologia.html - già processato
    if 'cardiologia.html' in str(filepath) and 'checkup' not in str(filepath):
        return []
    
    # 1. Rimuovi il badge E-E-A-T dalla posizione attuale (in alto)
    # Vari pattern per il badge
    patterns_to_remove = [
        # Pattern per badge con commento
        r'<!-- E-E-A-T Badge[^>]*-->.*?</div>\s*</div>\s*(?=\s*</div>|\s*<)',
        r'<!-- E-E-A-T Badge: Reviewed by Medical Professional -->.*?</div>\s*</div>',
        # Pattern per medical-review-badge div
        r'<div class="medical-review-badge"[^>]*>.*?</span>\s*</div>\s*</div>',
        r'<div class="medical-review-badge"[^>]*>.*?</div>(?=\s*\n\s*<h1|\s*\n\s*</div>)',
    ]
    
    badge_removed = False
    for pattern in patterns_to_remove:
        matches = re.findall(pattern, content, re.DOTALL)
        if matches:
            content = re.sub(pattern, '', content, flags=re.DOTALL)
            badge_removed = True
    
    # Rimuovi anche badge già in basso se già presente (per evitare duplicati)
    if '<!-- E-E-A-T Medical Verification Badge -->' in content:
        content = re.sub(r'<!-- E-E-A-T Medical Verification Badge -->.*?</section>\s*\n*', '', content, flags=re.DOTALL)
        badge_removed = True
    
    # Clean up extra whitespace
    content = re.sub(r'\n\s*\n\s*\n\s*\n', '\n\n', content)
    
    # 2. Aggiungi il badge in basso (prima della CTA)
    if '<section class="cta">' in content:
        # Inserisci prima della CTA
        content = content.replace('<section class="cta">', EEAT_BADGE_BOTTOM + '<section class="cta">')
        changes.append("Badge E-E-A-T spostato in basso")
    elif '<!-- CTA -->' in content:
        content = content.replace('<!-- CTA -->', EEAT_BADGE_BOTTOM + '<!-- CTA -->')
        changes.append("Badge E-E-A-T spostato prima del commento CTA")
    elif '<footer class="footer">' in content:
        content = content.replace('<footer class="footer">', EEAT_BADGE_BOTTOM + '<footer class="footer">')
        changes.append("Badge E-E-A-T spostato prima del footer")
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return []

def main():
    pages_dir = Path('pages')
    
    # Lista delle pagine da processare
    pages_to_process = [
        'checkup-cardiovascolare.html', 
        'checkup-tiroide.html',
        'duopap.html',
        'ecocardiogramma.html',
        'ecografia-morfologica.html',
        'ecografia-tiroidea.html',
        'ecografia-transvaginale.html',
        'ematologia.html',
        'endocrinologia.html',
        'gastroenterologia.html',
        'genetica.html',
        'ginecologi-sassari.html',
        'ginecologia.html',
        'holter-ecg.html',
        'holter-pressorio.html',
        'hpv-dna-test.html',
        'medicina-lavoro.html',
        'neurologia.html',
        'oculistica.html',
        'ortopedia.html',
        'otorinolaringoiatria.html',
        'pap-test.html',
        'pneumologia.html',
        'preparazione-esami.html',
        'reumatologia.html',
        'specialita.html',
        'urologia.html',
    ]
    
    updated = 0
    for page in pages_to_process:
        filepath = pages_dir / page
        if filepath.exists():
            changes = process_file(filepath)
            if changes:
                print(f"✅ {page}: {', '.join(changes)}")
                updated += 1
            else:
                print(f"⏭️  {page}: nessuna modifica")
        else:
            print(f"❌ {page}: file non trovato")
    
    print(f"\n📊 Totale: {updated} pagine aggiornate")

if __name__ == '__main__':
    main()
