#!/usr/bin/env python3
"""
Sync servizi + prezzi Bio-Clinic → Google Business Profile.

Fonte prezzi: scripts/gbp/services_gbp.json (curato a mano, derivato dai
prezzi reali GIPO — la stessa fonte usata per le pagine del sito).
La sync è ADDITIVA/SOSTITUTIVA sui serviceItems della location.

Modalità:
  python3 scripts/gbp/sync_services.py --dry-run   # mostra il diff, non scrive (default)
  python3 scripts/gbp/sync_services.py --apply     # scrive su GBP

Nota: i servizi "structured" richiedono serviceTypeId dalle categorie GBP;
usiamo freeFormServiceItem che accetta label + prezzo liberi.
"""
import argparse
import json
import os
import sys

from gbp_client import API, GBPClient, load_config

SERVICES_PATH = os.path.join(os.path.dirname(__file__), 'services_gbp.json')


def build_service_items(services):
    items = []
    for s in services:
        item = {
            'freeFormServiceItem': {
                'category': s.get('category', 'categories/gcid:medical_clinic'),
                'label': {
                    'displayName': s['name'][:120],
                    'description': s.get('description', '')[:300],
                    'languageCode': 'it',
                },
            }
        }
        if 'price_eur' in s:
            euros = int(s['price_eur'])
            nanos = int(round((s['price_eur'] - euros) * 1e9))
            item['price'] = {'currencyCode': 'EUR', 'units': str(euros)}
            if nanos:
                item['price']['nanos'] = nanos
        items.append(item)
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='scrive davvero su GBP')
    args = ap.parse_args()

    cfg = load_config()
    loc = cfg.get('primary_location')
    if not loc:
        print('config.json mancante: esegui prima discover.py', file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(SERVICES_PATH):
        print(f'{SERVICES_PATH} mancante', file=sys.stderr)
        sys.exit(1)

    with open(SERVICES_PATH) as f:
        services = json.load(f)['services']

    c = GBPClient()

    # stato attuale
    cur = c.get(f"{API['bizinfo']}/{loc}?readMask=serviceItems")
    cur_items = cur.get('serviceItems', [])
    cur_labels = sorted(
        i.get('freeFormServiceItem', {}).get('label', {}).get('displayName', '')
        or i.get('structuredServiceItem', {}).get('serviceTypeId', '')
        for i in cur_items)

    new_items = build_service_items(services)
    new_labels = sorted(s['name'] for s in services)

    print(f'Servizi attuali su GBP: {len(cur_items)}')
    for l in cur_labels:
        print(f'  - {l}')
    print(f'\nServizi da impostare ({len(new_items)}):')
    for s in services:
        p = f" — €{s['price_eur']}" if 'price_eur' in s else ''
        print(f"  + {s['name']}{p}")

    if not args.apply:
        print('\nDRY-RUN: nessuna modifica. Usa --apply per scrivere su GBP.')
        return

    url = f"{API['bizinfo']}/{loc}?updateMask=serviceItems"
    c.patch(url, {'serviceItems': new_items})
    print(f'\nAPPLICATO: {len(new_items)} servizi scritti sulla location {loc}.')


if __name__ == '__main__':
    main()
