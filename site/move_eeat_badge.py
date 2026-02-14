#!/usr/bin/env python3
"""
Script per:
1. Spostare il badge E-E-A-T in basso (prima della CTA/footer)
2. Aggiungere nota variabilità prezzi dove necessario
"""

import os
import re
from pathlib import Path

# Badge E-E-A-T da inserire in basso
EEAT_BADGE_BOTTOM = '''
    <!-- E-E-A-T Medical Verification Badge -->
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

# Nota variabilità prezzi
PRICE_NOTE = '<p style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.5rem; font-style: italic;">* Il costo delle prestazioni può variare in base allo specialista</p>'

def process_file(filepath):
    """Process a single HTML file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = []
    
    # 1. Rimuovi il badge E-E-A-T dalla posizione attuale (in alto)
    # Pattern per il badge in alto
    badge_patterns = [
        r'<!-- E-E-A-T Badge -->.*?</div>\s*</div>',
        r'<div class="medical-review-badge"[^>]*>.*?</div>\s*</div>',
        r'<!-- E-E-A-T Medical Verification Badge -->\s*<section[^>]*>.*?</section>',
    ]
    
    badge_found = False
    for pattern in badge_patterns:
        if re.search(pattern, content, re.DOTALL):
            badge_found = True
            content = re.sub(pattern, '', content, flags=re.DOTALL)
            # Clean up extra whitespace
            content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # 2. Aggiungi il badge in basso (prima della CTA o del footer)
    # Cerca la sezione CTA
    if badge_found or 'bio-clinic' in filepath.lower():
        cta_pattern = r'(<!-- CTA -->|<section class="cta")'
        footer_pattern = r'(<!-- Footer -->|<footer class="footer")'
        
        if re.search(cta_pattern, content):
            content = re.sub(cta_pattern, EEAT_BADGE_BOTTOM + r'\n\n    \1', content, count=1)
            changes.append("Badge E-E-A-T spostato prima della CTA")
        elif re.search(footer_pattern, content):
            content = re.sub(footer_pattern, EEAT_BADGE_BOTTOM + r'\n\n  \1', content, count=1)
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
        'cardiologia.html',
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
                print(f"⏭️  {page}: nessuna modifica necessaria")
        else:
            print(f"❌ {page}: file non trovato")
    
    print(f"\n📊 Totale: {updated} pagine aggiornate")

if __name__ == '__main__':
    main()
