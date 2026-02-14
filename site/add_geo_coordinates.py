#!/usr/bin/env python3
"""
Bio-Clinic: Aggiungi GeoCoordinates a tutte le pagine con schema address
"""

import os
import re

# Bio-Clinic Sassari coordinates
GEO_BLOCK = '''
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 40.7267,
            "longitude": 8.5592
          },'''


def process_file(filepath):
    """Aggiunge geo coordinates dopo address se non presenti"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip se già ha GeoCoordinates
    if 'GeoCoordinates' in content or '"geo"' in content:
        return False, "already has geo"
    
    # Skip se non ha address con IT
    if '"addressCountry": "IT"' not in content:
        return False, "no address block"
    
    # Pattern: cerca la fine del blocco address (dopo addressCountry: IT e })
    # e aggiungi geo subito dopo
    pattern = r'("addressCountry"\s*:\s*"IT"\s*\n\s*})'
    
    replacement = r'\1,' + GEO_BLOCK
    
    new_content, count = re.subn(pattern, replacement, content, count=1)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True, "geo added"
    
    return False, "pattern not matched"


def main():
    pages_dir = 'pages'
    updated = []
    skipped = []
    
    for filename in sorted(os.listdir(pages_dir)):
        if not filename.endswith('.html'):
            continue
        
        filepath = os.path.join(pages_dir, filename)
        success, reason = process_file(filepath)
        
        if success:
            updated.append(filename)
            print(f"✅ {filename}")
        else:
            skipped.append((filename, reason))
    
    print(f"\n📊 Risultato GeoCoordinates:")
    print(f"   ✅ Aggiornate: {len(updated)} pagine")
    print(f"   ⏭️  Saltate: {len(skipped)} pagine")
    
    # Conta per motivo
    reasons = {}
    for f, r in skipped:
        reasons[r] = reasons.get(r, 0) + 1
    print(f"\n📝 Saltate:")
    for r, c in reasons.items():
        print(f"   - {r}: {c}")


if __name__ == '__main__':
    main()
