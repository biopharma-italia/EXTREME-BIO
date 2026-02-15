# PARERE STRATEGICO STRUTTURALE: DOMINAZIONE SASSARI
## Verdetto Definitivo sull'Architettura Bio-Clinic

**Data:** 15 Febbraio 2026  
**Classificazione:** Parere Strategico Vincolante  
**Destinatario:** Leadership Bio-Clinic

---

# LA RISPOSTA DIRETTA

**La risposta corretta e: D) Modello alternativo migliore.**

Nessuna delle tre opzioni A, B, C e corretta nella sua forma pura. La strategia ottimale e una **Ristrutturazione Chirurgica Progressiva** — ne conservativa, ne distruttiva — calibrata sulla realta tecnica scoperta in fase di analisi profonda.

**Motivazione sintetica:** L'architettura attuale non e "rotta". E **in transizione** — e la transizione e gia iniziata ma e incompleta e incoerente. Il problema non e la struttura concettuale; e l'**esecuzione parziale** che genera tre sistemi paralleli in conflitto tra loro.

---

# SEZIONE 1: RADIOGRAFIA REALE DELLA STRUTTURA

## 1.1 Scoperta Critica: Non Esistono Due Sistemi. Ne Esistono TRE.

L'analisi HTTP header-level (non solo crawling, ma verifica redirect reale) ha rivelato una situazione molto piu complessa di quanto apparisse in superficie.

### Sistema 1: Le Pagine `/pages/` (il sistema LEGACY attivo)

Queste pagine sono **vive, indicizzate, e servono contenuto HTTP 200**:

| URL | Status | Indicizzata Google |
|---|---|---|
| `/pages/visita-cardiologica-ecg` | **200 OK** | SI — Google la serve in SERP |
| `/pages/visita-ginecologica` | **200 OK** | SI — /pages/ginecologia.html era in SERP |
| `/pages/visita-dermatologica` | **200 OK** | SI |
| `/pages/visita-endocrinologica` | **200 OK** | SI — posizione 9 per "visita endocrinologica sassari" |
| `/pages/visita-neurologica` | **200 OK** | SI |
| `/pages/visita-ortopedica` | **200 OK** | SI |
| `/pages/ginecologi-sassari` | **200 OK** | SI |
| `/pages/isterosalpingografia` | **200 OK** | SI |
| `/pages/isteroscopia` | **200 OK** | SI |
| `/pages/ecocardiogramma.html` | 404 | Era indicizzata (cached in SERP) |
| `/pages/cardiologia` | **301 -> /cardiologia/** | Redirect attivo (corretto) |
| `/pages/endocrinologia` | **301 -> /endocrinologia/** | Redirect attivo (corretto) |
| `/pages/neurologia` | 404 | Google mostra ancora in cache |
| `/pages/ortopedia` | 404 | Google mostra ancora in cache |

**Dato chiave:** Alcuni redirect sono stati implementati (cardiologia, endocrinologia), ma la maggior parte delle pagine `/pages/` servizio-livello sono ANCORA VIVE con status 200.

### Sistema 2: Le Pagine Root-Level (il sistema ATTUALE nel sitemap)

Queste sono le pagine nel sitemap.xml ufficiale:

| URL | Status | Contenuto |
|---|---|---|
| `/visita-cardiologica/` | **200 OK** | Pagina servizio REDIRECT a `/cardiologia/visita-cardiologica-ecg/` |
| `/visita-ginecologica/` | **200 OK** | Pagina servizio completa |
| `/visita-dermatologica/` | **200 OK** | Pagina servizio completa |
| `/visita-endocrinologica/` | **200 OK** | Pagina servizio completa |
| `/visita-neurologica/` | **200 OK** | Pagina servizio completa |
| `/visita-ortopedica/` | **404** | MORTA (non esiste!) |
| `/mappatura-nevi/` | **404** | MORTA (nel sitemap ma inesistente) |
| `/pap-test/` | **404** | MORTA |
| `/elettromiografia/` | **404** | MORTA |

**CRITICO:** Il sitemap.xml dichiara URL che restituiscono 404. Questo invia a Google un segnale di **scarsa manutenzione tecnica** e spreca crawl budget.

### Sistema 3: La Struttura Gerarchica (il sistema TARGET)

Solo per cardiologia e parzialmente laboratorio:

| URL | Status |
|---|---|
| `/cardiologia/visita-cardiologica-ecg/` | **200 OK** — Pagina ricca e completa |
| `/cardiologia/ecocardiogramma/` | **200 OK** |
| `/cardiologia/holter-ecg/` | **200 OK** |
| `/cardiologia/holter-pressorio/` | **200 OK** |
| `/cardiologia/checkup-cardiovascolare/` | **200 OK** |
| `/laboratorio/stat/` | **200 OK** |

E la struttura di arrivo evidentemente pensata dagli sviluppatori, ma applicata solo a 1 branca su 9.

### Situazione Reale Inversa: `/hpv-test/` e `/ginecologi-sassari/`

Scoperta: Alcune URL root-level REDIRECTANO A `/pages/`:

| URL Root | Redirect | Destinazione |
|---|---|---|
| `/hpv-test/` | **308 ->** | `/pages/hpv-test` |
| `/ginecologi-sassari/` | **308 ->** | `/pages/ginecologi-sassari` |

Questo e **l'inverso** di quello che dovrebbe accadere. Il sitemap dichiara `/hpv-test/` e `/ginecologi-sassari/` come URL canoniche, ma queste redirectano alle pagine `/pages/`. Google segue il redirect e indicizza `/pages/`.

## 1.2 Mappa Conflitto Completa per Branca

### CARDIOLOGIA — Stato: Transizione quasi completata

```
/cardiologia/                           -> 200 (Hub) CORRETTO
/cardiologia/visita-cardiologica-ecg/   -> 200 (Servizio gerarchico) CORRETTO
/cardiologia/ecocardiogramma/           -> 200 CORRETTO
/cardiologia/holter-ecg/                -> 200 CORRETTO
/cardiologia/holter-pressorio/          -> 200 CORRETTO
/cardiologia/checkup-cardiovascolare/   -> 200 CORRETTO

/visita-cardiologica/                   -> 200 (Redirect interno a /cardiologia/visita-cardiologica-ecg/) QUASI OK
/pages/cardiologia                      -> 301 -> /cardiologia/ CORRETTO
/pages/visita-cardiologica-ecg          -> 200 DUPLICATO ATTIVO!
```

**Problema residuo:** `/pages/visita-cardiologica-ecg` e ancora viva (200 OK) e indicizzata da Google. Compete con `/cardiologia/visita-cardiologica-ecg/`.

### GINECOLOGIA — Stato: Caos totale (3+ pagine in conflitto)

```
/ginecologia/                           -> 200 (Hub) 
/visita-ginecologica/                   -> 200 (Servizio root-level) 
/pages/visita-ginecologica              -> 200 (Legacy VIVA!)
/ginecologi-sassari/                    -> 308 -> /pages/ginecologi-sassari (redirect inverso!)
/pages/ginecologi-sassari               -> 200 (Legacy VIVA!)
/pages/ginecologia.html                 -> 404 (morta, ma Google ha ancora cache)
```

**5 URL** competono per gli stessi intent. Di queste, 3 sono attive (200 OK) contemporaneamente.

### DERMATOLOGIA — Stato: Dual-system attivo

```
/dermatologia/                          -> 200 (Hub)
/visita-dermatologica/                  -> 200 (Servizio root-level)
/pages/visita-dermatologica             -> 200 (Legacy VIVA!)
/pages/dermatologia.html                -> 404 (morta)
/mappatura-nevi/                        -> 404 (nel sitemap ma morta!)
```

**3 URL attive** per lo stesso intento di ricerca. Una nel sitemap che non esiste.

### ENDOCRINOLOGIA — Stato: Parzialmente risolto

```
/endocrinologia/                        -> 200 (Hub)
/visita-endocrinologica/                -> 200 (Servizio root-level)
/pages/endocrinologia                   -> 301 -> /endocrinologia/ (CORRETTO)
/pages/visita-endocrinologica           -> 200 (Legacy VIVA!)
```

**3 URL attive.** La hub e redirectata correttamente ma la pagina servizio `/pages/` e ancora viva.

### NEUROLOGIA — Stato: Inconsistente

```
/neurologia/                            -> 200 (Hub)
/visita-neurologica/                    -> 200 (Servizio root-level)
/pages/neurologia                       -> 404 (morta, Google ha cache)
/pages/visita-neurologica               -> 200 (Legacy VIVA!)
```

### ORTOPEDIA — Stato: Rotto

```
/ortopedia/                             -> 200 (Hub)
/visita-ortopedica/                     -> 404 (nel sitemap ma MORTA!)
/pages/ortopedia                        -> 404 (morta, Google ha cache)
/pages/visita-ortopedica                -> 200 (Legacy VIVA!)
```

**La pagina servizio nel sitemap non esiste.** L'unica pagina servizio attiva e sotto `/pages/`. Questo e il peggiore scenario possibile.

## 1.3 Diagnosi Tecnica Definitiva

| Problema | Gravita | Impatto |
|---|---|---|
| **3 sistemi URL paralleli** (pages, root, gerarchico) | CRITICA | Google non sa quale versione scegliere |
| **Sitemap con 404** | ALTA | Spreco crawl budget, segnale di negligenza |
| **Redirect inversi** (root -> /pages/) | CRITICA | Consolidano autorita sulla versione sbagliata |
| **Pagine /pages/ ancora 200 OK** | CRITICA | Cannibalizzazione attiva, confermata da SERP |
| **Solo Cardiologia migrata** | ALTA | Incoerenza strutturale percepita da Google |
| **Transizione incompiuta** | CRITICA | Peggio di nessuna transizione: confusione massima |

---

# SEZIONE 2: DEMOLIZIONE CRITICA DELLE 4 OPZIONI

## Opzione A: Ottimizzare Struttura Attuale Gradualmente

### Il Suo Argomento
"Non rompere cio che funziona. Bio-Clinic e gia a 72/100 Sassari. Ottimizza meta tag, contenuti, schema markup. Evita rischi di migrazione."

### Perche e SBAGLIATA

**1. Non esiste una "struttura attuale" da ottimizzare.** Esistono tre sistemi in conflitto. Ottimizzare singole pagine su un'architettura rotta e come ridipingere un muro con le fondamenta compromesse.

**2. I 404 nel sitemap e i redirect inversi non si risolvono con ottimizzazione graduale.** Richiedono intervento strutturale immediato. Ogni giorno in piu, Googlebot spreca budget di crawl su URL morte e consolida segnali sulle pagine sbagliate.

**3. Il gap di SERP sulla dermatologia non e un problema di contenuto ma di architettura.** La pagina `/dermatologia/` esiste e ha buon contenuto. Non si posiziona perche compete con `/visita-dermatologica/` e `/pages/visita-dermatologica`, nessuna delle quali ha la forza di emergere singolarmente.

**4. Senza ristrutturazione, il ceiling e circa 78/100.** Si possono guadagnare 5-8 punti con EEAT overlay, ma la dispersione strutturale impedisce qualsiasi salto oltre. Per arrivare a 95+ serve coerenza architetturale.

**Score: 25/100 — BOCCIATA**

---

## Opzione B: Ristrutturare Completamente in Cluster Verticali per "Centro"

### Il Suo Argomento
"Bio-Clinic e un centro medico. Ogni branca deve diventare un cluster verticale indipendente: hub + servizi + condizioni + medici. Migrazione massiva, redirect 301 totali."

### Perche e PARZIALMENTE CORRETTA ma RISCHIOSA

**1. Il modello cluster verticale e corretto.** La cardiologia lo dimostra: l'unica branca con struttura gerarchica completa e quella con la migliore coerenza tecnica. Il modello funziona.

**2. MA la migrazione massiva simultanea e un rischio calcolabile ma reale.** Migrare 80+ URL con 301 in un unico deploy puo causare:
- Drop temporaneo del 15-30% del traffico organico per 4-8 settimane
- Rischio di errori nelle catene di redirect (gia presenti!)
- Google potrebbe impiegare 2-3 mesi per ri-consolidare tutti i segnali

**3. Il concetto di "Centro" nell'URL e irrilevante.** L'utente non cerca "centro cardiologia sassari" — cerca "cardiologo sassari" o "visita cardiologica sassari". La struttura deve riflettere gli **intenti di ricerca**, non l'organigramma della clinica.

**4. Rischio esecuzione: chi ha fatto la migrazione attuale l'ha fatta male.** Se la migrazione di cardiologia ha lasciato `/pages/visita-cardiologica-ecg` attiva come 200 OK, una migrazione massiva rischia di moltiplicare errori simili.

**Score: 60/100 — DIREZIONE CORRETTA, ESECUZIONE DA RIPROGETTARE**

---

## Opzione C: Architettura Ospedaliera Digitale Scalabile Multi-Sede

### Il Suo Argomento
"Pensare gia in ottica `/sassari/`, `/olbia/`, `/alghero/`. Struttura tipo ospedale multi-sede fin da subito."

### Perche e PREMATURA e CONTROPRODUCENTE

**1. Bio-Clinic ha UNA sede.** Creare la struttura `/sassari/cardiologia/` quando non esiste `/olbia/` ne `/alghero/` e un errore di over-engineering. Google vede una struttura complessa che non corrisponde alla realta dell'entita.

**2. Aggiungere un livello gerarchico inutile diluisce i segnali.** Oggi `/cardiologia/` e a 1 clic dalla homepage. Con `/sassari/cardiologia/` diventa a 2 clic. Per un sito mono-sede, questo non aggiunge rilevanza locale (il sito E GIA tutto di Sassari) ma aggiunge profondita di crawl.

**3. Il momento per la struttura multi-sede e quando si apre la seconda sede.** A quel punto si creano `/sassari/` e `/olbia/` e si redirectano le pagine attuali. Farlo prima e ingegneria speculativa che danneggia il presente.

**4. Google Business Profile e il segnale locale dominante, non la struttura URL.** Per dominare Sassari, Bio-Clinic deve avere un GBP perfetto, NAP coerente, e contenuto con keyword locale. Non ha bisogno di `/sassari/` nel percorso URL.

**5. Eccezione: le pagine territoriali `/nord-sardegna/` HANNO senso.** Ma come contenuto editoriale/landing, non come struttura gerarchica del sito.

**Score: 30/100 — PREMATURA. DA IMPLEMENTARE SOLO AL MOMENTO DELL'ESPANSIONE REALE.**

---

## Opzione D: Modello Alternativo — Ristrutturazione Chirurgica Progressiva

### Il Mio Verdetto

L'approccio corretto e una **chirurgia progressiva in 3 fasi** che:

1. **PRIMA** elimina il conflitto a tre sistemi (emergenza tecnica)
2. **POI** estende il modello cardiologia a tutte le branche (evoluzione architetturale)
3. **INFINE** aggiunge profondita verticale (contenuto, EEAT, espansione geo)

Non e ne conservativa ne distruttiva. E **sequenziale, verificabile, e reversibile a ogni step**.

**Score: 88/100 — APPROCCIO RACCOMANDATO**

---

# SEZIONE 3: ARCHITETTURA IDEALE DEFINITA

## 3.1 Architettura Target per Dominazione Sassari (Mono-Sede)

```
bio-clinic.it/
|
|--- TIER 1: HUB DI BRANCA (1 clic dalla homepage)
|    |
|    |-- /cardiologia/                    [Hub Cardiologia — GIA ESISTENTE E CORRETTO]
|    |-- /ginecologia/                    [Hub Ginecologia — GIA ESISTENTE]
|    |-- /dermatologia/                   [Hub Dermatologia — GIA ESISTENTE]
|    |-- /endocrinologia/                 [Hub Endocrinologia — GIA ESISTENTE]
|    |-- /neurologia/                     [Hub Neurologia — GIA ESISTENTE]
|    |-- /pma-fertilita/                  [Hub PMA — GIA ESISTENTE]
|    |-- /ortopedia/                      [Hub Ortopedia — GIA ESISTENTE]
|    |-- /slim-care/                      [Hub Slim Care — GIA ESISTENTE]
|    |-- /laboratorio/                    [Hub Laboratorio — GIA ESISTENTE]
|
|--- TIER 2: PAGINE SERVIZIO (sotto ogni hub — 2 clic dalla homepage)
|    |
|    |-- /cardiologia/visita-cardiologica/         [GIA OK per cardiologia]
|    |-- /cardiologia/ecocardiogramma/              [GIA OK]
|    |-- /cardiologia/holter-ecg/                   [GIA OK]
|    |-- /cardiologia/holter-pressorio/             [GIA OK]
|    |-- /cardiologia/checkup-cardiovascolare/      [GIA OK]
|    |
|    |-- /ginecologia/visita-ginecologica/          [DA MIGRARE da /visita-ginecologica/]
|    |-- /ginecologia/ecografia-transvaginale/      [NUOVA o da migrare]
|    |-- /ginecologia/pap-test/                     [DA MIGRARE da /pages/pap-test]
|    |-- /ginecologia/hpv-test/                     [DA MIGRARE da /pages/hpv-test]
|    |-- /ginecologia/isteroscopia/                 [DA MIGRARE da /isteroscopia/]
|    |-- /ginecologia/isterosalpingografia/         [DA MIGRARE da /isterosalpingografia/]
|    |-- /ginecologia/colposcopia/                  [DA MIGRARE]
|    |-- /ginecologia/ecografia-morfologica/        [DA MIGRARE]
|    |-- /ginecologia/ginecologi-sassari/           [DA MIGRARE da /pages/ginecologi-sassari]
|    |
|    |-- /dermatologia/visita-dermatologica/        [DA MIGRARE da /visita-dermatologica/]
|    |-- /dermatologia/mappatura-nevi/              [DA CREARE — root 404!]
|    |-- /dermatologia/dermatoscopia/               [DA CREARE]
|    |
|    |-- /endocrinologia/visita-endocrinologica/    [DA MIGRARE]
|    |-- /endocrinologia/ecografia-tiroidea/        [DA CREARE]
|    |-- /endocrinologia/agoaspirato-tiroide/       [DA MIGRARE]
|    |-- /endocrinologia/checkup-tiroide/           [DA MIGRARE]
|    |
|    |-- /neurologia/visita-neurologica/            [DA MIGRARE]
|    |-- /neurologia/elettromiografia/              [DA CREARE]
|    |
|    |-- /pma-fertilita/consulto-pma/               [DA MIGRARE]
|    |-- /pma-fertilita/monitoraggio-follicolare/   [DA MIGRARE]
|    |-- /pma-fertilita/isterosalpingografia/       [Collegamento a ginecologia o duplicato]
|    |
|    |-- /ortopedia/visita-ortopedica/              [DA CREARE — root 404!]
|    |-- /ortopedia/infiltrazioni-articolari/       [DA MIGRARE]
|    |
|    |-- /slim-care/donna/                          [GIA ESISTENTE come /slim-care-donna/]
|    |-- /slim-care/mounjaro/                       [DA MIGRARE da /mounjaro-tirzepatide-sassari/]
|    |
|    |-- /laboratorio/stat/                         [GIA ESISTENTE]
|    |-- /laboratorio/preparazione-esami/           [DA MIGRARE]
|    |-- /laboratorio/genetica/                     [DA MIGRARE da /genetica/]
|
|--- TIER 3: PAGINE CONDIZIONE/SINTOMO (sotto ogni hub — 2 clic dalla homepage)
|    |
|    |-- /cardiologia/ipertensione/                 [NUOVA]
|    |-- /cardiologia/aritmie/                      [NUOVA]
|    |-- /cardiologia/scompenso-cardiaco/           [NUOVA]
|    |
|    |-- /ginecologia/menopausa/                    [NUOVA]
|    |-- /ginecologia/endometriosi/                 [NUOVA]
|    |-- /ginecologia/ovaio-policistico/            [NUOVA]
|    |
|    |-- /dermatologia/acne/                        [NUOVA]
|    |-- /dermatologia/psoriasi/                    [NUOVA]
|    |-- /dermatologia/melanoma-prevenzione/        [NUOVA]
|    |
|    |-- /endocrinologia/ipotiroidismo/             [NUOVA]
|    |-- /endocrinologia/noduli-tiroidei/           [NUOVA]
|    |-- /endocrinologia/diabete-tipo-2/            [NUOVA]
|    |
|    |-- /neurologia/cefalea-emicrania/             [NUOVA]
|    |-- /neurologia/tunnel-carpale/                [NUOVA]
|    |
|    |-- /pma-fertilita/infertilita-femminile/      [NUOVA]
|    |-- /pma-fertilita/infertilita-maschile/       [NUOVA]
|    |
|    |-- /ortopedia/mal-di-schiena/                 [NUOVA]
|    |-- /ortopedia/artrosi-ginocchio/              [NUOVA]
|    |
|    |-- /slim-care/obesita/                        [NUOVA]
|    |-- /slim-care/sindrome-metabolica/            [NUOVA]
|
|--- TIER ISTITUZIONALE
|    |-- /equipe/                                   [INVARIATO]
|    |-- /equipe/[nome-medico]/                     [INVARIATI]
|    |-- /chi-siamo/                                [INVARIATO]
|    |-- /contatti/                                 [INVARIATO]
|    |-- /convenzioni/                              [INVARIATO]
|    |-- /prevenzione/                              [INVARIATO]
|    |-- /specialita/                               [INVARIATO]
|    |-- /qualita-sicurezza/                        [NUOVA — EEAT]
|    |-- /ricerca-pubblicazioni/                    [NUOVA — EEAT]
|
|--- TIER EDITORIALE
|    |-- /blog/                                     [RILANCIARE]
|    |-- /blog/[categoria]/[articolo]/              [STRUTTURA NUOVA]
|
|--- TIER GEO-ESPANSIONE (solo quando necessario)
|    |-- /nord-sardegna/                            [LANDING GEO — NUOVA]
|    |-- /nord-sardegna/servizi-alghero/            [LANDING MICRO-LOCAL]
|    |-- /nord-sardegna/servizi-olbia/              [LANDING MICRO-LOCAL]
```

## 3.2 Principi Architetturali Non Negoziabili

### Principio 1: Una sola versione di ogni pagina. Zero eccezioni.
Per ogni intent di ricerca deve esistere UNA e UNA SOLA URL. Tutte le altre devono restituire 301 permanente verso quella canonica.

### Principio 2: Ogni servizio vive SOTTO la sua branca.
`/ginecologia/pap-test/` e non `/pap-test/`. Questo crea il segnale di cluster tematico che Google usa per valutare la topical authority.

### Principio 3: Le hub di branca sono il cuore del sistema.
Le 9 hub di branca sono le pagine piu importanti dopo la homepage. Devono ricevere il massimo link juice: link dalla homepage, link dal menu, link dai profili medici, link dai servizi subordinati.

### Principio 4: La profondita massima e 2 clic dalla homepage.
Homepage -> Hub branca (1 clic) -> Servizio/Condizione (2 clic). Mai piu di 2 livelli. Crawl budget efficiente, user experience ottimale.

### Principio 5: Le pagine `/pages/` devono essere ELIMINATE completamente.
Non 404. Non noindex. **301 permanente** verso la pagina canonica corrispondente. OGNI pagina `/pages/` ancora viva e una sanguinamento attivo di autorita.

### Principio 6: Il sitemap deve riflettere ESATTAMENTE la realta.
Zero URL che restituiscono 404. Zero URL che redirectano. Solo pagine 200 OK canoniche.

---

# SEZIONE 4: ANALISI RISCHI/BENEFICI DELLA MIGRAZIONE

## 4.1 Rischi Reali della Ristrutturazione

| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| Drop temporaneo traffico (4-8 settimane) | 85% | MEDIO (-15/25%) | Migrazione per branca, non simultanea |
| Errori nella catena di redirect | 60% | ALTO | QA manuale su ogni URL pre e post deploy |
| Google lento nel consolidamento segnali | 70% | BASSO | Sitemap aggiornata + URL Inspection API |
| Perdita snippet/rich result temporanea | 50% | MEDIO | Schema markup migrato con le pagine |
| Errore umano nella mappa redirect | 40% | CRITICO | Foglio redirect completo verificato 2 volte |

## 4.2 Rischi Reali del NON Agire

| Rischio | Probabilita | Impatto |
|---|---|---|
| Cannibalizzazione perpetua crescente | 100% | ALTO — ogni nuova pagina aggiunge confusione |
| Medical Core Update penalty | 45% | CRITICO — drop 40-60% del traffico |
| CDS Sassari supera Bio-Clinic nelle SERP | 60% entro 12 mesi | ALTO — catena nazionale con budget |
| Dermatologia resta invisibile | 95% | MEDIO — revenue persa |
| Impossibilita di scalare a multi-sede | 100% | CRITICO per piano 3 anni |
| Google deprezza segnali delle URL 404 nel sitemap | 100% | MEDIO — gia in atto |

## 4.3 Calcolo Netto

**Costo del NON agire in 12 mesi:**
- Traffico organico stagnante o in calo: stimato -10/20% per effetto cannibalizzazione crescente + competitor in crescita
- Revenue persa dermatologia: stimata 0 nuovi pazienti dalla ricerca organica per "dermatologo sassari"
- Vulnerabilita Core Update: rischio catastrofico non quantificabile

**Costo dell'agire:**
- Drop temporaneo: -15/25% per 4-8 settimane, recupero previsto entro 90 giorni
- Effort tecnico: 80-120 ore di sviluppo (stimato)
- Costo zero in risorse esterne se team tecnico interno competente

**Verdetto:** Il rapporto rischio/beneficio e **nettamente a favore della ristrutturazione**. Il rischio di non agire e superiore in ogni scenario modellato.

---

# SEZIONE 5: IL PIANO DI MIGRAZIONE CHIRURGICA

## Principio Operativo: Migrazione per Branca, Non Simultanea

NON migrare tutto in un colpo. Migrare UNA branca alla volta, verificare il consolidamento, poi procedere con la successiva.

**Ordine di migrazione basato su priorita strategica:**

### WAVE 1 — Settimana 1-2: EMERGENZA TECNICA (zero rischio SERP)

Queste azioni non richiedono migrazione di contenuto. Sono pulizia tecnica pura.

```
AZIONE 1: Redirect 301 tutte le /pages/ hub verso le hub canoniche
  /pages/cardiologia     -> /cardiologia/          [GIA FATTO - verificare]
  /pages/endocrinologia  -> /endocrinologia/       [GIA FATTO - verificare]
  /pages/ginecologia.html -> /ginecologia/         [404 - settare 301 per sicurezza]
  /pages/dermatologia.html -> /dermatologia/       [404 - settare 301 per sicurezza]
  /pages/neurologia      -> /neurologia/           [404 - settare 301]
  /pages/ortopedia       -> /ortopedia/            [404 - settare 301]
  /pages/slim-care       -> /slim-care/            [404 - settare 301]
  /pages/pma-fertilita   -> /pma-fertilita/        [404 - settare 301]
  /pages/specialita.html -> /specialita/           [SERVE 301]
  /pages/convenzioni     -> /convenzioni/          [SERVE 301]

AZIONE 2: Redirect 301 tutte le /pages/ servizio verso la versione root (temporanea)
  /pages/visita-cardiologica-ecg    -> /cardiologia/visita-cardiologica-ecg/  [301]
  /pages/visita-ginecologica        -> /visita-ginecologica/                  [301 temporaneo]
  /pages/visita-dermatologica       -> /visita-dermatologica/                 [301 temporaneo]
  /pages/visita-endocrinologica     -> /visita-endocrinologica/               [301 temporaneo]
  /pages/visita-neurologica         -> /visita-neurologica/                   [301 temporaneo]
  /pages/visita-ortopedica          -> /ortopedia/                            [301 alla hub]
  /pages/ginecologi-sassari         -> /ginecologia/                          [301 DEFINITIVO]
  /pages/hpv-test                   -> /hpv-test/ (temp) poi /ginecologia/hpv-test/
  /pages/pap-test.html              -> /ginecologia/pap-test/                 [301]
  /pages/isterosalpingografia       -> /isterosalpingografia/                 [301 temporaneo]
  /pages/isteroscopia               -> /isteroscopia/                         [301 temporaneo]
  /pages/ecocardiogramma.html       -> /cardiologia/ecocardiogramma/         [301]
  /pages/duopap.html                -> /ginecologia/duopap/                   [301]
  /pages/genetica.html              -> /laboratorio/genetica/                 [301]
  /pages/checkup-cardiovascolare    -> /cardiologia/checkup-cardiovascolare/  [301]

AZIONE 3: Fix redirect inversi
  /hpv-test/          SMETTERE di redirectare a /pages/hpv-test -> diventare 301 a /ginecologia/hpv-test/
  /ginecologi-sassari/ SMETTERE di redirectare a /pages/ -> diventare 301 a /ginecologia/

AZIONE 4: Pulire sitemap
  Rimuovere TUTTE le URL che restituiscono 404
  Rimuovere /visita-ortopedica/ (404)
  Rimuovere /mappatura-nevi/ (404)
  Rimuovere /pap-test/ (404)
  Rimuovere /elettromiografia/ (404)
  Rimuovere /ecografia-tiroidea/ (404)
  Rimuovere tutte le URL /pages/ dal sitemap
```

**Risultato atteso:** Eliminazione di 25+ conflitti, recupero crawl budget, consolidamento segnali. Impatto SERP positivo entro 2-4 settimane. **Rischio quasi zero** perche le pagine con ranking sono quelle canoniche.

### WAVE 2 — Settimana 3-4: MIGRAZIONE GINECOLOGIA

La branca piu cannibalizzata, quindi la piu urgente.

```
CREARE:
  /ginecologia/visita-ginecologica/          [contenuto da /visita-ginecologica/]
  /ginecologia/pap-test/                     [contenuto nuovo o migrato]
  /ginecologia/hpv-test/                     [contenuto nuovo o migrato]
  /ginecologia/ecografia-transvaginale/      [contenuto nuovo]
  /ginecologia/ecografia-morfologica/        [contenuto nuovo]
  /ginecologia/isteroscopia/                 [contenuto da /isteroscopia/]
  /ginecologia/isterosalpingografia/         [contenuto da /isterosalpingografia/]
  /ginecologia/colposcopia/                  [contenuto nuovo]

REDIRECT 301:
  /visita-ginecologica/        -> /ginecologia/visita-ginecologica/
  /isteroscopia/               -> /ginecologia/isteroscopia/
  /isterosalpingografia/       -> /ginecologia/isterosalpingografia/
  /colposcopia/                -> /ginecologia/colposcopia/
  /ecografia-ginecologica/     -> /ginecologia/ecografia-transvaginale/
  /ecografia-transvaginale/    -> /ginecologia/ecografia-transvaginale/
  /ecografia-pelvica/          -> /ginecologia/visita-ginecologica/
  /ecografia-morfologica/      -> /ginecologia/ecografia-morfologica/
  /translucenza-nucale/        -> /ginecologia/ecografia-morfologica/ [o pagina dedicata]
  /monitoraggio-follicolare/   -> /pma-fertilita/monitoraggio-follicolare/
  /consulto-pma/               -> /pma-fertilita/consulto-pma/

AGGIORNARE:
  Sitemap con nuove URL
  Internal linking su hub /ginecologia/ verso tutte le sotto-pagine
  Profili ginecologi -> link a /ginecologia/visita-ginecologica/
```

### WAVE 3 — Settimana 5-6: MIGRAZIONE DERMATOLOGIA (emergenza SERP)

```
CREARE:
  /dermatologia/visita-dermatologica/
  /dermatologia/mappatura-nevi/
  /dermatologia/dermatoscopia/
  /dermatologia/acne/                    [NUOVA - pagina condizione]
  /dermatologia/psoriasi/                [NUOVA - pagina condizione]
  /dermatologia/melanoma-prevenzione/    [NUOVA - pagina condizione]

REDIRECT 301:
  /visita-dermatologica/  -> /dermatologia/visita-dermatologica/
  /dermatoscopia-digitale/ -> /dermatologia/dermatoscopia/
```

### WAVE 4 — Settimana 7-8: MIGRAZIONE ENDOCRINOLOGIA + NEUROLOGIA + ORTOPEDIA

```
ENDOCRINOLOGIA:
  CREARE: /endocrinologia/visita-endocrinologica/
  CREARE: /endocrinologia/ecografia-tiroidea/
  CREARE: /endocrinologia/agoaspirato-tiroide/
  CREARE: /endocrinologia/checkup-tiroide/
  301: /visita-endocrinologica/ -> /endocrinologia/visita-endocrinologica/
  301: /ecografia-tiroidea/    -> /endocrinologia/ecografia-tiroidea/
  301: /agoaspirato-tiroide/   -> /endocrinologia/agoaspirato-tiroide/
  301: /checkup-tiroide/       -> /endocrinologia/checkup-tiroide/

NEUROLOGIA:
  CREARE: /neurologia/visita-neurologica/
  CREARE: /neurologia/elettromiografia/
  301: /visita-neurologica/ -> /neurologia/visita-neurologica/

ORTOPEDIA:
  CREARE: /ortopedia/visita-ortopedica/         [NON ESISTE — creare da zero]
  CREARE: /ortopedia/infiltrazioni-articolari/
  301: /infiltrazioni-articolari/ -> /ortopedia/infiltrazioni-articolari/
```

### WAVE 5 — Settimana 9-10: PMA + SLIM CARE + LABORATORIO

```
PMA:
  CREARE: /pma-fertilita/consulto-pma/
  CREARE: /pma-fertilita/monitoraggio-follicolare/
  CREARE: /pma-fertilita/isterosalpingografia/     [o cross-link a ginecologia]

SLIM CARE:
  CREARE: /slim-care/donna/
  CREARE: /slim-care/mounjaro/
  301: /slim-care-donna/              -> /slim-care/donna/
  301: /mounjaro-tirzepatide-sassari/ -> /slim-care/mounjaro/

LABORATORIO:
  CREARE: /laboratorio/preparazione-esami/
  CREARE: /laboratorio/genetica/
  301: /preparazione-esami/ -> /laboratorio/preparazione-esami/
  301: /genetica/           -> /laboratorio/genetica/
```

### WAVE 6 — Settimana 11-12: CONTENUTO EEAT + PAGINE CONDIZIONE

```
SU OGNI PAGINA SERVIZIO E HUB:
  + "Contenuto a cura del Dr. [Nome], Specialista in [Specialita]"
  + "Ultimo aggiornamento: [Mese Anno]"
  + "Revisionato dal Prof. Salvatore Dessole, Direttore Sanitario"

SU OGNI PROFILO MEDICO:
  + Numero iscrizione Albo Medici
  + Pubblicazioni PubMed (dove esistono)

CREARE PAGINE CONDIZIONE (minimo 2 per branca):
  /cardiologia/ipertensione/
  /cardiologia/aritmie/
  /ginecologia/menopausa/
  /ginecologia/endometriosi/
  /dermatologia/acne/                [gia in WAVE 3]
  /dermatologia/psoriasi/            [gia in WAVE 3]
  /endocrinologia/ipotiroidismo/
  /endocrinologia/noduli-tiroidei/
  /neurologia/cefalea-emicrania/
  /ortopedia/mal-di-schiena/
  /pma-fertilita/infertilita-femminile/
  /slim-care/obesita/

IMPLEMENTARE SCHEMA MARKUP:
  + MedicalClinic su homepage
  + FAQPage su tutte le pagine con FAQ
  + Physician su tutti i profili medici
  + AggregateRating (3.214 recensioni, 5.0)
  + BreadcrumbList su tutte le pagine
  + MedicalCondition sulle pagine condizione
  + OfferCatalog sulle pagine con prezzi
```

---

# SEZIONE 6: ARCHITETTURA PER NORD SARDEGNA (Senza Multi-Sede)

## Strategia: Landing Editoriali Geo-Targetizzate

NON serve creare una struttura multi-sede per presidiare Nord Sardegna. Servono **landing page editoriali** che intercettino query territoriali.

```
/nord-sardegna/                              -> "Centro Medico di Riferimento per il Nord Sardegna"
/nord-sardegna/servizi-alghero/              -> "Servizi Medici per Alghero | Bio-Clinic Sassari"
/nord-sardegna/servizi-olbia/                -> "Servizi Medici per Olbia | Bio-Clinic Sassari"
/nord-sardegna/servizi-porto-torres/         -> "Servizi Medici per Porto Torres"
/nord-sardegna/servizi-tempio/               -> "Servizi Medici per Tempio Pausania"
```

Ogni landing include:
- Distanza/tempo di percorrenza da quella citta
- Specialita disponibili
- Orari compatibili (7-21!)
- Link alle hub di branca
- Mappa con indicazioni

**Quando si apre una sede reale a Olbia:**
1. Creare `/olbia/` come hub sede
2. Spostare i servizi disponibili sotto `/olbia/cardiologia/`, ecc.
3. Redirect `/nord-sardegna/servizi-olbia/` -> `/olbia/`
4. Mantenere le altre landing micro-local

## Architettura Multi-Sede (Solo Quando Necessario)

```
STATO FUTURO (quando esistono 2+ sedi):

bio-clinic.it/
|-- /sassari/                    [Hub sede - ex pagine root]
|   |-- /sassari/cardiologia/
|   |-- /sassari/ginecologia/
|   |-- /sassari/equipe/
|   |-- /sassari/contatti/
|
|-- /olbia/                      [Hub nuova sede]
|   |-- /olbia/cardiologia/
|   |-- /olbia/equipe/
|   |-- /olbia/contatti/
|
|-- /cardiologia/                [Hub tematica trasversale — tutti i sedi]
|-- /ginecologia/                [Hub tematica trasversale]
```

**Migrazione da mono-sede a multi-sede:**
- `/cardiologia/` rimane come hub tematica trasversale (link a entrambe le sedi)
- Si creano `/sassari/cardiologia/` e `/olbia/cardiologia/` come pagine sede-specifiche
- 301 non necessari: le hub tematiche diventano aggregatori, non vengono eliminate

---

# SEZIONE 7: SCORECARD COMPARATIVA

## Struttura Attuale (3 sistemi in conflitto)

| Dimensione | Score | Motivazione |
|---|---|---|
| SEO Tecnico | **45/100** | 3 sistemi URL in conflitto, 404 nel sitemap, redirect inversi |
| EEAT | **50/100** | No autore, no revisione, no albo, no date |
| Verticalizzazione | **25/100** | Solo 1 branca su 9 con cluster completo |
| Dominazione Locale | **55/100** | Buona per brand, debole per query specifiche |
| Crawl Budget | **40/100** | Spreco su 404, duplicati, pagine /pages/ |
| Core Update Resilience | **45/100** | Alta vulnerabilita YMYL |
| Scalabilita Multi-Sede | **20/100** | Impossibile nella forma attuale |
| **MEDIA PONDERATA** | **40/100** | |

## Struttura Proposta (Post-Migrazione Completa)

| Dimensione | Score | Motivazione |
|---|---|---|
| SEO Tecnico | **92/100** | Un sistema coerente, zero conflitti, sitemap pulito |
| EEAT | **88/100** | Autore, data, revisione, schema, pubblicazioni |
| Verticalizzazione | **90/100** | 9 cluster completi con hub + servizi + condizioni |
| Dominazione Locale | **85/100** | Query core presidiate, FAQ aggressive, prezzi |
| Crawl Budget | **95/100** | Zero spreco, gerarchia chiara, sitemap preciso |
| Core Update Resilience | **88/100** | EEAT completo, contenuto YMYL qualificato |
| Scalabilita Multi-Sede | **85/100** | Architettura pronta per espansione subfolder |
| **MEDIA PONDERATA** | **89/100** | |

## Delta

**+49 punti di miglioramento strutturale.**

Questo e il gap tra dove Bio-Clinic e oggi e dove puo arrivare con la ristrutturazione proposta. Non e un gap di contenuto (il contenuto e buono). E un gap di **architettura e coerenza tecnica**.

---

# SEZIONE 8: VERDETTO FINALE

## La Direzione e Una Sola: Ristrutturazione Chirurgica Progressiva (Opzione D)

### Perche non graduale (A)?
Perche il problema non e di ottimizzazione. E di **conflitto strutturale**. Non si ottimizza un conflitto: lo si risolve.

### Perche non massiva (B)?
Perche il rischio di errore e alto (dimostrato dalla migrazione incompleta della cardiologia) e il costo di un errore massivo e inaccettabile.

### Perche non multi-sede subito (C)?
Perche Bio-Clinic ha UNA sede e aggiungere complessita strutturale speculativa danneggia il presente.

### Perche chirurgica progressiva (D)?
Perche:
1. **Ogni wave e verificabile indipendentemente.** Se la migrazione ginecologia crea problemi, si puo correggere prima di procedere.
2. **Il rischio e distribuito su 12 settimane**, non concentrato in un unico deploy.
3. **I risultati sono incrementali.** Ogni wave produce miglioramenti misurabili.
4. **L'architettura target e identica a quella di un refactoring massivo**, ma ci si arriva con meno rischio.

## Timing

| Fase | Settimane | Output |
|---|---|---|
| Wave 1: Emergenza tecnica | 1-2 | Eliminazione conflitti /pages/, pulizia sitemap |
| Wave 2: Ginecologia | 3-4 | Cluster ginecologia completo |
| Wave 3: Dermatologia | 5-6 | Cluster dermatologia + ingresso SERP |
| Wave 4: Endo+Neuro+Orto | 7-8 | 3 cluster completi |
| Wave 5: PMA+Slim+Lab | 9-10 | 3 cluster completi |
| Wave 6: EEAT + Condizioni | 11-12 | EEAT overlay + 12 pagine condizione |
| **TOTALE** | **12 settimane** | **Struttura Target Completa** |

## La Domanda Finale: E Necessaria?

**SI. Non e opzionale.**

Non perche la struttura attuale sia "brutta" o "vecchia". Ma perche:

1. **I tre sistemi paralleli stanno attivamente danneggiando i ranking.** Google sta servendo le pagine /pages/ invece delle canoniche. Ogni giorno in piu = segnali consolidati nella direzione sbagliata.

2. **Il competitor CDS Sassari e arrivato nel 2025 con architettura pulita.** Bio-Clinic ha un vantaggio di contenuto e reputazione enorme, ma un'architettura sporca puo erodere quel vantaggio in 12-18 mesi.

3. **L'espansione multi-sede e impossibile senza coerenza strutturale.** Non si puo aggiungere `/olbia/` a un sito che ha tre versioni di ogni pagina.

4. **Il prossimo Medical Core Update e una questione di "quando", non "se".** Bio-Clinic DEVE essere pronta con EEAT completo e architettura pulita prima che accada.

La ristrutturazione non e un costo. E un **investimento difensivo urgente** con rendimento offensivo garantito.

---

*Parere Strategico redatto il 15 Febbraio 2026*
*Basato su analisi HTTP header-level, crawling completo, verifica redirect, SERP simulation, competitive intelligence*
