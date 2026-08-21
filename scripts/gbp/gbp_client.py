#!/usr/bin/env python3
"""
Client Google Business Profile API per Bio-Clinic.

Autenticazione via OAuth refresh token (env vars):
  GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN

Uso:
    from gbp_client import GBPClient
    c = GBPClient()
    accounts = c.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')

Note:
- La quota API resta 0 finché Google non approva la richiesta di accesso
  (form prereqs). In quel caso le chiamate rispondono 429 RESOURCE_EXHAUSTED.
- Rate limit standard post-approvazione: 300 req/min per progetto.
  Il client fa retry automatico con backoff sui 429.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TOKEN_URL = 'https://oauth2.googleapis.com/token'

# Endpoint base delle API GBP
API = {
    'accounts': 'https://mybusinessaccountmanagement.googleapis.com/v1',
    'bizinfo': 'https://mybusinessbusinessinformation.googleapis.com/v1',
    'performance': 'https://businessprofileperformance.googleapis.com/v1',
    'qna': 'https://mybusinessqanda.googleapis.com/v1',
    # Recensioni e localPosts: API My Business v4 legacy (ancora attiva)
    'v4': 'https://mybusiness.googleapis.com/v4',
}


class GBPError(Exception):
    def __init__(self, code, body):
        self.code = code
        self.body = body
        super().__init__(f'GBP API error {code}: {body[:300]}')


class QuotaNotGrantedError(GBPError):
    """429 persistente: probabilmente il form di accesso non è ancora approvato."""


class GBPClient:
    def __init__(self, max_retries=4):
        self.client_id = os.environ.get('GBP_CLIENT_ID', '')
        self.client_secret = os.environ.get('GBP_CLIENT_SECRET', '')
        self.refresh_token = os.environ.get('GBP_REFRESH_TOKEN', '')
        if not all([self.client_id, self.client_secret, self.refresh_token]):
            print('ERRORE: mancano GBP_CLIENT_ID / GBP_CLIENT_SECRET / GBP_REFRESH_TOKEN', file=sys.stderr)
            sys.exit(2)
        self.max_retries = max_retries
        self._access_token = None
        self._token_exp = 0

    # ── auth ────────────────────────────────────────────────
    def _get_access_token(self):
        if self._access_token and time.time() < self._token_exp - 60:
            return self._access_token
        data = urllib.parse.urlencode({
            'refresh_token': self.refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token',
        }).encode()
        req = urllib.request.Request(TOKEN_URL, data=data, method='POST')
        try:
            resp = json.loads(urllib.request.urlopen(req).read())
        except urllib.error.HTTPError as e:
            raise GBPError(e.code, e.read().decode()) from e
        self._access_token = resp['access_token']
        self._token_exp = time.time() + int(resp.get('expires_in', 3600))
        return self._access_token

    # ── http ────────────────────────────────────────────────
    def _request(self, method, url, payload=None):
        last_err = None
        for attempt in range(self.max_retries):
            token = self._get_access_token()
            headers = {'Authorization': f'Bearer {token}'}
            data = None
            if payload is not None:
                headers['Content-Type'] = 'application/json'
                data = json.dumps(payload).encode()
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            try:
                body = urllib.request.urlopen(req).read()
                return json.loads(body) if body else {}
            except urllib.error.HTTPError as e:
                err_body = e.read().decode()
                last_err = GBPError(e.code, err_body)
                if e.code == 429:
                    wait = 2 ** attempt * 15  # 15s, 30s, 60s, 120s
                    print(f'429 rate limit, retry {attempt+1}/{self.max_retries} tra {wait}s...', file=sys.stderr)
                    time.sleep(wait)
                    continue
                if e.code == 401:
                    self._access_token = None  # forza refresh
                    continue
                raise last_err
        if isinstance(last_err, GBPError) and last_err.code == 429:
            raise QuotaNotGrantedError(429, 'Quota esaurita/non concessa. Il form di accesso GBP API è stato approvato da Google? ' + last_err.body)
        raise last_err

    def get(self, url):
        return self._request('GET', url)

    def post(self, url, payload):
        return self._request('POST', url, payload)

    def patch(self, url, payload):
        return self._request('PATCH', url, payload)

    def delete(self, url):
        return self._request('DELETE', url)

    # ── paginazione helper ──────────────────────────────────
    def get_paged(self, url, list_key):
        """Itera tutte le pagine e ritorna la lista completa."""
        items = []
        page_token = None
        while True:
            sep = '&' if '?' in url else '?'
            u = url + (f'{sep}pageToken={page_token}' if page_token else '')
            resp = self.get(u)
            items.extend(resp.get(list_key, []))
            page_token = resp.get('nextPageToken')
            if not page_token:
                break
        return items


def load_config():
    """Carica scripts/gbp/config.json (account/location scoperti da discover.py)."""
    path = os.path.join(os.path.dirname(__file__), 'config.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}


if __name__ == '__main__':
    # smoke test: lista accounts
    c = GBPClient()
    try:
        r = c.get(API['accounts'] + '/accounts')
        print(json.dumps(r, indent=2, ensure_ascii=False))
    except QuotaNotGrantedError as e:
        print('QUOTA NON ANCORA CONCESSA — in attesa approvazione form Google.', file=sys.stderr)
        sys.exit(3)
