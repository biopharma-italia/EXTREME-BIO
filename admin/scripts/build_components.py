#!/usr/bin/env python3
"""
Bio-Clinic: Build-Time Header/Footer Component Injection
=========================================================
Extracts the canonical header, mobile-nav, and footer from the homepage,
saves them as reusable components in site/_components/, and provides
functionality to inject them into all HTML pages.

This system:
  1. EXTRACT: Pulls canonical components from index.html
  2. NORMALIZE: Removes page-specific "active" class from nav links
  3. INJECT: Replaces each page's inline header/footer with the canonical version,
             setting the correct "active" nav-link based on the page's URL
  4. PATCH: Adds missing header/footer to pages that lack them

Usage:
  python3 build_components.py extract       # Extract components from homepage
  python3 build_components.py inject        # Inject into all pages
  python3 build_components.py inject --dry-run  # Show what would change
  python3 build_components.py stats         # Show current duplication stats

Version: 1.0.0 | 2026-02-28
"""

import argparse
import os
import re
import sys
import hashlib
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

SITE_DIR = Path(__file__).resolve().parent.parent.parent / "site"
COMPONENTS_DIR = SITE_DIR / "_components"
HOMEPAGE = SITE_DIR / "index.html"

# Files to process
EXCLUDE_DIRS = {"_components", "output", "backups", "data", "images", "css", "js", "fonts", "docs"}
EXCLUDE_FILES = {"404.html", "500.html"}

# Nav URL → section mapping for active state
NAV_SECTIONS = {
    "/": "Home",
    "/slim-care/": "Slim Care Medical",
    "/slim-care-donna/": "Slim Care Medical",
    "/screening-inps/": "Slim Care Medical",
    "/convenzioni/": "Slim Care Medical",
    "/laboratorio/": "Laboratorio",
    "/genetica/": "Laboratorio",
    "/preparazione-esami/": "Laboratorio",
    "/medicina-del-lavoro/": "Aziende",
    "/ginecologia/": "Donna & PMA",
    "/pma-fertilita/": "Donna & PMA",
    "/isteroscopia-diagnostica/": "Donna & PMA",
    "/isterosalpingografia/": "Donna & PMA",
    "/equipe/": "Specialisti",
    "/shop/": "Medical Shop",
    "/salute/": "Salute",
    "/contatti/": "Contatti",
}

# Specialty pages that map to "Specialisti"
SPECIALTY_SLUGS = [
    "cardiologia", "endocrinologia", "oculistica", "dermatologia",
    "ortopedia", "urologia", "otorinolaringoiatria", "neurologia",
    "pneumologia", "gastroenterologia", "chirurgia-vascolare",
    "allergologia", "fisioterapia", "psicologia", "nutrizione",
    "senologia", "andrologia"
]


# ============================================================================
# EXTRACT
# ============================================================================

def extract_component(html, pattern, name):
    """Extract a component from HTML using regex pattern."""
    match = re.search(pattern, html, re.DOTALL)
    if match:
        return match.group(0)
    print(f"  ⚠️  Could not find {name}")
    return None

def normalize_header(header_html):
    """
    Remove all page-specific 'active' classes from nav links.
    The inject step will add the correct active class per page.
    """
    # Remove ' active' from class="nav-link active"
    normalized = re.sub(
        r'class="nav-link\s+active"',
        'class="nav-link"',
        header_html
    )
    return normalized

def normalize_mobile_nav(mobile_html):
    """Remove active classes from mobile nav links."""
    normalized = re.sub(
        r'class="mobile-nav-link\s+active"',
        'class="mobile-nav-link"',
        mobile_html
    )
    return normalized

def cmd_extract(args):
    """Extract canonical components from homepage."""
    print("📦 Extracting components from homepage...")
    
    if not HOMEPAGE.exists():
        print(f"  ❌ Homepage not found: {HOMEPAGE}")
        return 1
    
    html = HOMEPAGE.read_text(encoding="utf-8")
    
    # Extract header
    header = extract_component(html, r'<header class="header">.*?</header>', "header")
    if header:
        header = normalize_header(header)
        comp_path = COMPONENTS_DIR / "header.html"
        comp_path.write_text(header, encoding="utf-8")
        print(f"  ✅ header.html ({len(header):,} chars, {header.count(chr(10))} lines)")
    
    # Extract mobile nav
    mobile = extract_component(html, r'<nav class="mobile-nav"[^>]*>.*?</nav>', "mobile-nav")
    if mobile:
        mobile = normalize_mobile_nav(mobile)
        comp_path = COMPONENTS_DIR / "mobile-nav.html"
        comp_path.write_text(mobile, encoding="utf-8")
        print(f"  ✅ mobile-nav.html ({len(mobile):,} chars, {mobile.count(chr(10))} lines)")
    
    # Extract footer
    footer = extract_component(html, r'<footer class="footer">.*?</footer>', "footer")
    if footer:
        comp_path = COMPONENTS_DIR / "footer.html"
        comp_path.write_text(footer, encoding="utf-8")
        print(f"  ✅ footer.html ({len(footer):,} chars, {footer.count(chr(10))} lines)")
    
    print(f"\n📁 Components saved to: {COMPONENTS_DIR}")
    return 0


# ============================================================================
# INJECT
# ============================================================================

def get_page_url(filepath):
    """Convert file path to page URL."""
    rel = filepath.relative_to(SITE_DIR)
    parts = list(rel.parts)
    
    # index.html in root = /
    if len(parts) == 1 and parts[0] == "index.html":
        return "/"
    
    # dir/index.html = /dir/
    if parts[-1] == "index.html":
        return "/" + "/".join(parts[:-1]) + "/"
    
    # file.html = /file (but we usually have index.html)
    name = parts[-1].replace(".html", "")
    return "/" + "/".join(parts[:-1] + [name]) + "/"

def determine_active_section(page_url):
    """Determine which nav section should be active for a given page URL."""
    # Exact match first
    if page_url in NAV_SECTIONS:
        return NAV_SECTIONS[page_url]
    
    # Check specialty pages
    for slug in SPECIALTY_SLUGS:
        if page_url.startswith(f"/{slug}/") or page_url == f"/{slug}/":
            return "Specialisti"
    
    # Check equipe pages
    if page_url.startswith("/equipe/"):
        return "Specialisti"
    
    # Check parent paths
    for nav_url, section in sorted(NAV_SECTIONS.items(), key=lambda x: -len(x[0])):
        if nav_url != "/" and page_url.startswith(nav_url):
            return section
    
    return None

def apply_active_state(header_html, active_section):
    """
    Set the 'active' class on the correct nav link in the header.
    Uses the nav link title/text to match the section.
    """
    if not active_section:
        return header_html
    
    # Map section names to the nav-link text/title patterns
    section_patterns = {
        "Home": r'(href="/" class="nav-link")(.*?title="[^"]*Home[^"]*")',
        "Slim Care Medical": r'(class="nav-link"\s+title="Percorsi Slim Care")',
        "Laboratorio": r'(href="/laboratorio/"[^>]*class="nav-link")',
        "Aziende": r'(href="/medicina-del-lavoro/"[^>]*class="nav-link")',
        "Donna & PMA": r'(title="[^"]*Donna[^"]*"[^>]*class="nav-link")',
        "Specialisti": r'(href="/equipe/"[^>]*class="nav-link"|title="[^"]*Specialisti[^"]*"[^>]*class="nav-link")',
        "Medical Shop": r'(href="/shop/"[^>]*class="nav-link")',
        "Salute": r'(href="/salute/"[^>]*class="nav-link")',
        "Contatti": r'(href="/contatti/"[^>]*class="nav-link")',
    }
    
    # Simpler approach: find the nav-link that corresponds to the section
    # and add 'active' to its class
    result = header_html
    
    if active_section == "Home":
        # Special case: home link
        result = re.sub(
            r'(<a\s+href="/"\s+class="nav-link")',
            r'<a href="/" class="nav-link active"',
            result,
            count=1
        )
    elif active_section == "Slim Care Medical":
        result = re.sub(
            r'(title="Percorsi Slim Care"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
        # Also try alternative patterns
        if 'nav-link active' not in result[:2000]:
            result = re.sub(
                r'(>Slim Care Medical</a>)',
                lambda m: m.group(0),
                result
            )
    elif active_section == "Laboratorio":
        result = re.sub(
            r'(href="/laboratorio/"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
    elif active_section == "Contatti":
        result = re.sub(
            r'(href="/contatti/"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
    elif active_section == "Specialisti":
        result = re.sub(
            r'(href="/equipe/"[^>]*class="nav-link"|title="[^"]*(?:Specialità|Specialisti)[^"]*"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
    elif active_section == "Aziende":
        result = re.sub(
            r'(href="/medicina-del-lavoro/"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
    elif active_section == "Donna & PMA":
        result = re.sub(
            r'(title="[^"]*(?:Donna|PMA|Ginecologia)[^"]*"[^>]*class="nav-link")',
            lambda m: m.group(0).replace('class="nav-link"', 'class="nav-link active"'),
            result,
            count=1
        )
    
    return result

def find_html_pages():
    """Find all HTML pages to process."""
    pages = []
    for root, dirs, files in os.walk(SITE_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        
        for f in files:
            if f.endswith('.html') and f not in EXCLUDE_FILES:
                pages.append(Path(root) / f)
    
    return sorted(pages)

def inject_into_page(filepath, header_tmpl, mobile_tmpl, footer_tmpl, dry_run=False):
    """
    Replace a page's inline header/footer with the canonical version.
    Returns: (changed: bool, details: str)
    """
    html = filepath.read_text(encoding="utf-8")
    original = html
    page_url = get_page_url(filepath)
    active = determine_active_section(page_url)
    
    changes = []
    
    # Prepare personalized header
    if header_tmpl:
        personalized_header = apply_active_state(header_tmpl, active)
        
        # Replace existing header
        if '<header class="header">' in html:
            html = re.sub(
                r'<header class="header">.*?</header>',
                personalized_header,
                html,
                count=1,
                flags=re.DOTALL
            )
            changes.append("header:replaced")
    
    # Replace existing mobile nav
    if mobile_tmpl:
        if '<nav class="mobile-nav"' in html:
            html = re.sub(
                r'<nav class="mobile-nav"[^>]*>.*?</nav>',
                mobile_tmpl,
                html,
                count=1,
                flags=re.DOTALL
            )
            changes.append("mobile-nav:replaced")
    
    # Replace existing footer
    if footer_tmpl:
        if '<footer class="footer">' in html:
            html = re.sub(
                r'<footer class="footer">.*?</footer>',
                footer_tmpl,
                html,
                count=1,
                flags=re.DOTALL
            )
            changes.append("footer:replaced")
    
    changed = html != original
    
    if changed and not dry_run:
        filepath.write_text(html, encoding="utf-8")
    
    return changed, ", ".join(changes) if changes else "no changes", active

def cmd_inject(args):
    """Inject canonical components into all pages."""
    dry_run = args.dry_run if hasattr(args, 'dry_run') else False
    
    mode = "DRY RUN" if dry_run else "LIVE"
    print(f"💉 Injecting components into all pages [{mode}]...")
    
    # Load components
    header_path = COMPONENTS_DIR / "header.html"
    mobile_path = COMPONENTS_DIR / "mobile-nav.html"
    footer_path = COMPONENTS_DIR / "footer.html"
    
    header_tmpl = header_path.read_text(encoding="utf-8") if header_path.exists() else None
    mobile_tmpl = mobile_path.read_text(encoding="utf-8") if mobile_path.exists() else None
    footer_tmpl = footer_path.read_text(encoding="utf-8") if footer_path.exists() else None
    
    if not header_tmpl:
        print("  ❌ No header.html component found. Run 'extract' first.")
        return 1
    
    print(f"  📦 Components loaded: header={'✅' if header_tmpl else '❌'}, "
          f"mobile={'✅' if mobile_tmpl else '❌'}, footer={'✅' if footer_tmpl else '❌'}")
    
    pages = find_html_pages()
    print(f"  📄 Found {len(pages)} HTML pages\n")
    
    stats = {"changed": 0, "unchanged": 0, "errors": 0}
    
    for page in pages:
        try:
            changed, details, active = inject_into_page(
                page, header_tmpl, mobile_tmpl, footer_tmpl, dry_run
            )
            rel = page.relative_to(SITE_DIR)
            if changed:
                stats["changed"] += 1
                if args.verbose or dry_run:
                    print(f"  {'🔄' if dry_run else '✅'} {rel} → {details} (section: {active or 'none'})")
            else:
                stats["unchanged"] += 1
        except Exception as e:
            stats["errors"] += 1
            print(f"  ❌ {page.relative_to(SITE_DIR)}: {e}")
    
    print(f"\n📊 Results:")
    print(f"  Changed: {stats['changed']}")
    print(f"  Unchanged: {stats['unchanged']}")
    print(f"  Errors: {stats['errors']}")
    
    if dry_run:
        print(f"\n⚠️  DRY RUN — no files were modified")
    
    return 0


# ============================================================================
# STATS
# ============================================================================

def cmd_stats(args):
    """Show current duplication statistics."""
    print("📊 Component Duplication Analysis\n")
    
    pages = find_html_pages()
    print(f"Total HTML pages: {len(pages)}\n")
    
    header_hashes = {}
    footer_hashes = {}
    no_header = []
    no_footer = []
    
    for page in pages:
        try:
            html = page.read_text(encoding="utf-8")
            rel = str(page.relative_to(SITE_DIR))
            
            header_match = re.search(r'<header class="header">.*?</header>', html, re.DOTALL)
            if header_match:
                h = hashlib.md5(header_match.group(0).encode()).hexdigest()
                header_hashes.setdefault(h, []).append(rel)
            else:
                no_header.append(rel)
            
            footer_match = re.search(r'<footer class="footer">.*?</footer>', html, re.DOTALL)
            if footer_match:
                h = hashlib.md5(footer_match.group(0).encode()).hexdigest()
                footer_hashes.setdefault(h, []).append(rel)
            else:
                no_footer.append(rel)
        except Exception:
            pass
    
    pages_with_header = sum(len(v) for v in header_hashes.values())
    pages_with_footer = sum(len(v) for v in footer_hashes.values())
    
    print(f"Headers:")
    print(f"  Pages with header: {pages_with_header}")
    print(f"  Unique variants: {len(header_hashes)}")
    print(f"  Pages missing header: {len(no_header)}")
    
    print(f"\nFooters:")
    print(f"  Pages with footer: {pages_with_footer}")
    print(f"  Unique variants: {len(footer_hashes)}")
    print(f"  Pages missing footer: {len(no_footer)}")
    
    # Show variant distribution
    if header_hashes:
        print(f"\nHeader variant distribution:")
        for h, files in sorted(header_hashes.items(), key=lambda x: -len(x[1]))[:5]:
            print(f"  {h[:8]}... → {len(files)} pages (e.g. {files[0]})")
    
    return 0


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Bio-Clinic Build-Time Component Injection",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  extract     Extract canonical header/footer/mobile-nav from homepage
  inject      Replace all pages' inline header/footer with canonical version
  stats       Show duplication statistics

Examples:
  python3 build_components.py extract
  python3 build_components.py inject --dry-run --verbose
  python3 build_components.py inject
  python3 build_components.py stats
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # extract
    extract_parser = subparsers.add_parser("extract", help="Extract components from homepage")
    
    # inject
    inject_parser = subparsers.add_parser("inject", help="Inject components into all pages")
    inject_parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    inject_parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed per-page output")
    
    # stats
    stats_parser = subparsers.add_parser("stats", help="Show duplication statistics")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    commands = {
        "extract": cmd_extract,
        "inject": cmd_inject,
        "stats": cmd_stats,
    }
    
    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
