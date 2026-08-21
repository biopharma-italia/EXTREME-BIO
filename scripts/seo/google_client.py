#!/usr/bin/env python3
"""Client generico Google API (OAuth refresh-token) per GSC / GA4 / URL Inspection.

Riusa le stesse credenziali dello scaffold GBP (stesso progetto GCP bio-clinic-gbp,
stesso OAuth client). Il refresh token deve includere gli scope:
  - https://www.googleapis.com/auth/business.manage        (GBP)
  - https://www.googleapis.com/auth/webmasters             (GSC lettura + sitemap submit)
  - https://www.googleapis.com/auth/analytics.readonly     (GA4 Data API)

Env richieste (con fallback sui nomi GBP_* gia' presenti nei GitHub Secrets):
  GOOGLE_CLIENT_ID | GBP_CLIENT_ID
  GOOGLE_CLIENT_SECRET | GBP_CLIENT_SECRET
  GOOGLE_REFRESH_TOKEN | GBP_REFRESH_TOKEN

Exit code 2 = credenziali mancanti; ScopeError = scope non concesso (403).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TOKEN_URL = "https://oauth2.googleapis.com/token"
RETRY_DELAYS = [15, 30, 60]


class GoogleAPIError(Exception):
    def __init__(self, status: int, body: str, url: str = ""):
        self.status = status
        self.body = body
        self.url = url
        super().__init__(f"Google API error {status} su {url}: {body[:500]}")


class ScopeError(GoogleAPIError):
    """403 insufficient scopes: il refresh token va rigenerato con gli scope nuovi."""


def _env(*names: str) -> str:
    for n in names:
        v = os.environ.get(n, "").strip()
        if v:
            return v
    return ""


class GoogleClient:
    def __init__(self):
        self.client_id = _env("GOOGLE_CLIENT_ID", "GBP_CLIENT_ID")
        self.client_secret = _env("GOOGLE_CLIENT_SECRET", "GBP_CLIENT_SECRET")
        self.refresh_token = _env("GOOGLE_REFRESH_TOKEN", "GBP_REFRESH_TOKEN")
        if not (self.client_id and self.client_secret and self.refresh_token):
            print("ERRORE: mancano GOOGLE_/GBP_ CLIENT_ID, CLIENT_SECRET o REFRESH_TOKEN nell'ambiente.",
                  file=sys.stderr)
            sys.exit(2)
        self._access_token = ""
        self._token_exp = 0.0

    def _get_access_token(self) -> str:
        if self._access_token and time.time() < self._token_exp - 60:
            return self._access_token
        data = urllib.parse.urlencode({
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token",
        }).encode()
        req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            tok = json.loads(resp.read())
        self._access_token = tok["access_token"]
        self._token_exp = time.time() + int(tok.get("expires_in", 3600))
        return self._access_token

    def request(self, method: str, url: str, payload: dict | None = None) -> dict:
        body = json.dumps(payload).encode() if payload is not None else None
        last_err = None
        for attempt, delay in enumerate([0] + RETRY_DELAYS):
            if delay:
                time.sleep(delay)
            headers = {
                "Authorization": f"Bearer {self._get_access_token()}",
                "Content-Type": "application/json",
            }
            req = urllib.request.Request(url, data=body, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    raw = resp.read()
                    return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as e:
                err_body = e.read().decode(errors="replace")
                if e.code == 401 and attempt == 0:
                    self._access_token = ""  # forza re-auth e riprova subito
                    last_err = GoogleAPIError(401, err_body, url)
                    continue
                if e.code == 403 and ("insufficient" in err_body.lower()
                                      or "ACCESS_TOKEN_SCOPE_INSUFFICIENT" in err_body):
                    raise ScopeError(403, err_body, url)
                if e.code in (429, 500, 502, 503):
                    last_err = GoogleAPIError(e.code, err_body, url)
                    continue
                raise GoogleAPIError(e.code, err_body, url)
        raise last_err

    def get(self, url: str) -> dict:
        return self.request("GET", url)

    def post(self, url: str, payload: dict | None = None) -> dict:
        return self.request("POST", url, payload)

    def put(self, url: str, payload: dict | None = None) -> dict:
        return self.request("PUT", url, payload)


# Endpoint base
GSC_SITE = "sc-domain:bio-clinic.it"  # property a livello dominio; fallback URL-prefix in gsc_report
GSC_API = "https://searchconsole.googleapis.com/webmasters/v3"
GSC_INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
GA4_PROPERTY = "properties/407217006"
GA4_API = "https://analyticsdata.googleapis.com/v1beta"
