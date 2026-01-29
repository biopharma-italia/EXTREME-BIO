#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC PHYSICIAN AUTO-LINKER v2.0                                       ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
║                                                                               ║
║  Questo script scansiona TUTTE le pagine HTML e crea link cliccabili per     ║
║  OGNI nome di medico trovato, collegandolo al profilo in /equipe/            ║
║                                                                               ║
║  Uso: python scripts/physician-autolink-v2.py                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import re
import json
import glob
from pathlib import Path
from datetime import datetime

# Configurazione
SITE_ROOT = Path(__file__).parent.parent
PHYSICIANS_JSON = SITE_ROOT / "data" / "entities" / "physicians-complete.json"
LOG_FILE = SITE_ROOT / "logs" / "physician-autolink.log"

def load_physicians():
    """Carica tutti i medici dal database JSON."""
    with open(PHYSICIANS_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['physicians']

def build_physician_patterns(physicians):
    """
    Costruisce pattern di ricerca per ogni medico.
    Include varianti comuni dei nomi.
    """
    patterns = []
    
    for p in physicians:
        slug = p['slug']
        name = p['name']  # es. "Francesco Dessole"
        full_name = p['full_name']  # es. "Dott. Francesco Dessole"
        title = p.get('title', '')  # es. "Dott." o "Prof."
        job_title = p.get('job_title', '')
        
        # Estrai nome e cognome
        name_parts = name.split()
        if len(name_parts) >= 2:
            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:])
        else:
            first_name = name
            last_name = ""
        
        # Lista di varianti da cercare (in ordine di priorità)
        variants = []
        
        # 1. Nome completo con titolo (es. "Dott. Francesco Dessole", "Prof. Salvatore Dessole")
        if title:
            variants.append(f"{title} {name}")
            # Variante con "ssa" per dottoressa
            if title == "Dott.":
                variants.append(f"Dott.ssa {name}")
            # Varianti senza punto
            variants.append(f"{title.replace('.', '')} {name}")
            if title == "Dott.":
                variants.append(f"Dottssa {name}")
        
        # 2. Dr./Dr con nome
        variants.append(f"Dr. {name}")
        variants.append(f"Dr {name}")
        
        # 3. Solo cognome con titolo (es. "Dott. Dessole")
        if last_name:
            if title:
                variants.append(f"{title} {last_name}")
                if title == "Dott.":
                    variants.append(f"Dott.ssa {last_name}")
            variants.append(f"Dr. {last_name}")
        
        # Aggiungi tutte le varianti
        for variant in variants:
            if variant and len(variant) > 5:  # Evita match troppo corti
                patterns.append({
                    'pattern': variant,
                    'slug': slug,
                    'full_name': full_name,
                    'job_title': job_title,
                    'name': name
                })
    
    # Ordina per lunghezza decrescente (match più specifici prima)
    patterns.sort(key=lambda x: len(x['pattern']), reverse=True)
    
    return patterns

def get_relative_path(page_path, target="equipe"):
    """Calcola il path relativo alla cartella equipe dalla pagina corrente."""
    page_path = Path(page_path)
    rel_to_site = page_path.relative_to(SITE_ROOT)
    depth = len(rel_to_site.parts) - 1  # -1 per il file stesso
    
    if depth == 0:
        return f"{target}/"
    elif depth == 1:
        return f"../{target}/"
    else:
        return "../" * depth + f"{target}/"

def is_already_linked(text, start_pos, end_pos):
    """Verifica se il testo è già dentro un tag <a>."""
    # Cerca <a prima della posizione
    before = text[max(0, start_pos - 500):start_pos]
    after = text[end_pos:min(len(text), end_pos + 100)]
    
    # Conta i tag aperti/chiusi
    a_opens = len(re.findall(r'<a\s', before))
    a_closes = len(re.findall(r'</a>', before))
    
    # Se ci sono più aperture che chiusure, siamo dentro un <a>
    if a_opens > a_closes:
        return True
    
    # Verifica se siamo in un attributo (es. title="Dott. Rossi")
    if re.search(r'["\'][^"\']*$', before):
        return True
    
    # Verifica se siamo in un meta tag o script
    if re.search(r'<(meta|script|title)[^>]*$', before, re.IGNORECASE):
        return True
    
    return False

def process_page(page_path, patterns):
    """Processa una singola pagina HTML, aggiungendo link ai medici."""
    try:
        with open(page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        equipe_path = get_relative_path(page_path)
        links_added = 0
        
        # Per ogni pattern di medico
        for p in patterns:
            pattern_text = p['pattern']
            slug = p['slug']
            full_name = p['full_name']
            job_title = p['job_title']
            
            # Crea il regex pattern (case insensitive per alcune varianti)
            regex = re.compile(re.escape(pattern_text), re.IGNORECASE)
            
            # Trova tutte le occorrenze
            for match in list(regex.finditer(content)):
                start = match.start()
                end = match.end()
                matched_text = match.group()
                
                # Salta se già linkato
                if is_already_linked(content, start, end):
                    continue
                
                # Crea il link
                link_html = (
                    f'<a href="{equipe_path}{slug}.html" '
                    f'class="physician-link" '
                    f'title="Vedi profilo e prenota - {full_name} - {job_title}">'
                    f'{matched_text}</a>'
                )
                
                # Sostituisci (una volta sola per evitare duplicati)
                content = content[:start] + link_html + content[end:]
                links_added += 1
                
                # Ricalcola il contenuto per il prossimo match
                break  # Riavvia la ricerca dopo ogni sostituzione per gestire gli offset
            
            # Se abbiamo fatto una sostituzione, ripetiamo per lo stesso pattern
            if links_added > 0:
                # Ripeti il processo fino a quando non ci sono più match
                while True:
                    found = False
                    for match in list(regex.finditer(content)):
                        start = match.start()
                        end = match.end()
                        matched_text = match.group()
                        
                        if is_already_linked(content, start, end):
                            continue
                        
                        link_html = (
                            f'<a href="{equipe_path}{slug}.html" '
                            f'class="physician-link" '
                            f'title="Vedi profilo e prenota - {full_name} - {job_title}">'
                            f'{matched_text}</a>'
                        )
                        
                        content = content[:start] + link_html + content[end:]
                        links_added += 1
                        found = True
                        break
                    
                    if not found:
                        break
        
        # Salva solo se ci sono modifiche
        if content != original_content:
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, links_added
        else:
            return True, 0
            
    except Exception as e:
        return False, str(e)

def find_all_html_pages():
    """Trova tutte le pagine HTML da processare."""
    patterns = [
        SITE_ROOT / "index.html",
        SITE_ROOT / "pages" / "*.html",
        SITE_ROOT / "laboratorio" / "*.html",
        SITE_ROOT / "prestazioni" / "*.html",
        SITE_ROOT / "shop" / "*.html",
    ]
    
    pages = []
    for pattern in patterns:
        pages.extend(glob.glob(str(pattern)))
    
    # Escludi template e file che non devono essere processati
    exclude = ["privacy.html", "cookie.html", "template"]
    pages = [p for p in pages if not any(ex in p for ex in exclude)]
    
    return sorted(pages)

def main():
    """Funzione principale."""
    print("=" * 70)
    print("BIO-CLINIC PHYSICIAN AUTO-LINKER v2.0")
    print(f"Esecuzione: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Carica medici
    physicians = load_physicians()
    print(f"✅ Caricati {len(physicians)} medici dal database")
    
    # Costruisci pattern
    patterns = build_physician_patterns(physicians)
    print(f"✅ Generati {len(patterns)} pattern di ricerca")
    print("-" * 70)
    
    # Mostra alcuni pattern come esempio
    print("📋 Esempi di pattern:")
    for p in patterns[:5]:
        print(f"   '{p['pattern']}' -> {p['slug']}.html")
    print("   ...")
    print("-" * 70)
    
    # Trova pagine
    pages = find_all_html_pages()
    print(f"📄 Trovate {len(pages)} pagine HTML da processare")
    print("-" * 70)
    
    # Statistiche
    total_links = 0
    pages_modified = 0
    errors = 0
    
    # Processa ogni pagina
    for page in pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        success, result = process_page(page, patterns)
        
        if success:
            if isinstance(result, int) and result > 0:
                print(f"  ✅ {rel_path} - {result} link aggiunti")
                total_links += result
                pages_modified += 1
            else:
                print(f"  ⏭️  {rel_path} - nessuna modifica")
        else:
            print(f"  ❌ {rel_path} - ERRORE: {result}")
            errors += 1
    
    # Riepilogo
    print("-" * 70)
    print(f"📊 RIEPILOGO:")
    print(f"   ✅ Pagine modificate: {pages_modified}")
    print(f"   🔗 Link totali aggiunti: {total_links}")
    print(f"   ❌ Errori: {errors}")
    print("=" * 70)
    
    # Log
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n[{datetime.now().isoformat()}] Auto-link completato: {total_links} link, {pages_modified} pagine, {errors} errori\n")
    
    return 0 if errors == 0 else 1

if __name__ == "__main__":
    exit(main())
