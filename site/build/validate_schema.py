#!/usr/bin/env python3
"""
BIO-CLINIC Schema.org Validator v1.0
Valida il JSON-LD nelle pagine generate
"""

import os
import json
import re
from pathlib import Path

def extract_jsonld(html_content):
    """Estrae tutti i blocchi JSON-LD da HTML"""
    pattern = r'<script type="application/ld\+json">\s*(.*?)\s*</script>'
    matches = re.findall(pattern, html_content, re.DOTALL)
    results = []
    for match in matches:
        try:
            data = json.loads(match)
            results.append(data)
        except json.JSONDecodeError as e:
            results.append({"error": str(e), "raw": match[:200]})
    return results

def validate_schema(schema_data, page_type):
    """Valida la struttura Schema.org"""
    errors = []
    warnings = []
    
    if not schema_data:
        errors.append("No JSON-LD found")
        return errors, warnings
    
    for data in schema_data:
        if "error" in data:
            errors.append(f"JSON parse error: {data['error']}")
            continue
            
        # Check @context
        if "@context" not in data:
            errors.append("Missing @context")
        elif data["@context"] != "https://schema.org":
            warnings.append(f"Non-standard @context: {data['@context']}")
        
        # Check @graph or @type
        if "@graph" in data:
            for item in data["@graph"]:
                if "@type" not in item:
                    errors.append("Item in @graph missing @type")
                else:
                    item_type = item["@type"]
                    
                    # Validate MedicalClinic
                    if item_type == "MedicalClinic":
                        required = ["name", "telephone", "address"]
                        for field in required:
                            if field not in item:
                                warnings.append(f"MedicalClinic missing {field}")
                    
                    # Validate Physician
                    elif item_type == "Physician":
                        required = ["name", "jobTitle"]
                        for field in required:
                            if field not in item:
                                warnings.append(f"Physician missing {field}")
                    
                    # Validate MedicalProcedure
                    elif item_type == "MedicalProcedure":
                        required = ["name", "description"]
                        for field in required:
                            if field not in item:
                                warnings.append(f"MedicalProcedure missing {field}")
                    
                    # Validate BreadcrumbList
                    elif item_type == "BreadcrumbList":
                        if "itemListElement" not in item:
                            errors.append("BreadcrumbList missing itemListElement")
                        elif len(item["itemListElement"]) < 2:
                            warnings.append("BreadcrumbList has less than 2 items")
        
        elif "@type" not in data:
            errors.append("Missing @type or @graph")
    
    return errors, warnings

def main():
    print("=" * 60)
    print("BIO-CLINIC Schema.org Validator v1.0")
    print("=" * 60)
    print()
    
    base_dir = Path(".")
    
    # Directories to scan
    dirs_to_scan = [
        ("pages", "procedure"),
        ("equipe", "physician"),
    ]
    
    total_files = 0
    total_errors = 0
    total_warnings = 0
    valid_files = 0
    
    results = {
        "valid": [],
        "warnings": [],
        "errors": []
    }
    
    for dir_name, page_type in dirs_to_scan:
        dir_path = base_dir / dir_name
        if not dir_path.exists():
            print(f"⚠️  Directory not found: {dir_name}")
            continue
        
        html_files = list(dir_path.glob("*.html"))
        print(f"\n📁 Scanning {dir_name}/ ({len(html_files)} files)")
        print("-" * 40)
        
        for html_file in sorted(html_files):
            total_files += 1
            content = html_file.read_text(encoding='utf-8')
            schemas = extract_jsonld(content)
            errors, warnings = validate_schema(schemas, page_type)
            
            if errors:
                total_errors += len(errors)
                results["errors"].append({
                    "file": str(html_file),
                    "errors": errors
                })
                print(f"   ❌ {html_file.name}: {len(errors)} errors")
            elif warnings:
                total_warnings += len(warnings)
                results["warnings"].append({
                    "file": str(html_file),
                    "warnings": warnings
                })
                print(f"   ⚠️  {html_file.name}: {len(warnings)} warnings")
            else:
                valid_files += 1
                results["valid"].append(str(html_file))
    
    # Summary
    print()
    print("=" * 60)
    print("📊 Validation Summary")
    print("=" * 60)
    print(f"   Total files:    {total_files}")
    print(f"   ✅ Valid:        {valid_files}")
    print(f"   ⚠️  With warnings: {len(results['warnings'])}")
    print(f"   ❌ With errors:   {len(results['errors'])}")
    print()
    
    if results["errors"]:
        print("❌ Files with errors:")
        for item in results["errors"][:5]:  # Show first 5
            print(f"   • {item['file']}")
            for err in item["errors"][:3]:
                print(f"     - {err}")
    
    if results["warnings"]:
        print("\n⚠️  Files with warnings:")
        for item in results["warnings"][:5]:  # Show first 5
            print(f"   • {item['file']}")
            for warn in item["warnings"][:3]:
                print(f"     - {warn}")
    
    # Google Rich Results Test URLs
    print()
    print("=" * 60)
    print("🔗 Google Rich Results Test")
    print("=" * 60)
    print("Test your pages at:")
    print("https://search.google.com/test/rich-results")
    print()
    print("Sample URLs to test:")
    print("• https://bio-clinic.it/pages/visita-ginecologica.html")
    print("• https://bio-clinic.it/equipe/salvatore-dessole.html")
    print("• https://bio-clinic.it/pages/ecografia-transvaginale.html")
    
    return 0 if total_errors == 0 else 1

if __name__ == "__main__":
    exit(main())
