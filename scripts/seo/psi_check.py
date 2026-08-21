#!/usr/bin/env python3
"""PageSpeed Insights: Core Web Vitals (dati campo CrUX + Lighthouse) pagine chiave.

Env: PSI_API_KEY (API key semplice del progetto GCP, nessun OAuth).
Uso:
  python3 scripts/seo/psi_check.py [--strategy mobile|desktop] [--urls ...]

Output: bio-clinic-analisi/cwv-data/psi_YYYY-MM-DD_{strategy}.{json,md}
Exit 4 se una pagina chiave ha CWV "POOR" (il workflow apre una issue).
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "bio-clinic-analisi" / "cwv-data"
PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

KEY_PAGES = [
    "https://bio-clinic.it/",
    "https://bio-clinic.it/urologia/",
    "https://bio-clinic.it/cardiologia/",
    "https://bio-clinic.it/analisi-del-sangue-sassari/",
    "https://bio-clinic.it/prenota/",
]

CWV_METRICS = {
    "LARGEST_CONTENTFUL_PAINT_MS": ("LCP", lambda v: f"{v/1000:.2f}s"),
    "INTERACTION_TO_NEXT_PAINT": ("INP", lambda v: f"{v:.0f}ms"),
    "CUMULATIVE_LAYOUT_SHIFT_SCORE": ("CLS", lambda v: f"{v/100:.2f}"),
}


def check(url: str, strategy: str, api_key: str) -> dict:
    params = {"url": url, "strategy": strategy, "category": "performance"}
    if api_key:
        params["key"] = api_key
    full = f"{PSI_API}?{urllib.parse.urlencode(params)}"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(full, timeout=120) as resp:
                data = json.loads(resp.read())
            break
        except urllib.error.HTTPError as e:
            if e.code in (429, 500) and attempt < 2:
                time.sleep(20 * (attempt + 1))
                continue
            raise
    result = {"url": url, "strategy": strategy}
    # Lighthouse score (lab)
    lh = data.get("lighthouseResult", {})
    perf = lh.get("categories", {}).get("performance", {}).get("score")
    result["lighthouse_performance"] = round(perf * 100) if perf is not None else None
    # CrUX (field data, quello che conta per il ranking)
    le = data.get("loadingExperience", {})
    result["crux_overall"] = le.get("overall_category", "n/d")
    result["crux"] = {}
    for k, (label, fmt) in CWV_METRICS.items():
        m = le.get("metrics", {}).get(k)
        if m:
            result["crux"][label] = {
                "value": fmt(m.get("percentile", 0)),
                "category": m.get("category", "?"),
            }
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strategy", choices=["mobile", "desktop"], default="mobile")
    ap.add_argument("--urls", nargs="*", default=KEY_PAGES)
    args = ap.parse_args()
    api_key = os.environ.get("PSI_API_KEY", "").strip()
    if not api_key:
        print("NOTA: PSI_API_KEY assente — uso quota anonima (bassa, ok per test).")

    results, poor = [], []
    for u in args.urls:
        try:
            r = check(u, args.strategy, api_key)
        except Exception as e:  # una pagina fallita non blocca le altre
            print(f"⚠️ {u}: errore {e}", file=sys.stderr)
            results.append({"url": u, "error": str(e)})
            continue
        results.append(r)
        cat = r["crux_overall"]
        icon = {"FAST": "✅", "AVERAGE": "🟡", "SLOW": "🔴"}.get(cat, "⚪")
        cwv = " | ".join(f"{k} {v['value']} ({v['category']})" for k, v in r["crux"].items())
        print(f"{icon} {u}\n   LH: {r['lighthouse_performance']} | CrUX: {cat} | {cwv}")
        if cat == "SLOW" or any(v["category"] == "SLOW" for v in r["crux"].values()):
            poor.append(r)
        time.sleep(2)

    today = str(dt.date.today())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"psi_{today}_{args.strategy}.json").write_text(
        json.dumps({"generated": today, "strategy": args.strategy, "results": results},
                   ensure_ascii=False, indent=1))

    md = [f"# Core Web Vitals — {today} ({args.strategy})", "",
          "| Pagina | Lighthouse | CrUX | LCP | INP | CLS |", "|---|---|---|---|---|---|"]
    for r in results:
        if "error" in r:
            md.append(f"| {r['url']} | ERRORE | | | | |")
            continue
        c = r["crux"]
        cell = lambda k: f"{c[k]['value']} ({c[k]['category']})" if k in c else "n/d"
        md.append(f"| {r['url'].replace('https://bio-clinic.it','')} "
                  f"| {r['lighthouse_performance']} | {r['crux_overall']} "
                  f"| {cell('LCP')} | {cell('INP')} | {cell('CLS')} |")
    (OUT_DIR / f"psi_{today}_{args.strategy}.md").write_text("\n".join(md) + "\n")
    print(f"\nSalvato: {OUT_DIR}/psi_{today}_{args.strategy}.{{json,md}}")

    if poor:
        print(f"ATTENZIONE: {len(poor)} pagine con CWV SLOW", file=sys.stderr)
        return 4
    return 0


if __name__ == "__main__":
    sys.exit(main())
