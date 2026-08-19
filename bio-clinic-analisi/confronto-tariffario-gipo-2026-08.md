# Confronto Tariffario Sito vs Fatturato GIPO

**Data analisi:** 19/08/2026
**Fonte sito:** `site/data/listino-processed.json` (1.136 esami)
**Fonte GIPO:** `pip-delivery/pip-phase1/20260701_1901_invoice_lines.jsonl` — 88.403 righe fattura reali (export GIPO del 01/07/2026)
**Metodo:** confronto sul solo listino privato "Laboratorio", fatture ultimi 12 mesi (lug 2025 → lug 2026), esclusi prezzi €0 e listini convenzionati (Unisalute, Platamona, Poste, Generali, Previmedical…). Match sul nome esame normalizzato.
**Dettaglio completo:** `confronto-tariffario-gipo-2026-08.csv` (1.136 righe)

## Risultato

| Esito | Esami | % |
|---|---|---|
| ✅ Prezzo sito = prezzo fatturato | **544** | 47,9% |
| ⚠️ Mismatch da verificare | **21** | 1,8% |
| ➖ Nessuna fattura privata recente (non verificabile) | 571 | 50,3% |

**Sui 565 esami effettivamente venduti a privati negli ultimi 12 mesi, il 96,3% del tariffario sito è confermato dal fatturato reale.**

### Esami della demo TSH — tutti confermati ✅

| Esame | Sito | GIPO (ultimo fatturato, listino privato) |
|---|---|---|
| TSH | €10,00 | €10,00 (01/07/2026, 152 fatture 2026 tutte a €10) |
| FT4 | €10,00 | €10,00 |
| FT3 | €9,00 | €9,00 |
| Ab anti-recettori TSH | €35,00 | €35,00 |
| Ab anti-tireoglobulina | €19,90 | €19,90 |
| Tireoglobulina | €18,80 | €18,80 |
| TSH Reflex | €25,00 | €25,00 privato ✅ (i €12,50/€20 visti nel fatturato sono Unisalute/Platamona) |

## ⚠️ 21 mismatch residui da far verificare in segreteria

Ordinati per volume di fatture. Nota: molti con n=1-3 possono essere sconti una tantum; i primi 3 sembrano invece cambi prezzo reali non riportati sul sito.

| Esame | Sito | GIPO ultimo | Data | n | Note |
|---|---|---|---|---|---|
| Mounjaro 7,5 mg Start Pack Slim Care | €395,45 | **€435,00** | 26/06/2026 | 24 | Prezzo aumentato? Sito sottoprezza |
| HLA DQ2/DQ8 (celiachia) | €138,00 | **€90,00** | 11/05/2026 | 10 | 7 fatture a €90 vs 3 a €138: probabile ribasso |
| ENA Profile | €150,00 | €120,00 | 23/06/2026 | 5 | Prezzi variabili 120-150 |
| Calamaro (IgE) | €12,50 | €14,00 | 05/06/2026 | 3 | |
| Ricerca parassiti e uova (camp. 1/2/3) | €15,00 | €12,00 | 06/2026 | 3×3 | Coerente sui 3 campioni: probabile €12 |
| Annexina V IgG | €65,00 | €61,00* | 11/2025 | 2 | *escluso outlier €0,09 |
| Alternaria alternata | €82,50 | €80,00 | 11/2025 | 1 | |
| Ambrosia occidentale (IgE) | €25,00 | €19,00 | 06/2026 | 1 | |
| Ab anti-cromatina | €25,00 | €22,00 | 09/2025 | 1 | |
| Dermatophagoides farinae (IgE) | €12,50 | €15,00 | 06/2026 | 1 | |
| Tamp. faringeo stafilococco | €12,00 | €25,00 | 10/2025 | 1 | |
| Gene PAI-1 4G/5G | €98,30 | €100,00 | 05/2026 | 1 | |
| Grano (IgE) | €14,50 | €12,50 | 08/2025 | 1 | |
| HCV RNA genotipo | €157,30 | €143,50 | 11/2025 | 1 | |
| Istologia polipectomia endocervicale | €150,00 | €50,00 | 12/2025 | 1 | Verificare: forse voce diversa |
| Mercurio urine F.T. | €27,00 | €26,01 | 01/2026 | 1 | Arrotondamento |
| Mycobacterium tuberculosis DNA | €176,90 | €180,00 | 10/2025 | 1 | |
| **Prolattina curva** | **€7,50** | **€70,00** | 05/2026 | 1 | **Probabile errore sito: €7,50 per una curva è irrealistico** |
| Test Capacitazione | €250,00 | €40,00 | 11/2025 | 1 | Verificare: forse voce diversa |

### Falsi mismatch chiariti (il sito è corretto)

Questi sembravano discrepanze ma sono prezzi di **listini convenzionati**, non del privato:
- Mycoplasmi/Ureaplasmi €7,50 → "Listino Bioclinic" (promo interna?); privato = €18/€18,50 come da sito
- Treponema IgG/IgM €8,50 → Listino Platamona; privato €10 = sito ✅
- Prolattina €10 → fatture 2024; nel 2026 tutte a €15 = sito ✅
- BNP €26-30 → prezzi variabili nel privato (14 fatture a €30,30 nel 2026): il sito dice €70, **da ricontrollare anche questo**
- Colinesterasi €1,50 → Platamona; privato €3,90 = sito ✅
- Emocromo: privato 2026 = €6,50 costante (566 fatture) — il sito su alcune pagine cita €5 (vecchio prezzo o convenzione)

## Osservazione strategica (per le landing esami)

I 571 esami senza fatture private recenti sono i "long tail" del listino (metalli urinari, IgE rare, esami tossicologici F.T.). Per le landing SEO conviene partire dai **top per volume reale di fatturato**, che ora conosciamo:

Top 15 privato 12 mesi: Emocromo (2.369), Creatinina (1.648), AST/ALT (1.507/1.496), Glucosio (1.428), Es. urine chimico-fisico (1.232), Colesterolo tot/HDL (1.192/1.156), GGT (1.098), Trigliceridi (1.049), Beta-HCG (842), **Vitamina D (834)**, FT4 (823), Tampone vaginale (808), Urinocoltura (720).
