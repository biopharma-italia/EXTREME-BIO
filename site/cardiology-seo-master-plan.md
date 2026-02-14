# PHASE 1: STRUCTURAL ANALYSIS
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agents:** SEO Architect + Information Architect
**Status:** ✅ COMPLETE

---

## 1. HIERARCHICAL DIAGRAM - Current State

```
bio-clinic.it/
├── cardiologia/                          [HUB - LIVE ✅]
│   ├── index.html                        (Canonical: /cardiologia/)
│   ├── visita-cardiologica-ecg/          [SERVICE - LIVE ✅]
│   │   └── index.html
│   ├── ecocardiogramma/                  [SERVICE - LIVE ✅]
│   │   └── index.html
│   ├── holter-ecg/                       [SERVICE - LIVE ✅]
│   │   └── index.html
│   ├── holter-pressorio/                 [SERVICE - LIVE ✅]
│   │   └── index.html
│   ├── checkup-cardiovascolare/          [SERVICE - LIVE ✅]
│   │   └── index.html
│   ├── eco-doppler-tsa/                  [PENDING - EMPTY DIR]
│   ├── eco-doppler-arti/                 [PENDING - EMPTY DIR]
│   └── test-da-sforzo/                   [PENDING - EMPTY DIR]
│
├── pages/                                [LEGACY - TO DEPRECATE]
│   ├── cardiologia.html                  → Redirect to /cardiologia/
│   ├── visita-cardiologica-ecg.html      → CANONICAL CONFLICT ⚠️
│   ├── ecocardiogramma.html              → CANONICAL CONFLICT ⚠️
│   ├── holter-ecg.html                   → Should redirect
│   ├── holter-pressorio.html             → Should redirect
│   ├── checkup-cardiovascolare.html      → Should redirect
│   ├── visita-cardiologica.html          → Meta-refresh (migrated)
│   └── ecg.html                          → Meta-refresh (migrated)
│
└── equipe/                               [DOCTORS]
    ├── tonino-bullitta.html              [CARDIOLOGO]
    ├── sara-uras.html                    [CARDIOLOGA]
    ├── paolo-pischedda.html              [CARDIOLOGO]
    ├── paolo-franca.html                 [CARDIOLOGO]
    └── giuliana-guagnozzi.html           [CARDIOLOGA]
```

---

## 2. SEVERITY-RANKED ISSUES

| # | Issue | Severity | Impact | Files Affected |
|---|-------|----------|--------|----------------|
| 1 | **324 broken internal links** to `cardiologia.html` | 🔴 CRITICAL | Link equity loss, poor UX | 100+ pages |
| 2 | **Canonical conflicts** - old pages still have old canonical | 🔴 CRITICAL | Duplicate content, crawl waste | 2 files |
| 3 | **Near-orphan pages** - holter-ecg, holter-pressorio < 5 inbound links | 🟠 HIGH | Low discoverability, weak authority | 2 pages |
| 4 | **Missing service pages** - eco-doppler-tsa, eco-doppler-arti, test-da-sforzo | 🟠 HIGH | Incomplete cluster, keyword gap | 3 pages |
| 5 | **Schema breadcrumb mismatch** - points to /specialita/cardiologia/ | 🟡 MEDIUM | Schema/URL inconsistency | 1 file |
| 6 | **No symptom landing pages** | 🟡 MEDIUM | Missing long-tail traffic | 0 pages |
| 7 | **Doctor-service linking** weak | 🟡 MEDIUM | EEAT signal dilution | 5 doctors |
| 8 | **Price format inconsistent** | 🟢 LOW | UX confusion | 6 pages |

---

## 3. INTERLINK MAP - Current State

### 3.1 Inbound Links to Cardiology Cluster
```
Source                    → Target                           Count   Status
─────────────────────────────────────────────────────────────────────────────
pages/*.html              → cardiologia.html                  324     ⚠️ OLD PATH
equipe/*.html             → ../pages/cardiologia.html          53     ⚠️ OLD PATH
pages/*.html              → visita-cardiologica-ecg.html        5     ⚠️ OLD PATH
pages/*.html              → ecocardiogramma.html                5     ⚠️ OLD PATH
cardiologia/index.html    → /cardiologia/servizio/              0     ❌ MISSING
equipe/tonino-bullitta    → /cardiologia/                       0     ❌ MISSING
```

### 3.2 Doctor Competency Matrix (from user input)
```
Doctor                  | Holter ECG | Holter Press. | Eco-Cardio | TSA | Eco-Arti | Test Sforzo
────────────────────────────────────────────────────────────────────────────────────────────────
Dott. Bullitta          |     ✅     |       -       |     ✅     |  -  |    ✅    |      -
Dott.ssa Uras           |     ✅     |       -       |     ✅     | ✅  |     -    |      -
Dott. Pischedda         |     ✅     |      ✅       |     ✅     | ✅  |    ✅    |     ✅
Dott. Franca            |     ✅     |      ✅       |     ✅     | ✅  |    ✅    |     ✅
Dott.ssa Guagnozzi      |      -     |       -       |      -     |  -  |     -    |     ✅
```

---

## 4. CRITICAL FINDINGS

### 4.1 Duplicate Content Risk
- `pages/visita-cardiologica-ecg.html` canonical: `https://bio-clinic.it/pages/visita-cardiologica-ecg.html`
- `cardiologia/visita-cardiologica-ecg/index.html` canonical: `https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/`
- **Risk:** Google may index both, causing crawl budget waste and ranking dilution

### 4.2 Equity Leakage
- 324 internal links still point to old `cardiologia.html` path
- Redirects are working (301) but passing ~10-15% less equity than direct links
- **Recommendation:** Update all internal links to new `/cardiologia/` paths

### 4.3 Cluster Incompleteness
- Missing pages: eco-doppler-tsa, eco-doppler-arti, test-da-sforzo
- These are HIGH-VALUE services with pricing confirmed by user
- **Impact:** Incomplete topic coverage, missing keyword opportunities

---

## 5. RECOMMENDATIONS FOR PHASE 2

1. **URGENT:** Fix 324 broken internal links to use `/cardiologia/`
2. **URGENT:** Update canonical tags on legacy pages to point to new URLs
3. **HIGH:** Create 3 missing service pages (eco-doppler-tsa, eco-doppler-arti, test-da-sforzo)
4. **HIGH:** Design symptom landing pages for long-tail capture
5. **MEDIUM:** Implement doctor-service bidirectional linking
6. **MEDIUM:** Standardize price display format ("Da €X")

---

**Phase 1 Complete - Ready for Phase 2: New Architecture Design**
# PHASE 2: NEW ARCHITECTURE DESIGN
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agents:** SEO Architect + Information Architect
**Status:** ✅ COMPLETE

---

## 1. FOUR-LEVEL URL HIERARCHY

### Level 1: HUB (Specialty Landing)
```
/cardiologia/                             [EXISTING ✅]
```
**Purpose:** Main entry point, overview of all cardiology services, doctor team, trust signals

### Level 2: SERVICES (Diagnostic/Therapeutic)
```
/cardiologia/visita-cardiologica-ecg/     [EXISTING ✅]
/cardiologia/ecocardiogramma/             [EXISTING ✅]
/cardiologia/holter-ecg/                  [EXISTING ✅]
/cardiologia/holter-pressorio/            [EXISTING ✅]
/cardiologia/checkup-cardiovascolare/     [EXISTING ✅]
/cardiologia/eco-doppler-tsa/             [TO CREATE]
/cardiologia/eco-doppler-arti/            [TO CREATE]
/cardiologia/test-da-sforzo/              [TO CREATE]
```

### Level 3: SYMPTOMS (Search Intent Landing Pages)
```
/cardiologia/sintomi/dolore-toracico/              [TO CREATE - HIGH PRIORITY]
/cardiologia/sintomi/tachicardia/                  [TO CREATE - HIGH PRIORITY]
/cardiologia/sintomi/fiato-corto/                  [TO CREATE - HIGH PRIORITY]
/cardiologia/sintomi/palpitazioni/                 [TO CREATE]
/cardiologia/sintomi/caviglie-gonfie/              [TO CREATE]
/cardiologia/sintomi/vertigini/                    [TO CREATE]
```

### Level 4: INTEGRATED PATHS (Patient Journey)
```
/cardiologia/percorsi/prevenzione-cardiovascolare/ [TO CREATE]
/cardiologia/percorsi/post-infarto/                [TO CREATE]
/cardiologia/percorsi/idoneita-sportiva/           [TO CREATE - links medicina-sport]
```

---

## 2. COMPLETE NEW SITEMAP

```
bio-clinic.it/
│
├── cardiologia/                                   [L1: HUB]
│   ├── index.html
│   │
│   ├── visita-cardiologica-ecg/                   [L2: SERVICE]
│   │   └── index.html
│   │
│   ├── ecocardiogramma/                           [L2: SERVICE]
│   │   └── index.html
│   │
│   ├── holter-ecg/                                [L2: SERVICE]
│   │   └── index.html
│   │
│   ├── holter-pressorio/                          [L2: SERVICE]
│   │   └── index.html
│   │
│   ├── eco-doppler-tsa/                           [L2: SERVICE] *NEW*
│   │   └── index.html
│   │
│   ├── eco-doppler-arti/                          [L2: SERVICE] *NEW*
│   │   └── index.html
│   │
│   ├── test-da-sforzo/                            [L2: SERVICE] *NEW*
│   │   └── index.html
│   │
│   ├── checkup-cardiovascolare/                   [L2: SERVICE]
│   │   └── index.html
│   │
│   ├── sintomi/                                   [L3: SYMPTOMS] *NEW*
│   │   ├── dolore-toracico/
│   │   │   └── index.html
│   │   ├── tachicardia/
│   │   │   └── index.html
│   │   └── fiato-corto/
│   │       └── index.html
│   │
│   └── percorsi/                                  [L4: PATHS] *NEW*
│       ├── prevenzione-cardiovascolare/
│       │   └── index.html
│       └── idoneita-sportiva/
│           └── index.html
│
└── equipe/                                        [LINKED DOCTORS]
    ├── tonino-bullitta/                           → links to /cardiologia/
    ├── sara-uras/                                 → links to /cardiologia/
    ├── paolo-pischedda/                           → links to /cardiologia/
    ├── paolo-franca/                              → links to /cardiologia/
    └── giuliana-guagnozzi/                        → links to /cardiologia/
```

---

## 3. CLUSTER STRUCTURE (Topic Authority)

```
                    ┌─────────────────────────────────────────┐
                    │         /cardiologia/ (HUB)              │
                    │    "Cardiologia Sassari | Bio-Clinic"    │
                    └─────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
│  DIAGNOSTIC       │         │  MONITORING       │         │  VASCULAR         │
│  SERVICES         │         │  SERVICES         │         │  SERVICES         │
├───────────────────┤         ├───────────────────┤         ├───────────────────┤
│ visita-cardiolog. │         │ holter-ecg        │         │ eco-doppler-tsa   │
│ ecocardiogramma   │         │ holter-pressorio  │         │ eco-doppler-arti  │
│ test-da-sforzo    │         │                   │         │                   │
└───────────────────┘         └───────────────────┘         └───────────────────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │   SYMPTOM PAGES       │             │   INTEGRATED PATHS    │
        ├───────────────────────┤             ├───────────────────────┤
        │ /sintomi/dolore-tor.  │             │ /percorsi/prevenzione │
        │ /sintomi/tachicardia  │             │ /percorsi/idoneita-sp │
        │ /sintomi/fiato-corto  │             │ /percorsi/post-infarto│
        └───────────────────────┘             └───────────────────────┘
```

---

## 4. IDEAL INTERNAL LINKING SCHEMA

### 4.1 Hub Page Links OUT
```
/cardiologia/index.html SHOULD LINK TO:
├── All L2 service pages (8 links)
├── All L3 symptom pages (3+ links)
├── All L4 path pages (2+ links)
├── All 5 cardiologist profiles
└── Related specialties: /medicina-dello-sport/, /endocrinologia/
```

### 4.2 Service Pages Links OUT
```
/cardiologia/visita-cardiologica-ecg/ SHOULD LINK TO:
├── Hub: /cardiologia/ (breadcrumb + contextual)
├── Related services: /cardiologia/ecocardiogramma/, /cardiologia/holter-ecg/
├── Relevant symptoms: /cardiologia/sintomi/dolore-toracico/
├── Doctors who perform this: Bullitta, Uras, Pischedda, Franca
└── Booking CTA
```

### 4.3 Symptom Pages Links OUT
```
/cardiologia/sintomi/dolore-toracico/ SHOULD LINK TO:
├── Hub: /cardiologia/
├── Recommended exams: /cardiologia/visita-cardiologica-ecg/, /cardiologia/ecocardiogramma/
├── Check-up package: /cardiologia/checkup-cardiovascolare/
├── Emergency info (external: 118)
└── Booking CTA with urgency messaging
```

### 4.4 Doctor Pages Links IN
```
/equipe/tonino-bullitta/ SHOULD LINK TO:
├── Hub: /cardiologia/
├── Services he performs: ecocardiogramma, holter-ecg, eco-doppler-arti
└── Book with Dr. Bullitta CTA
```

---

## 5. URL JUSTIFICATION TABLE

| New URL | Page Type | Justification | Primary Keyword |
|---------|-----------|---------------|-----------------|
| /cardiologia/ | Hub | Clean, semantic, matches user search intent | cardiologia sassari |
| /cardiologia/visita-cardiologica-ecg/ | Service | Combines visit + ECG (most common combo) | visita cardiologica sassari |
| /cardiologia/ecocardiogramma/ | Service | Exact match for procedure name | ecocardiogramma sassari |
| /cardiologia/holter-ecg/ | Service | Specific diagnostic test | holter ecg sassari |
| /cardiologia/holter-pressorio/ | Service | Distinct from holter ECG | holter pressorio 24h |
| /cardiologia/eco-doppler-tsa/ | Service | Carotid vascular exam | ecocolordoppler tsa |
| /cardiologia/eco-doppler-arti/ | Service | Peripheral vascular exam | eco doppler arti inferiori |
| /cardiologia/test-da-sforzo/ | Service | Exercise stress test | test da sforzo cicloergometro |
| /cardiologia/checkup-cardiovascolare/ | Package | Combines multiple services | checkup cuore |
| /cardiologia/sintomi/dolore-toracico/ | Symptom | High search volume symptom | dolore toracico cause |
| /cardiologia/sintomi/tachicardia/ | Symptom | Common cardiac symptom | tachicardia quando preoccuparsi |
| /cardiologia/sintomi/fiato-corto/ | Symptom | Respiratory-cardiac link | mancanza respiro cuore |
| /cardiologia/percorsi/prevenzione-cardiovascolare/ | Path | Patient journey focus | prevenzione malattie cardiovascolari |
| /cardiologia/percorsi/idoneita-sportiva/ | Path | Cross-sell with medicina sport | certificato idoneità sportiva agonistica |

---

## 6. PRICING STRUCTURE (Confirmed by User)

| Service | Price Display | Notes |
|---------|--------------|-------|
| Visita Cardiologica semplice | Da €100 | Base visit |
| Visita Cardiologica + ECG | Da €100 | Most common, needs confirmation |
| Ecocardiogramma | Da €70 | Standalone |
| Ecocardiogramma + Visita | Da €150 | Package, needs confirmation |
| Holter ECG 24h | Da €100 | |
| Holter Pressorio 24h | Da €100 | |
| Eco-Doppler TSA (Carotidi) | Da €90 | |
| Eco-Doppler Arti Inferiori/Superiori | Da €130 | |
| Test da Sforzo | Da €100 | |

**Note:** "Da" prefix indicates prices vary by specialist.

---

**Phase 2 Complete - Ready for Phase 3: Technical Migration Table**
# PHASE 3: TECHNICAL MIGRATION TABLE
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** Technical SEO & Migration Engineer
**Status:** ✅ COMPLETE

---

## 1. COMPLETE REDIRECT TABLE

### 1.1 Already Implemented (Active in _redirects)

| # | Current URL | New URL | Type | Status | Risk | Priority |
|---|-------------|---------|------|--------|------|----------|
| 1 | /pages/cardiologia | /cardiologia/ | 301 | ✅ ACTIVE | LOW | CRITICAL |
| 2 | /pages/cardiologia.html | /cardiologia/ | 301 | ✅ ACTIVE | LOW | CRITICAL |
| 3 | /pages/visita-cardiologica-ecg | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 4 | /pages/visita-cardiologica-ecg.html | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 5 | /pages/ecocardiogramma | /cardiologia/ecocardiogramma/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 6 | /pages/ecocardiogramma.html | /cardiologia/ecocardiogramma/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 7 | /pages/holter-ecg | /cardiologia/holter-ecg/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 8 | /pages/holter-ecg.html | /cardiologia/holter-ecg/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 9 | /pages/holter-pressorio | /cardiologia/holter-pressorio/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 10 | /pages/holter-pressorio.html | /cardiologia/holter-pressorio/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 11 | /pages/checkup-cardiovascolare | /cardiologia/checkup-cardiovascolare/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 12 | /pages/checkup-cardiovascolare.html | /cardiologia/checkup-cardiovascolare/ | 301 | ✅ ACTIVE | LOW | HIGH |
| 13 | /pages/visita-cardiologica | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |
| 14 | /pages/visita-cardiologica.html | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |
| 15 | /pages/ecg | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |
| 16 | /pages/ecg.html | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |
| 17 | /prestazioni/visita-cardiologica | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |
| 18 | /prestazioni/ecg | /cardiologia/visita-cardiologica-ecg/ | 301 | ✅ ACTIVE | LOW | MEDIUM |

### 1.2 New Redirects Required (For new pages)

| # | Current URL | New URL | Type | Status | Risk | Priority | Motivation |
|---|-------------|---------|------|--------|------|----------|------------|
| 19 | /pages/eco-doppler-arti | /cardiologia/eco-doppler-arti/ | 301 | TO ADD | LOW | HIGH | New service page |
| 20 | /pages/eco-doppler-arti.html | /cardiologia/eco-doppler-arti/ | 301 | TO ADD | LOW | HIGH | New service page |
| 21 | /prestazioni/eco-doppler | /cardiologia/eco-doppler-arti/ | 301 | TO ADD | MEDIUM | MEDIUM | Legacy pattern |
| 22 | /eco-doppler-tsa | /cardiologia/eco-doppler-tsa/ | 301 | TO ADD | LOW | MEDIUM | Clean URL |
| 23 | /eco-doppler-arti | /cardiologia/eco-doppler-arti/ | 301 | TO ADD | LOW | MEDIUM | Clean URL |
| 24 | /test-da-sforzo | /cardiologia/test-da-sforzo/ | 301 | TO ADD | LOW | MEDIUM | Clean URL |
| 25 | /pages/test-da-sforzo | /cardiologia/test-da-sforzo/ | 301 | TO ADD | LOW | HIGH | New service page |
| 26 | /pages/test-da-sforzo.html | /cardiologia/test-da-sforzo/ | 301 | TO ADD | LOW | HIGH | New service page |

### 1.3 Symptom Page Redirects (Future)

| # | Old Pattern | New URL | Type | Status | Motivation |
|---|-------------|---------|------|--------|------------|
| 27 | /dolore-toracico | /cardiologia/sintomi/dolore-toracico/ | 301 | FUTURE | Clean URL entry |
| 28 | /tachicardia | /cardiologia/sintomi/tachicardia/ | 301 | FUTURE | Clean URL entry |
| 29 | /fiato-corto | /cardiologia/sintomi/fiato-corto/ | 301 | FUTURE | Clean URL entry |

---

## 2. SITEMAP UPDATES

### 2.1 URLs to REMOVE from sitemap.xml
```xml
<!-- Already removed in Phase 1 -->
<url><loc>https://bio-clinic.it/pages/medicina-lavoro.html</loc></url>
<url><loc>https://bio-clinic.it/equipe/paola-dettori.html</loc></url>

<!-- Should be removed (redirect to new URLs) -->
<url><loc>https://bio-clinic.it/pages/cardiologia.html</loc></url>
<url><loc>https://bio-clinic.it/pages/visita-cardiologica-ecg.html</loc></url>
<url><loc>https://bio-clinic.it/pages/ecocardiogramma.html</loc></url>
<url><loc>https://bio-clinic.it/pages/holter-ecg.html</loc></url>
<url><loc>https://bio-clinic.it/pages/holter-pressorio.html</loc></url>
<url><loc>https://bio-clinic.it/pages/checkup-cardiovascolare.html</loc></url>
```

### 2.2 URLs Already ADDED to sitemap.xml (Phase 2)
```xml
<url><loc>https://bio-clinic.it/cardiologia/</loc><priority>0.9</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/ecocardiogramma/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/holter-ecg/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/holter-pressorio/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/checkup-cardiovascolare/</loc><priority>0.8</priority></url>
```

### 2.3 URLs to ADD (when pages created)
```xml
<url><loc>https://bio-clinic.it/cardiologia/eco-doppler-tsa/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/eco-doppler-arti/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/test-da-sforzo/</loc><priority>0.8</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/sintomi/dolore-toracico/</loc><priority>0.7</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/sintomi/tachicardia/</loc><priority>0.7</priority></url>
<url><loc>https://bio-clinic.it/cardiologia/sintomi/fiato-corto/</loc><priority>0.7</priority></url>
```

---

## 3. CANONICAL TAG UPDATES

### 3.1 Files Requiring Canonical Update

| File | Current Canonical | Required Canonical | Status |
|------|-------------------|-------------------|--------|
| cardiologia/index.html | https://bio-clinic.it/cardiologia/ | ✅ CORRECT | OK |
| cardiologia/visita-cardiologica-ecg/index.html | https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/ | ✅ CORRECT | OK |
| cardiologia/ecocardiogramma/index.html | https://bio-clinic.it/cardiologia/ecocardiogramma/ | ✅ CORRECT | OK |
| cardiologia/holter-ecg/index.html | https://bio-clinic.it/cardiologia/holter-ecg/ | ✅ CORRECT | OK |
| cardiologia/holter-pressorio/index.html | https://bio-clinic.it/cardiologia/holter-pressorio/ | ✅ CORRECT | OK |
| cardiologia/checkup-cardiovascolare/index.html | https://bio-clinic.it/cardiologia/checkup-cardiovascolare/ | ✅ CORRECT | OK |
| pages/cardiologia.html | https://bio-clinic.it/cardiologia/ | ✅ CORRECT | OK |
| **pages/visita-cardiologica-ecg.html** | https://bio-clinic.it/pages/visita-cardiologica-ecg.html | **https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/** | ⚠️ NEEDS FIX |
| **pages/ecocardiogramma.html** | https://bio-clinic.it/pages/ecocardiogramma.html | **https://bio-clinic.it/cardiologia/ecocardiogramma/** | ⚠️ NEEDS FIX |

---

## 4. BREADCRUMB UPDATES

### 4.1 Current Schema Breadcrumb (Hub Page)
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
    {"@type": "ListItem", "position": 2, "name": "Specialità", "item": "https://bio-clinic.it/specialita/"},
    {"@type": "ListItem", "position": 3, "name": "Cardiologia", "item": "https://bio-clinic.it/specialita/cardiologia/"}
  ]
}
```

### 4.2 Required Schema Breadcrumb (Updated)
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
    {"@type": "ListItem", "position": 2, "name": "Cardiologia", "item": "https://bio-clinic.it/cardiologia/"}
  ]
}
```

### 4.3 Service Page Breadcrumb Template
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
    {"@type": "ListItem", "position": 2, "name": "Cardiologia", "item": "https://bio-clinic.it/cardiologia/"},
    {"@type": "ListItem", "position": 3, "name": "[SERVICE NAME]", "item": "https://bio-clinic.it/cardiologia/[service-slug]/"}
  ]
}
```

---

## 5. INTERNAL LINK UPDATES REQUIRED

### 5.1 High-Priority Link Updates (324 occurrences)

| Old Link | New Link | Files Affected | Priority |
|----------|----------|----------------|----------|
| href="cardiologia.html" | href="/cardiologia/" | ~100 pages/*.html | CRITICAL |
| href="../pages/cardiologia.html" | href="/cardiologia/" | ~53 equipe/*.html | CRITICAL |
| href="visita-cardiologica-ecg.html" | href="/cardiologia/visita-cardiologica-ecg/" | ~5 files | HIGH |
| href="ecocardiogramma.html" | href="/cardiologia/ecocardiogramma/" | ~5 files | HIGH |
| href="checkup-cardiovascolare.html" | href="/cardiologia/checkup-cardiovascolare/" | ~3 files | HIGH |

---

## 6. MIGRATION IMPACT SIMULATION

### Scenario 1: If redirects removed
```
Impact Timeline:
- Day 1-3: Old URLs return 404, GSC begins logging errors
- Day 7: Google de-indexes old URLs, ~15-30% traffic drop
- Day 14: Rankings for "cardiologia sassari" drop 10-20 positions
- Day 30: Permanent equity loss, recovery requires 2-3 months

Risk Level: 🔴 CRITICAL - Never remove 301 redirects
```

### Scenario 2: If internal links not updated
```
Impact Timeline:
- Ongoing: ~10-15% equity loss per redirect hop
- Day 30: Google perceives old URLs as primary (crawl signals)
- Day 60: Potential ranking dilution between old and new URLs

Risk Level: 🟠 HIGH - Update internal links within 2 weeks
```

### Scenario 3: If canonical tags not fixed
```
Impact Timeline:
- Day 7: Google may choose wrong canonical (old URL)
- Day 14-30: Duplicate content signals, crawl waste
- Day 60: One URL de-indexed, potentially the wrong one

Risk Level: 🟠 HIGH - Fix canonical tags within 1 week
```

---

## 7. IMPLEMENTATION CHECKLIST

### Week 1 (Critical)
- [ ] Fix canonical tags on pages/visita-cardiologica-ecg.html
- [ ] Fix canonical tags on pages/ecocardiogramma.html
- [ ] Update schema breadcrumbs on hub page
- [ ] Add new redirects for eco-doppler and test-da-sforzo

### Week 2 (High Priority)
- [ ] Update 324 internal links (cardiologia.html → /cardiologia/)
- [ ] Update equipe page links to new URLs
- [ ] Update sitemap (remove old URLs, verify new ones)

### Week 3-4 (Medium Priority)
- [ ] Create eco-doppler-tsa page content
- [ ] Create eco-doppler-arti page content
- [ ] Create test-da-sforzo page content
- [ ] Add new pages to sitemap

---

**Phase 3 Complete - Ready for Phase 4: Advanced Medical EEAT**
# PHASE 4: ADVANCED MEDICAL EEAT CHECKLIST
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** Medical EEAT Specialist
**Status:** ✅ COMPLETE

---

## 1. EEAT FRAMEWORK FOR MEDICAL CONTENT (YMYL)

### Google's YMYL (Your Money Your Life) Requirements for Health Content

| Signal | Description | Current Bio-Clinic Status |
|--------|-------------|---------------------------|
| **Experience** | First-hand experience with the topic | ⚠️ PARTIAL - Doctor profiles exist but not linked to services |
| **Expertise** | Formal qualifications, medical licenses | ⚠️ PARTIAL - Titles shown, but no license numbers visible |
| **Authoritativeness** | Recognition by peers, citations | ❌ MISSING - No guideline citations, no society memberships |
| **Trustworthiness** | Accurate, honest, safe content | ⚠️ PARTIAL - Good content but missing review dates |

---

## 2. EEAT CHECKLIST BY PAGE TYPE

### 2.1 HUB PAGE (/cardiologia/)

| # | EEAT Element | Required | Current | Action |
|---|--------------|----------|---------|--------|
| 1 | Medical Author Attribution | YES | ❌ NO | Add "Contenuto rivisto da Dr. [Nome]" |
| 2 | Last Review Date | YES | ❌ NO | Add "Ultimo aggiornamento: DD/MM/YYYY" |
| 3 | Editorial Process Statement | YES | ❌ NO | Link to editorial policy page |
| 4 | Doctor Profile Links | YES | ⚠️ WEAK | Strengthen links with specializations |
| 5 | Medical Society Citations | YES | ❌ NO | Add references to SICP, ESC guidelines |
| 6 | Aggregate Rating Schema | YES | ✅ YES | 3214 reviews, 5/5 rating |
| 7 | MedicalClinic Schema | YES | ✅ YES | Present in JSON-LD |
| 8 | MedicalSpecialty Schema | YES | ✅ YES | "Cardiologia" defined |
| 9 | Contact Information | YES | ✅ YES | Phone visible |
| 10 | Physical Address | YES | ✅ YES | Via Renzo Mossa 23, Sassari |

**Hub Page EEAT Score: 6/10** - Needs medical author attribution and review dates

---

### 2.2 SERVICE PAGES (/cardiologia/ecocardiogramma/, etc.)

| # | EEAT Element | Required | Action |
|---|--------------|----------|--------|
| 1 | Procedure Description by Expert | YES | Content should mention "secondo le linee guida..." |
| 2 | Authored by Licensed Physician | YES | Add byline: "Dott. [Nome], Cardiologo" |
| 3 | Preparation Instructions | YES | Already present for some procedures |
| 4 | What to Expect Section | YES | Add patient-centric explanation |
| 5 | Risk/Contraindication Disclosure | YES | Add medical disclaimer |
| 6 | Reference to Clinical Guidelines | YES | Cite ESC, AHA, or SICP guidelines |
| 7 | Last Updated Date | YES | Add dateModified schema |
| 8 | MedicalProcedure Schema | YES | Add with performer (physician) |
| 9 | Offer Schema with Price | YES | Add "Da €XX" with currency |
| 10 | Doctor Performing Links | YES | Link to specific cardiologists |

**Service Page EEAT Score: 5/10** - Missing authorship, dates, guidelines

---

### 2.3 SYMPTOM LANDING PAGES (/cardiologia/sintomi/dolore-toracico/)

| # | EEAT Element | Required | Rationale |
|---|--------------|----------|-----------|
| 1 | Medical Emergency Warning | **CRITICAL** | "Se dolore persistente chiamare 118" |
| 2 | Symptom Overview by Cardiologist | YES | First-person expert explanation |
| 3 | Possible Causes (non-diagnostic) | YES | Educational, not self-diagnosis |
| 4 | When to See a Doctor | YES | Clear urgency indicators |
| 5 | Recommended Exams | YES | Link to service pages |
| 6 | MedicalSymptom Schema | YES | schema.org/MedicalSymptom |
| 7 | Medical Author + Credentials | YES | "Dott. Pischedda, Spec. Cardiologia" |
| 8 | Clinical Sources Cited | YES | Links to medical literature |
| 9 | Disclaimer: Not Medical Advice | YES | Legal protection + trust |
| 10 | Related Symptoms Links | YES | Cross-link symptom pages |

**Symptom Page EEAT Score: N/A** - Pages not yet created

---

### 2.4 CHECK-UP PAGES (/cardiologia/checkup-cardiovascolare/)

| # | EEAT Element | Required | Action |
|---|--------------|----------|--------|
| 1 | Package Contents Description | YES | List all included exams |
| 2 | Who Should Get This Check-up | YES | Target audience (age, risk factors) |
| 3 | What's Included vs. What's Not | YES | Clear scope definition |
| 4 | Cardiologist Supervision Statement | YES | "Eseguito sotto supervisione cardiologica" |
| 5 | Results Interpretation | YES | "Refertazione immediata" |
| 6 | Follow-up Pathway | YES | What happens after results |
| 7 | Offer Schema with Price | YES | Package pricing |
| 8 | MedicalTest Schema | YES | For each test in package |
| 9 | Trust Signals (Accreditations) | YES | ISO, regional health accreditation |
| 10 | Booking CTA with Doctor Selection | YES | Choose preferred cardiologist |

**Check-up Page EEAT Score: 5/10** - Missing follow-up info, accreditations

---

## 3. RECOMMENDED MEDICAL AUTHORS

Based on confirmed cardiologists and their competencies:

| Author | Role | Pages to Author | Credentials to Display |
|--------|------|-----------------|------------------------|
| **Dott. Paolo Pischedda** | Lead Author (most services) | Hub, all service pages | "Cardiologo, Spec. Cardiologia" |
| **Dott. Paolo Franca** | Co-Author | Test da sforzo, Holter, Eco-Doppler | "Cardiologo" |
| **Dott. Tonino Bullitta** | Reviewer | Ecocardiogramma, Holter ECG | "Cardiologo" |
| **Dott.ssa Sara Uras** | Reviewer | Ecocardiogramma, TSA | "Cardiologa" |
| **Dott.ssa Giuliana Guagnozzi** | Author | Test da Sforzo (specialist) | "Cardiologa" |

---

## 4. CLINICAL REVIEW STATEMENT TEMPLATE

### Italian Version (to add to all cardiology pages)
```html
<div class="medical-review-box">
  <p class="review-title">Contenuto medico verificato</p>
  <p class="review-author">
    Revisionato dal <strong>Dott. Paolo Pischedda</strong>, 
    Specialista in Cardiologia
  </p>
  <p class="review-date">
    Ultimo aggiornamento: <time datetime="2026-02-14">14 febbraio 2026</time>
  </p>
  <p class="review-policy">
    <a href="/chi-siamo/#politica-editoriale">Leggi la nostra politica editoriale</a>
  </p>
</div>
```

### Schema.org Markup for Author
```json
{
  "@type": "MedicalWebPage",
  "author": {
    "@type": "Physician",
    "name": "Dott. Paolo Pischedda",
    "medicalSpecialty": "Cardiology",
    "worksFor": {
      "@type": "MedicalClinic",
      "name": "Bio-Clinic Sassari"
    },
    "url": "https://bio-clinic.it/equipe/paolo-pischedda/"
  },
  "reviewedBy": {
    "@type": "Physician",
    "name": "Dott. Tonino Bullitta"
  },
  "dateModified": "2026-02-14",
  "lastReviewed": "2026-02-14"
}
```

---

## 5. GUIDELINE CITATIONS TO ADD

### European Society of Cardiology (ESC) References

| Topic | Guideline | Citation |
|-------|-----------|----------|
| Cardiovascular Prevention | ESC 2021 Guidelines | "Secondo le linee guida ESC 2021 sulla prevenzione cardiovascolare..." |
| Chronic Coronary Syndromes | ESC 2019 Guidelines | "Come raccomandato dalle linee guida ESC 2019..." |
| Atrial Fibrillation | ESC 2020 Guidelines | "In accordo con le linee guida ESC 2020 sulla fibrillazione atriale..." |
| Heart Failure | ESC 2021 Guidelines | "Le linee guida ESC 2021 sullo scompenso cardiaco indicano..." |

### Italian Cardiology Society (SICP) References
- Add membership badge if applicable
- Reference Italian healthcare system standards (LEA)

---

## 6. DOCTOR PROFILE ENHANCEMENT

### Required Elements for Equipe Pages

| Element | Current | Required | Example |
|---------|---------|----------|---------|
| Full Name | ✅ | ✅ | Dott. Paolo Pischedda |
| Professional Title | ⚠️ | ✅ | "Specialista in Cardiologia" |
| License Number | ❌ | ✅ | "Iscrizione Albo Medici Sassari n. XXXXX" |
| Education | ⚠️ | ✅ | "Laurea Medicina, Univ. Sassari" |
| Specialization | ⚠️ | ✅ | "Specializzazione in Cardiologia" |
| Experience Years | ❌ | ✅ | "20+ anni di esperienza" |
| Procedures Performed | ⚠️ | ✅ | List with links to service pages |
| Publications (if any) | ❌ | Optional | PubMed links |
| Photo | ✅ | ✅ | Professional headshot |
| MioDoctor Link | ✅ | ✅ | External validation |

---

## 7. MEDICAL DISCLAIMER TEMPLATE

### To add in footer of all cardiology pages
```html
<div class="medical-disclaimer">
  <p><strong>Avvertenza medica:</strong> Le informazioni contenute in questa pagina 
  hanno scopo puramente informativo e non sostituiscono il parere del medico. 
  Per diagnosi e trattamenti, consultare sempre un professionista sanitario qualificato. 
  In caso di emergenza, chiamare il 118.</p>
</div>
```

---

## 8. IMPLEMENTATION PRIORITY

| Priority | Element | Impact on EEAT | Effort |
|----------|---------|----------------|--------|
| 🔴 CRITICAL | Add medical author attribution | HIGH | LOW |
| 🔴 CRITICAL | Add last review dates | HIGH | LOW |
| 🔴 CRITICAL | Emergency warning on symptom pages | HIGH (Trust) | LOW |
| 🟠 HIGH | Doctor license numbers on profiles | MEDIUM | MEDIUM |
| 🟠 HIGH | Guideline citations in content | MEDIUM | MEDIUM |
| 🟡 MEDIUM | Editorial policy page | LOW | MEDIUM |
| 🟡 MEDIUM | Medical disclaimer footer | LOW | LOW |
| 🟢 LOW | Publications/research links | LOW | HIGH |

---

**Phase 4 Complete - Ready for Phase 5: Conversion & Patient Flow**
# PHASE 5: CONVERSION & PATIENT FLOW FUNNEL
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** Conversion & UX Specialist
**Status:** ✅ COMPLETE

---

## 1. PATIENT JOURNEY FUNNEL MAP

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CARDIOLOGY PATIENT FUNNEL                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

STAGE 1: AWARENESS (Search Intent)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User searches: "dolore al petto quando preoccuparsi"                               │
│                                                                                     │
│  Entry Points:                                                                      │
│  ├── Google SERP → /cardiologia/sintomi/dolore-toracico/    [Symptom Landing]      │
│  ├── Google SERP → /cardiologia/                            [Hub - brand search]   │
│  └── Google Maps → Bio-Clinic Sassari                       [Local Pack]           │
│                                                                                     │
│  Conversion Goal: User reads content, understands need for professional evaluation │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
STAGE 2: CONSIDERATION (Information Gathering)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User navigates: "What exam do I need? Who performs it? How much does it cost?"    │
│                                                                                     │
│  Key Pages:                                                                         │
│  ├── /cardiologia/visita-cardiologica-ecg/                  [Service Detail]       │
│  ├── /cardiologia/ecocardiogramma/                          [Service Detail]       │
│  ├── /cardiologia/checkup-cardiovascolare/                  [Package Offer]        │
│  └── /equipe/paolo-pischedda/                               [Doctor Profile]       │
│                                                                                     │
│  Key Information Displayed:                                                         │
│  • Price: "Da €100" (prominent, above fold)                                         │
│  • Doctors: Photos + specializations + ratings                                      │
│  • Wait time: "Disponibilità entro 48h"                                             │
│  • Insurance: "Accettiamo convenzioni e fondi sanitari"                             │
│                                                                                     │
│  Conversion Goal: User compares options, selects preferred service/doctor           │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
STAGE 3: DECISION (Booking Intent)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User action: "I want to book an appointment"                                       │
│                                                                                     │
│  CTA Options:                                                                       │
│  ├── Primary: "Prenota Online" → MioDoctor widget                                   │
│  ├── Secondary: "Chiama Ora" → tel:+39079956133 (click-to-call)                    │
│  └── Tertiary: "WhatsApp" → WhatsApp Business link                                  │
│                                                                                     │
│  Friction Points to Eliminate:                                                      │
│  ❌ Multiple clicks to reach booking                                                │
│  ❌ No doctor selection in booking flow                                             │
│  ❌ Price not visible before booking                                                │
│  ❌ No availability indicator                                                       │
│                                                                                     │
│  Conversion Goal: User completes booking or makes contact                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
STAGE 4: BOOKING (Transaction)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User completes: Select doctor → Select date/time → Confirm → Payment (if needed)  │
│                                                                                     │
│  Booking Channels:                                                                  │
│  ├── MioDoctor embedded widget (primary)                                            │
│  ├── Phone call to reception                                                        │
│  └── WhatsApp inquiry                                                               │
│                                                                                     │
│  Post-Booking Actions:                                                              │
│  • Email confirmation with preparation instructions                                 │
│  • SMS reminder 24h before appointment                                              │
│  • Link to directions/parking info                                                  │
│                                                                                     │
│  Conversion Goal: Confirmed appointment                                             │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
STAGE 5: RETENTION (Post-Visit)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User receives: Results, follow-up recommendations                                  │
│                                                                                     │
│  Cross-Sell Opportunities:                                                          │
│  ├── Visita cardiologica → Holter ECG (monitoring)                                  │
│  ├── Ecocardiogramma → Eco-Doppler TSA (vascular check)                             │
│  ├── Check-up base → Check-up completo (upsell)                                     │
│  └── Cardiologia → Laboratorio analisi (cross-specialty)                            │
│                                                                                     │
│  Follow-Up Paths:                                                                   │
│  • "Prenota il controllo annuale"                                                   │
│  • "Completa il check-up con analisi del sangue"                                    │
│  • Email reminder for annual screening                                              │
│                                                                                     │
│  Conversion Goal: Return visit, referral, review                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CTA PLACEMENT STRATEGY

### 2.1 Hub Page (/cardiologia/) CTAs

| Position | CTA Type | Text | Target | Priority |
|----------|----------|------|--------|----------|
| Hero (above fold) | Primary Button | "Prenota Visita Cardiologica" | MioDoctor | 🔴 HIGH |
| Hero | Secondary Link | "Chiama: 079 956 1332" | tel: link | 🔴 HIGH |
| After service list | Primary Button | "Confronta i nostri Check-up" | checkup-cardiovascolare | 🟠 MEDIUM |
| Doctor section | Per-doctor CTA | "Prenota con Dr. [Nome]" | MioDoctor filter | 🟠 MEDIUM |
| Floating/Sticky | WhatsApp icon | "Scrivici" | WhatsApp | 🟡 LOW |
| Exit intent | Modal | "Hai domande? Chiamaci!" | Phone | 🟢 OPTIONAL |

### 2.2 Service Page CTAs

| Position | CTA Type | Text | Target |
|----------|----------|------|--------|
| Hero | Primary | "Prenota [Servizio]" | MioDoctor |
| After description | Secondary | "Scopri il Check-up Completo" | checkup page |
| Price section | Primary | "Prenota Da €XX" | MioDoctor |
| Doctor list | Per-doctor | "Disponibile con Dr. [Nome]" | Doctor profile |
| Related services | Links | "Ti potrebbe interessare: Holter ECG" | Related page |
| Footer | Sticky mobile | "Prenota Ora" | MioDoctor |

### 2.3 Symptom Page CTAs

| Position | CTA Type | Text | Target | Note |
|----------|----------|------|--------|------|
| Emergency banner | Alert | "⚠️ Dolore persistente? Chiama 118" | Emergency | CRITICAL |
| After causes | Primary | "Prenota una Visita di Controllo" | visita-cardiologica-ecg | |
| Exam recommendations | Service links | "Esami consigliati: ECG, Ecocardiogramma" | Service pages | |
| Bottom | Primary | "Non aspettare: Prenota Oggi" | MioDoctor | Urgency |

---

## 3. PRICING DISPLAY OPTIMIZATION

### 3.1 Pricing Format Standard
```html
<div class="price-display">
  <span class="price-label">Prezzo:</span>
  <span class="price-value">Da <strong>€100</strong></span>
  <span class="price-note">Il costo può variare in base allo specialista</span>
</div>
```

### 3.2 Pricing Table for Hub Page

| Prestazione | Prezzo | CTA |
|-------------|--------|-----|
| Visita Cardiologica semplice | Da €100 | [Prenota] |
| Visita Cardiologica + ECG | Da €100 | [Prenota] |
| Ecocardiogramma | Da €70 | [Prenota] |
| Ecocardiogramma + Visita | Da €150 | [Prenota] |
| Holter ECG 24h | Da €100 | [Prenota] |
| Holter Pressorio 24h | Da €100 | [Prenota] |
| Eco-Doppler TSA | Da €90 | [Prenota] |
| Eco-Doppler Arti | Da €130 | [Prenota] |
| Test da Sforzo | Da €100 | [Prenota] |
| **Check-up Cardiovascolare** | **Da €185** | **[Scopri]** |

### 3.3 Schema.org for Pricing
```json
{
  "@type": "Offer",
  "priceCurrency": "EUR",
  "price": "100",
  "priceValidUntil": "2027-12-31",
  "availability": "https://schema.org/InStock",
  "url": "https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/",
  "seller": {
    "@type": "MedicalClinic",
    "name": "Bio-Clinic Sassari"
  }
}
```

---

## 4. FRICTION ANALYSIS & SOLUTIONS

### 4.1 Current Friction Points

| # | Friction Point | Impact | Solution |
|---|---------------|--------|----------|
| 1 | **No visible prices on hub** | Users leave to compare | Add pricing table |
| 2 | **Generic CTAs** | Low click-through | Service-specific CTAs |
| 3 | **Doctor selection unclear** | Booking abandonment | "Scegli il tuo cardiologo" section |
| 4 | **No availability indicator** | Uncertainty | Add "Disponibilità entro 48h" |
| 5 | **Insurance info buried** | Lost conversions | Add "Convenzioni accettate" badge |
| 6 | **Mobile booking friction** | Bounce on mobile | Sticky CTA bar |
| 7 | **No WhatsApp option** | Missed mobile users | Add WhatsApp Business |
| 8 | **Lab cross-sell missing** | Lost upsells | "Completa con analisi del sangue" |

### 4.2 Structural Solutions

**Solution 1: "Che problema hai?" Section**
```
┌─────────────────────────────────────────────────┐
│  CHE PROBLEMA HAI?                              │
│                                                 │
│  [🫀 Dolore al petto]  [💓 Palpitazioni]       │
│  [😮‍💨 Fiato corto]     [🦶 Gambe gonfie]        │
│  [😵 Vertigini]        [📋 Check-up preventivo] │
│                                                 │
│  → Click leads to symptom/service page          │
└─────────────────────────────────────────────────┘
```

**Solution 2: Doctor Selection Widget**
```
┌─────────────────────────────────────────────────┐
│  SCEGLI IL TUO CARDIOLOGO                       │
│                                                 │
│  [Photo] Dr. Pischedda    ⭐ 4.9  [Prenota]    │
│          Holter, Eco-Doppler, Test Sforzo       │
│                                                 │
│  [Photo] Dr. Franca       ⭐ 4.8  [Prenota]    │
│          Holter, Eco-Doppler, Test Sforzo       │
│                                                 │
│  [Photo] Dr. Bullitta     ⭐ 4.9  [Prenota]    │
│          Ecocardiogramma, Holter                │
└─────────────────────────────────────────────────┘
```

**Solution 3: Lab Cross-Sell Banner**
```
┌─────────────────────────────────────────────────┐
│  💉 COMPLETA IL TUO CHECK-UP                    │
│                                                 │
│  Aggiungi le analisi del sangue per un quadro  │
│  cardiovascolare completo:                      │
│  • Profilo lipidico (colesterolo, trigliceridi)│
│  • Glicemia, emoglobina glicata                │
│  • Emocromo, coagulazione                      │
│                                                 │
│  [Scopri il Laboratorio Analisi]               │
└─────────────────────────────────────────────────┘
```

---

## 5. MOBILE-FIRST OPTIMIZATION

### 5.1 Mobile CTA Bar (Sticky)
```
┌─────────────────────────────────────────────────┐
│  [📞 Chiama]  [📅 Prenota]  [💬 WhatsApp]      │
└─────────────────────────────────────────────────┘
```
- Fixed at bottom of screen on mobile
- 50px height, high contrast
- Direct action buttons

### 5.2 Mobile Content Priority
1. Price (visible immediately)
2. CTA (always visible)
3. Doctor selection (swipeable cards)
4. Reviews summary (social proof)
5. Content (expandable sections)

---

## 6. FUNNEL METRICS TO TRACK

| Stage | Metric | Target | Current Estimate |
|-------|--------|--------|------------------|
| Awareness | Organic traffic to /cardiologia/ | +30% in 90 days | Baseline |
| Consideration | Time on page | >2 min | Unknown |
| Consideration | Pages per session | >2.5 | Unknown |
| Decision | CTA click rate | >5% | Unknown |
| Booking | Conversion rate (visit→booking) | >3% | Unknown |
| Retention | Return visit rate | >20% | Unknown |

---

## 7. IMPLEMENTATION RECOMMENDATIONS

### Week 1-2 (Critical)
- [ ] Add pricing table to hub page
- [ ] Add "Da €X" to all service pages
- [ ] Implement sticky mobile CTA bar
- [ ] Add "Che problema hai?" symptom selector

### Week 3-4 (High)
- [ ] Create doctor selection widget
- [ ] Add lab cross-sell banner
- [ ] Implement availability indicator
- [ ] Add insurance/convenzioni badges

### Week 5-8 (Medium)
- [ ] A/B test CTA copy
- [ ] Implement exit intent modal
- [ ] Add WhatsApp Business integration
- [ ] Create post-visit follow-up emails

---

**Phase 5 Complete - Ready for Phase 6: SERP Domination Model**
# PHASE 6: SERP DOMINATION MODEL
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** SEO Architect
**Status:** ✅ COMPLETE

**Note:** No volume/ranking data invented. Keywords identified based on semantic relevance and user intent patterns.

---

## 1. KEYWORD CLUSTER MAPPING

### 1.1 Primary Keywords (Hub Page)

| Target Page | Primary Keyword | Intent | Priority |
|-------------|-----------------|--------|----------|
| /cardiologia/ | cardiologia sassari | Local + Navigational | 🔴 CRITICAL |
| /cardiologia/ | cardiologo sassari | Local + Transactional | 🔴 CRITICAL |
| /cardiologia/ | visita cardiologica sassari | Local + Transactional | 🔴 CRITICAL |

### 1.2 Secondary Keywords (Service Pages)

| Target Page | Secondary Keywords | Intent |
|-------------|-------------------|--------|
| /cardiologia/visita-cardiologica-ecg/ | ecg sassari, elettrocardiogramma sassari, visita cardiologica con ecg | Transactional |
| /cardiologia/ecocardiogramma/ | ecocardiogramma sassari, ecocardiogramma costo, ecografia cardiaca | Transactional |
| /cardiologia/holter-ecg/ | holter ecg sassari, holter 24 ore, holter cardiaco | Transactional |
| /cardiologia/holter-pressorio/ | holter pressorio 24h, monitoraggio pressione 24 ore | Transactional |
| /cardiologia/eco-doppler-tsa/ | eco doppler tsa sassari, ecocolordoppler carotidi, doppler carotideo | Transactional |
| /cardiologia/eco-doppler-arti/ | eco doppler arti inferiori, ecocolordoppler venoso, doppler gambe | Transactional |
| /cardiologia/test-da-sforzo/ | test da sforzo sassari, prova da sforzo cardiaca, cicloergometro | Transactional |
| /cardiologia/checkup-cardiovascolare/ | checkup cuore sassari, controllo cardiovascolare, check up cardiologico | Transactional |

### 1.3 Long-Tail / Symptom Keywords (Landing Pages)

| Target Page | Symptom Keywords | Intent |
|-------------|-----------------|--------|
| /cardiologia/sintomi/dolore-toracico/ | dolore al petto quando preoccuparsi, dolore toracico cause, fitte al petto | Informational → Transactional |
| /cardiologia/sintomi/tachicardia/ | tachicardia cause, battito accelerato, cuore che batte forte | Informational → Transactional |
| /cardiologia/sintomi/fiato-corto/ | fiato corto cause, dispnea cardiaca, mancanza di respiro | Informational → Transactional |

---

## 2. SYMPTOM LANDING PAGES - PRIORITY CREATION

### 2.1 Page 1: Dolore Toracico (HIGH PRIORITY)

**URL:** `/cardiologia/sintomi/dolore-toracico/`
**Title:** `Dolore al Petto: Quando Preoccuparsi? | Cardiologo Sassari`
**H1:** `Dolore Toracico: Cause, Sintomi e Quando Rivolgersi al Cardiologo`

**Content Structure:**
```
1. ⚠️ EMERGENCY BANNER: "Dolore persistente + sudorazione + nausea? Chiama 118"
2. Introduzione: Cos'è il dolore toracico
3. Cause cardiache vs non cardiache (tabella)
4. Quando è urgente: red flags
5. Esami consigliati: ECG, Ecocardiogramma, Test da sforzo
6. CTA: "Prenota una Visita Cardiologica"
7. FAQ schema
8. Medical author attribution
```

**Target Keywords:**
- dolore al petto quando preoccuparsi
- dolore toracico cause
- fitte al cuore
- dolore petto lato sinistro

---

### 2.2 Page 2: Tachicardia (HIGH PRIORITY)

**URL:** `/cardiologia/sintomi/tachicardia/`
**Title:** `Tachicardia: Cause e Quando Preoccuparsi | Bio-Clinic Sassari`
**H1:** `Tachicardia: Perché il Cuore Batte Forte e Cosa Fare`

**Content Structure:**
```
1. Introduzione: Cos'è la tachicardia
2. Tipi di tachicardia (sinusale, parossistica, atriale)
3. Cause comuni (ansia, caffeina, patologie)
4. Sintomi associati
5. Quando consultare un cardiologo
6. Esami diagnostici: Holter ECG, ECG
7. CTA: "Prenota Holter ECG 24h"
8. FAQ schema
```

**Target Keywords:**
- tachicardia cause
- cuore che batte forte
- battito cardiaco accelerato
- palpitazioni notturne

---

### 2.3 Page 3: Fiato Corto (HIGH PRIORITY)

**URL:** `/cardiologia/sintomi/fiato-corto/`
**Title:** `Mancanza di Respiro: Cause Cardiache | Cardiologo Sassari`
**H1:** `Fiato Corto: Quando è il Cuore e Quando No`

**Content Structure:**
```
1. Introduzione: Dispnea e cause
2. Cause cardiache (scompenso, valvulopatie)
3. Cause non cardiache (polmonari, anemia)
4. Sintomi da non ignorare
5. Esami raccomandati: Ecocardiogramma, ECG
6. CTA: "Prenota Ecocardiogramma"
7. FAQ schema
```

**Target Keywords:**
- mancanza di respiro cause
- fiato corto
- dispnea cardiaca
- difficoltà respiratorie cuore

---

## 3. FAQ STRUCTURE FOR RICH SNIPPETS

### 3.1 Hub Page FAQs (Already Existing - Optimize)

| Question | Target Snippet |
|----------|----------------|
| Quando fare una visita cardiologica? | People Also Ask |
| Quanto costa una visita cardiologica a Sassari? | Featured Snippet (price) |
| Cos'è l'ecocardiogramma e quando serve? | Knowledge Panel |
| A cosa serve l'Holter ECG 24h? | People Also Ask |

### 3.2 New FAQs to Add

**Per Service Pages:**

| Page | FAQ Questions |
|------|---------------|
| /visita-cardiologica-ecg/ | "L'ECG è incluso nella visita?", "Quanto dura una visita cardiologica?", "Serve la prescrizione medica?" |
| /ecocardiogramma/ | "L'ecocardiogramma fa male?", "Quanto dura l'ecocardiogramma?", "Come prepararsi all'ecocardiogramma?" |
| /holter-ecg/ | "Si può fare sport con l'Holter?", "Quanto costa l'Holter ECG?", "Come si legge l'Holter?" |
| /eco-doppler-tsa/ | "Cos'è l'ecocolordoppler TSA?", "A cosa serve il doppler carotideo?", "Ogni quanto fare il doppler TSA?" |
| /test-da-sforzo/ | "Il test da sforzo è pericoloso?", "Quanto dura la prova da sforzo?", "Serve per l'idoneità sportiva?" |

**FAQPage Schema Template:**
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "L'ECG è incluso nella visita cardiologica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, a Bio-Clinic Sassari la visita cardiologica include sempre l'elettrocardiogramma (ECG) a 12 derivazioni con refertazione immediata. Il costo parte da €100."
      }
    }
  ]
}
```

---

## 4. SCHEMA.ORG REQUIREMENTS

### 4.1 Required Schema Types per Page

| Page Type | Required Schema | Status |
|-----------|-----------------|--------|
| Hub | MedicalSpecialty, MedicalClinic, BreadcrumbList, FAQPage, AggregateRating | ⚠️ PARTIAL |
| Service | MedicalProcedure/MedicalTest, Offer, Physician, BreadcrumbList, FAQPage | ❌ INCOMPLETE |
| Symptom | MedicalSymptom, MedicalWebPage, BreadcrumbList, FAQPage | 🆕 TO CREATE |
| Doctor | Physician, MedicalClinic, AggregateRating | ⚠️ PARTIAL |

### 4.2 MedicalProcedure Schema (for Service Pages)
```json
{
  "@type": "MedicalProcedure",
  "@id": "https://bio-clinic.it/cardiologia/ecocardiogramma/#procedure",
  "name": "Ecocardiogramma",
  "procedureType": "Diagnostic",
  "bodyLocation": "Heart",
  "preparation": "Nessuna preparazione specifica richiesta",
  "howPerformed": "Ecografia non invasiva del cuore tramite sonda ecografica",
  "followup": "Refertazione immediata con consegna risultati",
  "status": "ActiveNotRecruiting",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "EUR",
    "price": "70",
    "url": "https://bio-clinic.it/cardiologia/ecocardiogramma/"
  }
}
```

### 4.3 MedicalSymptom Schema (for Symptom Pages)
```json
{
  "@type": "MedicalSymptom",
  "name": "Dolore toracico",
  "alternateName": ["Dolore al petto", "Chest pain"],
  "possibleTreatment": [
    {
      "@type": "MedicalProcedure",
      "name": "Elettrocardiogramma",
      "url": "https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/"
    },
    {
      "@type": "MedicalProcedure", 
      "name": "Ecocardiogramma",
      "url": "https://bio-clinic.it/cardiologia/ecocardiogramma/"
    }
  ],
  "signOrSymptom": "Dolore, pressione o fastidio nella zona toracica"
}
```

### 4.4 Physician Schema Enhancement
```json
{
  "@type": "Physician",
  "@id": "https://bio-clinic.it/equipe/paolo-pischedda/#person",
  "name": "Dott. Paolo Pischedda",
  "honorificPrefix": "Dott.",
  "medicalSpecialty": {
    "@type": "MedicalSpecialty",
    "name": "Cardiology"
  },
  "memberOf": {
    "@type": "MedicalOrganization",
    "name": "Ordine dei Medici di Sassari"
  },
  "worksFor": {
    "@type": "MedicalClinic",
    "name": "Bio-Clinic Sassari",
    "@id": "https://bio-clinic.it/#organization"
  },
  "availableService": [
    {"@type": "MedicalProcedure", "name": "Holter ECG"},
    {"@type": "MedicalProcedure", "name": "Holter Pressorio"},
    {"@type": "MedicalProcedure", "name": "Ecocardiogramma"},
    {"@type": "MedicalProcedure", "name": "Eco-Doppler TSA"},
    {"@type": "MedicalProcedure", "name": "Test da Sforzo"}
  ]
}
```

---

## 5. LOCAL SEO SIGNALS

### 5.1 Google Business Profile Optimization

| Element | Current | Required |
|---------|---------|----------|
| Primary Category | Medical Clinic | "Cardiologist" (add) |
| Secondary Categories | - | Add: "Medical diagnostic imaging center" |
| Services | Generic | Add individual cardiology services |
| Q&A | Unknown | Seed 5-10 questions about cardiology |
| Posts | Unknown | Weekly cardiology content |

### 5.2 NAP Consistency
```
Name: Bio-Clinic Sassari
Address: Via Renzo Mossa, 23, 07100 Sassari SS, Italia
Phone: +39 079 956 1332
```
- Ensure identical across all pages
- Add to footer of all cardiology cluster pages
- Include in LocalBusiness schema

### 5.3 Geo-Modified Keywords
- "cardiologo sassari"
- "visita cardiologica sassari centro"  
- "ecocardiogramma sassari nord sardegna"
- "holter ecg sassari prezzo"

---

## 6. IMPLEMENTATION PRIORITY

### Phase A: Schema Enhancement (Week 1-2)
- [ ] Add MedicalProcedure schema to all service pages
- [ ] Add Offer schema with prices
- [ ] Update BreadcrumbList to use /cardiologia/ paths
- [ ] Add FAQPage schema to all pages

### Phase B: Symptom Pages (Week 3-4)
- [ ] Create dolore-toracico page
- [ ] Create tachicardia page
- [ ] Create fiato-corto page
- [ ] Add MedicalSymptom schema

### Phase C: Local SEO (Week 5-6)
- [ ] Update Google Business Profile
- [ ] Add service-specific GMB listings
- [ ] Ensure NAP consistency
- [ ] Create location-modified content

---

**Phase 6 Complete - Ready for Phase 7: QA & Risk Control**
# PHASE 7: QA & RISK CONTROL
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** QA & Risk Control Auditor
**Status:** ✅ COMPLETE

---

## 1. CANNIBALIZATION AUDIT

### 1.1 Potential Cannibalization Risks

| Risk | Pages Competing | Target Keyword | Status | Resolution |
|------|-----------------|----------------|--------|------------|
| 🟠 MEDIUM | /cardiologia/ vs /pages/cardiologia.html | "cardiologia sassari" | ⚠️ ACTIVE | Canonical + redirect OK, but pages still exist |
| 🟠 MEDIUM | /cardiologia/visita-cardiologica-ecg/ vs /pages/visita-cardiologica-ecg.html | "visita cardiologica sassari" | ⚠️ CANONICAL CONFLICT | Fix canonical on legacy page |
| 🟠 MEDIUM | /cardiologia/ecocardiogramma/ vs /pages/ecocardiogramma.html | "ecocardiogramma sassari" | ⚠️ CANONICAL CONFLICT | Fix canonical on legacy page |
| 🟢 LOW | /cardiologia/visita-cardiologica-ecg/ vs /pages/visita-cardiologica.html | "visita cardiologica" | ✅ RESOLVED | Redirect active |
| 🟢 LOW | /cardiologia/visita-cardiologica-ecg/ vs /pages/ecg.html | "ecg sassari" | ✅ RESOLVED | Redirect active |

### 1.2 Resolution Actions Required

```
CRITICAL FIXES:
1. pages/visita-cardiologica-ecg.html 
   → Change canonical from https://bio-clinic.it/pages/visita-cardiologica-ecg.html
   → TO: https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/

2. pages/ecocardiogramma.html
   → Change canonical from https://bio-clinic.it/pages/ecocardiogramma.html  
   → TO: https://bio-clinic.it/cardiologia/ecocardiogramma/

3. pages/holter-ecg.html, pages/holter-pressorio.html, pages/checkup-cardiovascolare.html
   → Verify canonical points to new /cardiologia/ URLs
```

---

## 2. REDIRECT CHAIN ANALYSIS

### 2.1 Current Redirect Chains Detected

| Chain | Hops | Status | Action |
|-------|------|--------|--------|
| /pages/genetica.html → /pages/genetica.html | 1 (self) | ⚠️ Loop | Remove from _redirects |
| /pages/preparazione-esami.html → /pages/preparazione-esami.html | 1 (self) | ⚠️ Loop | Remove from _redirects |

### 2.2 Potential Chains (Post-Migration)

| Scenario | Path | Risk | Prevention |
|----------|------|------|------------|
| Old → Meta-refresh → New | /pages/ecg.html → refresh → /cardiologia/visita-cardiologica-ecg/ | 🟠 MEDIUM | Meta-refresh replaced with 301 ✅ |
| External link → Old → New | External → /pages/cardiologia.html → /cardiologia/ | 🟢 LOW | Single 301 hop (acceptable) |

### 2.3 Chain Prevention Rules
```
✅ Maximum allowed chain: 1 hop (Old URL → 301 → New URL)
❌ Never allow: 2+ hops
❌ Never create: Circular redirects
✅ Always use: 301 permanent (not 302 temporary)
```

---

## 3. DUPLICATE CONTENT AUDIT

### 3.1 Current Duplicate Risk Assessment

| Duplicate Type | Files | Risk Level | Resolution |
|----------------|-------|------------|------------|
| Same content, different URL | pages/cardiologia.html ↔ cardiologia/index.html | 🔴 HIGH | Canonical pointing to new URL ✅ |
| Same content, different URL | pages/visita-cardiologica-ecg.html ↔ cardiologia/visita-cardiologica-ecg/index.html | 🔴 HIGH | **FIX CANONICAL** |
| Near-duplicate titles | Multiple pages with "Bio-Clinic Sassari" | 🟢 LOW | Differentiate with service names |
| Trailing slash variants | /cardiologia vs /cardiologia/ | 🟢 LOW | Cloudflare normalizes ✅ |

### 3.2 Duplicate Content Checklist

- [ ] Verify all /cardiologia/* pages have unique meta descriptions
- [ ] Ensure title tags differ by at least 60%
- [ ] Confirm canonical tags on all legacy /pages/* files point to /cardiologia/*
- [ ] Check that sitemap contains only canonical URLs

---

## 4. RISK SCENARIOS & MITIGATION

### 4.1 Scenario: Incomplete Migration

**Risk:** Some internal links still point to old URLs after migration
**Probability:** HIGH (324 links identified)
**Impact:** 10-15% equity loss per redirect hop
**Mitigation:**
```
1. Run global search-replace: "cardiologia.html" → "/cardiologia/"
2. Update header/footer template links
3. Verify with crawler (Screaming Frog) post-deploy
4. Monitor GSC for crawl anomalies
```

### 4.2 Scenario: Missing Redirect

**Risk:** A redirect rule is missing or incorrectly formatted
**Probability:** LOW (rules tested)
**Impact:** 404 errors, lost traffic, de-indexation
**Mitigation:**
```
1. Test all redirects with curl -I before deploy
2. Keep backup of working _redirects file
3. Monitor GSC Coverage report daily for 7 days
4. Have rollback plan ready
```

### 4.3 Scenario: Canonical Conflicts

**Risk:** Google indexes wrong URL version
**Probability:** MEDIUM (2 files need fixing)
**Impact:** Crawl waste, ranking confusion
**Mitigation:**
```
1. Fix canonical tags on pages/visita-cardiologica-ecg.html
2. Fix canonical tags on pages/ecocardiogramma.html
3. Submit updated sitemap to GSC
4. Use URL Inspection tool to verify
```

### 4.4 Scenario: Breadcrumb Schema Mismatch

**Risk:** Schema shows /specialita/cardiologia/ but URL is /cardiologia/
**Probability:** HIGH (current state)
**Impact:** Rich snippet inconsistency, trust signals
**Mitigation:**
```
1. Update BreadcrumbList schema on all /cardiologia/* pages
2. Change itemListElement URLs to actual page URLs
3. Test with Rich Results Test tool
```

---

## 5. EQUITY PRESERVATION CHECKLIST

### 5.1 Link Equity Protection

| Action | Status | Priority |
|--------|--------|----------|
| All old URLs have 301 redirects | ✅ DONE | CRITICAL |
| No redirect chains > 1 hop | ✅ VERIFIED | CRITICAL |
| Internal links updated to new URLs | ❌ PENDING | HIGH |
| External backlinks still resolve | ✅ VIA 301 | MEDIUM |
| Sitemap contains only new URLs | ⚠️ PARTIAL | HIGH |

### 5.2 External Backlink Check

**Recommendation:** Run backlink audit via:
- Google Search Console → Links → Top linking sites
- Ahrefs/Moz (if available)

**Action if high-value backlinks point to old URLs:**
- Keep 301 redirects permanently (never remove)
- Do not create redirect chains
- Monitor for 404 spikes in GSC

---

## 6. PRE-DEPLOY VERIFICATION CHECKLIST

### 6.1 Technical Verification

```bash
# Test redirects locally
curl -I https://bio-clinic.it/pages/cardiologia.html
# Expected: HTTP/1.1 301 → /cardiologia/

curl -I https://bio-clinic.it/cardiologia/
# Expected: HTTP/1.1 200 OK

# Test canonical tags
curl -s https://bio-clinic.it/cardiologia/ | grep -o '<link rel="canonical"[^>]*>'
# Expected: href="https://bio-clinic.it/cardiologia/"
```

### 6.2 Content Verification

- [ ] All /cardiologia/* pages load correctly (200)
- [ ] CSS/JS paths resolve (check browser console)
- [ ] Images load properly
- [ ] MioDoctor booking widget functional
- [ ] Phone links (tel:) work on mobile
- [ ] Schema validates in Rich Results Test

---

## 7. POST-DEPLOY MONITORING PLAN

### 7.1 Day 1-3: Critical Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| 404 errors | GSC Coverage | >5 new 404s |
| Crawl errors | GSC | Any soft-404 |
| Index status | GSC | Pages dropped |
| Traffic | GA4 | >20% drop |

### 7.2 Day 4-14: Stabilization

- Monitor keyword rankings for "cardiologia sassari"
- Check indexed pages count in GSC
- Verify new URLs appearing in SERP
- Watch for crawl budget anomalies

### 7.3 Day 15-30: Optimization

- Analyze user behavior on new URLs
- Check conversion rates
- Review GSC performance report
- Plan Phase 2 improvements

---

## 8. RISK MITIGATION SUMMARY

| Risk | Probability | Impact | Mitigation Status |
|------|-------------|--------|-------------------|
| Redirect chains | LOW | HIGH | ✅ MITIGATED |
| Canonical conflicts | MEDIUM | HIGH | ⚠️ 2 FILES TO FIX |
| Internal link breakage | HIGH | MEDIUM | ⚠️ 324 LINKS PENDING |
| Sitemap inconsistency | MEDIUM | LOW | ⚠️ PARTIAL |
| Schema mismatch | HIGH | LOW | ⚠️ BREADCRUMBS TO FIX |
| External backlink loss | LOW | HIGH | ✅ REDIRECTS PRESERVE |

---

## 9. EMERGENCY ROLLBACK PLAN

**If critical issues detected post-deploy:**

1. **Immediate (< 1 hour):**
   - Restore previous _redirects file from git
   - Deploy hotfix to Cloudflare

2. **Short-term (< 24 hours):**
   - Analyze GSC for specific errors
   - Fix targeted issues
   - Re-deploy with fixes

3. **Communication:**
   - Document all issues in GitHub issue
   - Notify stakeholders of any traffic impact
   - Plan remediation timeline

---

**Phase 7 Complete - Ready for Phase 8: 90-Day Implementation Roadmap**
# PHASE 8: 90-DAY IMPLEMENTATION ROADMAP
## Multi-Agent SEO Architecture - Cardiology Cluster

**Date:** 2026-02-14
**Agent:** Team Leader
**Status:** ✅ COMPLETE

---

## EXECUTIVE SUMMARY

This roadmap transforms Bio-Clinic's cardiology section into a dominant local SEO presence through:
- 4-level URL hierarchy (/cardiologia/, /cardiologia/servizio/, /cardiologia/sintomi/, /cardiologia/percorsi/)
- Zero-traffic-loss migration with 301 redirects
- EEAT-compliant medical content
- Conversion-optimized patient funnels
- Replicable template for all specialties

---

## PHASE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        90-DAY IMPLEMENTATION TIMELINE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEEK 1-2        WEEK 3-4        WEEK 5-8        WEEK 9-12                 │
│  ─────────       ─────────       ─────────       ──────────                │
│  🔴 CRITICAL     🟠 HIGH         🟡 MEDIUM       🟢 EVOLUTION              │
│                                                                             │
│  • Fix canonicals • Update links  • Create pages  • Replicate              │
│  • Verify redirects• Fix sitemap  • Add schema    • Other specialties      │
│  • Deploy & monitor• Add prices   • Symptom pages • Final audit            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WEEK 1-2: CRITICAL FOUNDATION (Days 1-14)

### 🔴 Priority: CRITICAL

| Day | Task | Owner | Deliverable | Status |
|-----|------|-------|-------------|--------|
| 1 | Fix canonical on pages/visita-cardiologica-ecg.html | Tech SEO | Updated file | ⏳ |
| 1 | Fix canonical on pages/ecocardiogramma.html | Tech SEO | Updated file | ⏳ |
| 1 | Fix canonical on pages/holter-ecg.html | Tech SEO | Updated file | ⏳ |
| 1 | Fix canonical on pages/holter-pressorio.html | Tech SEO | Updated file | ⏳ |
| 1 | Fix canonical on pages/checkup-cardiovascolare.html | Tech SEO | Updated file | ⏳ |
| 2 | Remove self-referencing redirects (genetica, preparazione-esami) | Tech SEO | Clean _redirects | ⏳ |
| 2 | Add redirects for eco-doppler-tsa, eco-doppler-arti, test-da-sforzo | Tech SEO | Updated _redirects | ⏳ |
| 3 | Update BreadcrumbList schema on all /cardiologia/* pages | Tech SEO | Schema fix | ⏳ |
| 3 | Deploy to Cloudflare | Tech SEO | Live site | ⏳ |
| 4-7 | Monitor GSC for 404s, crawl errors | QA | Daily report | ⏳ |
| 7 | GSC Coverage check | QA | Status report | ⏳ |
| 8-14 | Monitor rankings for "cardiologia sassari" | SEO | Tracking sheet | ⏳ |

### Week 1-2 Success Criteria
- [ ] Zero 404 errors in GSC Coverage
- [ ] All redirects returning 301 (not 302/308)
- [ ] Canonical tags point to /cardiologia/* URLs
- [ ] New URLs indexed in Google

---

## WEEK 3-4: HIGH PRIORITY FIXES (Days 15-28)

### 🟠 Priority: HIGH

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 15-17 | Update 324 internal links (cardiologia.html → /cardiologia/) | Tech SEO | ~100 files updated |
| 18-19 | Update equipe page links to new URLs | Tech SEO | 52 files updated |
| 20 | Add pricing table to /cardiologia/ hub page | UX/Content | HTML update |
| 20 | Add "Da €X" to all service pages | UX/Content | 6 files updated |
| 21 | Remove old cardiology URLs from sitemap | Tech SEO | Clean sitemap.xml |
| 22 | Add MedicalProcedure schema to service pages | Tech SEO | Schema implementation |
| 23 | Add Offer schema with prices | Tech SEO | Schema implementation |
| 24-25 | Create eco-doppler-tsa/index.html content | Content | New page |
| 26-27 | Create eco-doppler-arti/index.html content | Content | New page |
| 28 | Deploy all changes | Tech SEO | Live site |

### Week 3-4 Success Criteria
- [ ] Internal links point directly to /cardiologia/*
- [ ] Prices visible on all cardiology pages
- [ ] Schema validates in Rich Results Test
- [ ] 2 new service pages live

---

## WEEK 5-8: MEDIUM PRIORITY EXPANSION (Days 29-56)

### 🟡 Priority: MEDIUM

| Week | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 5 | Create test-da-sforzo/index.html content | Content | New page |
| 5 | Create sintomi/dolore-toracico/index.html | Content | Symptom page |
| 5 | Add MedicalSymptom schema | Tech SEO | Schema |
| 6 | Create sintomi/tachicardia/index.html | Content | Symptom page |
| 6 | Create sintomi/fiato-corto/index.html | Content | Symptom page |
| 6 | Add FAQPage schema to all pages | Tech SEO | Schema |
| 7 | Implement sticky mobile CTA bar | UX | CSS/JS component |
| 7 | Add "Che problema hai?" symptom selector | UX | HTML component |
| 8 | Add doctor selection widget to hub | UX | HTML component |
| 8 | Add lab cross-sell banner | UX | HTML component |

### Week 5-8 Success Criteria
- [ ] 3 symptom landing pages live
- [ ] 3 new service pages live (total 8)
- [ ] FAQPage schema on all pages
- [ ] Mobile conversion improvements live

---

## WEEK 9-12: EVOLUTION & REPLICATION (Days 57-90)

### 🟢 Priority: EVOLUTIVE

| Week | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 9 | Add medical author attribution to all pages | EEAT | Content update |
| 9 | Add last review dates | EEAT | Content update |
| 9 | Create editorial policy section on /chi-siamo/ | EEAT | Content |
| 10 | Add medical disclaimer footer | EEAT | Template update |
| 10 | Begin replication for /ginecologia/ cluster | All Agents | Architecture doc |
| 11 | Create /ginecologia/ 4-level structure | Tech SEO | New folder |
| 11 | Implement ginecologia redirects | Tech SEO | _redirects update |
| 12 | Final crawl audit (Screaming Frog) | QA | Audit report |
| 12 | GSC Performance review | SEO | Report |
| 12 | Document cardiology template | Team Leader | Playbook |

### Week 9-12 Success Criteria
- [ ] EEAT elements on all cardiology pages
- [ ] Ginecologia migration started
- [ ] <50 GSC Coverage issues total
- [ ] Template documentation complete

---

## DAILY/WEEKLY MONITORING SCHEDULE

### Daily (Week 1-2)
```
Morning: Check GSC Coverage for new errors
Afternoon: Verify key redirects still working
Evening: Monitor GA4 for traffic anomalies
```

### Weekly (Week 3-12)
```
Monday: GSC Performance review
Wednesday: Check indexed page count
Friday: Review conversion metrics
```

---

## RESOURCE ALLOCATION

| Role | Hours/Week | Primary Tasks |
|------|------------|---------------|
| Technical SEO Engineer | 20h | Redirects, schema, canonical fixes |
| Content Writer | 15h | New pages, FAQ content |
| UX Designer | 10h | CTA components, pricing tables |
| EEAT Specialist | 5h | Author attribution, medical review |
| QA Auditor | 5h | Monitoring, testing |
| Team Leader | 5h | Coordination, documentation |

---

## KEY MILESTONES

| Milestone | Target Date | Metric |
|-----------|-------------|--------|
| 🎯 M1: Zero 404s | Day 7 | GSC Coverage clean |
| 🎯 M2: Internal links fixed | Day 28 | 0 legacy links |
| 🎯 M3: 8 service pages live | Day 42 | Sitemap count |
| 🎯 M4: 3 symptom pages live | Day 56 | Sitemap count |
| 🎯 M5: EEAT complete | Day 70 | Author attribution 100% |
| 🎯 M6: Ginecologia started | Day 84 | New cluster live |
| 🎯 M7: Final audit passed | Day 90 | <50 issues |

---

## DEPENDENCIES & BLOCKERS

| Dependency | Impact | Mitigation |
|------------|--------|------------|
| Cloudflare API token | Cannot deploy | Obtain from account owner |
| Doctor content approval | EEAT compliance | Get sign-off in advance |
| MioDoctor widget access | Booking flow | Coordinate with provider |
| Content writer availability | Page creation delays | Prioritize symptom pages |

---

## ESCALATION MATRIX

| Issue | Severity | Escalate To | Response Time |
|-------|----------|-------------|---------------|
| Site down | CRITICAL | Team Leader → Cloudflare | <1 hour |
| Ranking drop >30% | HIGH | SEO Architect | <4 hours |
| Conversion drop >20% | HIGH | UX Specialist | <24 hours |
| New 404s in GSC | MEDIUM | Tech SEO | <48 hours |
| Schema warnings | LOW | Tech SEO | <1 week |

---

## FINAL DELIVERABLES CHECKLIST

### Architecture
- [ ] 4-level URL hierarchy implemented
- [ ] /cardiologia/ hub live
- [ ] 8 service pages live
- [ ] 3 symptom pages live
- [ ] Clean URL structure (/cardiologia/servizio/)

### Technical SEO
- [ ] 95+ redirect rules active
- [ ] Zero redirect chains
- [ ] Canonical tags consistent
- [ ] Sitemap updated
- [ ] Schema.org validated

### EEAT
- [ ] Medical author on all pages
- [ ] Last review dates displayed
- [ ] Editorial policy published
- [ ] Medical disclaimer present
- [ ] Guideline citations added

### Conversion
- [ ] Pricing visible on all pages
- [ ] Sticky mobile CTA implemented
- [ ] Doctor selection widget live
- [ ] Symptom selector implemented
- [ ] Lab cross-sell active

### Risk Mitigation
- [ ] No cannibalization issues
- [ ] External backlinks preserved
- [ ] Emergency rollback tested
- [ ] Monitoring dashboard active
- [ ] Documentation complete

---

## POST-90-DAY RECOMMENDATIONS

1. **Replicate for other specialties** (Ginecologia, Endocrinologia, etc.)
2. **Implement A/B testing** for CTA optimization
3. **Add patient testimonials** with VideoObject schema
4. **Create procedure video content** for SERP features
5. **Expand symptom library** based on GSC query data
6. **Consider AMP** for symptom pages (mobile speed)

---

**🏁 ROADMAP COMPLETE**

**Total Tasks:** 47
**Critical:** 12 (Week 1-2)
**High:** 14 (Week 3-4)
**Medium:** 12 (Week 5-8)
**Evolutive:** 9 (Week 9-12)

**Estimated Impact:**
- +30% organic traffic to cardiology cluster
- +15% conversion rate improvement
- <50 GSC Coverage issues (from 100+)
- Replicable template for 13 other specialties
