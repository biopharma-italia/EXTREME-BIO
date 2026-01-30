#!/usr/bin/env python3
"""
Bio-Clinic Sitemap Generator
Scans site directory for HTML files and generates sitemap.xml
"""

import os
from datetime import datetime
from pathlib import Path

# Configuration
SITE_DIR = Path(__file__).parent
BASE_URL = "https://bio-clinic.it"
OUTPUT_FILE = SITE_DIR / "sitemap.xml"

# Priority rules
PRIORITY_RULES = {
    "index.html": 1.0,
    "laboratorio/index.html": 0.9,
    "laboratorio/stat.html": 0.9,
    "listino-completo.html": 0.9,
    "pages/ginecologia.html": 0.9,
    "pages/cardiologia.html": 0.9,
    "pages/endocrinologia.html": 0.9,
    "pages/slim-care.html": 0.9,
    "pages/slim-care-donna.html": 0.9,
    "pages/pma-fertilita.html": 0.9,
    "pages/specialita.html": 0.8,
    "pages/contatti.html": 0.8,
    "pages/chi-siamo.html": 0.7,
}

# Changefreq rules
CHANGEFREQ_RULES = {
    "index.html": "weekly",
    "laboratorio/": "weekly",
    "listino-completo.html": "weekly",
    "pages/visita-": "monthly",
    "pages/ecografia-": "monthly",
    "pages/holter-": "monthly",
    "equipe/": "monthly",
}

# Directories to exclude
EXCLUDE_DIRS = {
    "node_modules",
    "backups",
    "templates",
    "components",
    "data",
    "build",
    "output",
    "scripts",
    "docs",
    ".github",
    "reports",
    "logs",
    "css",
    "js",
    "images",
}

# Files to exclude
EXCLUDE_FILES = {
    "404.html",
    "error.html",
    "test.html",
}


def get_priority(rel_path: str) -> float:
    """Determine priority based on path"""
    # Check exact matches first
    if rel_path in PRIORITY_RULES:
        return PRIORITY_RULES[rel_path]
    
    # Check pattern matches
    if rel_path.startswith("equipe/"):
        return 0.6
    if rel_path.startswith("pages/visita-"):
        return 0.8
    if rel_path.startswith("pages/ecografia-"):
        return 0.8
    if rel_path.startswith("pages/holter-"):
        return 0.8
    if rel_path.startswith("pages/"):
        return 0.7
    if rel_path.startswith("laboratorio/"):
        return 0.8
    if rel_path.startswith("prestazioni/"):
        return 0.6
    if rel_path.startswith("shop/"):
        return 0.5
    
    return 0.5


def get_changefreq(rel_path: str) -> str:
    """Determine change frequency based on path"""
    for pattern, freq in CHANGEFREQ_RULES.items():
        if pattern in rel_path:
            return freq
    return "monthly"


def scan_html_files() -> list:
    """Scan directory for HTML files"""
    html_files = []
    
    for root, dirs, files in os.walk(SITE_DIR):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        
        for file in files:
            if not file.endswith('.html'):
                continue
            if file in EXCLUDE_FILES:
                continue
            
            full_path = Path(root) / file
            rel_path = str(full_path.relative_to(SITE_DIR))
            
            # Skip if in excluded directory
            if any(excl in rel_path for excl in EXCLUDE_DIRS):
                continue
            
            html_files.append(rel_path)
    
    # Sort with homepage first
    def sort_key(path):
        if path == "index.html":
            return "0_" + path
        return "1_" + path
    
    return sorted(html_files, key=sort_key)


def generate_sitemap():
    """Generate sitemap.xml"""
    html_files = scan_html_files()
    today = datetime.now().strftime("%Y-%m-%d")
    
    xml_content = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_content.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    for rel_path in html_files:
        # Build URL
        if rel_path == "index.html":
            url = f"{BASE_URL}/"
        else:
            url = f"{BASE_URL}/{rel_path}"
        
        priority = get_priority(rel_path)
        changefreq = get_changefreq(rel_path)
        
        xml_content.append("  <url>")
        xml_content.append(f"    <loc>{url}</loc>")
        xml_content.append(f"    <lastmod>{today}</lastmod>")
        xml_content.append(f"    <changefreq>{changefreq}</changefreq>")
        xml_content.append(f"    <priority>{priority:.1f}</priority>")
        xml_content.append("  </url>")
    
    xml_content.append("</urlset>")
    
    # Write sitemap
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_content))
    
    return len(html_files)


def main():
    print("=" * 60)
    print("BIO-CLINIC SITEMAP GENERATOR")
    print("=" * 60)
    
    # Scan and generate
    count = generate_sitemap()
    
    print(f"\n✅ Sitemap generated: {OUTPUT_FILE}")
    print(f"📄 Total URLs: {count}")
    print(f"📅 Last modified: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Show first 10 URLs as sample
    print("\n📋 Sample URLs (first 10):")
    html_files = scan_html_files()[:10]
    for f in html_files:
        url = f"{BASE_URL}/{f}" if f != "index.html" else f"{BASE_URL}/"
        print(f"   - {url}")
    
    print("\n" + "=" * 60)
    print("COMPLETED!")
    print("=" * 60)


if __name__ == "__main__":
    main()
