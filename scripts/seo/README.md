# Automazione SEO — GSC / GA4 / IndexNow / PageSpeed

Scaffold gemello di `scripts/gbp/`: stesso progetto GCP (`bio-clinic-gbp`),
stesso OAuth client, stessi GitHub Secrets (`GBP_CLIENT_ID/SECRET/REFRESH_TOKEN`).

## Componenti

| Script | Cosa fa | Credenziali |
|---|---|---|
| `indexnow_submit.py` | Ping Bing/Yandex per URL nuovi/modificati (hook nel deploy) | Nessuna (chiave pubblica `a2ee147f...txt` già live) |
| `google_client.py` | Client OAuth condiviso GSC/GA4 (refresh token multi-scope) | GBP_* secrets |
| `gsc_report.py` | Report query/pagine GSC con confronto periodo + focus pagine ondate | OAuth scope `webmasters` |
| `gsc_inspect.py` | URL Inspection: stato indicizzazione pagine chiave (exit 4 = problemi) | OAuth scope `webmasters` |
| `gsc_sitemap_submit.py` | Submit/refresh sitemap.xml + sitemap-esami.xml | OAuth scope `webmasters` |
| `ga4_report.py` | Utenti/eventi chiave/canali/pagine (property 407217006, G-9EXCL016VJ) | OAuth scope `analytics.readonly` |
| `psi_check.py` | Core Web Vitals (CrUX + Lighthouse) pagine chiave (exit 4 = SLOW) | API key `PSI_API_KEY` (opzionale) |

## Workflow

- **`seo-report-weekly.yml`** — lunedì 07:30: GSC + inspection + sitemap + GA4 + CWV,
  committa in `bio-clinic-analisi/{gsc-data,ga4-data,cwv-data}/`, apre issue `seo-alert` su problemi.
- **`deploy-main-site.yml`** (step aggiunto) — ping IndexNow automatico delle pagine modificate a ogni push.

## Stato attivazione

- [x] IndexNow: attivo, testato (HTTP 202, 6 URL wave 2)
- [ ] **Abilitare API nel progetto GCP** (utente, ~2 min): Search Console API,
      Google Analytics Data API, PageSpeed Insights API
- [ ] **Refresh token multi-scope** (giro OAuth guidato ~5 min): il token attuale ha
      solo `business.manage` → va rigenerato con anche `webmasters` + `analytics.readonly`,
      poi aggiornare il secret `GBP_REFRESH_TOKEN` (funziona per GBP *e* SEO)
- [ ] (opzionale) API key `PSI_API_KEY` nel progetto GCP → GitHub Secret
- [ ] Creare label `seo-alert` (fatta via gh se possibile)

## Note

- I dati GSC hanno ~2-3 giorni di lag: i report chiudono il periodo a oggi-3.
- URL Inspection: quota 2.000/giorno — le 9 pagine chiave sono ampiamente dentro.
- Exit code: 2 = credenziali mancanti, 3 = scope/quota non concessi, 4 = problemi
  rilevati (indicizzazione o CWV), 1 = errore generico.
- **Google Indexing API NON usata**: è riservata a JobPosting/Livestream, usarla per
  pagine cliniche viola i ToS. IndexNow + sitemap submit coprono il bisogno.
