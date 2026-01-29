#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC - TEAM CARDS CLICKABLE                                           ║
║  Rende l'intero riquadro del medico cliccabile per migliorare UX             ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import re
import os
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent

# Pagine da processare
PAGES_WITH_TEAM = [
    'pages/cardiologia.html',
    'pages/dermatologia.html', 
    'pages/endocrinologia.html',
    'pages/ginecologia.html',
    'pages/laboratorio.html',
    'pages/slim-care-donna.html',
    'pages/slim-care.html',
    'pages/pma-fertilita.html',
    'pages/chi-siamo.html',
]

def process_page(file_path):
    """Processa una pagina e rende le card dei medici cliccabili."""
    
    full_path = SITE_ROOT / file_path
    if not full_path.exists():
        print(f"  ⏭️  {file_path} - Non trovato")
        return 0
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    # Pattern per trovare team-member con link interno
    # Cerca: <div class="team-member">...<a href="...">Nome</a>...</div>
    pattern = r'<div class="team-member">\s*<div class="team-avatar">(.*?)</div>\s*<h4 class="team-name"><a href="([^"]+)"[^>]*>([^<]+)</a></h4>\s*<p class="team-role">([^<]+)</p>\s*</div>'
    
    def replace_with_clickable(match):
        avatar_content = match.group(1)
        href = match.group(2)
        name = match.group(3)
        role = match.group(4)
        
        # Crea la card cliccabile
        return f'''<a href="{href}" class="team-member team-member-clickable" title="Vedi profilo di {name} - {role}">
          <div class="team-avatar">{avatar_content}</div>
          <h4 class="team-name">{name}</h4>
          <p class="team-role">{role}</p>
        </a>'''
    
    content, count = re.subn(pattern, replace_with_clickable, content, flags=re.DOTALL)
    changes += count
    
    # Pattern alternativo per strutture leggermente diverse
    pattern2 = r'<div class="team-member">\s*<div class="team-avatar">(.*?)</div>\s*<h4 class="team-name"><a href="([^"]+)" class="physician-link"[^>]*>([^<]+)</a></h4>\s*<p class="team-role">([^<]+)</p>\s*</div>'
    
    content, count2 = re.subn(pattern2, replace_with_clickable, content, flags=re.DOTALL)
    changes += count2
    
    if changes > 0:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {file_path} - {changes} card rese cliccabili")
    else:
        # Verifica se ci sono già card cliccabili
        if 'team-member-clickable' in content:
            print(f"  ⏭️  {file_path} - Già processato")
        else:
            print(f"  ℹ️  {file_path} - Nessuna card trovata")
    
    return changes

def add_css_styles():
    """Aggiunge gli stili CSS per le card cliccabili."""
    
    css_path = SITE_ROOT / 'css' / 'style.css'
    
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    
    # Verifica se gli stili esistono già
    if 'team-member-clickable' in css:
        print("  ⏭️  CSS già aggiornato")
        return
    
    # Aggiungi stili per card cliccabili
    new_css = '''

/* ═══════════════════════════════════════════════════════════════
   TEAM MEMBER CLICKABLE CARDS - Riquadri medici cliccabili
   ═══════════════════════════════════════════════════════════════ */

a.team-member-clickable {
  display: block;
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}

a.team-member-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(124, 186, 61, 0.2);
  border-color: var(--primary);
}

a.team-member-clickable:hover .team-avatar {
  background: var(--primary);
  color: white;
}

a.team-member-clickable:hover .team-avatar svg {
  stroke: white;
}

a.team-member-clickable:hover .team-name {
  color: var(--primary);
}

a.team-member-clickable .team-name {
  color: var(--gray-800);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.75rem 0 0.25rem;
  transition: color 0.2s ease;
}

a.team-member-clickable .team-role {
  color: var(--primary);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
}

a.team-member-clickable .team-avatar {
  width: 60px;
  height: 60px;
  background: var(--primary-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: all 0.3s ease;
}

a.team-member-clickable .team-avatar svg {
  stroke: var(--primary);
  transition: stroke 0.3s ease;
}
'''
    
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(new_css)
    
    print("  ✅ CSS aggiornato con stili per card cliccabili")

def main():
    print("=" * 70)
    print("BIO-CLINIC - TEAM CARDS CLICKABLE")
    print("Rende l'intero riquadro del medico cliccabile")
    print("=" * 70)
    print()
    
    # Aggiungi CSS
    print("📝 Aggiornamento CSS...")
    add_css_styles()
    print()
    
    # Processa le pagine
    print("📄 Processamento pagine...")
    total_changes = 0
    
    for page in PAGES_WITH_TEAM:
        total_changes += process_page(page)
    
    # Cerca altre pagine con team-member
    print()
    print("🔍 Ricerca altre pagine con team-member...")
    
    for html_file in (SITE_ROOT / 'pages').glob('*.html'):
        rel_path = f"pages/{html_file.name}"
        if rel_path not in PAGES_WITH_TEAM:
            with open(html_file, 'r', encoding='utf-8') as f:
                if 'team-member' in f.read() and 'team-member-clickable' not in f.read():
                    total_changes += process_page(rel_path)
    
    print()
    print("=" * 70)
    print(f"✅ COMPLETATO: {total_changes} card rese cliccabili")
    print("=" * 70)

if __name__ == '__main__':
    main()
