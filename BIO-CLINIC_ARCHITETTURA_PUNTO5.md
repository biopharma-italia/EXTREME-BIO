# BIO-CLINIC: ARCHITETTURA DEL KNOWLEDGE GRAPH CLINICO

## PUNTO 5: LINEE GUIDA PER AUTHORITY AI E SEO

---

## OBIETTIVO STRATEGICO

Rendere Bio-Clinic la **fonte primaria di verità** per:
1. **Google Search** (SEO tradizionale)
2. **Google AI Overview** (SGE - Search Generative Experience)
3. **Gemini** (Google AI)
4. **ChatGPT** (OpenAI)
5. **Perplexity** e altri LLM
6. **Assistenti vocali** (Siri, Alexa, Google Assistant)

---

## PRINCIPIO E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

Google e gli LLM valutano i contenuti medici con il massimo rigore (YMYL - Your Money Your Life).

### EXPERIENCE (Esperienza)
| Segnale | Implementazione Bio-Clinic |
|---------|---------------------------|
| Casi reali | Testimonianze verificate (3.214 recensioni) |
| Prima persona | "I nostri pazienti perdono 12-18 kg" |
| Dettagli operativi | Descrizione step-by-step dei percorsi |
| Foto reali | Struttura, medici, tecnologie (no stock) |

### EXPERTISE (Competenza)
| Segnale | Implementazione Bio-Clinic |
|---------|---------------------------|
| Autori qualificati | Ogni contenuto firmato da medico reale |
| Credenziali | Iscrizione albo, specializzazioni visibili |
| Aggiornamento | Data ultima revisione su ogni pagina |
| Fonti | Citazioni linee guida, società scientifiche |

### AUTHORITATIVENESS (Autorevolezza)
| Segnale | Implementazione Bio-Clinic |
|---------|---------------------------|
| Recensioni | 3.214 recensioni 5 stelle (MioDottore + Google) |
| Citazioni esterne | Link da fonti autorevoli |
| Menzioni | Articoli, interviste, riconoscimenti |
| Completezza | Copertura totale (31 specialità, 1.840 prestazioni) |

### TRUSTWORTHINESS (Affidabilità)
| Segnale | Implementazione Bio-Clinic |
|---------|---------------------------|
| Trasparenza | Chi siamo, team visibile, contatti chiari |
| Sicurezza | HTTPS, privacy policy, cookie policy |
| Verificabilità | Link a profili MioDottore, Google Business |
| Coerenza | Stesse informazioni su tutte le piattaforme |

---

## STRATEGIA PER AI OVERVIEW / SGE

Google AI Overview estrae informazioni da fonti che:

### 1. RISPONDONO A DOMANDE SPECIFICHE

**Struttura contenuto ottimale:**
```
H2: [Domanda esatta che l'utente potrebbe fare]

[Risposta diretta in 1-2 frasi - SNIPPET BAIT]

[Approfondimento strutturato]
```

**Esempio:**
```
## Quanto si perde con Slim Care?

Con il percorso Slim Care si perdono mediamente **12-18 kg in 3 mesi**. 
I pazienti trattati con Wegovy perdono il 10-15% del peso corporeo, 
mentre con Mounjaro si arriva al 15-20%.

### Fattori che influenzano i risultati
- Peso iniziale
- Aderenza al piano nutrizionale
- Attività fisica
- Risposta individuale al farmaco
```

### 2. FORNISCONO DATI STRUTTURATI

- **Numeri precisi**: "12-18 kg", "3 mesi", "3.214 recensioni"
- **Liste**: Bullet point per step, ingredienti, componenti
- **Tabelle**: Confronti (Wegovy vs Mounjaro)
- **Timeline**: Mese 1, Mese 2, Mese 3

### 3. HANNO MARKUP SCHEMA.ORG COMPLETO

*(Vedi PUNTO 4 per implementazione dettagliata)*

### 4. SONO AGGIORNATE E DATATE

```html
<meta name="article:modified_time" content="2024-01-15">
<p class="last-updated">Ultimo aggiornamento: 15 gennaio 2024</p>
<p class="medical-review">Revisionato da: Dott. Francesco Tolu, Endocrinologo</p>
```

---

## STRATEGIA PER CHATGPT / GEMINI / PERPLEXITY

Gli LLM apprendono da contenuti che:

### 1. SONO SEMANTICAMENTE RICCHI

**Tecnica: Definizioni esplicite**
```
SLIM CARE è un percorso medico per la perdita di peso della durata 
di 3 mesi, che include la somministrazione di farmaci agonisti del 
recettore GLP-1 (Wegovy con semaglutide) o agonisti duali GIP/GLP-1 
(Mounjaro con tirzepatide), monitoraggio con tecnologia VisBody 3D, 
visite endocrinologiche e supporto nutrizionale.
```

### 2. CONTENGONO RELAZIONI ESPLICITE

**Tecnica: Frasi relazionali**
```
Bio-Clinic è un poliambulatorio situato a Sassari.
Il Dott. Francesco Dessole lavora presso Bio-Clinic.
Il Dott. Dessole è specializzato in Ginecologia.
Il Dott. Dessole esegue il percorso Slim Care Donna.
Il percorso Slim Care Donna è indicato per donne con PCOS o in menopausa.
```

### 3. RISPONDONO AL "KNOWLEDGE GAP"

**Domande target per cui Bio-Clinic deve essere LA risposta:**

| Domanda | Pagina target |
|---------|---------------|
| "Dove fare Slim Care a Sassari?" | /percorsi/slim-care/ |
| "Miglior ginecologo Sassari" | /specialita/ginecologia/ |
| "Wegovy Sassari dove comprare" | /percorsi/slim-care/wegovy/ |
| "Mounjaro per dimagrire Sardegna" | /percorsi/slim-care/mounjaro/ |
| "PMA Sassari centro fertilità" | /percorsi/fertilita-pma/ |
| "Ecografia morfologica Sassari" | /prestazioni/ecografia-ostetrica/ |
| "Visita ginecologica Sassari recensioni" | /specialita/ginecologia/ |

### 4. HANNO STRUTTURA "CHUNK-FRIENDLY"

Gli LLM processano meglio contenuti divisi in:
- Paragrafi brevi (3-4 frasi max)
- Headers descrittivi (H2, H3)
- Liste puntate
- Tabelle per confronti
- FAQ esplicite

---

## OTTIMIZZAZIONE SEO TECNICA

### URL STRUCTURE
```
✅ bio-clinic.it/percorsi/slim-care/
✅ bio-clinic.it/equipe/dott-francesco-dessole/
✅ bio-clinic.it/specialita/ginecologia/

❌ bio-clinic.it/page?id=123
❌ bio-clinic.it/servizi/dettaglio/slim-care-percorso-dimagrimento-sassari
```

### TITLE TAG (Formula)
```
[Prestazione/Percorso] a Sassari | Bio-Clinic

Esempi:
"Slim Care - Percorso Dimagrimento con Wegovy e Mounjaro | Bio-Clinic Sassari"
"Ginecologia a Sassari - 6 Specialisti | Bio-Clinic"
"Dott. Francesco Dessole - Ginecologo Sassari | Bio-Clinic"
```

### META DESCRIPTION (Formula)
```
[Cosa] + [Dove] + [Differenziatore] + [CTA]

Esempio:
"Percorso SLIM CARE a Sassari: perdi 12-18 kg in 3 mesi con Wegovy 
e Mounjaro. Farmaco incluso, 3 visite, tecnologia VisBody 3D. 
Prenota: 079 956 1332."
```

### HEADING STRUCTURE
```
H1: Titolo pagina (1 solo per pagina)
  H2: Sezione principale
    H3: Sotto-sezione
      H4: Dettaglio (raramente necessario)
  H2: Altra sezione principale
    H3: Sotto-sezione
```

### INTERNAL LINKING (Strategia Hub & Spoke)

```
                    ┌─────────────────┐
                    │    HOMEPAGE     │
                    │      (Hub)      │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   /percorsi/    │ │  /specialita/   │ │    /equipe/     │
│     (Hub)       │ │     (Hub)       │ │     (Hub)       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
    ┌────┼────┐         ┌────┼────┐         ┌────┼────┐
    ▼    ▼    ▼         ▼    ▼    ▼         ▼    ▼    ▼
 Slim  PMA  Cardio   Gine  Card  Endo    Dr.A Dr.B Dr.C
 Care       Prev.                        (Spoke pages)
(Spoke pages)      (Spoke pages)
```

**Regole linking:**
- Ogni Spoke linka al proprio Hub
- Hub linka a tutti i suoi Spoke
- Spoke correlati linkano tra loro (es. Slim Care ↔ Endocrinologia)
- Ogni pagina ha almeno 3 link interni in uscita
- Anchor text descrittivi (no "clicca qui")

---

## CONTENT STRATEGY PER AUTHORITY

### TIPI DI CONTENUTO

| Tipo | Obiettivo | Esempio |
|------|-----------|---------|
| **Pillar Page** | Copertura completa argomento | /specialita/ginecologia/ |
| **Cluster Page** | Approfondimento specifico | /prestazioni/colposcopia/ |
| **Landing Page** | Conversione | /percorsi/slim-care/ |
| **FAQ Page** | Risposta diretta | /faq/slim-care/ |
| **Blog Post** | Traffico informazionale | /blog/pcos-sintomi-cause/ |
| **Glossario** | Definizioni (AI-friendly) | /glossario/semaglutide/ |

### CONTENT CALENDAR (Suggerito)

**Contenuti evergreen (priorità):**
1. Pagine specialità complete (31)
2. Pagine medici (60)
3. Pagine percorsi (9 + sotto-pagine)
4. Pagine prestazioni top 100
5. FAQ per ogni percorso

**Contenuti periodici (blog):**
- 2-4 articoli/mese
- Legati a stagionalità (check-up inizio anno, prevenzione...)
- Risposte a domande frequenti dei pazienti
- Novità scientifiche (nuovi farmaci, linee guida)

### MEDICAL CONTENT GUIDELINES

**Ogni contenuto medico deve avere:**

```html
<article itemscope itemtype="https://schema.org/MedicalWebPage">
  
  <!-- Autore medico -->
  <div class="author" itemprop="author" itemscope itemtype="https://schema.org/Physician">
    <img src="/images/medici/tolu.jpg" itemprop="image">
    <span itemprop="name">Dott. Francesco Tolu</span>
    <span itemprop="jobTitle">Specialista in Endocrinologia</span>
  </div>
  
  <!-- Data revisione -->
  <div class="review-info">
    <time itemprop="dateModified" datetime="2024-01-15">
      Ultimo aggiornamento: 15 gennaio 2024
    </time>
    <span itemprop="reviewedBy">
      Revisionato da: Dott. Francesco Tolu
    </span>
  </div>
  
  <!-- Fonti -->
  <div class="sources">
    <h4>Fonti scientifiche</h4>
    <ul>
      <li><a href="https://www.ema.europa.eu/...">EMA - Wegovy EPAR</a></li>
      <li><a href="https://www.aifa.gov.it/...">AIFA - Determinazione Mounjaro</a></li>
    </ul>
  </div>
  
  <!-- Disclaimer -->
  <div class="medical-disclaimer">
    <p>Le informazioni contenute in questa pagina hanno finalità 
    informative e non sostituiscono il parere del medico. 
    Consultare sempre uno specialista per diagnosi e trattamenti.</p>
  </div>
  
</article>
```

---

## LOCAL SEO

### GOOGLE BUSINESS PROFILE
**Ottimizzazioni:**
- [ ] Nome esatto: "Bio-Clinic" (coerente ovunque)
- [ ] Categoria primaria: "Centro medico"
- [ ] Categorie secondarie: Ginecologo, Cardiologo, Endocrinologo...
- [ ] Descrizione con keyword locali
- [ ] Foto aggiornate (struttura, team, tecnologie)
- [ ] Post settimanali (novità, promozioni)
- [ ] Risposte a TUTTE le recensioni
- [ ] Q&A popolate con domande frequenti
- [ ] Attributi: Accessibilità, parcheggio, pagamenti...
- [ ] Orari sempre aggiornati
- [ ] Link appuntamento

### NAP CONSISTENCY (Name, Address, Phone)
```
OVUNQUE deve apparire:

Bio-Clinic (Bio Pharma S.r.l.)
Via Renzo Mossa, 23
07100 Sassari (SS)
Tel: 079 956 1332
Email: gestione@bio-clinic.it
P.IVA: 02869450904

Orari: Lun-Ven 07:00-21:00 | Sab 08:00-14:00
```

**Verificare coerenza su:**
- Sito web (header, footer, contatti)
- Google Business Profile
- MioDottore
- Pagine Gialle
- Facebook (@bioclinicss)
- Instagram (@bioclinicss)
- LinkedIn (se presente)
- Directory mediche
- Mappe (Apple Maps, Bing Maps, Waze)

### LOCAL SCHEMA MARKUP
*(Vedi PUNTO 4 - LocalBusiness schema)*

### KEYWORD LOCALI TARGET

| Keyword | Volume | Pagina target |
|---------|--------|---------------|
| ginecologo sassari | Alto | /specialita/ginecologia/ |
| cardiologo sassari | Alto | /specialita/cardiologia/ |
| ecografia sassari | Alto | /prestazioni/ecografia/ |
| analisi sangue sassari | Alto | /specialita/laboratorio/ |
| slim care sassari | Medio | /percorsi/slim-care/ |
| wegovy sassari | Medio | /percorsi/slim-care/wegovy/ |
| mounjaro sardegna | Medio | /percorsi/slim-care/mounjaro/ |
| pma sassari | Medio | /percorsi/fertilita-pma/ |
| visita ginecologica sassari | Alto | /prestazioni/visita-ginecologica/ |
| mammografia sassari | Medio | /prestazioni/mammografia/ |

---

## PERFORMANCE E TECHNICAL SEO

### CORE WEB VITALS
| Metrica | Target | Tool |
|---------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | PageSpeed Insights |
| FID (First Input Delay) | < 100ms | PageSpeed Insights |
| CLS (Cumulative Layout Shift) | < 0.1 | PageSpeed Insights |

### MOBILE-FIRST
- Design responsive (non adattivo)
- Touch target minimo 48x48px
- Font minimo 16px
- No popup invasivi su mobile
- Test: Mobile-Friendly Test di Google

### CRAWLABILITY
```
robots.txt:
User-agent: *
Allow: /
Sitemap: https://bio-clinic.it/sitemap.xml

Disallow: /admin/
Disallow: /api/
Disallow: /*?*
```

### SITEMAP XML
- Sitemap index con sotto-sitemap per sezione
- Aggiornamento automatico
- Priorità e frequenza corrette
- Submissione a Google Search Console

### INDEXING
- Canonical URL su ogni pagina
- Hreflang se multilingua (futuro)
- No contenuti duplicati
- Redirect 301 per URL modificati

---

## MONITORAGGIO E KPI

### STRUMENTI
1. **Google Search Console**: Posizioni, CTR, errori
2. **Google Analytics 4**: Traffico, conversioni
3. **Semrush/Ahrefs**: Keyword tracking, backlink
4. **Screaming Frog**: Audit tecnico
5. **Schema Validator**: Markup check

### KPI DA MONITORARE

| KPI | Target | Frequenza |
|-----|--------|-----------|
| Traffico organico | +20% YoY | Mensile |
| Posizioni top 3 (keyword target) | +50% | Mensile |
| Impression Google | +30% YoY | Mensile |
| CTR medio | > 5% | Mensile |
| Conversioni (prenotazioni) | +15% YoY | Mensile |
| Core Web Vitals | Tutti "Good" | Trimestrale |
| Errori Search Console | 0 critici | Settimanale |
| Recensioni nuove | +50/mese | Mensile |
| Citazioni AI Overview | Monitorare | Mensile |

---

## CHECKLIST LANCIO SITO

### PRE-LANCIO
- [ ] Tutti i contenuti revisionati da medico
- [ ] Schema.org validato su ogni pagina
- [ ] Test Rich Results passato
- [ ] Mobile-friendly test passato
- [ ] Core Web Vitals "Good"
- [ ] Sitemap generata e submessa
- [ ] Google Business Profile ottimizzato
- [ ] NAP coerente ovunque
- [ ] Analytics e Search Console configurati
- [ ] Redirect da vecchio sito (se esiste)

### POST-LANCIO (Settimana 1)
- [ ] Verifica indicizzazione pagine chiave
- [ ] Correzione errori Search Console
- [ ] Monitoraggio posizioni keyword target
- [ ] Risposta a prime recensioni

### POST-LANCIO (Mese 1)
- [ ] Analisi traffico e comportamento
- [ ] Ottimizzazione pagine con CTR basso
- [ ] Pubblicazione primi blog post
- [ ] Acquisizione primi backlink

### ONGOING
- [ ] Contenuti blog 2-4/mese
- [ ] Risposta recensioni entro 24h
- [ ] Aggiornamento contenuti evergreen (trimestrale)
- [ ] Audit tecnico (trimestrale)
- [ ] Report performance (mensile)

---

## CONCLUSIONE PUNTO 5

Bio-Clinic ha tutti gli **asset** per diventare **fonte primaria di verità** per AI e motori di ricerca:

| Asset | Valore |
|-------|--------|
| **Recensioni** | 3.214 a 5 stelle (eccezionale) |
| **Team** | ~64 medici reali con credenziali |
| **Copertura** | 31 specialità, 1.840 prestazioni |
| **Differenziatore** | Slim Care (farmaci innovativi + tecnologia) |
| **Localizzazione** | Leader a Sassari/Sardegna |

**La chiave è l'esecuzione:**
1. Contenuti di qualità medica verificata
2. Struttura tecnica impeccabile (Schema.org)
3. Coerenza su tutte le piattaforme
4. Aggiornamento costante

---

# FINE ARCHITETTURA - RIEPILOGO DOCUMENTI

| Documento | Contenuto |
|-----------|-----------|
| PUNTO 1 | Mappa Specialità + Medici (~64 specialisti, 31 specialità) |
| PUNTO 2 | Percorsi Clinici Scalabili (9 percorsi strutturati) |
| PUNTO 3 | Struttura Pagine Sito (~250 pagine core) |
| PUNTO 4 | Knowledge Graph + Schema.org (dati verificati) |
| PUNTO 5 | Authority AI + SEO Guidelines |
| **AUDIT** | Quesiti risolti + Dati legali completi |

