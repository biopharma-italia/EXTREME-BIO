#!/usr/bin/env python3
"""
Bio-Clinic Daily Article Publisher v1.0
Automatically publishes articles from _drafts/ to site/salute/ based on the
editorial calendar date. Designed to run daily via GitHub Actions at 06:00 CET.

Usage:
    python3 scripts/daily-publish.py                      # publish today's articles
    python3 scripts/daily-publish.py --date 2026-02-23    # publish up to a specific date
    python3 scripts/daily-publish.py --dry-run             # preview without changes
    python3 scripts/daily-publish.py --rebuild-hub         # only rebuild hub + sitemap
"""

import csv
import json
import os
import re
import shutil
import sys
import argparse
from datetime import datetime

# ── Paths ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SITE_DIR = os.path.join(ROOT_DIR, "site")
SALUTE_DIR = os.path.join(SITE_DIR, "salute")
DRAFTS_DIR = os.path.join(SALUTE_DIR, "_drafts")
CSV_PATH = os.path.join(ROOT_DIR, "bio-clinic-calendario-90gg.csv")
SITEMAP_PATH = os.path.join(SITE_DIR, "sitemap.xml")
HUB_PATH = os.path.join(SALUTE_DIR, "index.html")

MONTHS_IT = {1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile', 5: 'Maggio', 6: 'Giugno',
             7: 'Luglio', 8: 'Agosto', 9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'}

SPECIALTY_COLORS = {
    'cardiologia': '#E53935',
    'endocrinologia': '#7B1FA2',
    'ginecologia': '#E91E8C',
    'gastroenterologia': '#F57C00',
    'ortopedia': '#00897B',
    'dermatologia': '#5C6BC0',
    'urologia': '#0097A7',
    'neurologia': '#6A1B9A',
    'ematologia': '#C62828',
    'pneumologia': '#0277BD',
    'reumatologia': '#00695C',
    'oculistica': '#1565C0',
    'otorinolaringoiatria': '#AD1457',
    'chirurgia-vascolare': '#D84315',
    'nefrologia': '#4527A0',
    'pediatria': '#2E7D32',
    'nutrizionale': '#558B2F',
    'medicina-interna': '#37474F',
    'psicologia': '#8E24AA',
    'medicina-sport': '#1B5E20',
    'medicina-lavoro': '#455A64',
    'laboratorio': '#1976D2',
}

SPECIALTY_LABELS = {
    'cardiologia': 'Cardiologia',
    'endocrinologia': 'Endocrinologia',
    'ginecologia': 'Ginecologia',
    'gastroenterologia': 'Gastroenterologia',
    'ortopedia': 'Ortopedia',
    'dermatologia': 'Dermatologia',
    'urologia': 'Urologia',
    'neurologia': 'Neurologia',
    'ematologia': 'Ematologia',
    'pneumologia': 'Pneumologia',
    'reumatologia': 'Reumatologia',
    'oculistica': 'Oculistica',
    'otorinolaringoiatria': 'ORL',
    'chirurgia-vascolare': 'Chirurgia Vascolare',
    'nefrologia': 'Nefrologia',
    'pediatria': 'Pediatria',
    'nutrizionale': 'Nutrizione',
    'medicina-interna': 'Medicina Interna',
    'psicologia': 'Psicologia',
    'medicina-sport': 'Medicina Sport',
    'medicina-lavoro': 'Medicina Lavoro',
    'laboratorio': 'Laboratorio',
}


def format_date_it(date_str):
    """2026-02-23 -> 23 Febbraio 2026"""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return f"{d.day} {MONTHS_IT[d.month]} {d.year}"


def load_csv():
    """Load editorial calendar CSV."""
    articles = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            articles.append(row)
    return articles


def get_live_articles():
    """Get list of currently published article slugs."""
    live = []
    for d in sorted(os.listdir(SALUTE_DIR)):
        if d.startswith('_') or d == 'index.html' or not os.path.isdir(os.path.join(SALUTE_DIR, d)):
            continue
        if os.path.exists(os.path.join(SALUTE_DIR, d, 'index.html')):
            live.append(d)
    return live


def get_draft_articles():
    """Get list of draft article slugs."""
    if not os.path.exists(DRAFTS_DIR):
        return []
    return [d for d in sorted(os.listdir(DRAFTS_DIR))
            if os.path.isdir(os.path.join(DRAFTS_DIR, d))
            and os.path.exists(os.path.join(DRAFTS_DIR, d, 'index.html'))]


def publish_article(slug, dry_run=False):
    """Move article from _drafts/ to site/salute/."""
    src = os.path.join(DRAFTS_DIR, slug)
    dst = os.path.join(SALUTE_DIR, slug)

    if not os.path.exists(src):
        print(f"  WARNING: Draft not found: {src}")
        return False

    if os.path.exists(dst):
        print(f"  SKIP: Already published: {slug}")
        return True

    if dry_run:
        print(f"  DRY-RUN: Would publish {slug}")
        return True

    # Copy (not move) so drafts remain for reference / rollback
    shutil.copytree(src, dst)
    print(f"  PUBLISHED: {slug}")
    return True


def update_csv_status(slug, articles, dry_run=False):
    """Mark article as published in CSV."""
    for a in articles:
        if a['Slug'] == slug:
            a['Stato'] = 'published'
    if not dry_run:
        with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=articles[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(articles)


def rebuild_hub_page(articles, today_str):
    """Rebuild site/salute/index.html with all published articles."""
    # Read current hub page
    with open(HUB_PATH, 'r', encoding='utf-8') as f:
        hub_html = f.read()

    # Get all published articles from CSV, sorted by date descending
    published = [a for a in articles if a['Stato'].strip() == 'published']
    published.sort(key=lambda x: x['Data'], reverse=True)

    # Build article cards
    cards = []
    for a in published:
        slug = a['Slug']
        title = a['Titolo']
        specialty = a['Specialita']
        sardinia = a['Angolo_Sardegna']
        date_it = format_date_it(a['Data'])
        color = SPECIALTY_COLORS.get(specialty, '#00704A')
        label = SPECIALTY_LABELS.get(specialty, specialty.title())

        card = f"""        <!-- Article: {slug} -->
        <a href="/salute/{slug}/" class="article-preview">
          <span class="preview-specialty" style="background: {color};">{label}</span>
          <h3>{title}</h3>
          <p class="preview-excerpt">
            {sardinia}
          </p>
          <span class="preview-meta">{date_it} &middot; 12 min lettura</span>
        </a>"""
        cards.append(card)

    cards_html = '\n'.join(cards)

    # Find next planned article
    planned = [a for a in articles if a['Stato'].strip() == 'planned']
    planned.sort(key=lambda x: x['Data'])
    if planned:
        next_article = planned[0]
        next_title = next_article['Titolo']
        next_date = format_date_it(next_article['Data'])
        coming_soon = f"""      <!-- Coming Soon -->
      <div style="margin-top: 2rem; padding: 2rem; background: #f8f9fa; border-radius: 12px; text-align: center;">
        <p style="color: #666; font-size: 0.95em; margin: 0;">
          <strong>Nuovi articoli ogni giorno, dal luned&igrave; al venerd&igrave;.</strong><br>
          Prossima guida: <em>{next_title}</em> &ndash; {next_date}
        </p>
      </div>"""
    else:
        coming_soon = ""

    # Replace between markers
    new_section = f"""      <!-- HUB_ARTICLES_START -->
      <div class="article-grid">
{cards_html}
      </div>
      <!-- HUB_ARTICLES_END -->

{coming_soon}"""

    # Replace content between HUB_ARTICLES_START and the coming soon div
    pattern = r'<!-- HUB_ARTICLES_START -->.*?(?:<!-- Coming Soon -->.*?</div>\s*</div>|<!-- HUB_ARTICLES_END -->)'
    hub_html = re.sub(pattern, new_section, hub_html, flags=re.DOTALL)

    # Update the "Ultimi Articoli" header with count
    hub_html = re.sub(
        r'<h2[^>]*>Ultimi Articoli(?: \(\d+\))?</h2>',
        f'<h2 style="font-family: \'Poppins\', sans-serif; font-size: 1.3em; color: #1a1a1a; margin: 0 0 1.5rem;">Ultimi Articoli ({len(published)})</h2>',
        hub_html
    )

    # Update dateModified in JSON-LD
    hub_html = re.sub(
        r'"dateModified":"[^"]*"',
        f'"dateModified":"{today_str}"',
        hub_html
    )

    # Update E-E-A-T badge date
    dd, mm, yyyy = today_str.split('-')[2], today_str.split('-')[1], today_str.split('-')[0]
    hub_html = re.sub(
        r'Aggiornato: \d{2}/\d{2}/\d{4}',
        f'Aggiornato: {dd}/{mm}/{yyyy}',
        hub_html
    )

    # Update article:modified_time
    hub_html = re.sub(
        r'content="[^"]*T\d{2}:\d{2}:\d{2}\+01:00"',
        f'content="{today_str}T10:00:00+01:00"',
        hub_html,
        count=1
    )

    # Update meta keywords with all specialties
    all_specialties = set()
    for a in published:
        kw = a.get('Keyword', '')
        all_specialties.add(a['Specialita'])
    specialty_kw = ', '.join(sorted(all_specialties))

    with open(HUB_PATH, 'w', encoding='utf-8') as f:
        f.write(hub_html)

    print(f"  HUB: Updated with {len(published)} articles")
    return len(published)


def load_redirected_paths():
    """Return set of source paths that have a redirect rule in site/_redirects.

    URLs with a redirect (301/302) must never be (re)added to the sitemap:
    Google flags them as sitemap warnings."""
    redirects_path = os.path.join(SITE_DIR, "_redirects")
    paths = set()
    if os.path.exists(redirects_path):
        with open(redirects_path, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2 and parts[0].startswith('/'):
                    paths.add(parts[0].rstrip('/'))
    return paths


def update_sitemap(articles, today_str):
    """Add new article URLs to sitemap.xml."""
    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        sitemap = f.read()

    published = [a for a in articles if a['Stato'].strip() == 'published']
    redirected = load_redirected_paths()
    added = 0

    for a in published:
        slug = a['Slug']
        if f"/salute/{slug}" in redirected:
            continue  # URL redirected: must not appear in sitemap
        url = f"https://bio-clinic.it/salute/{slug}/"
        if url not in sitemap:
            # Insert before </urlset>
            new_entry = f"""  <url>
    <loc>{url}</loc>
    <lastmod>{a['Data']}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
"""
            sitemap = sitemap.replace('</urlset>', new_entry + '</urlset>')
            added += 1

    # Update /salute/ hub lastmod
    sitemap = re.sub(
        r'(<loc>https://bio-clinic\.it/salute/</loc>\s*<lastmod>)[^<]*(</lastmod>)',
        f'\\g<1>{today_str}\\2',
        sitemap
    )

    # Update total URL count in comment
    url_count = sitemap.count('<loc>')
    sitemap = re.sub(
        r'<!-- Total URLs: \d+ -->',
        f'<!-- Total URLs: {url_count} -->',
        sitemap
    )

    with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
        f.write(sitemap)

    print(f"  SITEMAP: {added} new URLs added (total: {url_count})")
    return added


def main():
    parser = argparse.ArgumentParser(description="Bio-Clinic Daily Article Publisher")
    parser.add_argument("--date", type=str, help="Override publish date (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    parser.add_argument("--rebuild-hub", action="store_true", help="Only rebuild hub page + sitemap")
    args = parser.parse_args()

    # Determine target date
    if args.date:
        today_str = args.date
    else:
        # Use Europe/Rome timezone
        try:
            from zoneinfo import ZoneInfo
            today_str = datetime.now(ZoneInfo("Europe/Rome")).strftime("%Y-%m-%d")
        except ImportError:
            today_str = datetime.now().strftime("%Y-%m-%d")

    today = datetime.strptime(today_str, "%Y-%m-%d")

    print(f"\n{'=' * 60}")
    print(f"Bio-Clinic Daily Publisher")
    print(f"Date: {today_str} ({format_date_it(today_str)})")
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'LIVE'}")
    print(f"{'=' * 60}\n")

    # Load CSV
    articles = load_csv()
    live = get_live_articles()
    drafts = get_draft_articles()

    print(f"Status: {len(live)} live, {len(drafts)} drafts, {len(articles)} in CSV\n")

    if not args.rebuild_hub:
        # Find articles to publish today (date <= today and not yet live)
        to_publish = []
        for a in articles:
            slug = a['Slug']
            article_date = datetime.strptime(a['Data'], "%Y-%m-%d")
            if article_date <= today and slug not in live and slug in drafts:
                to_publish.append(a)

        if to_publish:
            print(f"Articles to publish ({len(to_publish)}):")
            for a in to_publish:
                print(f"  - {a['Data']} | {a['Slug']} | {a['Specialita']}")

            print()
            published_count = 0
            for a in to_publish:
                if publish_article(a['Slug'], args.dry_run):
                    update_csv_status(a['Slug'], articles, args.dry_run)
                    published_count += 1

            print(f"\nPublished: {published_count} articles")
        else:
            print("No articles to publish today.\n")

    # Rebuild hub page
    print("\nRebuilding hub page...")
    if not args.dry_run:
        rebuild_hub_page(articles, today_str)
    else:
        print("  DRY-RUN: Would rebuild hub page")

    # Update sitemap
    print("Updating sitemap...")
    if not args.dry_run:
        update_sitemap(articles, today_str)
    else:
        print("  DRY-RUN: Would update sitemap")

    # Summary
    live_after = get_live_articles() if not args.dry_run else live
    planned = [a for a in articles if a['Stato'].strip() == 'planned']
    planned.sort(key=lambda x: x['Data'])

    print(f"\n{'=' * 60}")
    print(f"Summary:")
    print(f"  Live articles: {len(live_after)}")
    print(f"  Remaining planned: {len(planned)}")
    if planned:
        print(f"  Next article: {planned[0]['Data']} - {planned[0]['Slug']}")
        print(f"  Last planned: {planned[-1]['Data']} - {planned[-1]['Slug']}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
