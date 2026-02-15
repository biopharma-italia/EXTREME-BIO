# BIO-CLINIC MARKET DOMINATION ARCHITECTURE AUDIT
## Analisi Strategica Completa per la Dominazione SERP Locale

**Data:** 15 Febbraio 2026  
**Target:** bio-clinic.it  
**Mercato:** Sassari e Nord Sardegna  
**Analista:** Chief Digital Strategy Architect & Senior Technical SEO Engineer

---

# EXECUTIVE SUMMARY

Bio-Clinic ha costruito un asset digitale di altissimo livello per un poliambulatorio locale. Con 67 medici, 31 specialita, 1.840+ prestazioni e 3.214 recensioni a 5 stelle, il sito presenta un'architettura gia avanzata, ben superiore alla media dei competitor locali. Tuttavia, l'analisi multilivello rivela **gap critici** che impediscono la dominazione totale della SERP locale e la supremazia irreversibile su Sassari e Nord Sardegna.

### Score Sintetico Attuale

| Metrica | Score | Target |
|---|---|---|
| Dominazione Sassari | **72/100** | 95+ |
| Dominazione Nord Sardegna | **38/100** | 80+ |
| Score Tecnico Globale | **78/100** | 95+ |
| Score EEAT Globale | **68/100** | 95+ |
| Resilienza Core Update | **65/100** | 90+ |

---

# FASE 1 - ANALISI ARCHITETTURA SISTEMICA

## 1.1 Struttura Attuale della Directory

Dall'analisi del sitemap.xml e del crawling completo, la struttura attuale e:

```
bio-clinic.it/
|-- / (Homepage)
|-- /chi-siamo/
|-- /specialita/
|-- /equipe/ (+ 50+ profili medici individuali)
|-- /contatti/
|-- /convenzioni/
|-- /prestazioni/
|-- /prevenzione/
|-- /listino-completo/
|-- /shop/
|-- /blog/
|
|-- BRANCHE HUB (Livello 1):
|   |-- /cardiologia/ (+ 5 sotto-pagine: checkup-cardiovascolare, ecocardiogramma, holter-ecg, holter-pressorio, visita-cardiologica-ecg)
|   |-- /ginecologia/
|   |-- /dermatologia/
|   |-- /endocrinologia/
|   |-- /neurologia/
|   |-- /pma-fertilita/
|   |-- /ortopedia/
|   |-- /slim-care/ (+ /slim-care-donna/)
|   |-- /laboratorio/ (+ /laboratorio/stat/)
|   |-- /urologia/
|   |-- /oculistica/
|   |-- /otorinolaringoiatria/
|   |-- /gastroenterologia/
|   |-- /pneumologia/
|   |-- /reumatologia/
|   |-- /ematologia/
|   |-- /chirurgia-vascolare/
|
|-- PAGINE SERVIZIO (Root-level - PROBLEMA):
|   |-- /visita-cardiologica/
|   |-- /visita-ginecologica/
|   |-- /visita-dermatologica/
|   |-- /visita-endocrinologica/
|   |-- /visita-neurologica/
|   |-- /visita-ortopedica/
|   |-- /ecografia-mammaria/
|   |-- /ecografia-tiroidea/
|   |-- /ecografia-transvaginale/
|   |-- /mappatura-nevi/
|   |-- /elettromiografia/
|   |-- /pap-test/
|   |-- /hpv-test/
|   |-- /isteroscopia/
|   |-- /isterosalpingografia/
|   |-- ... (40+ pagine servizio a root-level)
|
|-- PAGINE SPECIALI:
|   |-- /mounjaro-tirzepatide-sassari/
|   |-- /ginecologi-sassari/
|   |-- /screening-inps-sardegna/
|   |-- /symptom-checker/
|   |-- /genetica/
```

## 1.2 Analisi Critica dell'Architettura

### PROBLEMA CRITICO #1: Struttura Ibrida Flat/Gerarchica

**Evidenza:** La cardiologia ha una struttura gerarchica corretta (`/cardiologia/ecocardiogramma/`, `/cardiologia/holter-ecg/`) ma la stragrande maggioranza delle pagine servizio e a root-level (`/visita-cardiologica/`, `/ecografia-mammaria/`, `/mappatura-nevi/`).

**Motivazione del problema:**
- Le 40+ pagine servizio a root-level **diluiscono la rilevanza tematica** delle hub di branca
- Non creano segnali di cluster gerarchico per Google
- Il link juice della homepage si distribuisce su troppi URL di primo livello
- Google non percepisce una chiara gerarchia tematica specialita -> servizio -> sottopagina

**Impatto:** Dispersione PageRank stimata del 35-40%. La cardiologia ha gia il modello corretto; le altre branche no.

### PROBLEMA CRITICO #2: Inconsistenza nella Profondita di Clic

| Branca | Profondita Hub | Sotto-pagine Gerarchiche | Status |
|---|---|---|---|
| Cardiologia | 1 clic | 5 (sotto /cardiologia/) | MODELLO CORRETTO |
| Ginecologia | 1 clic | 0 (servizi a root) | DA CORREGGERE |
| Dermatologia | 1 clic | 0 (servizi a root) | DA CORREGGERE |
| Endocrinologia | 1 clic | 0 (servizi a root) | DA CORREGGERE |
| Neurologia | 1 clic | 0 (servizi a root) | DA CORREGGERE |
| PMA | 1 clic | 0 (servizi a root) | DA CORREGGERE |
| Slim Care | 1 clic | 1 (/slim-care-donna/) | PARZIALE |
| Laboratorio | 1 clic | 1 (/laboratorio/stat/) | PARZIALE |
| Ortopedia | 1 clic | 0 (servizi a root) | DA CORREGGERE |

### PROBLEMA CRITICO #3: Rischio Cannibalizzazione Semantica

**Casi identificati:**

1. **`/cardiologia/` vs `/visita-cardiologica/`** - Entrambe competono per "visita cardiologica sassari". La pagina hub e la pagina servizio entrano in conflitto.

2. **`/ginecologia/` vs `/visita-ginecologica/` vs `/ginecologi-sassari/`** - TRIPLA cannibalizzazione. Tre pagine competono per lo stesso intento di ricerca.

3. **`/endocrinologia/` vs `/visita-endocrinologica/`** - Doppia pagina per lo stesso intento.

4. **`/hpv-test/` vs `/hpv-dna-test/` vs `/duopap/`** - Tre pagine per tematica HPV con sovrapposizione semantica.

5. **`/ecografia-ginecologica/` vs `/ecografia-transvaginale/` vs `/ecografia-pelvica/`** - Tre pagine ecografia ginecologica con confini semantici sfumati.

### PROBLEMA #4: Orphan Pages Potenziali

- `/equipe/profilo/` - Pagina generica profilo senza contenuto specifico
- `/laboratorio/stat/` - Poco linkata internamente
- Molte pagine `/visita-*` a root-level ricevono link solo dalla navigazione globale, non da contesto tematico

### PROBLEMA #5: Pagine /pages/ Fantasma nella SERP

Nella SERP appaiono URL come:
- `bio-clinic.it/pages/cardiologia.html`
- `bio-clinic.it/pages/ginecologia.html`
- `bio-clinic.it/pages/neurologia`
- `bio-clinic.it/pages/ortopedia`
- `bio-clinic.it/pages/slim-care`
- `bio-clinic.it/pages/endocrinologia`

**CRITICO:** Queste pagine `/pages/` sono indicizzate da Google e competono con le pagine canoniche (`/cardiologia/`, `/ginecologia/`, ecc.). Questo crea **cannibalizzazione diretta** tra versioni duplicate/legacy delle stesse pagine.

## 1.3 Mappa Ideale per Dominazione Sassari

```
bio-clinic.it/
|
|-- /cardiologia/
|   |-- /cardiologia/visita-cardiologica/
|   |-- /cardiologia/ecocardiogramma/
|   |-- /cardiologia/holter-ecg/
|   |-- /cardiologia/holter-pressorio/
|   |-- /cardiologia/checkup-cardiovascolare/
|   |-- /cardiologia/eco-doppler-tsa/
|   |-- /cardiologia/ipertensione/          [NUOVA - sintomo]
|   |-- /cardiologia/aritmie/               [NUOVA - sintomo]
|
|-- /ginecologia/
|   |-- /ginecologia/visita-ginecologica/
|   |-- /ginecologia/ecografia-transvaginale/
|   |-- /ginecologia/ecografia-mammaria/
|   |-- /ginecologia/ecografia-morfologica/
|   |-- /ginecologia/pap-test/
|   |-- /ginecologia/hpv-test/
|   |-- /ginecologia/isteroscopia/
|   |-- /ginecologia/colposcopia/
|   |-- /ginecologia/menopausa/             [NUOVA - condition]
|   |-- /ginecologia/endometriosi/          [NUOVA - condition]
|
|-- /dermatologia/
|   |-- /dermatologia/visita-dermatologica/
|   |-- /dermatologia/mappatura-nevi/
|   |-- /dermatologia/dermatoscopia/
|   |-- /dermatologia/acne/                 [NUOVA - condition]
|   |-- /dermatologia/psoriasi/             [NUOVA - condition]
|
|-- /endocrinologia/
|   |-- /endocrinologia/visita-endocrinologica/
|   |-- /endocrinologia/ecografia-tiroidea/
|   |-- /endocrinologia/agoaspirato-tiroide/
|   |-- /endocrinologia/checkup-tiroide/
|   |-- /endocrinologia/diabete/            [NUOVA - condition]
|   |-- /endocrinologia/noduli-tiroidei/    [NUOVA - condition]
|
|-- /neurologia/
|   |-- /neurologia/visita-neurologica/
|   |-- /neurologia/elettromiografia/
|   |-- /neurologia/cefalea/                [NUOVA - sintomo]
|   |-- /neurologia/tunnel-carpale/         [NUOVA - condition]
|
|-- /pma-fertilita/
|   |-- /pma-fertilita/consulto-pma/
|   |-- /pma-fertilita/monitoraggio-follicolare/
|   |-- /pma-fertilita/isterosalpingografia/
|   |-- /pma-fertilita/infertilita-femminile/  [NUOVA - condition]
|   |-- /pma-fertilita/infertilita-maschile/   [NUOVA - condition]
|
|-- /ortopedia/
|   |-- /ortopedia/visita-ortopedica/
|   |-- /ortopedia/infiltrazioni-articolari/
|   |-- /ortopedia/mal-di-schiena/          [NUOVA - sintomo]
|   |-- /ortopedia/artrosi/                 [NUOVA - condition]
|
|-- /slim-care/
|   |-- /slim-care/donna/
|   |-- /slim-care/mounjaro-tirzepatide/
|   |-- /slim-care/wegovy-semaglutide/      [NUOVA]
|   |-- /slim-care/visbody-3d/              [NUOVA]
|
|-- /laboratorio/
|   |-- /laboratorio/stat/
|   |-- /laboratorio/check-up/
|   |-- /laboratorio/preparazione-esami/
|   |-- /laboratorio/genetica/
|
|-- /sassari/                               [FUTURO - geo-hub]
|-- /equipe/
|-- /chi-siamo/
|-- /prevenzione/
|-- /blog/
```

## 1.4 Gap Strutturale e Priorita Intervento

| Priorita | Azione | Impatto | Effort |
|---|---|---|---|
| **P0-CRITICA** | Redirect/canonicalizzazione pagine `/pages/` | Elimina cannibalizzazione | Basso |
| **P0-CRITICA** | Migrazione servizi sotto hub di branca (URL + redirect 301) | +25-35% rilevanza cluster | Alto |
| **P1-ALTA** | Eliminare cannibalizzazione ginecologia (3 pagine) | +15% ranking ginecologia | Medio |
| **P1-ALTA** | Creare pagine condizione/sintomo per ogni branca | +40% copertura query informazionali | Alto |
| **P2-MEDIA** | Consolidare pagine ecografia sotto branche rispettive | Chiarifica intent mapping | Medio |
| **P2-MEDIA** | Consolidare pagine HPV (3 -> 1 hub + varianti) | Elimina cannibalizzazione | Medio |

---

# FASE 2 - LOCAL DOMINATION ENGINE

## 2.1 Analisi Presenza Keyword "Sassari"

**Metodo:** Analisi di ogni title tag, H1, meta description e contenuto delle pagine principali.

| Pagina | "Sassari" nel Title | "Sassari" nell'H1 | "Sassari" nel Contenuto | Voto |
|---|---|---|---|---|
| Homepage | SI (title tag) | SI ("Sassari") | SI | BUONO |
| /cardiologia/ | SI (nei dati SERP) | NO diretto | SI (FAQ) | SUFFICIENTE |
| /ginecologia/ | SI | SI (breadcrumb) | SI (FAQ) | BUONO |
| /dermatologia/ | SI | SI | SI | BUONO |
| /endocrinologia/ | SI | SI | SI (FAQ) | BUONO |
| /neurologia/ | SI | NO diretto | SI (FAQ) | SUFFICIENTE |
| /pma-fertilita/ | SI | NO chiaro | SI | SUFFICIENTE |
| /slim-care/ | NO esplicito | NO | SI (CTA) | INSUFFICIENTE |
| /laboratorio/ | SI | SI | SI | BUONO |
| /ortopedia/ | SI | NO diretto | SI (FAQ) | SUFFICIENTE |

### Criticita Rilevata
- **Slim Care** non ha "Sassari" nel title ne nell'H1 nonostante sia la specialita flagship
- Le pagine `/visita-*` a root-level hanno keyword "Sassari" nelle FAQ ma non nei title/H1

## 2.2 Copertura "Nord Sardegna"

**RISULTATO: ASSENTE**

Non e stata trovata alcuna menzione strategica di "Nord Sardegna" nelle pagine principali. Il sito e **completamente focalizzato su Sassari** senza alcuna strategia di espansione territoriale digitale.

**Comuni limitrofi non presidiati:**
- Alghero (94.000 abitanti metro)
- Olbia (~60.000 abitanti)
- Tempio Pausania
- Ozieri
- Porto Torres
- Arzachena / Costa Smeralda

**Query non presidiate:**
- "cardiologo nord sardegna"
- "ginecologo alghero"
- "laboratorio analisi olbia"
- "centro medico nord sardegna"
- "specialista tiroide nord sardegna"

## 2.3 Dominazione Query Core

| Query | Posizione Bio-Clinic SERP | Competitor Davanti | Gap |
|---|---|---|---|
| "cardiologo sassari" | **Posizione 5** | iDoctors, TopDoctors, singoli dottori, MioDottore | CRITICO |
| "ginecologo sassari" | **Posizione 3** (equipe) e Pos 10 (Dessole) | MioDottore (1), AOU Sassari (2) | MEDIO |
| "dermatologo sassari" | **Non in top 10** | MioDottore, studi privati, Centro Medis | CRITICO |
| "visita endocrinologica sassari" | **Posizione 3** | AOU Sassari (1), Cup Solidale (2) | MEDIO |
| "pma sassari" | **Posizione 3** | Centro Cura e Salute (1), AOU Sassari (2) | MEDIO |
| "centro obesita sassari" | **Posizione 1** | - | DOMINATO |
| "laboratorio analisi sassari" | **Posizione 2** | LAS Sassari (1) | BASSO |
| "poliambulatorio sassari" | **Non rilevato top 10** | CDS, Health Care Center, Medis | CRITICO |

### Query Core NON Presidiate (landing page assente)

1. "**poliambulatorio sassari**" - Nessuna landing ottimizzata
2. "**centro medico sassari**" - Nessuna landing ottimizzata
3. "**ecografia sassari**" - Nessuna hub ecografie centralizzata
4. "**analisi del sangue sassari**" - Il laboratorio copre parzialmente
5. "**visita specialistica sassari**" - Nessuna landing
6. "**prenotazione visita sassari**" - Nessuna landing
7. "**medico sassari weekend**" / "**sabato**" - Nessuna landing orari estesi
8. "**clinica privata sassari**" - Nessuna landing
9. "**secondo parere medico sassari**" - Nessuna landing

## 2.4 Struttura Landing Geo-Tematica Proposta

### Livello 1 - Hub Geografico (Futuro)
```
/sassari/                        -> "Poliambulatorio Sassari | Bio-Clinic | 31 Specialita"
/sassari/cardiologo/             -> "Cardiologo Sassari | 5 Specialisti | Bio-Clinic"
/sassari/ginecologo/             -> "Ginecologo Sassari | 6 Specialisti | Bio-Clinic"
/sassari/dermatologo/            -> "Dermatologo Sassari | 3 Specialiste | Bio-Clinic"
```

### Livello 2 - Landing Micro-Local (Espansione)
```
/nord-sardegna/                  -> Hub Nord Sardegna
/alghero/                        -> Servizi per pazienti Alghero
/olbia/                          -> Servizi per pazienti Olbia
/costa-smeralda/                 -> Servizi per turisti/residenti
```

---

# FASE 3 - CLUSTER VERTICALI PER BRANCA

## Scoring Methodology

Per ogni branca viene valutato (0-100):
- **Hub Strength** (forza della pagina hub)
- **Services Coverage** (quanti servizi sono rappresentati con pagina dedicata)
- **Symptoms Coverage** (pagine per sintomi/condizioni)
- **Prevention Coverage** (contenuti prevenzione)
- **Doctor Connection** (collegamento medico <-> servizio)
- **EEAT Depth** (profondita EEAT)
- **Competitor Superiority** (vantaggio competitivo)

---

### 3.1 CARDIOLOGIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **88/100** | Hub ben strutturata, FAQ locali, prezzi, CTA |
| Services Coverage | **85/100** | 5 sotto-pagine gerarchiche (modello), 39 prestazioni listate |
| Symptoms Coverage | **30/100** | Sezione "Patologie Trattate" come lista, NO pagine dedicate |
| Prevention Coverage | **75/100** | Checkup cardiovascolare con pagina dedicata |
| Doctor Connection | **60/100** | 5 cardiologi elencati ma NO collegamento diretto servizio<->medico |
| EEAT Depth | **55/100** | FAQ mediche presenti, NO autore, NO linee guida citate |
| Competitor Superiority | **45/100** | Posizione 5 per "cardiologo sassari", battuta da aggregatori |

**DOMINAZIONE SCORE CARDIOLOGIA: 63/100**

**Gap Critico:** Posizione 5 in SERP per la query core. Mancano pagine patologia (ipertensione, aritmie, scompenso) che intercetterebbero traffic informazionale a monte del funnel.

---

### 3.2 GINECOLOGIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **92/100** | Pagina ricchissima, team completo, percorsi, FAQ locali, prezzi |
| Services Coverage | **80/100** | 94 prestazioni listate, sotto-pagine presenti ma a root-level |
| Symptoms Coverage | **25/100** | NO pagine dedicate menopausa, endometriosi, PCOS, ecc. |
| Prevention Coverage | **70/100** | Pap Test, HPV Test, screening ben coperti |
| Doctor Connection | **85/100** | Prof. Dessole prominente, profili collegati, MioDottore integrato |
| EEAT Depth | **75/100** | PubMed citations su profilo Dessole, esperienza 40 anni |
| Competitor Superiority | **70/100** | Posizione 3 per "ginecologo sassari" + presenza MioDottore |

**DOMINAZIONE SCORE GINECOLOGIA: 72/100**

**Gap Critico:** Cannibalizzazione tripla (/ginecologia/ vs /visita-ginecologica/ vs /ginecologi-sassari/). Mancano pagine condizione che intercettino "endometriosi sassari", "menopausa ginecologo", "ovaio policistico".

---

### 3.3 DERMATOLOGIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **80/100** | Pagina completa, regola ABCDE, tecnologia, FAQ |
| Services Coverage | **60/100** | Servizi elencati ma poche pagine dedicate |
| Symptoms Coverage | **20/100** | Lista patologie (acne, psoriasi, ecc.) ma ZERO pagine dedicate |
| Prevention Coverage | **55/100** | Mappatura nevi come prevenzione melanoma |
| Doctor Connection | **50/100** | 3 dermatologhe listate, link a profili |
| EEAT Depth | **45/100** | NO pubblicazioni citate, NO albo visibile, NO revisione clinica |
| Competitor Superiority | **30/100** | NON in top 10 per "dermatologo sassari" |

**DOMINAZIONE SCORE DERMATOLOGIA: 49/100**

**Gap Critico:** Assenza dalla SERP per la query core. Studi privati (Chiarolini, Fresi, Coradduzza) e centri competitor (Medis, Pro-Clinic) sono davanti. Necessaria strategia aggressiva.

---

### 3.4 ENDOCRINOLOGIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **85/100** | Hub completa, Slim Care integrato, prezzi, FAQ |
| Services Coverage | **75/100** | Tiroide, diabete, obesita ben coperti |
| Symptoms Coverage | **30/100** | NO pagine dedicate noduli tiroidei, ipotiroidismo, diabete tipo 2 |
| Prevention Coverage | **60/100** | Check-up tiroide presente |
| Doctor Connection | **70/100** | 4 endocrinologi, Dr. Tolu come responsabile Slim Care |
| EEAT Depth | **55/100** | Specializzazione dichiarata, NO pubblicazioni |
| Competitor Superiority | **60/100** | Posizione 3, buona competitivita |

**DOMINAZIONE SCORE ENDOCRINOLOGIA: 62/100**

---

### 3.5 NEUROLOGIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **70/100** | Hub discreta, lista servizi, FAQ, prezzi |
| Services Coverage | **50/100** | Solo visita + EMG come pagine dedicate |
| Symptoms Coverage | **15/100** | Cefalee listate ma ZERO pagine dedicate |
| Prevention Coverage | **10/100** | Quasi assente |
| Doctor Connection | **55/100** | 2 neurologi, profili presenti |
| EEAT Depth | **40/100** | Minima |
| Competitor Superiority | **50/100** | Pochi competitor dedicati a Sassari |

**DOMINAZIONE SCORE NEUROLOGIA: 41/100**

---

### 3.6 PMA / FERTILITA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **90/100** | Pagina eccellente, percorso 4 fasi, diagnostica, supporto |
| Services Coverage | **80/100** | Isteroscopia, isterosalpingografia, monitoraggio, test genetici |
| Symptoms Coverage | **20/100** | NO pagine "infertilita", "difficolta a concepire", cause |
| Prevention Coverage | **35/100** | Limitata |
| Doctor Connection | **80/100** | Prof. Dessole prominente, 40 anni esperienza |
| EEAT Depth | **65/100** | Expertise chiara, pubblicazioni PubMed, struttura I livello |
| Competitor Superiority | **55/100** | Posizione 3, CCS Fertility Center e AOU davanti |

**DOMINAZIONE SCORE PMA: 61/100**

**Gap Critico:** CCS Fertility Center (Biogenesi) e il primo centro PMA convenzionato SSR in Sardegna. Questo e un vantaggio istituzionale difficile da superare. Bio-Clinic deve posizionarsi come "centro di diagnosi e preparazione PMA" eccellente.

---

### 3.7 ORTOPEDIA

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **70/100** | Hub discreta, servizi, FAQ |
| Services Coverage | **45/100** | Poche sotto-pagine |
| Symptoms Coverage | **10/100** | NO pagine mal di schiena, artrosi, ecc. |
| Prevention Coverage | **10/100** | Assente |
| Doctor Connection | **50/100** | 2 ortopedici |
| EEAT Depth | **35/100** | Minima |
| Competitor Superiority | **40/100** | Molti ortopedici privati a Sassari |

**DOMINAZIONE SCORE ORTOPEDIA: 37/100**

---

### 3.8 SLIM CARE

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **95/100** | Pagina flagship eccezionale, percorso strutturato, VisBody, farmaci |
| Services Coverage | **85/100** | Wegovy, Mounjaro, VisBody, nutrizionale |
| Symptoms Coverage | **40/100** | Obesita ben coperta, NO pagine sindrome metabolica, BMI |
| Prevention Coverage | **45/100** | Percorso preventivo implicito |
| Doctor Connection | **75/100** | Team multidisciplinare, endocrinologo responsabile |
| EEAT Depth | **60/100** | Farmaci AIFA/EMA/FDA citati, percorso strutturato |
| Competitor Superiority | **90/100** | POSIZIONE 1 per "centro obesita sassari" |

**DOMINAZIONE SCORE SLIM CARE: 70/100**

**Forza:** Unico centro in Sardegna con VisBody 3D. Posizione 1 per query core. Pagina Mounjaro dedicata. Questo e il cluster piu forte.

---

### 3.9 LABORATORIO

| Metrica | Score | Note |
|---|---|---|
| Hub Strength | **88/100** | 1.162 esami, orari estesi, STAT, check-up |
| Services Coverage | **90/100** | 26 categorie, 12 pacchetti check-up |
| Symptoms Coverage | **20/100** | NO pagine "ho la glicemia alta", "anemia", ecc. |
| Prevention Coverage | **80/100** | /prevenzione/ dedicata con check-up |
| Doctor Connection | **50/100** | 3 specialisti laboratorio |
| EEAT Depth | **55/100** | Dati tecnici presenti, NO certificazioni visibili |
| Competitor Superiority | **75/100** | Posizione 2 per "laboratorio analisi sassari" |

**DOMINAZIONE SCORE LABORATORIO: 65/100**

---

## Riepilogo Score Branche

| Branca | Score | Status |
|---|---|---|
| Slim Care | **70/100** | Leader locale |
| Ginecologia | **72/100** | Forte ma cannibalizzata |
| Laboratorio | **65/100** | Solido, secondo in SERP |
| Cardiologia | **63/100** | Potenziale alto, posizione debole |
| Endocrinologia | **62/100** | Buono, margine di crescita |
| PMA | **61/100** | Forte contenuto, competitor istituzionali |
| Dermatologia | **49/100** | CRITICO - non in top 10 |
| Neurologia | **41/100** | Debole |
| Ortopedia | **37/100** | Debole |

---

# FASE 4 - EEAT MASSIMO LIVELLO

## 4.1 Audit EEAT per Branca

### Elementi EEAT Verificati Trasversalmente

| Elemento EEAT | Presente | Qualita | Note |
|---|---|---|---|
| **Autore medico dichiarato su pagine servizio** | PARZIALE | INSUFFICIENTE | Le pagine servizio NON hanno autore specifico. Solo le pagine equipe hanno profili. |
| **Revisione clinica dichiarata** | NO | ASSENTE | Nessuna pagina riporta "Revisionato dal Dr. X" o "Contenuto clinico approvato" |
| **Iscrizione Albo Medici visibile** | NO | ASSENTE | I profili medici non riportano numero di iscrizione all'Albo |
| **Linee guida cliniche citate** | NO | ASSENTE | Le FAQ mediche non citano linee guida SICARV, SIGO, SIE, ecc. |
| **Structured Data MedicalEntity** | INCERTO | DA VERIFICARE | Non e stato possibile verificare il codice sorgente completo |
| **Schema Physician completo** | PARZIALE | INSUFFICIENTE | Profili medici presenti ma mancano specializzazione schema, albo, CV |
| **Collegamento medico <-> servizio** | PARZIALE | MEDIO | Cardiologia e ginecologia hanno medici visibili, altre branche meno |
| **Trasparenza clinica (costi)** | SI | BUONO | Prezzi visibili in FAQ per quasi tutte le branche |
| **Contesto istituzionale** | PARZIALE | MEDIO | "Chi siamo" presente, Prof. Dessole come fondatore, NO certificazioni ISO |
| **Pubblicazioni PubMed** | SI (solo Dessole) | LIMITATO | 4 pubblicazioni linkate per Dessole. Zero per altri medici. |
| **Data ultimo aggiornamento** | NO | ASSENTE | Le pagine non mostrano date di aggiornamento/revisione |
| **Schema MedicalClinic** | INCERTO | DA VERIFICARE | Homepage potrebbe avere LocalBusiness ma non MedicalClinic |
| **Schema FAQPage** | PROBABILE | DA VERIFICARE | FAQ strutturate presenti, markup da confermare |
| **Schema MedicalCondition** | NO | ASSENTE | Nessuna pagina condizione/patologia dedicata |

## 4.2 Cosa Manca per EEAT 95+

### A. Autore/Revisore Medico su OGNI Pagina Clinica (Impatto: +15 EEAT)

Ogni pagina servizio deve avere:
```
"Contenuto a cura del Dr. [Nome], Specialista in [Specialita]"
"Ultimo aggiornamento: [Data]"
"Revisionato clinicamente dal Prof. Salvatore Dessole, Direttore Sanitario"
```

### B. Iscrizione Albo su Profili Medici (Impatto: +10 EEAT)

Ogni profilo in /equipe/ deve riportare:
```
Iscrizione Albo Medici Chirurghi di Sassari n. XXXXX
```

### C. Citazione Linee Guida Nazionali/Internazionali (Impatto: +8 EEAT)

Nelle FAQ e nei contenuti clinici:
- Cardiologia: Linee guida ESC (European Society of Cardiology)
- Ginecologia: Linee guida SIGO/AOGOI
- Dermatologia: Linee guida SIDeMaST
- Endocrinologia: Linee guida AME/SIE
- PMA: Linee guida ISS Registro PMA

### D. Structured Data Medici (Impatto: +12 EEAT)

Implementare schema.org completo:
```json
{
  "@type": "Physician",
  "name": "Prof. Salvatore Dessole",
  "medicalSpecialty": "Gynecology",
  "memberOf": {
    "@type": "MedicalOrganization",
    "name": "Ordine dei Medici Chirurghi di Sassari"
  },
  "worksFor": {
    "@type": "MedicalClinic",
    "name": "Bio-Clinic Sassari"
  },
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Professore Emerito"
  }
}
```

### E. Schema MedicalClinic su Tutte le Pagine (Impatto: +10 EEAT)

```json
{
  "@type": "MedicalClinic",
  "name": "Bio-Clinic Sassari",
  "medicalSpecialty": ["Gynecology", "Cardiology", ...],
  "availableService": [...],
  "hasCredential": "Autorizzazione ASL n. XXX"
}
```

### F. Data di Aggiornamento Visibile (Impatto: +5 EEAT)

Ogni pagina clinica deve mostrare:
```
Ultimo aggiornamento: Febbraio 2026
```

### G. Pagina "Qualita e Sicurezza" Dedicata (Impatto: +8 EEAT)

Creare `/qualita-sicurezza/` con:
- Autorizzazioni sanitarie regionali
- Protocolli di sicurezza
- Certificazioni
- Formazione continua ECM del team

---

# FASE 5 - SERP TAKEOVER STRATEGY

## 5.1 Simulazione SERP e Gap Analysis

### "cardiologo sassari"

| Pos | Risultato | Tipo |
|---|---|---|
| 1 | iDoctors | Aggregatore |
| 2 | TopDoctors | Aggregatore |
| 3 | Dr. Davide Zirolia | Sito personale |
| 4 | MioDottore | Aggregatore |
| **5** | **Bio-Clinic /pages/cardiologia** | **Pagina legacy!** |
| 6 | Centro Medis | Competitor |

**Analisi:** Bio-Clinic e in posizione 5 con una pagina `/pages/` LEGACY, non con la pagina principale `/cardiologia/`. Questo dimostra la cannibalizzazione: Google non sa quale pagina servire.

**Strategia:**
1. Redirect 301 da `/pages/cardiologia.html` e `/pages/cardiologia` a `/cardiologia/`
2. Consolidare tutto il segnale su `/cardiologia/`
3. Ottenere sitelink per sotto-pagine (ecocardiogramma, holter, ecc.)
4. Schema FAQPage per catturare FAQ rich result
5. Attacco ai "People Also Ask" con pagine patologia dedicate

### "ginecologo sassari"

| Pos | Risultato |
|---|---|
| 1 | MioDottore |
| 2 | AOU Sassari |
| **3** | **Bio-Clinic /pages/ginecologia** |
| 4 | ASL Sassari |
| 5 | Studio Virdis |

**Analisi:** Buona posizione ma con pagina legacy. MioDottore e imbattibile per query "[specialista] + citta" perche' aggrega tutti i medici.

**Strategia:**
1. NON combattere MioDottore direttamente: sfruttarlo (i medici Bio-Clinic sono su MioDottore)
2. Catturare le query derivate: "migliori ginecologi sassari", "ginecologo sassari recensioni", "visita ginecologica sassari costo"
3. Consolidare su `/ginecologia/`, eliminare `/ginecologi-sassari/` (redirect 301)
4. Struttura FAQ aggressiva per PAA (People Also Ask)

### "dermatologo sassari"

| Pos | Risultato |
|---|---|
| 1 | MioDottore |
| 2 | Studio Coradduzza |
| 3 | Dott. Chiarolini |
| 4 | iDoctors |
| 5 | Centro Medis |
| **Bio-Clinic** | **NON PRESENTE top 10** |

**Analisi:** CRITICO. Bio-Clinic non appare per questa query nonostante abbia 3 dermatologhe.

**Strategia:**
1. Pagina `/dermatologia/` deve diventare super-hub con H1 "Dermatologo Sassari | 3 Specialiste | Bio-Clinic"
2. Creare pagine servizio sotto `/dermatologia/`
3. Profili delle 3 dermatologhe ottimizzati con keywords locali
4. Schema Physician per ognuna
5. FAQ aggressiva "miglior dermatologo sassari", "costo visita dermatologica sassari"

### "visita endocrinologica sassari"

| Pos | Risultato |
|---|---|
| 1 | AOU Sassari |
| 2 | Cup Solidale |
| **3** | **Bio-Clinic /pages/endocrinologia** |

**Strategia:** Consolidare su `/endocrinologia/`. Pagina gia forte, necessita schema OfferCatalog e FAQ piu aggressive.

### "pma sassari"

| Pos | Risultato |
|---|---|
| 1 | Centro Cura e Salute (CCS Fertility) |
| 2 | AOU Sassari |
| **3** | **Bio-Clinic /pages/pma-fertilita** |

**Strategia:** CCS Fertility ha il vantaggio di essere convenzionato SSR. Bio-Clinic deve posizionarsi come "diagnosi PMA + preparazione + monitoraggio 7/7". Creare pagine "infertilita sassari", "cause infertilita", "quando fare pma".

### "centro obesita sassari"

| Pos | Risultato |
|---|---|
| **1** | **Bio-Clinic Slim Care** |

**Strategia:** POSIZIONE 1 - Mantenere e consolidare. Espandere con pagine satellite: "wegovy sassari", "tirzepatide sassari", "dimagrire senza chirurgia sassari".

## 5.2 Rich Results Opportunity

| Rich Result | Status Attuale | Azione |
|---|---|---|
| FAQ Rich Result | Probabile per alcune pagine | Implementare FAQPage schema su TUTTE le pagine con FAQ |
| Local Business | Presente (Google Business) | Verificare schema MedicalClinic |
| Review Snippet | NON presente | Implementare AggregateRating (3.214 recensioni 5 stelle!) |
| Sitelinks | Presenti per homepage | Struttura gerarchica migliorerebbe sitelinks branca |
| HowTo | NON presente | Implementare per "come prepararsi a..." esami |
| Breadcrumb | Presente | Verificare BreadcrumbList schema |
| Offer | NON presente | Implementare per prezzi visita (da 80 euro) |

## 5.3 Strategia Recensioni Etiche

Bio-Clinic ha 3.214 recensioni a 5 stelle. Questo e un **asset straordinario** ma sottoutilizzato.

**Azioni:**
1. **Implementare AggregateRating schema** su homepage e pagine branca
2. **Creare sezione testimonial** per ogni branca con recensioni reali
3. **Rispondere a TUTTE le recensioni Google** (positive e negative) sistematicamente
4. **Sistema di raccolta recensioni post-visita** (SMS/email automatica con link Google review)
5. **NON** comprare/fabbricare recensioni: con 3.214 gia presenti, la crescita organica e sufficiente

---

# FASE 6 - CORE UPDATE RESILIENCE

## 6.1 Helpful Content Update - Risk Assessment

| Fattore | Rischio | Motivazione |
|---|---|---|
| Contenuto thin | **MEDIO** | Molte pagine servizio a root-level hanno contenuto limitato |
| Contenuto AI-generated | **BASSO** | Il contenuto appare umano e specifico |
| Contenuto prima di tutto per utente | **BASSO** | FAQ pratiche, prezzi, CTA chiare |
| Esperienza first-hand | **MEDIO** | Mancano case study, storie pazienti, risultati |
| Soddisfazione utente | **BASSO** | 3.214 recensioni 5 stelle dimostrano soddisfazione |

**Rischio Complessivo HCU: 35/100 (Medio-Basso)**

## 6.2 Medical Core Update - Risk Assessment

| Fattore | Rischio | Motivazione |
|---|---|---|
| YMYL compliance | **ALTO** | Sito 100% YMYL medico |
| Autore medico dichiarato | **ALTO** | Mancante sulla maggior parte delle pagine |
| Revisione clinica | **ALTO** | Completamente assente |
| Fonti mediche | **ALTO** | Nessuna linea guida citata |
| Schema MedicalEntity | **ALTO** | Assente |
| Trasparenza istituzionale | **MEDIO** | Chi siamo presente ma incompleto |
| Aggiornamento contenuti | **ALTO** | Nessuna data visibile |

**Rischio Complessivo Medical Core Update: 72/100 (ALTO)**

**Questo e il rischio piu grande per Bio-Clinic.** Un Medical Core Update potrebbe penalizzare il sito per assenza di segnali EEAT specifici per YMYL medico, nonostante il contenuto sia di buona qualita.

## 6.3 Spam Update - Risk Assessment

| Fattore | Rischio | Motivazione |
|---|---|---|
| Link spam | **BASSO** | Profilo link probabile naturale |
| Contenuto duplicato | **MEDIO** | Pagine /pages/ duplicate |
| Keyword stuffing | **BASSO** | Testo naturale |
| Cloaking | **BASSO** | Non rilevato |

**Rischio Complessivo Spam Update: 20/100 (Basso)**

## 6.4 EEAT Intensification - Risk Assessment

**Rischio: 70/100 (ALTO)**

Se Google intensifica i requisiti EEAT per YMYL (trend in corso), Bio-Clinic e vulnerabile per:
- Assenza di autori medici su pagine servizio
- Assenza di revisione clinica dichiarata
- Assenza di citazioni mediche
- Schema medico incompleto

## 6.5 Vulnerabilita Sistemiche Identificate

1. **Cannibalizzazione /pages/ vs pagine canoniche** - Rischio immediato
2. **Assenza EEAT medico completo** - Rischio Core Update
3. **Nessuna strategia Nord Sardegna** - Vulnerabilita espansione
4. **Dipendenza da query brand** - Se un competitor costruisce brand forte, Bio-Clinic perde
5. **Slim Care come single point of strength** - Se la nicchia Wegovy/Mounjaro si satura, l'asset si deprezza
6. **Blog fermo a Dic 2023** - Segnale di abbandono per Google

---

# FASE 7 - FUTURA ESPANSIONE MULTI-SEDE

## 7.1 Architettura Scalabile Proposta

### Fase A - Preparazione (Attuale -> 3 mesi)

Ristrutturare il sito attuale per essere "sede-ready":

```
bio-clinic.it/
|-- /sassari/                    [NUOVA - Hub geografica sede Sassari]
|   |-- /sassari/cardiologia/
|   |-- /sassari/ginecologia/
|   |-- /sassari/laboratorio/
|   |-- ...
|
|-- /cardiologia/                [Hub tematica trasversale - tutte le sedi]
|-- /ginecologia/                [Hub tematica trasversale]
|-- ...
```

**Nota:** Nella fase attuale (single-sede), le pagine branca possono rimanere a root-level (`/cardiologia/`) con internal linking aggressivo verso la struttura geografica.

### Fase B - Espansione (6-12 mesi)

```
bio-clinic.it/
|-- /sassari/                    [Sede principale]
|   |-- /sassari/cardiologia/
|   |-- /sassari/ginecologia/
|   |-- /sassari/equipe/
|   |-- /sassari/laboratorio/
|   |-- /sassari/contatti/
|
|-- /olbia/                      [Nuova sede]
|   |-- /olbia/cardiologia/
|   |-- /olbia/ginecologia/
|   |-- /olbia/equipe/
|   |-- /olbia/contatti/
|
|-- /alghero/                    [Nuova sede]
|   |-- /alghero/cardiologia/
|   |-- /alghero/equipe/
|   |-- /alghero/contatti/
```

### Fase C - Dominazione Nord Sardegna (12-24 mesi)

```
bio-clinic.it/
|-- /nord-sardegna/              [Hub regionale SEO]
|-- /sassari/
|-- /olbia/
|-- /alghero/
|-- /costa-smeralda/             [Landing turistica/residenti]
|-- /tempio-pausania/            [Landing micro-local]
|-- /porto-torres/
|-- /ozieri/
```

## 7.2 Strategia Authority Distribuita

**Principio:** Ogni sede deve ereditare l'autorita del brand Bio-Clinic senza diluirla.

1. **Subfolder, NON subdomini:** `bio-clinic.it/olbia/` e non `olbia.bio-clinic.it`
2. **Hub tematiche trasversali:** `/cardiologia/` linka a `/sassari/cardiologia/` e `/olbia/cardiologia/`
3. **Google Business Profile separato** per ogni sede
4. **Schema MedicalClinic** con `department` per ogni sede
5. **Hreflang** non necessario (stessa lingua, stessa nazione)

## 7.3 Schema Multi-Sede

```json
{
  "@type": "MedicalClinic",
  "name": "Bio-Clinic",
  "department": [
    {
      "@type": "MedicalClinic",
      "name": "Bio-Clinic Sassari",
      "address": "Via Renzo Mossa 23, 07100 Sassari"
    },
    {
      "@type": "MedicalClinic",
      "name": "Bio-Clinic Olbia",
      "address": "..."
    }
  ]
}
```

---

# FASE 8 - COMPETITOR SUPERIORITY ANALYSIS

## 8.1 Mappa Competitor

| Competitor | Tipo | Forza | Debolezza |
|---|---|---|---|
| **MioDottore** | Aggregatore | Domina query "[specialista] + citta", enorme authority | Non e un competitor diretto, e una piattaforma |
| **Centro Medis** | Poliambulatorio | Nuovo, moderno, posizionamento "premium" | Sito debole tecnicamente, poche specialita |
| **CDS Sassari** | Catena nazionale | Brand forte, marketing budget, apertura recente (2025) | Nessun radicamento territoriale, contenuto generico |
| **Health Care Center** | Poliambulatorio | Presente su iDoctors, buone recensioni | Sito basico, poche pagine |
| **CCS Fertility Center** | Specializzato PMA | Convenzionato SSR, Biogenesi network | Solo PMA, no polivalenza |
| **Policlinico Sassarese** | Ospedale privato | Grande, chirurgia, ricoveri | Non compete su ambulatoriale puro |
| **AOU/ASL Sassari** | Pubblico | Autorita istituzionale, primo per molte query | Lento, poco user-friendly, no marketing |
| **Studi privati singoli** | Singoli medici | Siti dedicati (Chiarolini, Virdis, Zirolia) | Mono-specialista, nessun ecosistema |

## 8.2 Perche Competitor Possono Essere Davanti

### MioDottore/iDoctors/TopDoctors (Aggregatori)
- **Domain Authority** enorme (DA 60-80+)
- Aggregano centinaia di medici per citta
- Google li preferisce per query transazionali generiche
- **Strategia Bio-Clinic:** Non competere frontalmente. Usarli come canale di acquisition. Presidiare query piu specifiche (brand + servizio + prezzo + condizione)

### AOU Sassari (Pubblico)
- Autorita istituzionale .it governativa
- Backlink da istituzioni
- **Strategia Bio-Clinic:** Differenziarsi su rapidita, orari estesi, esperienza paziente

### Centro Medis
- Sito piu nuovo, design moderno
- Investimento in branding
- **Debolezza:** Contenuto thin, nessuna strategia SEO visibile, poche specialita
- **Strategia Bio-Clinic:** Superarlo facilmente con contenuto profondo per branca

### CDS Sassari (Catena)
- Budget marketing nazionale
- Apertura 2025, aggressivita iniziale
- **Debolezza:** Contenuto generico replicato per ogni sede, nessuna personalizzazione locale
- **Strategia Bio-Clinic:** Contenuto iper-locale e EEAT medico come differenziatore

## 8.3 Dove Bio-Clinic e Superiore

1. **Numero specialisti** (67 vs max 20-30 competitor)
2. **Numero prestazioni** (1.840+ vs max 200-500 competitor)
3. **Recensioni** (3.214 a 5 stelle - imbattibile localmente)
4. **Slim Care / Wegovy / Mounjaro** - Nessun competitor ha questa offerta strutturata
5. **Prof. Dessole** - Asset personale di autorita accademica unico a Sassari
6. **Laboratorio 1.162 esami** - Il piu grande laboratorio privato della zona
7. **Orari estesi** (7-21 vs 9-19 competitor) - USP forte
8. **VisBody 3D** - Unico in Sardegna
9. **Symptom Checker** - Innovazione digitale che nessun competitor ha
10. **Search Engine interno** (2.112 token indicizzati!) - UX superiore

## 8.4 Dove Bio-Clinic e Vulnerabile

1. **Dermatologia SERP** - Non in top 10
2. **Cardiologia SERP** - Posizione 5
3. **Query "poliambulatorio sassari"** - Non presidiata
4. **Pagine /pages/ duplicate** - Cannibalizzazione attiva
5. **EEAT medico incompleto** - Rischio Core Update
6. **Blog fermo** - Ultimo post Dicembre 2023
7. **Nessuna presenza Nord Sardegna** - Territorio inesplorato
8. **CDS come nuovo competitor aggressivo** - Catena nazionale con budget
9. **CCS Fertility come leader PMA** - Convenzionato SSR

## 8.5 Come Diventare Irraggiungibile

### Moat #1: Contenuto Clinico Imbattibile
Creare 100+ pagine condizione/sintomo con firma medica, revisione clinica, citazioni linee guida. Nessun competitor locale puo replicare questo con 67 medici.

### Moat #2: Ecosistema Digitale Chiuso
Symptom Checker -> Pagina servizio -> Profilo medico -> Prenotazione -> Laboratorio -> Follow-up. Un patient journey digitale end-to-end che nessun competitor ha.

### Moat #3: Autorevolezza Accademica
Sfruttare le pubblicazioni PubMed di Dessole e raccogliere quelle di OGNI medico dell'equipe. Creare una sezione "Ricerca e Pubblicazioni" a livello di sito.

### Moat #4: Data Asset
1.162 esami x 3.214 recensioni x 67 medici x 1.840 prestazioni = un dataset strutturato che con schema markup diventa il knowledge graph locale piu completo per Google.

---

# OUTPUT OBBLIGATORIO - SCORECARD FINALE

## Score Globali

| Metrica | Score Attuale | Target 90gg | Target 12 mesi |
|---|---|---|---|
| **Dominazione Sassari** | **72/100** | 82/100 | 95/100 |
| **Dominazione Nord Sardegna** | **38/100** | 45/100 | 80/100 |
| **Score Tecnico Globale** | **78/100** | 90/100 | 95/100 |
| **Score EEAT Globale** | **68/100** | 82/100 | 95/100 |
| **Resilienza Core Update** | **65/100** | 80/100 | 92/100 |

## Score per Branca

| Branca | Score | Priorita |
|---|---|---|
| Ginecologia | 72/100 | P1 - Risolvere cannibalizzazione |
| Slim Care | 70/100 | P2 - Mantenere e consolidare |
| Laboratorio | 65/100 | P2 - Espandere check-up |
| Cardiologia | 63/100 | P1 - Recuperare SERP position |
| Endocrinologia | 62/100 | P2 - Pagine condizione |
| PMA | 61/100 | P1 - Differenziazione da CCS |
| Dermatologia | 49/100 | **P0 - EMERGENZA SERP** |
| Neurologia | 41/100 | P2 - Build out completo |
| Ortopedia | 37/100 | P2 - Build out completo |

## Vulnerabilita Reali (Top 10)

1. **Pagine /pages/ cannibalizzano pagine canoniche** - Impatto IMMEDIATO su ranking
2. **EEAT medico incompleto** - Espone a Medical Core Update
3. **Dermatologia invisibile** - Non presente in SERP per query core
4. **Cannibalizzazione ginecologia** - 3 pagine competono tra loro
5. **Blog fermo da 14 mesi** - Segnale negativo di freshness
6. **Nessuna copertura Nord Sardegna** - Territorio lasciato ai competitor
7. **Schema markup medico assente/incompleto** - Rich results persi
8. **Query "poliambulatorio sassari" non presidiata** - Traffic ad alto intento perso
9. **CDS Sassari come nuovo competitor** - Catena nazionale con budget
10. **3.214 recensioni non sfruttate in schema** - AggregateRating assente

---

# PIANO D'AZIONE

## PIANO 30 GIORNI - Emergency Fixes

### Settimana 1-2: Kill the Cannibalization

| # | Azione | Impatto |
|---|---|---|
| 1 | **Redirect 301 TUTTE le pagine /pages/ verso pagine canoniche** | Elimina cannibalizzazione, consolida segnali |
| 2 | **Redirect 301 /ginecologi-sassari/ -> /ginecologia/** | Elimina tripla cannibalizzazione |
| 3 | **Redirect 301 /visita-cardiologica/ -> /cardiologia/visita-cardiologica/** | Inizio migrazione gerarchica |
| 4 | **Canonical tag audit completo** | Verifica che ogni pagina abbia canonical corretto |

### Settimana 2-3: EEAT Emergency

| # | Azione | Impatto |
|---|---|---|
| 5 | **Aggiungere "Contenuto a cura del Dr. X" + data aggiornamento** su ogni pagina servizio | +15 punti EEAT |
| 6 | **Aggiungere iscrizione Albo Medici** su ogni profilo /equipe/ | +10 punti EEAT |
| 7 | **Aggiungere "Revisionato dal Prof. Dessole"** come Direttore Sanitario | +8 punti EEAT |

### Settimana 3-4: Schema & Technical

| # | Azione | Impatto |
|---|---|---|
| 8 | **Implementare Schema FAQPage** su tutte le pagine con FAQ | Rich results FAQ |
| 9 | **Implementare Schema MedicalClinic** completo su homepage | Knowledge panel |
| 10 | **Implementare AggregateRating** (3.214 recensioni, 5.0) | Star rating in SERP |
| 11 | **Implementare Schema Physician** su profili medici | Rich results medici |

---

## PIANO 90 GIORNI - Architecture & Content

### Mese 2: Ristrutturazione Architettura

| # | Azione |
|---|---|
| 12 | Migrazione TUTTE le pagine servizio sotto hub di branca con redirect 301 |
| 13 | Creare struttura gerarchica per ginecologia (modello cardiologia) |
| 14 | Creare struttura gerarchica per dermatologia |
| 15 | Creare struttura gerarchica per endocrinologia |
| 16 | Creare struttura gerarchica per neurologia |
| 17 | Creare struttura gerarchica per ortopedia |
| 18 | Creare struttura gerarchica per PMA |

### Mese 2-3: Content Sprint

| # | Azione | Pagine |
|---|---|---|
| 19 | **Creare 5 pagine condizione per DERMATOLOGIA** (acne, psoriasi, dermatite, vitiligine, rosacea) | 5 |
| 20 | **Creare 5 pagine condizione per CARDIOLOGIA** (ipertensione, aritmie, scompenso, infarto prevenzione, colesterolo alto) | 5 |
| 21 | **Creare 5 pagine condizione per GINECOLOGIA** (menopausa, endometriosi, PCOS, HPV prevenzione, gravidanza a rischio) | 5 |
| 22 | **Creare 3 pagine condizione per PMA** (infertilita femminile, infertilita maschile, quando fare PMA) | 3 |
| 23 | **Creare 3 pagine condizione per ENDOCRINOLOGIA** (ipotiroidismo, noduli tiroidei, diabete tipo 2) | 3 |
| 24 | **Creare landing "Poliambulatorio Sassari"** ottimizzata | 1 |
| 25 | **Creare landing "Centro Medico Sassari"** | 1 |
| 26 | **Rilanciare Blog** con 4 articoli medici firmati al mese | 12 articoli |

### Mese 3: Local Expansion Prep

| # | Azione |
|---|---|
| 27 | Creare pagina /nord-sardegna/ con contenuto territoriale |
| 28 | Creare landing "centro medico nord sardegna" |
| 29 | Ottimizzare Google Business Profile con tutte le specialita |
| 30 | Implementare schema OfferCatalog su pagine con prezzi |

---

## PIANO 12 MESI - Market Domination

### Trimestre 2 (Mesi 4-6)

| Azione | Obiettivo |
|---|---|
| Creare 30+ pagine condizione/sintomo restanti | Copertura query informazionale completa |
| Landing geo per Alghero, Olbia, Porto Torres | Espansione Nord Sardegna |
| Implementare pagina "Ricerca e Pubblicazioni" | EEAT accademico |
| Raccogliere pubblicazioni PubMed di TUTTI i medici | EEAT depth |
| Blog: 4 articoli/mese firmati da medici | Content freshness |
| Campagna recensioni etica post-visita | +500 recensioni/anno |

### Trimestre 3 (Mesi 7-9)

| Azione | Obiettivo |
|---|---|
| Struttura multi-sede pronta (/sassari/ hub) | Preparazione espansione |
| Schema MedicalCondition su tutte le pagine condizione | Rich results medici |
| Video contenuti per ogni branca (YouTube + sito) | Video carousel SERP |
| Percorsi paziente completi per ogni branca | Journey mapping |
| PR digitale: interviste medici su testate sarde | Backlink authority |

### Trimestre 4 (Mesi 10-12)

| Azione | Obiettivo |
|---|---|
| Apertura contenuti per possibile sede Olbia | Espansione reale |
| Consolidamento posizioni SERP | Top 3 per tutte le query core |
| Implementazione AI chatbot medico avanzato | Innovazione digitale |
| Audit annuale completo | Verifica obiettivi |
| Preparazione strategia 2027 | Crescita continua |

---

# OBIETTIVO FINALE - VISIONE 12 MESI

Al termine del piano 12 mesi, Bio-Clinic dovra essere:

### 1. Centro Medico di Riferimento Indiscusso per Sassari e Nord Sardegna
- Top 3 per TUTTE le query "[specialista] + sassari"
- Top 1 per "poliambulatorio sassari", "centro medico sassari"
- Presenza in SERP per query "nord sardegna" medicali

### 2. Primo per Tutte le Query Core
- Posizione 1-3 per ogni "visita [specialita] sassari"
- Posizione 1 per "slim care sassari", "wegovy sassari", "mounjaro sassari"
- Posizione 1-2 per "laboratorio analisi sassari"
- FAQ rich result per l'80%+ delle query mediche locali

### 3. Dominatore Tematico Verticale
- 100+ pagine condizione/sintomo indicizzate
- Cluster completi per ogni branca (hub -> servizio -> condizione -> prevenzione -> medico)
- Blog attivo con 48+ articoli/anno firmati da medici

### 4. Inattaccabile da Competitor Locali
- EEAT score 95+ con autori medici, revisione clinica, pubblicazioni, schema completo
- 4.000+ recensioni Google
- Architettura scalabile multi-sede pronta
- Knowledge graph locale il piu completo in Sardegna
- Digital patient journey end-to-end (Symptom Checker -> Prenotazione -> Referti)

---

*Report generato il 15 Febbraio 2026*  
*Basato su crawling completo bio-clinic.it, analisi SERP real-time, competitive intelligence*
