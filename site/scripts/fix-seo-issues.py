#!/usr/bin/env python3
"""
Script per correggere automaticamente i problemi SEO identificati
"""

import re
import json
from pathlib import Path
from urllib.parse import quote

def fix_meta_tags(file_path):
    """Corregge meta tag SEO"""
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    modified = False
    
    # Estrai nome pagina per canonical
    rel_path = str(file_path)
    if 'equipe/' in rel_path:
        slug = file_path.stem
        canonical = f"https://bio-clinic.it/equipe/{slug}/"
    elif 'pages/' in rel_path:
        slug = file_path.stem
        canonical = f"https://bio-clinic.it/{slug}/"
    else:
        canonical = "https://bio-clinic.it/"
    
    # Aggiungi canonical se manca
    if 'rel="canonical"' not in content and "rel='canonical'" not in content:
        canonical_tag = f'<link rel="canonical" href="{canonical}">'
        content = content.replace('</head>', f'    {canonical_tag}\n</head>')
        modified = True
    
    # Estrai e correggi title
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
    if title_match:
        title = title_match.group(1)
        if len(title) > 65:
            # Accorcia il title mantenendo il significato
            new_title = title[:60] + "..."
            if " | Bio-Clinic" in title:
                base = title.split(" | Bio-Clinic")[0][:50]
                new_title = f"{base} | Bio-Clinic"
            content = content.replace(f'<title>{title}</title>', f'<title>{new_title}</title>')
            modified = True
    
    # Estrai e correggi meta description
    desc_patterns = [
        (r'(<meta[^>]*name=["\']description["\'][^>]*content=["\'])([^"\']+)(["\'][^>]*>)', 2),
        (r'(<meta[^>]*content=["\'])([^"\']+)(["\'][^>]*name=["\']description["\'][^>]*>)', 2)
    ]
    
    for pattern, group_idx in desc_patterns:
        desc_match = re.search(pattern, content, re.IGNORECASE)
        if desc_match:
            desc = desc_match.group(group_idx)
            if len(desc) > 160:
                # Tronca a 155 caratteri + "..."
                new_desc = desc[:155] + "..."
                old_tag = desc_match.group(0)
                new_tag = old_tag.replace(desc, new_desc)
                content = content.replace(old_tag, new_tag)
                modified = True
            break
    
    # Aggiungi Open Graph se manca
    og_tags_to_add = []
    
    if 'og:title' not in content:
        if title_match:
            og_tags_to_add.append(f'<meta property="og:title" content="{title_match.group(1)[:60]}">')
    
    if 'og:description' not in content:
        for pattern, group_idx in desc_patterns:
            desc_match = re.search(pattern, content, re.IGNORECASE)
            if desc_match:
                og_tags_to_add.append(f'<meta property="og:description" content="{desc_match.group(group_idx)[:155]}">')
                break
    
    if 'og:type' not in content:
        og_tags_to_add.append('<meta property="og:type" content="website">')
    
    if 'og:url' not in content:
        og_tags_to_add.append(f'<meta property="og:url" content="{canonical}">')
    
    if 'og:site_name' not in content:
        og_tags_to_add.append('<meta property="og:site_name" content="Bio-Clinic Sassari">')
    
    if og_tags_to_add:
        og_block = '\n    '.join(og_tags_to_add)
        content = content.replace('</head>', f'    <!-- Open Graph -->\n    {og_block}\n</head>')
        modified = True
    
    if modified:
        file_path.write_text(content, encoding='utf-8')
    
    return modified

def fix_schema_json_ld(file_path):
    """Corregge JSON-LD invalido"""
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    modified = False
    
    # Trova tutti i blocchi JSON-LD
    pattern = r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)'
    
    def fix_json(match):
        nonlocal modified
        prefix, json_str, suffix = match.groups()
        
        # Prova a parsare e correggere
        try:
            # Fix comuni: virgole extra, quote mancanti
            json_str = re.sub(r',\s*}', '}', json_str)  # Rimuovi virgole trailing
            json_str = re.sub(r',\s*]', ']', json_str)  # Rimuovi virgole trailing in array
            json_str = re.sub(r'"\s*,\s*"', '","', json_str)  # Normalizza spacing
            
            data = json.loads(json_str)
            
            # Pulisci i dati
            clean_json = json.dumps(data, ensure_ascii=False, indent=2)
            modified = True
            return f'{prefix}\n{clean_json}\n{suffix}'
            
        except json.JSONDecodeError:
            # Se non riesce, lascia com'è
            return match.group(0)
    
    new_content = re.sub(pattern, fix_json, content, flags=re.DOTALL | re.IGNORECASE)
    
    if modified:
        file_path.write_text(new_content, encoding='utf-8')
    
    return modified

def add_missing_schema(file_path):
    """Aggiunge Schema.org mancante per pagine specifiche"""
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    
    if 'application/ld+json' in content:
        return False
    
    filename = file_path.stem
    
    # Schema per pagine specifiche
    schemas = {
        "privacy": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy - Bio-Clinic Sassari",
            "description": "Informativa sulla privacy di Bio-Clinic Sassari",
            "url": "https://bio-clinic.it/privacy/"
        },
        "cookie": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Cookie Policy - Bio-Clinic Sassari",
            "description": "Informativa sui cookie di Bio-Clinic Sassari",
            "url": "https://bio-clinic.it/cookie/"
        },
        "checkup-cardiovascolare": {
            "@context": "https://schema.org",
            "@type": "MedicalProcedure",
            "name": "Checkup Cardiovascolare",
            "description": "Checkup cardiovascolare completo presso Bio-Clinic Sassari",
            "procedureType": "https://schema.org/DiagnosticProcedure",
            "howPerformed": "Visita cardiologica, ECG, Ecocardiogramma"
        },
        "checkup-tiroide": {
            "@context": "https://schema.org",
            "@type": "MedicalProcedure",
            "name": "Checkup Tiroide",
            "description": "Checkup tiroideo completo presso Bio-Clinic Sassari",
            "procedureType": "https://schema.org/DiagnosticProcedure",
            "howPerformed": "Visita endocrinologica, Ecografia tiroidea, Esami ematici"
        }
    }
    
    if filename in schemas:
        schema_json = json.dumps(schemas[filename], ensure_ascii=False, indent=2)
        schema_tag = f'<script type="application/ld+json">\n{schema_json}\n</script>'
        content = content.replace('</head>', f'{schema_tag}\n</head>')
        file_path.write_text(content, encoding='utf-8')
        return True
    
    return False

def main():
    print("=" * 60)
    print("🔧 CORREZIONE AUTOMATICA PROBLEMI SEO")
    print("=" * 60)
    
    site_dir = Path(".")
    html_files = list(site_dir.glob('**/*.html'))
    html_files = [f for f in html_files if not any(x in str(f) for x in ['node_modules', '.git', 'reports', 'components', 'templates'])]
    
    meta_fixed = 0
    schema_fixed = 0
    schema_added = 0
    
    for file_path in html_files:
        if fix_meta_tags(file_path):
            meta_fixed += 1
            print(f"✅ Meta fix: {file_path}")
        
        if fix_schema_json_ld(file_path):
            schema_fixed += 1
            print(f"✅ Schema fix: {file_path}")
        
        if add_missing_schema(file_path):
            schema_added += 1
            print(f"✅ Schema added: {file_path}")
    
    print(f"\n{'=' * 60}")
    print(f"📊 RIEPILOGO:")
    print(f"  Meta tag corretti: {meta_fixed}")
    print(f"  Schema JSON-LD corretti: {schema_fixed}")
    print(f"  Schema JSON-LD aggiunti: {schema_added}")
    print("=" * 60)

if __name__ == "__main__":
    main()
