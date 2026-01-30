#!/usr/bin/env node
/**
 * BIO-CLINIC DEEP DIVE PAGE GENERATOR
 * Genera pagine specialistiche di altissimo livello con contenuto medico reale
 * Modello "Wikipedia della Salute a Sassari"
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// DEEP DATA - IL "CERVELLO CLINICO" COMPLETO
// ============================================================================
const DEEP_DATA = {
  
  // =========================================================================
  // CARDIOLOGIA
  // =========================================================================
  "Cardiologia": {
    "files": ["visita-cardiologica-ecg.html", "ecocardiogramma.html", "holter-ecg.html", "holter-pressorio.html"],
    "color": "#E53935",
    "colorLight": "#FFEBEE",
    "icon_hero": "fa-heart-pulse",
    "title_main": "Cardiologia",
    "title_accent": "Clinica & Sportiva",
    "hero_desc": "Non ignorare palpitazioni, affanno o dolori toracici. In Bio-Clinic eseguiamo la visita completa di ECG ed Ecocardiogramma in un'unica seduta, con refertazione immediata del cardiologo.",
    "sintomi_groups": [
      { 
        title: "Ritmo & Dolore", 
        icon: "fa-heartbeat",
        list: ["Aritmie e Palpitazioni", "Dolore toracico a riposo o sotto sforzo", "Tachicardia notturna", "Battiti irregolari"] 
      },
      { 
        title: "Pressione & Respiro", 
        icon: "fa-lungs",
        list: ["Ipertensione arteriosa", "Affanno sotto sforzo (dispnea)", "Gonfiore alle caviglie (edemi)", "Stanchezza inspiegabile"] 
      },
      { 
        title: "Prevenzione & Sport", 
        icon: "fa-shield-heart",
        list: ["Screening cardiologico sportivo", "Familiarità per infarto/ictus", "Controllo post-COVID", "Check-up over 40"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "ECG a 12 Derivazioni", 
        desc: "Primo screening fondamentale eseguito immediatamente in visita. Rileva aritmie, ischemie pregresse e anomalie della conduzione elettrica." 
      },
      { 
        num: "02", 
        title: "Ecocardiogramma Color Doppler", 
        desc: "Visualizzazione diretta del cuore in movimento: valvole, pareti, flusso sanguigno. Diagnosi di stenosi, insufficienze e cardiomiopatie." 
      },
      { 
        num: "03", 
        title: "Test da Sforzo (Treadmill Schiller)", 
        desc: "Valutazione della risposta cardiaca all'esercizio su tapis roulant di livello ospedaliero. Indispensabile per idoneità sportiva agonistica." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare esami del sangue recenti (colesterolo, glicemia, creatinina)",
      "Portare lista completa dei farmaci assunti",
      "Abbigliamento comodo per ECG ed eventuale test da sforzo",
      "Non sospendere farmaci salvo diversa indicazione"
    ],
    "faq": [
      { q: "L'ECG è incluso nella visita cardiologica?", a: "Sì, sempre. La visita cardiologica Bio-Clinic include di default l'elettrocardiogramma a 12 derivazioni con referto immediato." },
      { q: "Fate il test da sforzo per idoneità sportiva?", a: "Sì, disponiamo di Treadmill Schiller per test massimali secondo protocollo Bruce. Rilasciamo certificati per attività agonistica." },
      { q: "Posso fare la visita con il pacemaker?", a: "Assolutamente sì. Segnalalo all'accettazione per una gestione ottimale. Eseguiamo anche controlli pacemaker." }
    ],
    "cross_sell": "Loop Clinico immediato: se necessario, eseguiamo Troponina, BNP, Profilo Lipidico e PT/INR durante la visita grazie al laboratorio interno.",
    "durata": "30-45 minuti (con ECG)"
  },

  // =========================================================================
  // GINECOLOGIA
  // =========================================================================
  "Ginecologia": {
    "files": ["visita-ginecologica.html", "ecografia-transvaginale.html", "pap-test.html", "ecografia-pelvica.html", "ecografia-mammaria.html", "isteroscopia.html", "riabilitazione-pavimento-pelvico.html"],
    "color": "#E91E63",
    "colorLight": "#FCE4EC",
    "icon_hero": "fa-venus",
    "title_main": "Ginecologia",
    "title_accent": "& Ostetricia",
    "hero_desc": "La salute femminile merita un'attenzione speciale. Ecografi Voluson™ E10 4D, colposcopia digitale HD e un team di 7 ginecologi per accompagnarti in ogni fase della vita.",
    "sintomi_groups": [
      { 
        title: "Ciclo & Dolore", 
        icon: "fa-calendar-days",
        list: ["Ciclo irregolare o doloroso", "Spotting intermestruale", "Dolore pelvico cronico", "Sindrome premestruale severa"] 
      },
      { 
        title: "Menopausa & Prevenzione", 
        icon: "fa-shield-virus",
        list: ["Vampate e sudorazioni notturne", "Secchezza vaginale", "Screening HPV e Pap-Test", "Prevenzione tumore cervice"] 
      },
      { 
        title: "Fertilità & Gravidanza", 
        icon: "fa-baby",
        list: ["Ricerca gravidanza", "Monitoraggio ovulazione", "Ecografia ostetrica", "Consulto PMA"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografo Voluson™ E10 4D", 
        desc: "Imaging ginecologico e ostetrico di ultima generazione. Visualizzazione 3D/4D del feto, studio dettagliato di utero e ovaie." 
      },
      { 
        num: "02", 
        title: "Videocolposcopio Digitale HD", 
        desc: "Ingrandimento fino a 40x per l'esame della cervice. Biopsia mirata in caso di lesioni sospette con referto istologico rapido." 
      },
      { 
        num: "03", 
        title: "Laboratorio Ormonale Integrato", 
        desc: "Dosaggi FSH, LH, Estradiolo, Progesterone, AMH con referto in giornata per calibrare terapie e monitorare fertilità." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Evitare rapporti sessuali nelle 24-48h precedenti (se previsto Pap-Test)",
      "Non usare ovuli o lavande vaginali nei 2 giorni prima",
      "Preferibilmente lontano dal ciclo mestruale",
      "Portare referti ginecologici precedenti"
    ],
    "faq": [
      { q: "Fate l'ecografia durante la visita?", a: "Sì, sempre. Ogni ambulatorio ginecologico è dotato di ecografo interno per la valutazione immediata transvaginale o sovrapubica." },
      { q: "Posso venire durante il ciclo?", a: "Per la visita semplice sì. Per il Pap-Test e la colposcopia è preferibile attendere la fine del ciclo mestruale." },
      { q: "Offrite percorsi per la fertilità (PMA)?", a: "Sì, abbiamo un team dedicato alla Procreazione Medicalmente Assistita con monitoraggi ecografici, dosaggi ormonali e consulenze specialistiche." }
    ],
    "cross_sell": "Integrazione con il Laboratorio per dosaggi ormonali (FSH, LH, Estradiolo, AMH) con referto in giornata e protocolli Slim Care Donna per il benessere femminile.",
    "durata": "20-30 minuti"
  },

  // =========================================================================
  // DERMATOLOGIA
  // =========================================================================
  "Dermatologia": {
    "files": ["visita-dermatologica.html", "mappatura-nevi.html"],
    "color": "#8E24AA",
    "colorLight": "#F3E5F5",
    "icon_hero": "fa-hand-dots",
    "title_main": "Dermatologia",
    "title_accent": "Chirurgica & Oncologica",
    "hero_desc": "La pelle è il tuo scudo. Non sottovalutare macchie o nevi che cambiano. Mappatura digitale in epiluminescenza con AI e piccola chirurgia ambulatoriale in sede.",
    "sintomi_groups": [
      { 
        title: "Nei & Tumori Cutanei", 
        icon: "fa-circle-dot",
        list: ["Nei che cambiano forma o colore", "Macchie solari sospette", "Melanoma e prevenzione", "Cheratosi attiniche"] 
      },
      { 
        title: "Infiammazioni & Allergie", 
        icon: "fa-fire",
        list: ["Acne giovanile e adulta", "Psoriasi e dermatiti", "Orticaria e allergie cutanee", "Rosacea"] 
      },
      { 
        title: "Chirurgia & Estetica", 
        icon: "fa-scissors",
        list: ["Cisti sebacee", "Verruche e condilomi", "Fibromi penduli", "Cicatrici e cheloidi"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Videodermatoscopio Digitale", 
        desc: "Mappatura digitale con ingrandimento 40x e archiviazione immagini. Confronto nel tempo per monitorare l'evoluzione dei nevi." 
      },
      { 
        num: "02", 
        title: "Intelligenza Artificiale Diagnostica", 
        desc: "Software di supporto alla diagnosi per identificare pattern sospetti e migliorare l'accuratezza dello screening oncologico." 
      },
      { 
        num: "03", 
        title: "Sala Chirurgica Ambulatoriale", 
        desc: "Asportazione immediata di lesioni sospette in anestesia locale. Invio per esame istologico con referto rapido." 
      }
    ],
    "prep_title": "Info Utili",
    "prep_list": [
      "Non truccare il viso se la visita riguarda il volto",
      "Evitare autoabbronzanti nei giorni precedenti",
      "Portare referti istologici precedenti",
      "Segnalare allergie agli anestetici locali"
    ],
    "faq": [
      { q: "Se c'è un neo sospetto, lo togliete subito?", a: "Sì, se clinicamente indicato possiamo procedere all'asportazione ambulatoriale nella stessa seduta con esame istologico." },
      { q: "La mappatura dei nei è dolorosa?", a: "Assolutamente no. È un esame fotografico digitale completamente non invasivo che permette di archiviare e confrontare le immagini nel tempo." },
      { q: "Fate trattamenti estetici per macchie e cicatrici?", a: "Sì, trattiamo macchie solari, cicatrici e inestetismi con laser, crioterapia e peeling chimici." }
    ],
    "cross_sell": "Possibilità di piccola chirurgia ambulatoriale immediata con esame istologico rapido. Collaborazione con oncologia per casi complessi.",
    "durata": "20-30 minuti"
  },

  // =========================================================================
  // UROLOGIA
  // =========================================================================
  "Urologia": {
    "files": ["visita-urologica.html", "ecografia-prostatica.html"],
    "color": "#FF7043",
    "colorLight": "#FBE9E7",
    "icon_hero": "fa-person",
    "title_main": "Urologia",
    "title_accent": "& Andrologia",
    "hero_desc": "La prevenzione urologica non è più un tabù. Ecografia prostatica transrettale, uroflussometria wireless e dosaggio PSA in sede per una diagnosi completa e discreta.",
    "sintomi_groups": [
      { 
        title: "Prostata & Minzione", 
        icon: "fa-droplet",
        list: ["Difficoltà a urinare (disuria)", "Minzione frequente notturna", "Getto debole o interrotto", "Sensazione di svuotamento incompleto"] 
      },
      { 
        title: "Dolore & Infezioni", 
        icon: "fa-triangle-exclamation",
        list: ["Bruciore durante la minzione", "Sangue nelle urine (ematuria)", "Dolore lombare o pelvico", "Infezioni urinarie ricorrenti"] 
      },
      { 
        title: "Andrologia & Fertilità", 
        icon: "fa-mars",
        list: ["Disfunzione erettile", "Eiaculazione precoce", "Infertilità maschile", "Varicocele"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografia Prostatica Transrettale", 
        desc: "Visualizzazione dettagliata della prostata per misurarne il volume e identificare noduli sospetti. Guida per eventuali biopsie." 
      },
      { 
        num: "02", 
        title: "Uroflussometria Wireless", 
        desc: "Misurazione del flusso urinario in modo discreto e non invasivo. Diagnosi di ostruzioni e ipertrofia prostatica benigna." 
      },
      { 
        num: "03", 
        title: "PSA Totale e Libero in Sede", 
        desc: "Dosaggio del marcatore prostatico direttamente nel nostro laboratorio prima della visita. Risultati in giornata." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Presentarsi a vescica piena per l'ecografia sovrapubica",
      "Per l'ecografia transrettale: clistere 2h prima",
      "Portare esami PSA precedenti se disponibili",
      "Non eiaculare nelle 48h precedenti il dosaggio PSA"
    ],
    "faq": [
      { q: "L'esame della prostata è obbligatorio?", a: "L'esplorazione rettale è a discrezione del medico, ma è il metodo più rapido e sicuro per la prevenzione dopo i 50 anni. È indolore e dura pochi secondi." },
      { q: "Trattate anche problemi di erezione?", a: "Sì, l'andrologia è parte integrante del nostro servizio. Trattiamo disfunzione erettile, eiaculazione precoce e infertilità maschile con approccio multidisciplinare." },
      { q: "Posso fare il PSA lo stesso giorno della visita?", a: "Sì, il nostro laboratorio interno può eseguire il dosaggio PSA Totale e Libero prima della visita con risultati in giornata." }
    ],
    "cross_sell": "Dosaggio PSA Totale/Libero e Urinocoltura eseguiti direttamente prima della visita. Collaborazione con oncologia per casi complessi.",
    "durata": "20-25 minuti"
  },

  // =========================================================================
  // OCULISTICA
  // =========================================================================
  "Oculistica": {
    "files": ["campo-visivo.html"], // visita-oculistica già aggiornata manualmente
    "color": "#0288D1",
    "colorLight": "#E1F5FE",
    "icon_hero": "fa-eye",
    "title_main": "Oculistica",
    "title_accent": "& Oftalmologia",
    "hero_desc": "La vista è il senso più prezioso. OCT Cirrus HD per la retina, Campo Visivo Humphrey per il glaucoma e Tonometria per la pressione oculare. Tutto in sede.",
    "sintomi_groups": [
      { 
        title: "Vista & Rifrazione", 
        icon: "fa-glasses",
        list: ["Calo della vista improvviso o graduale", "Visione offuscata", "Difficoltà nella lettura", "Affaticamento visivo"] 
      },
      { 
        title: "Glaucoma & Retina", 
        icon: "fa-bullseye",
        list: ["Mosche volanti (miodesopsie)", "Lampi di luce (fotopsie)", "Visione a tunnel", "Pressione oculare elevata"] 
      },
      { 
        title: "Superficie & Comfort", 
        icon: "fa-droplet",
        list: ["Occhio rosso cronico", "Secchezza oculare", "Bruciore e lacrimazione", "Intolleranza alle lenti a contatto"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "OCT - Tomografia a Coerenza Ottica", 
        desc: "Scansione 3D della retina e del nervo ottico. Diagnosi precoce di maculopatia, glaucoma e retinopatia diabetica." 
      },
      { 
        num: "02", 
        title: "Campo Visivo Computerizzato Humphrey", 
        desc: "Mappatura completa della visione periferica. Gold standard per diagnosi e monitoraggio del glaucoma." 
      },
      { 
        num: "03", 
        title: "Tonometria (Soffio e Contatto)", 
        desc: "Misurazione della pressione intraoculare con metodo a soffio (non invasivo) e a contatto (gold standard)." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare gli occhiali attualmente in uso",
      "Non indossare lenti a contatto il giorno dell'esame",
      "Se prevista dilatazione pupillare, non guidare al ritorno",
      "Portare referti oculistici precedenti"
    ],
    "faq": [
      { q: "Mi metterete le gocce per dilatare la pupilla?", a: "Solo se necessario per l'esame del fondo oculare. L'effetto dura 2-3 ore durante le quali è sconsigliato guidare." },
      { q: "Visitate anche i bambini?", a: "Sì, eseguiamo screening ortottici pediatrici a partire dai 3 anni per individuare precocemente ambliopia e strabismo." },
      { q: "Fate OCT e Campo Visivo in sede?", a: "Sì, disponiamo di OCT Cirrus HD e Campimetro Humphrey per diagnosi complete senza necessità di rivolgersi ad altre strutture." }
    ],
    "cross_sell": "Screening Retinopatia integrato con il percorso Diabetologico ed Endocrinologico. Fondo Oculare per pazienti ipertesi in collaborazione con Cardiologia.",
    "durata": "30-40 minuti"
  },

  // =========================================================================
  // NEUROLOGIA
  // =========================================================================
  "Neurologia": {
    "files": ["visita-neurologica.html", "elettromiografia.html"],
    "color": "#5C6BC0",
    "colorLight": "#E8EAF6",
    "icon_hero": "fa-brain",
    "title_main": "Neurologia",
    "title_accent": "& Neurofisiologia",
    "hero_desc": "Il sistema nervoso merita specialisti dedicati. Elettromiografia multicanale, valutazione delle cefalee e collaborazione con fisiatria per un approccio completo.",
    "sintomi_groups": [
      { 
        title: "Cefalee & Vertigini", 
        icon: "fa-head-side-virus",
        list: ["Mal di testa cronico o ricorrente", "Emicrania con aura", "Vertigini e sbandamenti", "Acufeni (fischi alle orecchie)"] 
      },
      { 
        title: "Movimento & Sensibilità", 
        icon: "fa-hand",
        list: ["Tremori a riposo o intenzionali", "Formicolii e parestesie", "Debolezza muscolare", "Difficoltà di coordinazione"] 
      },
      { 
        title: "Memoria & Cognitivo", 
        icon: "fa-lightbulb",
        list: ["Perdita di memoria", "Difficoltà di concentrazione", "Confusione mentale", "Disturbi del sonno"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Elettromiografia (EMG) Multicanale", 
        desc: "Studio della conduzione nervosa e dell'attività muscolare. Diagnosi di neuropatie, radicolopatie e miopatie." 
      },
      { 
        num: "02", 
        title: "Doppler Transcranico (TSA)", 
        desc: "Valutazione del flusso cerebrale e delle arterie carotidee. Prevenzione ictus in collaborazione con Chirurgia Vascolare." 
      },
      { 
        num: "03", 
        title: "Test Cognitivi Standardizzati", 
        desc: "Valutazione neuropsicologica per disturbi di memoria, attenzione e funzioni esecutive." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare eventuali RMN o TAC encefalo precedenti",
      "Non sospendere i farmaci neurologici salvo diversa indicazione",
      "Annotare frequenza e caratteristiche dei sintomi",
      "Portare diario delle cefalee se disponibile"
    ],
    "faq": [
      { q: "Fate l'elettromiografia in sede?", a: "Sì, disponiamo di elettromiografo digitale multicanale per lo studio della conduzione nervosa e dell'attività muscolare." },
      { q: "Trattate le cefalee croniche?", a: "Sì, offriamo percorsi diagnostici e terapeutici per cefalee primarie (emicrania, cefalea tensiva) e secondarie." },
      { q: "Collaborate con altri specialisti?", a: "Sì, approccio multidisciplinare con Fisiatria per riabilitazione, Chirurgia Vascolare per Doppler TSA e Psicologia per aspetti emotivi." }
    ],
    "cross_sell": "Percorso integrato con Fisiatria per riabilitazione neurologica e Diagnostica Vascolare (Doppler TSA) per prevenzione ictus.",
    "durata": "30-40 minuti"
  },

  // =========================================================================
  // ENDOCRINOLOGIA
  // =========================================================================
  "Endocrinologia": {
    "files": ["visita-endocrinologica.html", "ecografia-tiroidea.html", "visita-nutrizionale.html"],
    "color": "#4A90A4",
    "colorLight": "#E3F2FD",
    "icon_hero": "fa-disease",
    "title_main": "Endocrinologia",
    "title_accent": "& Metabolismo",
    "hero_desc": "Tiroide, diabete e metabolismo sotto controllo. Ecografia tiroidea ad alta frequenza, Body Scanner 3D e dosaggi ormonali con referto rapido.",
    "sintomi_groups": [
      { 
        title: "Tiroide & Collo", 
        icon: "fa-neck",
        list: ["Noduli o gonfiore al collo", "Stanchezza cronica inspiegabile", "Intolleranza al caldo/freddo", "Perdita o aumento di peso"] 
      },
      { 
        title: "Metabolismo & Peso", 
        icon: "fa-weight-scale",
        list: ["Aumento di peso ingiustificato", "Difficoltà a dimagrire", "Fame eccessiva o inappetenza", "Ritenzione idrica"] 
      },
      { 
        title: "Diabete & Glicemia", 
        icon: "fa-droplet",
        list: ["Sete eccessiva (polidipsia)", "Minzione frequente", "Glicemia alterata", "Familiarità per diabete"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografia Tiroidea ad Alta Frequenza", 
        desc: "Visualizzazione dettagliata della ghiandola tiroidea. Identificazione di noduli, cisti e alterazioni strutturali." 
      },
      { 
        num: "02", 
        title: "Body Scanner 3D Visbody", 
        desc: "Analisi della composizione corporea: massa grassa, massa magra, acqua corporea. Base per percorsi nutrizionali personalizzati." 
      },
      { 
        num: "03", 
        title: "Laboratorio Ormonale Completo", 
        desc: "TSH Reflex, FT3, FT4, Anticorpi anti-TPO e anti-TG con referto in giornata per calibrare la terapia." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare esami ormonali recenti se disponibili",
      "Digiuno non richiesto salvo esami specifici",
      "Non sospendere farmaci tiroidei",
      "Annotare variazioni di peso recenti"
    ],
    "faq": [
      { q: "Fate l'ecografia tiroidea durante la visita?", a: "Sì, l'ecografo è nello stesso ambulatorio per una valutazione completa e immediata della tiroide." },
      { q: "Posso fare gli esami ormonali lo stesso giorno?", a: "Sì, il laboratorio interno può eseguire TSH, FT3, FT4 e anticorpi tiroidei con referto in giornata." },
      { q: "Offrite percorsi per dimagrire?", a: "Sì, integriamo la valutazione endocrinologica con percorsi nutrizionali personalizzati e il protocollo Slim Care." }
    ],
    "cross_sell": "Dosaggio TSH Reflex, FT3, FT4 e Anticorpi in sede con referto rapido. Integrazione con Nutrizionista e protocollo Slim Care per il controllo del peso.",
    "durata": "25-30 minuti"
  },

  // =========================================================================
  // ORTOPEDIA
  // =========================================================================
  "Ortopedia": {
    "files": ["visita-ortopedica.html", "infiltrazioni-articolari.html"],
    "color": "#00897B",
    "colorLight": "#E0F2F1",
    "icon_hero": "fa-bone",
    "title_main": "Ortopedia",
    "title_accent": "& Traumatologia",
    "hero_desc": "Dolori articolari, traumi sportivi e patologie della colonna. Ecografia muscolo-scheletrica e infiltrazioni ecoguidate per un recupero rapido.",
    "sintomi_groups": [
      { 
        title: "Articolazioni & Dolore", 
        icon: "fa-joint",
        list: ["Dolore a spalla, ginocchio, anca", "Rigidità articolare mattutina", "Blocchi articolari", "Artrosi e usura cartilaginea"] 
      },
      { 
        title: "Colonna & Schiena", 
        icon: "fa-spine",
        list: ["Mal di schiena cronico", "Lombalgia e sciatalgia", "Ernia del disco", "Cervicalgia"] 
      },
      { 
        title: "Traumi & Sport", 
        icon: "fa-person-running",
        list: ["Distorsioni e stiramenti", "Lesioni meniscali e legamentose", "Fratture e loro esiti", "Tendiniti (gomito, tallone)"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografia Muscolo-Scheletrica", 
        desc: "Visualizzazione in tempo reale di tendini, muscoli e articolazioni. Diagnosi immediata di lesioni, versamenti ed ematomi." 
      },
      { 
        num: "02", 
        title: "Infiltrazioni Ecoguidate", 
        desc: "Iniezioni di acido ialuronico, cortisone o PRP sotto guida ecografica per massima precisione ed efficacia." 
      },
      { 
        num: "03", 
        title: "Percorso Riabilitativo Integrato", 
        desc: "Collaborazione con Fisiatria e Fisioterapia per piani di recupero personalizzati post-trauma o post-intervento." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare RX, RMN o TAC precedenti (anche su CD)",
      "Indossare abbigliamento comodo",
      "Segnalare allergie a farmaci",
      "Annotare localizzazione e caratteristiche del dolore"
    ],
    "faq": [
      { q: "Fate infiltrazioni nella stessa seduta?", a: "Sì, se il medico lo ritiene indicato possiamo procedere immediatamente con infiltrazioni ecoguidate di acido ialuronico, cortisone o PRP." },
      { q: "Trattate traumi sportivi?", a: "Sì, siamo specializzati nel recupero rapido dell'atleta con percorsi riabilitativi dedicati e terapie innovative." },
      { q: "Collaborate con la fisioterapia?", a: "Sì, abbiamo un percorso integrato ortopedia-fisiatria-riabilitazione per garantire il miglior recupero possibile." }
    ],
    "cross_sell": "Percorso riabilitativo integrato con Fisiatria e Reumatologia. Ecografia MSK immediata e infiltrazioni ecoguidate in sede.",
    "durata": "20-25 minuti"
  },

  // =========================================================================
  // PNEUMOLOGIA
  // =========================================================================
  "Pneumologia": {
    "files": ["visita-pneumologica.html", "spirometria.html"],
    "color": "#26A69A",
    "colorLight": "#E0F2F1",
    "icon_hero": "fa-lungs",
    "title_main": "Pneumologia",
    "title_accent": "& Allergologia Respiratoria",
    "hero_desc": "Respira meglio, vivi meglio. Spirometria computerizzata con test di reversibilità, screening apnee notturne e test allergologici respiratori.",
    "sintomi_groups": [
      { 
        title: "Respiro & Tosse", 
        icon: "fa-wind",
        list: ["Tosse persistente (> 3 settimane)", "Fiato corto (dispnea)", "Respiro sibilante", "Senso di oppressione toracica"] 
      },
      { 
        title: "Asma & Allergie", 
        icon: "fa-allergies",
        list: ["Crisi asmatiche", "Rinite allergica stagionale", "Allergie respiratorie", "Bronchiti ricorrenti"] 
      },
      { 
        title: "Sonno & Prevenzione", 
        icon: "fa-moon",
        list: ["Apnee notturne (OSAS)", "Russamento patologico", "Stanchezza diurna", "Screening fumatori"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Spirometria Computerizzata", 
        desc: "Misurazione dei volumi polmonari e dei flussi respiratori. Diagnosi di asma, BPCO e patologie restrittive." 
      },
      { 
        num: "02", 
        title: "Test di Reversibilità", 
        desc: "Spirometria prima e dopo broncodilatatore per distinguere asma da BPCO e valutare la risposta alla terapia." 
      },
      { 
        num: "03", 
        title: "Test Allergologici Respiratori", 
        desc: "RAST per allergeni inalanti (pollini, acari, muffe, peli) eseguiti nel laboratorio interno." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Non fumare nelle 4 ore precedenti la spirometria",
      "Non usare broncodilatatori spray nelle 6 ore prima",
      "Evitare pasti abbondanti prima dell'esame",
      "Portare referti pneumologici e allergologici precedenti"
    ],
    "faq": [
      { q: "La spirometria è compresa nella visita?", a: "Può essere inclusa o richiesta separatamente in base alla valutazione clinica. È comunque disponibile in sede." },
      { q: "Trattate le apnee notturne?", a: "Sì, offriamo screening con questionari validati e collaboriamo con centri del sonno per la polisonnografia." },
      { q: "Fate test allergologici?", a: "Sì, il laboratorio interno può eseguire RAST per allergeni respiratori (pollini, acari, muffe) con referto rapido." }
    ],
    "cross_sell": "Possibilità di RX Torace e test allergologici (RAST) in sede. Collaborazione con ORL per patologie delle vie aeree superiori.",
    "durata": "25-30 minuti"
  },

  // =========================================================================
  // VASCOLARE (Chirurgia Vascolare)
  // =========================================================================
  "Vascolare": {
    "files": ["visita-chirurgia-vascolare.html", "eco-doppler-arti.html", "scleroterapia.html"],
    "color": "#D32F2F",
    "colorLight": "#FFCDD2",
    "icon_hero": "fa-heart-circle-bolt",
    "title_main": "Chirurgia Vascolare",
    "title_accent": "& Flebologia",
    "hero_desc": "Gambe pesanti, capillari e varici non sono solo un problema estetico. Eco-Color-Doppler ad alta risoluzione e scleroterapia in sede.",
    "sintomi_groups": [
      { 
        title: "Gambe & Circolazione", 
        icon: "fa-person-walking",
        list: ["Gambe pesanti e stanche", "Gonfiore serale alle caviglie", "Crampi notturni", "Sensazione di calore"] 
      },
      { 
        title: "Varici & Capillari", 
        icon: "fa-disease",
        list: ["Vene varicose visibili", "Capillari e teleangectasie", "Dolore lungo le vene", "Alterazioni cutanee (dermatiti)"] 
      },
      { 
        title: "Prevenzione & Rischio", 
        icon: "fa-shield",
        list: ["Familiarità per trombosi", "Lavoro in piedi prolungato", "Gravidanza e post-parto", "Viaggi lunghi frequenti"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Eco-Color-Doppler Venoso", 
        desc: "Mappatura completa del sistema venoso degli arti inferiori. Diagnosi di insufficienza valvolare, reflussi e trombosi." 
      },
      { 
        num: "02", 
        title: "Scleroterapia Estetica e Funzionale", 
        desc: "Trattamento ambulatoriale di capillari e piccole varici mediante iniezione di sostanze sclerosanti." 
      },
      { 
        num: "03", 
        title: "Elastocompressione Personalizzata", 
        desc: "Prescrizione di calze elastiche graduate su misura per prevenzione e terapia dell'insufficienza venosa." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Indossare abiti comodi (gonna o pantaloni larghi)",
      "Non applicare creme sulle gambe il giorno dell'esame",
      "Portare eventuali Eco-Doppler precedenti",
      "Segnalare terapie anticoagulanti in corso"
    ],
    "faq": [
      { q: "L'Eco-Doppler è incluso nella visita?", a: "Dipende dalla tipologia di visita. Può essere richiesto contestualmente o in appuntamento dedicato per una mappatura completa." },
      { q: "Quante sedute di scleroterapia servono?", a: "Il numero di sedute dipende dall'estensione del problema. Ogni seduta dura 15-20 minuti e si può tornare subito alle normali attività." },
      { q: "La scleroterapia è dolorosa?", a: "No, si avverte solo un lieve bruciore momentaneo. Non richiede anestesia e il risultato è progressivo nelle settimane successive." }
    ],
    "cross_sell": "Trattamento Scleroterapico estetico e funzionale immediato. Collaborazione con Cardiologia per prevenzione cardiovascolare integrata.",
    "durata": "25-30 minuti"
  },

  // =========================================================================
  // GASTROENTEROLOGIA
  // =========================================================================
  "Gastroenterologia": {
    "files": ["visita-gastroenterologica.html", "ecografia-addominale.html"],
    "color": "#558B2F",
    "colorLight": "#F1F8E9",
    "icon_hero": "fa-stomach",
    "title_main": "Gastroenterologia",
    "title_accent": "& Epatologia",
    "hero_desc": "Stomaco, intestino e fegato in buone mani. Ecografia addominale, Breath Test per Helicobacter e test intolleranze alimentari in sede.",
    "sintomi_groups": [
      { 
        title: "Stomaco & Reflusso", 
        icon: "fa-fire-flame-curved",
        list: ["Bruciore di stomaco (pirosi)", "Reflusso gastroesofageo", "Nausea e vomito", "Digestione difficile (dispepsia)"] 
      },
      { 
        title: "Intestino & Alvo", 
        icon: "fa-toilet",
        list: ["Gonfiore addominale", "Stipsi cronica", "Diarrea ricorrente", "Alternanza stipsi/diarrea (IBS)"] 
      },
      { 
        title: "Fegato & Nutrizione", 
        icon: "fa-liver",
        list: ["Transaminasi elevate", "Steatosi epatica (fegato grasso)", "Intolleranze alimentari", "Celiachia sospetta"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografia Addominale Completa", 
        desc: "Visualizzazione di fegato, colecisti, pancreas, milza e reni. Diagnosi di calcoli, cisti, steatosi e masse." 
      },
      { 
        num: "02", 
        title: "Breath Test (H. pylori, Lattosio)", 
        desc: "Test del respiro non invasivi per diagnosticare infezione da Helicobacter, intolleranza al lattosio e SIBO." 
      },
      { 
        num: "03", 
        title: "Test Intolleranze Alimentari", 
        desc: "Pannelli per celiachia (anti-transglutaminasi), intolleranza al lattosio e sensibilità al glutine non celiaca." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Digiuno da almeno 6 ore per ecografia addominale",
      "Non fumare e non masticare gomme prima del Breath Test",
      "Portare referti di esami precedenti (gastroscopie, colonscopia)",
      "Annotare alimenti che provocano disturbi"
    ],
    "faq": [
      { q: "Fate il Breath Test in sede?", a: "Sì, eseguiamo Breath Test per Helicobacter pylori, intolleranza al lattosio e sovracrescita batterica (SIBO)." },
      { q: "L'ecografia addominale è inclusa nella visita?", a: "Può essere richiesta contestualmente alla visita specialistica. È sempre disponibile in sede." },
      { q: "Trattate il reflusso gastroesofageo?", a: "Sì, con approccio diagnostico e terapeutico personalizzato, inclusa valutazione dietetica." }
    ],
    "cross_sell": "Test Intolleranze (Lattosio/Glutine/H.Pylori) eseguiti direttamente in reparto. Integrazione con Nutrizionista per diete personalizzate.",
    "durata": "25-30 minuti"
  },

  // =========================================================================
  // ORL (Otorinolaringoiatria)
  // =========================================================================
  "ORL": {
    "files": ["visita-orl.html"],
    "color": "#7E57C2",
    "colorLight": "#EDE7F6",
    "icon_hero": "fa-ear-listen",
    "title_main": "Otorinolaringoiatria",
    "title_accent": "(ORL)",
    "hero_desc": "Orecchio, naso e gola: tre organi, uno specialista. Audiometria, impedenzometria e fibrolaringoscopia in sede per una diagnosi completa.",
    "sintomi_groups": [
      { 
        title: "Orecchio & Udito", 
        icon: "fa-ear-deaf",
        list: ["Calo dell'udito", "Acufeni (fischi, ronzii)", "Otiti ricorrenti", "Sensazione di orecchio chiuso"] 
      },
      { 
        title: "Naso & Seni Paranasali", 
        icon: "fa-head-side-mask",
        list: ["Sinusite cronica", "Rinite allergica", "Polipi nasali", "Russamento e apnee"] 
      },
      { 
        title: "Gola & Voce", 
        icon: "fa-comment",
        list: ["Raucedine persistente", "Mal di gola ricorrente", "Difficoltà a deglutire", "Sensazione di corpo estraneo"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Audiometria Tonale e Vocale", 
        desc: "Esame dell'udito in cabina silente. Misura la soglia uditiva per frequenze gravi e acute." 
      },
      { 
        num: "02", 
        title: "Impedenzometria", 
        desc: "Valutazione della funzionalità del timpano e della catena ossiculare. Diagnosi di otiti medie e disfunzioni tubariche." 
      },
      { 
        num: "03", 
        title: "Fibrolaringoscopia", 
        desc: "Esplorazione endoscopica di laringe e corde vocali con fibra ottica flessibile. Diagnosi di noduli, polipi e lesioni." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare eventuali audiometrie precedenti",
      "Segnalare esposizione professionale a rumori",
      "Non usare gocce auricolari il giorno dell'esame",
      "Annotare farmaci ototossici assunti"
    ],
    "faq": [
      { q: "Fate l'audiometria in sede?", a: "Sì, disponiamo di cabina audiometrica professionale per esami dell'udito completi (audiometria tonale, vocale e impedenzometria)." },
      { q: "Fate lavaggi auricolari?", a: "Sì, rimuoviamo tappi di cerume in sicurezza durante la visita con strumentazione dedicata." },
      { q: "Trattate le vertigini?", a: "Sì, con esami vestibologici e manovre liberatorie per la vertigine parossistica posizionale (VPPB)." }
    ],
    "cross_sell": "Esame Audiometrico completo e Lavaggio Auricolare in sede. Collaborazione con Neurologia per vertigini centrali.",
    "durata": "20-25 minuti"
  },

  // =========================================================================
  // EMATOLOGIA
  // =========================================================================
  "Ematologia": {
    "files": ["visita-ematologica.html"],
    "color": "#C62828",
    "colorLight": "#FFEBEE",
    "icon_hero": "fa-droplet",
    "title_main": "Ematologia",
    "title_accent": "& Coagulazione",
    "hero_desc": "Il sangue racconta la tua salute. Interpretazione esperta di esami ematologici, striscio periferico e gestione delle terapie anticoagulanti.",
    "sintomi_groups": [
      { 
        title: "Anemia & Stanchezza", 
        icon: "fa-battery-empty",
        list: ["Stanchezza estrema", "Pallore cutaneo", "Affanno a riposo", "Tachicardia"] 
      },
      { 
        title: "Sanguinamento & Coagulazione", 
        icon: "fa-bandage",
        list: ["Lividi frequenti", "Sanguinamenti gengivali", "Mestruazioni abbondanti", "Trombosi pregresse"] 
      },
      { 
        title: "Valori Alterati", 
        icon: "fa-flask-vial",
        list: ["Piastrine alte o basse", "Globuli bianchi alterati", "Emoglobina bassa", "Linfociti aumentati"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Interpretazione Emocromo Completo", 
        desc: "Valutazione esperta di globuli rossi, bianchi, piastrine, emoglobina e formula leucocitaria." 
      },
      { 
        num: "02", 
        title: "Striscio di Sangue Periferico", 
        desc: "Esame microscopico delle cellule del sangue per identificare anomalie morfologiche e cellule atipiche." 
      },
      { 
        num: "03", 
        title: "Gestione Anticoagulanti", 
        desc: "Monitoraggio INR per pazienti in terapia con Coumadin/Sintrom. Educazione all'autogestione." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare tutti gli esami ematologici precedenti",
      "Elenco completo dei farmaci assunti",
      "Non sospendere terapie in corso",
      "Annotare episodi di sanguinamento o trombosi"
    ],
    "faq": [
      { q: "Interpretate anche esami fatti altrove?", a: "Sì, l'ematologo può valutare referti di altri laboratori e suggerire approfondimenti mirati." },
      { q: "Fate lo striscio periferico?", a: "Sì, il laboratorio interno può eseguire l'esame microscopico del sangue periferico." },
      { q: "Gestite pazienti anticoagulati?", a: "Sì, monitoriamo l'INR e aiutiamo i pazienti a gestire al meglio la terapia con Coumadin/Sintrom." }
    ],
    "cross_sell": "Accesso diretto ai dati grezzi del laboratorio interno per un'interpretazione immediata e completa.",
    "durata": "30-40 minuti"
  },

  // =========================================================================
  // FISIATRIA
  // =========================================================================
  "Fisiatria": {
    "files": ["visita-fisiatrica.html"],
    "color": "#00ACC1",
    "colorLight": "#E0F7FA",
    "icon_hero": "fa-person-cane",
    "title_main": "Fisiatria",
    "title_accent": "& Riabilitazione",
    "hero_desc": "Dal dolore al movimento. Valutazione funzionale, prescrizione di fisioterapia e percorsi riabilitativi personalizzati.",
    "sintomi_groups": [
      { 
        title: "Dolore Muscoloscheletrico", 
        icon: "fa-bone",
        list: ["Mal di schiena cronico", "Cervicalgia", "Dolori articolari diffusi", "Contratture muscolari"] 
      },
      { 
        title: "Recupero Post-Trauma", 
        icon: "fa-crutch",
        list: ["Esiti di fratture", "Post-intervento ortopedico", "Distorsioni e stiramenti", "Lesioni sportive"] 
      },
      { 
        title: "Riabilitazione Neurologica", 
        icon: "fa-brain",
        list: ["Esiti di ictus", "Parkinson e parkinsonismi", "Sclerosi multipla", "Neuropatie periferiche"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Valutazione Funzionale Completa", 
        desc: "Esame della postura, mobilità articolare, forza muscolare e capacità funzionali residue." 
      },
      { 
        num: "02", 
        title: "Piano Riabilitativo Individualizzato", 
        desc: "Prescrizione di fisioterapia, terapie fisiche strumentali e ausili personalizzati." 
      },
      { 
        num: "03", 
        title: "Terapia Infiltrativa", 
        desc: "Infiltrazioni di cortisone, acido ialuronico e PRP per patologie articolari e tendinee." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare RX, RMN e referti ortopedici/neurologici recenti",
      "Indossare abbigliamento comodo",
      "Portare eventuali plantari, tutori o ausili in uso",
      "Annotare farmaci antidolorifici assunti"
    ],
    "faq": [
      { q: "Prescrivete la fisioterapia?", a: "Sì, il fisiatra può prescrivere cicli riabilitativi personalizzati con indicazione delle terapie più appropriate." },
      { q: "Collaborate con ortopedici e neurologi?", a: "Sì, abbiamo un percorso integrato ortopedia-fisiatria-riabilitazione per garantire continuità assistenziale." },
      { q: "Fate infiltrazioni?", a: "Sì, eseguiamo infiltrazioni articolari e periarticolari con cortisone, acido ialuronico o PRP." }
    ],
    "cross_sell": "Percorso integrato con Ortopedia, Neurologia e Reumatologia per una presa in carico completa del paziente.",
    "durata": "25-30 minuti"
  },

  // =========================================================================
  // REUMATOLOGIA
  // =========================================================================
  "Reumatologia": {
    "files": ["visita-reumatologica.html"],
    "color": "#795548",
    "colorLight": "#EFEBE9",
    "icon_hero": "fa-hand-holding-medical",
    "title_main": "Reumatologia",
    "title_accent": "& Immunologia",
    "hero_desc": "Artrite, artrosi e malattie autoimmuni. Diagnosi precoce, ecografia articolare e accesso alle terapie biologiche.",
    "sintomi_groups": [
      { 
        title: "Dolore & Rigidità", 
        icon: "fa-hand",
        list: ["Dolore articolare diffuso", "Rigidità mattutina > 30 minuti", "Gonfiore alle articolazioni", "Deformità articolari"] 
      },
      { 
        title: "Autoimmunità", 
        icon: "fa-shield-virus",
        list: ["Artrite reumatoide", "Lupus eritematoso", "Sindrome di Sjögren", "Sclerodermia"] 
      },
      { 
        title: "Metaboliche & Degenerative", 
        icon: "fa-bone",
        list: ["Artrosi avanzata", "Gotta e iperuricemia", "Osteoporosi", "Fibromialgia"] 
      }
    ],
    "tech_steps": [
      { 
        num: "01", 
        title: "Ecografia Articolare", 
        desc: "Visualizzazione di sinoviti, versamenti e erosioni articolari. Monitoraggio dell'attività di malattia." 
      },
      { 
        num: "02", 
        title: "Pannello Autoimmunitario Completo", 
        desc: "Fattore Reumatoide, anti-CCP, ANA, anti-DNA, ENA e complemento nel laboratorio interno." 
      },
      { 
        num: "03", 
        title: "Terapie Biologiche", 
        desc: "Accesso ai farmaci biologici e biosimilari per artrite reumatoide, spondiloartriti e connettiviti." 
      }
    ],
    "prep_title": "Come Prepararsi",
    "prep_list": [
      "Portare esami recenti (VES, PCR, Fattore Reumatoide)",
      "Elenco dei farmaci assunti con dosaggi",
      "Annotare le articolazioni dolenti",
      "Portare referti reumatologici precedenti"
    ],
    "faq": [
      { q: "Trattate l'artrite reumatoide?", a: "Sì, con diagnosi precoce, monitoraggio ecografico e accesso a terapie convenzionali e biologiche." },
      { q: "Fate ecografie articolari?", a: "Sì, per valutare sinoviti, versamenti e erosioni. Utile anche per guidare infiltrazioni." },
      { q: "Collaborate con altri specialisti?", a: "Sì, approccio multidisciplinare con Ortopedici, Fisiatri, Dermatologi e Pneumologi per le manifestazioni sistemiche." }
    ],
    "cross_sell": "Pannello Autoimmunitario Completo in sede. Integrazione con Ortopedia e Fisiatria per la gestione del dolore.",
    "durata": "30-40 minuti"
  }
};

// ============================================================================
// GENERATORE TEMPLATE HTML
// ============================================================================
function generateDeepDivePage(specialty, data) {
  
  // Genera i box dei sintomi
  const symptomBoxes = data.sintomi_groups.map(group => `
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: ${data.colorLight};">
                            <i class="fas ${group.icon}" style="color: ${data.color};"></i>
                        </div>
                        <h3 class="font-bold text-gray-800">${group.title}</h3>
                    </div>
                    <ul class="space-y-2">
                        ${group.list.map(item => `<li class="flex items-start gap-2 text-sm text-gray-600"><i class="fas fa-check text-green-500 mt-1 text-xs"></i> ${item}</li>`).join('\n                        ')}
                    </ul>
                </div>`).join('\n');

  // Genera gli step tecnologici
  const techSteps = data.tech_steps.map(step => `
                        <li class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style="background: ${data.color};">
                                ${step.num}
                            </div>
                            <div>
                                <strong class="block text-gray-800 text-lg">${step.title}</strong>
                                <span class="text-sm text-gray-500">${step.desc}</span>
                            </div>
                        </li>`).join('\n');

  // Genera la lista preparazione
  const prepList = data.prep_list.map(item => `<li>${item}</li>`).join('\n                        ');

  // Genera le FAQ
  const faqItems = data.faq.map(faq => `
                        <details class="group bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <summary class="flex justify-between items-center p-4 cursor-pointer font-semibold text-gray-700 hover:text-green-600 transition list-none">
                                <span>${faq.q}</span>
                                <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                            </summary>
                            <div class="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 bg-gray-50/50">
                                ${faq.a}
                            </div>
                        </details>`).join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title_main} ${data.title_accent} Sassari | Bio-Clinic</title>
    <meta name="description" content="${data.hero_desc} Prenota: 079 956 1332">
    <meta name="keywords" content="${data.title_main.toLowerCase()} sassari, ${data.title_accent.toLowerCase()} sassari, visita ${data.title_main.toLowerCase()}, bio-clinic sassari">
    <link rel="canonical" href="https://bio-clinic.it/pages/${data.files[0]}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${data.title_main} ${data.title_accent} Sassari | Bio-Clinic">
    <meta property="og:description" content="${data.hero_desc}">
    <meta property="og:url" content="https://bio-clinic.it/pages/${data.files[0]}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Bio-Clinic Sassari">
    
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalClinic",
          "@id": "https://bio-clinic.it/#clinic",
          "name": "Bio-Clinic Sassari",
          "telephone": "+39 079 956 1332",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Via Renzo Mossa, 23",
            "addressLocality": "Sassari",
            "postalCode": "07100",
            "addressCountry": "IT"
          }
        },
        {
          "@type": "MedicalSpecialty",
          "@id": "https://bio-clinic.it/pages/${data.files[0]}#specialty",
          "name": "${data.title_main}",
          "alternateName": "${data.title_main} ${data.title_accent}",
          "description": "${data.hero_desc}",
          "relevantSpecialty": "${data.title_main}",
          "availableService": ${JSON.stringify(data.tech_steps.map(s => s.title))},
          "knowsAbout": ${JSON.stringify(data.sintomi_groups.flatMap(g => g.list))}
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
            {"@type": "ListItem", "position": 2, "name": "Specialità", "item": "https://bio-clinic.it/pages/specialita.html"},
            {"@type": "ListItem", "position": 3, "name": "${data.title_main}", "item": "https://bio-clinic.it/pages/${data.files[0]}"}
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            ${data.faq.map(f => `{
              "@type": "Question",
              "name": "${f.q}",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "${f.a}"
              }
            }`).join(',\n            ')}
          ]
        }
      ]
    }
    </script>
    
    <!-- Fonts & CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/search.css">
    <link rel="stylesheet" href="../css/search-fix.css">
    <link rel="stylesheet" href="../css/header-spacing-fix.css">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        body { padding-top: 100px !important; margin: 0 !important; font-family: 'Inter', sans-serif; }
        .header { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; z-index: 9999 !important; background: #fff !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
        .theme-text { color: ${data.color}; }
        .theme-bg { background-color: ${data.color}; }
        .theme-bg-light { background-color: ${data.colorLight}; }
        .theme-border { border-color: ${data.color}; }
        .text-bio-green { color: #00704A; }
        .bg-bio-green { background-color: #00704A; }
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- HEADER PRINCIPALE -->
    <header class="header">
      <div class="container">
        <a href="../index.html" class="logo" title="Torna alla Homepage Bio-Clinic">
          <img src="../images/logo-bioclinic.png" alt="Bio-Clinic Sassari" width="180" height="60" loading="eager">
        </a>
        <nav class="nav" aria-label="Navigazione principale">
          <ul class="nav-list">
            <li class="nav-item"><a href="../index.html" class="nav-link">Home</a></li>
            <li class="nav-item">
              <a href="#" class="nav-link">Slim Care Medical</a>
              <div class="nav-dropdown" role="menu">
                <a href="slim-care.html" role="menuitem"><span style="color: #00A651;">💚</span> Slim Care</a>
                <a href="slim-care-donna.html" role="menuitem"><span style="color: #E91E8C;">💗</span> Slim Care Donna</a>
              </div>
            </li>
            <li class="nav-item"><a href="../laboratorio/index.html" class="nav-link">Laboratorio</a></li>
            <li class="nav-item">
              <a href="#" class="nav-link">Donna & PMA</a>
              <div class="nav-dropdown" role="menu">
                <a href="ginecologia.html" role="menuitem">👩‍⚕️ Ginecologia</a>
                <a href="pma-fertilita.html" role="menuitem">👶 PMA / Fertilità</a>
              </div>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">Specialisti</a>
              <div class="nav-dropdown nav-dropdown-wide" role="menu">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; min-width: 320px;">
                  <a href="cardiologia.html" role="menuitem">❤️ Cardiologia</a>
                  <a href="endocrinologia.html" role="menuitem">🦋 Endocrinologia</a>
                  <a href="dermatologia.html" role="menuitem">🩺 Dermatologia</a>
                  <a href="neurologia.html" role="menuitem">🧠 Neurologia</a>
                  <a href="oculistica.html" role="menuitem">👁️ Oculistica</a>
                  <a href="ortopedia.html" role="menuitem">🦴 Ortopedia</a>
                </div>
                <hr style="margin: 0.5rem 0; border-top: 1px solid #eee;">
                <a href="specialita.html" style="font-weight: 600;">Tutte le Specialità →</a>
                <a href="../equipe/index.html" style="font-weight: 600;">👨‍⚕️ Équipe (51 Medici)</a>
              </div>
            </li>
            <li class="nav-item"><a href="../shop/index.html" class="nav-link">Medical Shop <span style="background: #E91E8C; color: white; font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 10px;">NEW</span></a></li>
            <li class="nav-item"><a href="contatti.html" class="nav-link">Contatti</a></li>
          </ul>
          <a href="tel:+390799561332" class="btn btn-primary nav-cta" style="background: #00704A; color: white; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Prenota
          </a>
        </nav>
        <button class="menu-toggle" aria-label="Apri menu"><span></span><span></span><span></span></button>
      </div>
    </header>

    <div class="mobile-overlay" aria-hidden="true"></div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Menu mobile" aria-hidden="true">
      <div class="mobile-nav-header">
        <img src="../images/logo-bioclinic.png" alt="Bio-Clinic" width="140">
        <button class="mobile-nav-close" aria-label="Chiudi menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <ul class="mobile-nav-list">
        <li><a href="../index.html">🏠 Home</a></li>
        <li><a href="specialita.html">📋 Tutte le Specialità</a></li>
        <li><a href="../equipe/index.html">👨‍⚕️ Équipe Medica</a></li>
        <li><a href="contatti.html">📍 Contatti</a></li>
      </ul>
      <div class="mobile-nav-footer">
        <a href="tel:+390799561332" class="btn btn-primary" style="width: 100%; justify-content: center; background: #00704A;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Chiama: 079 956 1332
        </a>
      </div>
    </nav>

    <main>
    
    <!-- HERO DEEP DIVE -->
    <section class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto pb-16 pt-10 px-4 sm:px-6 lg:px-8">
            <div class="lg:grid lg:grid-cols-12 lg:gap-8">
                <div class="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                    <span class="theme-text font-bold tracking-wider uppercase text-xs">Eccellenza Medica Bio-Clinic</span>
                    <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">
                        ${data.title_main}
                        <span class="block theme-text">${data.title_accent}</span>
                    </h1>
                    <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                        ${data.hero_desc}
                    </p>
                    
                    <div class="mt-6 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span class="flex items-center gap-2"><i class="far fa-clock theme-text"></i> ${data.durata}</span>
                        <span class="flex items-center gap-2"><i class="fas fa-file-medical theme-text"></i> Referto immediato</span>
                    </div>
                    
                    <div class="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                        <a href="#prenota" class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white theme-bg hover:opacity-90 shadow-lg transform transition hover:-translate-y-1">
                            Prenota Visita
                        </a>
                        <a href="#tecnologia" class="inline-flex items-center justify-center px-8 py-3 border-2 theme-border text-base font-medium rounded-lg theme-text hover:bg-gray-50 transition">
                            Scopri di più <i class="fas fa-arrow-down ml-2"></i>
                        </a>
                    </div>
                </div>
                <div class="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                    <div class="relative mx-auto w-full rounded-2xl shadow-xl overflow-hidden theme-bg-light p-8 text-center">
                        <i class="fas ${data.icon_hero} text-9xl theme-text opacity-30"></i>
                        <div class="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>
                        <div class="absolute bottom-6 left-6 right-6 text-left">
                            <p class="text-sm font-bold text-gray-800">${data.cross_sell}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SINTOMI GRID (SEO SEMANTICA) -->
    <section class="py-16 bg-gray-50 border-y border-gray-200">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="theme-text font-bold tracking-wider uppercase text-xs">Sintomi & Indicazioni</span>
                <h2 class="text-3xl font-bold text-gray-800 mt-2">Quando Rivolgersi a Noi</h2>
                <p class="text-gray-500 mt-2 max-w-2xl mx-auto">Se riconosci uno di questi sintomi, prenota una visita specialistica</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
${symptomBoxes}
            </div>
        </div>
    </section>

    <!-- TECNOLOGIA & PERCORSO -->
    <section id="tecnologia" class="py-16 bg-white scroll-mt-28">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                    <span class="theme-text font-bold tracking-wider uppercase text-xs">Il Nostro Approccio</span>
                    <h2 class="text-3xl font-bold text-gray-900 mt-2 mb-8">Tecnologia & Percorso Diagnostico</h2>
                    <ul class="space-y-8">
${techSteps}
                    </ul>
                </div>
                <div class="space-y-8">
                    <!-- PREPARAZIONE -->
                    <div class="bg-gray-50 border border-gray-200 p-8 rounded-2xl">
                        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i class="fas fa-clipboard-list theme-text"></i> ${data.prep_title}
                        </h3>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-2">
                        ${prepList}
                        </ul>
                    </div>
                    
                    <!-- FAQ -->
                    <div class="bg-white border border-gray-200 p-8 rounded-2xl">
                        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i class="fas fa-comments theme-text"></i> Domande Frequenti
                        </h3>
                        <div class="space-y-3">
${faqItems}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA PRENOTA -->
    <section id="prenota" class="py-16 text-white text-center scroll-mt-28" style="background: linear-gradient(135deg, ${data.color} 0%, ${data.color}dd 100%);">
        <div class="max-w-3xl mx-auto px-4">
            <h2 class="text-3xl font-bold mb-4">La tua salute al centro.</h2>
            <p class="mb-8 opacity-90 text-lg">Prenota la tua visita specialistica senza attese.</p>
            <div class="flex flex-col sm:flex-row justify-center gap-4">
                <a href="tel:+390799561332" class="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white rounded-lg font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105" style="color: ${data.color};">
                    <i class="fas fa-phone"></i> 079 956 1332
                </a>
                <a href="https://wa.me/390799561332" class="inline-flex items-center justify-center gap-2 px-10 py-4 bg-green-500 text-white rounded-lg font-bold text-lg shadow-lg hover:bg-green-600 transition transform hover:scale-105">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
            <p class="mt-8 opacity-70 text-sm">📍 Via Renzo Mossa, 23 - 07100 Sassari | Lun-Ven 07:00-21:00, Sab 08:00-14:00</p>
        </div>
    </section>

    </main>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-info">
            <a href="../index.html" class="footer-logo"><img src="../images/logo-bioclinic.png" alt="Bio-Clinic Sassari" width="160"></a>
            <p>Poliambulatorio Medico d'eccellenza a Sassari dal 1990. 51 specialisti, oltre 60 prestazioni.</p>
          </div>
          <div class="footer-links">
            <h4>Contatti</h4>
            <ul>
              <li><a href="tel:+390799561332"><i class="fas fa-phone"></i> 079 956 1332</a></li>
              <li><a href="mailto:gestione@bio-clinic.it"><i class="fas fa-envelope"></i> gestione@bio-clinic.it</a></li>
              <li><i class="fas fa-map-marker-alt"></i> Via Renzo Mossa, 23 - Sassari</li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Orari</h4>
            <ul>
              <li>Lunedì - Venerdì: 07:00 - 21:00</li>
              <li>Sabato: 08:00 - 14:00</li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Link Utili</h4>
            <ul>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="cookie.html">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom"><p>&copy; 2025 Bio-Clinic Sassari. Tutti i diritti riservati.</p></div>
      </div>
    </footer>

    <script src="../js/main.js"></script>
    <script src="../js/search.js"></script>
</body>
</html>`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
const PAGES_DIR = path.join(__dirname, '..', 'pages');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║      BIO-CLINIC DEEP DIVE PAGE GENERATOR                      ║');
console.log('║      "Wikipedia della Salute a Sassari"                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalGenerated = 0;
let totalSkipped = 0;

for (const [specialty, data] of Object.entries(DEEP_DATA)) {
  console.log(`\n📂 ${specialty.toUpperCase()}`);
  console.log('─'.repeat(50));
  
  // Genera solo il primo file di ogni specialità come "pagina madre"
  const mainFile = data.files[0];
  const filePath = path.join(PAGES_DIR, mainFile);
  
  // Genera il contenuto
  const htmlContent = generateDeepDivePage(specialty, data);
  
  // Scrivi il file
  fs.writeFileSync(filePath, htmlContent, 'utf8');
  console.log(`   ✅ ${mainFile} - DEEP DIVE GENERATO`);
  totalGenerated++;
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                         RIEPILOGO                              ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`   ✅ Generati:   ${totalGenerated} pagine Deep Dive`);
console.log(`   📊 Specialità: ${Object.keys(DEEP_DATA).length}`);
console.log('\n🎉 DEEP DIVE GENERATION COMPLETATO!\n');
