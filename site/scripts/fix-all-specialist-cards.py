#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC - FIX ALL SPECIALIST CARDS                                       ║
║  Rende TUTTE le card degli specialisti cliccabili con animazione hover       ║
║  Applica modifiche sistematiche a TUTTO il sito                              ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import re
import json
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent

def load_physicians():
    """Carica database medici per trovare gli slug"""
    physicians_path = SITE_ROOT / 'data' / 'entities' / 'physicians-complete.json'
    if physicians_path.exists():
        with open(physicians_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            physicians = data.get('physicians', data)
            # Crea mappatura nome -> slug
            name_to_slug = {}
            for p in physicians:
                name_to_slug[p.get('name', '')] = p.get('slug', '')
                name_to_slug[p.get('full_name', '')] = p.get('slug', '')
                # Aggiungi varianti
                name = p.get('name', '')
                if name:
                    name_to_slug[f"Dott. {name}"] = p.get('slug', '')
                    name_to_slug[f"Dott.ssa {name}"] = p.get('slug', '')
                    name_to_slug[f"Prof. {name}"] = p.get('slug', '')
            return name_to_slug
    return {}

def get_equipe_path(page_path):
    """Calcola il path relativo alla cartella equipe"""
    rel_path = page_path.relative_to(SITE_ROOT)
    depth = len(rel_path.parts) - 1
    if depth == 0:
        return "equipe/"
    else:
        return "../" * depth + "equipe/"

def extract_name_from_content(content):
    """Estrae il nome del medico dal contenuto della card"""
    # Cerca nel team-name
    match = re.search(r'<h4[^>]*class=["\']team-name["\'][^>]*>([^<]+(?:<[^>]+>[^<]+)*)</h4>', content, re.DOTALL)
    if match:
        name = re.sub(r'<[^>]+>', '', match.group(1)).strip()
        return name
    return None

def find_slug_for_name(name, name_to_slug):
    """Trova lo slug per un nome"""
    if not name:
        return None
    
    # Prova match esatto
    if name in name_to_slug:
        return name_to_slug[name]
    
    # Prova senza titolo
    name_clean = re.sub(r'^(Dott\.?ssa?|Prof\.?|Dr\.?)\s+', '', name).strip()
    for key, slug in name_to_slug.items():
        if name_clean in key or key in name_clean:
            return slug
    
    # Genera slug dal nome
    slug = name_clean.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

def convert_team_member_to_clickable(content, page_path, name_to_slug):
    """Converte div.team-member in a.team-member-clickable"""
    equipe_path = get_equipe_path(page_path)
    changes = 0
    
    # Pattern per team-member non ancora clickable
    pattern = r'<div class="team-member"([^>]*)>\s*(<div class="team-avatar"[^>]*>.*?</div>)\s*<h4 class="team-name">([^<]+)</h4>\s*<p class="team-role">([^<]+)</p>\s*</div>'
    
    def replace_func(match):
        nonlocal changes
        extra_attrs = match.group(1)
        avatar = match.group(2)
        name = match.group(3).strip()
        role = match.group(4).strip()
        
        slug = find_slug_for_name(name, name_to_slug)
        if not slug:
            print(f"    ⚠️  Slug non trovato per: {name}")
            return match.group(0)
        
        changes += 1
        return f'''<a href="{equipe_path}{slug}.html" class="team-member team-member-clickable"{extra_attrs} title="Vedi profilo di {name} - {role}">
          {avatar}
          <h4 class="team-name">{name}</h4>
          <p class="team-role">{role}</p>
        </a>'''
    
    content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
    
    # Pattern alternativo con stile inline sull'avatar
    pattern2 = r'<div class="team-member"([^>]*)>\s*(<div class="team-avatar"[^>]*style="[^"]*"[^>]*>.*?</div>)\s*<h4 class="team-name">([^<]+)</h4>\s*<p class="team-role">([^<]+)</p>\s*</div>'
    
    content = re.sub(pattern2, replace_func, content, flags=re.DOTALL)
    
    # Pattern per team-member con link interno (rimuovi link interno, metti sul contenitore)
    pattern3 = r'<div class="team-member"([^>]*)>\s*(<div class="team-avatar"[^>]*>.*?</div>)\s*<h4 class="team-name"><a href="([^"]+)"[^>]*>([^<]+)</a></h4>\s*<p class="team-role">([^<]+)</p>\s*</div>'
    
    def replace_with_existing_link(match):
        nonlocal changes
        extra_attrs = match.group(1)
        avatar = match.group(2)
        href = match.group(3)
        name = match.group(4).strip()
        role = match.group(5).strip()
        
        changes += 1
        return f'''<a href="{href}" class="team-member team-member-clickable"{extra_attrs} title="Vedi profilo di {name} - {role}">
          {avatar}
          <h4 class="team-name">{name}</h4>
          <p class="team-role">{role}</p>
        </a>'''
    
    content = re.sub(pattern3, replace_with_existing_link, content, flags=re.DOTALL)
    
    return content, changes

def process_page(page_path, name_to_slug):
    """Processa una singola pagina"""
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Converti team-member
    content, changes = convert_team_member_to_clickable(content, page_path, name_to_slug)
    
    if content != original:
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    
    return 0

def verify_hover_styles():
    """Verifica che gli stili hover siano presenti nel CSS"""
    css_path = SITE_ROOT / 'css' / 'style.css'
    
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    
    required_styles = [
        'team-member-clickable:hover',
        'physician-card:hover'
    ]
    
    missing = []
    for style in required_styles:
        if style not in css:
            missing.append(style)
    
    return missing

def add_unified_hover_styles():
    """Aggiunge stili hover unificati per tutte le card"""
    css_path = SITE_ROOT / 'css' / 'style.css'
    
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    
    # Verifica se già esistono
    if 'UNIFIED CARD HOVER ANIMATIONS' in css:
        return False
    
    unified_css = '''

/* ═══════════════════════════════════════════════════════════════
   UNIFIED CARD HOVER ANIMATIONS - Animazioni uniformi per card
   Applicato a: team-member, physician-card, specialist-card
   ═══════════════════════════════════════════════════════════════ */

/* Base styles per tutte le card medici */
.team-member,
.physician-card,
.specialist-card,
.doctor-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

/* Hover effect unificato */
.team-member:hover,
.physician-card:hover,
.specialist-card:hover,
.doctor-card:hover,
a.team-member-clickable:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(124, 186, 61, 0.25);
}

/* Avatar animation on hover */
.team-member:hover .team-avatar,
.physician-card:hover .physician-card-header,
a.team-member-clickable:hover .team-avatar {
  background: var(--primary);
  transform: scale(1.05);
}

.team-member:hover .team-avatar svg,
.physician-card:hover .physician-card-header svg,
a.team-member-clickable:hover .team-avatar svg {
  stroke: white;
}

/* Name highlight on hover */
.team-member:hover .team-name,
.physician-card:hover .physician-name,
a.team-member-clickable:hover .team-name {
  color: var(--primary);
}

/* Smooth transitions for child elements */
.team-avatar,
.physician-card-header {
  transition: all 0.3s ease;
}

.team-name,
.physician-name {
  transition: color 0.2s ease;
}

/* Focus styles for accessibility */
a.team-member-clickable:focus,
a.physician-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* Active/pressed state */
a.team-member-clickable:active,
a.physician-card:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 186, 61, 0.2);
}
'''
    
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(unified_css)
    
    return True

def main():
    print("=" * 70)
    print("BIO-CLINIC - FIX ALL SPECIALIST CARDS")
    print("Rende TUTTE le card cliccabili con animazione hover uniforme")
    print("=" * 70)
    print()
    
    # Carica database medici
    print("📂 Caricamento database medici...")
    name_to_slug = load_physicians()
    print(f"   Trovati {len(name_to_slug)} mappature nome->slug")
    print()
    
    # Aggiungi stili hover unificati
    print("🎨 Verifica stili CSS...")
    if add_unified_hover_styles():
        print("   ✅ Stili hover unificati aggiunti")
    else:
        print("   ⏭️  Stili hover già presenti")
    print()
    
    # Trova tutte le pagine con team-member
    print("🔍 Ricerca pagine con card specialisti...")
    pages_to_process = []
    
    # Pages directory
    for html_file in (SITE_ROOT / 'pages').glob('*.html'):
        pages_to_process.append(html_file)
    
    # Laboratorio
    lab_index = SITE_ROOT / 'laboratorio' / 'index.html'
    if lab_index.exists():
        pages_to_process.append(lab_index)
    
    # Index
    index_file = SITE_ROOT / 'index.html'
    if index_file.exists():
        pages_to_process.append(index_file)
    
    print(f"   Trovate {len(pages_to_process)} pagine da processare")
    print()
    
    # Processa ogni pagina
    print("🔧 Conversione card in corso...")
    total_changes = 0
    
    for page in pages_to_process:
        changes = process_page(page, name_to_slug)
        if changes > 0:
            rel_path = page.relative_to(SITE_ROOT)
            print(f"   ✅ {rel_path} - {changes} card convertite")
            total_changes += changes
    
    print()
    print("=" * 70)
    print(f"✅ COMPLETATO!")
    print(f"   Card convertite: {total_changes}")
    print(f"   Stili hover: Applicati a tutto il sito")
    print("=" * 70)

if __name__ == '__main__':
    main()
