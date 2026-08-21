#!/usr/bin/env python3
"""IndexNow: ping istantaneo a Bing/Yandex/Seznam per gli URL modificati.

Uso:
  python3 scripts/seo/indexnow_submit.py --changed-since <git-ref>   # URL delle pagine site/ modificate da <ref>
  python3 scripts/seo/indexnow_submit.py --urls URL1 URL2 ...        # URL espliciti
  python3 scripts/seo/indexnow_submit.py --sitemap                   # tutti gli URL della sitemap (max 500)

Nessuna credenziale richiesta: la chiave e' pubblica per design del protocollo
(deve essere servita dal sito stesso su /<KEY>.txt).
"""
import argparse
import json
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

HOST = "bio-clinic.it"
KEY = "a2ee147f0736ab53874cc80bc54b2201"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
REPO_ROOT = Path(__file__).resolve().parents[2]
MAX_URLS = 500  # limite prudenziale per batch


def urls_from_git(ref: str) -> list[str]:
    """Pagine HTML in site/ modificate rispetto a ref -> URL live."""
    out = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=ACMR", ref, "HEAD", "--", "site/"],
        cwd=REPO_ROOT, capture_output=True, text=True, check=True,
    ).stdout
    urls = []
    for line in out.splitlines():
        p = line.strip()
        if not p.endswith(".html"):
            continue
        rel = p[len("site/"):]
        if rel.endswith("index.html"):
            rel = rel[: -len("index.html")]
        urls.append(f"https://{HOST}/{rel}")
    return sorted(set(urls))


def urls_from_sitemaps() -> list[str]:
    urls = []
    for sm in ("sitemap.xml", "sitemap-esami.xml"):
        f = REPO_ROOT / "site" / sm
        if not f.exists():
            continue
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.parse(f).getroot()
        urls += [loc.text.strip() for loc in root.findall(".//s:loc", ns) if loc.text]
    return sorted(set(urls))


def submit(urls: list[str]) -> int:
    if not urls:
        print("Nessun URL da inviare: skip.")
        return 0
    urls = urls[:MAX_URLS]
    payload = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }).encode()
    req = urllib.request.Request(
        ENDPOINT, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code
    # 200 = ok, 202 = accepted (chiave in corso di verifica)
    ok = status in (200, 202)
    print(f"IndexNow: {len(urls)} URL inviati, HTTP {status} {'OK' if ok else 'ERRORE'}")
    for u in urls[:20]:
        print(f"  - {u}")
    if len(urls) > 20:
        print(f"  ... e altri {len(urls) - 20}")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--changed-since", metavar="GIT_REF")
    g.add_argument("--urls", nargs="+")
    g.add_argument("--sitemap", action="store_true")
    args = ap.parse_args()

    if args.changed_since:
        urls = urls_from_git(args.changed_since)
    elif args.sitemap:
        urls = urls_from_sitemaps()
    else:
        urls = args.urls
    return submit(urls)


if __name__ == "__main__":
    sys.exit(main())
