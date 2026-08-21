#!/usr/bin/env python3
"""
Post scheduler GBP: pubblica il primo post in coda da scripts/gbp/posts_queue.yml.

Formato coda (YAML semplice, parsato senza dipendenze):
---
- summary: |
    Testo del post (max 1500 caratteri).
  cta_type: LEARN_MORE          # LEARN_MORE|BOOK|CALL|ORDER|SHOP|SIGN_UP (o assente)
  cta_url: https://bio-clinic.it/urologia/
  status: pending               # pending -> published (aggiornato dallo script)
---

Uso:
  python3 scripts/gbp/post_scheduler.py --dry-run   # mostra il prossimo post
  python3 scripts/gbp/post_scheduler.py --publish   # pubblica il primo pending
"""
import argparse
import datetime as dt
import os
import re
import sys

from gbp_client import API, GBPClient, load_config

QUEUE_PATH = os.path.join(os.path.dirname(__file__), 'posts_queue.yml')


def parse_queue(text):
    """Parser minimale per il formato a blocchi '---'."""
    posts = []
    blocks = [b for b in re.split(r'^---\s*$', text, flags=re.M) if b.strip()]
    for b in blocks:
        post = {'raw': b}
        m = re.search(r'^\s*summary:\s*\|\s*\n((?:[ \t]+.*\n?)+)', b, re.M)
        if m:
            lines = [l.strip() for l in m.group(1).splitlines()]
            post['summary'] = '\n'.join(lines).strip()
        for key in ('cta_type', 'cta_url', 'status'):
            km = re.search(rf'^\s*{key}:\s*(.+)$', b, re.M)
            if km:
                post[key] = km.group(1).strip()
        posts.append(post)
    return posts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--publish', action='store_true')
    args = ap.parse_args()

    if not os.path.exists(QUEUE_PATH):
        print('Coda vuota (posts_queue.yml assente). Niente da pubblicare.')
        return

    text = open(QUEUE_PATH).read()
    posts = parse_queue(text)
    pending = [p for p in posts if p.get('status', 'pending') == 'pending' and p.get('summary')]
    if not pending:
        print('Nessun post pending in coda.')
        return

    post = pending[0]
    print('Prossimo post in coda:')
    print('-' * 50)
    print(post['summary'][:500])
    print('-' * 50)
    print(f"CTA: {post.get('cta_type', '(nessuna)')} -> {post.get('cta_url', '')}")

    if not args.publish:
        print('\nDRY-RUN: usa --publish per pubblicare su GBP.')
        return

    cfg = load_config()
    v4_path = f"{cfg['primary_account']}/{cfg['primary_location']}"
    payload = {
        'languageCode': 'it',
        'summary': post['summary'][:1500],
        'topicType': 'STANDARD',
    }
    if post.get('cta_type') and post.get('cta_url'):
        payload['callToAction'] = {'actionType': post['cta_type'], 'url': post['cta_url']}

    c = GBPClient()
    r = c.post(f"{API['v4']}/{v4_path}/localPosts", payload)
    print(f"\nPUBBLICATO: {r.get('name', '')} — stato {r.get('state', '')}")

    # marca come published nel file coda
    new_text = text.replace(post['raw'], post['raw'].replace('status: pending', f'status: published  # {dt.date.today().isoformat()}'), 1)
    with open(QUEUE_PATH, 'w') as f:
        f.write(new_text)
    print('Coda aggiornata (status: published). Ricordati di committare posts_queue.yml.')


if __name__ == '__main__':
    main()
