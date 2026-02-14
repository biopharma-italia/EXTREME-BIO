#!/usr/bin/env python3
"""Verifica che ogni pagina specialità abbia gli specialisti di riferimento"""

import os
import re
from pathlib import Path

# Pagine principali delle specialità da verificare
specialty_pages = [
    'pages/ginecologia.html',
    'pages/ginecologi-sassari.html',
    'pages/cardiologia.html',
    'pages/endocrinologia.html',
    'pages/dermatologia.html',
    'pages/oculistica.html',
    'pages/ortopedia.html',
    'pages/neurologia.html',
    'pages/urologia.html',
    'pages/otorinolaringoiatria.html',
    'pages/gastroenterologia.html',
    'pages/pneumologia.html',
    'pages/reumatologia.html',
    'pages/ematologia.html',
    'pages/chirurgia-vascolare.html',
    'pages/genetica.html',
    'pages/medicina-lavoro.html',
    'pages/visita-nefrologica.html',
    'pages/pma-fertilita.html',
]

# Pattern per trovare specialisti nelle pagine
specialist_patterns = [
    r'Dott\.?\s+[\w\s]+',
    r'Prof\.?\s+[\w\s]+',
    r'team-card',
    r'doctor-card',
    r'specialist',
]

results = []

for page in specialty_pages:
    if os.path.exists(page):
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Conta gli specialisti menzionati
        doctors = re.findall(r'Dott\.?(?:ssa|or)?\.?\s+(\w+\s+\w+)', content)
        profs = re.findall(r'Prof\.?\s+(?:Emerito\s+)?(\w+\s+\w+)', content)
        
        # Verifica se ha sezione specialisti
        has_team_section = 'team-card' in content.lower() or 'specialisti' in content.lower() or 'doctor-card' in content.lower()
        
        # Rimuovi duplicati
        all_doctors = list(set(doctors + profs))
        
        results.append({
            'page': page,
            'doctors_count': len(all_doctors),
            'doctors': all_doctors[:10],  # Primi 10
            'has_team_section': has_team_section
        })
    else:
        results.append({
            'page': page,
            'doctors_count': 0,
            'doctors': [],
            'has_team_section': False,
            'error': 'File non trovato'
        })

# Output results
print("=" * 80)
print("VERIFICA SPECIALISTI NELLE PAGINE SPECIALITÀ")
print("=" * 80)

for r in results:
    status = "✓" if r['doctors_count'] > 0 and r['has_team_section'] else "⚠"
    print(f"\n{status} {r['page']}")
    if 'error' in r:
        print(f"   ERRORE: {r['error']}")
    else:
        print(f"   Specialisti trovati: {r['doctors_count']}")
        print(f"   Sezione team: {'Sì' if r['has_team_section'] else 'No'}")
        if r['doctors']:
            print(f"   Nomi: {', '.join(r['doctors'][:5])}")

print("\n" + "=" * 80)
