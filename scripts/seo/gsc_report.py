#!/usr/bin/env python3
"""Report Google Search Console: query + pagine con confronto periodo precedente.

Uso:
  PYTHONPATH=scripts/seo python3 scripts/seo/gsc_report.py [--days 28] [--pages-filter /urologia/ ...]

Output: bio-clinic-analisi/gsc-data/gsc_report_YYYY-MM-DD.{json,md}
Nota: i dati GSC hanno ~2 giorni di ritardo; il periodo termina a oggi-3.
"""
import argparse
import datetime as dt
import json
import sys
import urllib.parse
from pathlib import Path

from google_client import GoogleClient, GoogleAPIError, GSC_API, GSC_SITE

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "bio-clinic-analisi" / "gsc-data"

CANDIDATE_SITES = [GSC_SITE, "https://bio-clinic.it/", "https://www.bio-clinic.it/"]


def resolve_site(client: GoogleClient) -> str:
    """Trova la property a cui l'account ha accesso."""
    sites = client.get(f"{GSC_API}/sites").get("siteEntry", [])
    available = {s["siteUrl"]: s.get("permissionLevel", "") for s in sites}
    for cand in CANDIDATE_SITES:
        if cand in available and available[cand] != "siteUnverifiedUser":
            print(f"Property GSC: {cand} ({available[cand]})")
            return cand
    raise SystemExit(f"ERRORE: nessuna property bio-clinic trovata. Disponibili: {available}")


def query_sa(client: GoogleClient, site: str, start: str, end: str,
             dimensions: list[str], row_limit: int = 500,
             page_filter: str | None = None) -> list[dict]:
    body: dict = {
        "startDate": start, "endDate": end,
        "dimensions": dimensions, "rowLimit": row_limit,
        "dataState": "final",
    }
    if page_filter:
        body["dimensionFilterGroups"] = [{
            "filters": [{"dimension": "page", "operator": "contains", "expression": page_filter}]
        }]
    url = f"{GSC_API}/sites/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    return client.post(url, body).get("rows", [])


def totals(rows: list[dict]) -> dict:
    clicks = sum(r["clicks"] for r in rows)
    impr = sum(r["impressions"] for r in rows)
    pos = (sum(r["position"] * r["impressions"] for r in rows) / impr) if impr else 0
    return {"clicks": clicks, "impressions": impr,
            "ctr": round(clicks / impr * 100, 2) if impr else 0,
            "position": round(pos, 1)}


def fmt_delta(cur: float, prev: float, invert: bool = False) -> str:
    if prev == 0:
        return "n/d"
    d = (cur - prev) / prev * 100
    good = (d < 0) if invert else (d > 0)
    arrow = "📈" if good else ("📉" if d != 0 else "→")
    return f"{d:+.1f}% {arrow}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--pages-filter", nargs="*", default=[],
                    help="path da monitorare singolarmente, es. /urologia/")
    args = ap.parse_args()

    client = GoogleClient()
    site = resolve_site(client)

    end = dt.date.today() - dt.timedelta(days=3)
    start = end - dt.timedelta(days=args.days - 1)
    prev_end = start - dt.timedelta(days=1)
    prev_start = prev_end - dt.timedelta(days=args.days - 1)
    s, e, ps, pe = str(start), str(end), str(prev_start), str(prev_end)
    print(f"Periodo: {s} → {e} (vs {ps} → {pe})")

    cur_q = query_sa(client, site, s, e, ["query"])
    prev_q = query_sa(client, site, ps, pe, ["query"])
    cur_p = query_sa(client, site, s, e, ["page"])
    prev_p = query_sa(client, site, ps, pe, ["page"])

    cur_tot, prev_tot = totals(cur_q), totals(prev_q)
    prev_q_map = {r["keys"][0]: r for r in prev_q}
    prev_p_map = {r["keys"][0]: r for r in prev_p}

    # focus pagine richieste
    focus = []
    for pf in args.pages_filter:
        rows_c = [r for r in cur_p if pf in r["keys"][0]]
        rows_p = [r for r in prev_p if pf in r["keys"][0]]
        focus.append({"filter": pf, "current": totals(rows_c), "previous": totals(rows_p)})

    today = str(dt.date.today())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "generated": today, "site": site,
        "period": {"start": s, "end": e}, "previous": {"start": ps, "end": pe},
        "totals": {"current": cur_tot, "previous": prev_tot},
        "top_queries": cur_q[:100], "top_pages": cur_p[:100],
        "focus_pages": focus,
    }
    (OUT_DIR / f"gsc_report_{today}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=1))

    # Markdown
    md = [f"# Report GSC — bio-clinic.it", "",
          f"**Generato**: {today} | **Periodo**: {s} → {e} (confronto {ps} → {pe})", "",
          "## Totali", "",
          "| Metrica | Attuale | Precedente | Δ |", "|---|---|---|---|",
          f"| Click | {cur_tot['clicks']:,} | {prev_tot['clicks']:,} | {fmt_delta(cur_tot['clicks'], prev_tot['clicks'])} |",
          f"| Impressioni | {cur_tot['impressions']:,} | {prev_tot['impressions']:,} | {fmt_delta(cur_tot['impressions'], prev_tot['impressions'])} |",
          f"| CTR | {cur_tot['ctr']}% | {prev_tot['ctr']}% | {fmt_delta(cur_tot['ctr'], prev_tot['ctr'])} |",
          f"| Posizione media | {cur_tot['position']} | {prev_tot['position']} | {fmt_delta(cur_tot['position'], prev_tot['position'], invert=True)} |",
          ""]

    if focus:
        md += ["## Pagine monitorate (ondate SEO)", "",
               "| Pagina | Click | Δ click | Impr. | Δ impr. | Pos. | Δ pos. |",
               "|---|---|---|---|---|---|---|"]
        for f in focus:
            c, p = f["current"], f["previous"]
            md.append(f"| `{f['filter']}` | {c['clicks']} | {fmt_delta(c['clicks'], p['clicks'])} "
                      f"| {c['impressions']:,} | {fmt_delta(c['impressions'], p['impressions'])} "
                      f"| {c['position']} | {fmt_delta(c['position'], p['position'], invert=True)} |")
        md.append("")

    md += ["## Top 25 query", "",
           "| Query | Click | Impr. | CTR | Pos. | Δ click |", "|---|---|---|---|---|---|"]
    for r in cur_q[:25]:
        q = r["keys"][0]
        pv = prev_q_map.get(q, {"clicks": 0})
        md.append(f"| {q} | {r['clicks']} | {r['impressions']:,} "
                  f"| {r['clicks']/r['impressions']*100:.1f}% | {r['position']:.1f} "
                  f"| {fmt_delta(r['clicks'], pv['clicks'])} |")

    md += ["", "## Top 25 pagine", "",
           "| Pagina | Click | Impr. | Pos. | Δ click |", "|---|---|---|---|---|"]
    for r in cur_p[:25]:
        pg = r["keys"][0].replace("https://bio-clinic.it", "")
        pv = prev_p_map.get(r["keys"][0], {"clicks": 0})
        md.append(f"| {pg} | {r['clicks']} | {r['impressions']:,} "
                  f"| {r['position']:.1f} | {fmt_delta(r['clicks'], pv['clicks'])} |")

    (OUT_DIR / f"gsc_report_{today}.md").write_text("\n".join(md) + "\n")
    print(f"OK: report salvato in {OUT_DIR}/gsc_report_{today}.{{json,md}}")
    print(f"Click {cur_tot['clicks']} ({fmt_delta(cur_tot['clicks'], prev_tot['clicks'])}), "
          f"pos {cur_tot['position']}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GoogleAPIError as e:
        print(f"ERRORE API: {e}", file=sys.stderr)
        sys.exit(3 if e.status in (403, 429) else 1)
