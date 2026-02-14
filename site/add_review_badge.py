#!/usr/bin/env python3
"""
Bio-Clinic: Aggiunge badge "Revisionato da medico" alle pagine mediche
per migliorare E-E-A-T e fiducia utente
"""

import os
import re
from datetime import datetime

TODAY = datetime.now().strftime("%d/%m/%Y")
TODAY_ISO = datetime.now().strftime("%Y-%m-%d")

# Badge HTML da inserire dopo il breadcrumb o all'inizio del contenuto
REVIEW_BADGE = f'''
      <!-- E-E-A-T Badge: Reviewed by Medical Professional -->
      <div class="medical-review-badge" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #22c55e; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span style="color: #166534;">
          <strong>Revisionato da équipe medica Bio-Clinic</strong> • 
          Aggiornato: {TODAY} •
          <a href="../equipe/salvatore-dessole.html" style="color: #166534; text-decoration: underline;">Dir. Sanitario: Prof. S. Dessole</a>
        </span>
      </div>
'''


def process_file(filepath):
    """Aggiunge badge di revisione medica"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip se già ha il badge
    if 'medical-review-badge' in content or 'Revisionato da' in content:
        return False, "already has review badge"
    
    # Skip pagine non mediche (privacy, cookie, contatti, ecc.)
    skip_pages = ['privacy.html', 'cookie.html', 'contatti.html', 'chi-siamo.html', 
                  'convenzioni.html', 'specialita.html', 'prevenzione.html', 'symptom-checker.html']
    
    basename = os.path.basename(filepath)
    if basename in skip_pages:
        return False, "non-medical page"
    
    # Cerca il punto di inserimento - dopo breadcrumb o dopo h1
    # Pattern 1: dopo nav breadcrumb
    breadcrumb_pattern = r'(</nav>\s*</div>\s*</section>)'
    
    # Pattern 2: dopo section hero con h1
    hero_pattern = r'(<section[^>]*class="[^"]*hero[^"]*"[^>]*>.*?</section>)'
    
    # Pattern 3: dopo il primo h1
    h1_pattern = r'(<h1[^>]*>.*?</h1>\s*(?:<p[^>]*>.*?</p>)?)'
    
    modified = False
    
    # Prova pattern breadcrumb
    if 'aria-label="Breadcrumb"' in content:
        # Trova la fine del container dopo breadcrumb
        match = re.search(r'(aria-label="Breadcrumb"[^>]*>.*?</nav>\s*)', content, re.DOTALL)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + '\n' + REVIEW_BADGE + content[insert_pos:]
            modified = True
    
    # Se non trovato, prova dopo primo h1
    if not modified:
        h1_match = re.search(r'(<h1[^>]*>[^<]*</h1>(?:\s*<p[^>]*>[^<]*</p>)?)', content)
        if h1_match:
            insert_pos = h1_match.end()
            content = content[:insert_pos] + '\n' + REVIEW_BADGE + content[insert_pos:]
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "review badge added"
    
    return False, "no insertion point found"


def main():
    pages_dir = 'pages'
    updated = []
    skipped = []
    
    # Processa solo pagine mediche rilevanti
    medical_pages = [
        'cardiologia.html', 'dermatologia.html', 'endocrinologia.html', 
        'gastroenterologia.html', 'neurologia.html', 'oculistica.html',
        'ortopedia.html', 'otorinolaringoiatria.html', 'pneumologia.html',
        'reumatologia.html', 'urologia.html', 'ematologia.html',
        'ginecologia.html', 'pap-test.html', 'duopap.html', 'hpv-dna-test.html',
        'pma-fertilita.html', 'visita-ginecologica.html', 'colposcopia.html',
        'ecografia-morfologica.html', 'ecografia-transvaginale.html',
        'ecocardiogramma.html', 'holter-ecg.html', 'holter-pressorio.html',
        'visita-cardiologica-ecg.html', 'checkup-cardiovascolare.html',
        'checkup-tiroide.html', 'ecografia-tiroidea.html',
        'preparazione-esami.html', 'genetica.html', 'medicina-lavoro.html',
        'ginecologi-sassari.html'
    ]
    
    for filename in sorted(os.listdir(pages_dir)):
        if not filename.endswith('.html'):
            continue
        
        # Solo pagine mediche
        if filename not in medical_pages:
            continue
        
        filepath = os.path.join(pages_dir, filename)
        success, reason = process_file(filepath)
        
        if success:
            updated.append(filename)
            print(f"✅ {filename}")
        else:
            skipped.append((filename, reason))
            print(f"⏭️  {filename}: {reason}")
    
    print(f"\n📊 Risultato:")
    print(f"   ✅ Aggiornate: {len(updated)} pagine")
    print(f"   ⏭️  Saltate: {len(skipped)} pagine")


if __name__ == '__main__':
    main()
