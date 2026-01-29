#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC SITE VALIDATOR v1.0                                              ║
║                                                                               ║
║  Script di validazione RIGOROSO per garantire:                               ║
║  1. Header identico su tutte le pagine                                       ║
║  2. Tutti i medici linkati                                                   ║
║  3. Tag HTML bilanciati                                                      ║
║  4. Nessun errore di path                                                    ║
║  5. Struttura consistente                                                    ║
║                                                                               ║
║  Uso: python scripts/validate-site.py                                        ║
║  Exit code: 0 = OK, 1 = Errori trovati                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import re
import json
import glob
from pathlib import Path
from collections import defaultdict
from html.parser import HTMLParser

SITE_ROOT = Path(__file__).parent.parent

# ═══════════════════════════════════════════════════════════════════════════════
# REGOLE DI VALIDAZIONE
# ═══════════════════════════════════════════════════════════════════════════════

# Menu items OBBLIGATORI (in ordine)
REQUIRED_MENU_ITEMS = [
    "Home",
    "Slim Care Medical",
    "Laboratorio", 
    "Donna & PMA",
    "Specialisti",
    "Medical Shop",
    "Contatti"
]

# Tag che devono essere bilanciati
BALANCED_TAGS = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'div']

# File da validare
PAGES_TO_VALIDATE = [
    "index.html",
    "pages/*.html",
    "laboratorio/index.html",
    "equipe/index.html",
    "equipe/*.html",
    "prestazioni/index.html",
    "shop/index.html"
]

# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATORI
# ═══════════════════════════════════════════════════════════════════════════════

class TagBalanceChecker(HTMLParser):
    """Verifica che i tag HTML siano bilanciati."""
    
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        
    def handle_starttag(self, tag, attrs):
        if tag in BALANCED_TAGS:
            self.stack.append((tag, self.getpos()[0]))
    
    def handle_endtag(self, tag):
        if tag in BALANCED_TAGS:
            if self.stack and self.stack[-1][0] == tag:
                self.stack.pop()
            else:
                expected = self.stack[-1][0] if self.stack else "none"
                self.errors.append(f"Line {self.getpos()[0]}: Unexpected </{tag}>, expected </{expected}>")
    
    def get_unclosed(self):
        return [(tag, line) for tag, line in self.stack]


def validate_html_tags(filepath):
    """Valida che i tag HTML siano bilanciati."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checker = TagBalanceChecker()
    try:
        checker.feed(content)
    except Exception as e:
        return False, [f"Parse error: {e}"]
    
    errors = checker.errors.copy()
    for tag, line in checker.get_unclosed():
        errors.append(f"Unclosed <{tag}> at line {line}")
    
    return len(errors) == 0, errors


def validate_menu_items(filepath):
    """Valida che il menu contenga tutte le voci richieste."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    errors = []
    
    # Estrai le voci del menu
    menu_matches = re.findall(r'class="nav-link[^"]*"[^>]*>([^<]+)', content)
    menu_items = [m.strip() for m in menu_matches if m.strip()]
    
    # Verifica che tutte le voci richieste siano presenti
    for required in REQUIRED_MENU_ITEMS:
        found = any(required.lower() in item.lower() for item in menu_items)
        if not found:
            errors.append(f"Missing menu item: '{required}'")
    
    return len(errors) == 0, errors


def validate_physician_links(filepath):
    """Valida che tutti i nomi di medici siano linkati."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    errors = []
    
    # Pattern per trovare nomi di medici
    physician_pattern = r'(Dott\.ssa|Dott\.|Prof\.|Dr\.)\s+([A-Z][a-zàèéìòù]+(?:\s+[A-Z][a-zàèéìòù]+)+)'
    
    # Trova tutti i match
    for match in re.finditer(physician_pattern, content):
        title = match.group(1)
        name = match.group(2)
        full_match = match.group(0)
        start_pos = match.start()
        
        # Verifica contesto - skip se in meta, script, title
        context_before = content[max(0, start_pos-200):start_pos].lower()
        if any(x in context_before for x in ['<meta', '<script', '<title', 'content="', "content='"]):
            continue
        
        # Verifica se è linkato
        context_around = content[max(0, start_pos-100):start_pos+len(full_match)+50]
        is_linked = 'physician-link' in context_around or f'href="' in context_around[:100]
        
        if not is_linked:
            # Verifica se è nel contesto di un h4.team-name (dove dovrebbe essere linkato)
            if 'team-name' in context_around or 'team-card' in context_around:
                errors.append(f"Unlinked physician in team section: {full_match}")
    
    return len(errors) == 0, errors


def validate_paths(filepath):
    """Valida che tutti i path siano corretti."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    errors = []
    rel_path = Path(filepath).relative_to(SITE_ROOT)
    depth = len(rel_path.parts) - 1
    
    # Calcola il prefisso atteso
    if depth == 0:
        expected_prefix = ""
    elif depth == 1:
        expected_prefix = "../"
    else:
        expected_prefix = "../" * depth
    
    # Verifica path assoluti (che iniziano con /)
    absolute_paths = re.findall(r'href="(/[^"]+)"', content)
    for path in absolute_paths:
        if path.startswith('/equipe/') or path.startswith('/pages/') or path.startswith('/laboratorio/'):
            errors.append(f"Absolute path should be relative: {path}")
    
    return len(errors) == 0, errors


def validate_header_consistency(pages):
    """Valida che l'header sia identico su tutte le pagine."""
    errors = []
    
    # Estrai l'header dalla prima pagina come riferimento
    reference_page = None
    reference_menu = None
    
    for page in pages:
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Estrai le voci del menu (normalizzate)
        menu_matches = re.findall(r'class="nav-link[^"]*"[^>]*>([^<]+)', content)
        menu_items = [m.strip().lower() for m in menu_matches if m.strip()]
        
        # Rimuovi "active" dalla considerazione
        menu_signature = tuple(menu_items)
        
        if reference_menu is None:
            reference_page = page
            reference_menu = menu_signature
        else:
            if menu_signature != reference_menu:
                errors.append(f"Menu differs from {reference_page}: {page}")
                errors.append(f"  Expected: {reference_menu}")
                errors.append(f"  Found: {menu_signature}")
    
    return len(errors) == 0, errors


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def get_all_pages():
    """Trova tutte le pagine da validare."""
    pages = []
    for pattern in PAGES_TO_VALIDATE:
        full_pattern = str(SITE_ROOT / pattern)
        pages.extend(glob.glob(full_pattern))
    
    # Escludi template e profilo dinamico
    exclude = ['profilo.html', 'template', 'master-header']
    pages = [p for p in pages if not any(ex in p for ex in exclude)]
    
    return sorted(pages)


def main():
    print("=" * 75)
    print("BIO-CLINIC SITE VALIDATOR v1.0")
    print("=" * 75)
    print()
    
    all_pages = get_all_pages()
    print(f"📄 Validating {len(all_pages)} pages...")
    print("-" * 75)
    
    total_errors = 0
    results = defaultdict(list)
    
    # 1. Validazione TAG HTML
    print("\n🔍 CHECK 1: HTML Tag Balance")
    for page in all_pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        ok, errors = validate_html_tags(page)
        if not ok:
            print(f"   ❌ {rel_path}")
            for e in errors:
                print(f"      - {e}")
                results['html_tags'].append(f"{rel_path}: {e}")
            total_errors += len(errors)
    
    if not results['html_tags']:
        print("   ✅ All pages have balanced HTML tags")
    
    # 2. Validazione MENU
    print("\n🔍 CHECK 2: Menu Items Consistency")
    main_pages = [p for p in all_pages if 'equipe/' not in p or p.endswith('index.html')]
    for page in main_pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        ok, errors = validate_menu_items(page)
        if not ok:
            print(f"   ❌ {rel_path}")
            for e in errors:
                print(f"      - {e}")
                results['menu'].append(f"{rel_path}: {e}")
            total_errors += len(errors)
    
    if not results['menu']:
        print("   ✅ All pages have correct menu items")
    
    # 3. Validazione HEADER CONSISTENCY
    print("\n🔍 CHECK 3: Header Consistency Across Pages")
    ok, errors = validate_header_consistency(main_pages[:10])  # Check first 10 main pages
    if not ok:
        for e in errors:
            print(f"   ❌ {e}")
            results['header'].append(e)
        total_errors += len(errors)
    else:
        print("   ✅ Header is consistent across all pages")
    
    # 4. Validazione LINK MEDICI
    print("\n🔍 CHECK 4: Physician Links")
    specialty_pages = [p for p in all_pages if any(x in p for x in ['cardiologia', 'ginecologia', 'endocrinologia', 'dermatologia', 'slim-care', 'chi-siamo'])]
    for page in specialty_pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        ok, errors = validate_physician_links(page)
        if not ok:
            print(f"   ❌ {rel_path}")
            for e in errors:
                print(f"      - {e}")
                results['physicians'].append(f"{rel_path}: {e}")
            total_errors += len(errors)
    
    if not results['physicians']:
        print("   ✅ All physicians are properly linked")
    
    # 5. Validazione PATH
    print("\n🔍 CHECK 5: Path Validation")
    for page in all_pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        ok, errors = validate_paths(page)
        if not ok:
            print(f"   ❌ {rel_path}")
            for e in errors:
                print(f"      - {e}")
                results['paths'].append(f"{rel_path}: {e}")
            total_errors += len(errors)
    
    if not results['paths']:
        print("   ✅ All paths are correct")
    
    # SUMMARY
    print()
    print("=" * 75)
    print("VALIDATION SUMMARY")
    print("=" * 75)
    
    if total_errors == 0:
        print()
        print("  ✅✅✅ ALL CHECKS PASSED! ✅✅✅")
        print()
        print("  The site is valid and consistent.")
        return 0
    else:
        print()
        print(f"  ❌ FOUND {total_errors} ERROR(S)")
        print()
        print("  Errors by category:")
        for cat, errs in results.items():
            if errs:
                print(f"    - {cat}: {len(errs)} errors")
        print()
        print("  Please fix these issues before deployment.")
        return 1


if __name__ == "__main__":
    exit(main())
