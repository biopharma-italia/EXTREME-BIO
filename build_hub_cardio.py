#!/usr/bin/env python3
"""
Genera il HUB Cardiologia perfetto per Bio-Clinic Sassari.
Conforme al CLUSTER-CARDIOLOGIA-MASTER-PLAN.md
"""
import json, textwrap

# ── JSON-LD SCHEMA COMPLETO ──────────────────────────────────────────────────
schema = {
  "@context": "https://schema.org",
  "@graph": [
    # 1) MedicalClinic
    {
      "@type": "MedicalClinic",
      "@id": "https://bio-clinic.it/#organization",
      "name": "Bio-Clinic Sassari",
      "url": "https://bio-clinic.it",
      "telephone": "+39 079 956 1332",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Via Renzo Mossa, 23",
        "addressLocality": "Sassari",
        "postalCode": "07100",
        "addressCountry": "IT"
      },
      "geo": {"@type":"GeoCoordinates","latitude":40.7267,"longitude":8.5592},
      "aggregateRating": {"@type":"AggregateRating","ratingValue":"5","reviewCount":"3214","bestRating":"5","worstRating":"1"},
      "areaServed": [
        {"@type":"City","name":"Sassari","sameAs":"https://it.wikipedia.org/wiki/Sassari"},
        {"@type":"AdministrativeArea","name":"Provincia di Sassari","sameAs":"https://it.wikipedia.org/wiki/Provincia_di_Sassari"},
        {"@type":"AdministrativeArea","name":"Nord Sardegna"}
      ],
      "medicalSpecialty": [
        {"@type":"MedicalSpecialty","name":"Cardiologia"},
        {"@type":"MedicalSpecialty","name":"Laboratorio Analisi"}
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Prestazioni Cardiologiche Bio-Clinic",
        "itemListElement": [
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Visita Cardiologica con ECG"},"price":"100.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Ecocardiogramma Color Doppler"},"price":"150.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Holter ECG 24h"},"price":"120.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Holter Pressorio 24h (ABPM)"},"price":"100.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Check-up Cardiovascolare"},"price":"150.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Eco-Doppler TSA"},"price":"100.00","priceCurrency":"EUR"},
          {"@type":"Offer","itemOffered":{"@type":"MedicalProcedure","name":"Test da Sforzo"},"price":"150.00","priceCurrency":"EUR"}
        ]
      },
      "dateModified": "2026-02-19"
    },
    # 2) MedicalWebPage
    {
      "@type": "MedicalWebPage",
      "@id": "https://bio-clinic.it/cardiologia/",
      "url": "https://bio-clinic.it/cardiologia/",
      "name": "Cardiologia Sassari - Centro di Eccellenza Cardiovascolare",
      "dateModified": "2026-02-19",
      "lastReviewed": "2026-02-19",
      "medicalAudience": {"@type":"MedicalAudience","audienceType":"Patient"},
      "speakable": {"@type":"SpeakableSpecification","cssSelector":[".ai-summary","h1",".faq-item h3"]},
      "mainEntity": {"@id":"https://bio-clinic.it/cardiologia/#specialty"},
      "reviewedBy": {
        "@type": "Physician",
        "name": "Dott. Tonino Bullitta",
        "jobTitle": "Cardiologo",
        "identifier": {"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici di Sassari","value":"2054"},
        "url": "https://bio-clinic.it/equipe/tonino-bullitta/"
      }
    },
    # 3) MedicalSpecialty
    {
      "@type": "MedicalSpecialty",
      "@id": "https://bio-clinic.it/cardiologia/#specialty",
      "name": "Cardiologia",
      "description": "Servizio di Cardiologia con 5 specialisti e 39 prestazioni diagnostiche e terapeutiche: ECG, ecocardiogramma, holter ECG e pressorio, eco-doppler vascolare, test da sforzo, check-up cardiovascolare presso Bio-Clinic Sassari."
    },
    # 4) BreadcrumbList
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"Home","item":"https://bio-clinic.it/"},
        {"@type":"ListItem","position":2,"name":"Specialità","item":"https://bio-clinic.it/specialita/"},
        {"@type":"ListItem","position":3,"name":"Cardiologia","item":"https://bio-clinic.it/cardiologia/"}
      ]
    },
    # 5) Physicians con numeri Albo
    {"@type":["Person","Physician"],"@id":"https://bio-clinic.it/equipe/tonino-bullitta/","name":"Dott. Tonino Bullitta","givenName":"Tonino","familyName":"Bullitta","jobTitle":"Cardiologo","url":"https://bio-clinic.it/equipe/tonino-bullitta/","worksFor":{"@id":"https://bio-clinic.it/#organization"},"medicalSpecialty":"Cardiologia","identifier":{"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici di Sassari","value":"2054"},"description":"Cardiologo specialista in ecocardiografia e diagnostica cardiologica non invasiva presso Bio-Clinic Sassari."},
    {"@type":["Person","Physician"],"@id":"https://bio-clinic.it/equipe/sara-uras/","name":"Dott.ssa Sara Uras","givenName":"Sara","familyName":"Uras","jobTitle":"Cardiologa","url":"https://bio-clinic.it/equipe/sara-uras/","worksFor":{"@id":"https://bio-clinic.it/#organization"},"medicalSpecialty":"Cardiologia","identifier":{"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici di Sassari","value":"5084"},"description":"Cardiologa specializzata in ecocardiografia e diagnostica cardiovascolare non invasiva presso Bio-Clinic Sassari."},
    {"@type":["Person","Physician"],"@id":"https://bio-clinic.it/equipe/giuliana-guagnozzi/","name":"Dott.ssa Giuliana Guagnozzi","givenName":"Giuliana","familyName":"Guagnozzi","jobTitle":"Cardiologa","url":"https://bio-clinic.it/equipe/giuliana-guagnozzi/","worksFor":{"@id":"https://bio-clinic.it/#organization"},"medicalSpecialty":"Cardiologia","identifier":{"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici","value":"42447"},"description":"Cardiologa specializzata in prevenzione cardiovascolare e diagnostica cardiologica avanzata presso Bio-Clinic Sassari."},
    {"@type":["Person","Physician"],"@id":"https://bio-clinic.it/equipe/paolo-pischedda/","name":"Dott. Paolo Pischedda","givenName":"Paolo","familyName":"Pischedda","jobTitle":"Cardiologo","url":"https://bio-clinic.it/equipe/paolo-pischedda/","worksFor":{"@id":"https://bio-clinic.it/#organization"},"medicalSpecialty":"Cardiologia","identifier":{"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici di Sassari","value":"5264"},"description":"Cardiologo esperto in Holter ECG/pressorio, Eco-Doppler TSA, test da sforzo e diagnostica cardiovascolare presso Bio-Clinic Sassari."},
    {"@type":["Person","Physician"],"@id":"https://bio-clinic.it/equipe/paolo-franca/","name":"Dott. Paolo Franca","givenName":"Paolo","familyName":"Franca","jobTitle":"Cardiologo","url":"https://bio-clinic.it/equipe/paolo-franca/","worksFor":{"@id":"https://bio-clinic.it/#organization"},"medicalSpecialty":"Cardiologia","identifier":{"@type":"PropertyValue","propertyID":"Iscrizione Ordine dei Medici di Sassari","value":"6108"},"description":"Cardiologo specializzato in Holter ECG/pressorio, Eco-Doppler TSA, test da sforzo e prevenzione cardiovascolare presso Bio-Clinic Sassari."},
    # 6) MedicalConditions (3 principali)
    {
      "@type": "MedicalCondition",
      "name": "Ipertensione Arteriosa",
      "alternateName": "ICD-10: I10",
      "description": "L'ipertensione arteriosa è una condizione caratterizzata da valori di pressione sistolica superiori a 140 mmHg e/o diastolica superiori a 90 mmHg.",
      "signOrSymptom": [
        {"@type":"MedicalSignOrSymptom","name":"Cefalea"},
        {"@type":"MedicalSignOrSymptom","name":"Vertigini"},
        {"@type":"MedicalSignOrSymptom","name":"Acufeni"}
      ],
      "riskFactor": [
        {"@type":"MedicalRiskFactor","name":"Familiarità"},
        {"@type":"MedicalRiskFactor","name":"Obesità"},
        {"@type":"MedicalRiskFactor","name":"Sedentarietà"},
        {"@type":"MedicalRiskFactor","name":"Fumo"}
      ],
      "typicalTest": [
        {"@type":"MedicalTest","name":"Holter Pressorio 24h (ABPM)","url":"https://bio-clinic.it/cardiologia/holter-pressorio/"},
        {"@type":"MedicalTest","name":"Visita Cardiologica con ECG","url":"https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/"},
        {"@type":"MedicalTest","name":"Profilo Lipidico","url":"https://bio-clinic.it/laboratorio/"}
      ],
      "epidemiology": "In Italia il 33% della popolazione adulta è ipertesa. In Sardegna la prevalenza supera il 35% per la popolazione over 50 (dati ISS 2024).",
      "relevantSpecialty": {"@type":"MedicalSpecialty","name":"Cardiologia"}
    },
    {
      "@type": "MedicalCondition",
      "name": "Fibrillazione Atriale",
      "alternateName": "ICD-10: I48",
      "description": "La fibrillazione atriale è l'aritmia cardiaca più frequente, caratterizzata da un ritmo cardiaco irregolare e spesso accelerato.",
      "signOrSymptom": [
        {"@type":"MedicalSignOrSymptom","name":"Palpitazioni"},
        {"@type":"MedicalSignOrSymptom","name":"Dispnea"},
        {"@type":"MedicalSignOrSymptom","name":"Affaticamento"}
      ],
      "typicalTest": [
        {"@type":"MedicalTest","name":"Holter ECG 24h","url":"https://bio-clinic.it/cardiologia/holter-ecg/"},
        {"@type":"MedicalTest","name":"Ecocardiogramma","url":"https://bio-clinic.it/cardiologia/ecocardiogramma/"},
        {"@type":"MedicalTest","name":"Profilo Coagulazione (PT/INR)","url":"https://bio-clinic.it/laboratorio/"}
      ],
      "epidemiology": "Colpisce circa il 2-3% della popolazione adulta europea. Prevalenza in aumento con l'età: 10-17% negli over 80.",
      "relevantSpecialty": {"@type":"MedicalSpecialty","name":"Cardiologia"}
    },
    {
      "@type": "MedicalCondition",
      "name": "Cardiopatia Ischemica",
      "alternateName": "ICD-10: I25",
      "description": "La cardiopatia ischemica è una malattia del cuore causata dalla riduzione dell'apporto di sangue al miocardio per ostruzione delle arterie coronarie.",
      "signOrSymptom": [
        {"@type":"MedicalSignOrSymptom","name":"Dolore toracico (angina)"},
        {"@type":"MedicalSignOrSymptom","name":"Dispnea da sforzo"},
        {"@type":"MedicalSignOrSymptom","name":"Affaticamento"}
      ],
      "typicalTest": [
        {"@type":"MedicalTest","name":"ECG a riposo e da sforzo","url":"https://bio-clinic.it/cardiologia/visita-cardiologica-ecg/"},
        {"@type":"MedicalTest","name":"Ecocardiogramma","url":"https://bio-clinic.it/cardiologia/ecocardiogramma/"},
        {"@type":"MedicalTest","name":"Troponina ad alta sensibilità","url":"https://bio-clinic.it/laboratorio/"},
        {"@type":"MedicalTest","name":"Profilo Lipidico","url":"https://bio-clinic.it/laboratorio/"}
      ],
      "epidemiology": "Prima causa di morte cardiovascolare in Italia con circa 75.000 decessi/anno (dati ISTAT). In Sardegna la mortalità CV è allineata alla media nazionale.",
      "relevantSpecialty": {"@type":"MedicalSpecialty","name":"Cardiologia"}
    },
    # 7) AggregateOffer
    {
      "@type": "AggregateOffer",
      "name": "Prestazioni Cardiologiche Bio-Clinic Sassari",
      "priceCurrency": "EUR",
      "lowPrice": "18",
      "highPrice": "200",
      "offerCount": "39",
      "availability": "https://schema.org/InStock",
      "seller": {"@id":"https://bio-clinic.it/#organization"}
    },
    # 8) FAQPage (12 FAQ)
    {
      "@type": "FAQPage",
      "mainEntity": [
        {"@type":"Question","name":"Quando è necessaria una visita cardiologica?","acceptedAnswer":{"@type":"Answer","text":"Si consiglia una visita cardiologica a partire dai 40 anni come screening preventivo, o prima in caso di familiarità per malattie cardiovascolari, ipertensione arteriosa (valori >140/90 mmHg), diabete mellito, colesterolo alto (LDL >130 mg/dL), fumo, obesità (BMI >30), sedentarietà. È urgente in caso di dolore toracico, affanno, palpitazioni, sincope o edemi agli arti inferiori. Le linee guida ESC 2021 raccomandano la stratificazione del rischio cardiovascolare con il sistema SCORE2 a partire dai 40 anni."}},
        {"@type":"Question","name":"Quanto costa una visita cardiologica a Sassari?","acceptedAnswer":{"@type":"Answer","text":"A Bio-Clinic Sassari la visita cardiologica con ECG ha un costo a partire da €100. L'ecocardiogramma Color Doppler costa €150. L'Holter ECG 24h parte da €120 e l'Holter Pressorio da €100. Il check-up cardiovascolare completo (visita + ECG + ecocardiogramma) è disponibile a €150. Il Profilo Lipidico aggiuntivo presso il laboratorio interno costa €18. I costi possono variare in base allo specialista. Accettiamo le principali convenzioni e fondi sanitari integrativi."}},
        {"@type":"Question","name":"Cos'è l'ecocardiogramma e quando serve?","acceptedAnswer":{"@type":"Answer","text":"L'ecocardiogramma Color Doppler è un'ecografia del cuore non invasiva che permette di visualizzare in tempo reale la struttura e la funzione cardiaca: dimensioni delle camere, spessore delle pareti, funzione valvolare, contrattilità miocardica e flussi intracardiaci. È indicato per: valvulopatie, scompenso cardiaco, ipertensione, post-infarto, cardiomiopatie, screening in pazienti a rischio CV. Durata 20-30 minuti, senza preparazione. A Bio-Clinic Sassari è eseguito da tutti e 5 i cardiologi dell'équipe con referto immediato."}},
        {"@type":"Question","name":"A cosa serve l'Holter ECG 24 ore?","acceptedAnswer":{"@type":"Answer","text":"L'Holter ECG è un monitoraggio continuo dell'attività elettrica del cuore per 24-48 ore mediante un piccolo dispositivo portatile. Serve per identificare aritmie (fibrillazione atriale, extrasistoli, tachicardie), alterazioni del ritmo intermittenti, episodi di ischemia silente e per valutare l'efficacia della terapia antiaritmica. Secondo le linee guida ESC 2024, è l'esame di prima scelta per la diagnosi di aritmie parossistiche. A Bio-Clinic è eseguito dal Dott. Pischedda e dal Dott. Franca."}},
        {"@type":"Question","name":"Quali sono i migliori cardiologi a Sassari?","acceptedAnswer":{"@type":"Answer","text":"Bio-Clinic Sassari dispone di 5 cardiologi specialisti con competenze complementari: Dott. Tonino Bullitta (Albo n. 2054) esperto in ecocardiografia; Dott.ssa Sara Uras (Albo n. 5084) specializzata in diagnostica cardiovascolare; Dott.ssa Giuliana Guagnozzi (Albo n. 42447) esperta in prevenzione CV; Dott. Paolo Pischedda (Albo n. 5264) e Dott. Paolo Franca (Albo n. 6108), entrambi specializzati in Holter, Eco-Doppler TSA e test da sforzo. Tutti iscritti all'Ordine dei Medici, con oltre 3.200 recensioni positive per il centro."}},
        {"@type":"Question","name":"Come prenotare una visita cardiologica a Bio-Clinic?","acceptedAnswer":{"@type":"Answer","text":"Puoi prenotare la visita cardiologica in tre modi: telefonando al 079 956 1332 (lun-ven 07:00-21:00, sab 08:00-14:00); inviando un messaggio WhatsApp allo stesso numero; oppure prenotando online tramite MioDottore. Tempi di attesa medi: 3-5 giorni lavorativi. Per urgenze cardiologiche è disponibile una corsia preferenziale."}},
        {"@type":"Question","name":"Qual è la differenza tra Holter ECG e Holter Pressorio?","acceptedAnswer":{"@type":"Answer","text":"L'Holter ECG monitora l'attività elettrica del cuore (ritmo, aritmie, ischemia) per 24-48 ore tramite elettrodi sul torace. L'Holter Pressorio (ABPM) monitora la pressione arteriosa mediante un bracciale automatico che si gonfia ogni 15-30 minuti per 24 ore. Il primo serve per diagnosticare aritmie e disturbi della conduzione; il secondo per confermare ipertensione arteriosa, valutare l'efficacia della terapia antipertensiva e identificare l'ipertensione mascherata o da camice bianco. Entrambi sono eseguiti dal Dott. Pischedda e dal Dott. Franca."}},
        {"@type":"Question","name":"Quali esami del sangue servono per il cuore?","acceptedAnswer":{"@type":"Answer","text":"Gli esami di laboratorio fondamentali per la salute cardiovascolare includono: Profilo Lipidico completo (colesterolo totale, HDL, LDL, trigliceridi) per stratificare il rischio CV secondo SCORE2 (ESC 2021); Troponina ad alta sensibilità come marker di danno miocardico; NT-proBNP per lo screening dello scompenso cardiaco; Glicemia e Emoglobina Glicata (HbA1c) per il diabete; PCR ad alta sensibilità come marker infiammatorio; Omocisteina (particolarmente rilevante in Sardegna per l'alta prevalenza del polimorfismo MTHFR); Profilo Coagulazione (PT/INR) per pazienti in terapia anticoagulante. Bio-Clinic è l'unico centro a Sassari con laboratorio analisi interno: puoi eseguire gli esami del sangue prima o dopo la visita cardiologica, nella stessa sede."}},
        {"@type":"Question","name":"Cos'è l'Eco-Doppler TSA e perché è importante?","acceptedAnswer":{"@type":"Answer","text":"L'Eco-Doppler dei Tronchi Sovra-Aortici (TSA) è un esame ecografico non invasivo che studia le arterie carotidi e vertebrali, valutando la presenza di placche aterosclerotiche, stenosi e il flusso sanguigno verso il cervello. È fondamentale per la prevenzione dell'ictus cerebrale: le linee guida ESC/ESVS 2023 lo raccomandano come screening nei pazienti con fattori di rischio cardiovascolare (ipertensione, diabete, fumo, dislipidemia) e nei soggetti over 65. A Bio-Clinic è eseguito dal Dott. Pischedda e dal Dott. Franca con referto immediato."}},
        {"@type":"Question","name":"Bio-Clinic accetta convenzioni per la cardiologia?","acceptedAnswer":{"@type":"Answer","text":"Sì, Bio-Clinic Sassari è convenzionata con i principali fondi sanitari integrativi e assicurazioni sanitarie. Le convenzioni possono coprire parzialmente o totalmente il costo della visita cardiologica e degli esami diagnostici. Per verificare la tua specifica convenzione, contattaci al 079 956 1332 o consulta la pagina dedicata alle convenzioni sul nostro sito."}},
        {"@type":"Question","name":"Perché la Sardegna ha un rischio cardiovascolare particolare?","acceptedAnswer":{"@type":"Answer","text":"La Sardegna presenta peculiarità epidemiologiche cardiovascolari significative: prevalenza di diabete tipo 2 del 7,2% (vs 5,4% media italiana, dati ISS); alta frequenza del polimorfismo MTHFR C677T (25-30% omozigoti) che causa iperomocisteinemia, fattore di rischio CV indipendente; prevalenza di beta-talassemia eterozigote (12-15%) che può influenzare l'emocromo e la capacità di trasporto dell'ossigeno; invecchiamento della popolazione rurale con accesso limitato a screening cardiologici. Per queste ragioni, Bio-Clinic ha integrato nel percorso cardiologico il dosaggio dell'omocisteina e dell'emoglobina glicata come esami di routine."}},
        {"@type":"Question","name":"Posso fare visita cardiologica e analisi del sangue nella stessa giornata?","acceptedAnswer":{"@type":"Answer","text":"Sì, questo è il vantaggio principale di Bio-Clinic: siamo l'unico poliambulatorio a Sassari con laboratorio analisi interno. Puoi eseguire il prelievo del sangue (Profilo Lipidico, Glicemia, Troponina, PCR, Omocisteina) e la visita cardiologica nella stessa mattinata. I referti del laboratorio sono disponibili in 4 ore per le urgenze. Questo approccio integrato, raccomandato dalle linee guida ESC 2021, permette al cardiologo di avere un quadro clinico completo durante la stessa seduta diagnostica."}}
      ]
    }
  ]
}

schema_json = json.dumps(schema, ensure_ascii=False, separators=(',', ':'))

print(f"Schema JSON-LD generato: {len(schema_json)} caratteri")
print(f"FAQ nel schema: 12")

# Salva schema per uso nel template
with open('/tmp/cardio_schema.json', 'w') as f:
    f.write(schema_json)

print("OK: Schema salvato")
