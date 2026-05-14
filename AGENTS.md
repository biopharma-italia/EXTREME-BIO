# AGENTS.md — Istruzioni per agenti AI che lavorano su questo repo

Questo file definisce **regole vincolanti** per qualsiasi agente AI (Claude Code, Claude Opus, Codex, ecc.) che modifica il sito `bio-clinic.it` ospitato in questo repo.

---

## ⚠️ Regola #1 (la più importante): NIENTE deploy "dirty"

Il sito è hostato su Cloudflare Pages, deployato via `wrangler pages deploy ./site --commit-dirty=true`.

**Il problema**: se fai un deploy senza prima sincronizzarti col repo remoto e pushare le tue modifiche, **le tue modifiche vivono solo su Cloudflare**. Al primo deploy successivo fatto da un altro agente/persona, vengono **sovrascritte e perse per sempre**.

**Questo è successo davvero**: il 12 maggio 2026 sono andate perse modifiche editoriali a `site/slim-care/index.html` perché deployate senza push (vedi commit `e50529e5` di restore).

### Workflow OBBLIGATORIO per qualsiasi modifica

```bash
# 1. Sincronizza sempre prima di iniziare
git pull --rebase origin main

# 2. Fai le tue modifiche

# 3. Commit con messaggio descrittivo
git add -A
git commit -m "tipo(scope): descrizione breve

Dettaglio più lungo se necessario."

# 4. Push PRIMA del deploy
git push origin main

# 5. Solo ORA puoi deployare
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=e40ec532ef28e0718e095d21bf508847 \
  npx wrangler pages deploy ./site \
  --project-name=bio-clinic --branch=main --commit-dirty=true
```

Se non puoi pushare (token non disponibile, repo offline), **NON deployare**. Avvisa l'utente.

---

## ⚠️ Regola #2: Numeri recensioni gestiti automaticamente

I 3 numeri recensioni mostrati sul sito (MioDottore, Google, totale) sono gestiti da un **cron settimanale** che modifica `site/data/reviews.json` e propaga ai 209 HTML via `scripts/apply-reviews.py`.

**NON modificare manualmente**:
- I numeri "X.YYY Recensioni a 5 Stelle" negli HTML
- I valori `"reviewCount"` / `"ratingCount"` nel JSON-LD
- I numeri nelle card MioDottore/Google in `site/index.html` e `site/chi-siamo/index.html`
- I `data-counter="NNNN"` per il contatore animato

Se devi cambiare un numero recensioni a mano (caso eccezionale):
1. Modifica **solo** `site/data/reviews.json`
2. Esegui `python3 scripts/apply-reviews.py`
3. Verifica con `python3 scripts/apply-reviews.py --check` (deve uscire 0)
4. Commit + push + deploy (workflow standard)

La CI `.github/workflows/check-reviews-coherence.yml` blocca i push in cui HTML divergono da `reviews.json`.

---

## ⚠️ Regola #3: Verifica live dopo ogni deploy

Dopo un deploy, **sempre** verificare che la modifica sia effettivamente live:

```bash
# Aspetta cache busting (15-30s)
sleep 25
# Verifica
curl -sL "https://bio-clinic.it/PATH/?cb=$(date +%s)" | grep -c "TUA_STRINGA"
```

Se la verifica fallisce: la cache CF potrebbe non essersi propagata, riprovare dopo 1-2 min. Se persiste: fare purge cache dalla dashboard CF.

---

## Struttura del repo

```
site/                          # Root del sito (production)
  index.html                   # Homepage
  data/reviews.json            # ★ SOURCE OF TRUTH per i numeri recensioni
  [specialty]/index.html       # Pagine specialità (~30 cartelle)
  salute/[topic]/index.html    # Magazine (65 articoli)
  equipe/[medico]/index.html   # Schede medico (52 schede)
  slim-care/                   # Pagina commerciale punta
  laboratorio/prenota/         # Sistema prenotazione laboratorio (multi-step)
scripts/
  apply-reviews.py             # Propaga reviews.json agli HTML
  README.md                    # Documentazione scripts
.github/workflows/
  check-reviews-coherence.yml  # CI: blocca deploy se HTML ≠ reviews.json
  auto-datemodified.yml        # Cron che aggiorna dateModified
```

## Cose da NON fare mai

- ❌ Modificare HTML in `backups/` (sono backup storici, non servono per la build)
- ❌ Eseguire `wrangler pages deploy` senza prima fare `git pull && git push`
- ❌ Aggiornare numeri recensioni a mano in più HTML — usa sempre `reviews.json` + `apply-reviews.py`
- ❌ Toccare `.github/workflows/check-reviews-coherence.yml` senza testare con `--check`
- ❌ Modificare gli script `add_aggregate_rating*.py` o `add_review_badge.py` (script legacy, sostituiti dalla pipeline)

## Convenzioni di commit (Conventional Commits)

```
feat(scope): nuova funzionalità
fix(scope): bugfix
chore(auto): modifiche automatiche di processo (date, recensioni)
docs(scope): solo documentazione
refactor(scope): cambia struttura senza cambiare comportamento
```

Esempi:
- `feat(slim-care): add Wegovy pediatric indication`
- `fix(cardiologia): correct typo in service price`
- `chore(reviews): weekly update (MD=3456, GG=458, total=3914)`

## Persone/sistemi che lavorano su questo repo

| Chi | Cosa fa | Quando |
|---|---|---|
| **OpenClaw** (bot) | Sync recensioni settimanale | Ogni lunedì 04:00 Europe/Rome |
| **OpenClaw** (bot) | Update dateModified | Giorni dispari (cron auto-datemodified) |
| **Claude/Opus** (manuale via owner) | Modifiche editoriali (contenuti, layout, SEO) | Su richiesta del titolare |
| **Owner manuale** | Tutto il resto | Su sua iniziativa |

## In caso di dubbio

**Non fare niente di distruttivo**: meglio chiedere all'utente che sovrascrivere modifiche di un altro agente. Se vedi un commit recente con messaggio `chore: weekly review counts update` di "OpenClaw Sync Bot", **non toccare** i numeri recensioni — fai solo le tue modifiche su altre parti.

---

_Ultimo aggiornamento: 2026-05-14_
_Issue di riferimento: deploy "dirty" del 13 maggio 2026 che ha causato la perdita di modifiche editoriali a slim-care (commit di restore: e50529e5)_
