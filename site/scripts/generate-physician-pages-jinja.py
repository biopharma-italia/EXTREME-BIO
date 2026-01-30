#!/usr/bin/env python3
"""
Bio-Clinic Physician Page Generator v2.2
Generates individual HTML pages for all physicians using Jinja2 template
"""

import json
import os
import yaml
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data' / 'v2' / 'entities'
TEMPLATE_DIR = BASE_DIR / 'templates'
OUTPUT_DIR = BASE_DIR / 'equipe'

def load_yaml(file_path):
    """Load YAML file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def get_specialty_by_id(specialties, specialty_id):
    """Find specialty by ID"""
    for spec in specialties:
        if spec.get('id') == specialty_id:
            return spec
    return None

def get_procedure_by_id(procedures, proc_id):
    """Find procedure by ID"""
    for proc in procedures:
        if proc.get('id') == proc_id:
            return proc
    return None

def generate_schema_json(physician, specialty, procedures_details):
    """Generate JSON-LD schema for physician"""
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "MedicalClinic",
                "@id": "https://bio-clinic.it/#clinic",
                "name": "Bio-Clinic Sassari",
                "url": "https://bio-clinic.it",
                "telephone": "+39 079 956 1332",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Via Renzo Mossa, 23",
                    "addressLocality": "Sassari",
                    "postalCode": "07100",
                    "addressCountry": "IT"
                }
            },
            {
                "@type": "Physician",
                "@id": f"https://bio-clinic.it/equipe/{physician['id']}/#physician",
                "name": physician.get('display_name', f"{physician.get('title', '')} {physician.get('name', '')}".strip()),
                "givenName": physician.get('first_name', ''),
                "familyName": physician.get('last_name', ''),
                "jobTitle": physician.get('job_title', ''),
                "description": physician.get('bio_short', ''),
                "medicalSpecialty": specialty.get('name', '') if specialty else '',
                "worksFor": {
                    "@id": "https://bio-clinic.it/#clinic"
                },
                "availableService": [
                    {"@type": "MedicalProcedure", "name": proc.get('name', '')} 
                    for proc in (procedures_details or [])
                ] if procedures_details else None
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
                    {"@type": "ListItem", "position": 2, "name": "Équipe", "item": "https://bio-clinic.it/equipe/"},
                    {"@type": "ListItem", "position": 3, "name": physician.get('display_name', physician.get('name', '')), "item": f"https://bio-clinic.it/equipe/{physician['id']}.html"}
                ]
            }
        ]
    }
    return json.dumps(schema, ensure_ascii=False, indent=2)

def main():
    print("=" * 60)
    print("BIO-CLINIC Physician Page Generator v2.2 (Jinja2)")
    print("=" * 60)
    
    # Load data
    print("\nLoading data...")
    physicians_data = load_yaml(DATA_DIR / 'physicians.yaml')
    specialties_data = load_yaml(DATA_DIR / 'specialties.yaml')
    procedures_data = load_yaml(DATA_DIR / 'procedures.yaml')
    
    physicians = physicians_data.get('physicians', [])
    specialties = specialties_data.get('specialties', [])
    procedures = procedures_data.get('procedures', [])
    
    print(f"  - {len(physicians)} physicians")
    print(f"  - {len(specialties)} specialties")
    print(f"  - {len(procedures)} procedures")
    
    # Setup Jinja2
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        trim_blocks=True,
        lstrip_blocks=True
    )
    template = env.get_template('physician.html.j2')
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate pages
    print("\nGenerating physician pages...")
    generated_count = 0
    warnings = []
    
    for physician in physicians:
        phys_id = physician.get('id')
        if not phys_id:
            warnings.append("Physician without ID found, skipping")
            continue
        
        # Get specialty
        specialty_id = physician.get('specialty_id')
        specialty = get_specialty_by_id(specialties, specialty_id) if specialty_id else None
        if specialty_id and not specialty:
            warnings.append(f"Specialty '{specialty_id}' not found for {phys_id}")
        
        # Get procedures details
        proc_ids = physician.get('procedures', [])
        procedures_details = []
        for pid in proc_ids:
            proc = get_procedure_by_id(procedures, pid)
            if proc:
                procedures_details.append(proc)
            else:
                warnings.append(f"Procedure '{pid}' not found for {phys_id}")
        
        # Build display name
        title = physician.get('title', '')
        name = physician.get('name', '')
        display_name = f"{title} {name}".strip() if title else name
        physician['display_name'] = display_name
        
        # Add procedures_details to physician object
        physician['procedures_details'] = procedures_details
        
        # Generate JSON-LD schema
        schema_json = generate_schema_json(physician, specialty, procedures_details)
        
        # Render template
        try:
            html = template.render(
                physician=physician,
                specialty=specialty,
                schema_json=schema_json
            )
            
            # Write output
            output_file = OUTPUT_DIR / f"{phys_id}.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html)
            
            generated_count += 1
            print(f"  ✓ {display_name}")
            
        except Exception as e:
            warnings.append(f"Error rendering {phys_id}: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Pages generated: {generated_count}")
    print(f"Warnings: {len(warnings)}")
    
    if warnings:
        print("\nWarnings:")
        for w in warnings[:20]:  # Show first 20 warnings
            print(f"  ⚠ {w}")
        if len(warnings) > 20:
            print(f"  ... and {len(warnings) - 20} more")
    
    return generated_count

if __name__ == '__main__':
    main()
