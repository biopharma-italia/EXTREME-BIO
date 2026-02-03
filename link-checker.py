#!/usr/bin/env python3
"""
Bio-Clinic Link Checker - Verifica tutti i link del sito
Controlla menu header, footer e link interni da ogni pagina
"""

import os
import re
from collections import defaultdict
from urllib.parse import urljoin, urlparse
from pathlib import Path

SITE_DIR = "/home/user/webapp/site"
BASE_URL = "https://bio-clinic.it"

# Risultati
broken_links = []  # [(source_page, broken_link, reason)]
all_links = defaultdict(set)  # {page: set(links)}
pages_checked = 0
external_links = set()

def normalize_path(href, current_page):
    """Normalizza un path relativo rispetto alla pagina corrente"""
    if not href or href.startswith('#') or href.startswith('javascript:') or href.startswith('mailto:') or href.startswith('tel:'):
        return None
    
    if href.startswith('http://') or href.startswith('https://'):
        # Link esterno
        return ('external', href)
    
    # Path relativo
    current_dir = os.path.dirname(current_page)
    
    if href.startswith('/'):
        # Path assoluto dal root
        full_path = href.lstrip('/')
    else:
        # Path relativo
        full_path = os.path.normpath(os.path.join(current_dir, href))
    
    # Rimuovi anchor
    full_path = full_path.split('#')[0]
    
    # Rimuovi query string
    full_path = full_path.split('?')[0]
    
    return ('internal', full_path)

def check_file_exists(path):
    """Verifica se un file esiste nel sito"""
    full_path = os.path.join(SITE_DIR, path)
    
    # Prova il path diretto
    if os.path.isfile(full_path):
        return True
    
    # Se è una directory, cerca index.html
    if os.path.isdir(full_path):
        index_path = os.path.join(full_path, 'index.html')
        if os.path.isfile(index_path):
            return True
    
    # Se non ha estensione, prova con .html
    if not path.endswith('.html') and not '.' in os.path.basename(path):
        if os.path.isfile(full_path + '.html'):
            return True
        # Prova come directory con index.html
        index_path = os.path.join(full_path, 'index.html')
        if os.path.isfile(index_path):
            return True
    
    return False

def extract_links(html_content, page_path):
    """Estrae tutti i link href da una pagina HTML"""
    links = []
    
    # Pattern per href
    href_pattern = r'href=["\']([^"\']+)["\']'
    matches = re.findall(href_pattern, html_content, re.IGNORECASE)
    
    for href in matches:
        links.append(href)
    
    return links

def categorize_link(href):
    """Categorizza un link come menu, footer o altro"""
    # Questa è una semplificazione - in realtà dovremmo parsare il DOM
    return "link"

def scan_page(page_path):
    """Scansiona una singola pagina e verifica i suoi link"""
    global pages_checked
    
    full_path = os.path.join(SITE_DIR, page_path)
    
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        return
    
    pages_checked += 1
    
    # Estrai tutti i link
    links = extract_links(content, page_path)
    
    for href in links:
        normalized = normalize_path(href, page_path)
        
        if normalized is None:
            continue
        
        link_type, link_path = normalized
        
        if link_type == 'external':
            external_links.add(link_path)
            continue
        
        all_links[page_path].add(link_path)
        
        # Verifica se il file esiste
        if not check_file_exists(link_path):
            broken_links.append((page_path, href, link_path))

def main():
    print("=" * 70)
    print("BIO-CLINIC LINK CHECKER")
    print("=" * 70)
    print(f"\nDirectory sito: {SITE_DIR}")
    print("\nScansione in corso...\n")
    
    # Trova tutte le pagine HTML
    html_files = []
    for root, dirs, files in os.walk(SITE_DIR):
        # Ignora directory nascoste e backup
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'backups' and d != 'output']
        
        for file in files:
            if file.endswith('.html'):
                rel_path = os.path.relpath(os.path.join(root, file), SITE_DIR)
                html_files.append(rel_path)
    
    print(f"Trovate {len(html_files)} pagine HTML da verificare\n")
    
    # Scansiona ogni pagina
    for i, page in enumerate(sorted(html_files)):
        if (i + 1) % 100 == 0:
            print(f"  Verificate {i + 1}/{len(html_files)} pagine...")
        scan_page(page)
    
    # Report
    print("\n" + "=" * 70)
    print("REPORT VERIFICA LINK")
    print("=" * 70)
    
    print(f"\n📊 STATISTICHE:")
    print(f"   • Pagine verificate: {pages_checked}")
    print(f"   • Link interni trovati: {sum(len(v) for v in all_links.values())}")
    print(f"   • Link esterni trovati: {len(external_links)}")
    print(f"   • Link rotti trovati: {len(broken_links)}")
    
    if broken_links:
        print(f"\n❌ LINK ROTTI ({len(broken_links)}):")
        print("-" * 70)
        
        # Raggruppa per destinazione
        by_destination = defaultdict(list)
        for source, href, dest in broken_links:
            by_destination[dest].append((source, href))
        
        for dest in sorted(by_destination.keys()):
            sources = by_destination[dest]
            print(f"\n🔴 Destinazione mancante: {dest}")
            print(f"   Riferito da {len(sources)} pagine:")
            for source, href in sources[:5]:  # Mostra max 5 sorgenti
                print(f"      • {source}")
                print(f"        href=\"{href}\"")
            if len(sources) > 5:
                print(f"      ... e altre {len(sources) - 5} pagine")
    else:
        print("\n✅ NESSUN LINK ROTTO TROVATO!")
    
    # Verifica specifiche per menu e footer
    print("\n" + "=" * 70)
    print("VERIFICA MENU E FOOTER")
    print("=" * 70)
    
    # Link critici del menu
    menu_links = [
        "index.html",
        "pages/slim-care.html",
        "pages/slim-care-donna.html", 
        "pages/screening-inps-sardegna.html",
        "pages/convenzioni.html",
        "laboratorio/index.html",
        "pages/genetica.html",
        "pages/preparazione-esami.html",
        "pages/medicina-del-lavoro-sassari.html",
        "pages/ginecologia.html",
        "pages/pma-fertilita.html",
        "pages/isteroscopia.html",
        "pages/isterosalpingografia.html",
        "pages/cardiologia.html",
        "pages/endocrinologia.html",
        "pages/dermatologia.html",
        "pages/neurologia.html",
        "pages/oculistica.html",
        "pages/ortopedia.html",
        "pages/specialita.html",
        "equipe/index.html",
        "shop/index.html",
        "pages/contatti.html",
        "contatti/index.html",
        "listino-completo.html",
    ]
    
    print("\n📋 VERIFICA PAGINE MENU PRINCIPALE:")
    missing_menu = []
    for link in menu_links:
        exists = check_file_exists(link)
        status = "✅" if exists else "❌"
        if not exists:
            missing_menu.append(link)
        print(f"   {status} {link}")
    
    # Footer links
    footer_links = [
        "pages/slim-care.html",
        "pages/slim-care-donna.html",
        "pages/pma-fertilita.html",
        "pages/cardiologia.html",
        "pages/ginecologia.html",
        "pages/endocrinologia.html",
        "laboratorio/index.html",
        "pages/specialita.html",
        "pages/convenzioni.html",
        "pages/privacy.html",
        "pages/cookie.html",
    ]
    
    print("\n📋 VERIFICA PAGINE FOOTER:")
    missing_footer = []
    for link in footer_links:
        exists = check_file_exists(link)
        status = "✅" if exists else "❌"
        if not exists:
            missing_footer.append(link)
        print(f"   {status} {link}")
    
    # Riepilogo finale
    print("\n" + "=" * 70)
    print("RIEPILOGO FINALE")
    print("=" * 70)
    
    total_issues = len(broken_links) + len(missing_menu) + len(missing_footer)
    
    if total_issues == 0:
        print("\n✅ SITO OK - Nessun problema rilevato!")
    else:
        print(f"\n⚠️  PROBLEMI RILEVATI: {total_issues}")
        if broken_links:
            print(f"   • {len(broken_links)} link rotti nelle pagine")
        if missing_menu:
            print(f"   • {len(missing_menu)} pagine menu mancanti")
        if missing_footer:
            print(f"   • {len(missing_footer)} pagine footer mancanti")
    
    # Salva report dettagliato
    report_path = "/home/user/webapp/link-check-report.txt"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("BIO-CLINIC LINK CHECK REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Data: 2026-02-03\n")
        f.write(f"Pagine verificate: {pages_checked}\n")
        f.write(f"Link interni: {sum(len(v) for v in all_links.values())}\n")
        f.write(f"Link esterni: {len(external_links)}\n")
        f.write(f"Link rotti: {len(broken_links)}\n\n")
        
        if broken_links:
            f.write("LINK ROTTI:\n")
            f.write("-" * 70 + "\n")
            for source, href, dest in sorted(broken_links):
                f.write(f"Pagina: {source}\n")
                f.write(f"  href: {href}\n")
                f.write(f"  Destinazione mancante: {dest}\n\n")
        
        f.write("\nLINK ESTERNI TROVATI:\n")
        f.write("-" * 70 + "\n")
        for link in sorted(external_links):
            f.write(f"  {link}\n")
    
    print(f"\n📄 Report salvato in: {report_path}")

if __name__ == "__main__":
    main()
