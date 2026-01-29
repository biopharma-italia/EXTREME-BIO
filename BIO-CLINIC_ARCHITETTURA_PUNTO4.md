# BIO-CLINIC: ARCHITETTURA DEL KNOWLEDGE GRAPH CLINICO

## PUNTO 4: SCHEMA DEL KNOWLEDGE GRAPH

---

## PRINCIPIO FONDAMENTALE

Un **Knowledge Graph** è una rete di **entità** collegate da **relazioni** semantiche.

Per Bio-Clinic, il grafo deve rispondere a queste domande:
- **CHI** esegue una prestazione? → Medico
- **COSA** viene eseguito? → Prestazione
- **DOVE** viene eseguito? → Luogo (Bio-Clinic)
- **QUANDO** è indicato? → Condizione/Sintomo
- **PERCHÉ** farlo? → Beneficio
- **COME** si struttura? → Percorso

---

## ENTITÀ DEL KNOWLEDGE GRAPH

### ENTITÀ PRIMARIE (Nodi principali)

| ID | Entità | Descrizione | Quantità |
|----|--------|-------------|----------|
| **E1** | Organization | Bio-Clinic come entità | 1 |
| **E2** | MedicalClinic | La struttura fisica | 1 |
| **E3** | Physician | Medici/Specialisti | ~60 |
| **E4** | MedicalSpecialty | Specialità cliniche | 31 |
| **E5** | MedicalProcedure | Prestazioni/Esami | 1.840 |
| **E6** | MedicalTest | Esami laboratorio | 1.162 |
| **E7** | HealthCarePath | Percorsi clinici | 9 |
| **E8** | MedicalCondition | Condizioni/Patologie | ~100 |
| **E9** | MedicalDevice | Tecnologie/Strumenti | ~10 |
| **E10** | Drug | Farmaci (Slim Care) | 2 |

### ENTITÀ SECONDARIE (Nodi di supporto)

| ID | Entità | Descrizione |
|----|--------|-------------|
| **E11** | Review | Recensioni (3.214) |
| **E12** | AggregateRating | Rating aggregato |
| **E13** | OpeningHoursSpecification | Orari |
| **E14** | PostalAddress | Indirizzo |
| **E15** | ContactPoint | Contatti |
| **E16** | FAQPage | Domande frequenti |
| **E17** | HowTo | Guide procedurali |
| **E18** | Article | Contenuti blog |
| **E19** | BreadcrumbList | Navigazione |
| **E20** | WebPage | Pagine del sito |

---

## RELAZIONI TRA ENTITÀ

### MATRICE DELLE RELAZIONI

```
ORGANIZATION (Bio-Clinic)
    │
    ├── hasLocation ──────────► MedicalClinic
    ├── employs ──────────────► Physician (60)
    ├── offersService ────────► MedicalSpecialty (31)
    ├── hasReview ────────────► Review (3.214)
    └── aggregateRating ──────► AggregateRating (5.0)

PHYSICIAN (Medico)
    │
    ├── worksFor ─────────────► Organization
    ├── hasSpecialty ─────────► MedicalSpecialty
    ├── performs ─────────────► MedicalProcedure (N)
    ├── participatesIn ───────► HealthCarePath (N)
    └── hasReview ────────────► Review (N)

MEDICALSPECIALTY (Specialità)
    │
    ├── providedBy ───────────► Organization
    ├── hasPractitioner ──────► Physician (N)
    ├── includesProcedure ────► MedicalProcedure (N)
    ├── treats ───────────────► MedicalCondition (N)
    └── partOfPath ───────────► HealthCarePath (N)

MEDICALPROCEDURE (Prestazione)
    │
    ├── availableAt ──────────► MedicalClinic
    ├── performedBy ──────────► Physician (N)
    ├── belongsToSpecialty ───► MedicalSpecialty
    ├── indicatedFor ─────────► MedicalCondition (N)
    ├── partOfPath ───────────► HealthCarePath (N)
    ├── requires ─────────────► MedicalProcedure (prerequisiti)
    ├── followedBy ───────────► MedicalProcedure (step successivo)
    └── usesDevice ───────────► MedicalDevice

HEALTHCAREPATH (Percorso Clinico)
    │
    ├── offeredBy ────────────► Organization
    ├── hasMember ────────────► Physician (Team)
    ├── includesStep ─────────► MedicalProcedure (ordinato)
    ├── treats ───────────────► MedicalCondition
    ├── usesDevice ───────────► MedicalDevice
    ├── usesDrug ─────────────► Drug
    ├── expectedOutcome ──────► Text (risultato atteso)
    └── duration ─────────────► Duration (es. 3 mesi)

MEDICALCONDITION (Condizione/Patologia)
    │
    ├── treatedBy ────────────► MedicalSpecialty
    ├── diagnosedWith ────────► MedicalProcedure
    ├── managedThrough ───────► HealthCarePath
    └── hasSymptom ───────────► Text (sintomi)
```

---

## SCHEMA.ORG MARKUP DETTAGLIATO

### 1. ORGANIZATION + MEDICALCLINIC (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": ["Organization", "MedicalClinic", "MedicalBusiness"],
  "@id": "https://bio-clinic.it/#organization",
  "name": "Bio-Clinic",
  "alternateName": "BioClinic Sassari",
  "description": "Poliambulatorio medico a Sassari con 31 specialità, 60 medici specialisti e oltre 1.840 prestazioni. Centro di riferimento per Slim Care, PMA, Ginecologia e Cardiologia.",
  "url": "https://bio-clinic.it",
  "logo": "https://bio-clinic.it/logo.png",
  "image": "https://bio-clinic.it/images/bio-clinic-sassari.jpg",
  "telephone": "+39 079 956 1332",
  "email": "gestione@bio-clinic.it",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Renzo Mossa, 23",
    "addressLocality": "Sassari",
    "addressRegion": "SS",
    "postalCode": "07100",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.7310",
    "longitude": "8.5553"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "14:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "3214",
    "reviewCount": "3214"
  },
  "sameAs": [
    "https://www.miodottore.it/strutture/bioclinic",
    "https://www.facebook.com/bioclinicss",
    "https://www.instagram.com/bioclinicss/"
  ],
  "medicalSpecialty": [
    "Gynecology", "Cardiology", "Endocrinology", "Dermatology",
    "Ophthalmology", "Neurology", "Orthopedics", "Urology", "Allergology"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": 64
  },
  "legalName": "Bio Pharma S.r.l.",
  "taxID": "02869450904",
  "slogan": "Il nostro lavoro per il tuo benessere"
}
```

---

### 2. PHYSICIAN (Pagina Medico)

```json
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "@id": "https://bio-clinic.it/equipe/dott-francesco-dessole/#physician",
  "name": "Dott. Francesco Dessole",
  "givenName": "Francesco",
  "familyName": "Dessole",
  "honorificPrefix": "Dott.",
  "jobTitle": "Specialista in Ginecologia e Ostetricia",
  "description": "Ginecologo specializzato in PCOS, menopausa e percorso Slim Care Donna presso Bio-Clinic Sassari.",
  "image": "https://bio-clinic.it/images/medici/francesco-dessole.jpg",
  "url": "https://bio-clinic.it/equipe/dott-francesco-dessole/",
  "telephone": "+39 079 956 1332",
  "worksFor": {
    "@type": "MedicalClinic",
    "@id": "https://bio-clinic.it/#organization"
  },
  "medicalSpecialty": {
    "@type": "MedicalSpecialty",
    "name": "Ginecologia e Ostetricia"
  },
  "availableService": [
    {"@type": "MedicalProcedure", "name": "Visita Ginecologica"},
    {"@type": "MedicalProcedure", "name": "Ecografia Ginecologica"},
    {"@type": "MedicalProcedure", "name": "Monitoraggio Follicolare"}
  ],
  "knowsAbout": [
    "Sindrome dell'ovaio policistico (PCOS)",
    "Menopausa",
    "Infertilità femminile"
  ]
}
```

---

### 3. MEDICALPROCEDURE (Pagina Prestazione)

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalProcedure",
  "@id": "https://bio-clinic.it/prestazioni/ecografia-ginecologica/#procedure",
  "name": "Ecografia Ginecologica",
  "alternateName": ["Ecografia pelvica transvaginale", "Ecografia TV"],
  "description": "Esame diagnostico non invasivo per visualizzare utero, ovaie e strutture pelviche.",
  "url": "https://bio-clinic.it/prestazioni/ecografia-ginecologica/",
  "procedureType": "http://schema.org/DiagnosticProcedure",
  "bodyLocation": "Pelvi femminile",
  "preparation": "Vescica moderatamente piena per transaddominale, vuota per transvaginale.",
  "howPerformed": "Sonda ecografica con gel conduttore per visualizzazione su monitor.",
  "relevantSpecialty": {
    "@type": "MedicalSpecialty",
    "name": "Ginecologia"
  },
  "indication": [
    {"@type": "MedicalIndication", "name": "Controllo ginecologico di routine"},
    {"@type": "MedicalIndication", "name": "Dolore pelvico"},
    {"@type": "MedicalIndication", "name": "Irregolarità mestruali"}
  ]
}
```

---

### 4. SLIM CARE (Percorso - MedicalTherapy)

```json
{
  "@context": "https://schema.org",
  "@type": ["MedicalTherapy", "MedicalProcedure"],
  "@id": "https://bio-clinic.it/percorsi/slim-care/#therapy",
  "name": "SLIM CARE - Percorso Medico Dimagrimento",
  "alternateName": ["Slim Care Bio-Clinic", "Percorso Obesità Sassari"],
  "description": "Prestazione sanitaria complessa di 3 mesi con farmaci Wegovy o Mounjaro, tecnologia VisBody 3D, visite specialistiche. Perdita media: 12-18 kg.",
  "url": "https://bio-clinic.it/percorsi/slim-care/",
  
  "medicalSpecialty": [
    {"@type": "MedicalSpecialty", "name": "Endocrinologia"},
    {"@type": "MedicalSpecialty", "name": "Nutrizione"},
    {"@type": "MedicalSpecialty", "name": "Medicina dello Sport"}
  ],
  
  "indication": [
    {"@type": "MedicalIndication", "name": "Obesità (BMI >= 30)"},
    {"@type": "MedicalIndication", "name": "Sovrappeso con comorbidità (BMI >= 27)"}
  ],
  
  "contraindication": [
    {"@type": "MedicalContraindication", "name": "Gravidanza"},
    {"@type": "MedicalContraindication", "name": "Allattamento"},
    {"@type": "MedicalContraindication", "name": "Carcinoma midollare tiroide"}
  ],
  
  "drug": [
    {
      "@type": "Drug",
      "name": "Wegovy",
      "activeIngredient": "Semaglutide",
      "drugClass": "Agonista GLP-1",
      "administrationRoute": "Iniezione sottocutanea",
      "availableStrength": ["0.5 mg", "1 mg", "1.7 mg", "2.4 mg"],
      "legalStatus": "Approvato AIFA, EMA, FDA"
    },
    {
      "@type": "Drug",
      "name": "Mounjaro",
      "activeIngredient": "Tirzepatide",
      "drugClass": "Agonista GIP/GLP-1",
      "administrationRoute": "Iniezione sottocutanea",
      "availableStrength": ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"],
      "legalStatus": "Approvato AIFA, EMA, FDA"
    }
  ],
  
  "usesDevice": {
    "@type": "MedicalDevice",
    "name": "VisBody 3D Body Scanner",
    "description": "Scanner 3D con BIA. 50+ parametri in 8 secondi.",
    "legalStatus": "Dispositivo medico certificato CE"
  },
  
  "howPerformed": "3 mesi: Mese 1 (esami, visita, VisBody, nutrizionista, farmaco), Mese 2 (monitoraggio), Mese 3 (valutazione finale, piano mantenimento).",
  
  "outcome": "Perdita peso media 12-18 kg. Wegovy: 10-15%. Mounjaro: 15-20%.",
  
  "duration": "P3M",
  
  "provider": {
    "@type": "MedicalClinic",
    "@id": "https://bio-clinic.it/#organization"
  }
}
```

---

### 5. FAQPAGE (Per pagine con FAQ)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Cos'è SLIM CARE?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SLIM CARE è un percorso medico di 3 mesi per perdere peso. Include: farmaco (Wegovy o Mounjaro), prima somministrazione assistita, 2 analisi sangue, 3 scansioni VisBody, 2 visite specialistiche, visita nutrizionale. Perdita media: 12-18 kg."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto peso si perde con SLIM CARE?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Perdita media 12-18 kg in 3 mesi. Wegovy: 10-15% del peso. Mounjaro: 15-20% del peso."
      }
    },
    {
      "@type": "Question",
      "name": "Chi può accedere a SLIM CARE?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Adulti con BMI >= 30 (obesità) o BMI >= 27 con comorbidità (diabete, ipertensione, dislipidemia)."
      }
    },
    {
      "@type": "Question",
      "name": "Dove si trova Bio-Clinic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Via Renzo Mossa 23, 07100 Sassari. Orari: Lun-Ven 07:00-21:00, Sab 08:00-14:00. Tel: 079 956 1332."
      }
    }
  ]
}
```

---

### 6. BREADCRUMBLIST (Per ogni pagina)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://bio-clinic.it/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Percorsi",
      "item": "https://bio-clinic.it/percorsi/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Slim Care",
      "item": "https://bio-clinic.it/percorsi/slim-care/"
    }
  ]
}
```

---

### 7. LOCALBUSINESS (Per Local SEO)

```json
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "MedicalBusiness"],
  "@id": "https://bio-clinic.it/#localbusiness",
  "name": "Bio-Clinic Sassari",
  "description": "Poliambulatorio medico a Sassari",
  "url": "https://bio-clinic.it",
  "telephone": "+39 079 956 1332",
  "priceRange": "€€",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Renzo Mossa, 23",
    "addressLocality": "Sassari",
    "addressRegion": "Sardegna",
    "postalCode": "07100",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.7310",
    "longitude": "8.5553"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "ratingCount": "3214"
  },
  "areaServed": [
    {"@type": "City", "name": "Sassari"},
    {"@type": "State", "name": "Sardegna"}
  ]
}
```

---

## GRAFO VISUALE DELLE RELAZIONI

```
                         ┌──────────────────────┐
                         │    BIO-CLINIC        │
                         │   (Organization)     │
                         │ ⭐ 3.214 recensioni  │
                         └──────────┬───────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   SPECIALITÀ    │     │     MEDICI       │     │    PERCORSI     │
│   (31 entità)   │     │   (60 entità)    │     │   (9 entità)    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │    ┌──────────────────┼───────────────────┐    │
         │    │                  │                   │    │
         ▼    ▼                  ▼                   ▼    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRESTAZIONI (1.840 entità)                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONDIZIONI (100+ entità)                     │
│  Obesità | PCOS | Infertilità | Menopausa | Ipertensione | ... │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TECNOLOGIE + FARMACI                         │
│  VisBody 3D Scanner | Wegovy | Mounjaro | Ecografi | RMN       │
└─────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTAZIONE TECNICA

### Dove inserire i markup Schema.org

| Tipo pagina | Schema principale | Schema secondari |
|-------------|-------------------|------------------|
| Homepage | Organization, MedicalClinic, LocalBusiness | AggregateRating |
| Specialità | MedicalWebPage, MedicalSpecialty | BreadcrumbList |
| Medico | Physician | BreadcrumbList, AggregateRating |
| Percorso | MedicalTherapy | FAQPage, BreadcrumbList, Drug |
| Prestazione | MedicalProcedure | BreadcrumbList |
| Check-up | Product, MedicalProcedure | BreadcrumbList, Offer |
| Blog | Article | BreadcrumbList, Author |
| Contatti | ContactPage | LocalBusiness |

### Formato implementazione

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { /* Organization */ },
    { /* BreadcrumbList */ },
    { /* MainEntity */ },
    { /* FAQPage se presente */ }
  ]
}
</script>
```

---

## VALIDAZIONE

### Strumenti
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Google Search Console**: Monitoraggio errori

### Checklist pre-lancio
- [ ] Ogni pagina ha almeno 1 schema primario
- [ ] BreadcrumbList su tutte le pagine (tranne homepage)
- [ ] FAQPage su pagine percorsi e specialità
- [ ] AggregateRating su Organization e Physician
- [ ] Tutti i link @id sono URL assoluti
- [ ] Nessun errore in Rich Results Test

---

## PROSSIMO STEP

**PUNTO 5: LINEE GUIDA PER AUTHORITY AI E SEO**

