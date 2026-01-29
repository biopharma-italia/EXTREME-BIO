#!/usr/bin/env python3
"""
FIX ORPHAN CONTENT - Rimuove il contenuto orfano dopo l'header propagato
"""

import os
import re
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent

def fix_page(page_path):
    """Rimuove il contenuto orfano tra END MASTER HEADER e la prima <section>."""
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Trova la posizione di END MASTER HEADER
    end_header_match = re.search(r'<!-- END MASTER HEADER -->', content)
    if not end_header_match:
        return False, "No END MASTER HEADER found"
    
    end_header_pos = end_header_match.end()
    
    # Trova la prima <section dopo END MASTER HEADER
    after_header = content[end_header_pos:]
    section_match = re.search(r'\n\s*<section', after_header)
    
    if not section_match:
        return False, "No <section> found after header"
    
    # Verifica se c'è contenuto orfano tra header e section
    between = after_header[:section_match.start()]
    
    # Se c'è contenuto significativo (non solo whitespace/commenti)
    clean_between = re.sub(r'<!--.*?-->', '', between, flags=re.DOTALL)
    clean_between = re.sub(r'\s+', '', clean_between)
    
    if clean_between:
        # C'è contenuto orfano - rimuovilo
        new_content = content[:end_header_pos] + "\n\n  " + after_header[section_match.start():]
        
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, f"Removed {len(between)} chars of orphan content"
    
    return True, "No orphan content"

def main():
    print("=" * 60)
    print("FIX ORPHAN CONTENT")
    print("=" * 60)
    
    # Pagine da fixare
    pages = [
        SITE_ROOT / "pages" / "cardiologia.html",
        SITE_ROOT / "pages" / "endocrinologia.html", 
        SITE_ROOT / "pages" / "ginecologia.html",
        SITE_ROOT / "pages" / "laboratorio.html",
        SITE_ROOT / "pages" / "pma-fertilita.html",
        SITE_ROOT / "pages" / "chi-siamo.html",
    ]
    
    for page in pages:
        if page.exists():
            success, msg = fix_page(page)
            rel_path = page.relative_to(SITE_ROOT)
            if "Removed" in msg:
                print(f"✅ {rel_path}: {msg}")
            else:
                print(f"⏭️  {rel_path}: {msg}")
        else:
            print(f"❌ {page.name}: File not found")

if __name__ == "__main__":
    main()
