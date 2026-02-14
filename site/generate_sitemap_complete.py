#!/usr/bin/env python3
"""
Bio-Clinic Sitemap Generator
Genera sitemap.xml completa con tutte le pagine HTML
"""

import os
from datetime import datetime

DOMAIN = "https://bio-clinic.it"
TODAY = datetime.now().strftime("%Y-%m-%d")

# Directory da INCLUDERE
INCLUDE_DIRS = ['pages/', 'equipe/', 'laboratorio/', 'prestazioni/', 'shop/']

# File root da includere
INCLUDE_ROOT_FILES = ['index.html', 'listino-completo.html']

# File specifici da ESCLUDERE
EXCLUDE_FILES = ['404.html', 'profilo.html', 'css-test.html', 'pap-test-hpv.html']  # pap-test-hpv.html redirected to duopap.html

# Directory da escludere dal walk
EXCLUDE_DIRS = ['node_modules', 'output', 'backups', 'backup', 'build', 'components', 'data', 'templates', '.git']


def get_priority(path):
    """Assegna priorità in base al tipo di pagina"""
    if path == 'index.html':
        return '1.0'
    
    # Pagine specialità principali (hub)
    high_priority = ['ginecologia', 'cardiologia', 'slim-care', 'laboratorio', 'genetica', 'pma-fertilita', 'endocrinologia', 'dermatologia']
    for hp in high_priority:
        if hp in path:
            basename = os.path.basename(path)
            if basename.startswith(hp) or basename == f'{hp}.html':
                return '0.9'
    
    # Laboratorio hub
    if path == 'laboratorio/index.html':
        return '0.9'
    
    # Pagine in /pages/
    if path.startswith('pages/'):
        if 'visita-' in path:
            return '0.8'
        if 'ecografia-' in path:
            return '0.8'
        if 'checkup-' in path:
            return '0.8'
        if 'pap-test' in path or 'hpv' in path or 'duopap' in path:
            return '0.8'
        if 'medicina-lavoro' in path or 'preparazione-esami' in path:
            return '0.8'
        # Altre pagine servizio
        return '0.7'
    
    # Pagine equipe
    if path.startswith('equipe/'):
        if 'index.html' in path:
            return '0.7'
        if 'salvatore-dessole' in path:  # Direttore sanitario
            return '0.8'
        return '0.6'
    
    # Laboratorio sotto-pagine
    if path.startswith('laboratorio/'):
        return '0.7'
    
    # Listino
    if 'listino' in path:
        return '0.7'
    
    # Shop, prestazioni
    if path.startswith('shop/') or path.startswith('prestazioni/'):
        return '0.5'
    
    # Default
    return '0.5'


def get_changefreq(path):
    """Assegna frequenza di cambio"""
    if path == 'index.html':
        return 'weekly'
    if path.startswith('equipe/'):
        return 'monthly'
    if 'listino' in path:
        return 'weekly'
    if path.startswith('pages/'):
        return 'monthly'
    return 'monthly'


def should_include(filepath):
    """Verifica se il file deve essere incluso"""
    basename = os.path.basename(filepath)
    
    # Escludi file specifici
    if basename in EXCLUDE_FILES:
        return False
    
    # Includi file root specifici
    if filepath in INCLUDE_ROOT_FILES:
        return True
    
    # Includi se inizia con una delle directory incluse
    for inc_dir in INCLUDE_DIRS:
        if filepath.startswith(inc_dir):
            return True
    
    return False


def generate_sitemap():
    """Genera la sitemap XML"""
    urls = []
    
    for root, dirs, files in os.walk('.'):
        # Salta directory da escludere
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        
        for file in files:
            if not file.endswith('.html'):
                continue
            
            filepath = os.path.join(root, file).replace('./', '')
            
            if not should_include(filepath):
                continue
            
            # Costruisci URL
            url = f"{DOMAIN}/{filepath}"
            priority = get_priority(filepath)
            changefreq = get_changefreq(filepath)
            
            urls.append({
                'loc': url,
                'lastmod': TODAY,
                'changefreq': changefreq,
                'priority': priority
            })
    
    # Ordina: homepage prima, poi per priorità decrescente, poi alfabetico
    urls.sort(key=lambda x: (
        0 if x['loc'].endswith('/index.html') and x['loc'].count('/') == 3 else 1,
        -float(x['priority']),
        x['loc']
    ))
    
    # Genera XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    
    for url in urls:
        xml_lines.append('  <url>')
        xml_lines.append(f"    <loc>{url['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{url['lastmod']}</lastmod>")
        xml_lines.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{url['priority']}</priority>")
        xml_lines.append('  </url>')
    
    xml_lines.append('</urlset>')
    
    return '\n'.join(xml_lines), len(urls)


def main():
    sitemap_xml, count = generate_sitemap()
    
    # Salva sitemap
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)
    
    print(f"✅ Sitemap generata con {count} URL")
    print(f"📄 File: sitemap.xml")
    print(f"🌐 Dominio: {DOMAIN}")
    
    # Statistiche per priorità
    with open('sitemap.xml', 'r') as f:
        content = f.read()
    
    print("\n📊 Distribuzione priorità:")
    for p in ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5']:
        c = content.count(f'<priority>{p}</priority>')
        if c > 0:
            print(f"   Priority {p}: {c} pagine")
    
    # Statistiche per directory
    print("\n📁 Distribuzione per directory:")
    dirs_count = {
        'pages/': content.count('/pages/'),
        'equipe/': content.count('/equipe/'),
        'laboratorio/': content.count('/laboratorio/'),
        'root': 2,  # index.html + listino
    }
    for d, c in dirs_count.items():
        if c > 0:
            print(f"   {d}: {c} pagine")


if __name__ == '__main__':
    main()
