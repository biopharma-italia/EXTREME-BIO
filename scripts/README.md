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
