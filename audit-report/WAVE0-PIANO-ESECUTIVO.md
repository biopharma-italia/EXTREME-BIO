# WAVE 0 — PIANO ESECUTIVO OPERATIVO
## Stabilizzazione Infrastrutturale bio-clinic.it

**Data:** 15 Febbraio 2026
**Stato:** PRONTO PER ESECUZIONE
**Timeline:** 10 giorni lavorativi
**Rischio:** BASSO (15/100)

---

# QUADRO SITUAZIONALE DEFINITIVO (Audit del 15/02/2026)

## Numeri Reali Verificati con HTTP Headers

| Metrica | Valore | Impatto |
|---|---|---|
| **URL totali auditate** | 251 | — |
| **Pagine /pages/ ancora 200 OK** | **69** | Cannibalizzazione massiva |
| **URL root che fanno 308 → /pages/** | **60** | Contenuto servito tramite redirect inverso |
| **Pagine /pages/ gia 301 (corrette)** | 11 | Solo cluster cardiologia |
| **Pagine /pages/ 404** | 11 | Equity perso, cache Google residua |
| **Pagine /equipe/ con 308** | 51 | Solo trailing-slash normalization — NON un problema |
| **Conflitti canonical confermati** | 17 coppie | Contenuto duplicato indicizzato |
| **URL nel sitemap che NON sono 200 diretto** | ~113 | 71% del sitemap e sprecato |

## Scoperta Chiave: Come Funziona il Framework

L'audit ha rivelato la logica del routing:

```
PAGINA ESISTE A ROOT-LEVEL:
  /visita-ginecologica/ → 200 OK (servita direttamente)
  /visita-ginecologica  → 308 → /visita-ginecologica/ (trailing-slash normalization)

PAGINA NON ESISTE A ROOT-LEVEL:
  /visita-ortopedica/   → 308 → /pages/visita-ortopedica (FALLBACK a legacy!)
  /visita-ortopedica    → 404 (non esiste)

PAGINA /pages/ LEGACY:
  /pages/visita-ortopedica → 200 OK (contenuto reale qui)
  canonical tag: https://bio-clinic.it/visita-ortopedica/ (punta a root che non esiste!)
```

**Diagnosi:** Il framework ha una regola di fallback: se una pagina root non esiste, serve il contenuto da `/pages/`. Questo crea una catena `root/ → 308 → /pages/slug → 200`. I canonical tag sulle pagine `/pages/` puntano correttamente alla versione root, ma la versione root non esiste come pagina reale — esiste solo come 308 verso `/pages/`.

**Soluzione:** Per ogni pagina che oggi fa root→308→/pages/, il contenuto deve essere pubblicato a root-level. Quando il root serve 200 diretto, la pagina `/pages/` diventa ridondante e puo essere 301.

---

# DELIVERABLES PRODOTTI

| File | Descrizione | Righe |
|---|---|---|
| `WAVE0-FOGLIO-MASTER-REDIRECT.csv` | Foglio master con tutte le 140 azioni redirect/routing | 140 |
| `WAVE0-CLOUDFLARE-REDIRECTS.txt` | Regole redirect formato Cloudflare _redirects | 80 regole 301 + 60 note routing |
| `WAVE0-SITEMAP-PULITO.xml` | Sitemap post-Wave0 con solo URL 200 OK | 157 URL |
| `WAVE0-VALIDATION-SCRIPT.sh` | Script bash di validazione automatizzata post-deploy | 6 test suite |
| `wave0_audit_results.csv` | Dati grezzi audit completo (251 URL) | 251 |

---

# AZIONI RICHIESTE AL TEAM TECNICO

## AZIONE 1 — Pubblicare pagine a root-level (PRIORITA MASSIMA)

Le seguenti 60 pagine oggi vivono solo sotto `/pages/`. Devono essere pubblicate a root-level per servire 200 diretto:

### Visite Specialistiche (16 pagine)
```
/visita-ortopedica/          (oggi 308→/pages/visita-ortopedica)
/visita-urologica/           (oggi 308→/pages/visita-urologica)
/visita-oculistica/          (oggi 308→/pages/visita-oculistica)
/visita-orl/                 (oggi 308→/pages/visita-orl)
/visita-gastroenterologica/  (oggi 308→/pages/visita-gastroenterologica)
/visita-pneumologica/        (oggi 308→/pages/visita-pneumologica)
/visita-reumatologica/       (oggi 308→/pages/visita-reumatologica)
/visita-ematologica/         (oggi 308→/pages/visita-ematologica)
/visita-fisiatrica/          (oggi 308→/pages/visita-fisiatrica)
/visita-pediatrica/          (oggi 308→/pages/visita-pediatrica)
/visita-nefrologica/         (oggi 308→/pages/visita-nefrologica)
/visita-chirurgia-vascolare/ (oggi 308→/pages/visita-chirurgia-vascolare)
/visita-internistica/        (oggi 308→/pages/visita-internistica)
/visita-medicina-lavoro/     (oggi 308→/pages/visita-medicina-lavoro)
/visita-medicina-sport/      (oggi 308→/pages/visita-medicina-sport)
/visita-nutrizionale/        (oggi 308→/pages/visita-nutrizionale)
```

### Esami Diagnostici (20 pagine)
```
/ecografia-mammaria/         /ecografia-tiroidea/
/ecografia-transvaginale/    /ecografia-ginecologica/
/ecografia-pelvica/          /ecografia-prostatica/
/ecografia-renale/           /ecografia-addominale/
/ecografia-ostetrica-3d/     /ecografia-morfologica/
/ecg/                        /eco-doppler-arti/
/elettromiografia/           /translucenza-nucale/
/audiometria/                /impedenzometria/
/spirometria/                /campo-visivo/
/scleroterapia/              /infiltrazioni-articolari/
```

### Ginecologia/PMA (13 pagine)
```
/pap-test/                          /hpv-test/
/hpv-dna-test/                      /duopap/
/mappatura-nevi/                     /dermatoscopia-digitale/
/colposcopia/                        /agoaspirato-tiroide/
/checkup-tiroide/                    /monitoraggio-follicolare/
/consulto-pma/                       /chirurgia-ginecologica/
/ginecologi-sassari/
```

### Servizi Specifici (11 pagine)
```
/colloquio-psicologico/              /caressflow/
/perifit-kegel-sassari/              /radiofrequenza-vaginale/
/riabilitazione-pavimento-pelvico/   /trattamenti-pavimento-pelvico/
/rinofibrolaringoscopia/             /assistenza-ostetrica/
/corso-preparto/                     /screening-inps-sardegna/
/symptom-checker/
```

**Metodo tecnico:** Nel CMS/generatore del sito, queste pagine devono essere create/pubblicate a livello root (non sotto `/pages/`). Se il framework genera automaticamente da `/pages/`, la pubblicazione root deve sovrascrivere il fallback 308.

---

## AZIONE 2 — Settare 301 su tutte le pagine /pages/ (80 regole)

Una volta che le pagine root servono 200 diretto, le pagine `/pages/` devono restituire 301 verso la canonica.

Il file `WAVE0-CLOUDFLARE-REDIRECTS.txt` contiene tutte le 80 regole pronte nel formato:

```
/pages/visita-ginecologica  /visita-ginecologica/  301
/pages/visita-ortopedica  /visita-ortopedica/  301
/pages/hpv-test  /pap-test-hpv/  301
...
```

### Attenzione ai target non-standard:
Alcune pagine `/pages/` hanno il canonical che punta a un URL diverso dal semplice strip di `/pages/`:

| /pages/ source | Canonical (target 301) | Nota |
|---|---|---|
| `/pages/hpv-test` | `/pap-test-hpv/` | Nome diverso |
| `/pages/visita-medicina-lavoro` | `/visita-medicina-del-lavoro-sassari/` | Slug diverso |
| `/pages/dermatoscopia-digitale` | `/dermatologia/` | Punta alla hub |
| `/pages/agoaspirato-tiroide` | `/endocrinologia/` | Punta alla hub |
| `/pages/ecografia-ginecologica` | `/ginecologia/` | Punta alla hub |
| `/pages/rinofibrolaringoscopia` | `/otorinolaringoiatria/` | Punta alla hub |
| `/pages/impedenzometria` | `/otorinolaringoiatria/` | Punta alla hub |
| `/pages/monitoraggio-follicolare` | `/pma-fertilita/` | Punta alla hub |
| `/pages/consulto-pma` | `/pma-fertilita/` | Punta alla hub |
| `/pages/chirurgia-ginecologica` | `/isteroscopia/` | Cross-service |
| `/pages/translucenza-nucale` | `/ecografia-morfologica/` | Cross-service |

---

## AZIONE 3 — Recuperare i 404 con 301

Le 11 pagine `/pages/` che oggi restituiscono 404 devono diventare 301 per recuperare eventuali backlink e cache Google:

```
/pages/ginecologia.html      → /ginecologia/          301
/pages/dermatologia.html     → /dermatologia/          301
/pages/neurologia            → /neurologia/            301
/pages/ortopedia             → /ortopedia/             301
/pages/slim-care             → /slim-care/             301
/pages/pma-fertilita         → /pma-fertilita/         301
/pages/specialita            → /specialita/            301
/pages/specialita.html       → /specialita/            301
/pages/ecocardiogramma.html  → /cardiologia/ecocardiogramma/  301
/pages/listino-completo      → /listino-completo/      301
/pages/medicina-del-lavoro   → /medicina-del-lavoro/   301
```

---

## AZIONE 4 — Correggere il canonical su /pages/visita-cardiologica-ecg

Questa e l'unica pagina `/pages/` con canonical che punta a SE STESSA (non alla versione canonica):

```
ATTUALE:  canonical = "https://bio-clinic.it/pages/visita-cardiologica-ecg.html"
CORRETTO: canonical = "https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/"
```

E la pagina `/pages/` deve diventare 301 → `/cardiologia/visita-cardiologica-ecg/`

---

## AZIONE 5 — Aggiornare il sitemap

Sostituire `sitemap.xml` con il contenuto di `WAVE0-SITEMAP-PULITO.xml`:
- **157 URL** (vs 160 attuali)
- Zero URL che restituiscono 308 o 404
- Pagine /equipe/ con URL senza trailing slash (versione 200)
- Rimosso /shop/ (canonical = homepage)
- Rimossi duplicati (/laboratorio/ e /mounjaro-tirzepatide-sassari/ erano duplicati)

---

## AZIONE 6 — Deploy Atomico

**CRITICO:** Le azioni 1, 2, 3, 4, 5 devono andare in produzione nello STESSO deploy.

Se si pubblica prima l'azione 2 (301 su /pages/) senza l'azione 1 (root 200), le pagine che oggi fanno root→308→/pages/ perderanno il contenuto (la catena diventerebbe root→308→/pages/→301→root→308→LOOP).

**Sequenza interna al deploy:**
1. Pubblicare pagine root (azione 1)
2. Attivare 301 su /pages/ (azione 2 + 3)
3. Aggiornare canonical (azione 4)
4. Pubblicare sitemap (azione 5)

---

## AZIONE 7 — Validazione Post-Deploy

Eseguire `WAVE0-VALIDATION-SCRIPT.sh` immediatamente dopo il deploy.

Il script verifica:
- TEST 1: Tutte le /pages/ restituiscono 301
- TEST 2: Tutte le root restituiscono 200 diretto
- TEST 3: Hub pages invariate (200)
- TEST 4: Cluster cardiologia invariato (200)
- TEST 5: Zero redirect loops (max 1 hop)
- TEST 6: Ex-404 /pages/ ora 301

**Gate:** Se anche 1 test fallisce, indagare e correggere prima di procedere.

---

# AZIONI POST-DEPLOY (Giorni 7-10)

## Google Search Console
1. Submit nuovo sitemap.xml
2. URL Inspection su 20 URL prioritarie:
   - Tutte le hub di branca
   - Le 5 visite piu importanti (ginecologica, cardiologica, dermatologica, endocrinologica, neurologica)
   - Le pagine che erano in conflitto piu grave
3. Monitorare Coverage Report per:
   - Nuove pagine "Excluded: Redirected" (le /pages/) → atteso e corretto
   - Nessun nuovo "Server error" o "Soft 404"
   - Nessuna pagina "Discovered but not indexed" in aumento

## Monitoraggio Ranking (30 giorni)
Keyword da monitorare quotidianamente:

| Keyword | Posizione Pre-Wave0 | Target Post-Wave0 |
|---|---|---|
| cardiologo sassari | ~5-7 | ~4-5 |
| ginecologo sassari | ~3-5 | ~2-3 |
| dermatologo sassari | fuori top-10 | ~8-10 (entry) |
| endocrinologo sassari | ~8-10 | ~6-8 |
| neurologo sassari | ~10-15 | ~8-12 |
| laboratorio analisi sassari | ~2-3 | ~2 (stabile) |
| poliambulatorio sassari | ~5-8 | ~4-6 |
| slim care sassari | ~1 | ~1 (difesa) |
| fecondazione assistita sassari | ~3-4 | ~3 (stabile) |

**Allarme:** Fluttuazione > 15% su keyword singola → indagare (probabilmente normale post-301).
**Allarme critico:** Fluttuazione > 30% su piu keyword → verificare catene redirect.
**NON rollbackare:** Il rollback peggiora la situazione. Correggere in avanti.

---

# CONDIZIONI GO/NO-GO PER WAVE 1

Wave 1 (Cluster Ginecologia) puo partire SOLO quando TUTTE queste condizioni sono verificate:

- [ ] Zero URL /pages/ restituiscono 200 OK (script validazione PASS)
- [ ] Zero URL root restituiscono 308 → /pages/ (script validazione PASS)
- [ ] Sitemap contiene solo URL 200 OK verificate
- [ ] GSC non mostra nuovi errori di copertura (check giorno 14)
- [ ] Ranking keyword principali stabili (fluttuazione < 15%)
- [ ] Nessuna catena redirect > 1 hop (script validazione PASS)
- [ ] Almeno 14 giorni di stabilita post-deploy

---

*Documento operativo generato il 15 Febbraio 2026.*
*Tutti i file tecnici sono nella directory `/audit-report/`.*
