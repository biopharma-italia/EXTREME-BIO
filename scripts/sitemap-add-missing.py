#!/usr/bin/env python3
"""Aggiunge a site/sitemap.xml le pagine canoniche mancanti (audit 2026-09-07, P1.5).

Criteri di inclusione (prudenti):
  - esiste site/<path>/index.html deployabile (non in dir escluse dal deploy)
  - la pagina e' SELF-CANONICAL (link rel=canonical che punta a se stessa)
  - la pagina NON ha meta robots noindex
  - l'URL non e' gia' presente in sitemap
  - l'URL NON e' sorgente di un redirect in site/_redirects (il redirect
    vince sul file statico su Cloudflare Pages)

Uso: python3 scripts/sitemap-add-missing.py [--dry-run]
Exit: 0 ok, 1 errore
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = REPO / "site"
SITEMAP = SITE / "sitemap.xml"
BASE = "https://bio-clinic.it"

# Directory mai deployate (allineate a deploy-cloudflare.sh)
EXCLUDED_TOP = {
    "output", "backups", "build", "docs", "templates", "pages",
    "node_modules", "data",
}


def url_for(index_html: Path) -> str:
    rel = index_html.parent.relative_to(SITE)
    if str(rel) == ".":
        return f"{BASE}/"
    return f"{BASE}/{rel.as_posix()}/"


def is_excluded(index_html: Path) -> bool:
    parts = index_html.relative_to(SITE).parts
    if parts and parts[0] in EXCLUDED_TOP:
        return True
    return any(p == "_drafts" for p in parts)


def page_meta(html: str):
    """Ritorna (canonical_url|None, noindex: bool)."""
    canon = None
    m = re.search(
        r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', html, re.I
    ) or re.search(
        r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', html, re.I
    )
    if m:
        canon = m.group(1).strip().rstrip()
    noindex = bool(re.search(
        r'<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', html, re.I
    ))
    return canon, noindex


def redirect_sources() -> set:
    """Path sorgente dei redirect in site/_redirects (normalizzati con '/')."""
    src = set()
    redirects = SITE / "_redirects"
    if not redirects.exists():
        return src
    for line in redirects.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            p = parts[0]
            src.add(p if p.endswith("/") else p + "/")
            src.add(p.rstrip("/") + "/")
    return src


def main() -> int:
    dry = "--dry-run" in sys.argv
    xml = SITEMAP.read_text(encoding="utf-8")
    existing = set(re.findall(r"<loc>([^<]+)</loc>", xml))
    redirected = redirect_sources()

    additions = []
    skipped_non_canonical = 0
    for idx in sorted(SITE.rglob("index.html")):
        if is_excluded(idx):
            continue
        url = url_for(idx)
        if url in existing:
            continue
        # Skip pagine il cui path e' sorgente di un redirect (mai servite)
        if url.replace(BASE, "") in redirected:
            continue
        try:
            html = idx.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        canon, noindex = page_meta(html)
        if noindex:
            continue
        # self-canonical: canonical assente e' ambiguo -> skip prudente
        if not canon:
            skipped_non_canonical += 1
            continue
        canon_norm = canon.rstrip("/") + "/"
        if canon_norm != url:
            skipped_non_canonical += 1
            continue
        additions.append(url)

    print(f"URL in sitemap: {len(existing)}")
    print(f"Pagine canoniche mancanti da aggiungere: {len(additions)}")
    print(f"Scartate (non self-canonical/senza canonical): {skipped_non_canonical}")
    for u in additions[:10]:
        print(f"  + {u}")
    if len(additions) > 10:
        print(f"  ... e altre {len(additions) - 10}")

    if not additions:
        return 0
    if dry:
        print("(dry-run: nessuna modifica)")
        return 0

    entries = []
    for u in sorted(additions):
        # priorita' 0.6 come le altre pagine procedura/servizio
        entries.append(
            "  <url>\n"
            f"    <loc>{u}</loc>\n"
            "    <lastmod>2026-09-08</lastmod>\n"
            "    <changefreq>monthly</changefreq>\n"
            "    <priority>0.6</priority>\n"
            "  </url>"
        )
    block = "\n".join(entries) + "\n</urlset>"
    xml_new = xml.replace("</urlset>", block, 1)
    SITEMAP.write_text(xml_new, encoding="utf-8")
    total = len(re.findall(r"<loc>", xml_new))
    print(f"Sitemap aggiornata: {total} URL totali")
    return 0


if __name__ == "__main__":
    sys.exit(main())
