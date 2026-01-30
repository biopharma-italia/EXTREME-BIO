/**
 * Script per aggiungere FAQ Schema alle pagine che ne sono prive
 * Bio-Clinic Sassari - SEO Optimization
 */

const fs = require('fs');
const path = require('path');

// FAQ pertinenti per ogni specialità
const faqData = {
    'visita-internistica.html': {
        specialty: 'Medicina Interna',
        faqs: [
            {
                question: "Cosa si valuta in una visita internistica?",
                answer: "La visita internistica è una valutazione medica globale che analizza il paziente nel suo complesso: anamnesi, esame obiettivo, analisi di parametri vitali e coordinamento con altre specialità per patologie complesse o multiorgano."
            },
            {
                question: "Quando è consigliata una visita internistica?",
                answer: "È indicata per sintomi non specifici (stanchezza cronica, calo ponderale), patologie croniche multiple, check-up completi, o quando serve un inquadramento diagnostico prima di rivolgersi a uno specialista."
            },
            {
                question: "Devo portare esami precedenti alla visita?",
                answer: "Sì, è molto utile portare esami del sangue, referti di visite specialistiche e lista dei farmaci assunti. Bio-Clinic dispone anche di laboratorio interno per esami immediati se necessario."
            }
        ]
    },
    'visita-medicina-lavoro.html': {
        specialty: 'Medicina del Lavoro',
        faqs: [
            {
                question: "Cosa comprende la visita di medicina del lavoro?",
                answer: "La visita include anamnesi lavorativa, esame obiettivo, valutazione idoneità alla mansione specifica, eventuali esami strumentali (spirometria, audiometria, visiotest) e rilascio del giudizio di idoneità."
            },
            {
                question: "Chi deve fare la visita di medicina del lavoro?",
                answer: "È obbligatoria per tutti i lavoratori esposti a rischi specifici secondo il D.Lgs. 81/08. Il datore di lavoro deve garantire la sorveglianza sanitaria tramite il medico competente."
            },
            {
                question: "Ogni quanto va ripetuta la visita?",
                answer: "La periodicità dipende dal tipo di rischio: generalmente annuale, ma può essere biennale o con altra frequenza in base al protocollo sanitario aziendale definito dal medico competente."
            }
        ]
    },
    'visita-medicina-sport.html': {
        specialty: 'Medicina dello Sport',
        faqs: [
            {
                question: "Qual è la differenza tra certificato non agonistico e agonistico?",
                answer: "Il certificato non agonistico richiede visita medica ed ECG a riposo. Il certificato agonistico prevede anche ECG sotto sforzo (step test o cicloergometro), spirometria e test urine, secondo i protocolli FMSI."
            },
            {
                question: "Quanto dura il certificato medico sportivo?",
                answer: "Il certificato agonistico ha validità annuale. Il certificato non agonistico ha validità variabile: 1 anno per la maggior parte delle attività, 3 anni per gli under 18 in attività a basso impatto cardiovascolare."
            },
            {
                question: "Rilasciate certificati per tutti gli sport?",
                answer: "Sì, Bio-Clinic rilascia certificati per tutte le discipline sportive: calcio, nuoto, palestra, ciclismo, running, arti marziali. Per sport ad alto rischio cardiovascolare eseguiamo protocolli specifici."
            }
        ]
    },
    'visita-nefrologica.html': {
        specialty: 'Nefrologia',
        faqs: [
            {
                question: "Quando è necessaria una visita nefrologica?",
                answer: "È consigliata in caso di alterazioni della funzione renale (creatinina elevata), proteinuria, ematuria, infezioni urinarie ricorrenti, ipertensione arteriosa, diabete con coinvolgimento renale, calcolosi renale."
            },
            {
                question: "Quali esami devo portare alla visita nefrologica?",
                answer: "È importante portare: esami del sangue recenti (creatinina, azotemia, elettroliti), esame urine, eventuali ecografie renali e lista dei farmaci assunti. Bio-Clinic può eseguire gli esami mancanti in sede."
            },
            {
                question: "La visita nefrologica è dolorosa?",
                answer: "Assolutamente no. Consiste in anamnesi, misurazione pressione arteriosa, esame obiettivo e valutazione degli esami. Eventuali ecografie sono indolori e non invasive."
            }
        ]
    },
    'visita-nutrizionale.html': {
        specialty: 'Nutrizione',
        faqs: [
            {
                question: "Cosa comprende la visita nutrizionale?",
                answer: "La visita include anamnesi alimentare, analisi della composizione corporea (peso, BMI, massa grassa/magra), valutazione del metabolismo basale, piano alimentare personalizzato e obiettivi a breve e lungo termine."
            },
            {
                question: "Il piano alimentare è personalizzato?",
                answer: "Sì, ogni piano è costruito sulle esigenze individuali: patologie, allergie, intolleranze, stile di vita, preferenze alimentari e obiettivi specifici (dimagrimento, performance sportiva, patologie metaboliche)."
            },
            {
                question: "Quante visite di controllo sono necessarie?",
                answer: "Generalmente si consiglia un controllo ogni 3-4 settimane nella fase iniziale, poi mensilmente. Il follow-up permette di monitorare i progressi e adattare il piano alimentare."
            }
        ]
    },
    'visita-pediatrica.html': {
        specialty: 'Pediatria',
        faqs: [
            {
                question: "Da che età si può portare il bambino alla visita pediatrica?",
                answer: "Bio-Clinic segue i bambini dalla nascita fino ai 14-16 anni. Per i neonati offriamo visite di controllo della crescita, mentre per i più grandi anche certificati sportivi e visite specialistiche."
            },
            {
                question: "Cosa comprende la visita pediatrica?",
                answer: "La visita include valutazione della crescita (peso, altezza, percentili), sviluppo psicomotorio, esame obiettivo completo, valutazione vaccinazioni e risposta a dubbi dei genitori su alimentazione e salute."
            },
            {
                question: "Fate anche vaccini in ambulatorio?",
                answer: "Bio-Clinic offre consulenza vaccinale completa. Per le vaccinazioni obbligatorie rimandiamo ai servizi ASL, mentre possiamo somministrare vaccini facoltativi come antinfluenzale e antipneumococco."
            }
        ]
    }
};

// Funzione per creare il blocco FAQ Schema
function createFaqSchema(faqs) {
    const faqItems = faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
        }
    }));
    
    return {
        "@type": "FAQPage",
        "mainEntity": faqItems
    };
}

// Funzione per inserire FAQ nel JSON-LD esistente
function addFaqToPage(filePath, faqs) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se già presente FAQPage
    if (content.includes('FAQPage')) {
        console.log(`⏭️  ${path.basename(filePath)} - FAQPage già presente, skip`);
        return false;
    }
    
    // Trova il JSON-LD schema
    const jsonLdRegex = /<script type="application\/ld\+json">\s*\{[\s\S]*?"@graph":\s*\[([\s\S]*?)\]\s*\}\s*<\/script>/;
    const match = content.match(jsonLdRegex);
    
    if (!match) {
        console.log(`❌ ${path.basename(filePath)} - JSON-LD @graph non trovato`);
        return false;
    }
    
    // Crea il blocco FAQ
    const faqSchema = createFaqSchema(faqs);
    const faqJson = JSON.stringify(faqSchema, null, 10);
    
    // Trova l'ultima chiusura del BreadcrumbList (o dell'ultimo elemento del graph)
    // e aggiungi la FAQ dopo
    const graphContent = match[1];
    
    // Pattern per trovare la fine del BreadcrumbList
    const breadcrumbEndPattern = /(\s*\}\s*\]\s*\}\s*)(\s*\]\s*\}\s*<\/script>)/;
    const breadcrumbMatch = content.match(breadcrumbEndPattern);
    
    if (breadcrumbMatch) {
        // Inserisci FAQ dopo BreadcrumbList
        const replacement = breadcrumbMatch[1] + ',\n        ' + faqJson + breadcrumbMatch[2];
        content = content.replace(breadcrumbEndPattern, replacement);
    } else {
        // Fallback: cerca la fine del @graph array
        const graphEndPattern = /(\]\s*\}\s*)(<\/script>)/;
        const insertPoint = content.search(graphEndPattern);
        
        if (insertPoint === -1) {
            console.log(`❌ ${path.basename(filePath)} - Punto di inserimento non trovato`);
            return false;
        }
        
        // Inserisci prima della chiusura
        content = content.replace(graphEndPattern, ',\n        ' + faqJson + '\n      ]\n    }\n    </script>');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)} - FAQ Schema aggiunto (${faqs.length} domande)`);
    return true;
}

// Main
const pagesDir = path.join(__dirname, '../pages');
let updated = 0;
let skipped = 0;

console.log('\n🔧 Aggiunta FAQ Schema alle pagine Bio-Clinic\n');
console.log('=' .repeat(50));

for (const [filename, data] of Object.entries(faqData)) {
    const filePath = path.join(pagesDir, filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${filename} - File non trovato`);
        continue;
    }
    
    if (addFaqToPage(filePath, data.faqs)) {
        updated++;
    } else {
        skipped++;
    }
}

console.log('\n' + '=' .repeat(50));
console.log(`\n📊 Riepilogo: ${updated} pagine aggiornate, ${skipped} saltate\n`);
