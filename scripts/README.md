# scripts/

## apply-reviews.py

Propaga il numero recensioni MioDottore + Google + Totale dal file
`site/data/reviews.json` a tutti i file HTML del sito.

### Quando si usa

- **Automaticamente**: ogni lunedì alle 04:00 (Europe/Rome) un cron OpenClaw
  scrappa MioDottore + Google Maps, aggiorna `reviews.json` e committa.
- **Manualmente**: se vuoi forzare un numero specifico, modifica `reviews.json`
  e poi esegui:
  ```bash
  python3 scripts/apply-reviews.py
  git add -A && git commit -m "chore: manual reviews update" && git push
  ```

### Comandi

```bash
# Patcha gli HTML in base a reviews.json
python3 scripts/apply-reviews.py

# Verifica coerenza (CI mode, usato dal workflow GitHub)
python3 scripts/apply-reviews.py --check

# Mostra cosa cambierebbe senza scrivere file
python3 scripts/apply-reviews.py --dry-run
```

### Source of truth

`site/data/reviews.json`:

```json
{
  "miodottore": 3445,
  "google":     458,
  "total":      3903
}
```

Vincolo: `total == miodottore + google`. Se questa relazione non è vera,
sia lo script che il workflow CI falliscono.

### NON modificare gli HTML a mano

Il workflow `.github/workflows/check-reviews-coherence.yml` blocca i push
in cui gli HTML hanno valori diversi da `reviews.json`. Se modifichi un
HTML a mano (es. da Claude/Opus locale), CI fallirà e il deploy verrà
bloccato. Modifica sempre `reviews.json` + esegui `apply-reviews.py`.

## check-lab-prices.py

Gate di coerenza fra i prezzi degli esami citati negli HTML e il listino
ufficiale `site/data/listino-processed.json`.

### Perché esiste

Ogni pagina ha più "rappresentazioni" dello stesso prezzo: card visibili,
FAQ visibili, FAQ in JSON-LD, `OfferCatalog` JSON-LD, meta description,
blocco `<noscript>`. Quando cambia il listino di solito si aggiornano solo le
card e le altre restano vecchie (12/09/2026: emocromo €6,50 in card ma €5 in
FAQ/JSON-LD/noscript; vitamina D €16 vs €22; ferritina €13,90 vs €8).
Google usa il JSON-LD per rich result e AI Overview; chi non esegue JS vede il
noscript.

### Comandi

```bash
python3 scripts/check-lab-prices.py            # exit 1 se ci sono incoerenze
python3 scripts/check-lab-prices.py --verbose  # mostra anche i match corretti
```

### Come funziona

- Controlla un insieme di esami "sentinella" (`SENTINELS` nello script): quelli
  che compaiono a mano nei testi (emocromo, vitamina D, TSH, pacchetti check-up…).
- Cerca `nome esame … €X` / `X euro` / `"name":"…","price":"X"` negli HTML e
  confronta X con `prezzo` del listino.
- `PENDING_DECISION`: incoerenze note in attesa di decisione della direzione;
  vengono stampate come warning ma non bloccano. Rimuovere la voce appena risolta.

### Regole

- **Fonte di verità: il listino JSON.** Se un prezzo cambia, prima si aggiorna
  `listino-processed.json`, poi si correggono gli HTML finché il check passa.
- Non scrivere prezzi a mano in FAQ/noscript/JSON-LD senza far girare il check.
- CI: `.github/workflows/check-lab-prices.yml` blocca push/PR incoerenti.
