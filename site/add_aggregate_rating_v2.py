#!/usr/bin/env python3
"""
Bio-Clinic: Aggiungi aggregateRating a pagine che usano formato schema diverso
"""

import os
import re

# Rating Bio-Clinic (da Google Business)
AGGREGATE_RATING_BLOCK = '''
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": "3903",
        "bestRating": "5",
        "worstRating": "1"
      },'''

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
    
    # Cerca il pattern MedicalClinic con availableService
    # Inserisci aggregateRating prima di availableService
    pattern = r'("@type": "MedicalClinic",\s*"@id": "[^"]+",\s*"name": "[^"]+",\s*"medicalSpecialty": "[^"]+")(,?\s*"availableService")'
    
    replacement = r'\1,' + AGGREGATE_RATING_BLOCK.rstrip(',') + r'\2'
    
    new_content, count = re.subn(pattern, replacement, content, count=1)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True, "aggregateRating added (v2 pattern)"
    
    # Prova pattern alternativo - dopo name
    pattern2 = r'("@type": "MedicalClinic",\s*"@id": "[^"]+",\s*"name": "Bio-Clinic Sassari")(,?\s*")'
    
    replacement2 = r'\1,' + '''
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": "3903",
        "bestRating": "5",
        "worstRating": "1"
      }\2'''
    
    new_content2, count2 = re.subn(pattern2, replacement2, content, count=1)
    
    if count2 > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content2)
        return True, "aggregateRating added (v2 alt pattern)"
    
    return False, "pattern not matched"


def main():
    pages_dir = 'pages'
    updated = []
    skipped = []
    
    # Lista delle pagine che sappiamo mancano aggregateRating
    target_pages = [
        'cardiologia.html', 'chi-siamo.html', 'contatti.html', 'convenzioni.html',
        'cookie.html', 'endocrinologia.html', 'laboratorio.html', 'pma-fertilita.html',
        'prevenzione.html', 'privacy.html', 'slim-care.html', 'slim-care-donna.html',
        'specialita.html', 'symptom-checker.html'
    ]
    
    for filename in target_pages:
        filepath = os.path.join(pages_dir, filename)
        if not os.path.exists(filepath):
            continue
            
        success, reason = process_file(filepath)
        
        if success:
            updated.append(filename)
            print(f"✅ {filename}: {reason}")
        else:
            skipped.append((filename, reason))
            print(f"⏭️  {filename}: {reason}")
    
    print(f"\n📊 Risultato v2:")
    print(f"   ✅ Aggiornate: {len(updated)} pagine")
    print(f"   ⏭️  Saltate: {len(skipped)} pagine")


if __name__ == '__main__':
    main()
