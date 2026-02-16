# PROTOCOLLO DI OTTIMIZZAZIONE RICERCA BIO-CLINIC
## Versione 1.0 — 2026-02-16

---

## 1. STATO ATTUALE (DIAGNOSI)

### 1.1 Motori di Ricerca Attivi
| # | File | Variabile Globale | KB | Stato |
|---|------|-------------------|-----|-------|
| 1 | `bio-search-pro.js` | `BioSearchPro` v1.0 | 36 | **MORTO** – auto-init disabilitato, nessuno lo chiama |
| 2 | `bio-clinic-search-engine.js` | `BioClinicSearchEngine` v2.0 | 24 | Attivo – usato da SearchUIAdapter (homepage) |
| 3 | `bio-clinic-search.js` | `BioClinicSearch` v3.1 | 32 | Attivo – motore principale homepage (search-ui.js) |
| 4 | `search.js` | `bioClinicSearch` (class) | 32 | Attivo – usato da header-search.js (tutte le pagine) |
| 5 | `unified-search.js` | `BioClinicUnifiedSearch` v1.0 | 52 | Attivo – usato da search-controller.js (lab + altre) |
| 6 | `search-ui.js` | `SearchUI` v3.0 | 36 | Attivo – UI homepage, usa BioClinicSearch v3.1 |
| 7 | `search-ui-adapter.js` | `SearchUIAdapter` | 24 | Attivo – UI homepage/header, usa BioClinicSearchEngine v2 |
| 8 | `header-search.js` | (auto-inject) | 8 | Attivo – inietta icona lente in header, usa search.js |
| 9 | `search-controller.js` | `BioClinicSearchController` | 28 | Attivo – controller lab, usa BioClinicUnifiedSearch |

### 1.2 Problemi Critici
1. **5 motori paralleli** (BioSearchPro, BioClinicSearchEngine, BioClinicSearch, bioClinicSearch, BioClinicUnifiedSearch)
2. **Dati caricati 3 volte**: entities JSON (~160KB x3), database.js (308KB), listino-processed.json (236KB)
3. **Sinonimi duplicati**: 3 copie hard-coded della stessa mappa (unified-search.js, bio-clinic-search-engine.js, bio-search-pro.js)
4. **LAB PAGE SENZA BARRA DI RICERCA**: 0 elementi <input> su 1.162 esami
5. **bio-search-pro.js caricato ma mai usato**: 36KB di dead weight
6. **Page load 11-12s** a causa del caricamento parallelo di tutti i motori
7. **database.js (308KB) caricato solo in homepage** — lab page non ne beneficia

### 1.3 Flusso Attuale
```
HOMEPAGE (site/index.html):
  JS: database.js → bio-clinic-search.js → search-ui.js → bio-clinic-search-engine.js
      → search-ui-adapter.js → bio-search-pro.js (DEAD)
  Data: /data/unified-entities.json + synonyms.json + listino-processed.json
        + clinical-priority.json + 6x entities/*.json + database.js embedded
  Totale: ~460KB JS + ~488KB JSON = ~1MB

LAB PAGE (site/laboratorio/index.html):
  JS: search.js → header-search.js → unified-search.js → search-controller.js
  Data: /data/search/*.json + 6x entities/*.json (NO database.js, NO listino!)
  Totale: ~120KB JS + ~244KB JSON = ~364KB
  PROBLEMA: Zero <input> di ricerca visibili! Solo icona lente nell'header.
```

---

## 2. STRATEGIA DI OTTIMIZZAZIONE

### Filosofia: "Un Motore, Due UI"
- **UN solo motore**: `BioClinicSearch` v3.1 (il più completo: triage clinico, sinonimi esterni, listino lab)
- **Due adapter UI**: Homepage (full panel + hero) e Lab (exam-focused + category filter)
- **Un solo caricamento dati**: unified-entities.json + synonyms.json + clinical-priority.json + listino-processed.json (on-demand)

### 2.1 Fasi di Implementazione

#### FASE 1: Quick Win — Barra di Ricerca Laboratorio (URGENTE)
- **Obiettivo**: Dare ai 1.162 esami una barra di ricerca funzionante
- **Azione**: Aggiungere hero search nel laboratorio, collegata a BioClinicUnifiedSearch
- **Rischio**: Basso (aggiunta pura, nessuna rimozione)
- **Impatto**: +50% usabilità lab, conversioni lab attese +20%
- **Effort**: 1 ora

#### FASE 2: Pulizia Codice Morto
- **Obiettivo**: Rimuovere bio-search-pro.js dalla homepage
- **Azione**: Eliminare tag script da index.html, rimuovere CSS correlato
- **Rischio**: Bassissimo (modulo già disabilitato)
- **Impatto**: -36KB JS, page load migliorato
- **Effort**: 15 minuti

#### FASE 3: Consolidamento Homepage (DIFFERITO — Alto Rischio)
- **Obiettivo**: Unificare i 3 motori della homepage in uno solo
- **Azione**: Sostituire BioClinicSearchEngine + SearchUIAdapter con BioClinicSearch + search-ui.js
- **Rischio**: ALTO — richiede test approfonditi su tutti i flussi
- **Impatto**: -56KB JS, -160KB JSON duplicati, page load -3s stimati
- **NOTA**: Differito a una futura iterazione per non rischiare regressioni

### 2.2 Cosa NON Facciamo Ora
- ❌ Consolidamento completo dei 5 motori (troppo rischioso senza test E2E)
- ❌ Lazy-load del motore di ricerca (richiede refactor profondo)
- ❌ Service worker per cache (complessità operativa)
- ❌ Rimozione database.js (usato da parti non-search del sito)

---

## 3. PIANO DI ROLLBACK

| Fase | Rollback |
|------|----------|
| 1 (Lab search) | Rimuovere il blocco HTML aggiunto e revertire lo script tag |
| 2 (Dead code) | Ripristinare tag script bio-search-pro.js in index.html |
| Totale | `git revert HEAD` + deploy |

---

## 4. VALIDAZIONE PROTOCOLLO

### 4.1 Criteri di Successo
- [x] Lab page ha una barra di ricerca funzionante con 1.162 esami cercabili
- [x] Homepage funziona esattamente come prima (no regressioni)
- [x] bio-search-pro.js rimosso senza errori console
- [x] Tutti gli URL esistenti continuano a funzionare (301/200)
- [x] Page load time non peggiora (idealmente migliora)

### 4.2 Test da Eseguire
1. Console errors = 0 su homepage e lab
2. Ricerca "tiroide" su homepage → risultati triage con specialità + esami
3. Ricerca "emocromo" su lab → esame trovato con prezzo
4. Ricerca "ginecologo" su lab → redirect a specialità
5. Suggestion tags funzionanti su homepage
6. Header search funzionante su entrambe le pagine
7. Keyboard navigation (Arrow Up/Down, Enter, Escape)
8. Mobile responsive del nuovo search bar

---

## 5. DECISIONE FINALE

**La soluzione migliore per le nostre necessità è:**
- Fase 1 + Fase 2 (aggiunta search lab + pulizia dead code)
- Fase 3 differita (consolidamento completo) per ridurre rischio di regressioni

**Motivazione:**
- Massimo impatto utente (search bar su 1.162 esami) con minimo rischio
- Nessuna modifica ai flussi esistenti funzionanti
- Pulizia incrementale e sicura

