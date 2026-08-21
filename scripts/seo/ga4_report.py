#!/usr/bin/env python3
"""Report GA4 Data API: utenti, eventi chiave, sorgenti, pagine top con confronto.

Property: www.bio-clinic.it (407217006), tag G-9EXCL016VJ via GTM-PWZWX5RS.

Uso:
  PYTHONPATH=scripts/seo python3 scripts/seo/ga4_report.py [--days 28]

Output: bio-clinic-analisi/ga4-data/ga4_report_YYYY-MM-DD.{json,md}
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path

from google_client import GoogleClient, GoogleAPIError, GA4_API, GA4_PROPERTY

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "bio-clinic-analisi" / "ga4-data"

KEY_EVENTS = ["generate_lead", "bc_prenota_click", "form_submit", "purchase", "bc_phone_click", "bc_whatsapp_click"]


def run_report(client: GoogleClient, body: dict) -> dict:
    return client.post(f"{GA4_API}/{GA4_PROPERTY}:runReport", body)


def rows_to_dicts(report: dict) -> list[dict]:
    dims = [d["name"] for d in report.get("dimensionHeaders", [])]
    mets = [m["name"] for m in report.get("metricHeaders", [])]
    out = []
    for r in report.get("rows", []):
        d = {dim: v["value"] for dim, v in zip(dims, r.get("dimensionValues", []))}
        d.update({met: float(v["value"]) for met, v in zip(mets, r.get("metricValues", []))})
        out.append(d)
    return out


def fmt_delta(cur: float, prev: float) -> str:
    if prev == 0:
        return "n/d"
    d = (cur - prev) / prev * 100
    return f"{d:+.1f}% {'📈' if d > 0 else ('📉' if d < 0 else '→')}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    args = ap.parse_args()

    client = GoogleClient()
    end = dt.date.today() - dt.timedelta(days=1)
    start = end - dt.timedelta(days=args.days - 1)
    prev_end = start - dt.timedelta(days=1)
    prev_start = prev_end - dt.timedelta(days=args.days - 1)
    ranges = [
        {"startDate": str(start), "endDate": str(end)},
        {"startDate": str(prev_start), "endDate": str(prev_end)},
    ]
    print(f"Periodo: {start} → {end} (vs {prev_start} → {prev_end})")

    # 1) Totali (2 date range in un colpo: dateRange dimension)
    tot = rows_to_dicts(run_report(client, {
        "dateRanges": ranges,
        "metrics": [{"name": "activeUsers"}, {"name": "sessions"},
                    {"name": "screenPageViews"}, {"name": "keyEvents"}],
        "dimensions": [],
    }))
    cur_tot = next((r for r in tot if r.get("dateRange", "date_range_0") == "date_range_0"), tot[0] if tot else {})
    prev_tot = next((r for r in tot if r.get("dateRange") == "date_range_1"), {})

    # 2) Eventi
    events = rows_to_dicts(run_report(client, {
        "dateRanges": ranges,
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "limit": 50,
    }))
    ev_cur = {r["eventName"]: r["eventCount"] for r in events
              if r.get("dateRange", "date_range_0") == "date_range_0"}
    ev_prev = {r["eventName"]: r["eventCount"] for r in events if r.get("dateRange") == "date_range_1"}

    # 3) Sorgenti
    src = rows_to_dicts(run_report(client, {
        "dateRanges": [ranges[0]],
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}, {"name": "keyEvents"}],
        "limit": 15,
    }))

    # 4) Pagine top per key events
    pages = rows_to_dicts(run_report(client, {
        "dateRanges": [ranges[0]],
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}, {"name": "keyEvents"}],
        "orderBys": [{"metric": {"metricName": "keyEvents"}, "desc": True}],
        "limit": 30,
    }))

    today = str(dt.date.today())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"ga4_report_{today}.json").write_text(json.dumps({
        "generated": today, "period": {"start": str(start), "end": str(end)},
        "totals": {"current": cur_tot, "previous": prev_tot},
        "events": {"current": ev_cur, "previous": ev_prev},
        "channels": src, "pages": pages,
    }, ensure_ascii=False, indent=1))

    def g(d, k):
        return int(d.get(k, 0))

    md = [f"# Report GA4 — bio-clinic.it", "",
          f"**Generato**: {today} | **Periodo**: {start} → {end}", "",
          "## Totali", "", "| Metrica | Attuale | Precedente | Δ |", "|---|---|---|---|"]
    for label, key in [("Utenti attivi", "activeUsers"), ("Sessioni", "sessions"),
                       ("Pagine viste", "screenPageViews"), ("Eventi chiave", "keyEvents")]:
        md.append(f"| {label} | {g(cur_tot, key):,} | {g(prev_tot, key):,} "
                  f"| {fmt_delta(g(cur_tot, key), g(prev_tot, key))} |")

    md += ["", "## Eventi di conversione", "", "| Evento | Attuale | Precedente | Δ |", "|---|---|---|---|"]
    shown = [e for e in KEY_EVENTS if e in ev_cur or e in ev_prev]
    others = sorted((e for e in ev_cur if e not in KEY_EVENTS), key=lambda e: -ev_cur[e])[:8]
    for e in shown + others:
        md.append(f"| `{e}` | {int(ev_cur.get(e, 0)):,} | {int(ev_prev.get(e, 0)):,} "
                  f"| {fmt_delta(ev_cur.get(e, 0), ev_prev.get(e, 0))} |")

    md += ["", "## Canali", "", "| Canale | Sessioni | Eventi chiave |", "|---|---|---|"]
    for r in sorted(src, key=lambda x: -x["sessions"]):
        md.append(f"| {r['sessionDefaultChannelGroup']} | {int(r['sessions']):,} | {int(r['keyEvents']):,} |")

    md += ["", "## Top pagine per conversioni", "",
           "| Pagina | Viste | Eventi chiave |", "|---|---|---|"]
    for r in pages[:20]:
        md.append(f"| {r['pagePath']} | {int(r['screenPageViews']):,} | {int(r['keyEvents']):,} |")

    (OUT_DIR / f"ga4_report_{today}.md").write_text("\n".join(md) + "\n")
    print(f"OK: report salvato in {OUT_DIR}/ga4_report_{today}.{{json,md}}")
    print(f"Utenti {g(cur_tot,'activeUsers')}, eventi chiave {g(cur_tot,'keyEvents')} "
          f"({fmt_delta(g(cur_tot,'keyEvents'), g(prev_tot,'keyEvents'))})")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GoogleAPIError as e:
        print(f"ERRORE API: {e}", file=sys.stderr)
        sys.exit(3 if e.status in (403, 429) else 1)
