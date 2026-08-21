#!/usr/bin/env python3
"""
Pull metriche Business Profile Performance API → report markdown + JSON.

Metriche: impressions (Maps/Search, mobile/desktop), chiamate, click sito,
richieste indicazioni, conversazioni. Ultimi N giorni (default 30).

Output:
  bio-clinic-analisi/gbp-data/gbp_performance_YYYY-MM-DD.json
  bio-clinic-analisi/gbp-data/REPORT_GBP_YYYY-MM-DD.md

Uso: python3 scripts/gbp/pull_performance.py [--days 30]
"""
import argparse
import datetime as dt
import json
import os
import sys

from gbp_client import API, GBPClient, load_config

METRICS = [
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
    'CALL_CLICKS',
    'WEBSITE_CLICKS',
    'BUSINESS_DIRECTION_REQUESTS',
    'BUSINESS_CONVERSATIONS',
    'BUSINESS_BOOKINGS',
]

LABELS = {
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS': 'Impression Maps (desktop)',
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH': 'Impression Search (desktop)',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS': 'Impression Maps (mobile)',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH': 'Impression Search (mobile)',
    'CALL_CLICKS': 'Click chiamata 📞',
    'WEBSITE_CLICKS': 'Click sito web 🌐',
    'BUSINESS_DIRECTION_REQUESTS': 'Richieste indicazioni 🗺️',
    'BUSINESS_CONVERSATIONS': 'Conversazioni 💬',
    'BUSINESS_BOOKINGS': 'Prenotazioni 📅',
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=30)
    args = ap.parse_args()

    cfg = load_config()
    loc = cfg.get('primary_location')
    if not loc:
        print('config.json mancante o senza primary_location: esegui prima discover.py', file=sys.stderr)
        sys.exit(1)

    c = GBPClient()
    end = dt.date.today() - dt.timedelta(days=3)   # GBP ha lag dati ~3gg
    start = end - dt.timedelta(days=args.days - 1)

    qs = '&'.join(
        [f'dailyMetrics={m}' for m in METRICS] +
        [f'dailyRange.start_date.year={start.year}',
         f'dailyRange.start_date.month={start.month}',
         f'dailyRange.start_date.day={start.day}',
         f'dailyRange.end_date.year={end.year}',
         f'dailyRange.end_date.month={end.month}',
         f'dailyRange.end_date.day={end.day}'])
    url = f"{API['performance']}/{loc}:fetchMultiDailyMetricsTimeSeries?{qs}"
    resp = c.get(url)

    totals, daily = {}, {}
    for series in resp.get('multiDailyMetricTimeSeries', []):
        for m in series.get('dailyMetricTimeSeries', []):
            metric = m.get('dailyMetric')
            vals = m.get('timeSeries', {}).get('datedValues', [])
            tot = sum(int(v.get('value', 0)) for v in vals)
            totals[metric] = tot
            daily[metric] = [{'date': f"{v['date']['year']}-{v['date']['month']:02d}-{v['date']['day']:02d}",
                              'value': int(v.get('value', 0))} for v in vals]

    outdir = 'bio-clinic-analisi/gbp-data'
    os.makedirs(outdir, exist_ok=True)
    today = dt.date.today().isoformat()

    with open(f'{outdir}/gbp_performance_{today}.json', 'w') as f:
        json.dump({'location': loc, 'range': [start.isoformat(), end.isoformat()],
                   'totals': totals, 'daily': daily}, f, indent=2)

    imp_tot = sum(totals.get(k, 0) for k in METRICS[:4])
    lines = [
        f'# Report GBP Performance — {today}',
        f'\nLocation: `{loc}` · Periodo: **{start.isoformat()} → {end.isoformat()}** ({args.days} gg)\n',
        '| Metrica | Totale |',
        '|---|---|',
        f'| **Impression totali** | **{imp_tot:,}** |'.replace(',', '.'),
    ]
    for m in METRICS:
        if m in totals:
            lines.append(f'| {LABELS[m]} | {totals[m]:,} |'.replace(',', '.'))
    azioni = totals.get('CALL_CLICKS', 0) + totals.get('WEBSITE_CLICKS', 0) + totals.get('BUSINESS_DIRECTION_REQUESTS', 0)
    if imp_tot:
        lines.append(f'\n**Azioni totali**: {azioni:,} · **Tasso azione**: {azioni/imp_tot*100:.2f}%'.replace(',', '.'))
    lines.append('\n> Fonte: Business Profile Performance API · lag dati ~3 giorni')

    with open(f'{outdir}/REPORT_GBP_{today}.md', 'w') as f:
        f.write('\n'.join(lines) + '\n')

    print('\n'.join(lines))
    print(f'\nSalvati: {outdir}/gbp_performance_{today}.json e REPORT_GBP_{today}.md')


if __name__ == '__main__':
    main()
