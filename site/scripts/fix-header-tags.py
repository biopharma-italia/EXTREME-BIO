#!/usr/bin/env python3
"""
FIX HEADER TAGS - Rimuove i tag <header> duplicati/annidati
"""

import os
import re
import glob
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent

def fix_page(page_path):
    """Corregge i tag header duplicati in una pagina."""
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern: trova <!-- Header --> seguito da <header> che contiene altro <header>
    # Rimuovi il primo <header> wrapper mantenendo il contenuto
    
    # Metodo 1: Rimuovi il primo <header class="header"> se è subito dopo <!-- Header -->
    pattern1 = r'(<!-- Header -->\s*)<header class="header">\s*(<!-- TOP BAR)'
    content = re.sub(pattern1, r'\1\2', content)
    
    # Metodo 2: Se c'è un <header> che contiene header-top e poi un altro <header>
    # Dobbiamo trovare e rimuovere il wrapper esterno
    
    # Conta i tag
    header_opens = len(re.findall(r'<header[^>]*>', content))
    header_closes = len(re.findall(r'</header>', content))
    
    if header_opens > header_closes:
        # C'è ancora un tag non chiuso - rimuovi il primo <header> dopo <!-- Header -->
        # che non ha il suo </header> prima del prossimo <header>
        
        # Trova tutte le posizioni dei tag
        opens = [(m.start(), m.end()) for m in re.finditer(r'<header[^>]*>', content)]
        closes = [(m.start(), m.end()) for m in re.finditer(r'</header>', content)]
        
        if len(opens) == 2 and len(closes) == 1:
            # Caso tipico: 2 aperture, 1 chiusura
            # Rimuovi la prima apertura
            first_open = opens[0]
            content = content[:first_open[0]] + content[first_open[1]:]
    
    if content != original:
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print("=" * 60)
    print("FIX HEADER TAGS")
    print("=" * 60)
    
    # Trova tutte le pagine
    patterns = [
        SITE_ROOT / "index.html",
        SITE_ROOT / "pages" / "*.html",
        SITE_ROOT / "laboratorio" / "*.html",
        SITE_ROOT / "equipe" / "*.html",
        SITE_ROOT / "prestazioni" / "*.html",
        SITE_ROOT / "shop" / "*.html",
    ]
    
    pages = []
    for pattern in patterns:
        pages.extend(glob.glob(str(pattern)))
    
    fixed = 0
    for page in sorted(pages):
        rel_path = os.path.relpath(page, SITE_ROOT)
        
        # Verifica se ha problemi
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        
        opens = len(re.findall(r'<header', content))
        closes = len(re.findall(r'</header>', content))
        
        if opens != closes:
            if fix_page(page):
                print(f"✅ Fixed: {rel_path}")
                fixed += 1
            else:
                print(f"⚠️  Could not fix: {rel_path}")
        else:
            print(f"⏭️  OK: {rel_path}")
    
    print("-" * 60)
    print(f"Fixed: {fixed} pages")

if __name__ == "__main__":
    main()
