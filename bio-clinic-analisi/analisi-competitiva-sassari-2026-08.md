# Analisi Competitiva — Bio-Clinic vs Medìs vs Health Care Center (Sassari)
**Data**: 19/08/2026 · Metodologia: crawl tecnico dei 3 siti, analisi SERP su keyword locali, test UX browser, censimento competitor territoriali.

## 1. Scheda tecnica comparativa

| Dimensione | **Bio-Clinic** | **Medìs (centromedis.it)** | **HCC (hccsassari.it)** |
|---|---|---|---|
| Tecnologia | Statico + CF Pages Functions | ASP.NET custom (.aspx) | WordPress + Elementor + AIOSEO |
| Pagine indicizzabili | **217** | ~100 stimate (sitemap rotta 404!) | ~40-50 |
| TTFB HTML | **0,13s** | 0,29s | timeout dal sandbox, hosting lento (~10s full load, jQuery Migrate, font fallback per rete lenta) |
| Prenotazione online | **Nativa 30s + conferma WhatsApp** | iframe SaniPocket (terza parte) | Form richiesta → ricontatto telefonico |
| Schema markup | MedicalOrganization+FAQ+AggregateRating 4.450 rec | 1 solo MedicalClinic base | Plugin AIOSEO generico |
| Medici | 67 / 31 specialità | **90 / ~30 specialità** | ~50 dichiarati |
| Prova sociale | **4.450 recensioni (MD+Google) in schema** | nessuna in evidenza | "5.698 pazienti soddisfatti", "11.648 visite" |
| Prezzi | Sì (check-up, prestazioni) | tariffe.aspx senza prezzi reali ("--", pochi valori) | **Prezzi chiari sui check-up (68€, 108€, 150€)** |
| Blog/contenuti | landing SEO 217 pagine | Blog attivo 4 categorie (articoli scientifici, rassegna stampa) | Blog minimo (6 post) |
| Multi-sede | No | No | **Sì: Sassari + Nuoro (in apertura)** |
| Servizi differenzianti | Slim Care (Wegovy/Mounjaro), PMA, MOC-DEXA | Odontoiatria, fisioterapia, patenti, medicina lavoro | **Navetta, visite a domicilio, screening gratuiti** |
| Convenzioni assicurative | poco visibili | pagina convenzioni | **~18 loghi (UniSalute, AXA, Poste Vita, Fondo Est…)** |
| Debolezze tecniche | Canvas warnings, no webp/lazy home | Bootstrap 3 (2016!), no canonical, no OG, no lazy, sitemap 404 | Sito lentissimo, hosting che blocca bot, dipendenza plugin |

## 2. Posizionamento SERP (test 19/08/2026)

| Query | Bio-Clinic | Medìs | HCC | Chi vince |
|---|---|---|---|---|
| visita cardiologica Sassari prenotazione | assente diretto (presente via MioDottore/iDoctors) | **#4 diretto** | assente | MioDottore #1, Medìs |
| analisi sangue Sassari laboratorio privato | **#3 (via MioDottore) + #7 diretto** | assente | assente | LAS #1, Pasubio #2 |
| prenotazione analisi sangue Sassari online | assente diretto (MioDottore #6) | assente | assente | **LAS #1 — nostra keyword target!** |
| centro medico polispecialistico Sassari | **#3 diretto** | #2 diretto | #6 diretto | CDS #1 |
| visita ginecologica Sassari | **#6 diretto + dominio MioDottore #1 con Dessole** | #4 | assente | MioDottore |
| mappatura nei Sassari | via iDoctors #2 (Musinu, ns. indirizzo) | #6 | Instagram #8 | MioDottore |

**Lettura chiave**: nessuna delle 3 strutture domina le SERP — i veri "competitor SEO" sono gli **aggregatori** (MioDottore, iDoctors, Doctolib) che occupano le posizioni 1-2 su quasi tutte le query transazionali. Bio-Clinic è l'unico dei 3 ben presente DENTRO gli aggregatori (profili attivi con prezzi) = doppia visibilità.

## 3. Altri competitor territoriali rilevanti (censiti in SERP)

| Competitor | Perché conta | Minaccia |
|---|---|---|
| **CDS – Casa della Salute** (cds.it/struttura/sassari) | #1 su "polispecialistico Sassari", **prezzi in SERP** (cardiologica+ECG 80€), rete multi-regione, radiologia + odontoiatria, laboratorio in arrivo | 🔴 ALTA |
| **LAS – Laboratorio Analisi Sassarese** (lassassari.it) | #1 su tutte le query "analisi sangue Sassari", prenotazione online, convenzione AVIS -15% | 🔴 ALTA (sul laboratorio) |
| **Lab Pasubio** (labpasubio.com) | #2 storico su analisi | 🟡 MEDIA |
| **Policlinico Sassarese** (Gruppo Labor) | brand ospedaliero, prenota online, laboratorio | 🟡 MEDIA |
| **Cerba HealthCare** | multinazionale, landing "esami del sangue a Sassari", fornisce anche i check-up di HCC (partnership!) | 🟡 MEDIA, crescente |
| **Polimedical** | compare accanto a noi su MioDottore per cardiologia | 🟢 BASSA |
| **Centro Cura e Salute** (Platamona) | presidio litorale | 🟢 BASSA |
| **Pro-Clinic** | nicchia estetica/dermatologia | 🟢 BASSA |
| **Aggregatori: MioDottore, iDoctors, Doctolib** | posizioni 1-2 ovunque; iDoctors è partner ufficiale HCC | 🔴 strutturale |

Nota strategica: **HCC sta aprendo a Nuoro** (post sitemap 08/2026) = strategia espansione territoriale; Cerba fornisce loro i check-up → alleanza aggregatore+network in formazione.

## 4. UX comparata

**Bio-Clinic** ✅ ricerca interna 1.136 esami, booking nativo 30s con WhatsApp, TTFB 0,13s ❌ 19 warning Canvas2D console, immagini non-webp, no lazy-load, manca prezzo in SERP.
**Medìs** ✅ IA chiara 4 aree, blog credibile ❌ booking = iframe esterno (attrito, no mobile-friendly), tariffe senza prezzi, stack 2016, zero recensioni visibili.
**HCC** ✅ prezzi chiari, convenzioni visibilissime, navetta/domicilio (accessibilità), fotografia curata ❌ sito lento (10s), form generico invece di booking, contenuti sottili.

## 5. Piano d'azione per Bio-Clinic (prioritizzato)

### Quick win (1-2 settimane)
1. **Prezzi nei meta description e nello schema Offer** delle pagine prestazione top (cardiologica+ECG, ginecologica, mappatura nei, check-up) — CDS vince la SERP proprio col prezzo nel titolo.
2. **Pagina /convenzioni/ con loghi assicurazioni** (se esistono convenzioni) — HCC ne fa un pilastro, noi non le mostriamo.
3. Fix perf home: convertire immagini in **webp**, aggiungere `loading="lazy"`, eliminare i warning Canvas2D (willReadFrequently), preload font.
4. **Contro-mossa LAS**: la nostra landing /laboratorio/prenota/ è già ottimizzata ma LAS domina — aggiungere sezione "prenotazione online in 30 secondi vs modulo con ricontatto" + FAQ schema con "quanto costano le analisi del sangue a Sassari" (People Also Ask attivo).
5. Sfruttare il **vantaggio unico WhatsApp**: nessun competitor ce l'ha — dichiararlo in title/meta delle pagine di prenotazione e nel GBP (Google Business Profile).

### Medio termine (1-2 mesi)
6. **Presidiare gli aggregatori**: MioDottore/iDoctors sono #1 ovunque. Mantenere prezzi aggiornati e slot online su entrambi (Musinu su iDoctors già funziona); valutare Doctolib.
7. **Landing "quanto costa" per le 10 prestazioni top** ("costo visita cardiologica Sassari" è una related search ricorrente) con prezzo + confronto SSN/privato.
8. **Blog clinico leggero** (2 post/mese firmati dai medici) — Medìs ne ricava posizionamenti; noi abbiamo 67 firme potenziali e E-E-A-T superiore.
9. Contatore social proof stile HCC nella hero ("11.648 visite"): noi abbiamo numeri migliori (4.450 recensioni) ma HCC li racconta meglio con contatori dinamici.

### Strategico (3-6 mesi)
10. **Difesa territoriale**: HCC apre a Nuoro — valutare landing "analisi del sangue Nuoro/Alghero/Porto Torres" o punti prelievo satellite prima che il mercato si chiuda.
11. Programma screening/prevenzione con giornate dedicate (HCC li usa come lead magnet gratuito).
12. Monitoraggio trimestrale SERP automatizzato sulle 15 keyword transazionali.

## 6. Verdetto sintetico

| | Punteggio sito | Nota |
|---|---|---|
| **Bio-Clinic** | **8/10** | Migliore tecnologia, SEO scale (217 pp), unico booking nativo + WhatsApp. Gap: prezzi poco esposti, convenzioni invisibili, perf immagini |
| Medìs | 5,5/10 | Contenuti blog buoni ma stack obsoleto, sitemap rotta, booking esterno, zero social proof |
| HCC | 6/10 | Marketing/prezzi/accessibilità ben raccontati, ma sito lento e sottile; in espansione (Nuoro) → da monitorare |
