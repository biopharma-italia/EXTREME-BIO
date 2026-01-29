# BIO-CLINIC SASSARI - SCHEMA TECNICO COMPLETO
## Documento per AI Assistant (Gemini/Claude)
**Generato:** 2026-01-28 | **Versione:** 3.0.0

---

## 1. OVERVIEW ARCHITETTURA

### Tipo di Sito
- **Sito statico** (no backend, no database server)
- **Hosting:** File HTML/CSS/JS serviti da web server statico
- **Dati:** JSON files caricati via JavaScript (fetch API)
- **Prenotazioni:** Widget esterni MioDottore (DocPlanner)

### URL Produzione
- **Dominio:** `bio-clinic.it`
- **Test Sandbox:** `https://8080-*.sandbox.novita.ai`

---

## 2. STRUTTURA DIRECTORY

```
site/
├── index.html                    # Homepage
├── favicon.ico                   # Favicon
│
├── css/
│   ├── style.css                 # Stili globali (24KB)
│   ├── search.css                # Stili ricerca (17KB)
│   └── physician.css             # Stili pagine medici (6KB)
│
├── js/
│   ├── database.js               # 🔥 GRAFO CONOSCENZA CLINICA (294KB)
│   ├── search.js                 # Motore ricerca semantica (33KB)
│   ├── header-search.js          # Barra ricerca header (6KB)
│   └── main.js                   # Utilities generali (9KB)
│
├── data/
│   ├── entities/
│   │   ├── physicians-complete.json   # 👥 47 medici con widget
│   │   ├── physicians.json            # Versione ridotta
│   │   ├── specialties.json           # 31 specialità
│   │   ├── procedures.json            # Prestazioni
│   │   ├── tests.json                 # Esami laboratorio
│   │   ├── pathways.json              # Percorsi clinici
│   │   └── packs.json                 # Pacchetti check-up
│   │
│   ├── search/
│   │   ├── index.json                 # Indice ricerca (v2.1.0)
│   │   └── synonyms.json              # Sinonimi medici
│   │
│   └── listino-processed.json         # 1136 esami processati
│
├── equipe/
│   ├── index.html                     # Lista 48 medici
│   └── {slug}.html                    # 48 pagine individuali
│
├── laboratorio/
│   └── index.html                     # Pagina laboratorio con ricerca
│
├── pages/
│   ├── ginecologia.html
│   ├── cardiologia.html
│   ├── endocrinologia.html
│   ├── dermatologia.html
│   ├── neurologia.html
│   ├── oculistica.html
│   ├── ortopedia.html
│   ├── laboratorio.html
│   ├── slim-care.html
│   ├── slim-care-donna.html
│   ├── pma-fertilita.html
│   ├── specialita.html
│   ├── chi-siamo.html
│   ├── contatti.html
│   ├── privacy.html
│   └── cookie.html
│
├── prestazioni/
│   └── index.html                     # Catalogo prestazioni
│
├── images/
│   ├── logo-bioclinic.png
│   ├── favicon.png
│   └── [altre immagini hero]
│
├── shop/
│   └── index.html                     # Medical Shop (Coming Soon)
│
├── components/
│   └── master-header.html             # 🔥 MASTER HEADER UFFICIALE
│
├── docs/
│   ├── SCHEMA-TECNICO-GEMINI.md       # Questo documento
│   ├── schema-tecnico.json            # Versione JSON
│   └── PROTOCOLLO-HEADER.md           # Protocollo Global Update
│
└── scripts/                           # Script Python generazione
    ├── generate-physician-pages.py
    ├── generate-equipe-index.py
    ├── update-search-index.py
    └── propagate-header.py            # 🔥 PROPAGAZIONE HEADER AUTOMATICA
```

---

## 2.1 SISTEMA HEADER UNIFICATO (NUOVO!)

### Master Header
Il file `components/master-header.html` contiene l'header UFFICIALE che viene propagato a TUTTE le pagine.

### Voci Menu (v2.0)
```
Home | Slim Care Medical | Laboratorio | Donna & PMA | Specialisti | Medical Shop | Contatti | [Prenota]
```

### Come Aggiornare l'Header
```bash
# 1. Modifica SOLO il file master
nano components/master-header.html

# 2. Esegui propagazione automatica
python3 scripts/propagate-header.py

# Output: 68 pagine aggiornate automaticamente
```

### Placeholder Supportati
- `{{ROOT_PATH}}` → Path relativo alla root
- `{{PAGES_PATH}}` → Path relativo a /pages/
- `{{ACTIVE_HOME}}` → Classe "active" per Home
- `{{ACTIVE_SLIMCARE}}` → Classe "active" per Slim Care
- `{{ACTIVE_LAB}}` → Classe "active" per Laboratorio
- ecc.

---

## 3. DATABASE JAVASCRIPT (js/database.js)

### Descrizione
File JavaScript che espone `BioClinicDB` - un **Grafo di Conoscenza Clinica** per ricerca semantica lato client.

### Statistiche
| Metrica | Valore |
|---------|--------|
| Esami totali | 1.136 |
| Pacchetti check-up | 12 |
| Categorie mediche | 21 |
| Sintomi mappati | 19 |
| Esami con upsell | 193 |

### API Pubblica

```javascript
// Oggetto globale disponibile
window.BioClinicDB = {
  // === DATI ===
  pacchetti: [...],      // 12 pack check-up
  listino: [...],        // 1136 esami
  config: {...},         // Configurazione urgenze/specialisti
  sintomiLabels: {...},  // Mapping sintomi -> label italiano
  stats: {...},          // Statistiche runtime

  // === INDICI ===
  byCategory: {...},     // Esami per categoria
  bySymptom: {...},      // Esami per sintomo
  byUpsell: {...},       // Esami per pack suggerito

  // === METODI ===
  search(query),              // Ricerca semantica
  suggerisciPack(eta, sesso), // Suggerimento pack
  esamiPerSintomo(sintomo),   // Filtra per sintomo
  esamiPerCategoria(cat),     // Filtra per categoria
  isUrgente(esameId),         // Check urgenza
  packPerEsame(esame),        // Pack correlato

  // === UTILITIES ===
  getEsame(id),          // Trova esame per ID
  getPack(id),           // Trova pack per ID
  getCategorie(),        // Lista categorie
  getSintomi(),          // Lista sintomi

  // === META ===
  version: '3.0.0',
  generated: '2026-01-28T13:09:23'
};
```

### Struttura Pacchetto (Pack)

```javascript
{
  "id": "donna-under40",
  "nome": "Check Up Donna Under 40",
  "prezzo": 97.0,
  "descrizione": "Screening completo per donne giovani...",
  "target": ["donna", "under40"],
  "tags": ["donna", "prevenzione", "fertilità", "energia"],
  "esami_chiave": ["emocromo", "ferritina", "vitamina-d", "tsh", ...],
  "esami_count": 17,
  "risparmio": "Risparmi il 35% rispetto agli esami singoli",
  "icona": "👩"
}
```

### Struttura Esame (Listino)

```javascript
{
  "id": "tsh-ultrasensibile",
  "nome": "TSH ULTRASENSIBILE",
  "cat": "Tiroide",              // Categoria
  "prezzo": 15.0,
  "sintomi": ["stanchezza", "aumento_peso", "perdita_capelli"],
  "upsell": "tiroide-base",      // Pack suggerito
  "prep": "Digiuno 8-12 ore",    // Preparazione
  "referto": "24h",              // Tempi referto
  "urgente": false
}
```

### 12 Pacchetti Disponibili

| ID | Nome | Prezzo | Esami |
|----|------|--------|-------|
| `base` | Check Up Base | €55 | 18 |
| `donna-under40` | Donna Under 40 | €97 | 17 |
| `donna-over40` | Donna Over 40 | €75 | 20 |
| `uomo-under40` | Uomo Under 40 | €75 | 14 |
| `uomo-over40` | Uomo Over 40 | €124.99 | 17 |
| `bambino` | Bambino | €59.90 | 8 |
| `tiroide-base` | Tiroide Base | €29 | 3 |
| `tiroide-plus` | Tiroide Plus | €85.90 | 10 |
| `cardio-plus` | Cardiologico Plus | €125 | 15 |
| `renale` | Profilo Renale | €29 | 3 |
| `epatico` | Profilo Epatologico | €75 | 6 |
| `pre-gravidanza` | Pre Gravidanza | €185 | 19 |

### 21 Categorie Esami

```
Autoimmunità, Altro, Renale, Infettivologia, Epatico,
Coagulazione, Ematologia, Genetica/Molecolare, Ormoni,
Fecale, Vitamina/Minerali, Infiammazione, Glicemia/Diabete,
Tumore/Markers, Tiroide, Lipidico, Cardiologico, Elettroliti,
Urinario, Tossicologia, Allergologia
```

### 19 Sintomi Mappati

```javascript
const sintomiLabels = {
  "stanchezza": "Stanchezza e affaticamento",
  "perdita_capelli": "Perdita di capelli",
  "aumento_peso": "Aumento di peso",
  "anemia": "Anemia e pallore",
  "infezioni": "Infezioni ricorrenti",
  "colesterolo_alto": "Colesterolo alto",
  "diabete": "Diabete o prediabete",
  "tiroide": "Problemi tiroidei",
  "fegato": "Problemi epatici",
  "reni": "Problemi renali",
  "cuore": "Problemi cardiaci",
  "prostata": "Problemi alla prostata",
  "menopausa": "Menopausa",
  "infertilita": "Infertilità",
  "gravidanza": "Gravidanza",
  "infiammazione": "Infiammazione",
  "coagulazione": "Problemi di coagulazione",
  "ossa": "Problemi alle ossa",
  "allergie": "Allergie"
};
```

---

## 4. MOTORE DI RICERCA (js/search.js)

### Descrizione
Classe `BioClinicSearch` per ricerca semantica su entità cliniche.

### Inizializzazione

```javascript
// Carica automaticamente al DOM ready
const search = new BioClinicSearch({
  dataBasePath: '/data'  // Path JSON files
});
```

### File JSON Richiesti

```
/data/search/index.json      # Indice termini -> entità
/data/search/synonyms.json   # Sinonimi medici
```

### Struttura Index (search/index.json)

```javascript
{
  "version": "2.1.0",
  "generated": "2026-01-28T01:45:09",
  "description": "Indice di ricerca unificato Bio-Clinic",
  "stats": {
    "total_terms": 251,
    "physicians": 48,
    "specialties": 23,
    "procedures": 33,
    "tests": 24,
    "pathways": 4,
    "packs": 12
  },
  "terms": {
    "tiroide": {
      "procedures": ["visita-endocrinologica", "ecografia-tiroidea"],
      "tests": ["tsh-ultrasensibile", "ft3", "ft4", "anti-tpo"],
      "physicians": ["francesco-tolu", "irene-aini"],
      "specialties": ["endocrinologia"],
      "packs": ["checkup-tiroide"],
      "priority": "pack:checkup-tiroide",
      "clinical_context": "Valutazione funzione tiroidea",
      "uplink": {
        "type": "pack",
        "id": "checkup-tiroide",
        "message": "Per la tiroide, il percorso più completo è il Profilo Tiroide Completo"
      }
    }
    // ... altri 250 termini
  }
}
```

---

## 5. ENTITÀ MEDICI (physicians-complete.json)

### Statistiche
- **Totale medici:** 47
- **Con widget MioDottore:** 47 (100%)
- **Specialità coperte:** 23

### Struttura Medico

```javascript
{
  "id": "francesco-dessole",
  "slug": "francesco-dessole",
  "title": "Dott.",
  "name": "Francesco Dessole",
  "full_name": "Dott. Francesco Dessole",
  "specialty_id": "ginecologia",
  "job_title": "Ginecologo",
  "role_badge": "Medico Rif. Slim Care Donna",
  "bio": "Ginecologo specializzato in PCOS...",
  "procedures": ["visita-ginecologica", "ecografia-ginecologica", ...],
  "pathways": ["slim-care-donna", "pma-fertilita"],
  "miodottore_id": "francesco-dessole",
  "miodottore_url": "https://www.miodottore.it/francesco-dessole/ginecologo/sassari",
  "widget_html": "<a id=\"zl-url\" class=\"zl-url\" href=\"...\" data-zlw-doctor=\"francesco-dessole\" data-zlw-type=\"button_calendar_medium\">...</a>",
  "booking_enabled": true,
  "photo_url": null
}
```

### Widget MioDottore

Il widget richiede il caricamento dello script:

```html
<script>
!function($_x,_s,id){
  var js,fjs=$_x.getElementsByTagName(_s)[0];
  if(!$_x.getElementById(id)){
    js=$_x.createElement(_s);
    js.id=id;
    js.src="//platform.docplanner.com/js/widget.js";
    fjs.parentNode.insertBefore(js,fjs);
  }
}(document,"script","zl-widget-s");
</script>
```

---

## 6. SPECIALITÀ (specialties.json)

### 31 Specialità Registrate

```javascript
// Con pagina dedicata (page_url presente)
ginecologia, cardiologia, endocrinologia, dermatologia,
neurologia, oculistica, ortopedia, laboratorio

// Senza pagina (page_url: null)
otorinolaringoiatria, gastroenterologia, medicina-interna,
nefrologia, pneumologia, ematologia, reumatologia, urologia,
chirurgia-vascolare, ecografia, medicina-sport, medicina-lavoro,
fisiatria, pediatria, psicologia, nutrizione
```

### Struttura Specialità

```javascript
{
  "id": "cardiologia",
  "name": "Cardiologia",
  "slug": "cardiologia",
  "icon": "heart",
  "description": "ECG, ecocardiogramma, Holter...",
  "procedures_count": 39,
  "tests_count": 12,
  "physicians_count": 5,
  "page_url": "/pages/cardiologia.html",
  "main_procedures": ["visita-cardiologica", "ecg", "ecocardiogramma", ...],
  "main_tests": ["profilo-lipidico", "troponina", "bnp", ...],
  "physicians": ["tonino-bullitta", "sara-uras", ...],
  "related_pathways": ["checkup-cardiovascolare"],
  "keywords": ["cardiologo", "cuore", "ecg", "holter", ...]
}
```

---

## 7. PERCORSI CLINICI (pathways.json)

### Percorsi Attivi

| ID | Nome | Pagina |
|----|------|--------|
| `slim-care` | Slim Care | /pages/slim-care.html |
| `slim-care-donna` | Slim Care Donna | /pages/slim-care-donna.html |
| `pma-fertilita` | PMA / Fertilità | /pages/pma-fertilita.html |
| `checkup-cardiovascolare` | Check-up Cardiovascolare | (in sviluppo) |

---

## 8. SCRIPT DI GENERAZIONE (scripts/)

### generate-physician-pages.py
Genera le 48 pagine HTML individuali dei medici in `/equipe/`.

**Input:** `data/entities/physicians-complete.json`
**Output:** `equipe/{slug}.html`

**Include:**
- Schema.org JSON-LD (Physician, MedicalClinic)
- Widget MioDottore
- SEO meta tags
- Breadcrumbs

### generate-equipe-index.py
Genera la pagina index dell'équipe.

**Input:** `data/entities/physicians-complete.json`
**Output:** `equipe/index.html`

**Include:**
- Lista medici raggruppati per specialità
- Filtri JavaScript
- JSON-LD ItemList

### update-search-index.py
Aggiorna l'indice di ricerca con nuovi medici.

**Input:** `data/entities/physicians-complete.json`
**Output:** `data/search/index.json`

---

## 9. CONVENZIONI CODICE

### CSS Classes Principali

```css
/* Layout */
.container           /* Max-width wrapper */
.section            /* Sezione con padding */
.flex-between       /* Flexbox space-between */

/* Componenti */
.btn, .btn-primary  /* Bottoni */
.card               /* Card generica */
.physician-card     /* Card medico */
.exam-card          /* Card esame */
.pack-card          /* Card pacchetto */

/* Header/Navigation */
.header, .header-top, .header-main
.nav, .nav-list, .nav-item, .nav-link
.logo

/* Footer */
.footer, .footer-grid, .footer-bottom

/* Ricerca */
.search-box, .search-input, .search-results
```

### JavaScript Patterns

```javascript
// Modulo IIFE con API pubblica
const Module = (function() {
  'use strict';
  
  // Private
  const privateData = {};
  
  function privateMethod() {}
  
  // Public API
  return {
    publicMethod,
    publicData
  };
})();

// Export per compatibilità
if (typeof module !== 'undefined') {
  module.exports = Module;
}
window.Module = Module;
```

### Naming Conventions

```
// File
kebab-case.html
kebab-case.js
kebab-case.json

// CSS classes
.kebab-case

// JavaScript
camelCase (variabili, funzioni)
PascalCase (classi, costruttori)
UPPER_SNAKE_CASE (costanti)

// JSON keys
snake_case (es. page_url, physicians_count)
```

---

## 10. INTEGRAZIONI ESTERNE

### MioDottore (DocPlanner)
- **Widget:** Prenotazione visite
- **Script:** `//platform.docplanner.com/js/widget.js`
- **Attributi data:** `data-zlw-doctor`, `data-zlw-type`, etc.

### Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```

### Schema.org (JSON-LD)
Utilizzati: `Physician`, `MedicalClinic`, `MedicalProcedure`, `ItemList`, `BreadcrumbList`

---

## 11. CONTATTI E RIFERIMENTI

### Bio-Clinic Sassari
- **Indirizzo:** Via Renzo Mossa 23, 07100 Sassari (SS)
- **Telefono:** +39 079 956 1332
- **Email:** gestione@bio-clinic.it
- **Orari:** Lun-Ven 07:00-21:00, Sab 08:00-14:00
- **P.IVA:** 02869450904 (Bio Pharma S.r.l.)

### Social
- **Facebook:** https://www.facebook.com/bioclinicss
- **Instagram:** https://www.instagram.com/bioclinicss/

---

## 12. TODO / FUNZIONALITÀ MANCANTI

### Da Implementare
- [ ] Pagine specialità mancanti (otorinolaringoiatria, gastroenterologia, etc.)
- [ ] Sistema prenotazione integrato (oltre widget MioDottore)
- [ ] Foto medici (attualmente `photo_url: null`)
- [ ] Pagina singola per ogni esame laboratorio
- [ ] Comparatore pack check-up
- [ ] Calcolatore preventivo esami
- [ ] Sistema recensioni/testimonianze
- [ ] Blog/news cliniche
- [ ] Multi-lingua (IT/EN)
- [ ] PWA / Offline support

### Miglioramenti Proposti
- [ ] Lazy loading immagini
- [ ] Service worker per caching
- [ ] Animazioni micro-interactions
- [ ] Dark mode
- [ ] Accessibilità WCAG 2.1 AA
- [ ] Performance optimization (Core Web Vitals)

---

*Documento generato automaticamente - Bio-Clinic Sassari*
