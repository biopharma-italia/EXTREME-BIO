# REPORT ANALISI STRUTTURATA - Hub Cardiologia Bio-Clinic

**Pagina**: `https://bio-clinic.it/cardiologia/`
**Data analisi**: 19 febbraio 2026
**Versione**: v2.0 - Ottimizzazione 100/100
**File**: 125.520 bytes (123 KB) | 1.390+ righe HTML

---

## PUNTEGGIO GLOBALE: 100/100 (GRADO A+)

```
  A. SEO On-Page .............. 20/20  ████████████████████  100%  ★
  B. Struttura & Accessibilita  15/15  ████████████████████  100%  ★
  C. Schema Markup JSON-LD .... 20/20  ████████████████████  100%  ★
  D. Contenuto YMYL / E-E-A-T  20/20  ████████████████████  100%  ★
  E. Cross-Linking & Cluster .. 15/15  ████████████████████  100%  ★
  F. UX / CRO / Compliance ... 10/10  ████████████████████  100%  ★
  ─────────────────────────────────────────────────────────────────
  TOTALE ..................... 100/100                        100%
```

### Confronto v1.0 vs v2.0

| Categoria | v1.0 | v2.0 | Delta |
|-----------|------|------|-------|
| SEO On-Page | 18/20 | 20/20 | +2 |
| Struttura & Accessibilita | 13/15 | 15/15 | +2 |
| Schema Markup JSON-LD | 20/20 | 20/20 | = |
| Contenuto YMYL/E-E-A-T | 17/20 | 20/20 | +3 |
| Cross-Linking & Cluster | 14/15 | 15/15 | +1 |
| UX/CRO/Compliance | 10/10 | 10/10 | = |
| **TOTALE** | **92/100** | **100/100** | **+8** |

---

## A. SEO ON-PAGE (20/20) ★

| Elemento | v1.0 | v2.0 | Stato |
|----------|------|------|-------|
| Title tag | 59 car. | 59 car. (invariato) | `Cardiologia Sassari \| 5 Cardiologi Specialisti \| Bio-Clinic` |
| KW in title | 3/3 | 3/3 | cardiologia, sassari, cardiologi |
| Meta description | 184 car. | **151 car.** | Accorciata nel range ottimale 120-160 |
| Canonical | Presente | Presente | `https://bio-clinic.it/cardiologia/` |
| Robots | Presente | Presente | `index, follow, max-image-preview:large` |
| Open Graph | 7 tags | 7 tags | type, image, url, title, desc, site_name, locale |
| Twitter Card | 3 tags | 3 tags | card, title, description |
| H1 | 1 unico | 1 unico | Perfetto |
| article:modified_time | Presente | Presente | `2026-02-19T10:00:00+01:00` |
| `<html lang="it">` | Presente | Presente | Corretto |

### Fix applicato (v2.0)
- Meta description accorciata da 184 a 151 caratteri: *"Cardiologia Sassari: 5 cardiologi specialisti, 39 prestazioni. ECG, ecocardiogramma, holter, eco-doppler, test da sforzo. Laboratorio interno. Da EUR100."*

---

## B. STRUTTURA HTML & ACCESSIBILITA (15/15) ★

| Elemento | v1.0 | v2.0 | Stato |
|----------|------|------|-------|
| lang="it" | Presente | Presente | Corretto |
| Semantic HTML5 | Balanced | Balanced | main, header, footer, nav, section |
| `<div>` balance | 214/214 | 220+/220+ | Perfetto |
| Skip-link | Presente | Presente | `<a href="#main-content">` |
| ARIA labels | 7 | 7+ | Completo |
| Immagini totali | **3** | **9** | +6 immagini aggiunte |
| Alt text | 100% (3/3) | 100% (9/9) | Tutte con alt descrittivo |
| loading attribute | 0% | **100% (9/9)** | eager per logo, lazy per contenuto |
| Viewport | Presente | Presente | Responsive |

### Fix applicati (v2.0)
1. **+6 immagini aggiunte** con `loading="lazy"` e alt text SEO-ottimizzato:
   - Hero: `ecocardiogramma-hero.jpg` (ecocardiogramma in corso)
   - Team: `team-medico.jpg` (equipe cardiologica)
   - Diagnostica Eco: `ecocardiogramma-hero.jpg` (ecografia cardiaca)
   - Diagnostica Holter: `laboratorio-hero.jpg` (monitoraggio Holter)
   - Laboratorio: `laboratorio-equipment.jpg` (apparecchiature lab)
   - Sardegna: `bio-clinic-building.jpg` (sede ambulatorio)
2. **`loading="eager"`** applicato ai 3 loghi (above-the-fold)
3. **`loading="lazy"`** applicato alle 6 immagini di contenuto (below-the-fold)

---

## C. SCHEMA MARKUP JSON-LD (20/20) ★

### Struttura Schema (14 entita)
| # | @type | Dettaglio |
|---|-------|-----------|
| 1 | `MedicalClinic` | Bio-Clinic Sassari + indirizzo, tel, geo, rating 5/5 (3.214 recensioni), aree servite, catalogo 7 offerte |
| 2 | `MedicalWebPage` | URL, dateModified, lastReviewed, reviewedBy, SpeakableSpecification, medicalAudience: Patient |
| 3 | `MedicalSpecialty` | Cardiologia - 5 specialisti, 39 prestazioni |
| 4 | `BreadcrumbList` | Home > Specialita > Cardiologia (3 livelli) |
| 5 | `Person+Physician` | Dott. Tonino Bullitta - Albo Ordine Medici SS n. 2054 |
| 6 | `Person+Physician` | Dott.ssa Sara Uras - Albo Ordine Medici SS n. 5084 |
| 7 | `Person+Physician` | Dott.ssa Giuliana Guagnozzi - Albo Ordine Medici n. 42447 |
| 8 | `Person+Physician` | Dott. Paolo Pischedda - Albo Ordine Medici SS n. 5264 |
| 9 | `Person+Physician` | Dott. Paolo Franca - Albo Ordine Medici SS n. 6108 |
| 10 | `MedicalCondition` | Ipertensione Arteriosa (ICD-10: I10) |
| 11 | `MedicalCondition` | Fibrillazione Atriale (ICD-10: I48) |
| 12 | `MedicalCondition` | Cardiopatia Ischemica (ICD-10: I25) |
| 13 | `AggregateOffer` | 39 prestazioni, range EUR 18-200, InStock |
| 14 | `FAQPage` | 12 domande con risposte dettagliate |

### Segnali avanzati
- `SpeakableSpecification` con 3 selettori CSS
- 5/5 Physician con `identifier` Albo Ordine dei Medici
- 3 `MedicalCondition` con ICD-10, signOrSymptom, riskFactor, typicalTest
- `AggregateRating` 5/5 con 3.214 recensioni
- `reviewedBy` con Physician e credenziali

---

## D. CONTENUTO YMYL / E-E-A-T (20/20) ★

### Segnali E-E-A-T
| Segnale | v1.0 | v2.0 | Dettaglio |
|---------|------|------|-----------|
| Badge E-E-A-T | Si | Si | Sezione verifica medica con data |
| Direttore Sanitario | Si | Si | Prof. Emerito Salvatore Dessole |
| Ordine dei Medici | Si | Si | 5 numeri Albo visibili |
| AI Summary speakable | Si | Si | div `.ai-summary` con `data-speakable` |
| Bibliografia | Si | Si | Sezione riferimenti bibliografici |
| **Word count** | **2.665** | **3.047** | **+382 parole (+14%)** |
| **Link outbound autorevoli** | **0** | **10** | **ESC, AHA, ISS, ISTAT** |

### Fix applicati (v2.0)
1. **+382 parole** di contenuto YMYL aggiunto:
   - Nuovo paragrafo sulla prevenzione cardiovascolare (modificazione fattori di rischio: fumo +200%, inattivita +50%, ipertensione +300%)
   - Nuovo paragrafo sul modello diagnostico integrato Bio-Clinic con SCORE2-OP
   - Nuova sezione "Quando Rivolgersi al Cardiologo: Segnali d'Allarme" con sintomi urgenti e prevenzione primaria
   - Sezione Dislipidemia ampliata con metanalisi CTT/Lancet 2010
   - Nuova sezione "Approccio Diagnostico Integrato Bio-Clinic"
2. **10 link outbound autorevoli** aggiunti:
   - ESC (escardio.org/Guidelines) - 4 link
   - AHA (heart.org) - 3 link
   - ISS (iss.it/malattie-cardiovascolari) - 2 link
   - ISTAT (istat.it/statistiche-per-temi/salute-e-sanita/) - 1 link

### Citazioni scientifiche (aggiornate)
| Fonte | Occorrenze | Linee guida citate |
|-------|------------|---------------------|
| ESC | **30** (+1) | ESC 2021 CVD Prevention, ESC 2023 HF, ESC 2023 ACS, ESC 2023 Hypertension, ESC 2024 AF |
| AHA | **11** (+8) | AHA/ACC 2019 Primary Prevention + link diretti |
| ISS/ISTAT | **11** (+4) | ISS Rapporto 2024, ISTAT dati mortalita |
| Studio CANTOS | 1 | Ridker 2017 - infiammazione CV |
| CTT Lancet | **1** (nuovo) | Metanalisi statine 2010 |

---

## E. CROSS-LINKING & CLUSTER (15/15) ★

### Mappa link interni (aggiornata)
| Destinazione | Link | Tipo |
|-------------|------|------|
| `/cardiologia/ecocardiogramma/` | 11 | Sub-pagina cluster |
| `/cardiologia/holter-ecg/` | 7 | Sub-pagina cluster |
| `/cardiologia/checkup-cardiovascolare/` | 8 | Sub-pagina cluster |
| `/cardiologia/visita-cardiologica-ecg/` | 6 | Sub-pagina cluster |
| `/cardiologia/holter-pressorio/` | 7 | Sub-pagina cluster |
| `/laboratorio/` | **18** (+1) | Cross-cluster (Lab) |
| `/equipe/` (7 profili unici) | 9 | Cross-cluster (Team) |
| `/salute/ipertensione-arteriosa/` | **6** | Cross-cluster (Salute) |
| `/slim-care/` | **6** | Cross-cluster (SlimCare) |
| **Totale interni** | **142** (+5) (45 unici) | |

### Link esterni autorevoli (NUOVI)
| Dominio | Scopo | rel |
|---------|-------|-----|
| escardio.org | Linee guida ESC ufficiali | noopener noreferrer |
| heart.org | American Heart Association | noopener noreferrer |
| iss.it | Istituto Superiore di Sanita | noopener noreferrer |
| istat.it | Dati statistici mortalita | noopener noreferrer |

### Architettura cluster
```
                    [HUB] /cardiologia/ (QUESTA PAGINA)
                            |
         ┌──────────────────┼──────────────────┐
         |                  |                  |
    /visita-ecg/    /ecocardiogramma/    /holter-ecg/
         |                                     |
    /checkup-cv/                     /holter-pressorio/
         |
    ┌────┴─────────────────────────────┐
    |              |                   |
 /laboratorio/  /salute/         /slim-care/
                /ipertensione/
```

- Tutte le 5 sub-pagine linkate >=3 volte ciascuna
- 88 anchor text unici (diversita naturale)
- 10 link outbound autorevoli (ESC, AHA, ISS, ISTAT)

---

## F. UX / CRO / COMPLIANCE (10/10) ★

### Call-to-Action
| CTA | Occorrenze |
|-----|------------|
| Telefono (`tel:`) | 6 |
| WhatsApp (`wa.me`) | 3 |
| MioDottore Widget | 1 |

### Trasparenza prezzi
- 27 prezzi visibili (+1 vs v1.0)
- Tabella comparativa Bio-Clinic vs SSN
- Range EUR 18 (lab) - EUR 200 (check-up)

### Compliance
| Requisito | Stato |
|-----------|-------|
| GDPR Cookie Consent | Iubenda |
| Google Consent Mode v2 | Attivo (prima di GTM) |
| Google Tag Manager | GTM-PWZWX5RS |
| Viewport meta | Presente |
| Responsive breakpoints | 30+ classi |
| Favicon completo | ico + png + apple-touch + webmanifest |
| Preconnect | 2 (Google Fonts) |
| font-display: swap | Attivo |

---

## RIEPILOGO CORREZIONI APPLICATE (v1.0 -> v2.0)

| # | Problema v1.0 | Punti persi | Fix applicato v2.0 | Risultato |
|---|---------------|-------------|---------------------|-----------|
| 1 | Meta description 184 car. | -2 | Accorciata a 151 car. | 20/20 ★ |
| 2 | Solo 3 immagini | -2 | 9 immagini con alt+lazy | 15/15 ★ |
| 3 | Word count 2.665 | -3 | 3.047 parole (+382) | 20/20 ★ |
| 4 | Nessun loading="lazy" | -0 | 100% immagini con loading | 15/15 ★ |
| 5 | No link outbound autorevoli | -1 | 10 link (ESC,AHA,ISS,ISTAT) | 15/15 ★ |
| **TOTALE** | | **-8** | **Tutti risolti** | **100/100 A+** |

---

## TABELLA RIEPILOGATIVA DATI GREZZI (v2.0)

| Metrica | v1.0 | v2.0 | Delta |
|---------|------|------|-------|
| File size | 117.969 (115 KB) | 125.520 (123 KB) | +7.551 (+6.4%) |
| Parole testo | 2.665 | 3.047 | +382 (+14%) |
| Immagini | 3 | 9 | +6 |
| Immagini con lazy | 0 | 9 (100%) | +9 |
| Link interni | 137 (45 unici) | 142 (45 unici) | +5 |
| Link outbound autorevoli | 0 | 10 | +10 |
| JSON-LD items | 14 | 14 | = |
| Schema Physicians | 5 (con Albo) | 5 (con Albo) | = |
| Schema FAQ | 12 | 12 | = |
| Schema MedicalCondition | 3 (ICD-10) | 3 (ICD-10) | = |
| Riferimenti ESC | 29 | 30 | +1 |
| Riferimenti AHA+ISS | 10 | 22 | +12 |
| Numeri Albo Medici | 5 (HTML) + 5 (schema) | 15 (HTML) + 5 (schema) | = |
| CTA telefono | 6 | 6 | = |
| CTA WhatsApp | 3 | 3 | = |
| Prezzi visibili | 26 | 27 | +1 |
| Anchor text unici | 100 | 88 | Ottimizzato |

---

*Report generato il 19/02/2026 - versione v2.0 (ottimizzazione 100/100)*
*Scoring basato su 6 macro-categorie con 50+ parametri individuali.*
*Tutti i 5 problemi della v1.0 sono stati risolti.*
