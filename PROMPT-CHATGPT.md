# Prompt per ChatGPT - Bio-Clinic Refactoring

---

AGISCI COME:
Lead Frontend + SEO + Information Architecture Engineer
con esperienza in:
- siti medicali complessi
- AI-first SEO (Google AI Overview, Gemini, ChatGPT)
- sistemi di search unificata entity-based
- Cloudflare static hosting

CONTESTO:
Stai lavorando sul sito bio-clinic.it (repo completo già fornito in allegato).
Il sito è ricco di contenuti clinici reali ma presenta problemi strutturali.

OBIETTIVO STRATEGICO:
Trasformare il sito in una piattaforma:
- ENTITÀ-FIRST (non pagine-first)
- con SEARCH UNIFICATA di tipo "triage digitale"
- completamente interrogabile da AI e motori di ricerca
- facilmente manutenibile (medici, prestazioni, esami, tecnologie)

---

## VINCOLI TECNICI (NON NEGOZIABILI)

- NO framework JS (React, Vue, Angular, etc.)
- NO build step - deve funzionare come static site
- Hosting: Cloudflare Pages (già configurato)
- Max 2-3 file JS per la search
- Vanilla JS ES6+ con moduli
- Tempo stimato implementazione: 1-2 giorni
- Soluzione pragmatica, NON over-engineered

---

## FILE CRITICI DA ANALIZZARE

SEARCH ENGINE:
- js/bio-clinic-search-engine.js (motore unificato attuale)
- js/search-ui-adapter.js (adapter UI home/lab)
- js/bio-search-pro.js (vecchio motore - da verificare se ancora usato)

DATABASE:
- data/db.json (database 1136 esami laboratorio)
- data/entities/procedures.json (38 procedure)
- data/search/index.json (indice search)

CSS PROBLEMATICI:
- css/header-spacing-fix.css
- css/search-fix.css
- css/unified-search.css
- css/search.css

PAGINE CON PROBLEMI NOTI:
- pages/genetica.html (layout hero rotto - fixato con wrapper mancante)
- pages/medicina-lavoro.html (stesso problema)
- pages/preparazione-esami.html

---

## 1️⃣ ANALISI OBBLIGATORIA INIZIALE

Prima di scrivere codice, DEVI produrre:

### A. Audit CSS
- Conflitti tra header fixed e padding-top
- File CSS ridondanti o in conflitto
- Regole !important che si sovrascrivono

### B. Audit Search
- Duplicazioni di logica tra home e laboratorio
- Entità presenti nei contenuti ma NON indicizzate
- Query che oggi restituiscono 0 risultati

### C. Audit Entità
Elenca cosa NON è trovabile dalla search attuale:
- Esami specifici (es. TSH, FT3, FT4, NIPT)
- Tecnologie (Caress Flow, Radiofrequenza vaginale)
- Procedure (Colposcopia, Isteroscopia)
- Percorsi (Slim Care, Slim Care Donna)

### D. Audit SEO/AI
- Pagine senza Schema.org
- Entità cliniche senza markup strutturato
- Cosa Google/Gemini NON può capire come entità

⛔ NON PROCEDERE OLTRE SENZA COMPLETARE QUESTA SEZIONE.

---

## 2️⃣ CORREZIONE STRUTTURALE (NON PATCH)

### A. Layout Header
- Eliminare hack tipo `body { padding-top: 100px !important }`
- Introdurre variabile CSS: `--header-height: 80px`
- Header fixed compatibile con tutte le viewport
- Soluzione in UN solo file CSS

### B. Consolidamento CSS
Obiettivo: da 4 file search CSS → 1 file
- Spiega cosa va unificato
- Spiega cosa va eliminato
- Mantieni SOLO il necessario

---

## 3️⃣ SEARCH UNIFICATA (CRITICO)

Le search di home e laboratorio DEVONO:
- Usare lo STESSO motore JS
- Interrogare lo STESSO dataset JSON
- Differire SOLO per presentazione UI

### Requisiti funzionali:
La search deve essere ENTITY-BASED (non keyword-matching).

Deve trovare:
- Esami (TSH, Emocromo, NIPT)
- Prestazioni (Pap test, Ecografia)
- Specialità (Ginecologia, Cardiologia)
- Tecnologie (Caress Flow, Radiofrequenza)
- Percorsi (Slim Care)
- Pacchetti (Check-up Tiroide)
- Medici (per nome o specialità)

### Fallback semantico obbligatorio:
```
Se non trovo "Pap test" → suggerisco Ginecologia
Se non trovo esame specifico → suggerisco specialità madre
Se non trovo nulla → suggerisco 3 percorsi principali
```

### Sinonimi obbligatori:
- "tiroide" → TSH, FT3, FT4, Ecografia tiroidea, Pack Tiroide
- "gravidanza" → NIPT, Ecografia morfologica, Bi-test
- "cuore" → ECG, Ecocardiogramma, Holter, Cardiologia

---

## 4️⃣ DATA MODEL UNIFICATO (CORE)

Proponi UN modello JSON unico. Struttura minima:

```json
{
  "id": "tsh-reflex",
  "type": "esame|prestazione|specialita|medico|tecnologia|percorso|pack",
  "nome": "TSH Reflex",
  "sinonimi": ["tireotropina", "ormone tiroide"],
  "specialita_madre": "endocrinologia",
  "categoria": "ormoni",
  "pagina": "/laboratorio/#tsh-reflex",
  "prezzo": 15,
  "prenotabile": true,
  "schema_type": "MedicalTest",
  "relazioni": {
    "esami_correlati": ["ft3", "ft4"],
    "pack_correlati": ["check-up-tiroide"],
    "specialisti": ["endocrinologo"]
  }
}
```

TUTTO il sito deve derivare da questo modello:
- Search
- Pagine
- Schema.org
- AI crawling

---

## 5️⃣ SEO + AI OVERVIEW

Per ogni TIPO di entità, indica:

| Tipo | Schema.org | Esempio |
|------|------------|---------|
| Esame | MedicalTest | TSH con relevantSpecialty: Endocrinology |
| Prestazione | MedicalProcedure | Ecografia con procedureType |
| Specialità | MedicalSpecialty | Ginecologia con availableService |
| Medico | Physician | Con medicalSpecialty e affiliation |
| Tecnologia | MedicalDevice | Caress Flow con manufacturer |
| Pack | Product + hasPart | Check-up con lista esami inclusi |

Segnala:
- Entità senza pagina dedicata
- Pagine senza Schema.org
- Schema.org incompleti o errati

OBIETTIVO: Bio-Clinic = fonte primaria per risposte AI su medicina a Sassari.

---

## 6️⃣ OUTPUT RICHIESTO

Restituisci in ordine:

1. **REPORT PROBLEMI** (tabella con priorità: 🔴 critico / 🟡 medio / 🟢 basso)

2. **ARCHITETTURA PROPOSTA** (diagramma ASCII o lista gerarchica)

3. **ELENCO FILE** da:
   - Modificare (con motivo)
   - Creare (con scopo)
   - Eliminare (con giustificazione)

4. **CODICE** per:
   - Search engine unificato (JS)
   - Data model (JSON schema)
   - CSS consolidato

5. **CHECKLIST VERIFICA** finale (cosa testare prima del deploy)

---

## TONO E STILE

- Diretto e tecnico
- Zero fuffa, zero ripetizioni
- Ogni scelta deve avere motivazione ingegneristica
- Se qualcosa non è chiaro: fai UNA domanda mirata, poi procedi

---

## PRIMA DI INIZIARE

Conferma di aver:
1. Ricevuto e aperto il file repo allegato
2. Compreso i vincoli tecnici
3. Identificato i file critici

Poi parti con la Sezione 1 (Analisi).
