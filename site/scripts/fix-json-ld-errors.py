#!/usr/bin/env python3
"""
Script per correggere errori JSON-LD specifici
"""

import re
import json
from pathlib import Path

def fix_json_ld_in_file(file_path):
    """Corregge JSON-LD corrotti nel file"""
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    modified = False
    
    # Pattern per trovare JSON-LD
    pattern = r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)'
    
    def fix_json(match):
        nonlocal modified
        prefix, json_str, suffix = match.groups()
        
        # Fix comuni
        # 1. Virgole doppie
        json_str = re.sub(r',\s*,', ',', json_str)
        # 2. Virgole prima di }
        json_str = re.sub(r',(\s*})', r'\1', json_str)
        # 3. Virgole prima di ]
        json_str = re.sub(r',(\s*])', r'\1', json_str)
        # 4. datePublished vuoto o malformato
        json_str = re.sub(r'"datePublished":\s*""\s*,?', '', json_str)
        json_str = re.sub(r'"datePublished":\s*,', '', json_str)
        json_str = re.sub(r',\s*"datePublished":\s*[,}]', '', json_str)
        # 5. Rimuovi chiavi vuote
        json_str = re.sub(r'"[^"]+"\s*:\s*""\s*,', '', json_str)
        # 6. Fix virgola dopo URL
        json_str = re.sub(r'(https?://[^"]+",)\s*,', r'\1', json_str)
        
        try:
            data = json.loads(json_str)
            modified = True
            clean_json = json.dumps(data, ensure_ascii=False, indent=2)
            return f'{prefix}\n{clean_json}\n{suffix}'
        except json.JSONDecodeError as e:
            # Tentativo più aggressivo
            # Rimuovi tutti i campi problematici datePublished
            json_str = re.sub(r'"datePublished"[^,}]*[,}]', '', json_str)
            json_str = re.sub(r',\s*,', ',', json_str)
            json_str = re.sub(r',(\s*})', r'\1', json_str)
            json_str = re.sub(r'\{\s*,', '{', json_str)
            
            try:
                data = json.loads(json_str)
                modified = True
                clean_json = json.dumps(data, ensure_ascii=False, indent=2)
                return f'{prefix}\n{clean_json}\n{suffix}'
            except:
                print(f"  ❌ Non riesco a correggere: {file_path.name}")
                return match.group(0)
    
    new_content = re.sub(pattern, fix_json, content, flags=re.DOTALL | re.IGNORECASE)
    
    if modified:
        file_path.write_text(new_content, encoding='utf-8')
        return True
    return False

def main():
    print("=" * 60)
    print("🔧 CORREZIONE JSON-LD CORROTTI")
    print("=" * 60)
    
    equipe_dir = Path("equipe")
    fixed = 0
    
    for file_path in equipe_dir.glob("*.html"):
        if fix_json_ld_in_file(file_path):
            print(f"✅ Corretto: {file_path.name}")
            fixed += 1
    
    print(f"\n📊 File JSON-LD corretti: {fixed}")

if __name__ == "__main__":
    main()
