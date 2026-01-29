#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC PHYSICIAN AUTO-LINKER v3.0                                       ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
║                                                                               ║
║  VERSIONE MIGLIORATA: gestisce correttamente Dott./Dott.ssa/Prof.            ║
║  e tutti i casi di nomi medici presenti nelle pagine.                        ║
║                                                                               ║
║  Uso: python scripts/physician-autolink-v3.py                                ║
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
    Include TUTTE le varianti possibili.
    """
    patterns = []
    
    for p in physicians:
        slug = p['slug']
        name = p['name']  # es. "Sara Uras"
        full_name = p['full_name']  # es. "Dott.ssa Sara Uras"
        title = p.get('title', 'Dott.')  # es. "Dott.ssa" o "Prof."
        job_title = p.get('job_title', 'Specialista')
        
        # Lista di varianti da cercare
        variants = set()
        
        # 1. Full name esatto dal database
        variants.add(full_name)
        
        # 2. Varianti con diversi titoli
        titles = ['Dott.', 'Dott.ssa', 'Dr.', 'Dr', 'Prof.', 'Prof', 'Dottssa', 'Dottoressa']
        for t in titles:
            variants.add(f"{t} {name}")
        
        # 3. Se il title contiene "ssa", aggiungi versioni femminili
        if 'ssa' in title.lower():
            variants.add(f"Dott.ssa {name}")
            variants.add(f"Dottssa {name}")
            variants.add(f"Dottoressa {name}")
        
        # 4. Versione senza titolo (solo nome completo)
        # variants.add(name)  # Troppo generico, potrebbe creare falsi positivi
        
        # Aggiungi tutte le varianti
        for variant in variants:
            if variant and len(variant) > 5:
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
    depth = len(rel_to_site.parts) - 1
    
    if depth == 0:
        return f"{target}/"
    elif depth == 1:
        return f"../{target}/"
    else:
        return "../" * depth + f"{target}/"

def is_inside_tag(content, pos):
    """Verifica se la posizione è dentro un tag HTML (attributo, script, meta, ecc.)."""
    # Cerca indietro per trovare < o >
    search_back = content[max(0, pos - 200):pos]
    
    # Se troviamo < senza > dopo, siamo dentro un tag
    last_open = search_back.rfind('<')
    last_close = search_back.rfind('>')
    
    if last_open > last_close:
        return True
    
    return False

def is_already_linked(content, start, end):
    """Verifica se il testo è già dentro un link <a>."""
    # Cerca <a> aperto prima della posizione
    before = content[max(0, start - 300):start]
    
    # Conta i tag <a aperti vs </a> chiusi
    a_opens = len(re.findall(r'<a[\s>]', before, re.IGNORECASE))
    a_closes = len(re.findall(r'</a>', before, re.IGNORECASE))
    
    if a_opens > a_closes:
        return True
    
    return False

def process_page(page_path, patterns):
    """Processa una singola pagina HTML."""
    try:
        with open(page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        equipe_path = get_relative_path(page_path)
        links_added = 0
        already_processed = set()  # Per evitare duplicati
        
        # Per ogni pattern
        for p in patterns:
            pattern_text = p['pattern']
            slug = p['slug']
            full_name = p['full_name']
            job_title = p['job_title']
            
            # Salta se già processato questo slug
            if slug in already_processed:
                continue
            
            # Cerca il pattern nel contenuto
            # Usa regex per match case-sensitive (i nomi devono matchare esattamente)
            search_pos = 0
            iterations = 0
            max_iterations = 100  # Sicurezza contro loop infiniti
            
            while search_pos < len(content) and iterations < max_iterations:
                iterations += 1
                
                # Trova la prossima occorrenza
                pos = content.find(pattern_text, search_pos)
                if pos == -1:
                    break
                
                end_pos = pos + len(pattern_text)
                
                # Verifica se è un contesto valido per linkare
                if is_inside_tag(content, pos):
                    search_pos = end_pos
                    continue
                
                if is_already_linked(content, pos, end_pos):
                    search_pos = end_pos
                    continue
                
                # Verifica che sia in un contesto HTML visibile (es. dentro <h4>, <p>, <span>)
                # e non in meta, script, title, style, JSON-LD, ecc.
                before_context = content[max(0, pos - 500):pos].lower()
                
                # IMPORTANTE: Escludi blocchi JSON-LD
                if 'application/ld+json' in before_context:
                    # Verifica se siamo ancora dentro il blocco script
                    last_script_open = before_context.rfind('<script')
                    last_script_close = before_context.rfind('</script')
                    if last_script_open > last_script_close:
                        search_pos = end_pos
                        continue
                
                # Escludi altri contesti non validi
                if any(tag in before_context[-150:] for tag in ['<meta', '<script', '<title', '<style', 'content="', "content='", '"name":', '"founder":']):
                    search_pos = end_pos
                    continue
                
                # Crea il link
                matched_text = content[pos:end_pos]
                link_html = (
                    f'<a href="{equipe_path}{slug}.html" '
                    f'class="physician-link" '
                    f'title="Vedi profilo e prenota - {full_name} - {job_title}">'
                    f'{matched_text}</a>'
                )
                
                # Sostituisci
                content = content[:pos] + link_html + content[end_pos:]
                links_added += 1
                already_processed.add(slug)
                
                # Aggiorna la posizione di ricerca (dopo il link appena inserito)
                search_pos = pos + len(link_html)
        
        # Salva se modificato
        if content != original_content:
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, links_added
        else:
            return True, 0
            
    except Exception as e:
        import traceback
        return False, f"{str(e)}\n{traceback.format_exc()}"

def find_all_html_pages():
    """Trova tutte le pagine HTML da processare."""
    patterns_list = [
        SITE_ROOT / "index.html",
        SITE_ROOT / "pages" / "*.html",
        SITE_ROOT / "laboratorio" / "*.html",
        SITE_ROOT / "prestazioni" / "*.html",
        SITE_ROOT / "shop" / "*.html",
    ]
    
    pages = []
    for pattern in patterns_list:
        pages.extend(glob.glob(str(pattern)))
    
    # Escludi pagine che non devono essere processate
    exclude = ["privacy.html", "cookie.html", "template"]
    pages = [p for p in pages if not any(ex in p for ex in exclude)]
    
    return sorted(pages)

def main():
    """Funzione principale."""
    print("=" * 70)
    print("BIO-CLINIC PHYSICIAN AUTO-LINKER v3.0")
    print(f"Esecuzione: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Carica medici
    physicians = load_physicians()
    print(f"✅ Caricati {len(physicians)} medici dal database")
    
    # Costruisci pattern
    patterns = build_physician_patterns(physicians)
    print(f"✅ Generati {len(patterns)} pattern di ricerca")
    
    # Debug: mostra pattern per Sara Uras
    print("-" * 70)
    print("📋 Pattern per 'Sara Uras':")
    for p in patterns:
        if 'sara-uras' in p['slug']:
            print(f"   '{p['pattern']}'")
    print("-" * 70)
    
    # Trova pagine
    pages = find_all_html_pages()
    print(f"📄 Trovate {len(pages)} pagine HTML")
    print("-" * 70)
    
    # Statistiche
    total_links = 0
    pages_modified = 0
    errors = 0
    
    # Processa
    for page in pages:
        rel_path = os.path.relpath(page, SITE_ROOT)
        success, result = process_page(page, patterns)
        
        if success:
            if isinstance(result, int) and result > 0:
                print(f"  ✅ {rel_path} - {result} link aggiunti")
                total_links += result
                pages_modified += 1
            else:
                print(f"  ⏭️  {rel_path} - già completo")
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
        f.write(f"\n[{datetime.now().isoformat()}] v3.0 - {total_links} link, {pages_modified} pagine\n")
    
    return 0 if errors == 0 else 1

if __name__ == "__main__":
    exit(main())
