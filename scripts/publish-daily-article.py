#!/usr/bin/env python3
"""
Bio-Clinic — Daily Article Publisher
Moves one article from _drafts/ to the live salute/ directory,
updates the CSV status, sitemap.xml, and the /salute/ hub page.
Called by GitHub Actions at 07:00 CET every day (Mon-Fri).
"""

import csv, json, os, sys, shutil, re
from datetime import datetime, date

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
SITE_DIR = os.path.join(ROOT, "site")
DRAFTS_DIR = os.path.join(SITE_DIR, "salute", "_drafts")
CSV_PATH = os.path.join(ROOT, "bio-clinic-calendario-90gg.csv")
SITEMAP_PATH = os.path.join(SITE_DIR, "sitemap.xml")
HUB_PATH = os.path.join(SITE_DIR, "salute", "index.html")

# Specialty badge colours (same as article generator)
SPECIALTY_COLORS = {
    'cardiologia': '#E53935',
    'endocrinologia': '#7B1FA2',
    'ginecologia': '#E91E8C',
    'gastroenterologia': '#EF6C00',
    'dermatologia': '#00897B',
    'ortopedia': '#1565C0',
    'neurologia': '#5E35B1',
    'psicologia': '#8E24AA',
    'pneumologia': '#0277BD',
    'oculistica': '#2E7D32',
    'urologia': '#D84315',
    'reumatologia': '#6A1B9A',
    'otorinolaringoiatria': '#00838F',
    'nutrizione': '#558B2F',
    'ematologia': '#AD1457',
    'nefrologia': '#4527A0',
    'chirurgia': '#C62828',
    'medicina_sport': '#1976D2',
    'medicina_lavoro': '#455A64',
    'pediatria': '#FF8F00',
    'allergologia': '#00695C',
}

MESI_IT = {
    1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
    5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
    9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
}

def get_today():
    """Get today's date, or override from env/arg."""
    if len(sys.argv) > 1:
        return sys.argv[1]
    override = os.environ.get('PUBLISH_DATE', '')
    if override:
        return override
    return date.today().strftime('%Y-%m-%d')

def read_csv():
    articles = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            articles.append(row)
    return articles

def write_csv(articles):
    fieldnames = ['ID','Data','Slug','Keyword','Titolo','Specialita','Angolo_Sardegna','Specialisti','Stato']
    with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for a in articles:
            writer.writerow(a)

def add_to_sitemap(slug, pub_date):
    """Add the article URL to sitemap.xml."""
    if not os.path.exists(SITEMAP_PATH):
        print(f"  ⚠️ Sitemap not found at {SITEMAP_PATH}")
        return
    
    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    url_entry = f"""  <url>
    <loc>https://bio-clinic.it/salute/{slug}/</loc>
    <lastmod>{pub_date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>"""
    
    # Check if already in sitemap
    if f"/salute/{slug}/" in content:
        print(f"  ℹ️ {slug} already in sitemap")
        return
    
    # Insert before </urlset>
    content = content.replace('</urlset>', f'{url_entry}\n</urlset>')
    
    with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Added {slug} to sitemap.xml")

def format_date_it(date_str):
    """Convert YYYY-MM-DD → '19 Febbraio 2026'."""
    d = datetime.strptime(date_str, '%Y-%m-%d')
    return f"{d.day} {MESI_IT[d.month]} {d.year}"

def update_hub_page(articles):
    """Rebuild the article grid inside the /salute/ hub page.

    Uses HTML markers <!-- HUB_ARTICLES_START --> and <!-- HUB_ARTICLES_END -->
    to delimit the replaceable section.
    """
    if not os.path.exists(HUB_PATH):
        print("  ⚠️ Hub page not found, skipping update")
        return

    published = [a for a in articles if a['Stato'] == 'published']
    published.sort(key=lambda x: x['Data'], reverse=True)  # newest first

    # Build article cards HTML
    cards = []
    for art in published:
        slug = art['Slug']
        title = art['Titolo']
        spec = art['Specialita']
        spec_label = spec.replace('_', ' ').title()
        color = SPECIALTY_COLORS.get(spec, '#607D8B')
        excerpt = art.get('Angolo_Sardegna', '')[:160]
        date_it = format_date_it(art['Data'])

        cards.append(f'''        <!-- Article: {slug} -->
        <a href="/salute/{slug}/" class="article-preview">
          <span class="preview-specialty" style="background: {color};">{spec_label}</span>
          <h3>{title}</h3>
          <p class="preview-excerpt">
            {excerpt}
          </p>
          <span class="preview-meta">{date_it} &middot; 12 min lettura</span>
        </a>''')

    grid_html = "\n".join(cards)

    # Find the next planned article
    planned = [a for a in articles if a['Stato'] == 'planned']
    planned.sort(key=lambda x: x['Data'])
    if planned:
        nxt = planned[0]
        coming_soon = (
            f'Prossima guida: <em>{nxt["Titolo"]}</em> '
            f'&ndash; {format_date_it(nxt["Data"])}'
        )
    else:
        coming_soon = 'Tutti gli articoli sono stati pubblicati!'

    new_section = f"""      <!-- HUB_ARTICLES_START -->
      <div class="article-grid">
{grid_html}
      </div>
      <!-- HUB_ARTICLES_END -->

      <!-- Coming Soon -->
      <div style="margin-top: 2rem; padding: 2rem; background: #f8f9fa; border-radius: 12px; text-align: center;">
        <p style="color: #666; font-size: 0.95em; margin: 0;">
          <strong>Nuovi articoli ogni giorno, dal luned&igrave; al venerd&igrave;.</strong><br>
          {coming_soon}
        </p>
      </div>"""

    with open(HUB_PATH, 'r', encoding='utf-8') as f:
        hub = f.read()

    # Replace between markers
    pattern = r'<!-- HUB_ARTICLES_START -->.*?<!-- HUB_ARTICLES_END -->.*?</div>\s*</div>'
    # Use a simpler approach: find the markers and the coming-soon block
    start_marker = '      <!-- HUB_ARTICLES_START -->'
    end_text = '</p>\n      </div>'
    
    start_idx = hub.find('<!-- HUB_ARTICLES_START -->')
    if start_idx == -1:
        print("  ⚠️ HUB_ARTICLES_START marker not found in hub page")
        return
    
    # Find the end of the "Coming Soon" block after HUB_ARTICLES_END
    end_marker_idx = hub.find('<!-- HUB_ARTICLES_END -->', start_idx)
    if end_marker_idx == -1:
        print("  ⚠️ HUB_ARTICLES_END marker not found in hub page")
        return
    
    # Find the closing </div> of the coming-soon section
    coming_end = hub.find('</p>\n      </div>', end_marker_idx)
    if coming_end == -1:
        coming_end = hub.find('</p>\r\n      </div>', end_marker_idx)
    if coming_end == -1:
        print("  ⚠️ Could not find coming-soon section end")
        return
    coming_end += len('</p>\n      </div>')

    # Find the start of the line containing HUB_ARTICLES_START
    line_start = hub.rfind('\n', 0, start_idx)
    if line_start == -1:
        line_start = 0
    else:
        line_start += 1

    hub = hub[:line_start] + new_section + hub[coming_end:]

    with open(HUB_PATH, 'w', encoding='utf-8') as f:
        f.write(hub)

    print(f"  ✅ Updated hub page with {len(published)} articles")

def publish_article(slug, pub_date, title, specialty):
    """Move article from drafts to live directory."""
    src_dir = os.path.join(DRAFTS_DIR, slug)
    dst_dir = os.path.join(SITE_DIR, "salute", slug)
    
    if not os.path.exists(src_dir):
        print(f"  ❌ Draft not found: {src_dir}")
        return False
    
    # Create destination
    os.makedirs(dst_dir, exist_ok=True)
    
    # Copy files
    for fname in os.listdir(src_dir):
        shutil.copy2(os.path.join(src_dir, fname), os.path.join(dst_dir, fname))
    
    # Remove draft
    shutil.rmtree(src_dir)
    
    print(f"  ✅ Published: {slug} → site/salute/{slug}/")
    return True

def main():
    today = get_today()
    print(f"📅 Daily Article Publisher — Date: {today}")
    print("="*50)
    
    articles = read_csv()
    published_today = []
    
    for art in articles:
        if art['Data'] == today and art['Stato'] == 'planned':
            slug = art['Slug']
            title = art['Titolo']
            specialty = art['Specialita']
            
            print(f"\n📄 Publishing: {title}")
            print(f"   Slug: {slug}")
            print(f"   Speciality: {specialty}")
            
            if publish_article(slug, today, title, specialty):
                art['Stato'] = 'published'
                published_today.append(art)
                add_to_sitemap(slug, today)
            else:
                print(f"  ❌ Failed to publish {slug}")
    
    if published_today:
        write_csv(articles)
        update_hub_page(articles)
        print(f"\n{'='*50}")
        print(f"✅ Published {len(published_today)} article(s) for {today}")
        for a in published_today:
            print(f"   - {a['Titolo']} ({a['Slug']})")
    else:
        print(f"\nℹ️ No articles scheduled for {today}")
        # Check next scheduled
        upcoming = [a for a in articles if a['Stato'] == 'planned']
        if upcoming:
            upcoming.sort(key=lambda x: x['Data'])
            print(f"   Next scheduled: {upcoming[0]['Data']} — {upcoming[0]['Titolo']}")
    
    return len(published_today)

if __name__ == '__main__':
    count = main()
    sys.exit(0 if count >= 0 else 1)
