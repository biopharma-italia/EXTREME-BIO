#!/usr/bin/env python3
"""
Bio-Clinic: JSON → Supabase PostgreSQL Migration Script
========================================================
Reads all entity JSON files from site/data/ and generates
SQL INSERT statements for the admin panel schema.

Usage:
  python3 migrate_json_to_sql.py [--dry-run] [--output FILE]

Outputs: 003_seed_data.sql ready for Supabase migration
"""

import json
import os
import sys
import re
import argparse
from pathlib import Path
from decimal import Decimal

# Paths (relative to bio-clinic root)
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # admin/scripts/ -> bio-clinic/
DATA_DIR = BASE_DIR / "site" / "data"
ENTITIES_DIR = DATA_DIR / "entities"

# ============================================================================
# UTILITIES
# ============================================================================

def sql_escape(val):
    """Escape a string for SQL insertion."""
    if val is None:
        return "NULL"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def sql_text_array(arr):
    """Convert Python list to PostgreSQL TEXT[] literal."""
    if not arr:
        return "'{}'::TEXT[]"
    escaped = [str(v).replace("'", "''").replace('"', '\\"') for v in arr]
    inner = ", ".join(f'"{v}"' for v in escaped)
    return f"'{{{inner}}}'::TEXT[]"

def sql_jsonb(obj):
    """Convert Python dict/list to PostgreSQL JSONB literal."""
    if obj is None:
        return "NULL"
    s = json.dumps(obj, ensure_ascii=False).replace("'", "''")
    return f"'{s}'::JSONB"

def sql_bool(val):
    """Convert Python bool to SQL boolean."""
    if val is None:
        return "NULL"
    return "true" if val else "false"

def sql_number(val):
    """Convert number to SQL."""
    if val is None:
        return "NULL"
    return str(val)

def slugify(text):
    """Create a URL-safe slug from text."""
    text = text.lower().strip()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


# ============================================================================
# LOADERS
# ============================================================================

def load_json(filepath):
    """Load JSON file and return parsed data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_specialties():
    data = load_json(ENTITIES_DIR / "specialties.json")
    return data.get("specialties", [])

def load_physicians():
    # Use complete version if available (50 records), fallback to basic (23)
    complete_path = ENTITIES_DIR / "physicians-complete.json"
    basic_path = ENTITIES_DIR / "physicians.json"
    
    if complete_path.exists():
        data = load_json(complete_path)
        items = data if isinstance(data, list) else data.get("physicians", [])
        print(f"  Loaded {len(items)} physicians from physicians-complete.json")
    else:
        data = load_json(basic_path)
        items = data.get("physicians", [])
        print(f"  Loaded {len(items)} physicians from physicians.json")
    return items

def load_procedures():
    data = load_json(ENTITIES_DIR / "procedures.json")
    return data.get("procedures", [])

def load_tests():
    data = load_json(ENTITIES_DIR / "tests.json")
    return data.get("tests", [])

def load_listino():
    return load_json(DATA_DIR / "listino-processed.json")

def load_packs():
    data = load_json(ENTITIES_DIR / "packs.json")
    return data.get("packs", [])

def load_pathways():
    data = load_json(ENTITIES_DIR / "pathways.json")
    return data.get("pathways", [])


# ============================================================================
# SQL GENERATORS
# ============================================================================

def generate_specialties_sql(specialties):
    """Generate INSERT statements for specialties table."""
    lines = ["-- ============================================",
             "-- Specialties (from specialties.json)",
             "-- ============================================\n"]
    
    for s in specialties:
        # Map fields from JSON to DB columns
        sid = s.get("id")
        name = s.get("name", sid)
        slug = s.get("slug", sid)
        icon = s.get("icon")
        desc_short = s.get("description")
        
        # Extract related data as page_config
        page_config = {}
        for key in ["main_procedures", "main_tests", "physicians", "related_pathways", "keywords"]:
            if key in s and s[key]:
                page_config[key] = s[key]
        
        # Determine visibility from data
        menu_order = s.get("menu_order", specialties.index(s) + 1)
        
        lines.append(f"""INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  {sql_escape(sid)},
  {sql_escape(name)},
  {sql_escape(slug)},
  {sql_escape(icon)},
  {sql_escape(desc_short)},
  {sql_jsonb(page_config)},
  {sql_number(menu_order)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();
""")
    
    return "\n".join(lines)


def generate_physicians_sql(physicians):
    """Generate INSERT statements for physicians table."""
    lines = ["-- ============================================",
             "-- Physicians (from physicians-complete.json)",
             "-- ============================================\n"]
    
    for p in physicians:
        pid = p.get("id")
        title = p.get("title", "Dott.")
        
        # Parse name into first/last
        full_name = p.get("name", "")
        parts = full_name.split(" ", 1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""
        
        specialty_id = p.get("specialty_id", "")
        specialties_sec = p.get("specialties_secondary", [])
        job_title = p.get("job_title")
        role_badge = p.get("role_badge", "")
        role_badges = [role_badge] if role_badge else []
        bio_short = p.get("bio")
        photo_url = p.get("photo_url")
        
        # Booking
        booking_enabled = p.get("booking_enabled", True)
        miodottore_url = p.get("miodottore_url")
        miodottore_id = p.get("miodottore_id")
        widget_html = p.get("widget_html")
        
        # Procedures & pathways (will also be inserted into M:N tables)
        procs = p.get("procedures", [])
        paths = p.get("pathways", [])
        
        lines.append(f"""INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  {sql_escape(pid)},
  {sql_escape(title)}::physician_title,
  {sql_escape(first_name)},
  {sql_escape(last_name)},
  {sql_escape(specialty_id)},
  {sql_text_array(specialties_sec)},
  {sql_escape(job_title)},
  {sql_text_array(role_badges)},
  {sql_escape(bio_short)},
  {sql_escape(photo_url)},
  {sql_bool(booking_enabled)},
  {sql_escape(miodottore_url)},
  {sql_escape(miodottore_id)},
  {sql_escape(widget_html)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();
""")
    
    return "\n".join(lines)


def generate_procedures_sql(procedures):
    """Generate INSERT statements for procedures table."""
    lines = ["-- ============================================",
             "-- Procedures (from procedures.json)",
             "-- ============================================\n"]
    
    for p in procedures:
        pid = p.get("id")
        name = p.get("name")
        name_ext = p.get("name_extended")
        slug = p.get("id")  # id is already a slug
        specialty_id = p.get("specialty_id", "")
        category = p.get("category", "visita")
        
        # Map category to enum values
        cat_map = {
            "visita": "visita", "diagnostica": "diagnostica",
            "esame": "esame", "trattamento": "trattamento",
            "intervento": "intervento", "terapia": "terapia"
        }
        category_enum = cat_map.get(category, "visita")
        
        desc_short = p.get("description_short")
        desc_long = p.get("description_full")
        duration = p.get("duration_minutes")
        indications = p.get("indications", [])
        related = p.get("related_procedures", [])
        search_terms = p.get("search_terms", [])
        booking_priority = p.get("booking_priority", "normal")
        page_url = p.get("page_url")
        
        # Schema.org
        schema_type = "MedicalProcedure"
        if p.get("schema_org"):
            schema_type = p["schema_org"].get("@type", "MedicalProcedure")
        
        lines.append(f"""INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  {sql_escape(pid)},
  {sql_escape(name)},
  {sql_escape(name_ext)},
  {sql_escape(slug)},
  {sql_escape(specialty_id)},
  {sql_escape(category_enum)}::procedure_category,
  'A'::page_type,
  {sql_escape(desc_short)},
  {sql_escape(desc_long)},
  {sql_number(duration)},
  {sql_text_array(indications)},
  {sql_text_array(related)},
  {sql_text_array(search_terms)},
  {sql_escape(booking_priority)},
  {sql_escape(page_url)},
  {sql_escape(schema_type)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();
""")
    
    return "\n".join(lines)


def generate_lab_tests_sql(tests_structured, listino):
    """
    Generate INSERT statements for lab_tests table.
    Merges structured tests (23) with listino (1136 price list items).
    """
    lines = ["-- ============================================",
             "-- Lab Tests: structured tests + listino pricing",
             "-- ============================================\n"]
    
    # Build lookup from structured tests
    structured_by_id = {}
    for t in tests_structured:
        structured_by_id[t.get("id")] = t
    
    # Track inserted IDs
    inserted = set()
    
    # 1. Insert structured tests first (richer data)
    for t in tests_structured:
        tid = t.get("id")
        inserted.add(tid)
        
        name = t.get("name")
        name_ext = t.get("name_extended")
        code = t.get("code")
        category = t.get("category_id", t.get("category", "Altro"))
        subcategory = t.get("subcategory")
        body_system = t.get("body_system")
        sample_type = t.get("sample_type")
        aliases = t.get("aliases", [])
        desc_short = t.get("description_short")
        desc_long = t.get("description_full")
        indications = t.get("indications", [])
        symptoms = t.get("symptoms", [])
        
        # Preparation
        prep = t.get("preparation", {})
        fasting = prep.get("is_fasting_required", False)
        fasting_hours = prep.get("fasting_hours", 0)
        prep_notes = prep.get("special_instructions")
        
        # Results
        turnaround = t.get("turnaround_time", t.get("results", {}).get("turnaround_time"))
        
        # Pricing (try to get from listino)
        price = t.get("price")
        
        # Related
        related = t.get("related_tests", [])
        
        lines.append(f"""INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  {sql_escape(tid)},
  {sql_escape(name)},
  {sql_escape(name_ext)},
  {sql_escape(code)},
  {sql_escape(category)},
  {sql_escape(subcategory)},
  {sql_escape(body_system)},
  {sql_escape(sample_type)},
  {sql_text_array(aliases)},
  {sql_bool(fasting)},
  {sql_number(fasting_hours)},
  {sql_escape(prep_notes)},
  {sql_escape(turnaround)},
  {sql_escape(desc_short)},
  {sql_escape(desc_long)},
  {sql_text_array(indications)},
  {sql_text_array(symptoms)},
  {sql_number(price)},
  {sql_text_array(related)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();
""")
    
    # 2. Insert remaining listino items (not in structured tests)
    lines.append("\n-- Listino-only lab tests (1,136 price-list items)\n")
    
    for item in listino:
        lid = item.get("id")
        if lid in inserted:
            continue
        inserted.add(lid)
        
        name = item.get("nome", "")
        price = item.get("prezzo")
        category = item.get("cat", "Altro")
        symptoms = item.get("sintomi", [])
        turnaround = item.get("referto")
        upsell = item.get("upsell")
        prep_notes = item.get("prep")
        
        # Determine fasting from prep notes
        fasting = False
        if prep_notes and "digiuno" in str(prep_notes).lower():
            fasting = True
        
        lines.append(f"""INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ({sql_escape(lid)}, {sql_escape(name)}, {sql_escape(category)}, {sql_number(price)}, {sql_escape(turnaround)}, {sql_text_array(symptoms)}, {sql_bool(fasting)}, {sql_escape(prep_notes)}, {sql_escape(upsell)}, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();
""")
    
    lines.append(f"\n-- Total lab tests inserted: {len(inserted)}\n")
    return "\n".join(lines)


def generate_packs_sql(packs):
    """Generate INSERT statements for packs table."""
    lines = ["-- ============================================",
             "-- Packs (from packs.json)",
             "-- ============================================\n"]
    
    for pk in packs:
        pid = pk.get("id")
        name = pk.get("name")
        slug = pk.get("slug", pid)
        category = pk.get("category")
        target = pk.get("target_patient")
        target_conditions = pk.get("target_conditions", [])
        clinical_benefit = pk.get("clinical_benefit")
        clinical_rationale = pk.get("clinical_rationale")
        value_prop = pk.get("value_proposition")
        exams = pk.get("exams_included", [])
        exams_count = pk.get("exams_count", len(exams))
        savings = pk.get("savings_percentage")
        prep = pk.get("preparation_summary", {})
        
        lines.append(f"""INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  {sql_escape(pid)},
  {sql_escape(name)},
  {sql_escape(slug)},
  'checkup'::pack_type,
  {sql_escape(category)},
  {sql_escape(target)},
  {sql_text_array(target_conditions)},
  {sql_escape(clinical_benefit)},
  {sql_escape(clinical_rationale)},
  {sql_escape(value_prop)},
  {sql_text_array(exams)},
  {sql_number(exams_count)},
  {sql_number(savings)},
  {sql_jsonb(prep)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();
""")
    
    return "\n".join(lines)


def generate_pathways_sql(pathways):
    """Generate INSERT statements for pathways table."""
    lines = ["-- ============================================",
             "-- Pathways (from pathways.json)",
             "-- ============================================\n"]
    
    for pw in pathways:
        pid = pw.get("id")
        name = pw.get("name")
        name_short = pw.get("name_short")
        slug = pw.get("slug", pid)
        desc_short = pw.get("description_short")
        desc_long = pw.get("description_full")
        clinical_benefit = pw.get("clinical_benefit")
        target = pw.get("target_patient")
        duration = pw.get("duration")
        outcome = pw.get("expected_outcome")
        is_flagship = pw.get("is_flagship", False)
        priority = pw.get("priority_score", 0)
        aliases = pw.get("aliases", [])
        symptoms_kw = pw.get("symptom_keywords", [])
        icon = pw.get("icon")
        includes = pw.get("includes", {})
        page_url = pw.get("page_url")
        
        lines.append(f"""INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  {sql_escape(pid)},
  {sql_escape(name)},
  {sql_escape(name_short)},
  {sql_escape(slug)},
  'clinical_pathway'::pathway_type,
  {sql_escape(desc_short)},
  {sql_escape(desc_long)},
  {sql_escape(clinical_benefit)},
  {sql_escape(target)},
  {sql_escape(duration)},
  {sql_escape(outcome)},
  {sql_bool(is_flagship)},
  {sql_number(priority)},
  {sql_text_array(aliases)},
  {sql_text_array(symptoms_kw)},
  {sql_escape(icon)},
  {sql_jsonb(includes)},
  {sql_escape(page_url)},
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();
""")
    
    return "\n".join(lines)


def generate_relationships_sql(physicians, procedures, packs, pathways, tests):
    """Generate INSERT statements for all M:N relationship tables."""
    lines = ["-- ============================================",
             "-- Relationship Tables (M:N)",
             "-- ============================================\n"]
    
    # Collect valid IDs for FK validation
    valid_procedures = {p["id"] for p in procedures}
    valid_pathways = {p["id"] for p in pathways}
    valid_tests = set()
    valid_packs = {p["id"] for p in packs}
    
    # --- physician_procedures ---
    lines.append("-- physician_procedures\n")
    for p in physicians:
        pid = p.get("id")
        for proc_id in p.get("procedures", []):
            if proc_id in valid_procedures:
                lines.append(
                    f"INSERT INTO physician_procedures (physician_id, procedure_id, role) "
                    f"VALUES ({sql_escape(pid)}, {sql_escape(proc_id)}, 'primary') "
                    f"ON CONFLICT DO NOTHING;"
                )
    
    # --- physician_pathways ---
    lines.append("\n-- physician_pathways\n")
    for p in physicians:
        pid = p.get("id")
        for pw_id in p.get("pathways", []):
            if pw_id in valid_pathways:
                lines.append(
                    f"INSERT INTO physician_pathways (physician_id, pathway_id, role) "
                    f"VALUES ({sql_escape(pid)}, {sql_escape(pw_id)}, 'team_member') "
                    f"ON CONFLICT DO NOTHING;"
                )
    
    # --- procedure_pathways ---
    lines.append("\n-- procedure_pathways\n")
    for proc in procedures:
        proc_id = proc.get("id")
        for pw_id in proc.get("pathways", []):
            if pw_id in valid_pathways:
                lines.append(
                    f"INSERT INTO procedure_pathways (procedure_id, pathway_id) "
                    f"VALUES ({sql_escape(proc_id)}, {sql_escape(pw_id)}) "
                    f"ON CONFLICT DO NOTHING;"
                )
    
    # --- test_packs ---
    lines.append("\n-- test_packs\n")
    for pk in packs:
        pk_id = pk.get("id")
        for i, test_id in enumerate(pk.get("exams_included", [])):
            lines.append(
                f"INSERT INTO test_packs (test_id, pack_id, sort_order) "
                f"VALUES ({sql_escape(test_id)}, {sql_escape(pk_id)}, {i}) "
                f"ON CONFLICT DO NOTHING;"
            )
    
    # --- test_pathways (from pathways includes) ---
    lines.append("\n-- test_pathways\n")
    for pw in pathways:
        pw_id = pw.get("id")
        includes = pw.get("includes", {})
        for test_id in includes.get("tests", []):
            lines.append(
                f"INSERT INTO test_pathways (test_id, pathway_id) "
                f"VALUES ({sql_escape(test_id)}, {sql_escape(pw_id)}) "
                f"ON CONFLICT DO NOTHING;"
            )
    
    lines.append("")
    return "\n".join(lines)


def generate_settings_sql():
    """Generate initial settings entries."""
    lines = ["-- ============================================",
             "-- Initial Settings",
             "-- ============================================\n"]
    
    settings = [
        ("site_name", {"it": "Bio-Clinic Sassari", "en": "Bio-Clinic Sassari"}, "general", "Nome del sito"),
        ("site_phone", "+39 079 956 1332", "contacts", "Telefono principale"),
        ("site_email", "gestione@bio-clinic.it", "contacts", "Email principale"),
        ("site_address", {"street": "Via Renzo Mossa, 23", "city": "Sassari", "province": "SS", "zip": "07100", "country": "IT"}, "contacts", "Indirizzo sede operativa"),
        ("opening_hours", {"mon_fri": "07:00-21:00", "sat": "08:00-14:00", "sun": "chiuso"}, "contacts", "Orari di apertura"),
        ("social_facebook", "https://www.facebook.com/bioclinicss", "social", "Pagina Facebook"),
        ("social_instagram", "https://www.instagram.com/bioclinicss/", "social", "Profilo Instagram"),
        ("legal_company", "Bio Pharma S.r.l.", "legal", "Ragione sociale"),
        ("legal_vat", "02869450904", "legal", "Partita IVA"),
        ("legal_rea", "SS-211220", "legal", "Numero REA"),
        ("seo_default_title", "Bio-Clinic Sassari | Poliambulatorio Medico", "seo", "Title tag di default"),
        ("header_nav_items", [
            {"label": "Home", "url": "/", "order": 1},
            {"label": "Slim Care Medical", "url": "/slim-care/", "order": 2, "children": [
                {"label": "Slim Care", "url": "/slim-care/"},
                {"label": "Slim Care Donna", "url": "/slim-care-donna/"},
                {"label": "Screening INPS", "url": "/screening-inps/", "badge": "NEW"},
                {"label": "Convenzioni Fondi", "url": "/convenzioni/"}
            ]},
            {"label": "Laboratorio", "url": "/laboratorio/", "order": 3},
            {"label": "Aziende", "url": "/medicina-del-lavoro/", "order": 4},
            {"label": "Specialisti", "url": "/equipe/", "order": 5},
            {"label": "Contatti", "url": "/contatti/", "order": 6}
        ], "navigation", "Menu principale header"),
        ("footer_config", {
            "description": "Poliambulatorio con 31 specialità, 67 medici e oltre 1.840 prestazioni.",
            "quick_links": [
                {"label": "Slim Care", "url": "/slim-care/"},
                {"label": "PMA/Fertilità", "url": "/pma-fertilita/"},
                {"label": "Chi Siamo", "url": "/chi-siamo/"}
            ],
            "copyright": "© 2026 Bio Pharma S.r.l."
        }, "navigation", "Configurazione footer")
    ]
    
    for key, value, category, description in settings:
        if isinstance(value, str):
            value = json.dumps(value)
        else:
            value = json.dumps(value, ensure_ascii=False)
        value_escaped = value.replace("'", "''")
        lines.append(
            f"INSERT INTO settings (key, value, category, description) "
            f"VALUES ({sql_escape(key)}, '{value_escaped}'::JSONB, {sql_escape(category)}, {sql_escape(description)}) "
            f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();"
        )
    
    lines.append("")
    return "\n".join(lines)


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Bio-Clinic JSON → SQL migration")
    parser.add_argument("--dry-run", action="store_true", help="Print stats without generating SQL")
    parser.add_argument("--output", default=None, help="Output file (default: migrations/003_seed_data.sql)")
    args = parser.parse_args()
    
    output_path = args.output or str(Path(__file__).parent.parent / "supabase" / "migrations" / "003_seed_data.sql")
    
    print("=" * 60)
    print("Bio-Clinic: JSON → Supabase Migration")
    print("=" * 60)
    
    # Load all data
    print("\n📂 Loading data sources...")
    specialties = load_specialties()
    print(f"  ✅ Specialties: {len(specialties)}")
    
    physicians = load_physicians()
    print(f"  ✅ Physicians: {len(physicians)}")
    
    procedures = load_procedures()
    print(f"  ✅ Procedures: {len(procedures)}")
    
    tests = load_tests()
    print(f"  ✅ Structured Tests: {len(tests)}")
    
    listino = load_listino()
    print(f"  ✅ Listino (price list): {len(listino)}")
    
    packs = load_packs()
    print(f"  ✅ Packs: {len(packs)}")
    
    pathways = load_pathways()
    print(f"  ✅ Pathways: {len(pathways)}")
    
    total = len(specialties) + len(physicians) + len(procedures) + len(tests) + len(listino) + len(packs) + len(pathways)
    print(f"\n📊 Total records to migrate: {total}")
    
    if args.dry_run:
        print("\n🔍 DRY RUN — no SQL generated")
        return
    
    # Generate SQL
    print("\n⚙️  Generating SQL...")
    
    header = f"""-- ============================================================================
-- 003: Seed Data — Bio-Clinic Admin Panel
-- ============================================================================
-- Generated: 2026-02-28
-- Source: site/data/ JSON files
-- Records: {total} total
-- ============================================================================

BEGIN;

-- Disable triggers during bulk insert for performance
ALTER TABLE specialties DISABLE TRIGGER tr_specialties_audit;
ALTER TABLE physicians DISABLE TRIGGER tr_physicians_audit;
ALTER TABLE procedures DISABLE TRIGGER tr_procedures_audit;
ALTER TABLE lab_tests DISABLE TRIGGER tr_lab_tests_audit;
ALTER TABLE packs DISABLE TRIGGER tr_packs_audit;
ALTER TABLE pathways DISABLE TRIGGER tr_pathways_audit;

"""
    
    footer = """
-- Re-enable audit triggers
ALTER TABLE specialties ENABLE TRIGGER tr_specialties_audit;
ALTER TABLE physicians ENABLE TRIGGER tr_physicians_audit;
ALTER TABLE procedures ENABLE TRIGGER tr_procedures_audit;
ALTER TABLE lab_tests ENABLE TRIGGER tr_lab_tests_audit;
ALTER TABLE packs ENABLE TRIGGER tr_packs_audit;
ALTER TABLE pathways ENABLE TRIGGER tr_pathways_audit;

-- Force search vector update on all rows
UPDATE specialties SET updated_at = NOW();
UPDATE physicians SET updated_at = NOW();
UPDATE procedures SET updated_at = NOW();
UPDATE lab_tests SET updated_at = NOW();

COMMIT;

-- ============================================================================
-- Migration Summary
-- ============================================================================
-- Specialties: {specialties}
-- Physicians: {physicians}
-- Procedures: {procedures}
-- Lab Tests (structured): {tests}
-- Lab Tests (listino): {listino}
-- Packs: {packs}
-- Pathways: {pathways}
-- Settings: 14
-- Relationships: auto-generated from source data
-- ============================================================================
""".format(
        specialties=len(specialties),
        physicians=len(physicians),
        procedures=len(procedures),
        tests=len(tests),
        listino=len(listino),
        packs=len(packs),
        pathways=len(pathways)
    )
    
    sections = [
        header,
        generate_specialties_sql(specialties),
        generate_physicians_sql(physicians),
        generate_procedures_sql(procedures),
        generate_lab_tests_sql(tests, listino),
        generate_packs_sql(packs),
        generate_pathways_sql(pathways),
        generate_relationships_sql(physicians, procedures, packs, pathways, tests),
        generate_settings_sql(),
        footer
    ]
    
    full_sql = "\n\n".join(sections)
    
    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_sql)
    
    size_kb = len(full_sql) / 1024
    print(f"\n✅ Generated: {output_path}")
    print(f"   Size: {size_kb:.1f} KB")
    print(f"   Records: {total}")
    print("\n🚀 Ready to run on Supabase SQL Editor")


if __name__ == "__main__":
    main()
