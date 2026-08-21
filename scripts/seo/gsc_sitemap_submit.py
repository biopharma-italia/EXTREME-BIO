#!/usr/bin/env python3
"""Submit/refresh delle sitemap su Google Search Console.

Uso: PYTHONPATH=scripts/seo python3 scripts/seo/gsc_sitemap_submit.py
"""
import sys
import urllib.parse

from google_client import GoogleClient, GoogleAPIError, GSC_API
from gsc_report import resolve_site

SITEMAPS = [
    "https://bio-clinic.it/sitemap.xml",
    "https://bio-clinic.it/sitemap-esami.xml",
]


def main() -> int:
    client = GoogleClient()
    site = resolve_site(client)
    site_enc = urllib.parse.quote(site, safe="")
    for sm in SITEMAPS:
        sm_enc = urllib.parse.quote(sm, safe="")
        client.put(f"{GSC_API}/sites/{site_enc}/sitemaps/{sm_enc}")
        print(f"OK submit: {sm}")
    # stato
    listed = client.get(f"{GSC_API}/sites/{site_enc}/sitemaps").get("sitemap", [])
    for s in listed:
        errs = s.get("errors", "0")
        warns = s.get("warnings", "0")
        print(f"  {s['path']} | lastSubmitted: {s.get('lastSubmitted','?')[:10]} "
              f"| errori: {errs} | warning: {warns}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GoogleAPIError as e:
        print(f"ERRORE API: {e}", file=sys.stderr)
        sys.exit(3 if e.status in (403, 429) else 1)
