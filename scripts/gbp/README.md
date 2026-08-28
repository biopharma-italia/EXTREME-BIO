# Automazione Google Business Profile — Bio-Clinic

Integrazione API GBP per gestione autonoma di recensioni, post, servizi/prezzi e report performance.

## Stato setup

- [x] Progetto Google Cloud `bio-clinic-gbp` (project number: 762256014734)
- [x] API abilitate (Account Management, Business Information, Performance)
- [x] OAuth client + refresh token (`gestione@bio-clinic.it`, scope `business.manage`)
- [x] GitHub Secrets: `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN`
- [ ] **Form richiesta accesso API approvato da Google** ⏳ (2-14 gg — finché pende, le API rispondono 429)
- [ ] App OAuth pubblicata in produzione (altrimenti il refresh token scade in 7 giorni!)
- [ ] Discover eseguito (`config.json` presente)

### ⚠️ BLOCCO IDENTIFICATO (28/08): account disallineati

Il profilo My Business è di proprietà di **gestione.bioclinic@gmail.com**, mentre progetto
Cloud/OAuth/form usano **gestione@bio-clinic.it** → Google non può associare la richiesta
al profilo e la lascia pendente senza risposta. Rimedio (da fare lato utente):

1. Da business.google.com (login gestione.bioclinic@gmail.com): Utenti e accesso →
   aggiungi `gestione@bio-clinic.it` come **Proprietario**
2. Accettare l'invito dalla casella gestione@bio-clinic.it
3. Reinviare il form https://support.google.com/business/contact/api_default
   loggati come gestione@bio-clinic.it (Project ID: `bio-clinic-gbp`)
4. Console Cloud → Schermata consenso OAuth → **Pubblica app** (se ancora "in test")

Il workflow `gbp-discover.yml` fa un probe giornaliero (07:35 UTC): appena Google
approva, completa il setup da solo (config.json committato automaticamente).

## Attivazione (quando arriva l'email di approvazione Google)

1. Lancia il workflow **"GBP - Discover (setup iniziale)"** da Actions → genera e committa `config.json`
2. Verifica: workflow **"GBP - Monitor Recensioni"** (manuale la prima volta)
3. Sync servizi: localmente o via Actions ad hoc
   ```bash
   PYTHONPATH=scripts/gbp python3 scripts/gbp/sync_services.py            # dry-run
   PYTHONPATH=scripts/gbp python3 scripts/gbp/sync_services.py --apply    # scrive su GBP
   ```

## Componenti

| File | Funzione | Modalità |
|---|---|---|
| `gbp_client.py` | Client OAuth+HTTP con refresh automatico e retry 429 | libreria |
| `discover.py` | Trova account/location → `config.json` | una tantum |
| `review_monitor.py` | Nuove recensioni → GitHub Issue con bozza risposta | cron 3×/gg |
| `pull_performance.py` | Metriche → `bio-clinic-analisi/gbp-data/` | cron mensile |
| `sync_services.py` | `services_gbp.json` (prezzi GIPO) → servizi GBP | manuale, dry-run default |
| `post_scheduler.py` | Pubblica post da `posts_queue.yml` | manuale/cron |

## Regole operative

- **Risposte recensioni**: SEMPRE ad approvazione umana via issue (label `gbp-review`).
  Pubblicazione: `python3 scripts/gbp/review_monitor.py --publish REVIEW_ID --text "..."`
- **GDPR**: mai citare prestazioni/patologie del paziente nelle risposte. I template sono già conformi.
- **Prezzi**: unica fonte di verità = GIPO. Aggiornare `services_gbp.json` insieme alle pagine del sito.
- **Coerenza rating**: lo schema del sito dichiara 5/4450 — verificare col rating GBP reale dopo il discover.

## Sicurezza credenziali

- Refresh token/secret SOLO nei GitHub Secrets, mai committati.
- Se il token viene compromesso: revoca da https://myaccount.google.com/permissions (account gestione@bio-clinic.it) e ripeti il flusso OAuth.
- La rotazione del Client Secret NON invalida il refresh token.
