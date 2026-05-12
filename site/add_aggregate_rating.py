#!/usr/bin/env python3
"""
Bio-Clinic: Aggiungi aggregateRating a tutte le pagine con MedicalClinic schema
"""

import os
import re
import json

# Rating Bio-Clinic (da Google Business)
AGGREGATE_RATING = ''',
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "3903",
            "bestRating": "5",
            "worstRating": "1"
          }'''

def process_file(filepath):
    """Aggiunge aggregateRating al MedicalClinic se non presente"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip se già ha aggregateRating
    if 'aggregateRating' in content:
        return False, "already has aggregateRating"
    
    # Skip se non ha MedicalClinic schema
    if '"@type": "MedicalClinic"' not in content and '"@type":"MedicalClinic"' not in content:
        return False, "no MedicalClinic schema"
    
    # Trova il blocco MedicalClinic e aggiungi aggregateRating dopo address
    # Pattern: cerca la chiusura del blocco address dentro MedicalClinic
    # Il pattern cerca: "addressCountry": "IT" seguito da } e poi }
    
    # Pattern più preciso: cerca la fine dell'address block
    patterns = [
        # Pattern 1: addressCountry con chiusura
        (r'("addressCountry"\s*:\s*"IT"\s*\n\s*})', r'\1' + AGGREGATE_RATING),
        # Pattern 2: indirizzo con altre chiusure
        (r'("address"\s*:\s*\{[^}]+\})', lambda m: m.group(1) + AGGREGATE_RATING if 'addressCountry' in m.group(1) else m.group(1)),
    ]
    
    modified = False
    
    # Usa il primo pattern (più comune)
    new_content, count = re.subn(
        r'("addressCountry"\s*:\s*"IT"\s*\n\s*})',
        r'\1' + AGGREGATE_RATING,
        content,
        count=1  # Solo la prima occorrenza (il MedicalClinic)
    )
    
    if count > 0:
        modified = True
        content = new_content
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "aggregateRating added"
    
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
    
    print(f"\n📊 Risultato:")
    print(f"   ✅ Aggiornate: {len(updated)} pagine")
    print(f"   ⏭️  Saltate: {len(skipped)} pagine")
    
    if skipped:
        print(f"\n📝 Saltate per motivo:")
        reasons = {}
        for f, r in skipped:
            reasons[r] = reasons.get(r, 0) + 1
        for r, c in reasons.items():
            print(f"   - {r}: {c}")


if __name__ == '__main__':
    main()
