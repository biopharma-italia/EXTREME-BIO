#!/usr/bin/env python3
"""URL Inspection API: verifica stato indicizzazione Google delle pagine chiave.

Uso:
  PYTHONPATH=scripts/seo python3 scripts/seo/gsc_inspect.py --urls URL1 URL2 ...
  PYTHONPATH=scripts/seo python3 scripts/seo/gsc_inspect.py --key-pages   # le pagine delle ondate SEO

Output: tabella stato + bio-clinic-analisi/gsc-data/inspection_YYYY-MM-DD.json
Quota: 2000 richieste/giorno, 600/min.
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path

from google_client import GoogleClient, GoogleAPIError, GSC_INSPECT
from gsc_report import resolve_site

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "bio-clinic-analisi" / "gsc-data"

KEY_PAGES = [
    "https://bio-clinic.it/",
    "https://bio-clinic.it/urologia/",
    "https://bio-clinic.it/cardiologia/",
    "https://bio-clinic.it/ematologia/",
    "https://bio-clinic.it/ortopedia/",
    "https://bio-clinic.it/otorinolaringoiatria/",
    "https://bio-clinic.it/gastroenterologia/ecografia-addominale/",
    "https://bio-clinic.it/analisi-del-sangue-sassari/",
    "https://bio-clinic.it/prenota/",
]


def inspect(client: GoogleClient, site: str, url: str) -> dict:
    res = client.post(GSC_INSPECT, {
        "inspectionUrl": url, "siteUrl": site, "languageCode": "it",
    }).get("inspectionResult", {})
    idx = res.get("indexStatusResult", {})
    return {
        "url": url,
        "verdict": idx.get("verdict", "?"),
        "coverage": idx.get("coverageState", "?"),
        "last_crawl": idx.get("lastCrawlTime", "?"),
        "google_canonical": idx.get("googleCanonical", "?"),
        "user_canonical": idx.get("userCanonical", "?"),
        "mobile_ok": res.get("mobileUsabilityResult", {}).get("verdict", "n/d"),
        "rich_results": res.get("richResultsResult", {}).get("verdict", "n/d"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--urls", nargs="+")
    g.add_argument("--key-pages", action="store_true")
    args = ap.parse_args()
    urls = KEY_PAGES if args.key_pages else args.urls

    client = GoogleClient()
    site = resolve_site(client)

    results, problems = [], []
    for u in urls:
        r = inspect(client, site, u)
        results.append(r)
        ok = r["verdict"] == "PASS"
        canonical_ok = r["google_canonical"] in (r["url"], r["user_canonical"], "?")
        flag = "✅" if ok and canonical_ok else "⚠️"
        if not (ok and canonical_ok):
            problems.append(r)
        print(f"{flag} {u}\n   {r['coverage']} | crawl: {r['last_crawl'][:10]} | rich: {r['rich_results']}")

    today = str(dt.date.today())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"inspection_{today}.json").write_text(
        json.dumps({"generated": today, "site": site, "results": results},
                   ensure_ascii=False, indent=1))
    print(f"\nSalvato: {OUT_DIR}/inspection_{today}.json")
    if problems:
        print(f"ATTENZIONE: {len(problems)} pagine con problemi:", file=sys.stderr)
        for p in problems:
            print(f"  - {p['url']}: {p['verdict']} / {p['coverage']}", file=sys.stderr)
        return 4  # segnale per il workflow: aprire issue
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GoogleAPIError as e:
        print(f"ERRORE API: {e}", file=sys.stderr)
        sys.exit(3 if e.status in (403, 429) else 1)
