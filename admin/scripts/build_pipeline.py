#!/usr/bin/env python3
"""
Bio-Clinic Build Pipeline — DB → Static Site JSON Export
=========================================================

Phase 3 automation: generates all static JSON data files from the database
(or from seed data when running offline). This is the core build pipeline
that connects the Admin Panel to the live static site.

Usage:
  python3 admin/scripts/build_pipeline.py export       # Generate all JSON files
  python3 admin/scripts/build_pipeline.py search       # Rebuild search index only
  python3 admin/scripts/build_pipeline.py validate     # Validate generated files
  python3 admin/scripts/build_pipeline.py status       # Show current data status
  python3 admin/scripts/build_pipeline.py full         # Full pipeline: export + search + validate

Data flow:
  Supabase DB (or seed SQL) → Python export → site/data/**/*.json → Cloudflare Pages deploy

@version 1.0.0
@date 2026-02-28
"""

import json
import os
import sys
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SITE_DIR = PROJECT_ROOT / 'site'
DATA_DIR = SITE_DIR / 'data'
ENTITIES_DIR = DATA_DIR / 'entities'
SEARCH_DIR = DATA_DIR / 'search'

# Source files for offline mode (when DB is not available)
SEED_SQL = SCRIPT_DIR.parent / 'supabase' / 'migrations' / '003_seed_data.sql'

# Output files
OUTPUT_FILES = {
    'specialties': ENTITIES_DIR / 'specialties.json',
    'physicians': ENTITIES_DIR / 'physicians.json',
    'physicians_complete': ENTITIES_DIR / 'physicians-complete.json',
    'physicians_extended': ENTITIES_DIR / 'physicians-extended.json',
    'procedures': ENTITIES_DIR / 'procedures.json',
    'tests': ENTITIES_DIR / 'tests.json',
    'packs': ENTITIES_DIR / 'packs.json',
    'pathways': ENTITIES_DIR / 'pathways.json',
    'listino': DATA_DIR / 'listino-processed.json',
    'unified': DATA_DIR / 'unified-entities.json',
    'search_index': SEARCH_DIR / 'index.json',
    'medici_legacy': DATA_DIR / 'medici.json',
}

NOW = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
VERSION = '3.0'  # Build pipeline version

# ============================================================================
# DATA LOADING
# ============================================================================

def load_current_data():
    """Load current entity data from existing JSON files (offline mode)."""
    data = {}

    # Specialties
    sp = _load_json(ENTITIES_DIR / 'specialties.json')
    data['specialties'] = sp.get('specialties', []) if isinstance(sp, dict) else sp

    # Physicians (complete is the authoritative source)
    ph = _load_json(ENTITIES_DIR / 'physicians-complete.json')
    data['physicians'] = ph.get('physicians', []) if isinstance(ph, dict) else ph

    # Procedures
    pr = _load_json(ENTITIES_DIR / 'procedures.json')
    data['procedures'] = pr.get('procedures', []) if isinstance(pr, dict) else pr

    # Tests (structured)
    ts = _load_json(ENTITIES_DIR / 'tests.json')
    data['tests'] = ts.get('tests', []) if isinstance(ts, dict) else ts

    # Lab tests (full listino)
    lt = _load_json(DATA_DIR / 'listino-processed.json')
    data['lab_tests'] = lt if isinstance(lt, list) else []

    # Packs
    pk = _load_json(ENTITIES_DIR / 'packs.json')
    data['packs'] = pk.get('packs', []) if isinstance(pk, dict) else pk

    # Pathways
    pw = _load_json(ENTITIES_DIR / 'pathways.json')
    data['pathways'] = pw.get('pathways', []) if isinstance(pw, dict) else pw

    return data


def _load_json(path):
    """Safely load a JSON file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f'  [WARN] Cannot load {path}: {e}')
        return {}


# ============================================================================
# EXPORT: Generate all JSON data files
# ============================================================================

def cmd_export():
    """Generate all entity JSON files from current data."""
    print('=' * 60)
    print('BUILD PIPELINE — Export JSON Data Files')
    print(f'Date: {NOW}')
    print('=' * 60)

    data = load_current_data()
    results = {}

    # 1. Specialties
    results['specialties'] = export_specialties(data)

    # 2. Physicians (3 variants)
    results['physicians'] = export_physicians(data)

    # 3. Procedures
    results['procedures'] = export_procedures(data)

    # 4. Tests (structured subset)
    results['tests'] = export_tests(data)

    # 5. Packs
    results['packs'] = export_packs(data)

    # 6. Pathways
    results['pathways'] = export_pathways(data)

    # 7. Unified entities
    results['unified'] = export_unified(data)

    # 8. Legacy medici.json
    results['medici_legacy'] = export_medici_legacy(data)

    print()
    print('EXPORT SUMMARY')
    print('-' * 40)
    total_records = 0
    total_size = 0
    for name, info in results.items():
        print(f'  {name:25s} {info["count"]:5d} records  {info["size"]:8.1f} KB')
        total_records += info['count']
        total_size += info['size']
    print(f'  {"TOTAL":25s} {total_records:5d} records  {total_size:8.1f} KB')
    print()

    return results


def export_specialties(data):
    """Export specialties.json."""
    specs = data['specialties']

    # Enrich with counts from other entities
    physicians = data.get('physicians', [])
    procedures = data.get('procedures', [])
    tests = data.get('tests', [])

    for s in specs:
        sid = s.get('id', s.get('slug', ''))
        s['procedures_count'] = sum(1 for p in procedures if p.get('specialty_id') == sid)
        s['physicians_count'] = sum(1 for p in physicians if p.get('specialty_id') == sid)
        # tests_count stays from original data if available

    output = {
        'version': VERSION,
        'generated': NOW,
        'total': len(specs),
        'specialties': specs,
    }

    return _write_json(OUTPUT_FILES['specialties'], output, len(specs))


def export_physicians(data):
    """Export all 3 physician JSON variants."""
    physicians = data['physicians']
    total = 0

    # 1. physicians-complete.json (full data)
    complete = {
        'version': VERSION,
        'generated': NOW,
        'total': len(physicians),
        'physicians': physicians,
    }
    info1 = _write_json(OUTPUT_FILES['physicians_complete'], complete, len(physicians))
    total += info1['count']

    # 2. physicians.json (lightweight: id, name, specialty, job_title)
    light = []
    for p in physicians:
        light.append({
            'id': p.get('id', ''),
            'slug': p.get('slug', p.get('id', '')),
            'title': p.get('title', 'Dott.'),
            'name': p.get('name', p.get('full_name', '')),
            'specialty_id': p.get('specialty_id', ''),
            'job_title': p.get('job_title', ''),
            'photo_url': p.get('photo_url', None),
            'booking_enabled': p.get('booking_enabled', True),
        })

    light_output = {
        'version': VERSION,
        'generated': NOW,
        'total': len(light),
        'physicians': light,
    }
    _write_json(OUTPUT_FILES['physicians'], light_output, len(light))

    # 3. physicians-extended.json (mid-level: + bio, procedures, pathways)
    extended = []
    for p in physicians:
        extended.append({
            'id': p.get('id', ''),
            'slug': p.get('slug', p.get('id', '')),
            'title': p.get('title', 'Dott.'),
            'name': p.get('name', p.get('full_name', '')),
            'specialty_id': p.get('specialty_id', ''),
            'job_title': p.get('job_title', ''),
            'bio': p.get('bio', p.get('bio_short', '')),
            'photo_url': p.get('photo_url', None),
            'booking_enabled': p.get('booking_enabled', True),
            'miodottore_url': p.get('miodottore_url', ''),
            'procedures': p.get('procedures', []),
            'pathways': p.get('pathways', []),
        })

    ext_output = {
        'version': VERSION,
        'generated': NOW,
        'total': len(extended),
        'physicians': extended,
    }
    _write_json(OUTPUT_FILES['physicians_extended'], ext_output, len(extended))

    return {'count': total, 'size': info1['size']}


def export_procedures(data):
    """Export procedures.json."""
    procedures = data['procedures']

    # Build categories
    categories = sorted(set(p.get('category', 'visita') for p in procedures))

    output = {
        'version': VERSION,
        'last_updated': NOW,
        'total_procedures': len(procedures),
        'procedures': procedures,
        'categories': categories,
    }

    return _write_json(OUTPUT_FILES['procedures'], output, len(procedures))


def export_tests(data):
    """Export tests.json (structured subset of lab tests)."""
    tests = data['tests']

    output = {
        'version': VERSION,
        'last_updated': NOW,
        'total_tests': len(tests),
        'note': 'Structured tests with clinical details. Full listino in listino-processed.json.',
        'tests': tests,
    }

    return _write_json(OUTPUT_FILES['tests'], output, len(tests))


def export_packs(data):
    """Export packs.json."""
    packs = data['packs']
    categories = sorted(set(p.get('category', 'checkup') for p in packs))

    output = {
        'version': VERSION,
        'last_updated': NOW,
        'total_packs': len(packs),
        'packs': packs,
        'categories': categories,
    }

    return _write_json(OUTPUT_FILES['packs'], output, len(packs))


def export_pathways(data):
    """Export pathways.json."""
    pathways = data['pathways']

    output = {
        'version': VERSION,
        'generated': NOW,
        'total': len(pathways),
        'pathways': pathways,
    }

    return _write_json(OUTPUT_FILES['pathways'], output, len(pathways))


def export_unified(data):
    """Export unified-entities.json (combined index for site-wide features)."""
    entities = []

    # Specialties
    for s in data.get('specialties', []):
        entities.append({
            'type': 'specialty',
            'id': s.get('id', ''),
            'name': s.get('name', ''),
            'slug': s.get('slug', s.get('id', '')),
            'url': f'/{s.get("slug", s.get("id", ""))}/',
            'description': s.get('description', s.get('description_short', '')),
            'icon': s.get('icon', ''),
        })

    # Physicians
    for p in data.get('physicians', []):
        entities.append({
            'type': 'physician',
            'id': p.get('id', ''),
            'name': p.get('name', p.get('full_name', '')),
            'slug': p.get('slug', p.get('id', '')),
            'url': f'/equipe/{p.get("slug", p.get("id", ""))}/',
            'specialty': p.get('specialty_id', ''),
            'title': p.get('title', 'Dott.'),
        })

    # Procedures
    for pr in data.get('procedures', []):
        spec = pr.get('specialty_id', '')
        entities.append({
            'type': 'procedure',
            'id': pr.get('id', ''),
            'name': pr.get('name', ''),
            'slug': pr.get('slug', pr.get('id', '')),
            'url': f'/{spec}/{pr.get("slug", pr.get("id", ""))}/' if spec else f'/{pr.get("slug", pr.get("id", ""))}/',
            'specialty': spec,
            'category': pr.get('category', ''),
        })

    # Packs
    for pk in data.get('packs', []):
        entities.append({
            'type': 'pack',
            'id': pk.get('id', ''),
            'name': pk.get('name', ''),
            'slug': pk.get('slug', pk.get('id', '')),
            'url': f'/checkup/{pk.get("slug", pk.get("id", ""))}/',
            'category': pk.get('category', 'checkup'),
        })

    # Pathways
    for pw in data.get('pathways', []):
        entities.append({
            'type': 'pathway',
            'id': pw.get('id', ''),
            'name': pw.get('name', ''),
            'slug': pw.get('slug', pw.get('id', '')),
            'url': f'/{pw.get("slug", pw.get("id", ""))}/',
            'is_flagship': pw.get('is_flagship', False),
        })

    output = {
        'version': VERSION,
        'generated': NOW,
        'total': len(entities),
        'entities': entities,
    }

    return _write_json(OUTPUT_FILES['unified'], output, len(entities))


def export_medici_legacy(data):
    """Export medici.json (legacy format for backward compatibility)."""
    physicians = data.get('physicians', [])
    legacy = []

    for p in physicians:
        legacy.append({
            'id': p.get('id', ''),
            'nome': p.get('name', p.get('full_name', '')),
            'titolo': p.get('title', 'Dott.'),
            'specialita': p.get('specialty_id', ''),
            'ruolo': p.get('job_title', ''),
            'prenotazione': p.get('booking_enabled', True),
            'miodottore': p.get('miodottore_url', ''),
            'foto': p.get('photo_url', None),
        })

    return _write_json(OUTPUT_FILES['medici_legacy'], legacy, len(legacy))


# ============================================================================
# SEARCH INDEX BUILDER
# ============================================================================

def cmd_search():
    """Rebuild the search index from entity data."""
    print('=' * 60)
    print('BUILD PIPELINE — Search Index Rebuild')
    print(f'Date: {NOW}')
    print('=' * 60)

    data = load_current_data()
    return build_search_index(data)


def build_search_index(data):
    """Build site/data/search/index.json from entity data."""
    terms = {}
    aliases = {}
    stats = defaultdict(int)

    def add_term(term, entity_type, entity_id, priority=None, uplink=None):
        """Add a term to the search index."""
        term = term.lower().strip()
        if not term or len(term) < 2:
            return
        if term not in terms:
            terms[term] = {}
        if entity_type not in terms[term]:
            terms[term][entity_type] = []
        if entity_id not in terms[term][entity_type]:
            terms[term][entity_type].append(entity_id)
        if priority:
            terms[term]['priority'] = priority
        if uplink:
            terms[term]['uplink'] = uplink

    # --- Index specialties ---
    for s in data.get('specialties', []):
        sid = s.get('id', '')
        name = s.get('name', '')
        add_term(name, 'specialties', sid)
        # Split compound names
        for word in name.split():
            if len(word) > 3:
                add_term(word, 'specialties', sid)
        stats['specialties'] += 1

    # --- Index physicians ---
    for p in data.get('physicians', []):
        pid = p.get('id', '')
        name = p.get('name', p.get('full_name', ''))
        for part in name.split():
            if len(part) > 2:
                add_term(part, 'physicians', pid)
        # Index by specialty
        spec = p.get('specialty_id', '')
        if spec:
            add_term(spec, 'physicians', pid)
        stats['physicians'] += 1

    # --- Index procedures ---
    for pr in data.get('procedures', []):
        prid = pr.get('id', '')
        name = pr.get('name', '')
        add_term(name, 'procedures', prid)
        for word in name.split():
            if len(word) > 3:
                add_term(word, 'procedures', prid)
        # Keywords / indications
        for kw in pr.get('symptom_keywords', pr.get('indications', [])):
            if isinstance(kw, str):
                add_term(kw, 'procedures', prid)
        stats['procedures'] += 1

    # --- Index tests ---
    for t in data.get('tests', []):
        tid = t.get('id', '')
        name = t.get('name', '')
        add_term(name, 'tests', tid)
        for word in name.split():
            if len(word) > 3:
                add_term(word, 'tests', tid)
        # Aliases
        for alias in t.get('aliases', []):
            if isinstance(alias, str):
                add_term(alias, 'tests', tid)
                aliases[alias.lower()] = tid
        stats['tests'] += 1

    # --- Index packs ---
    for pk in data.get('packs', []):
        pkid = pk.get('id', '')
        name = pk.get('name', '')
        add_term(name, 'packs', pkid)
        for word in name.split():
            if len(word) > 3:
                add_term(word, 'packs', pkid)
        # Include tests in pack → add uplink
        for test_id in pk.get('includes', {}).get('tests', []):
            if isinstance(test_id, str):
                add_term(test_id, 'packs', pkid, uplink={
                    'type': 'pack',
                    'id': pkid,
                    'message': f'Questo esame e incluso nel {name}',
                })
        stats['packs'] += 1

    # --- Index pathways ---
    for pw in data.get('pathways', []):
        pwid = pw.get('id', '')
        name = pw.get('name', '')
        add_term(name, 'pathways', pwid)
        for word in name.split():
            if len(word) > 3:
                add_term(word, 'pathways', pwid)
        for kw in pw.get('symptom_keywords', []):
            if isinstance(kw, str):
                add_term(kw, 'pathways', pwid)
        stats['pathways'] += 1

    # Build output
    output = {
        'version': VERSION,
        'generated': NOW,
        'description': 'Search index for bio-clinic.it — auto-generated by build_pipeline.py',
        'stats': {
            'total_terms': len(terms),
            **dict(stats),
        },
        'terms': dict(sorted(terms.items())),
        'aliases': dict(sorted(aliases.items())),
        'physicians': [],  # Reserved for physician-specific search features
    }

    info = _write_json(OUTPUT_FILES['search_index'], output, len(terms))
    print(f'\n  Search index: {len(terms)} terms, {len(aliases)} aliases')
    print(f'  Stats: {dict(stats)}')

    # Also update synonyms.json
    synonyms_path = SEARCH_DIR / 'synonyms.json'
    existing_synonyms = _load_json(synonyms_path)
    if isinstance(existing_synonyms, dict) and existing_synonyms:
        # Keep existing synonyms, just update version
        existing_synonyms['version'] = VERSION
        existing_synonyms['updated'] = NOW
        _write_json(synonyms_path, existing_synonyms, len(existing_synonyms.get('mappings', {})))

    return info


# ============================================================================
# VALIDATION
# ============================================================================

def cmd_validate():
    """Validate all generated data files."""
    print('=' * 60)
    print('BUILD PIPELINE — Validation')
    print(f'Date: {NOW}')
    print('=' * 60)

    data = load_current_data()
    errors = []
    warnings = []

    # CHECK 1: File existence and parse-ability
    print('\nCHECK 1: File existence and validity')
    for name, path in OUTPUT_FILES.items():
        if path.exists():
            try:
                with open(path, 'r') as f:
                    json.load(f)
                print(f'  [OK] {name}: {path.name} ({path.stat().st_size / 1024:.1f} KB)')
            except json.JSONDecodeError as e:
                errors.append(f'{name}: invalid JSON — {e}')
                print(f'  [ERR] {name}: invalid JSON')
        else:
            warnings.append(f'{name}: file not found at {path}')
            print(f'  [WARN] {name}: not found')

    # CHECK 2: Record counts
    print('\nCHECK 2: Record counts')
    counts = {
        'specialties': len(data.get('specialties', [])),
        'physicians': len(data.get('physicians', [])),
        'procedures': len(data.get('procedures', [])),
        'tests': len(data.get('tests', [])),
        'lab_tests': len(data.get('lab_tests', [])),
        'packs': len(data.get('packs', [])),
        'pathways': len(data.get('pathways', [])),
    }
    for name, count in counts.items():
        status = '[OK]' if count > 0 else '[WARN]'
        if count == 0:
            warnings.append(f'{name}: 0 records')
        print(f'  {status} {name}: {count} records')

    # CHECK 3: Referential integrity
    print('\nCHECK 3: Referential integrity')
    spec_ids = {s.get('id', '') for s in data.get('specialties', [])}
    for p in data.get('physicians', []):
        sid = p.get('specialty_id', '')
        if sid and sid not in spec_ids:
            warnings.append(f'Physician {p.get("id", "?")}: specialty_id "{sid}" not in specialties')
    for pr in data.get('procedures', []):
        sid = pr.get('specialty_id', '')
        if sid and sid not in spec_ids:
            warnings.append(f'Procedure {pr.get("id", "?")}: specialty_id "{sid}" not in specialties')
    print(f'  Specialty IDs: {len(spec_ids)}')
    orphan_physicians = [p.get('id', '?') for p in data.get('physicians', []) if p.get('specialty_id', '') not in spec_ids]
    orphan_procedures = [p.get('id', '?') for p in data.get('procedures', []) if p.get('specialty_id', '') not in spec_ids]
    print(f'  Orphan physicians (no valid specialty): {len(orphan_physicians)}')
    print(f'  Orphan procedures (no valid specialty): {len(orphan_procedures)}')

    # CHECK 4: Unique IDs
    print('\nCHECK 4: Unique IDs')
    for entity_name in ['specialties', 'physicians', 'procedures', 'packs', 'pathways']:
        items = data.get(entity_name, [])
        ids = [i.get('id', '') for i in items]
        dupes = [x for x in set(ids) if ids.count(x) > 1]
        if dupes:
            errors.append(f'{entity_name}: duplicate IDs — {dupes}')
            print(f'  [ERR] {entity_name}: {len(dupes)} duplicates')
        else:
            print(f'  [OK] {entity_name}: {len(ids)} unique IDs')

    # CHECK 5: Search index
    print('\nCHECK 5: Search index')
    search_data = _load_json(OUTPUT_FILES['search_index'])
    if isinstance(search_data, dict):
        term_count = len(search_data.get('terms', {}))
        print(f'  Terms: {term_count}')
        if term_count == 0:
            warnings.append('Search index has 0 terms')
        # Test search for key terms
        test_terms = ['tiroide', 'ginecologia', 'cardiologia', 'emocromo', 'ecografia']
        for tt in test_terms:
            found = tt in search_data.get('terms', {})
            print(f'    Search "{tt}": {"found" if found else "NOT found"}')
            if not found:
                warnings.append(f'Search index missing key term: {tt}')
    else:
        errors.append('Search index not valid')

    # Summary
    print()
    print('VALIDATION SUMMARY')
    print('-' * 40)
    print(f'  Errors:   {len(errors)}')
    print(f'  Warnings: {len(warnings)}')
    if errors:
        print('\n  ERRORS:')
        for e in errors:
            print(f'    - {e}')
    if warnings:
        print('\n  WARNINGS:')
        for w in warnings[:10]:
            print(f'    - {w}')
        if len(warnings) > 10:
            print(f'    ... and {len(warnings) - 10} more')

    return len(errors) == 0


# ============================================================================
# STATUS
# ============================================================================

def cmd_status():
    """Show current data file status."""
    print('=' * 60)
    print('BUILD PIPELINE — Status')
    print(f'Date: {NOW}')
    print('=' * 60)

    print(f'\nProject root: {PROJECT_ROOT}')
    print(f'Site dir:     {SITE_DIR}')
    print(f'Data dir:     {DATA_DIR}')
    print()

    total_size = 0
    for name, path in OUTPUT_FILES.items():
        if path.exists():
            sz = path.stat().st_size / 1024
            mtime = datetime.fromtimestamp(path.stat().st_mtime).strftime('%Y-%m-%d %H:%M')
            h = _file_hash(path)
            print(f'  {name:25s}  {sz:8.1f} KB  {mtime}  {h[:8]}')
            total_size += sz
        else:
            print(f'  {name:25s}  NOT FOUND')

    print(f'\n  Total data: {total_size:.1f} KB')

    # Count HTML pages
    html_count = sum(1 for _ in SITE_DIR.rglob('*.html'))
    print(f'  HTML pages: {html_count}')


# ============================================================================
# FULL PIPELINE
# ============================================================================

def cmd_full():
    """Run full pipeline: export + search + schema.org + validate."""
    print('\n' + '=' * 60)
    print('FULL BUILD PIPELINE')
    print('=' * 60 + '\n')

    # Step 1: Export
    print('[1/4] Exporting JSON data files...')
    results = cmd_export()

    # Step 2: Rebuild search
    print('\n[2/4] Rebuilding search index...')
    data = load_current_data()
    build_search_index(data)

    # Step 3: Schema.org JSON-LD
    print('\n[3/4] Updating Schema.org JSON-LD...')
    schema_count = cmd_schema_org()

    # Step 4: Validate
    print('\n[4/4] Validating...')
    valid = cmd_validate()

    print('\n' + '=' * 60)
    print(f'PIPELINE {"COMPLETE" if valid else "COMPLETE WITH WARNINGS"}')
    print(f'  Schema.org pages updated: {schema_count}')
    print('=' * 60)

    return valid


# ============================================================================
# SCHEMA.ORG JSON-LD GENERATOR (Phase 3.3)
# ============================================================================

def cmd_schema_org():
    """Update JSON-LD Schema.org in all HTML pages from current data."""
    import re

    data = load_current_data()
    specialties = {s['id']: s for s in data.get('specialties', [])}
    physicians = data.get('physicians_complete', data.get('physicians', []))
    procedures = data.get('procedures', [])

    # Base organization JSON-LD
    org_jsonld = {
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "@id": "https://bio-clinic.it/#organization",
        "name": "Bio-Clinic Sassari",
        "alternateName": "Bio-Clinic",
        "url": "https://bio-clinic.it",
        "logo": "https://bio-clinic.it/images/logo-bioclinic.png",
        "description": "Centro medico polispecialistico e laboratorio analisi a Sassari. Specialisti, ecografie, esami del sangue.",
        "telephone": "+39 079 956 1332",
        "email": "info@bio-clinic.it",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Via Tempio, 26/28",
            "addressLocality": "Sassari",
            "addressRegion": "SS",
            "postalCode": "07100",
            "addressCountry": "IT"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 40.7267,
            "longitude": 8.5592
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "07:30",
                "closes": "19:30"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "07:30",
                "closes": "13:00"
            }
        ],
        "priceRange": "\u20ac\u20ac",
        "currenciesAccepted": "EUR",
        "paymentAccepted": "Cash, Credit Card, Debit Card",
        "dateModified": datetime.now(timezone.utc).strftime('%Y-%m-%d')
    }

    # Add specialties list
    if specialties:
        org_jsonld["medicalSpecialty"] = [
            {"@type": "MedicalSpecialty", "name": s.get("name", "")}
            for s in specialties.values()
        ]

    updated = 0
    skipped = 0
    ld_pattern = re.compile(
        r'<script\s+type="application/ld\+json"[^>]*>\s*(\{.*?\})\s*</script>',
        re.DOTALL
    )

    for html_file in SITE_DIR.rglob('*.html'):
        # Skip admin pages
        if 'admin' in str(html_file):
            continue

        try:
            content = html_file.read_text(encoding='utf-8')

            # Check if page has existing JSON-LD
            match = ld_pattern.search(content)
            if not match:
                skipped += 1
                continue

            # Parse existing JSON-LD
            try:
                existing = json.loads(match.group(1))
            except json.JSONDecodeError:
                skipped += 1
                continue

            # Determine page type and update accordingly
            rel_path = str(html_file.relative_to(SITE_DIR))
            page_jsonld = _generate_page_jsonld(
                existing, org_jsonld, rel_path,
                specialties, physicians, procedures
            )

            if page_jsonld:
                new_ld = f'<script type="application/ld+json">\n{json.dumps(page_jsonld, ensure_ascii=False, indent=2)}\n</script>'
                new_content = ld_pattern.sub(new_ld, content, count=1)

                if new_content != content:
                    html_file.write_text(new_content, encoding='utf-8')
                    updated += 1
            else:
                skipped += 1

        except Exception as e:
            print(f'  [SKIP] {html_file.relative_to(SITE_DIR)}: {e}')
            skipped += 1

    print(f'  Schema.org: {updated} pages updated, {skipped} skipped')
    return updated


def _generate_page_jsonld(existing, org_jsonld, rel_path, specialties, physicians, procedures):
    """Generate appropriate JSON-LD for a given page based on its type/path."""

    # Always update dateModified
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    # Homepage
    if rel_path in ('index.html',):
        existing['dateModified'] = today
        if specialties:
            existing['medicalSpecialty'] = [
                {"@type": "MedicalSpecialty", "name": s.get("name", "")}
                for s in specialties.values()
            ]
        return existing

    # Specialty pages (e.g., cardiologia/index.html)
    parts = rel_path.split('/')
    if len(parts) >= 2 and parts[0] in specialties:
        spec = specialties[parts[0]]
        existing['dateModified'] = today
        if 'name' in spec:
            existing['name'] = spec.get('name_extended', spec['name'])
        return existing

    # Physician pages (e.g., equipe/salvatore-dessole/index.html)
    if parts[0] == 'equipe' and len(parts) >= 3:
        phys_slug = parts[1]
        physician = next((p for p in physicians if p.get('slug') == phys_slug or p.get('id') == phys_slug), None)
        if physician:
            existing['dateModified'] = today
            name = physician.get('full_name') or physician.get('display_name') or ''
            if name:
                existing['name'] = name
            if physician.get('job_title'):
                existing['jobTitle'] = physician['job_title']
        return existing

    # For all other pages, just update dateModified
    existing['dateModified'] = today
    return existing


# ============================================================================
# UTILITIES
# ============================================================================

def _write_json(path, data, count):
    """Write JSON file and return metadata."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size = path.stat().st_size / 1024
    print(f'  [WRITE] {path.relative_to(PROJECT_ROOT)} ({count} records, {size:.1f} KB)')
    return {'count': count, 'size': size, 'path': str(path)}


def _file_hash(path):
    """Get short MD5 hash of a file."""
    h = hashlib.md5()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()


# ============================================================================
# MAIN
# ============================================================================

COMMANDS = {
    'export': cmd_export,
    'search': cmd_search,
    'validate': cmd_validate,
    'status': cmd_status,
    'schema': cmd_schema_org,
    'full': cmd_full,
}

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(f'Usage: {sys.argv[0]} <command>')
        print(f'Commands: {", ".join(COMMANDS.keys())}')
        sys.exit(1)

    cmd = sys.argv[1]
    result = COMMANDS[cmd]()

    if cmd == 'validate' and not result:
        sys.exit(1)


if __name__ == '__main__':
    main()
