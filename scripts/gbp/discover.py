#!/usr/bin/env python3
"""
Discovery iniziale: trova account e location GBP di Bio-Clinic
e salva gli ID in scripts/gbp/config.json (committabile, non contiene segreti).

Da eseguire UNA VOLTA appena Google approva l'accesso API:
    python3 scripts/gbp/discover.py
"""
import json
import os
import sys

from gbp_client import API, GBPClient

READ_MASK = ('name,title,storefrontAddress,phoneNumbers,websiteUri,'
             'regularHours,categories,metadata,profile,serviceItems')


def main():
    c = GBPClient()

    print('1) Ricerca accounts...')
    accounts = c.get_paged(API['accounts'] + '/accounts', 'accounts')
    if not accounts:
        print('Nessun account trovato: l\'utente OAuth ha accesso al profilo GBP?', file=sys.stderr)
        sys.exit(1)
    for a in accounts:
        print(f"   {a['name']}  «{a.get('accountName','')}»  type={a.get('type')}")

    config = {'accounts': [], 'locations': []}
    print('2) Ricerca locations per ogni account...')
    for a in accounts:
        config['accounts'].append({'name': a['name'], 'accountName': a.get('accountName', ''), 'type': a.get('type', '')})
        url = f"{API['bizinfo']}/{a['name']}/locations?readMask={READ_MASK}&pageSize=100"
        locs = c.get_paged(url, 'locations')
        for l in locs:
            title = l.get('title', '')
            addr = l.get('storefrontAddress', {})
            print(f"   {l['name']}  «{title}»  {addr.get('addressLines', [''])[0]}, {addr.get('locality', '')}")
            config['locations'].append({
                'name': l['name'],                      # locations/XXXXXXXX
                'account': a['name'],
                'title': title,
                'locality': addr.get('locality', ''),
                'websiteUri': l.get('websiteUri', ''),
                'placeId': l.get('metadata', {}).get('placeId', ''),
                'mapsUri': l.get('metadata', {}).get('mapsUri', ''),
            })

    # location primaria: quella con website bio-clinic.it, altrimenti la prima
    primary = next((l for l in config['locations'] if 'bio-clinic.it' in l.get('websiteUri', '')),
                   config['locations'][0] if config['locations'] else None)
    if primary:
        config['primary_location'] = primary['name']
        config['primary_account'] = primary['account']
        print(f"3) Location primaria: {primary['name']} «{primary['title']}»")

    out = os.path.join(os.path.dirname(__file__), 'config.json')
    with open(out, 'w') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f'Salvato {out} — committalo nel repo.')


if __name__ == '__main__':
    main()
