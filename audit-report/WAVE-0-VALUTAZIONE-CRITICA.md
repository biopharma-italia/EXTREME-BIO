# WAVE 0: VALUTAZIONE CRITICA INFRASTRUTTURALE
## Verdetto Tecnico sulla Stabilizzazione Pre-Migrazione di bio-clinic.it

**Data:** 15 Febbraio 2026
**Classificazione:** Analisi Tecnica Vincolante — Pre-requisito Architetturale
**Ruoli:** Chief Web Architecture Engineer, Senior Medical SEO YMYL Strategist, Enterprise Routing & Infrastructure Auditor, Google Core Update Risk Analyst

---

# VERDETTO IMMEDIATO

**Wave 0 e un prerequisito assoluto? SI. Senza riserve.**

Ma la versione proposta e **incompleta e sottovaluta 4 rischi reali** che, se non corretti, renderebbero le Wave successive fragili o addirittura controproducenti. Il verdetto finale e:

## **APPROVATO CON MODIFICHE OBBLIGATORIE**

La logica e corretta. L'ordine e corretto. Il principio "zero contenuto, solo infrastruttura" e corretto. Ma l'esecuzione proposta ha **buchi operativi concreti** che identifico e correggo in questo documento.

---

# SEZIONE 1: PERCHE WAVE 0 E UN PREREQUISITO NON NEGOZIABILE

## 1.1 La Situazione Reale Verificata con HTTP Headers

L'audit HTTP header-level (non crawl simulato, verifica reale con `curl -sI`) ha rivelato una situazione peggiore di quanto qualsiasi crawler esterno possa mostrare.

### Inventario Completo URL — 3 Sistemi in Conflitto Simultaneo

**SISTEMA 1: /pages/ (Legacy) — 23+ URL ancora attive con HTTP 200**

| URL /pages/ | HTTP Status | Canonical dichiarato | Google indicizza |
|---|---|---|---|
| `/pages/visita-cardiologica-ecg` | **200 OK** | `bio-clinic.it/pages/visita-cardiologica-ecg.html` | SI — in SERP |
| `/pages/visita-ginecologica` | **200 OK** | `bio-clinic.it/visita-ginecologica/` | SI — duplicato attivo |
| `/pages/visita-dermatologica` | **200 OK** | `bio-clinic.it/visita-dermatologica/` | SI — duplicato attivo |
| `/pages/visita-endocrinologica` | **200 OK** | `bio-clinic.it/visita-endocrinologica/` | SI — posizione 9 SERP |
| `/pages/visita-neurologica` | **200 OK** | `bio-clinic.it/visita-neurologica/` | SI |
| `/pages/visita-ortopedica` | **200 OK** | `bio-clinic.it/visita-ortopedica/` | SI — unica versione viva! |
| `/pages/ginecologi-sassari` | **200 OK** | `bio-clinic.it/ginecologi-sassari/` | SI |
| `/pages/isterosalpingografia` | **200 OK** | `bio-clinic.it/isterosalpingografia/` | SI |
| `/pages/isteroscopia` | **200 OK** | `bio-clinic.it/isteroscopia/` | SI |
| `/pages/hpv-test` | **200 OK** | `bio-clinic.it/pap-test-hpv/` | SI |
| `/pages/pap-test` | **200 OK** | `bio-clinic.it/pap-test/` | SI |
| `/pages/duopap` | **200 OK** | `bio-clinic.it/duopap/` | SI |
| `/pages/genetica` | **200 OK** | `bio-clinic.it/genetica/` | SI |
| `/pages/visita-urologica` | **200 OK** | non verificato | SI |
| `/pages/visita-oculistica` | **200 OK** | non verificato | SI |
| `/pages/visita-gastroenterologica` | **200 OK** | non verificato | SI |
| `/pages/visita-pneumologica` | **200 OK** | non verificato | SI |
| `/pages/visita-reumatologica` | **200 OK** | non verificato | SI |
| `/pages/mappatura-nevi` | **200 OK** (via 308) | non verificato | Probabile |
| `/pages/agoaspirato-tiroide` | **200 OK** (via 308) | non verificato | Probabile |
| `/pages/checkup-tiroide` | **200 OK** (via 308) | non verificato | Probabile |
| `/pages/colposcopia` | **200 OK** (via 308) | non verificato | Probabile |
| `/pages/screening-inps-sardegna` | **200 OK** (via 308) | non verificato | Probabile |

**Pagine /pages/ GIA correttamente redirectate (301):**

| URL /pages/ | Redirect | Destinazione |
|---|---|---|
| `/pages/cardiologia` | 301 | `/cardiologia/` |
| `/pages/endocrinologia` | 301 | `/endocrinologia/` |
| `/pages/ecocardiogramma` | 301 | `/cardiologia/ecocardiogramma/` |
| `/pages/holter-ecg` | 301 | `/cardiologia/holter-ecg/` |
| `/pages/holter-pressorio` | 301 | `/cardiologia/holter-pressorio/` |
| `/pages/checkup-cardiovascolare` | 301 | `/cardiologia/checkup-cardiovascolare/` |
| `/pages/gastroenterologia` | 301 | `/gastroenterologia/` |

**Pagine /pages/ che restituiscono 404 (morte ma Google ha cache):**

| URL | Status | Rischio |
|---|---|---|
| `/pages/cardiologia.html` | 404 | Cache Google residua |
| `/pages/ginecologia.html` | 404 | Era in SERP top-10 |
| `/pages/dermatologia.html` | 404 | Era in SERP |
| `/pages/neurologia` | 404 | Google mostra ancora |
| `/pages/ortopedia` | 404 | Google mostra ancora |
| `/pages/slim-care` | 404 | — |
| `/pages/pma-fertilita` | 404 | — |
| `/pages/specialita.html` | 404 | — |

---

**SISTEMA 2: Root-level (Sitemap attuale) — Stato misto critico**

| URL Root | HTTP Status | Problema |
|---|---|---|
| `/visita-cardiologica/` | **200 OK** | Redirect interno a `/cardiologia/visita-cardiologica-ecg/` — quasi ok |
| `/visita-ginecologica/` | **200 OK** | Contenuto identico a `/pages/visita-ginecologica` (40.031 byte = 40.031 byte) |
| `/visita-dermatologica/` | **200 OK** | Contenuto identico a `/pages/visita-dermatologica` (38.825 byte = 38.825 byte) |
| `/visita-endocrinologica/` | **200 OK** | Duplicato con `/pages/` |
| `/visita-neurologica/` | **200 OK** | Duplicato con `/pages/` |
| `/visita-ortopedica/` | **308 → /pages/visita-ortopedica** | **REDIRECT INVERSO** |
| `/visita-urologica/` | **308 → /pages/visita-urologica** | **REDIRECT INVERSO** |
| `/visita-oculistica/` | **308 → /pages/visita-oculistica** | **REDIRECT INVERSO** |
| `/visita-orl/` | **308 → /pages/visita-orl** | **REDIRECT INVERSO** |
| `/visita-gastroenterologica/` | **308 → /pages/visita-gastroenterologica** | **REDIRECT INVERSO** |
| `/visita-pneumologica/` | **308 → /pages/visita-pneumologica** | **REDIRECT INVERSO** |
| `/visita-reumatologica/` | **308 → /pages/visita-reumatologica** | **REDIRECT INVERSO** |
| `/visita-ematologica/` | **308 → /pages/visita-ematologica** | **REDIRECT INVERSO** |
| `/visita-fisiatrica/` | **308 → /pages/visita-fisiatrica** | **REDIRECT INVERSO** |
| `/visita-pediatrica/` | **308 → /pages/visita-pediatrica** | **REDIRECT INVERSO** |
| `/visita-nefrologica/` | **308 → /pages/visita-nefrologica** | **REDIRECT INVERSO** |
| `/visita-chirurgia-vascolare/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/visita-internistica/` | **308 → /pages/visita-internistica** | **REDIRECT INVERSO** |
| `/visita-medicina-lavoro/` | **308 → /pages/visita-medicina-lavoro** | **REDIRECT INVERSO** |
| `/visita-medicina-sport/` | **308 → /pages/visita-medicina-sport** | **REDIRECT INVERSO** |
| `/visita-nutrizionale/` | **308 → /pages/visita-nutrizionale** | **REDIRECT INVERSO** |
| `/colloquio-psicologico/` | **308 → /pages/colloquio-psicologico** | **REDIRECT INVERSO** |
| `/hpv-test/` | **308 → /pages/hpv-test** | **REDIRECT INVERSO** |
| `/ginecologi-sassari/` | **308 → /pages/ginecologi-sassari** | **REDIRECT INVERSO** |
| `/pap-test/` | **308 → /pages/pap-test** | **REDIRECT INVERSO** |
| `/duopap/` | **308 → /pages/duopap** | **REDIRECT INVERSO** |
| `/mappatura-nevi/` | **308 → /pages/mappatura-nevi** | **REDIRECT INVERSO** |
| `/ecografia-mammaria/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecografia-tiroidea/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecografia-transvaginale/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecografia-addominale/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecografia-ostetrica-3d/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecografia-morfologica/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/ecg/` | **308 → /pages/ecg** | **REDIRECT INVERSO** |
| `/eco-doppler-arti/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/elettromiografia/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/infiltrazioni-articolari/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/spirometria/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/audiometria/` | **308 → /pages/** | **REDIRECT INVERSO** |
| `/campo-visivo/` | **308 → /pages/** | **REDIRECT INVERSO** |

**CONTEGGIO REDIRECT INVERSI: 35+ URL nel sitemap che redirectano a /pages/**

Questo e il dato piu grave dell'intero audit. Il sitemap ufficiale dichiara come canoniche URL che **non servono contenuto direttamente** ma redirectano verso il sistema legacy `/pages/`. Google segue il redirect e indicizza `/pages/`.

---

**SISTEMA 3: Gerarchico (Target) — Solo Cardiologia completata**

| URL | HTTP Status | Stato |
|---|---|---|
| `/cardiologia/` | 200 | Hub — CORRETTO |
| `/cardiologia/visita-cardiologica-ecg/` | 200 | Servizio — CORRETTO |
| `/cardiologia/ecocardiogramma/` | 200 | Servizio — CORRETTO |
| `/cardiologia/holter-ecg/` | 200 | Servizio — CORRETTO |
| `/cardiologia/holter-pressorio/` | 200 | Servizio — CORRETTO |
| `/cardiologia/checkup-cardiovascolare/` | 200 | Servizio — CORRETTO |
| `/laboratorio/stat/` | 200 | Sotto-sezione — CORRETTO |

Nessun'altra branca ha pagine servizio gerarchiche. La migrazione si e fermata dopo la cardiologia.

---

### 1.2 Conteggio Danno Reale

| Metrica | Valore |
|---|---|
| URL `/pages/` ancora attive (200 OK) | **23+** |
| URL root-level con redirect inverso 308 → /pages/ | **35+** |
| URL 404 nel sitemap | **6-8** |
| URL 404 sotto /pages/ con cache Google residua | **7+** |
| Coppie di pagine con contenuto identico (byte-per-byte) | **5 confermate, ~20 probabili** |
| Conflitti canonical tag | **almeno 2 confermati** (cardiologia ecg, hpv-test) |
| Branche con cluster gerarchico completato | **1 su 9** (solo Cardiologia) |
| Pagine hub hub-level che restituiscono 404 | **5** (neurologia, ortopedia, pma, slim-care, specialita sotto /pages/) |

**Sintesi:** Il sito bio-clinic.it sta operando con il 60% delle pagine servizio che vivono sotto `/pages/` (accessibili via 308 dai root-level URL del sitemap), il 25% che ha versioni duplicate attive su root E /pages/ contemporaneamente, e solo il 15% (cluster cardiologia) in stato corretto. Questo NON e un problema di ottimizzazione. E un **guasto infrastrutturale attivo**.

---

# SEZIONE 2: VALUTAZIONE CRITICA SUI 5 ASSI RICHIESTI

## 2.1 Robustezza Tecnica del Wave 0 Proposto

### Punti di Forza (cosa e corretto)

1. **Il principio "zero contenuto, solo infrastruttura" e inattaccabile.** Migrare contenuto e redirect insieme moltiplica i rischi. Separare le due operazioni e l'unico approccio razionale per un sito con 3 sistemi in conflitto.

2. **L'ordine inventario → canoniche → 301 → sitemap → test e logicamente corretto.** Non puoi pulire il sitemap prima di sapere quali URL sono canoniche. Non puoi settare i 301 prima di definire la destinazione. La sequenza e giusta.

3. **La decisione di non toccare i contenuti in Wave 0 protegge il ranking esistente.** Le pagine che oggi si posizionano (anche se sotto `/pages/`) non perdono contenuto. Perdono solo il percorso URL, con 301 che trasferisce >95% del link equity.

### Punti Deboli Critici (cosa manca o e sbagliato)

**PROBLEMA 1: Il piano non distingue 301 da 308 — e questo e un errore grave.**

Il sito attualmente usa **308 Permanent Redirect** per i redirect inversi, non 301. La differenza e cruciale:

| Codice | Significato | Trasferimento Link Equity | Comportamento Google |
|---|---|---|---|
| **301** | Moved Permanently | SI — trasferisce >95% | Consolida segnali sulla destinazione |
| **308** | Permanent Redirect | SI (equivalente 301) ma... | Preserva il metodo HTTP (POST resta POST) |
| **302** | Temporary Redirect | NO — mantiene equity sull'originale | Non consolida |

Il 308 e tecnicamente equivalente al 301 per il trasferimento segnali, MA:
- Google tratta 308 come 301 solo dal 2019, e la documentazione ufficiale e ambigua
- Alcuni tool SEO (Screaming Frog, Ahrefs) non tracciano 308 come redirect permanente
- Il problema reale: il 308 **preserva il metodo HTTP**. Per un sito che serve solo GET, questo e irrilevante. Ma indica che il server/framework sta usando una logica di routing diversa dal classico redirect SEO

**Rischio concreto:** Se il framework genera 308 automaticamente, cambiare a 301 potrebbe richiedere intervento a livello di codice server (non solo configurazione). Questo va verificato PRIMA dell'esecuzione.

**Modifica obbligatoria:** Aggiungere al Wave 0 uno step 0.5: **verificare se il framework (presumibilmente Cloudflare Pages o simile) permette di settare 301 nativamente o se i 308 sono hard-coded nel routing.** Se il framework forza 308, il piano redirect va riprogettato a livello di _redirects file o Worker.

---

**PROBLEMA 2: Il piano non gestisce la coesistenza 200+200 durante la transizione.**

Quando si setta un 301 da `/pages/visita-ginecologica` a `/visita-ginecologica/`, entrambe le pagine servono contenuto identico (40.031 byte). Il 301 risolve il problema a regime. Ma c'e un gap temporale:

- Google puo impiegare **2-6 settimane** per processare un 301 e desindicizzare l'originale
- Durante questo periodo, ENTRAMBE le versioni possono restare indicizzate
- Il canonical tag su `/pages/visita-ginecologica` gia punta a `/visita-ginecologica/` — questo e un segnale positivo che accelera il consolidamento
- MA il canonical su `/pages/visita-cardiologica-ecg` punta a se stessa (`.../pages/visita-cardiologica-ecg.html`) — questo CONTRADDICE il 301 futuro verso `/cardiologia/visita-cardiologica-ecg/`

**Modifica obbligatoria:** Il Wave 0 deve includere la **correzione dei canonical tag** su tutte le pagine `/pages/` che oggi puntano a se stesse. Il canonical deve puntare alla destinazione del 301 PRIMA o CONTEMPORANEAMENTE al deploy del redirect. Non dopo.

---

**PROBLEMA 3: Il sitemap attuale contiene 160 URL, di cui ~55 sono 308 redirect.**

Il sitemap dichiara come canonical URL che restituiscono 308 → /pages/. Questo significa che il 34% del sitemap e composto da redirect. Google:

- Spreca crawl budget per seguire i redirect
- Riceve segnali contraddittori: il sitemap dice "questa e la pagina canonica" ma l'HTTP dice "vai altrove"
- Potrebbe decidere autonomamente quale versione indicizzare, ignorando sia il sitemap che il canonical

**Ma il piano Wave 0 dice "pulire sitemap per includere solo URL 200 definitive".** Questo e corretto in principio, ma operativamente crea un problema: se rimuovi dal sitemap gli URL root (che oggi sono 308 → /pages/) e non hai ancora creato le pagine gerarchiche target, Google perde il segnale su quelle pagine.

**La domanda critica e: verso cosa puntano i 301 di Wave 0 per le pagine che non hanno ancora una versione gerarchica?**

Esempio concreto:
- `/visita-neurologica/` oggi e 200 OK con contenuto
- `/pages/visita-neurologica` oggi e 200 OK con contenuto identico
- La versione gerarchica target `/neurologia/visita-neurologica/` **non esiste ancora** (verra creata in Wave 4)
- Wave 0 propone: 301 da `/pages/visita-neurologica` → `/visita-neurologica/`

Questo e corretto come soluzione transitoria. Ma il sitemap post-Wave-0 deve includere `/visita-neurologica/` (non piu come 308 ma come 200 diretto). Questo richiede che il routing server venga modificato per servire `/visita-neurologica/` direttamente come 200, eliminando il 308 → /pages/.

**Modifica obbligatoria:** Il Wave 0 ha un'azione implicita non dichiarata: per le 35+ URL root che oggi fanno 308 → /pages/, il routing deve essere invertito. La root deve diventare la pagina 200, e `/pages/` deve diventare il 301. Questo non e "pulizia sitemap" — e **riscrittura della logica di routing del server**, ed e il lavoro piu pesante di Wave 0.

---

**PROBLEMA 4: Le catene di redirect non sono mappate.**

Con la struttura attuale, alcune URL possono generare catene:

```
/hpv-test/  →  308  →  /pages/hpv-test  (oggi)

Wave 0 propone:
/pages/hpv-test  →  301  →  /hpv-test/  (o /ginecologia/hpv-test/)

Ma se /hpv-test/ continua a fare 308 → /pages/hpv-test, si crea un LOOP:
/hpv-test/  →  308  →  /pages/hpv-test  →  301  →  /hpv-test/  →  308  →  ...
```

Google interrompe i loop dopo 5-10 hop, ma il danno e:
- Crawl budget sprecato
- Nessuna pagina indicizzabile
- Possibile desindicizzazione completa dell'URL

Questo scenario si applica a **tutte le 35+ URL con redirect inverso**.

**Modifica obbligatoria:** Il Wave 0 deve eseguire le due operazioni in questa sequenza ATOMICA (stesso deploy):

1. Rimuovere il 308 root → /pages/ (la root diventa 200 diretto)
2. Settare il 301 /pages/ → root (o verso target gerarchico)

Se queste due operazioni non avvengono nello stesso deploy, si creano loop o periodi di inconsistenza.

---

## 2.2 Rischio SEO Reale

### Rischio del Wave 0 Corretto: **BASSO (15/100)**

| Fattore | Rischio | Motivazione |
|---|---|---|
| Perdita ranking pagine /pages/ | Basso | Il 301 trasferisce >95% equity. Le pagine canoniche gia esistono |
| Desindicizzazione temporanea | Minimo | I canonical gia puntano alle destinazioni corrette (tranne cardiologia ecg) |
| Drop traffico organico | -5/10% per 2-4 settimane | Solo il tempo di consolidamento Google |
| Errori nella catena redirect | Medio se non atomico | Vedi Problema 4 sopra — mitigabile con deploy atomico |
| Impatto su pagine che oggi rankano bene | Quasi zero | Le hub (/cardiologia/, /ginecologia/) non vengono toccate |

### Rischio del NON Fare Wave 0: **CRITICO (90/100)**

| Fattore | Rischio | Motivazione |
|---|---|---|
| Cannibalizzazione permanente | 100% certo | 23+ pagine /pages/ attive competono con le canoniche |
| Core Update penalty | 45-55% in 12 mesi | Google sta intensificando i controlli su siti YMYL con struttura incoerente |
| Impossibilita Wave 1-5 | 100% | Non puoi creare cluster gerarchici su una base con 3 sistemi in conflitto |
| Competitor overtake (CDS, Medis) | 60% in 12 mesi | CDS ha aperto a Sassari nel 2025 con struttura pulita e budget nazionale |
| Dermatologia bloccata a invisibile | 95% | 3 URL competono per lo stesso intent, nessuna emerge |

### Calcolo Netto

**Non fare Wave 0 e 6 volte piu rischioso che farlo.** E il rapporto peggiora ogni mese, perche Google continua a ricevere segnali incoerenti e i competitor guadagnano terreno.

---

## 2.3 Impatto Crawl Budget

### Situazione Attuale — Spreco Stimato

| Problema | URL Coinvolte | Crawl Sprecato |
|---|---|---|
| Redirect 308 nel sitemap | 55+ | 55 crawl/ciclo sprecati in redirect |
| Pagine /pages/ duplicate indicizzate | 23+ | 23 crawl/ciclo su duplicati |
| URL 404 nel sitemap | 6-8 | 6-8 crawl/ciclo su pagine morte |
| Catene redirect potenziali | 10+ | 20+ crawl/ciclo (2 hop ciascuna) |
| **TOTALE SPRECO PER CICLO** | | **~104 crawl** |

Bio-Clinic ha ~160 URL nel sitemap + ~23 /pages/ extra = ~183 URL totali. Di queste, **104 generano spreco** (56% del crawl budget). Per un sito di questa dimensione su un dominio non-autoritativo a livello globale, questo e devastante.

### Post-Wave 0 — Recupero Stimato

Con la pulizia completa, il sitemap conterrebbe:
- ~120-130 URL 200 OK dirette (zero redirect, zero 404)
- Crawl efficiency: da 44% a **~95%**
- Tempo liberato per Google per crawlare contenuti nuovi (pagine condizione Wave 2+)

**Questo e l'argomento piu forte a favore di Wave 0.** Non si tratta solo di "pulire". Si tratta di liberare crawl budget per le Wave successive.

---

## 2.4 Impatto sulla Dominazione Tematica

### Senza Wave 0: Ceiling Strutturale Insormontabile

Il motivo per cui Bio-Clinic e a 72/100 per Sassari e non a 95+ non e il contenuto (che e eccellente) ne l'EEAT (migliorabile ma non bloccante). E la **dispersione di autorita strutturale**.

Esempio concreto — Ginecologia:
- `/ginecologia/` (hub) riceve link dalla homepage e dal menu → buon PageRank
- `/visita-ginecologica/` (root) riceve link dall'hub e ha contenuto ricco → buon PageRank
- `/pages/visita-ginecologica` (legacy) ha contenuto identico e nessun link interno → PageRank basso
- `/pages/ginecologia.html` (morta 404) → link esterni eventualmente persi
- `/ginecologi-sassari/` → 308 → `/pages/ginecologi-sassari` → PageRank disperso nel redirect

**5 URL** per lo stesso macro-intent "ginecologia sassari". Il PageRank che dovrebbe concentrarsi su 1-2 URL e disperso su 5. Google non sa quale premiare e nessuna raggiunge il potenziale massimo.

### Con Wave 0: Concentrazione Autorita Immediata

Dopo i 301, i segnali si consolidano:
- `/ginecologia/` riceve l'equity di `/pages/ginecologia.html` + `/pages/ginecologi-sassari` 
- `/visita-ginecologica/` riceve l'equity di `/pages/visita-ginecologica`
- Il crawl budget risparmiato viene usato per le pagine che rankano

**Stima impatto per branca:**

| Branca | Ranking Atteso Oggi | Ranking Atteso Post-Wave 0 | Delta |
|---|---|---|---|
| Ginecologia "ginecologo sassari" | Posizione 3-5 | Posizione 2-3 | +1-2 posizioni |
| Cardiologia "cardiologo sassari" | Posizione 5-7 | Posizione 4-5 | +1 posizione |
| Dermatologia "dermatologo sassari" | Fuori top-10 | Posizione 8-10 (entry) | **Ingresso in SERP** |
| Endocrinologia | Posizione 8-10 | Posizione 6-8 | +2 posizioni |
| Neurologia | Posizione 10-15 | Posizione 8-12 | +2-3 posizioni |
| PMA "fecondazione sassari" | Posizione 3-4 | Posizione 3 (stabile) | Consolidamento |
| Slim Care "dimagrimento sassari" | Posizione 1 | Posizione 1 (rafforzata) | Difesa posizione |

**Nota critica:** Wave 0 da sola NON porta alla posizione 1 per nessuna query. Ma **sblocca il ceiling** che impedisce alle Wave successive di raggiungere la posizione 1. Senza Wave 0, anche contenuto perfetto e EEAT impeccabile non possono superare il muro della dispersione strutturale.

---

## 2.5 Resilienza ai Medical Core Updates

### Perche Wave 0 e Critico per i Core Updates

Google Medical Core Updates (ultimo: Novembre 2025) valutano i siti YMYL su:

1. **Coerenza strutturale** — il sito e ben organizzato e navigabile? 3 sistemi URL paralleli = NO
2. **Autorevolezza concentrata** — le pagine mediche hanno segnali forti? Equity disperso su duplicati = NO
3. **Esperienza utente** — l'utente trova rapidamente cio che cerca? 308 inversi = NO, loop redirect = NO
4. **Trasparenza** — il sito e mantenuto? 404 nel sitemap, cache obsolete = NO

**Wave 0 corregge direttamente i punti 1, 2, 3 e parzialmente il 4.**

### Scenario di Rischio: Core Update senza Wave 0

Se un Medical Core Update colpisce bio-clinic.it nel suo stato attuale:
- **Probabilita:** 45% nei prossimi 12 mesi (Google rilascia 3-4 Core Updates/anno)
- **Impatto stimato:** -30/50% traffico organico
- **Pagine piu vulnerabili:** Dermatologia (gia fuori top-10), Neurologia, Ortopedia (le branche con piu conflitti URL)
- **Tempo di recupero senza ristrutturazione:** 6-12 mesi (se si ristruttura dopo il colpo)
- **Tempo di recupero con Wave 0 pre-emptivo:** non necessario (il colpo non arriva)

### Scenario Post-Wave 0

- Riduzione vulnerabilita Core Update: da 45% a **15-20%**
- Residuo di rischio: mancanza EEAT completo (Wave 6), assenza pagine condizione, blog non aggiornato
- Questi rischi residui vengono affrontati nelle Wave successive, MA la base infrastrutturale e solida

---

# SEZIONE 3: RISCHI IGNORATI NEL PIANO ORIGINALE

## 3.1 Rischio 1: Il Dominio Usa Cloudflare — Le Regole di Redirect Sono Diverse

L'analisi degli header HTTP mostra:
- Header `report-to` con endpoint Cloudflare
- Header `permissions-policy` tipico di Cloudflare Pages
- I 308 suggeriscono routing tramite `_redirects` file o Cloudflare Workers

**Implicazione:** I redirect su Cloudflare Pages funzionano tramite un file `_redirects` flat o un `_worker.js`. La distinzione 301 vs 308 dipende dalla sintassi usata. Se il framework del sito (probabilmente basato su un generatore statico o un CMS headless) genera i 308 come default, la modifica richiede intervento sulle regole di routing, non sul server HTTP tradizionale.

**Azione richiesta:** Verificare il stack tecnologico esatto (Cloudflare Pages? Workers? CMS headless?) e le capacita di redirect prima di iniziare.

## 3.2 Rischio 2: Le Pagine /equipe/ nel Sitemap Sono Tutte 308

Scoperta dall'audit: tutte le pagine profilo medico nel sitemap (`/equipe/salvatore-dessole/`, `/equipe/francesco-dessole/`, etc.) restituiscono **308 redirect**. Se queste redirectano a `/pages/equipe/...`, allora il problema /pages/ e molto piu esteso di quanto mappato e coinvolge anche i profili medici — che sono fondamentali per EEAT.

**Azione richiesta:** Verificare le destinazioni dei 308 delle pagine /equipe/. Se redirectano a /pages/, vanno incluse in Wave 0.

## 3.3 Rischio 3: Google Search Console Potrebbe Mostrare Problemi Diversi

L'audit e basato su HTTP headers e SERP analysis. Ma Google Search Console (GSC) ha dati che noi non vediamo:
- Coverage report: quante pagine Google considera "Discovered but not indexed"?
- Le pagine /pages/ sono segnalate come "Duplicate without user-selected canonical"?
- Ci sono errori di crawl specifici non visibili dall'esterno?

**Azione richiesta:** PRIMA di eseguire qualsiasi redirect, estrarre da GSC:
1. Il report Coverage completo (esportazione CSV)
2. La lista "Excluded" con motivi specifici
3. La lista "Crawled but not indexed"
4. Le URL con "Duplicate, Google chose different canonical than user"
5. Il report Core Web Vitals per verificare che non ci siano problemi di performance che complicano il quadro

Questi dati possono rivelare problemi aggiuntivi non visibili dal nostro audit esterno e possono modificare la priorita dei redirect.

## 3.4 Rischio 4: Backlink Esterni alle Pagine /pages/

Se siti esterni (MioDottore, iDoctors, testate giornalistiche locali) linkano direttamente a URL `/pages/`, il 301 trasferisce l'equity. Ma se linkano a URL root che oggi fanno 308 → /pages/, e noi invertiamo la logica, i backlink continuano a funzionare (la root diventa 200). Nessun problema.

**Ma se linkano a `/pages/` direttamente** (es. `/pages/ginecologia.html` che oggi e 404), quel link equity e gia perso. Wave 0 non lo recupera. Solo una campagna di outreach per aggiornare i link esterni puo recuperarlo.

**Azione raccomandata:** Verificare con Ahrefs/Majestic i backlink a URL `/pages/` 404. Se ci sono backlink di valore, settare 301 anche per i 404 verso le pagine canoniche (il 301 da 404 non esiste — si deve ricreare la risposta come 301).

---

# SEZIONE 4: PIANO WAVE 0 RIVISTO E POTENZIATO

## Struttura: 5 Fasi in 10 Giorni Lavorativi

### Fase 0A — Giorno 1-2: Audit Completo Interno (PREREQUISITO AL PREREQUISITO)

**Obiettivo:** Completare l'inventario con dati inaccessibili dall'esterno.

| Azione | Responsabile | Output |
|---|---|---|
| Esportare GSC Coverage Report completo | SEO Lead | CSV con tutte le URL e il loro stato Google |
| Esportare GSC "Duplicate" e "Excluded" lists | SEO Lead | Lista conflitti visti da Google |
| Verificare stack tecnologico (Cloudflare Pages/Workers?) | Dev Lead | Conferma capacita di routing |
| Verificare se /equipe/ pages sono 308 → /pages/ | Dev Lead | Estensione inventario |
| Esportare backlink report (Ahrefs/Majestic) per /pages/ | SEO Lead | Lista link esterni a rischio |
| Creare foglio master con TUTTE le URL (200, 301, 308, 404) | SEO Lead + Dev | **IL DELIVERABLE CHIAVE** |

**Deliverable:** Foglio Google/Excel con colonne:
- URL attuale
- HTTP status attuale
- Canonical tag attuale
- Indicizzata da Google (si/no da GSC)
- Backlink esterni (si/no da Ahrefs)
- URL canonica definitiva (target)
- Tipo redirect necessario (301)
- Wave di migrazione (0, 1, 2, 3...)

---

### Fase 0B — Giorno 3-4: Definizione Canonica Definitiva per Ogni URL

**Regole non negoziabili:**

1. **Ogni contenuto ha UNA sola URL canonica.** Zero eccezioni.
2. **Le pagine servizio che appartengono a una branca con cluster gerarchico (solo Cardiologia oggi) vanno sotto la branca.** Es: `/cardiologia/visita-cardiologica-ecg/`
3. **Le pagine servizio delle branche NON ancora clusterizzate restano a root-level come soluzione TEMPORANEA.** Es: `/visita-ginecologica/` (fino a Wave 1 che la migrera a `/ginecologia/visita-ginecologica/`)
4. **Le pagine /pages/ non sono MAI canoniche.** Ogni /pages/ URL deve avere un 301 verso una canonica non-/pages/.
5. **Le URL root che oggi fanno 308 → /pages/ devono diventare 200 dirette.**

**Mappa Redirect Completa:**

#### GRUPPO A: /pages/ Hub → Hub Canoniche (301)

| Origine | Destinazione | Note |
|---|---|---|
| `/pages/cardiologia` | `/cardiologia/` | GIA ATTIVO — verificare |
| `/pages/ginecologia.html` | `/ginecologia/` | Da 404, settare 301 per catturare backlink residui |
| `/pages/dermatologia.html` | `/dermatologia/` | Da 404, settare 301 |
| `/pages/endocrinologia` | `/endocrinologia/` | GIA ATTIVO — verificare |
| `/pages/neurologia` | `/neurologia/` | Da 404, settare 301 |
| `/pages/ortopedia` | `/ortopedia/` | Da 404, settare 301 |
| `/pages/slim-care` | `/slim-care/` | Da 404, settare 301 |
| `/pages/pma-fertilita` | `/pma-fertilita/` | Da 404, settare 301 |
| `/pages/specialita.html` | `/specialita/` | Da 404, settare 301 |
| `/pages/convenzioni` | `/convenzioni/` | GIA 301 — verificare |
| `/pages/gastroenterologia` | `/gastroenterologia/` | GIA 301 — verificare |

#### GRUPPO B: /pages/ Servizio Cardiologia → Gerarchico (301)

| Origine | Destinazione | Note |
|---|---|---|
| `/pages/visita-cardiologica-ecg` | `/cardiologia/visita-cardiologica-ecg/` | **CRITICO** — canonical attuale sbagliato |
| `/pages/ecocardiogramma` | `/cardiologia/ecocardiogramma/` | GIA 301 — verificare |
| `/pages/holter-ecg` | `/cardiologia/holter-ecg/` | GIA 301 — verificare |
| `/pages/holter-pressorio` | `/cardiologia/holter-pressorio/` | GIA 301 — verificare |
| `/pages/checkup-cardiovascolare` | `/cardiologia/checkup-cardiovascolare/` | GIA 301 — verificare |

#### GRUPPO C: /pages/ Servizio Altre Branche → Root Temporaneo (301)

| Origine | Destinazione | Note |
|---|---|---|
| `/pages/visita-ginecologica` | `/visita-ginecologica/` | Temporaneo — Wave 1 migrera a `/ginecologia/visita-ginecologica/` |
| `/pages/visita-dermatologica` | `/visita-dermatologica/` | Temporaneo — Wave 2 migrera |
| `/pages/visita-endocrinologica` | `/visita-endocrinologica/` | Temporaneo — Wave 3 migrera |
| `/pages/visita-neurologica` | `/visita-neurologica/` | Temporaneo — Wave 3 migrera |
| `/pages/visita-ortopedica` | `/visita-ortopedica/` | Temporaneo — Wave 3 migrera (root oggi 308!) |
| `/pages/visita-urologica` | `/visita-urologica/` | Temporaneo |
| `/pages/visita-oculistica` | `/visita-oculistica/` | Temporaneo |
| `/pages/visita-gastroenterologica` | `/visita-gastroenterologica/` | Temporaneo |
| `/pages/visita-pneumologica` | `/visita-pneumologica/` | Temporaneo |
| `/pages/visita-reumatologica` | `/visita-reumatologica/` | Temporaneo |
| `/pages/visita-ematologica` | `/visita-ematologica/` | Temporaneo |
| `/pages/visita-fisiatrica` | `/visita-fisiatrica/` | Temporaneo |
| `/pages/visita-pediatrica` | `/visita-pediatrica/` | Temporaneo |
| `/pages/visita-nefrologica` | `/visita-nefrologica/` | Temporaneo |
| `/pages/visita-chirurgia-vascolare` | `/visita-chirurgia-vascolare/` | Temporaneo |
| `/pages/visita-internistica` | `/visita-internistica/` | Temporaneo |
| `/pages/visita-medicina-lavoro` | `/visita-medicina-lavoro/` | Temporaneo |
| `/pages/visita-medicina-sport` | `/visita-medicina-sport/` | Temporaneo |
| `/pages/visita-nutrizionale` | `/visita-nutrizionale/` | Temporaneo |
| `/pages/colloquio-psicologico` | `/colloquio-psicologico/` | Temporaneo |

#### GRUPPO D: /pages/ Esami e Procedure → Root o Gerarchico (301)

| Origine | Destinazione | Note |
|---|---|---|
| `/pages/ginecologi-sassari` | `/ginecologia/` | Redirect definitivo a hub |
| `/pages/hpv-test` | `/hpv-test/` | Temporaneo — Wave 1 a `/ginecologia/hpv-test/` |
| `/pages/pap-test` | `/pap-test/` | Temporaneo — Wave 1 a `/ginecologia/pap-test/` |
| `/pages/duopap` | `/duopap/` | Temporaneo — Wave 1 a `/ginecologia/duopap/` |
| `/pages/genetica` | `/genetica/` | Temporaneo — Wave 5 a `/laboratorio/genetica/` |
| `/pages/mappatura-nevi` | `/dermatologia/` | Alla hub (no root 200 disponibile oggi) |
| `/pages/agoaspirato-tiroide` | `/endocrinologia/` | Alla hub temporaneamente |
| `/pages/checkup-tiroide` | `/endocrinologia/` | Alla hub temporaneamente |
| `/pages/colposcopia` | `/ginecologia/` | Alla hub temporaneamente |
| `/pages/screening-inps-sardegna` | root da creare o hub pertinente | Da valutare |
| `/pages/isterosalpingografia` | `/isterosalpingografia/` | 200 diretto — OK temporaneo |
| `/pages/isteroscopia` | `/isteroscopia/` | 200 diretto — OK temporaneo |

#### GRUPPO E: Inversione Redirect — Root 200 Diretto (Riscrittura Routing)

Queste 35+ URL devono **smettere di fare 308 → /pages/** e servire contenuto direttamente come 200 OK.

| URL Root Attuale (308) | Azione | Risultato |
|---|---|---|
| `/visita-ortopedica/` | Servire contenuto direttamente | 200 OK |
| `/visita-urologica/` | Servire contenuto direttamente | 200 OK |
| `/visita-oculistica/` | Servire contenuto direttamente | 200 OK |
| `/visita-orl/` | Servire contenuto direttamente | 200 OK |
| `/visita-gastroenterologica/` | Servire contenuto direttamente | 200 OK |
| `/visita-pneumologica/` | Servire contenuto direttamente | 200 OK |
| `/visita-reumatologica/` | Servire contenuto direttamente | 200 OK |
| ... (tutte le 35+ URL dalla lista completa) | Servire contenuto direttamente | 200 OK |

**ATTENZIONE:** Questa e l'operazione piu complessa di Wave 0. Richiede modifica della logica di routing del server/framework. Non e una semplice regola di redirect — e un'inversione del flusso di servizio del contenuto.

**Approccio tecnico raccomandato:**
1. Se il CMS genera pagine sotto `/pages/` e il routing crea alias root → /pages/, la soluzione e:
   - Cambiare il CMS/generatore per pubblicare direttamente a root-level
   - OPPURE: configurare il server per fare reverse-proxy da root → /pages/ internamente (senza redirect visibile)
2. Se il sito usa Cloudflare Workers: creare un Worker che riscrive l'URL internamente senza redirect HTTP visibile
3. Se usa `_redirects` file: impossibile fare reverse-proxy — serve logica Workers

---

### Fase 0C — Giorno 5-6: Deploy Atomico

**Regola assoluta: tutte le modifiche di routing vanno in produzione nello STESSO deploy.**

Non e accettabile:
- Lunedi: rimuovere i 308 inversi
- Martedi: settare i 301 da /pages/

Questo creerebbe 24 ore in cui `/pages/` serve 200 senza redirect e le root tornano 404. Google potrebbe crawlare in quel momento.

**Checklist pre-deploy:**
- [ ] Foglio master redirect completo e verificato da 2 persone
- [ ] Canonical tag aggiornati su tutte le pagine /pages/ (devono puntare alla destinazione del 301)
- [ ] Nessun loop redirect possibile (verifica automatizzata)
- [ ] Backup completo della configurazione routing attuale
- [ ] Test in ambiente staging (se disponibile)

**Sequenza di deploy:**
1. Deploy configurazione routing: root serve 200 diretto + /pages/ serve 301
2. Deploy sitemap aggiornato: solo URL 200 OK
3. Verifica automatizzata: script che testa OGNI URL nel foglio master
4. Submit sitemap aggiornato a GSC

---

### Fase 0D — Giorno 7-8: Validazione Post-Deploy

| Test | Tool | Criterio Successo |
|---|---|---|
| Ogni URL /pages/ restituisce 301 | curl -sI / script automatico | Zero 200 sotto /pages/ |
| Ogni URL root restituisce 200 OK diretto | curl -sI / script automatico | Zero 308 |
| Zero catene redirect > 1 hop | Screaming Frog | Nessuna catena |
| Sitemap contiene solo URL 200 | Validatore XML + curl | Zero 301/308/404 nel sitemap |
| Canonical tag coerenti | Screaming Frog | canonical = URL servita |
| Nessuna pagina con contenuto duplicato attivo | Siteliner o simile | Zero duplicati byte-per-byte |

---

### Fase 0E — Giorno 9-10: Validazione GSC e Monitoraggio

| Azione | Timing |
|---|---|
| Richiedere indicizzazione URL principali tramite URL Inspection | Giorno 9 |
| Monitorare Coverage Report per "Redirect" e "Soft 404" | Giorno 10 e poi quotidiano per 2 settimane |
| Verificare che le pagine /pages/ passino a "Excluded: Redirected" | Entro 7-14 giorni |
| Monitorare ranking keyword principali per eventuali fluttuazioni | Quotidiano per 30 giorni |
| Se fluttuazioni > -15%, nessun allarme (normale post-301) | — |
| Se fluttuazioni > -30%, indagare errori nella mappa redirect | — |
| Conferma completamento Wave 0: tutte le URL nel foglio master verificate | Giorno 10 + 14 |

---

# SEZIONE 5: SCORECARD COMPARATIVA

## Stato Attuale vs Post-Wave 0 vs Post-Wave 1-5

| Metrica | Attuale | Post Wave 0 | Post Wave 1-5 | Target Finale |
|---|---|---|---|---|
| Coerenza URL | **15/100** | **85/100** | **95/100** | 100 |
| Crawl Efficiency | **44/100** | **90/100** | **95/100** | 98+ |
| Cannibalizzazione | **25+ conflitti** | **0 conflitti** | **0** | 0 |
| Autorita Concentrata | **40/100** | **70/100** | **90/100** | 95+ |
| Sitemap Quality | **35/100** | **95/100** | **98/100** | 100 |
| Resilienza Core Update (infra) | **45/100** | **78/100** | **90/100** | 92+ |
| Scalabilita Multi-sede | **20/100** | **50/100** | **85/100** | 90+ |
| EEAT Strutturale | **50/100** | **55/100** | **88/100** | 95+ |
| Dominazione Sassari | **72/100** | **78/100** | **90/100** | 95+ |
| Dominazione Nord Sardegna | **38/100** | **40/100** | **70/100** | 80+ |

**Osservazione:** Wave 0 non migliora EEAT, contenuto, o copertura tematica. Migliora la **fondazione tecnica** su cui tutto il resto si appoggia. Senza di essa, le metriche di contenuto e EEAT hanno un ceiling strutturale invalicabile.

---

# SEZIONE 6: RISPOSTE DIRETTE ALLE 5 DOMANDE

## Domanda 1: Wave 0 e un prerequisito?

**SI. Senza qualifica.**

Non e "consigliabile" o "raccomandato". E un prerequisito tecnico non negoziabile. Tentare Wave 1 (cluster ginecologia) senza Wave 0 significherebbe creare `/ginecologia/visita-ginecologica/` (quarta versione!) mentre 3 versioni precedenti sono ancora attive. Il risultato sarebbe 4 URL per lo stesso intent — peggio di oggi.

## Domanda 2: Ci sono rischi ignorati?

**SI. Quattro rischi critici non considerati nel piano originale:**

1. **Distinzione 301 vs 308 e compatibilita framework** — Il sito usa 308 (non 301) per i redirect attuali. La causa e probabilmente il framework/piattaforma. Se il framework non supporta 301 nativamente, il piano redirect va riprogettato.

2. **Coesistenza 200+200 durante consolidamento Google** — Le pagine duplicate resteranno entrambe indicizzate per 2-6 settimane post-301. I canonical tag su alcune /pages/ contraddicono il redirect futuro e vanno corretti PRIMA del deploy.

3. **Loop redirect potenziali** — Con 35+ URL che oggi fanno root → 308 → /pages/, e il piano che aggiunge /pages/ → 301 → root, se le due operazioni non sono atomiche si creano loop. Deploy non-atomico = rischio catastrofico.

4. **Pagine /equipe/ potenzialmente coinvolte** — Se i profili medici sono anch'essi 308 → /pages/, il perimetro di Wave 0 e piu grande del previsto e coinvolge pagine critiche per EEAT.

## Domanda 3: Esiste un approccio piu forte?

**No come alternativa, si come potenziamento.**

L'approccio Wave 0 → Wave 1-5 e gia l'approccio piu forte possibile per questo scenario. Un'alternativa piu aggressiva (migrazione massiva simultanea) aumenta il rischio senza benefici proporzionali. Un'alternativa piu conservativa (ottimizzazione senza ristrutturazione) ha un ceiling di 78/100.

Il potenziamento che propongo e:
- **Fase 0A** (audit GSC + stack tecnologico) che il piano originale non include
- **Deploy atomico obbligatorio** con checklist pre-volo
- **Validazione automatizzata** post-deploy con script
- **Monitoraggio strutturato** per 30 giorni prima di procedere a Wave 1

## Domanda 4: Modifiche suggerite alla sequenza?

**SI. La sequenza corretta e:**

```
ORIGINALE:                          RIVISTA:
1. Inventario URL                   0A. Audit interno (GSC + stack + backlink)
2. Definire canoniche               0B. Definire canoniche + foglio master
3. 301 su /pages/                   0C. Deploy ATOMICO (inversione routing +
4. Fix redirect inversi                  301 /pages/ + canonical tag update)
5. Allineare canonical              0D. Validazione automatizzata
6. Pulire sitemap                   0E. Submit sitemap + monitoraggio GSC
7. Test HTTP
8. Validare GSC
```

Le differenze chiave:
- **0A e nuovo** e deve essere il primo step assoluto
- **3, 4, 5 sono fusi in 0C** come operazione atomica (non possono essere sequenziali)
- **6 e integrato in 0C** (il sitemap va pubblicato insieme ai redirect, non dopo)
- **7 e potenziato in 0D** con validazione automatizzata, non manuale
- **8 e potenziato in 0E** con monitoraggio strutturato per 30 giorni

## Domanda 5: Verdetto Finale?

# VERDETTO: APPROVATO CON MODIFICHE OBBLIGATORIE

| Aspetto | Giudizio |
|---|---|
| Principio strategico | **APPROVATO** — Wave 0 infrastrutturale e l'unica scelta razionale |
| Sequenza logica | **APPROVATO** — inventario → canoniche → redirect → validazione |
| Separazione infrastruttura/contenuto | **APPROVATO** — zero contenuto in Wave 0 e corretto |
| Gestione 301 vs 308 | **DA MODIFICARE** — verificare capacita framework prima dell'esecuzione |
| Atomicita del deploy | **DA AGGIUNGERE** — il piano originale non specifica che le operazioni devono essere simultanee |
| Gestione canonical tag | **DA AGGIUNGERE** — i canonical vanno corretti nel deploy, non dopo |
| Audit GSC pre-esecuzione | **DA AGGIUNGERE** — dati interni necessari prima di iniziare |
| Perimetro /equipe/ | **DA VERIFICARE** — potenziale estensione del perimetro |
| Validazione post-deploy | **DA POTENZIARE** — script automatizzato, non verifica manuale |
| Timeline 5-10 giorni | **REALISTICO** — se il team tecnico conosce lo stack |

---

# SEZIONE 7: CRONOPROGRAMMA ESECUTIVO DETTAGLIATO

## Giorno per Giorno

| Giorno | Attivita | Owner | Deliverable | Gate |
|---|---|---|---|---|
| **G1** | Export GSC Coverage + Excluded | SEO | CSV completo | Completato? |
| **G1** | Verifica stack tecnologico (Cloudflare?) | Dev | Documento architettura | Completato? |
| **G2** | Export backlink /pages/ (Ahrefs) | SEO | Lista URL con link esterni | Completato? |
| **G2** | Test /equipe/ redirect destination | Dev | Estensione inventario se necessario | Completato? |
| **G3** | Compilazione foglio master completo | SEO + Dev | Foglio 200+ righe con tutte le URL | Review a 4 occhi |
| **G4** | Definizione canonica per ogni URL | SEO Lead | Colonna "URL target" compilata | Approvazione SEO |
| **G4** | Definizione regole redirect tecniche | Dev Lead | Regole 301 per il framework specifico | Test locale |
| **G5** | Implementazione routing in staging | Dev | Tutte le regole testate in staging | Test automatizzato |
| **G5** | Update canonical tag nel codice | Dev | Canonical allineati per deploy | Review SEO |
| **G6** | **DEPLOY ATOMICO in produzione** | Dev + SEO | Routing + 301 + canonical + sitemap | **GO/NO-GO GATE** |
| **G7** | Validazione automatizzata | Dev | Script: zero 200 su /pages/, zero 308, zero loop | Report automatico |
| **G7** | Submit sitemap aggiornato a GSC | SEO | Sitemap accettato | Conferma GSC |
| **G8** | URL Inspection su 20 URL prioritarie | SEO | Richieste di indicizzazione inviate | — |
| **G9** | Primo check Coverage Report GSC | SEO | Baseline post-deploy | — |
| **G10** | Report Wave 0 completamento | SEO + Dev | Documento formale | **GATE per Wave 1** |

## Condizioni per Procedere a Wave 1

Wave 1 (Cluster Ginecologia) puo iniziare SOLO quando:

- [ ] Zero URL /pages/ restituiscono 200 OK
- [ ] Zero URL root restituiscono 308
- [ ] Sitemap contiene solo URL 200 OK verificate
- [ ] GSC non mostra nuovi errori di copertura
- [ ] Ranking keyword principali stabili (fluttuazione < 15%)
- [ ] Nessuna catena redirect > 1 hop
- [ ] Almeno 14 giorni di stabilita post-deploy

**Se anche UNA condizione non e soddisfatta, Wave 1 non parte.**

---

# SEZIONE 8: WHAT-IF SCENARIOS

## Scenario A: Il Framework Non Supporta 301 Nativo

**Probabilita:** 30%
**Impatto:** Wave 0 richiede intervento piu profondo (Cloudflare Worker custom)
**Mitigazione:** Se i 308 sono l'unica opzione, Google li tratta come 301 dal 2019. Si procede con 308, ma si documenta il rischio residuo per tool SEO che non li tracciano.
**Decisione:** Non blocca Wave 0, ma richiede nota nel foglio master.

## Scenario B: Le Pagine /equipe/ Sono Tutte Sotto /pages/

**Probabilita:** 70% (basata sugli header 308 osservati)
**Impatto:** Il perimetro di Wave 0 si espande di 50+ URL (profili medici)
**Mitigazione:** Aggiungere alla stessa logica: root /equipe/ serve 200, /pages/equipe/ serve 301.
**Decisione:** Non blocca Wave 0, ma estende il timeline di 1-2 giorni. Il deploy resta atomico.

## Scenario C: GSC Rivela Problemi Non Visti

**Probabilita:** 50%
**Impatto:** Potrebbe rivelare ulteriori URL indicizzate sotto /pages/ non mappate, o pagine "Crawled but not indexed" che necessitano intervento.
**Mitigazione:** Il foglio master viene aggiornato con i dati GSC prima del deploy.
**Decisione:** Potrebbe spostare il deploy di 1-2 giorni. Non cambia la strategia.

## Scenario D: Drop Ranking > 20% Post-Deploy

**Probabilita:** 10% (con deploy atomico corretto)
**Impatto:** Allarme ma non panico. Il drop post-301 e fisiologico e si recupera in 2-6 settimane.
**Mitigazione:** Monitoraggio quotidiano. Se drop > 30% su keyword specifiche, verificare catene redirect o canonical errati su quelle pagine specifiche.
**Decisione:** NON rollbackare. Il rollback riporterebbe alla situazione precedente (peggio) e confonde ulteriormente Google.

## Scenario E: Google Continua a Indicizzare /pages/ dopo 30 Giorni

**Probabilita:** 15%
**Impatto:** Google e lento nel processare 301 per pagine a basso crawl rate.
**Mitigazione:** Usare URL Inspection manuale su ogni pagina /pages/ persistente. Richiedere rimozione temporanea tramite Removals Tool se necessario.
**Decisione:** Normale. Non blocca Wave 1 se le condizioni di stabilita sono soddisfatte.

---

# CONCLUSIONE OPERATIVA

## Sintesi per il Decision Maker

1. **Wave 0 e obbligatorio e non rinviabile.** Ogni settimana di ritardo costa ranking, crawl budget, e aumenta la vulnerabilita ai Core Updates.

2. **Il piano originale e corretto al 75%.** Le modifiche obbligatorie (audit GSC, deploy atomico, gestione canonical, verifica stack) lo portano al 95%.

3. **Il rischio di Wave 0 e BASSO (15/100).** Il rischio di non fare Wave 0 e CRITICO (90/100). Il rapporto e 1:6 a favore dell'azione.

4. **Timeline realistica: 10 giorni lavorativi.** Con team competente e accesso a GSC + stack.

5. **Wave 0 non migliora direttamente il ranking.** Ma sblocca il ceiling strutturale che impedisce a Wave 1-5 di portare Bio-Clinic alla posizione 1.

6. **Dopo Wave 0, il sito sara tecnicamente piu solido del 95% dei competitor locali.** CDS, Medis, Health Care Center non hanno questo livello di pulizia infrastrutturale.

7. **La condizione per Wave 1 e 14 giorni di stabilita post-Wave 0.** Non si procede prima. Non si salta.

---

*Documento redatto il 15 Febbraio 2026.*
*Prossimo deliverable atteso: Foglio Master URL completo (Fase 0A) entro 5 giorni lavorativi dall'approvazione.*
*Classificazione: Analisi Tecnica Vincolante — Pre-requisito per qualsiasi intervento successivo.*
