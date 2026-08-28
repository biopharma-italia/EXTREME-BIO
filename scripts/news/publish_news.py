#!/usr/bin/env python3
"""
Bio-Clinic News Publisher v1.0
Pubblica notizie da site/news/_drafts/<slug>/ a site/news/<slug>/ in base alla
data di pubblicazione, rigenera l'hub /news/ e la news-sitemap.xml
(solo articoli delle ultime 48 ore, requisito Google News).

Ogni bozza è una directory con:
  article.json  — metadati (title, description, category, publish_date ISO,
                  author, reviewer opzionale, tags, image opzionale)
  body.html     — corpo dell'articolo (HTML puro, senza header/footer)

Usage:
    python3 scripts/news/publish_news.py                    # pubblica le bozze scadute
    python3 scripts/news/publish_news.py --date 2026-09-21  # come se fosse quella data
    python3 scripts/news/publish_news.py --dry-run
    python3 scripts/news/publish_news.py --rebuild           # solo hub + sitemap
"""

import argparse
import html
import json
import os
import re
import shutil
import sys
from datetime import datetime, timedelta, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
SITE_DIR = os.path.join(ROOT_DIR, "site")
NEWS_DIR = os.path.join(SITE_DIR, "news")
DRAFTS_DIR = os.path.join(NEWS_DIR, "_drafts")
NEWS_SITEMAP = os.path.join(SITE_DIR, "news-sitemap.xml")
MAIN_SITEMAP = os.path.join(SITE_DIR, "sitemap.xml")

BASE_URL = "https://bio-clinic.it"
PUBLICATION_NAME = "Bio-Clinic News"
DEFAULT_IMAGE = f"{BASE_URL}/images/reception-bioclinic.jpg"

MONTHS_IT = {1: 'gennaio', 2: 'febbraio', 3: 'marzo', 4: 'aprile', 5: 'maggio',
             6: 'giugno', 7: 'luglio', 8: 'agosto', 9: 'settembre',
             10: 'ottobre', 11: 'novembre', 12: 'dicembre'}

CATEGORY_COLORS = {
    'prevenzione': '#00704A',
    'giornate-mondiali': '#1565C0',
    'novita-clinica': '#7B1FA2',
    'salute-sardegna': '#E53935',
    'campagne': '#F57C00',
}
CATEGORY_LABELS = {
    'prevenzione': 'Prevenzione',
    'giornate-mondiali': 'Giornate Mondiali',
    'novita-clinica': 'Novità dalla Clinica',
    'salute-sardegna': 'Salute in Sardegna',
    'campagne': 'Campagne',
}


def read_file(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def rome_offset(dt):
    """Offset Europe/Rome semplificato (CEST ultima dom. marzo → ultima dom. ottobre)."""
    y = dt.year
    def last_sunday(month):
        d = datetime(y, month + 1, 1) - timedelta(days=1) if month < 12 else datetime(y, 12, 31)
        while d.weekday() != 6:
            d -= timedelta(days=1)
        return d
    dst_start = last_sunday(3).replace(hour=2)
    dst_end = last_sunday(10).replace(hour=3)
    return "+02:00" if dst_start <= dt < dst_end else "+01:00"


def format_date_it(iso):
    dt = datetime.fromisoformat(iso.split('+')[0])
    return f"{dt.day} {MONTHS_IT[dt.month]} {dt.year}"


def load_draft(slug):
    d = os.path.join(DRAFTS_DIR, slug)
    meta = json.loads(read_file(os.path.join(d, 'article.json')))
    body = read_file(os.path.join(d, 'body.html'))
    meta['slug'] = slug
    return meta, body


def get_live_articles():
    """Articoli già pubblicati (directory in news/ con article.json accanto)."""
    out = []
    if not os.path.isdir(NEWS_DIR):
        return out
    for name in os.listdir(NEWS_DIR):
        p = os.path.join(NEWS_DIR, name)
        if name.startswith('_') or not os.path.isdir(p):
            continue
        mp = os.path.join(p, 'article.json')
        if os.path.exists(mp):
            meta = json.loads(read_file(mp))
            meta['slug'] = name
            out.append(meta)
    out.sort(key=lambda a: a['publish_date'], reverse=True)
    return out


def esc(s):
    return html.escape(s, quote=True)


def render_article(meta, body):
    header = read_file(os.path.join(SCRIPT_DIR, 'header.html'))
    footer = read_file(os.path.join(SCRIPT_DIR, 'footer.html'))
    slug = meta['slug']
    url = f"{BASE_URL}/news/{slug}/"
    title = meta['title']
    desc = meta['description']
    cat = meta.get('category', 'prevenzione')
    cat_label = CATEGORY_LABELS.get(cat, cat.title())
    cat_color = CATEGORY_COLORS.get(cat, '#00704A')
    pub = meta['publish_date']  # ISO con offset
    mod = meta.get('modified_date', pub)
    author = meta.get('author', {"name": "Redazione Bio-Clinic", "url": f"{BASE_URL}/chi-siamo/"})
    image = meta.get('image', DEFAULT_IMAGE)
    tags = meta.get('tags', [])
    date_it = format_date_it(pub)

    reviewer = meta.get('reviewer')
    reviewer_json = ""
    reviewer_html = ""
    if reviewer:
        reviewer_json = f''',"reviewedBy":{{"@type":"Person","name":{json.dumps(reviewer["name"])},"jobTitle":{json.dumps(reviewer.get("jobTitle",""))},"url":{json.dumps(reviewer.get("url",""))}}}'''
        reviewer_html = f'<span class="news-reviewer">Revisione medica: <a href="{esc(reviewer.get("url","#"))}">{esc(reviewer["name"])}</a></span>'

    keywords_meta = ", ".join(tags) if tags else cat_label

    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "NewsArticle",
                "@id": url,
                "url": url,
                "headline": title,
                "description": desc,
                "image": [image],
                "datePublished": pub,
                "dateModified": mod,
                "inLanguage": "it-IT",
                "isAccessibleForFree": True,
                "author": [{"@type": "Person" if author.get("type", "Person") == "Person" else "Organization",
                            "name": author["name"], "url": author.get("url", BASE_URL)}],
                "publisher": {
                    "@type": "Organization",
                    "@id": f"{BASE_URL}/#organization",
                    "name": "Bio-Clinic Sassari",
                    "url": BASE_URL,
                    "logo": {"@type": "ImageObject", "url": f"{BASE_URL}/images/logo-bioclinic.png"}
                },
                "mainEntityOfPage": {"@type": "WebPage", "@id": url},
                "articleSection": cat_label,
                "keywords": keywords_meta,
                "about": {"@type": "MedicalOrganization", "name": "Bio-Clinic Sassari"}
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
                    {"@type": "ListItem", "position": 2, "name": "News", "item": f"{BASE_URL}/news/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": url}
                ]
            }
        ]
    }
    schema_json = json.dumps(schema, ensure_ascii=False)
    if reviewer_json:
        schema_json = schema_json.replace('"mainEntityOfPage"', reviewer_json[1:] + ',"mainEntityOfPage"', 1)

    tags_html = "".join(f'<span class="news-tag">{esc(t)}</span>' for t in tags)

    page = f'''<!DOCTYPE html>
<html lang="it">
<head>
<!-- Google Consent Mode v2 (MUST fire before GTM) -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){{dataLayer.push(arguments);}}
gtag('consent', 'default', {{
  'ad_storage': 'denied','ad_user_data': 'denied','ad_personalization': 'denied',
  'analytics_storage': 'denied','functionality_storage': 'granted',
  'personalization_storage': 'denied','security_storage': 'granted','wait_for_update': 500
}});
gtag('consent', 'default', {{'ad_storage': 'denied','ad_user_data': 'denied','ad_personalization': 'denied','analytics_storage': 'denied','region': ['IT', 'EU']}});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-PWZWX5RS');</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#00704A">
  <meta name="description" content="{esc(desc)}">
  <meta name="keywords" content="{esc(keywords_meta)}">
  <meta name="news_keywords" content="{esc(keywords_meta)}">
  <title>{esc(title)} | Bio-Clinic News</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css?v=20260826-hero">
  <link rel="stylesheet" href="/css/salute.css?v=20260218-v1">
  <link rel="stylesheet" href="/css/news.css?v=1">
  <link rel="stylesheet" href="/css/bio-search.css?v=20260222-v8">
  <link rel="canonical" href="{url}">
  <!-- Open Graph -->
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:type" content="article">
  <meta property="article:published_time" content="{pub}">
  <meta property="article:modified_time" content="{mod}">
  <meta property="article:section" content="{esc(cat_label)}">
  <meta property="og:image" content="{esc(image)}">
  <meta property="og:url" content="{url}">
  <meta property="og:site_name" content="Bio-Clinic Sassari">
  <meta property="og:locale" content="it_IT">
  <link rel="stylesheet" href="/css/header-spacing-fix.css?v=1769644194">
<style>
body{{padding-top:100px!important;margin:0!important}}
.header{{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9999!important;background:#fff!important;box-shadow:0 2px 10px rgba(0,0,0,0.1)!important}}
</style>
<script type="application/ld+json">{schema_json}</script>
<script>
window.bcDataLayer = {{"page_type": "news_article", "content_group": "news_{cat}", "funnel_stage": "awareness"}};
</script>
<script src="/js/cge-tracking.js?v=CGE_v4_20260217" defer></script>
</head>
<body>
<a href="#main-content" class="skip-link">Vai al contenuto principale</a>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

{header}

<main id="main-content" class="news-article-page">
  <div class="container">
    <nav class="breadcrumb" aria-label="Percorso">
      <a href="/">Home</a> › <a href="/news/">News</a> › <span>{esc(title)}</span>
    </nav>

    <article class="news-article">
      <header class="news-article-header">
        <span class="news-category" style="background:{cat_color}">{esc(cat_label)}</span>
        <h1>{esc(title)}</h1>
        <p class="news-standfirst">{esc(desc)}</p>
        <div class="news-byline">
          <span class="news-author">Di <a href="{esc(author.get('url', BASE_URL))}">{esc(author['name'])}</a></span>
          <time datetime="{pub}" class="news-date">{date_it}</time>
          {reviewer_html}
        </div>
      </header>

      <div class="news-body">
{body}
      </div>

      <footer class="news-article-footer">
        <div class="news-tags">{tags_html}</div>
        <div class="news-cta">
          <h2>Prenota a Bio-Clinic Sassari</h2>
          <p>Via Renzo Mossa 23, Sassari — Laboratorio ad accesso diretto lun-ven 07:00-20:30, sab 08:00-14:00.</p>
          <a href="tel:+390799561332" class="btn btn-primary">📞 079 956 1332</a>
          <a href="/contatti/" class="btn btn-secondary">Prenota online</a>
        </div>
      </footer>
    </article>

    <aside class="news-more">
      <h2>Altre notizie</h2>
      <p><a href="/news/">← Tutte le news di Bio-Clinic</a> · <a href="/salute/">Guide alla salute</a></p>
    </aside>
  </div>
</main>

{footer}

<script src="/js/main.js?v=20260222-contact" defer></script>
<script src="/js/search-engine-v4.js?v=20260216-v5" defer></script>
<script src="/js/search-ui-v4.js?v=20260216-v5" defer></script>
<script type="text/javascript" src="https://cs.iubenda.com/autoblocking/3313232.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/gpp/stub.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/iubenda_cs.js" charset="UTF-8" async></script>
</body>
</html>
'''
    return page


def rebuild_hub(articles):
    cards = []
    for a in articles[:60]:
        cat = a.get('category', 'prevenzione')
        cards.append(f'''      <a class="news-card" href="/news/{a['slug']}/">
        <span class="news-category" style="background:{CATEGORY_COLORS.get(cat, '#00704A')}">{esc(CATEGORY_LABELS.get(cat, cat.title()))}</span>
        <h2>{esc(a['title'])}</h2>
        <p>{esc(a['description'])}</p>
        <time datetime="{a['publish_date']}">{format_date_it(a['publish_date'])}</time>
      </a>''')
    cards_html = "\n".join(cards) if cards else '      <p class="news-empty">Le prime notizie saranno pubblicate a breve.</p>'

    items_ld = [{"@type": "ListItem", "position": i + 1, "url": f"{BASE_URL}/news/{a['slug']}/"}
                for i, a in enumerate(articles[:30])]
    schema = json.dumps({
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "CollectionPage", "@id": f"{BASE_URL}/news/", "url": f"{BASE_URL}/news/",
             "name": "Bio-Clinic News — Notizie di salute e prevenzione da Sassari",
             "description": "Notizie, campagne di prevenzione, giornate mondiali della salute e novità da Bio-Clinic Sassari.",
             "inLanguage": "it-IT",
             "publisher": {"@id": f"{BASE_URL}/#organization"},
             "mainEntity": {"@type": "ItemList", "itemListElement": items_ld}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
                {"@type": "ListItem", "position": 2, "name": "News", "item": f"{BASE_URL}/news/"}]}
        ]
    }, ensure_ascii=False)

    header = read_file(os.path.join(SCRIPT_DIR, 'header.html'))
    footer = read_file(os.path.join(SCRIPT_DIR, 'footer.html'))

    hub = f'''<!DOCTYPE html>
<html lang="it">
<head>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){{dataLayer.push(arguments);}}
gtag('consent', 'default', {{'ad_storage': 'denied','ad_user_data': 'denied','ad_personalization': 'denied','analytics_storage': 'denied','functionality_storage': 'granted','personalization_storage': 'denied','security_storage': 'granted','wait_for_update': 500}});
gtag('consent', 'default', {{'ad_storage': 'denied','ad_user_data': 'denied','ad_personalization': 'denied','analytics_storage': 'denied','region': ['IT', 'EU']}});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
</script>
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-PWZWX5RS');</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#00704A">
  <meta name="description" content="Bio-Clinic News: notizie di salute, campagne di prevenzione, giornate mondiali e novità dal poliambulatorio Bio-Clinic di Sassari.">
  <title>News e Notizie di Salute | Bio-Clinic Sassari</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css?v=20260826-hero">
  <link rel="stylesheet" href="/css/salute.css?v=20260218-v1">
  <link rel="stylesheet" href="/css/news.css?v=1">
  <link rel="stylesheet" href="/css/bio-search.css?v=20260222-v8">
  <link rel="canonical" href="{BASE_URL}/news/">
  <meta property="og:title" content="News e Notizie di Salute | Bio-Clinic Sassari">
  <meta property="og:description" content="Notizie di salute, prevenzione e novità da Bio-Clinic Sassari.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{DEFAULT_IMAGE}">
  <meta property="og:url" content="{BASE_URL}/news/">
  <meta property="og:site_name" content="Bio-Clinic Sassari">
  <meta property="og:locale" content="it_IT">
  <link rel="stylesheet" href="/css/header-spacing-fix.css?v=1769644194">
<style>
body{{padding-top:100px!important;margin:0!important}}
.header{{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9999!important;background:#fff!important;box-shadow:0 2px 10px rgba(0,0,0,0.1)!important}}
</style>
<script type="application/ld+json">{schema}</script>
<script>
window.bcDataLayer = {{"page_type": "news_hub", "content_group": "news", "funnel_stage": "awareness"}};
</script>
<script src="/js/cge-tracking.js?v=CGE_v4_20260217" defer></script>
</head>
<body>
<a href="#main-content" class="skip-link">Vai al contenuto principale</a>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

{header}

<main id="main-content" class="news-hub-page">
  <div class="container">
    <header class="news-hub-header">
      <h1>Bio-Clinic News</h1>
      <p>Notizie di salute, campagne di prevenzione, giornate mondiali e novità dal nostro poliambulatorio di Sassari.</p>
    </header>
    <section class="news-grid" aria-label="Ultime notizie">
{cards_html}
    </section>
    <aside class="news-more">
      <p>Cerchi guide mediche approfondite? Visita la <a href="/salute/">Guida alla Salute</a>.</p>
    </aside>
  </div>
</main>

{footer}

<script src="/js/main.js?v=20260222-contact" defer></script>
<script src="/js/search-engine-v4.js?v=20260216-v5" defer></script>
<script src="/js/search-ui-v4.js?v=20260216-v5" defer></script>
<script type="text/javascript" src="https://cs.iubenda.com/autoblocking/3313232.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/gpp/stub.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/iubenda_cs.js" charset="UTF-8" async></script>
</body>
</html>
'''
    write_file(os.path.join(NEWS_DIR, 'index.html'), hub)


def rebuild_news_sitemap(articles, now):
    """News sitemap: SOLO articoli pubblicati nelle ultime 48h (requisito Google News)."""
    cutoff = now - timedelta(hours=48)
    entries = []
    for a in articles:
        pub_dt = datetime.fromisoformat(a['publish_date'])
        if pub_dt.tzinfo is None:
            pub_dt = pub_dt.replace(tzinfo=timezone.utc)
        if pub_dt >= cutoff:
            kw = ", ".join(a.get('tags', [])[:6])
            entries.append(f'''  <url>
    <loc>{BASE_URL}/news/{a['slug']}/</loc>
    <news:news>
      <news:publication>
        <news:name>{PUBLICATION_NAME}</news:name>
        <news:language>it</news:language>
      </news:publication>
      <news:publication_date>{a['publish_date']}</news:publication_date>
      <news:title>{html.escape(a['title'])}</news:title>
      <news:keywords>{html.escape(kw)}</news:keywords>
    </news:news>
  </url>''')
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
{chr(10).join(entries)}
</urlset>
'''
    write_file(NEWS_SITEMAP, xml)
    # Alias: /sitemap-news.xml — workaround per lo stato "Impossibile
    # recuperare" che GSC pu\u00f2 tenere in cache sul primo URL inviato.
    write_file(os.path.join(SITE_DIR, "sitemap-news.xml"), xml)
    return len(entries)


def add_to_main_sitemap(slug, pub_iso):
    """Aggiunge l'URL alla sitemap principale (per l'indicizzazione standard)."""
    sm = read_file(MAIN_SITEMAP)
    url = f"{BASE_URL}/news/{slug}/"
    if url in sm:
        return
    entry = f'''  <url>
    <loc>{url}</loc>
    <lastmod>{pub_iso[:10]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>'''
    sm = sm.replace('</urlset>', entry)
    write_file(MAIN_SITEMAP, sm)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--date', default=None, help='YYYY-MM-DD (default: oggi Roma)')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--rebuild', action='store_true', help='solo hub + sitemap')
    args = ap.parse_args()

    now_utc = datetime.now(timezone.utc)
    offset = rome_offset(now_utc.replace(tzinfo=None) + timedelta(hours=1))
    oh, om = int(offset[1:3]), int(offset[4:6])
    now_rome = now_utc + timedelta(hours=oh, minutes=om) if offset[0] == '+' else now_utc
    today = args.date or now_rome.strftime('%Y-%m-%d')

    published = []
    if not args.rebuild and os.path.isdir(DRAFTS_DIR):
        for slug in sorted(os.listdir(DRAFTS_DIR)):
            dp = os.path.join(DRAFTS_DIR, slug)
            if not os.path.isdir(dp) or not os.path.exists(os.path.join(dp, 'article.json')):
                continue
            meta, body = load_draft(slug)
            if meta['publish_date'][:10] <= today:
                if args.dry_run:
                    print(f"DRY-RUN would publish: {slug} ({meta['publish_date'][:10]})")
                    continue
                out_dir = os.path.join(NEWS_DIR, slug)
                os.makedirs(out_dir, exist_ok=True)
                write_file(os.path.join(out_dir, 'index.html'), render_article(meta, body))
                write_file(os.path.join(out_dir, 'article.json'), json.dumps(meta, ensure_ascii=False, indent=2))
                shutil.rmtree(dp)
                add_to_main_sitemap(slug, meta['publish_date'])
                published.append(slug)
                print(f"PUBLISHED: {slug}")

    articles = get_live_articles()
    rebuild_hub(articles)
    n = rebuild_news_sitemap(articles, now_utc)
    print(f"Hub rebuilt: {len(articles)} articles live; news-sitemap: {n} fresh (<48h)")
    if not published and not args.rebuild:
        print("No drafts due for publication.")


if __name__ == '__main__':
    main()
