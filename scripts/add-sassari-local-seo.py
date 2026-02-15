#!/usr/bin/env python3
"""
D1: Add "Sassari" to title, H1, and meta description across all Bio-Clinic pages.
Improves local SEO signal for Google.

Targets:
- TITLE: Add "Sassari" to equipe pages (currently "Bio-Clinic" → "Bio-Clinic Sassari")
- H1: Add "a Sassari" or "Sassari" naturally to H1 tags
- META DESC: Add "a Sassari" where missing

Usage:
    python3 scripts/add-sassari-local-seo.py [--dry-run]
"""

import os
import re
import sys
import argparse
from pathlib import Path

SITE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")

# Pages to skip entirely
SKIP_SLUGS = {"cookie", "privacy"}

# Stats
stats = {"title": 0, "h1": 0, "desc": 0, "files": 0}


def add_sassari_to_title_equipe(content):
    """Add 'Sassari' to equipe page titles: 'Bio-Clinic' → 'Bio-Clinic Sassari'"""
    old_title_m = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    if not old_title_m:
        return content, False
    
    old_title = old_title_m.group(1)
    if "sassari" in old_title.lower():
        return content, False
    
    # Pattern: "Dott. X | Specialità | Bio-Clinic" → "Dott. X | Specialità Sassari | Bio-Clinic"
    if "| Bio-Clinic" in old_title:
        new_title = old_title.replace("| Bio-Clinic", "Sassari | Bio-Clinic")
        content = content.replace(f"<title>{old_title}</title>", f"<title>{new_title}</title>")
        return content, True
    
    return content, False


def add_sassari_to_h1(content, slug):
    """Add 'Sassari' to H1 tag naturally"""
    h1_m = re.search(r'(<h1[^>]*>)(.*?)(</h1>)', content, re.DOTALL | re.IGNORECASE)
    if not h1_m:
        return content, False
    
    h1_tag_open = h1_m.group(1)
    h1_inner = h1_m.group(2)
    h1_close = h1_m.group(3)
    h1_text = re.sub(r'<[^>]+>', '', h1_inner).strip()
    
    if "sassari" in h1_text.lower():
        return content, False
    
    # Don't modify utility pages
    if slug in SKIP_SLUGS or slug in ("homepage",):
        return content, False
    
    # Strategy: Add " a Sassari" or " Sassari" inside the H1
    # For multi-line H1s with <br>, spans, etc., we need to be careful
    
    # If H1 contains spans/breaks (complex H1), add after the last text
    if "<br" in h1_inner or "<span" in h1_inner:
        # Find the last closing span or last text segment
        # Add a small subtitle span with "a Sassari"
        new_h1_inner = h1_inner.rstrip()
        # Add a styled "a Sassari" line
        sassari_span = '\n                        <span style="display:block;font-size:0.5em;font-weight:400;color:#16a34a;margin-top:4px;">a Sassari</span>'
        new_h1 = f"{h1_tag_open}{new_h1_inner}{sassari_span}\n                    {h1_close}"
        content = content.replace(h1_m.group(0), new_h1)
        return content, True
    
    # Simple H1: just append " a Sassari" or add a subtitle
    # Check if it's a short H1 where appending makes sense
    if len(h1_text) < 40:
        # Short H1: add styled subtitle
        new_h1_inner = h1_inner.rstrip()
        sassari_span = '\n      <span style="display:block;font-size:0.5em;font-weight:400;color:#16a34a;margin-top:4px;">a Sassari</span>'
        new_h1 = f"{h1_tag_open}{new_h1_inner}{sassari_span}\n    {h1_close}"
        content = content.replace(h1_m.group(0), new_h1)
        return content, True
    else:
        # Longer H1: add as subtitle
        new_h1_inner = h1_inner.rstrip()
        sassari_span = '\n      <span style="display:block;font-size:0.5em;font-weight:400;color:#16a34a;margin-top:4px;">a Sassari</span>'
        new_h1 = f"{h1_tag_open}{new_h1_inner}{sassari_span}\n    {h1_close}"
        content = content.replace(h1_m.group(0), new_h1)
        return content, True


def add_sassari_to_meta_desc(content, slug):
    """Add 'a Sassari' or 'presso Bio-Clinic Sassari' to meta description"""
    # Use a backreference (\3) so the closing quote matches the opening quote.
    # This prevents matching an apostrophe inside Italian elisions like un'attenzione.
    desc_m = re.search(
        r'(<meta\s+name=(["\'])description\2\s+content=(["\']))(.*?)(\3)',
        content, re.IGNORECASE
    )
    if not desc_m:
        return content, False
    
    prefix = desc_m.group(1)   # everything up to and including the opening quote
    desc = desc_m.group(4)     # the description text
    suffix = desc_m.group(5)   # closing quote (same char as opening)
    
    if "sassari" in desc.lower():
        return content, False
    
    if slug in SKIP_SLUGS:
        return content, False
    
    # Strategy: insert "a Sassari" after the first sentence or first noun phrase
    # Common patterns:
    # "Trattamento ambulatoriale delle vene..." → "Trattamento ambulatoriale delle vene a Sassari..."
    # "Studio ecografico..." → "Studio ecografico a Sassari..."
    
    # Try to insert " a Sassari" after the first period
    if ". " in desc:
        first_dot = desc.index(". ")
        new_desc = desc[:first_dot] + " a Sassari" + desc[first_dot:]
    else:
        # No period: add " a Sassari presso Bio-Clinic." at the end  
        # But first, try to insert after first key phrase
        # Look for common patterns
        inserted = False
        
        # Pattern: ends without Sassari — add " a Sassari presso Bio-Clinic" at end
        if desc.endswith("."):
            new_desc = desc[:-1] + " a Sassari presso Bio-Clinic."
        else:
            # Truncated desc: insert " a Sassari" after first comma or key word
            if ", " in desc[:80]:
                pos = desc.index(", ")
                new_desc = desc[:pos] + " a Sassari" + desc[pos:]
            else:
                # Last resort: prepend context
                new_desc = desc.rstrip(". ") + " a Sassari presso Bio-Clinic."
    
    # Ensure not too long (keep under 160 chars)
    if len(new_desc) > 165:
        new_desc = new_desc[:162] + "..."
    
    content = content.replace(f"{prefix}{desc}{suffix}", f"{prefix}{new_desc}{suffix}")
    return content, True


def process_page(filepath, slug, dry_run=False):
    """Process a single page"""
    content = filepath.read_text(encoding="utf-8")
    
    # Skip meta-refresh
    if 'http-equiv="refresh"' in content.lower():
        return "skip-refresh"
    
    if slug in SKIP_SLUGS:
        return "skip-utility"
    
    modified = False
    changes = []
    
    # 1. TITLE — only for equipe pages
    if slug.startswith("equipe/") and slug != "equipe":
        content, changed = add_sassari_to_title_equipe(content)
        if changed:
            stats["title"] += 1
            changes.append("title")
            modified = True
    
    # 2. H1 — all pages
    content, changed = add_sassari_to_h1(content, slug)
    if changed:
        stats["h1"] += 1
        changes.append("h1")
        modified = True
    
    # 3. META DESC — pages missing Sassari
    content, changed = add_sassari_to_meta_desc(content, slug)
    if changed:
        stats["desc"] += 1
        changes.append("desc")
        modified = True
    
    if modified and not dry_run:
        filepath.write_text(content, encoding="utf-8")
        stats["files"] += 1
    
    return changes if changes else "no-change"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    site = Path(SITE_DIR)
    total = 0
    modified_pages = []
    
    for idx_file in sorted(site.rglob("index.html")):
        rel = str(idx_file.relative_to(site))
        slug = rel.replace("/index.html", "") if rel != "index.html" else "homepage"
        
        # Skip backups
        if "backup" in slug:
            continue
        
        total += 1
        result = process_page(idx_file, slug, args.dry_run)
        
        if isinstance(result, list):
            prefix = "[DRY] " if args.dry_run else ""
            print(f"  {prefix}✅ {slug} ({', '.join(result)})")
            modified_pages.append(slug)
        elif result == "skip-refresh":
            pass  # silent skip
    
    print(f"\n{'='*60}")
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Summary:")
    print(f"  Total pages: {total}")
    print(f"  Modified: {len(modified_pages)}")
    print(f"    Title (equipe): {stats['title']}")
    print(f"    H1: {stats['h1']}")
    print(f"    Meta description: {stats['desc']}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
