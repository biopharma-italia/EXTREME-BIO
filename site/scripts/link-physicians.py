#!/usr/bin/env python3
"""
PHYSICIAN AUTO-LINKER - Static HTML Generation
==============================================
Scansiona tutte le pagine HTML e sostituisce i nomi dei medici
con link alle loro pagine profilo.

Questo approccio statico è preferibile per SEO rispetto al JS dinamico.

Usage:
    python scripts/link-physicians.py
"""

import json
import re
import os
from pathlib import Path
from html import escape

# Configuration
SITE_DIR = Path(__file__).parent.parent
PHYSICIANS_FILE = SITE_DIR / 'data/entities/physicians-complete.json'
EQUIPE_DIR = SITE_DIR / 'equipe'

# Pages to process
PAGES_TO_PROCESS = [
    'index.html',
    'pages/slim-care.html',
    'pages/slim-care-donna.html',
    'pages/ginecologia.html',
    'pages/cardiologia.html',
    'pages/endocrinologia.html',
    'pages/dermatologia.html',
    'pages/neurologia.html',
    'pages/oculistica.html',
    'pages/ortopedia.html',
    'pages/laboratorio.html',
    'pages/chi-siamo.html',
    'pages/contatti.html',
    'pages/pma-fertilita.html',
]

# Selectors where we should NOT auto-link (regex patterns for HTML)
EXCLUDE_PATTERNS = [
    r'<a[^>]*>.*?</a>',  # Already in links
    r'<script[^>]*>.*?</script>',  # Scripts
    r'<style[^>]*>.*?</style>',  # Styles
    r'data-zlw-doctor="[^"]*"',  # MioDottore widget attributes
    r'class="physician-link"',  # Already linked
    r'href="[^"]*equipe/[^"]*\.html"',  # Already linking to equipe
]

def load_physicians():
    """Load physicians from JSON"""
    with open(PHYSICIANS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('physicians', [])

def create_name_variants(physician):
    """Create all possible name variants for a physician"""
    variants = set()
    
    full_name = physician.get('full_name', '')
    name = physician.get('name', '')
    title = physician.get('title', '')
    
    if full_name:
        variants.add(full_name)
    
    if name:
        variants.add(name)
        
        # With different titles
        if title:
            variants.add(f"{title} {name}")
        
        # Common title variations
        variants.add(f"Dr. {name}")
        variants.add(f"Dott. {name}")
        variants.add(f"Dott.ssa {name}")
        variants.add(f"Prof. {name}")
        
        # Just surname if unique enough (skip for now to avoid false positives)
        # surname = name.split()[-1]
        # variants.add(f"Dr. {surname}")
    
    return list(variants)

def create_link_html(physician, matched_text):
    """Create the HTML link for a physician"""
    slug = physician.get('slug', physician.get('id', ''))
    full_name = physician.get('full_name', matched_text)
    job_title = physician.get('job_title', '')
    
    # Use static page if exists, otherwise dynamic profilo
    static_page = EQUIPE_DIR / f"{slug}.html"
    if static_page.exists():
        href = f"/equipe/{slug}.html"
    else:
        href = f"/equipe/profilo.html?id={slug}"
    
    return (
        f'<a href="{href}" '
        f'class="physician-link" '
        f'title="Vedi profilo di {escape(full_name)} - {escape(job_title)}">'
        f'{matched_text}</a>'
    )

def should_replace(html_content, match_start, match_end):
    """Check if this match should be replaced (not already in excluded context)"""
    # Get context around the match
    context_start = max(0, match_start - 500)
    context_end = min(len(html_content), match_end + 100)
    context = html_content[context_start:context_end]
    
    match_in_context = match_start - context_start
    
    # Check if inside a link
    last_a_open = context.rfind('<a ', 0, match_in_context)
    last_a_close = context.rfind('</a>', 0, match_in_context)
    if last_a_open > last_a_close:
        return False  # Inside a link
    
    # Check if inside script or style
    for tag in ['script', 'style']:
        last_open = context.rfind(f'<{tag}', 0, match_in_context)
        last_close = context.rfind(f'</{tag}>', 0, match_in_context)
        if last_open > last_close:
            return False
    
    # Check if it's an attribute value
    last_quote = context.rfind('"', 0, match_in_context)
    if last_quote > 0:
        # Count quotes before to see if we're inside an attribute
        quote_count = context[:match_in_context].count('"')
        if quote_count % 2 == 1:
            return False  # Inside a quoted attribute
    
    # Check if already has physician-link class nearby
    if 'physician-link' in context[match_in_context-50:match_in_context+len(context)-match_in_context]:
        return False
    
    return True

def process_page(page_path, physicians):
    """Process a single HTML page"""
    full_path = SITE_DIR / page_path
    
    if not full_path.exists():
        print(f"  ⚠️  File not found: {page_path}")
        return 0
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    links_created = 0
    
    # Sort physicians by name length (longest first to avoid partial matches)
    sorted_physicians = sorted(
        physicians, 
        key=lambda p: len(p.get('full_name', '')), 
        reverse=True
    )
    
    # Track replaced positions to avoid overlaps
    replaced_ranges = []
    
    for physician in sorted_physicians:
        variants = create_name_variants(physician)
        
        for variant in variants:
            if len(variant) < 5:  # Skip very short names
                continue
            
            # Create regex pattern (word boundary, case insensitive)
            pattern = r'\b' + re.escape(variant) + r'\b'
            
            # Find all matches
            for match in re.finditer(pattern, content, re.IGNORECASE):
                start, end = match.start(), match.end()
                
                # Check if this range overlaps with already replaced
                overlaps = any(
                    start < r_end and end > r_start 
                    for r_start, r_end in replaced_ranges
                )
                
                if overlaps:
                    continue
                
                # Check if should replace
                if not should_replace(content, start, end):
                    continue
                
                matched_text = match.group()
                link_html = create_link_html(physician, matched_text)
                
                # Replace in content
                content = content[:start] + link_html + content[end:]
                
                # Update replaced ranges (account for length change)
                len_diff = len(link_html) - len(matched_text)
                replaced_ranges.append((start, start + len(link_html)))
                
                # Update other ranges
                replaced_ranges = [
                    (r_start + len_diff if r_start > start else r_start,
                     r_end + len_diff if r_end > start else r_end)
                    for r_start, r_end in replaced_ranges
                ]
                
                links_created += 1
    
    # Save if changed
    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {page_path}: {links_created} links created")
    else:
        print(f"  ⚪ {page_path}: no changes")
    
    return links_created

def main():
    print("=" * 50)
    print("PHYSICIAN AUTO-LINKER")
    print("=" * 50)
    print()
    
    # Load physicians
    print("Loading physicians...")
    physicians = load_physicians()
    print(f"  Found {len(physicians)} physicians")
    print()
    
    # Process each page
    print("Processing pages...")
    total_links = 0
    
    for page in PAGES_TO_PROCESS:
        links = process_page(page, physicians)
        total_links += links
    
    print()
    print("=" * 50)
    print(f"TOTAL: {total_links} links created")
    print("=" * 50)

if __name__ == '__main__':
    main()
