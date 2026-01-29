# BIO-CLINIC: ARCHITETTURA DEL KNOWLEDGE GRAPH CLINICO

## PUNTO 2: PERCORSI CLINICI SCALABILI

---

## FILOSOFIA DEI PERCORSI

Un **percorso clinico** non è un pacchetto commerciale.
È una **sequenza logica di azioni mediche** che:
1. Parte da un **bisogno del paziente**
2. Attraversa **step diagnostici e terapeutici**
3. Arriva a un **outcome misurabile**
4. Prevede **follow-up e mantenimento**

Ogni percorso deve essere:
- **Clinicamente fondato** (evidence-based)
- **Economicamente scalabile** (high ticket con valore reale)
- **Semanticamente collegato** (grafo di conoscenza)
- **AI-readable** (comprensibile da LLM)

---

## PERCORSI IDENTIFICATI

| ID | Percorso | Target | Valore | Priorità |
|----|----------|--------|--------|----------|
| P1 | **SLIM CARE** | Obesità/Sovrappeso | ⭐⭐⭐⭐⭐ | MASSIMA |
| P2 | **SLIM CARE DONNA** | Menopausa/PCOS | ⭐⭐⭐⭐⭐ | MASSIMA |
| P3 | **PMA / FERTILITÀ** | Coppie infertili | ⭐⭐⭐⭐⭐ | MASSIMA |
| P4 | **SALUTE DONNA 360°** | Prevenzione femminile | ⭐⭐⭐⭐ | ALTA |
| P5 | **PREVENZIONE CARDIOVASCOLARE** | Rischio CV | ⭐⭐⭐⭐ | ALTA |
| P6 | **TIROIDE COMPLETO** | Patologia tiroidea | ⭐⭐⭐ | MEDIA |
| P7 | **PREVENZIONE ONCOLOGICA DONNA** | Screening tumori | ⭐⭐⭐⭐ | ALTA |
| P8 | **CHECK-UP UOMO** | Prevenzione maschile | ⭐⭐⭐ | MEDIA |
| P9 | **ALLERGOLOGIA INTEGRATA** | Allergie/Intolleranze | ⭐⭐⭐ | MEDIA |

---

# P1. PERCORSO SLIM CARE (Standard)

## Definizione Clinica
**Prestazione sanitaria complessa** per il trattamento medico dell'obesità e del sovrappeso, della durata di **3 mesi**, con farmaci di ultima generazione (Wegovy/Mounjaro) inclusi nel percorso.

## Target Paziente
- **BMI ≥ 30** (obesità)
- **BMI ≥ 27** con comorbidità (diabete tipo 2, ipertensione, dislipidemia)
- Pazienti con fallimento di diete precedenti
- Pazienti motivati a un cambiamento strutturato

## Outcome Atteso
- **Perdita peso: 12-18 kg in 3 mesi**
- Wegovy: 10-15% del peso corporeo
- Mounjaro: 15-20% del peso corporeo

## Team Clinico (AGGIORNATO)
| Ruolo | Specialista | Funzione |
|-------|-------------|----------|
| **Endocrinologo** | Dott. F. Tolu / Dott.ssa I. Aini | Valutazione metabolica, prescrizione farmaco |
| **Biologo Nutrizionista** | Dott.ssa A. Galatino / Dott. A. Pandolfi | Piano alimentare personalizzato |
| **Medico dello Sport** | Dott. G. Chiarelli | Certificato idoneità, piano attività |

> **NOTA:** Dott. Carlo Burrai è **Endocrinologo PEDIATRA** e non fa parte del Team Slim Care adulti.
> Per pazienti pediatrici con obesità, valutare percorso dedicato.

## Struttura del Percorso

### MESE 1: VALUTAZIONE E INIZIO
| Step | Prestazione | Codice interno | Obiettivo |
|------|-------------|----------------|-----------|
| 1.1 | Pack Esami Obesità | LAB-OBES-001 | Baseline metabolica completa |
| 1.2 | Prima Visita Endocrinologica | END-VIS-001 | Valutazione, indicazione farmaco |
| 1.3 | Certificato Medico Sportivo | SPORT-CERT-001 | Idoneità attività fisica |
| 1.4 | VisBody 3D + BIA (1°) | TECH-VIS-001 | 50+ parametri composizione corporea |
| 1.5 | Visita Nutrizionale | NUT-VIS-001 | Piano alimentare personalizzato |
| 1.6 | Farmaco + Prima Somministrazione | FARM-SOM-001 | Wegovy o Mounjaro + guida device |

### MESE 2: MONITORAGGIO
| Step | Prestazione | Codice interno | Obiettivo |
|------|-------------|----------------|-----------|
| 2.1 | Pack Esami Controllo | LAB-CTRL-001 | Monitoraggio metabolico |
| 2.2 | VisBody 3D + BIA (2°) | TECH-VIS-002 | Tracciamento progressi |
| 2.3 | Visita Endocrinologica Controllo | END-VIS-002 | Aggiustamento terapia |
| 2.4 | Supporto Telefonico | SUPP-TEL-001 | Assistenza continua |

### MESE 3: CONSOLIDAMENTO
| Step | Prestazione | Codice interno | Obiettivo |
|------|-------------|----------------|-----------|
| 3.1 | VisBody 3D + BIA (3°) | TECH-VIS-003 | Valutazione finale |
| 3.2 | Visita Risultati | END-VIS-003 | Analisi obiettivi raggiunti |
| 3.3 | Piano Mantenimento | NUT-MANT-001 | Strategia lungo termine |

## Tecnologia Inclusa
**VisBody 3D Body Scanner + BIA**
- Scansione ottica 3D + bioimpedenza
- 50+ parametri in 8 secondi
- Dispositivo medico certificato CE
- Parametri: massa grassa, massa muscolare, grasso viscerale, circonferenze, metabolismo basale

## Farmaci Disponibili
| Farmaco | Principio Attivo | Meccanismo | Dosaggi |
|---------|------------------|------------|---------|
| **Wegovy** | Semaglutide | Agonista GLP-1 | 0.5mg, 1mg, 1.7mg, 2.4mg |
| **Mounjaro** | Tirzepatide | Agonista GIP/GLP-1 | 2.5mg, 5mg, 7.5mg, 10mg, 12.5mg, 15mg |

## Cross-Selling Naturale
- → **Cardiologia** (screening cardiovascolare post-dimagrimento)
- → **Diabetologia** (gestione diabete tipo 2)
- → **Dermatologia** (trattamenti post-dimagrimento)
- → **Psicologia** (supporto comportamentale)

## FAQ Percorso
1. **Quanto costa Slim Care?** → [Prezzo da definire]
2. **Il farmaco è incluso?** → Sì, fornitura + prima somministrazione assistita
3. **Ogni quanto le iniezioni?** → 1 volta a settimana, praticamente indolori
4. **Chi può accedere?** → BMI ≥ 30 o BMI ≥ 27 con comorbidità
5. **I risultati sono garantiti?** → Perdita media 12-18 kg, risultati individuali variabili

---

# P2. PERCORSO SLIM CARE DONNA (Menopausa/PCOS)

## Definizione Clinica
Variante specializzata del percorso Slim Care per donne con **aumento ponderale correlato a squilibri ormonali**: menopausa o sindrome dell'ovaio policistico (PCOS).

## Target Paziente

### VARIANTE MENOPAUSA
- Donne 45-60 anni
- Aumento ponderale peri/post-menopausale
- Accumulo grasso viscerale
- Sindrome metabolica correlata a menopausa

### VARIANTE PCOS
- Donne 18-40 anni
- Diagnosi di sindrome ovaio policistico
- Insulino-resistenza
- Sovrappeso/obesità correlata a PCOS
- Eventuale desiderio di gravidanza (collegamento PMA)

## Team Clinico (Esteso)
| Ruolo | Specialista | Funzione |
|-------|-------------|----------|
| **Ginecologo** | **Dott. Francesco Dessole** | Valutazione ormonale, gestione menopausa/PCOS |
| Endocrinologo | Dott. F. Tolu / Dott.ssa I. Aini | Metabolismo, prescrizione farmaco |
| Biologo Nutrizionista | Dott.ssa A. Galatino / Dott. A. Pandolfi | Piano alimentare ormonale |
| Medico dello Sport | Dott. G. Chiarelli | Attività fisica adattata |

## Struttura del Percorso

### PRE-STEP: VALUTAZIONE GINECOLOGICA
| Step | Prestazione | Obiettivo |
|------|-------------|-----------|
| 0.1 | Visita Ginecologica | Valutazione stato ormonale |
| 0.2 | Ecografia Ginecologica | Morfologia ovarica (PCOS) |
| 0.3 | Pack Esami Ormonali | FSH, LH, Estradiolo, Progesterone, Testosterone, SHBG, AMH (PCOS) |

### MESE 1-3: PERCORSO SLIM CARE STANDARD
*(Come P1, con adattamenti specifici)*

### FOLLOW-UP GINECOLOGICO
| Step | Prestazione | Obiettivo |
|------|-------------|-----------|
| 4.1 | Visita Ginecologica Controllo | Rivalutazione ormonale |
| 4.2 | Ecografia Controllo | Monitoraggio ovarico |

## Valore Aggiunto
- Approccio **integrato endocrino-ginecologico**
- Comprensione delle **cause ormonali** del sovrappeso
- Per PCOS: possibile **collegamento con percorso PMA** se desiderio di gravidanza

## Cross-Selling Naturale
- → **PMA/Fertilità** (per PCOS con desiderio gravidanza)
- → **Salute Donna 360°** (prevenzione completa)
- → **Cardiologia** (rischio CV in menopausa)
- → **MOC/Densitometria** (osteoporosi in menopausa)

---

# P3. PERCORSO PMA / FERTILITÀ

## Definizione Clinica
Percorso diagnostico e terapeutico per coppie con difficoltà di concepimento. Include valutazione di entrambi i partner, diagnostica avanzata e supporto ai trattamenti di procreazione medicalmente assistita.

## Target Paziente
- Coppie con infertilità (>12 mesi di rapporti non protetti senza concepimento)
- Donne >35 anni che desiderano gravidanza
- Pazienti con PCOS e desiderio di gravidanza
- Pazienti con endometriosi
- Coppie con aborti ricorrenti

## Team Clinico
| Ruolo | Specialista | Funzione |
|-------|-------------|----------|
| Ginecologo PMA | Dott. S. Dessole / Dott. F. Dessole / Dott. M. Petrillo | Valutazione fertilità, monitoraggi |
| Ostetrica | Dott.ssa A. Fois | Supporto percorso gravidanza |
| **Ostetrica** | **Camilla Ruzzoli** | Supporto percorso gravidanza |
| Biologo | Dott.ssa C. Guarino / Dott.ssa G. Reggiani | Analisi seminale, embriologia |
| Psicologo | Dott.ssa A. Piras / Dott.ssa A. Trabacco | Supporto emotivo coppia |

## Struttura del Percorso

### FASE 1: VALUTAZIONE COPPIA
| Step | Prestazione | Partner | Obiettivo |
|------|-------------|---------|-----------|
| 1.1 | Consulenza Sterilità | Coppia | Anamnesi, pianificazione |
| 1.2 | Visita Ginecologica | F | Valutazione apparato riproduttivo |
| 1.3 | Ecografia Ginecologica TV | F | Riserva ovarica, morfologia uterina |
| 1.4 | Pack Esami Fertilità Femminile | F | FSH, LH, AMH, Estradiolo, Progesterone, TSH, PRL |
| 1.5 | Spermiogramma | M | Analisi liquido seminale |
| 1.6 | Visita Andrologica | M | Valutazione fertilità maschile |
| 1.7 | Pack Esami Fertilità Maschile | M | Ormonali, infettivologici |

### FASE 2: DIAGNOSTICA AVANZATA (se necessaria)
| Step | Prestazione | Indicazione |
|------|-------------|-------------|
| 2.1 | Isteroscopia Diagnostica | Sospetta patologia uterina |
| 2.2 | Sonoisterografia | Valutazione cavità uterina |
| 2.3 | Post Coital Test | Valutazione muco cervicale |
| 2.4 | ENDOBIOME | Analisi microbioma endometriale |
| 2.5 | ENDORECEPT | Test recettività endometriale |
| 2.6 | Spermiocoltura | Sospetta infezione |
| 2.7 | TUNEL Test | Frammentazione DNA spermatico |

### FASE 3: MONITORAGGIO FOLLICOLARE
| Step | Prestazione | Timing |
|------|-------------|--------|
| 3.1 | 1° Monitoraggio Follicolare | Giorno 8-10 ciclo |
| 3.2 | 2° Monitoraggio Follicolare | Giorno 12-14 ciclo |
| 3.3 | Monitoraggi Successivi | Secondo necessità |

### FASE 4: DIAGNOSTICA PRENATALE (post-concepimento)
| Step | Prestazione | Settimana |
|------|-------------|-----------|
| 4.1 | Test Combinato (Bitest) | 11-13 |
| 4.2 | PrenatalAdvance (NIPT) | 10+ |
| 4.3 | Ecografia Ostetrica | 12, 20, 32 |
| 4.4 | Fetal DNA | 10+ |

## Test Genetici Disponibili
| Test | Descrizione |
|------|-------------|
| PrenatalAdvance 3 | Trisomie 21, 18, 13 |
| PrenatalAdvance 5 | + Trisomie sessuali |
| PrenatalAdvance Karyo | Cariotipo fetale |
| PrenatalAdvance Genetics | Microdelezioni |
| PrenatalAdvance Genetics Plus | Pannello esteso |
| PrenatalAdvance Omnia | Completo |
| BRCA Plus | Rischio oncologico ereditario |

## Cross-Selling Naturale
- → **Slim Care PCOS** (se sovrappeso/PCOS)
- → **Psicologia** (supporto emotivo)
- → **Ostetricia** (gravidanza)
- → **Pediatria** (post-nascita)

---

# P4. PERCORSO SALUTE DONNA 360°

## Definizione Clinica
Programma di prevenzione completa per la salute femminile, modulare per fasce d'età, che integra ginecologia, senologia, cardiologia e screening oncologici.

## Target Paziente
- Tutte le donne dai 18 anni
- Modulato per fasce d'età
- Prevenzione primaria e secondaria

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| Ginecologo | Équipe Ginecologia (6 specialisti) |
| Senologo | Dott.ssa S. Bove |
| Cardiologo | Équipe Cardiologia (5 specialisti) |
| Endocrinologo | Équipe Endocrinologia |
| Dermatologo | Équipe Dermatologia |

## Struttura Modulare per Età

### MODULO 18-30 ANNI
| Prestazione | Frequenza |
|-------------|-----------|
| Visita Ginecologica | Annuale |
| Pap Test / HPV Test | Ogni 3 anni (da 25 anni) |
| Ecografia Pelvica | Annuale |
| Check-up Esami Base | Annuale |

### MODULO 30-40 ANNI
| Prestazione | Frequenza |
|-------------|-----------|
| Visita Ginecologica | Annuale |
| Pap Test + HPV | Ogni 3 anni |
| Ecografia Mammaria | Annuale |
| Ecografia Pelvica | Annuale |
| Check-up Tiroide | Ogni 2 anni |
| Mappatura Nei | Ogni 2 anni |

### MODULO 40-50 ANNI
| Prestazione | Frequenza |
|-------------|-----------|
| Visita Ginecologica | Annuale |
| Pap Test + HPV | Ogni 3 anni |
| Mammografia + Ecografia | Annuale |
| Visita Senologica | Annuale |
| Check-up Cardiovascolare | Ogni 2 anni |
| MOC Densitometria | Baseline a 45 anni |

### MODULO 50+ ANNI
| Prestazione | Frequenza |
|-------------|-----------|
| Visita Ginecologica | Annuale |
| Mammografia + Ecografia | Annuale |
| Visita Senologica | Annuale |
| Check-up Cardiovascolare | Annuale |
| MOC Densitometria | Ogni 2 anni |
| Ecografia Addome Completo | Ogni 2 anni |
| Colonscopia Virtuale/Tradizionale | Ogni 5 anni |

## Cross-Selling Naturale
- → **Slim Care Donna** (se sovrappeso/menopausa)
- → **Cardiologia Avanzata** (se fattori di rischio)
- → **Genetica Oncologica** (se familiarità)

---

# P5. PERCORSO PREVENZIONE CARDIOVASCOLARE

## Definizione Clinica
Programma scalabile di prevenzione e diagnosi precoce delle malattie cardiovascolari, strutturato in livelli di approfondimento crescente.

## Target Paziente
- Adulti >40 anni
- Pazienti con fattori di rischio (fumo, diabete, ipertensione, dislipidemia, familiarità)
- Pazienti obesi (collegamento Slim Care)
- Sportivi (certificazione agonistica)

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| Cardiologo | Dott. T. Bullitta, Dott.ssa S. Uras, Dott.ssa G. Guagnozzi, Dott. P. Pischedda, Dott. P. Franca |
| Chirurgo Vascolare | Dott.ssa P. Dettori, Dott. R. Mancino |
| Medico dello Sport | Dott. G. Chiarelli |

## Struttura Scalabile

### LIVELLO 1: CHECK-UP CARDIACO BASE
| Prestazione | Obiettivo |
|-------------|-----------|
| Visita Cardiologica | Anamnesi, esame obiettivo |
| ECG | Attività elettrica cardiaca |
| Screening Esami Cardiovascolare Base | Colesterolo, trigliceridi, glicemia |

### LIVELLO 2: CHECK-UP CARDIACO BASE +
| Prestazione | Obiettivo |
|-------------|-----------|
| *Tutto Livello 1* | |
| Ecocardiogramma | Morfologia e funzione cardiaca |

### LIVELLO 3: CHECK-UP CARDIACO AVANZATO
| Prestazione | Obiettivo |
|-------------|-----------|
| *Tutto Livello 2* | |
| Ecocolordoppler TSA | Carotidi, rischio ictus |

### LIVELLO 4: CHECK-UP CARDIACO AVANZATO +
| Prestazione | Obiettivo |
|-------------|-----------|
| *Tutto Livello 3* | |
| Test da Sforzo (ECG sotto sforzo) | Riserva coronarica |

### LIVELLO 5: SCREENING VASCOLARE COMPLETO
| Prestazione | Obiettivo |
|-------------|-----------|
| *Tutto Livello 4* | |
| Ecocolordoppler Aorta Addominale | Aneurisma aortico |
| Ecocolordoppler Arti Inferiori | Arteriopatia periferica |
| Holter ECG 24h | Aritmie |
| Holter Pressorio 24h (ABPM) | Ipertensione |

## Cross-Selling Naturale
- → **Slim Care** (se obesità)
- → **Diabetologia** (se diabete)
- → **Nefrologia** (se ipertensione severa)
- → **Neurologia** (se TIA/ictus)

---

# P6. PERCORSO TIROIDE COMPLETO

## Definizione Clinica
Percorso diagnostico-terapeutico per patologie tiroidee, dallo screening alla gestione delle tireopatie.

## Target Paziente
- Pazienti con sintomi tiroidei (astenia, variazioni peso, intolleranza termica)
- Familiarità per tireopatie
- Donne in gravidanza/pianificazione
- Pazienti con noduli tiroidei

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| Endocrinologo | Dott. F. Tolu, Dott.ssa I. Aini |
| Radiologo | Studio Urigo (RMN se necessaria) |

## Struttura del Percorso

### FASE 1: SCREENING
| Prestazione | Obiettivo |
|-------------|-----------|
| Check-up Tiroide Base | TSH, FT3, FT4 |
| Visita Endocrinologica | Valutazione clinica |

### FASE 2: APPROFONDIMENTO
| Prestazione | Indicazione |
|-------------|-------------|
| Check-up Tiroide Plus | + AbTPO, AbTG, Tireoglobulina |
| Ecografia Tiroidea | Morfologia, noduli |
| Visita Endocrinologica + Ecografia | Valutazione integrata |

### FASE 3: DIAGNOSTICA INTERVENTISTICA
| Prestazione | Indicazione |
|-------------|-------------|
| Agoaspirato Tiroideo | Noduli sospetti (TIRADS 4-5) |
| Agoaspirato + Esame Citologico | Diagnosi istologica |

### FASE 4: FOLLOW-UP
| Prestazione | Frequenza |
|-------------|-----------|
| Controllo Esami Tiroidei | Ogni 3-6 mesi |
| Ecografia Controllo | Ogni 6-12 mesi |
| Visita Endocrinologica Controllo | Ogni 6 mesi |

## Cross-Selling Naturale
- → **Slim Care** (se ipotiroidismo con sovrappeso)
- → **Cardiologia** (se ipertiroidismo)
- → **Ginecologia** (se gravidanza/infertilità)

---

# P7. PERCORSO PREVENZIONE ONCOLOGICA DONNA

## Definizione Clinica
Programma di screening e prevenzione dei tumori femminili più frequenti: mammella, cervice uterina, ovaio.

## Target Paziente
- Tutte le donne dai 25 anni (cervice)
- Tutte le donne dai 40 anni (mammella)
- Donne con familiarità oncologica
- Portatrici mutazioni BRCA

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| Senologo | Dott.ssa S. Bove |
| Ginecologo | Équipe Ginecologia |
| Genetista | Laboratorio (BRCA) |
| Radiologo | Studio Urigo (Mammografia, RMN) |
| Consulente IOC | Istituto Oncologico Candiolo |

## Struttura del Percorso

### SCREENING CERVICE UTERINA
| Prestazione | Età | Frequenza |
|-------------|-----|-----------|
| Pap Test Screening | 25-30 | Ogni 3 anni |
| HPV Test + Pap Test | 30-65 | Ogni 5 anni |
| Colposcopia | Se anomalie | |

### SCREENING MAMMELLA
| Prestazione | Età | Frequenza |
|-------------|-----|-----------|
| Ecografia Mammaria | 30-40 | Annuale |
| Mammografia | 40+ | Annuale |
| Visita Senologica | 40+ | Annuale |
| RMN Mammaria | Alto rischio | Annuale |

### SCREENING GENETICO
| Test | Indicazione |
|------|-------------|
| BRCA Plus | Familiarità mammella/ovaio |
| Onco Advance Risk Breast | Pannello esteso |
| Consulenza Genetica | Interpretazione risultati |

### SE POSITIVITÀ/ANOMALIE
| Prestazione | Indicazione |
|-------------|-------------|
| Agoaspirato Mammario Ecoguidato | Noduli sospetti |
| Biopsia | Conferma diagnostica |
| Consulenza IOC Candiolo | Secondo parere oncologico |

## Cross-Selling Naturale
- → **Psicologia** (supporto diagnosi)
- → **Genetica familiare** (screening parenti)

---

# P8. PERCORSO CHECK-UP UOMO

## Definizione Clinica
Programma di prevenzione maschile modulare per età, focalizzato su prostata, cuore, metabolismo.

## Target Paziente
- Uomini dai 40 anni
- Modulato per fasce d'età

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| Urologo/Andrologo | Dott. C. Cambara |
| Cardiologo | Équipe Cardiologia |
| Endocrinologo | Équipe Endocrinologia |

## Struttura Modulare

### CHECK-UP UOMO UNDER 40
| Prestazione |
|-------------|
| Check-up Esami Base |
| Visita Urologica |
| Ecografia Scrotale |

### CHECK-UP UOMO 40-50
| Prestazione |
|-------------|
| Check-up Esami + PSA |
| Visita Urologica |
| Ecografia Prostatica |
| Visita Cardiologica + ECG |

### CHECK-UP UOMO OVER 50
| Prestazione |
|-------------|
| Check-up Esami Completo |
| PSA Totale + Libero |
| Visita Urologica |
| Ecografia Prostatica Transrettale |
| Uroflussometria |
| Check-up Cardiaco Base + |
| Ecografia Addome Completo |

## Cross-Selling Naturale
- → **Slim Care** (se sovrappeso)
- → **Andrologia** (se disfunzione erettile/infertilità)
- → **Cardiologia Avanzata** (se fattori di rischio)

---

# P9. PERCORSO ALLERGOLOGIA INTEGRATA

## Definizione Clinica
Percorso diagnostico per allergie respiratorie, alimentari, da contatto e patologie immunologiche.

## Target Paziente
- Pazienti con sintomi allergici (rinite, asma, orticaria, dermatite)
- Sospette intolleranze alimentari
- Reazioni avverse a farmaci/alimenti
- Patologie autoimmuni

## Team Clinico
| Ruolo | Specialista |
|-------|-------------|
| **Allergologo/Immunologo** | **Dott.ssa C.M. Deiana** |
| Dermatologo | Équipe Dermatologia |
| Pneumologo | Dott. P. Pirina, Dott.ssa S.S. Fois |
| Gastroenterologo | Dott. A. Deplano |

## Struttura del Percorso

### FASE 1: VALUTAZIONE
| Prestazione | Obiettivo |
|-------------|-----------|
| Visita Allergologica | Anamnesi allergologica |
| IgE Totali | Stato atopico |

### FASE 2: DIAGNOSTICA SPECIFICA
| Prestazione | Indicazione |
|-------------|-------------|
| Prick Test Inalanti (24/25 allergeni) | Allergie respiratorie |
| Prick Test Alimenti (32 allergeni) | Allergie alimentari |
| Patch Test (3 giorni) | Dermatite da contatto |
| RAST specifici | Conferma/approfondimento |
| IgE Specifiche (200+ allergeni disponibili) | Pannello personalizzato |

### FASE 3: APPROFONDIMENTI SPECIALISTICI
| Prestazione | Indicazione |
|-------------|-------------|
| Spirometria | Asma allergico |
| Visita Pneumologica | Patologia respiratoria |
| Visita Dermatologica | Dermatite atopica/contatto |
| Gastropanel | Intolleranze GI |

### FASE 4: FOLLOW-UP
| Prestazione | Obiettivo |
|-------------|-----------|
| Visita Allergologica Controllo | Monitoraggio terapia |
| Ripetizione test | Verifica sensibilizzazione |

## Cross-Selling Naturale
- → **Dermatologia** (dermatite atopica)
- → **Pneumologia** (asma)
- → **Gastroenterologia** (intolleranze)
- → **Laboratorio** (pannelli IgE estesi)

---

## SINTESI PERCORSI

| Percorso | Prestazioni coinvolte | Specialisti | Valore stimato |
|----------|----------------------|-------------|----------------|
| **P1 Slim Care** | ~15 | 5 | €€€€ |
| **P2 Slim Care Donna** | ~18 | 6 | €€€€€ |
| **P3 PMA/Fertilità** | ~20+ | 6 | €€€€€ |
| **P4 Salute Donna 360°** | 10-15 | 8 | €€€ |
| **P5 Cardiovascolare** | 5-12 | 7 | €€-€€€€ |
| **P6 Tiroide** | 5-8 | 2 | €€ |
| **P7 Oncologica Donna** | 6-10 | 5 | €€€ |
| **P8 Check-up Uomo** | 6-12 | 4 | €€-€€€ |
| **P9 Allergologia** | 8-15 | 4 | €€€ |

---

## GRAFO DELLE CONNESSIONI TRA PERCORSI

```
                    ┌─────────────────┐
                    │   LABORATORIO   │
                    │  (Hub Centrale) │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│  SLIM CARE  │◄──►│ SLIM CARE DONNA │◄──►│ PMA/FERTIL. │
│  (Standard) │    │ (Menop./PCOS)   │    │             │
└──────┬──────┘    └────────┬────────┘    └──────┬──────┘
       │                    │                    │
       │                    ▼                    │
       │           ┌─────────────────┐           │
       └──────────►│ SALUTE DONNA    │◄──────────┘
                   │     360°        │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
     ┌─────────────┐ ┌───────────┐ ┌───────────────┐
     │ CARDIO-     │ │  TIROIDE  │ │  ONCOLOGICA   │
     │ VASCOLARE   │ │           │ │    DONNA      │
     └──────┬──────┘ └───────────┘ └───────────────┘
            │
            ▼
     ┌─────────────┐
     │ CHECK-UP    │
     │   UOMO      │
     └─────────────┘
```

---

**PROSSIMO STEP: PUNTO 3 - STRUTTURA IDEALE DELLE PAGINE DEL SITO**

