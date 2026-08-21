#!/usr/bin/env python3
"""
Monitor recensioni GBP con bozze di risposta ad approvazione umana.

Flusso (modalità prudente, primi 30 giorni):
1. Legge le recensioni dalla My Business v4 API
2. Confronta con lo stato in scripts/gbp/reviews_state.json
3. Per ogni recensione NUOVA senza risposta:
   - genera una bozza di risposta (template per fascia stelle)
   - apre una GitHub Issue con la bozza (label: gbp-review)
4. NON pubblica mai risposte automaticamente.
   La pubblicazione avviene con: python3 scripts/gbp/review_monitor.py --publish <review_id> [--text "..."]

Sicurezza GDPR: le bozze non citano MAI prestazioni/patologie del paziente.

Uso:
  python3 scripts/gbp/review_monitor.py               # scan + issue
  python3 scripts/gbp/review_monitor.py --list        # solo elenco
  python3 scripts/gbp/review_monitor.py --publish REVIEW_ID --text "Grazie..."
"""
import argparse
import json
import os
import subprocess
import sys

from gbp_client import API, GBPClient, load_config

STATE_PATH = os.path.join(os.path.dirname(__file__), 'reviews_state.json')

STAR_MAP = {'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5}

# Template bozze — MAI riferimenti a prestazioni sanitarie specifiche (GDPR)
TEMPLATES = {
    5: ("Grazie di cuore per la sua recensione, {name}! Siamo felici che la sua esperienza "
        "da Bio-Clinic sia stata positiva. La aspettiamo per ogni futura esigenza. "
        "— Lo staff di Bio-Clinic Sassari"),
    4: ("Grazie per la sua recensione, {name}! Il suo riscontro ci aiuta a migliorare ogni giorno. "
        "Se c'è qualcosa che possiamo fare per meritare la quinta stella, ci scriva a gestione@bio-clinic.it. "
        "— Lo staff di Bio-Clinic Sassari"),
    3: ("Grazie per il suo feedback, {name}. Ci dispiace che l'esperienza non sia stata pienamente "
        "soddisfacente: ci scriva a gestione@bio-clinic.it o ci chiami allo 079 956 1332, vorremmo capire "
        "come migliorare. — La Direzione di Bio-Clinic Sassari"),
    2: ("Gentile {name}, ci dispiace per l'esperienza. La invitiamo a contattarci direttamente a "
        "gestione@bio-clinic.it o allo 079 956 1332: la Direzione esaminerà personalmente la sua segnalazione. "
        "— La Direzione di Bio-Clinic Sassari"),
    1: ("Gentile {name}, ci rammarica leggere la sua recensione. Per rispetto della privacy non possiamo "
        "entrare nei dettagli in questa sede, ma la invitiamo a contattarci a gestione@bio-clinic.it o allo "
        "079 956 1332: la Direzione la ricontatterà al più presto. — La Direzione di Bio-Clinic Sassari"),
}


def load_state():
    if os.path.exists(STATE_PATH):
        with open(STATE_PATH) as f:
            return json.load(f)
    return {'seen': {}}


def save_state(state):
    with open(STATE_PATH, 'w') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def fetch_reviews(c, cfg):
    # v4: accounts/{aid}/locations/{lid}/reviews — serve il path v4 completo
    account = cfg['primary_account']              # accounts/XXXX
    location = cfg['primary_location']            # locations/YYYY
    v4_path = f"{account}/{location}"
    url = f"{API['v4']}/{v4_path}/reviews?pageSize=50&orderBy=updateTime desc"
    return c.get_paged(url, 'reviews'), v4_path


def open_issue(review, draft):
    stars = STAR_MAP.get(review.get('starRating', ''), '?')
    name = review.get('reviewer', {}).get('displayName', 'Anonimo')
    comment = review.get('comment', '(nessun testo)')
    rid = review['reviewId']
    title = f"[GBP Review {stars}★] {name} — approvazione risposta"
    body = f"""## Nuova recensione GBP da approvare

**Autore**: {name}
**Stelle**: {stars}★
**Data**: {review.get('updateTime', '')}
**Review ID**: `{rid}`

### Testo recensione
> {comment}

### Bozza risposta proposta
```
{draft}
```

### Per pubblicare
Modifica il testo se serve, poi:
```bash
python3 scripts/gbp/review_monitor.py --publish {rid} --text "TESTO APPROVATO"
```
Oppure commenta questa issue con `/approve` (se il workflow di auto-publish è attivo).
"""
    r = subprocess.run(['gh', 'issue', 'create', '--title', title, '--body', body,
                        '--label', 'gbp-review'], capture_output=True, text=True)
    if r.returncode == 0:
        print(f'Issue creata: {r.stdout.strip()}')
        return r.stdout.strip()
    print(f'ATTENZIONE: issue non creata ({r.stderr.strip()[:200]}) — bozza:\n{draft}', file=sys.stderr)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--publish', metavar='REVIEW_ID')
    ap.add_argument('--text')
    args = ap.parse_args()

    cfg = load_config()
    if not cfg.get('primary_location'):
        print('config.json mancante: esegui prima discover.py', file=sys.stderr)
        sys.exit(1)
    c = GBPClient()

    if args.publish:
        if not args.text:
            print('--text obbligatorio con --publish', file=sys.stderr)
            sys.exit(1)
        v4_path = f"{cfg['primary_account']}/{cfg['primary_location']}"
        url = f"{API['v4']}/{v4_path}/reviews/{args.publish}/reply"
        # PUT reply
        c._request('PUT', url, {'comment': args.text})
        print(f'Risposta pubblicata per review {args.publish}')
        state = load_state()
        state['seen'].setdefault(args.publish, {})['replied'] = True
        save_state(state)
        return

    reviews, _ = fetch_reviews(c, cfg)
    state = load_state()
    new_count = 0

    print(f'Trovate {len(reviews)} recensioni (ultime 50).')
    for rv in reviews:
        rid = rv['reviewId']
        stars = STAR_MAP.get(rv.get('starRating', ''), 0)
        has_reply = 'reviewReply' in rv
        name = rv.get('reviewer', {}).get('displayName', 'Anonimo')

        if args.list:
            print(f"  {stars}★ {name} — reply: {'sì' if has_reply else 'NO'} — {rv.get('updateTime','')}")
            continue

        if rid in state['seen'] or has_reply:
            state['seen'].setdefault(rid, {})['replied'] = has_reply
            continue

        # nuova recensione senza risposta → bozza + issue
        first_name = name.split()[0] if name and name != 'Anonimo' else ''
        draft = TEMPLATES.get(stars, TEMPLATES[3]).format(name=first_name or 'e grazie ancora').replace('  ', ' ')
        issue_url = open_issue(rv, draft)
        state['seen'][rid] = {'stars': stars, 'issue': issue_url, 'replied': False}
        new_count += 1

    if not args.list:
        save_state(state)
        print(f'Nuove recensioni senza risposta: {new_count} (issue aperte)')


if __name__ == '__main__':
    main()
