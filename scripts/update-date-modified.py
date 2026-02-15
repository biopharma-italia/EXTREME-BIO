#!/usr/bin/env python3
"""
A5: Auto-update dateModified across all Bio-Clinic pages.
Designed to run every 2 days via GitHub Actions or before deploy.

Updates 3 locations per page:
1. JSON-LD: "dateModified" field on the main content node
2. Meta tag: <meta property="article:modified_time">
3. Visible badge: "Aggiornato: DD/MM/YYYY" text (adds badge if missing)

Usage:
    python3 scripts/update-date-modified.py [--date YYYY-MM-DD] [--dry-run]
"""

import os
import re
import json
import sys
import argparse
from datetime import datetime, timezone, timedelta

SITE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")
SKIP_SLUGS = {"cookie", "privacy"}

# Italian timezone (CET/CEST)
IT_TZ = timezone(timedelta(hours=1))

# The visible trust badge HTML (green checkmark + text)
TRUST_BADGE_TEMPLATE = """    <section class="trust-badge-datemodified" style="padding: 1.5rem 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <div class="container">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap; text-align: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style="color: #166534; font-size: 0.9rem;">
            <strong>Informazioni verificate dall&apos;\u00e9quipe medica Bio-Clinic</strong> &bull;
            Aggiornato: {date_it} &bull;
            <a href="/equipe/salvatore-dessole/" style="color: #166534; text-decoration: underline;">Dir. Sanitario: Prof. S. Dessole</a>
          </span>
        </div>
      </div>
    </section>"""

# Pages where a visible badge does NOT make sense
NO_BADGE_SLUGS = {
    "cookie", "privacy", "contatti", "convenzioni", "equipe",
    "listino", "prestazioni", "shop", "specialita", "symptom-checker",
    "chi-siamo", "preparazione-esami", "index.html"
}


def format_date_iso(date_str):
    """Return ISO 8601 date: YYYY-MM-DD"""
    return date_str


def format_date_iso_full(date_str):
    """Return ISO 8601 datetime: YYYY-MM-DDT10:00:00+01:00"""
    return f"{date_str}T10:00:00+01:00"


def format_date_it(date_str):
    """Return Italian date: DD/MM/YYYY"""
    parts = date_str.split("-")
    return f"{parts[2]}/{parts[1]}/{parts[0]}"


def update_jsonld(html, date_iso):
    """Update dateModified in JSON-LD schema."""
    pattern = r'(<script type="application/ld\+json">)(.*?)(</script>)'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        return html, False

    json_str = match.group(2)
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        return html, False

    graph = data.get("@graph", [data])
    modified = False

    # Target node types for dateModified (priority order)
    target_types = [
        "MedicalWebPage", "WebPage", "AboutPage",
        "MedicalClinic", "LocalBusiness", "MedicalOrganization", "Organization",
        "MedicalTherapy", "MedicalProcedure", "MedicalTest",
        "ItemList", "Store"
    ]

    target = None
    for t in target_types:
        for node in graph:
            nt = node.get("@type", "")
            types = nt if isinstance(nt, list) else [nt]
            if t in types:
                target = node
                break
        if target:
            break

    if target is None:
        # Fallback: first non-BreadcrumbList, non-FAQPage node
        for node in graph:
            nt = node.get("@type", "")
            types = nt if isinstance(nt, list) else [nt]
            if "BreadcrumbList" not in types and "FAQPage" not in types and "ListItem" not in types:
                target = node
                break

    if target is None:
        return html, False

    old_dm = target.get("dateModified")
    target["dateModified"] = date_iso
    if old_dm != date_iso:
        modified = True

    if modified:
        if "@graph" in data:
            data["@graph"] = graph
        new_json = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        old_block = match.group(0)
        new_block = f'<script type="application/ld+json">{new_json}</script>'
        html = html.replace(old_block, new_block, 1)

    return html, modified


def update_meta_tag(html, date_iso_full):
    """Add or update <meta property="article:modified_time">."""
    modified = False

    # Check if tag exists
    meta_pattern = r'<meta\s+property="article:modified_time"\s+content="[^"]*"\s*/?>'
    if re.search(meta_pattern, html):
        new_tag = f'<meta property="article:modified_time" content="{date_iso_full}">'
        html_new = re.sub(meta_pattern, new_tag, html)
        if html_new != html:
            modified = True
        html = html_new
    else:
        # Insert after og:type or og:url or og:title, or before </head>
        insert_patterns = [
            (r'(<meta\s+property="og:type"\s+content="[^"]*"\s*/?>)', r'\1\n    <meta property="article:modified_time" content="' + date_iso_full + '">'),
            (r'(<meta\s+property="og:url"\s+content="[^"]*"\s*/?>)', r'\1\n    <meta property="article:modified_time" content="' + date_iso_full + '">'),
            (r'(</head>)', '    <meta property="article:modified_time" content="' + date_iso_full + '">\n    \\1'),
        ]
        for pat, repl in insert_patterns:
            if re.search(pat, html):
                html = re.sub(pat, repl, html, count=1)
                modified = True
                break

    return html, modified


def update_visible_badge(html, date_it, slug):
    """Update existing Aggiornato date or inject new trust badge."""
    modified = False

    # Determine slug base (e.g., "cardiologia/checkup" -> "cardiologia/checkup")
    slug_base = slug.split("/")[0] if "/" in slug else slug

    # Skip pages where visible badge is not appropriate
    if slug in NO_BADGE_SLUGS or slug_base in {"equipe"}:
        return html, False

    # Pattern 1: Update existing "Aggiornato: DD/MM/YYYY"
    aggiornato_pattern = r'Aggiornato:\s*\d{2}/\d{2}/\d{4}'
    if re.search(aggiornato_pattern, html):
        html_new = re.sub(aggiornato_pattern, f'Aggiornato: {date_it}', html)
        if html_new != html:
            modified = True
        return html_new, modified

    # Pattern 2: Page has no visible badge — inject one before the last </section> before footer
    # Find the best insertion point: before the footer or before </main>
    # Strategy: insert before the footer section (usually identifiable)
    footer_patterns = [
        r'(\n\s*<footer)',                        # Before <footer>
        r'(\n\s*<!--\s*Footer\s*-->)',            # Before footer comment
        r'(\n\s*<section[^>]*class="[^"]*footer)',  # Before footer section
    ]

    for fp in footer_patterns:
        if re.search(fp, html, re.IGNORECASE):
            badge = TRUST_BADGE_TEMPLATE.format(date_it=date_it)
            html = re.sub(fp, f'\n{badge}\n\\1', html, count=1, flags=re.IGNORECASE)
            modified = True
            return html, modified

    # Fallback: insert before </body>
    if '</body>' in html:
        badge = TRUST_BADGE_TEMPLATE.format(date_it=date_it)
        html = html.replace('</body>', f'{badge}\n</body>', 1)
        modified = True

    return html, modified


def process_file(filepath, date_iso, date_iso_full, date_it, dry_run=False):
    """Process a single HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip meta-refresh pages
    if 'http-equiv="refresh"' in html:
        return "skip-refresh", {}

    slug = filepath.replace(SITE_DIR + "/", "").replace("/index.html", "")

    changes = {}

    # 1. Update JSON-LD
    html, c1 = update_jsonld(html, date_iso)
    if c1:
        changes["jsonld"] = True

    # 2. Update meta tag
    html, c2 = update_meta_tag(html, date_iso_full)
    if c2:
        changes["meta"] = True

    # 3. Update visible badge
    html, c3 = update_visible_badge(html, date_it, slug)
    if c3:
        changes["badge"] = True

    if changes and not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

    return "modified" if changes else "unchanged", changes


def main():
    parser = argparse.ArgumentParser(description="Update dateModified on all Bio-Clinic pages")
    parser.add_argument("--date", type=str, default=None,
                        help="Date to set (YYYY-MM-DD). Defaults to today.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Don't write files, just report what would change")
    parser.add_argument("--site-dir", type=str, default=None,
                        help="Override site directory path")
    args = parser.parse_args()

    global SITE_DIR
    if args.site_dir:
        SITE_DIR = args.site_dir

    if args.date:
        date_iso = args.date
    else:
        now = datetime.now(IT_TZ)
        date_iso = now.strftime("%Y-%m-%d")

    date_iso_full = format_date_iso_full(date_iso)
    date_it = format_date_it(date_iso)

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Updating dateModified to: {date_iso}")
    print(f"  ISO full: {date_iso_full}")
    print(f"  Italian:  {date_it}")
    print(f"  Site dir: {SITE_DIR}")
    print()

    total = 0
    modified = 0
    stats = {"jsonld": 0, "meta": 0, "badge": 0}
    skipped = {}

    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in ("backups", "output", "templates", "pages", "node_modules")]

        if "index.html" in files:
            filepath = os.path.join(root, "index.html")
            slug = filepath.replace(SITE_DIR + "/", "").replace("/index.html", "")

            if slug in SKIP_SLUGS:
                continue

            total += 1
            result, changes = process_file(filepath, date_iso, date_iso_full, date_it, args.dry_run)

            if result == "modified":
                modified += 1
                parts = []
                for k in ("jsonld", "meta", "badge"):
                    if k in changes:
                        stats[k] += 1
                        parts.append(k)
                print(f"  {'[DRY] ' if args.dry_run else ''}✅ {slug} ({', '.join(parts)})")
            elif result == "skip-refresh":
                skipped.setdefault(result, []).append(slug)

    print(f"\n{'='*60}")
    print(f"Date: {date_iso} ({date_it})")
    print(f"Total pages: {total}")
    print(f"Modified: {modified}")
    print(f"  JSON-LD dateModified: {stats['jsonld']}")
    print(f"  Meta article:modified_time: {stats['meta']}")
    print(f"  Visible badge: {stats['badge']}")
    print(f"Skipped (meta-refresh): {len(skipped.get('skip-refresh', []))}")

    # Always return 0 (success) — even if no changes needed (idempotent)
    return 0


if __name__ == "__main__":
    sys.exit(main())
