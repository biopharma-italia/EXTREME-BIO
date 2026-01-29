#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC HEADER PROPAGATION SYSTEM v2.0                                   ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
║                                                                               ║
║  Questo script propaga il MASTER HEADER a TUTTE le pagine HTML del sito.     ║
║  Eseguire SEMPRE dopo ogni modifica al file:                                 ║
║     components/master-header.html                                            ║
║                                                                               ║
║  Uso: python scripts/propagate-header.py                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import re
import glob
from datetime import datetime
from pathlib import Path

# Configurazione
SITE_ROOT = Path(__file__).parent.parent
MASTER_HEADER_PATH = SITE_ROOT / "components" / "master-header.html"
LOG_FILE = SITE_ROOT / "logs" / "header-propagation.log"

# Pattern per identificare l'header esistente (da sostituire)
HEADER_START_PATTERNS = [
    r'<!-- TOP BAR -->',
    r'<div class="header-top">',
    r'<!-- Header -->',
    r'<header class="header">'
]

HEADER_END_PATTERNS = [
    r'<!-- END MASTER HEADER -->',
    r'</nav>\s*<!-- Mobile Navigation -->',
    r'<!-- Mobile Navigation -->\s*</nav>',
    r'<section class="hero',
    r'<main',
    r'<!-- Hero Section',
    r'<div class="hero'
]

# Mappa dei path relativi per ogni tipo di pagina
def get_paths_for_page(page_path: str) -> dict:
    """Calcola i path relativi corretti per ogni pagina."""
    page_path = Path(page_path)
    rel_to_site = page_path.relative_to(SITE_ROOT)
    depth = len(rel_to_site.parts) - 1  # -1 per il file stesso
    
    if depth == 0:
        # Pagina nella root (es. index.html)
        return {
            "ROOT_PATH": "",
            "PAGES_PATH": "pages/",
            "IMAGES_PATH": "images/",
            "JS_PATH": "js/",
            "CSS_PATH": "css/"
        }
    elif depth == 1:
        # Pagina in una sottocartella (es. pages/cardiologia.html, laboratorio/index.html)
        return {
            "ROOT_PATH": "../",
            "PAGES_PATH": "" if "pages" in str(rel_to_site) else "../pages/",
            "IMAGES_PATH": "../images/",
            "JS_PATH": "../js/",
            "CSS_PATH": "../css/"
        }
    elif depth == 2:
        # Pagina più profonda (es. equipe/medici/nome.html)
        return {
            "ROOT_PATH": "../../",
            "PAGES_PATH": "../../pages/",
            "IMAGES_PATH": "../../images/",
            "JS_PATH": "../../js/",
            "CSS_PATH": "../../css/"
        }
    else:
        # Default per profondità maggiori
        prefix = "../" * depth
        return {
            "ROOT_PATH": prefix,
            "PAGES_PATH": f"{prefix}pages/",
            "IMAGES_PATH": f"{prefix}images/",
            "JS_PATH": f"{prefix}js/",
            "CSS_PATH": f"{prefix}css/"
        }

def get_active_class(page_path: str) -> dict:
    """Determina quali voci di menu devono essere attive."""
    page_name = Path(page_path).name.lower()
    page_dir = Path(page_path).parent.name.lower()
    
    active = {
        "ACTIVE_HOME": "",
        "ACTIVE_SLIMCARE": "",
        "ACTIVE_LAB": "",
        "ACTIVE_DONNA": "",
        "ACTIVE_SPEC": "",
        "ACTIVE_SHOP": "",
        "ACTIVE_CONTATTI": ""
    }
    
    # Home
    if page_name == "index.html" and page_dir in ["site", ""]:
        active["ACTIVE_HOME"] = "active"
    
    # Slim Care
    elif "slim-care" in page_name:
        active["ACTIVE_SLIMCARE"] = "active"
    
    # Laboratorio
    elif "laboratorio" in page_name or page_dir == "laboratorio":
        active["ACTIVE_LAB"] = "active"
    
    # Donna & PMA
    elif page_name in ["ginecologia.html", "pma-fertilita.html"]:
        active["ACTIVE_DONNA"] = "active"
    
    # Shop
    elif page_dir == "shop" or "shop" in page_name:
        active["ACTIVE_SHOP"] = "active"
    
    # Contatti
    elif page_name == "contatti.html":
        active["ACTIVE_CONTATTI"] = "active"
    
    # Specialisti (tutte le altre specialità)
    elif page_name in ["cardiologia.html", "endocrinologia.html", "dermatologia.html", 
                       "neurologia.html", "oculistica.html", "ortopedia.html", 
                       "specialita.html", "chi-siamo.html"] or page_dir == "equipe":
        active["ACTIVE_SPEC"] = "active"
    
    return active

def load_master_header() -> str:
    """Carica il master header."""
    with open(MASTER_HEADER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    # Rimuovi commenti di documentazione
    content = re.sub(r'<!--\s*╔.*?╚[^>]*-->\s*', '', content, flags=re.DOTALL)
    return content.strip()

def apply_header_to_page(page_path: str, master_header: str) -> tuple[bool, str]:
    """Applica il master header a una pagina specifica."""
    try:
        with open(page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Calcola i path relativi
        paths = get_paths_for_page(page_path)
        active_classes = get_active_class(page_path)
        
        # Sostituisci i placeholder nel master header
        header = master_header
        for key, value in {**paths, **active_classes}.items():
            header = header.replace(f"{{{{{key}}}}}", value)
        
        # Trova dove inizia l'header esistente
        header_start = None
        for pattern in HEADER_START_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                header_start = match.start()
                break
        
        # Se non troviamo l'inizio, cerca </head>
        if header_start is None:
            head_end = content.find('</head>')
            if head_end != -1:
                # Cerca <body...>
                body_match = re.search(r'<body[^>]*>', content[head_end:])
                if body_match:
                    header_start = head_end + body_match.end()
        
        if header_start is None:
            return False, "Non trovato punto di inserimento header"
        
        # Trova dove finisce l'header esistente
        header_end = None
        search_content = content[header_start:]
        
        for pattern in HEADER_END_PATTERNS:
            match = re.search(pattern, search_content, re.IGNORECASE)
            if match:
                header_end = header_start + match.start()
                break
        
        if header_end is None:
            # Fallback: cerca la prima sezione/main
            main_match = re.search(r'<(main|section|div class="hero|div class="page)', search_content, re.IGNORECASE)
            if main_match:
                header_end = header_start + main_match.start()
        
        if header_end is None:
            return False, "Non trovata fine dell'header esistente"
        
        # Costruisci il nuovo contenuto
        new_content = content[:header_start] + header + "\n\n" + content[header_end:].lstrip()
        
        # Salva solo se ci sono modifiche
        if new_content != original_content:
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, "Aggiornato"
        else:
            return True, "Già aggiornato"
            
    except Exception as e:
        return False, str(e)

def find_all_html_pages() -> list:
    """Trova tutte le pagine HTML del sito."""
    patterns = [
        SITE_ROOT / "index.html",
        SITE_ROOT / "pages" / "*.html",
        SITE_ROOT / "laboratorio" / "*.html",
        SITE_ROOT / "equipe" / "*.html",
        SITE_ROOT / "prestazioni" / "*.html",
        SITE_ROOT / "shop" / "*.html"
    ]
    
    pages = []
    for pattern in patterns:
        pages.extend(glob.glob(str(pattern)))
    
    # Escludi template e componenti
    exclude = ["master-header.html", "profilo.html", "template"]
    pages = [p for p in pages if not any(ex in p for ex in exclude)]
    
    return sorted(pages)

def main():
    """Funzione principale."""
    print("=" * 70)
    print("BIO-CLINIC HEADER PROPAGATION SYSTEM v2.0")
    print(f"Esecuzione: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Verifica che esista il master header
    if not MASTER_HEADER_PATH.exists():
        print(f"❌ ERRORE: Master header non trovato: {MASTER_HEADER_PATH}")
        return 1
    
    # Carica il master header
    master_header = load_master_header()
    print(f"✅ Master header caricato ({len(master_header)} caratteri)")
    
    # Trova tutte le pagine
    pages = find_all_html_pages()
    print(f"📄 Trovate {len(pages)} pagine HTML")
    print("-" * 70)
    
    # Statistiche
    updated = 0
    skipped = 0
    errors = 0
    
    # Applica l'header a ogni pagina
    for page in pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        success, message = apply_header_to_page(page, master_header)
        
        if success:
            if "Aggiornato" in message and "Già" not in message:
                print(f"  ✅ {rel_path} - {message}")
                updated += 1
            else:
                print(f"  ⏭️  {rel_path} - {message}")
                skipped += 1
        else:
            print(f"  ❌ {rel_path} - ERRORE: {message}")
            errors += 1
    
    # Riepilogo
    print("-" * 70)
    print(f"📊 RIEPILOGO:")
    print(f"   ✅ Pagine aggiornate: {updated}")
    print(f"   ⏭️  Pagine già OK: {skipped}")
    print(f"   ❌ Errori: {errors}")
    print("=" * 70)
    
    # Crea log
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n[{datetime.now().isoformat()}] Propagazione completata: {updated} aggiornate, {skipped} già OK, {errors} errori\n")
    
    return 0 if errors == 0 else 1

if __name__ == "__main__":
    exit(main())
