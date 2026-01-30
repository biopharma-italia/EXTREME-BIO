#!/usr/bin/env node
/**
 * BIO-CLINIC DEEP CLINICAL CONTENT INJECTION
 * Aggiunge sezione "INFO PAZIENTE & FAQ" a tutte le pagine prestazioni
 * Rende le pagine più umane e pratiche per i pazienti
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// DATASET CLINICO - FONTE DI VERITÀ
// ============================================================================
const CLINICAL_INFO = {
  "Dermatologia": {
    "durata": "20-30 minuti",
    "preparazione": "Nessuna. Evitare trucco sul viso se la visita riguarda il volto.",
    "color": "#8E24AA",
    "faq": [
      { q: "La mappatura dei nei è dolorosa?", a: "Assolutamente no. È un esame fotografico digitale non invasivo che permette di monitorare l'evoluzione dei nei nel tempo." },
      { q: "Se c'è un neo sospetto, lo togliete subito?", a: "Sì, disponiamo di sala chirurgica ambulatoriale per asportazioni immediate con esame istologico rapido." },
      { q: "Quanto costa l'asportazione di un neo?", a: "Il costo dipende dalla complessità. Durante la visita il dermatologo fornirà un preventivo preciso." }
    ]
  },
  "Cardiologia": {
    "durata": "30-40 minuti (con ECG)",
    "preparazione": "Portare esami del sangue recenti e lista farmaci assunti.",
    "color": "#E53935",
    "faq": [
      { q: "Posso fare la visita se ho il pacemaker?", a: "Sì, assolutamente. Segnalalo all'accettazione per una gestione ottimale." },
      { q: "Il referto è immediato?", a: "Sì, il cardiologo consegna e spiega il referto alla fine della visita." },
      { q: "L'ECG è incluso nella visita?", a: "Sì, la visita cardiologica include sempre l'elettrocardiogramma." }
    ]
  },
  "Ginecologia": {
    "durata": "20-30 minuti",
    "preparazione": "Evitare rapporti nelle 24h precedenti se previsto Pap-Test.",
    "color": "#E91E63",
    "faq": [
      { q: "Fate l'ecografia durante la visita?", a: "Sì, lo studio è dotato di ecografo interno per la valutazione immediata." },
      { q: "Posso venire con il ciclo?", a: "Per la visita semplice sì, per il Pap-Test è meglio attendere la fine del ciclo." },
      { q: "È possibile prenotare per gravidanza?", a: "Certo, offriamo percorsi completi di assistenza ostetrica dalla prima visita al parto." }
    ]
  },
  "Urologia": {
    "durata": "20-25 minuti",
    "preparazione": "Presentarsi a vescica piena per l'ecografia sovrapubica.",
    "color": "#FF7043",
    "faq": [
      { q: "L'esame della prostata è obbligatorio?", a: "È a discrezione del medico, ma è il metodo più sicuro per la prevenzione dopo i 50 anni." },
      { q: "Fate anche andrologia?", a: "Sì, trattiamo disfunzioni erettili e infertilità maschile con approccio multidisciplinare." },
      { q: "Posso fare il PSA lo stesso giorno?", a: "Sì, il nostro laboratorio interno può eseguire il dosaggio PSA prima della visita." }
    ]
  },
  "Oculistica": {
    "durata": "30-40 minuti",
    "preparazione": "Portare gli occhiali in uso. Se prevista dilatazione, non guidare al ritorno.",
    "color": "#0288D1",
    "faq": [
      { q: "Mi metterete le gocce?", a: "Solo se necessario per il fondo oculare. L'effetto svanisce in 2-3 ore." },
      { q: "Visitate i bambini?", a: "Sì, eseguiamo screening ortottici pediatrici a partire dai 3 anni." },
      { q: "Fate OCT e Campo Visivo in sede?", a: "Sì, disponiamo di OCT Cirrus HD e Campo Visivo Humphrey per diagnosi complete." }
    ]
  },
  "Ortopedia": {
    "durata": "20-25 minuti",
    "preparazione": "Portare RX o Risonanze precedenti (anche su CD).",
    "color": "#00897B",
    "faq": [
      { q: "Fate infiltrazioni subito?", a: "Sì, se il medico lo ritiene indicato possiamo procedere nella stessa seduta con infiltrazioni ecoguidate." },
      { q: "Trattate traumi sportivi?", a: "Sì, siamo specializzati nel recupero rapido dell'atleta con percorsi riabilitativi dedicati." },
      { q: "Fate ecografie muscolo-scheletriche?", a: "Sì, l'ecografia MSK è disponibile in sede per diagnosi immediate." }
    ]
  },
  "Endocrinologia": {
    "durata": "25-30 minuti",
    "preparazione": "Portare esami ormonali recenti. Digiuno non richiesto.",
    "color": "#4A90A4",
    "faq": [
      { q: "Fate l'ecografia tiroidea durante la visita?", a: "Sì, l'ecografo è nello stesso ambulatorio per una valutazione completa." },
      { q: "Posso fare gli esami del sangue lo stesso giorno?", a: "Sì, il laboratorio interno può eseguire TSH, FT3, FT4 e anticorpi tiroidei." },
      { q: "Trattate anche problemi di peso?", a: "Sì, offriamo percorsi nutrizionali integrati con la valutazione endocrinologica." }
    ]
  },
  "Neurologia": {
    "durata": "30-40 minuti",
    "preparazione": "Portare eventuali RMN o TAC precedenti. Non sospendere farmaci.",
    "color": "#5C6BC0",
    "faq": [
      { q: "Fate l'elettromiografia in sede?", a: "Sì, disponiamo di elettromiografo digitale multicanale." },
      { q: "Trattate le cefalee?", a: "Sì, offriamo percorsi diagnostici e terapeutici per cefalee primarie e secondarie." },
      { q: "È possibile fare il Doppler TSA?", a: "Sì, collaboriamo con la Chirurgia Vascolare per la diagnostica carotidea." }
    ]
  },
  "Pneumologia": {
    "durata": "25-30 minuti",
    "preparazione": "Non fumare nelle 4h precedenti la spirometria.",
    "color": "#26A69A",
    "faq": [
      { q: "La spirometria è compresa nella visita?", a: "Può essere inclusa o richiesta separatamente, in base alla valutazione del medico." },
      { q: "Trattate le apnee notturne?", a: "Sì, offriamo screening e collaboriamo con centri del sonno per la polisonnografia." },
      { q: "Fate test allergologici?", a: "Sì, il laboratorio può eseguire RAST per allergeni respiratori." }
    ]
  },
  "Vascolare": {
    "durata": "25-30 minuti",
    "preparazione": "Indossare abiti comodi. Portare esami del sangue recenti.",
    "color": "#D32F2F",
    "faq": [
      { q: "L'Eco-Doppler è incluso?", a: "Dipende dalla visita. Può essere richiesto contestualmente o in appuntamento dedicato." },
      { q: "Fate scleroterapia?", a: "Sì, trattiamo capillari e varici con scleroterapia estetica e funzionale." },
      { q: "Quanto tempo richiede la scleroterapia?", a: "15-20 minuti per seduta. Il numero di sedute dipende dall'estensione." }
    ]
  },
  "Ematologia": {
    "durata": "30-40 minuti",
    "preparazione": "Portare tutti gli esami ematologici precedenti.",
    "color": "#C62828",
    "faq": [
      { q: "Interpretate anche esami fatti altrove?", a: "Sì, l'ematologo può valutare referti di altri laboratori e suggerire approfondimenti." },
      { q: "Fate lo striscio periferico?", a: "Sì, il laboratorio interno può eseguire l'esame microscopico del sangue." },
      { q: "Trattate le anemie?", a: "Sì, diagnostichiamo e gestiamo tutte le forme di anemia." }
    ]
  },
  "Gastroenterologia": {
    "durata": "25-30 minuti",
    "preparazione": "Portare esami precedenti. Digiuno solo se richiesto per esami specifici.",
    "color": "#558B2F",
    "faq": [
      { q: "Fate il Breath Test in sede?", a: "Sì, eseguiamo test per Helicobacter pylori, intolleranza al lattosio e sovracrescita batterica." },
      { q: "L'ecografia addominale è inclusa?", a: "Può essere richiesta contestualmente alla visita." },
      { q: "Trattate il reflusso gastroesofageo?", a: "Sì, con approccio diagnostico e terapeutico personalizzato." }
    ]
  },
  "ORL": {
    "durata": "20-25 minuti",
    "preparazione": "Nessuna particolare. Portare eventuali audiometrie precedenti.",
    "color": "#7E57C2",
    "faq": [
      { q: "Fate l'audiometria in sede?", a: "Sì, disponiamo di cabina audiometrica per esami dell'udito completi." },
      { q: "Fate lavaggi auricolari?", a: "Sì, rimuoviamo tappi di cerume in sicurezza durante la visita." },
      { q: "Trattate le vertigini?", a: "Sì, con esami vestibologici e manovre liberatorie per la vertigine posizionale." }
    ]
  },
  "Ostetricia": {
    "durata": "30-45 minuti",
    "preparazione": "Portare cartella della gravidanza e esami precedenti.",
    "color": "#E91E8C",
    "faq": [
      { q: "Fate ecografie 3D/4D?", a: "Sì, disponiamo di ecografo Voluson E10 per imaging fetale avanzato." },
      { q: "Offrite corsi preparto?", a: "Sì, con ostetriche dedicate e percorsi personalizzati." },
      { q: "Seguite la gravidanza fino al parto?", a: "Sì, offriamo assistenza continua con possibilità di parto in strutture convenzionate." }
    ]
  },
  "Fisiatria": {
    "durata": "25-30 minuti",
    "preparazione": "Portare RX, RMN o referti ortopedici/neurologici recenti.",
    "color": "#00ACC1",
    "faq": [
      { q: "Prescrivete la fisioterapia?", a: "Sì, il fisiatra può prescrivere cicli riabilitativi personalizzati." },
      { q: "Collaborate con ortopedici?", a: "Sì, abbiamo un percorso integrato ortopedia-fisiatria-riabilitazione." },
      { q: "Trattate il mal di schiena?", a: "Sì, con approccio multidisciplinare incluse infiltrazioni e terapia fisica." }
    ]
  },
  "Reumatologia": {
    "durata": "30-40 minuti",
    "preparazione": "Portare esami del sangue recenti (VES, PCR, Fattore Reumatoide).",
    "color": "#795548",
    "faq": [
      { q: "Trattate l'artrite reumatoide?", a: "Sì, con diagnosi precoce e terapie biologiche quando indicate." },
      { q: "Fate ecografie articolari?", a: "Sì, per valutare sinoviti e versamenti articolari." },
      { q: "Collaborate con altri specialisti?", a: "Sì, approccio multidisciplinare con ortopedici, fisiatri e internisti." }
    ]
  },
  "Pediatria": {
    "durata": "20-30 minuti",
    "preparazione": "Portare libretto sanitario e vaccini. Bambino preferibilmente sveglio.",
    "color": "#F06292",
    "faq": [
      { q: "Fate visite ai neonati?", a: "Sì, visite pediatriche dal primo mese di vita." },
      { q: "Eseguite vaccini?", a: "Sì, offriamo vaccinazioni pediatriche con vaccini di alta qualità." },
      { q: "Fate certificati per sport?", a: "Sì, rilasciamo certificati medici per attività sportiva non agonistica." }
    ]
  },
  "Psicologia": {
    "durata": "45-60 minuti (primo colloquio)",
    "preparazione": "Nessuna particolare. Arrivare con qualche minuto di anticipo.",
    "color": "#9C27B0",
    "faq": [
      { q: "Il primo colloquio è vincolante?", a: "No, serve a conoscersi e valutare insieme il percorso più adatto." },
      { q: "Offrite terapia di coppia?", a: "Sì, con psicologi specializzati in dinamiche relazionali." },
      { q: "Le sedute sono coperte da assicurazione?", a: "Dipende dalla polizza. Rilasciamo fattura valida per rimborsi." }
    ]
  },
  "Default": {
    "durata": "20-30 minuti",
    "preparazione": "Portare documentazione clinica precedente ed elenco farmaci.",
    "color": "#455A64",
    "faq": [
      { q: "Servono esami prima della visita?", a: "Non obbligatoriamente, il medico prescriverà quelli necessari dopo la valutazione." },
      { q: "I tempi di attesa sono lunghi?", a: "No, garantiamo appuntamenti entro 24/48h per la maggior parte delle specialità." },
      { q: "Il referto è immediato?", a: "Nella maggior parte dei casi sì. Per esami che richiedono elaborazione, entro 24-48h." }
    ]
  }
};

// ============================================================================
// MAPPING FILE -> SPECIALITÀ
// ============================================================================
const FILE_SPECIALTY_MAP = {
  // Ginecologia
  "visita-ginecologica.html": "Ginecologia",
  "ecografia-transvaginale.html": "Ginecologia",
  "pap-test.html": "Ginecologia",
  "ecografia-pelvica.html": "Ginecologia",
  "ecografia-mammaria.html": "Ginecologia",
  "isteroscopia.html": "Ginecologia",
  "ecografia-morfologica.html": "Ostetricia",
  "assistenza-ostetrica.html": "Ostetricia",
  "corso-preparto.html": "Ostetricia",
  "riabilitazione-pavimento-pelvico.html": "Ginecologia",
  "ecografia-ostetrica-3d.html": "Ostetricia",
  
  // Cardiologia
  "visita-cardiologica-ecg.html": "Cardiologia",
  "ecocardiogramma.html": "Cardiologia",
  "holter-ecg.html": "Cardiologia",
  "holter-pressorio.html": "Cardiologia",
  
  // Endocrinologia
  "visita-endocrinologica.html": "Endocrinologia",
  "ecografia-tiroidea.html": "Endocrinologia",
  "visita-nutrizionale.html": "Endocrinologia",
  
  // Dermatologia
  "visita-dermatologica.html": "Dermatologia",
  "mappatura-nevi.html": "Dermatologia",
  
  // Neurologia
  "visita-neurologica.html": "Neurologia",
  "elettromiografia.html": "Neurologia",
  
  // Urologia
  "visita-urologica.html": "Urologia",
  "ecografia-prostatica.html": "Urologia",
  "visita-nefrologica.html": "Urologia",
  
  // Pneumologia
  "visita-pneumologica.html": "Pneumologia",
  "spirometria.html": "Pneumologia",
  
  // Oculistica
  "visita-oculistica.html": "Oculistica",
  "campo-visivo.html": "Oculistica",
  
  // Ortopedia
  "visita-ortopedica.html": "Ortopedia",
  "infiltrazioni-articolari.html": "Ortopedia",
  "visita-fisiatrica.html": "Fisiatria",
  "visita-reumatologica.html": "Reumatologia",
  
  // Vascolare
  "visita-chirurgia-vascolare.html": "Vascolare",
  "eco-doppler-arti.html": "Vascolare",
  "scleroterapia.html": "Vascolare",
  
  // Ematologia
  "visita-ematologica.html": "Ematologia",
  
  // Gastroenterologia
  "visita-gastroenterologica.html": "Gastroenterologia",
  "ecografia-addominale.html": "Gastroenterologia",
  
  // ORL
  "visita-orl.html": "ORL",
  
  // Altre
  "visita-internistica.html": "Default",
  "visita-medicina-lavoro.html": "Default",
  "visita-medicina-sport.html": "Default",
  "visita-pediatrica.html": "Pediatria",
  "colloquio-psicologico.html": "Psicologia"
};

// ============================================================================
// GENERATORE BLOCCO HTML
// ============================================================================
function generateClinicalInfoBlock(specialty, data) {
  const faqItems = data.faq.map(faq => `
            <details class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
                <summary class="flex justify-between items-center p-5 cursor-pointer list-none font-semibold text-gray-700 hover:text-green-600 transition">
                    <span>${faq.q}</span>
                    <span class="transition group-open:rotate-180"><i class="fas fa-chevron-down text-gray-400"></i></span>
                </summary>
                <div class="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    ${faq.a}
                </div>
            </details>`
  ).join('\n');

  return `
    <!-- SEZIONE INFO CLINICHE AGGIUNTIVE - ${specialty} -->
    <section class="py-16 bg-gray-50 border-t border-gray-200">
        <div class="max-w-4xl mx-auto px-4">
            
            <!-- TABELLA RIASSUNTIVA -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
                <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl" style="background: ${data.color}15; color: ${data.color};">
                            <i class="far fa-clock"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase font-bold tracking-wide">Durata Media</p>
                            <p class="font-bold text-gray-800 text-lg">${data.durata}</p>
                        </div>
                    </div>
                    <div class="w-px h-16 bg-gray-200 hidden md:block"></div>
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                        <div class="max-w-xs">
                            <p class="text-xs text-gray-500 uppercase font-bold tracking-wide">Preparazione</p>
                            <p class="font-medium text-gray-700 text-sm">${data.preparazione}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FAQ ACCORDION -->
            <h3 class="text-2xl font-bold text-center mb-8 text-gray-800">
                <i class="fas fa-comments text-gray-400 mr-2"></i>
                Domande Frequenti
            </h3>
            <div class="space-y-4">
${faqItems}
            </div>

            <!-- CTA FINALE -->
            <div class="mt-12 text-center bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                <p class="text-gray-600 mb-4">Hai ancora dubbi? Il nostro team è a tua disposizione.</p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <a href="tel:+390799561332" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                        <i class="fas fa-phone"></i> Chiama 079 956 1332
                    </a>
                    <a href="https://wa.me/390799561332" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
                        <i class="fab fa-whatsapp text-green-500"></i> WhatsApp
                    </a>
                </div>
            </div>

        </div>
    </section>`;
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================
const PAGES_DIR = path.join(__dirname, '..', 'pages');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     BIO-CLINIC DEEP CLINICAL CONTENT INJECTION                ║');
console.log('║     "Info Paziente & FAQ" per tutte le prestazioni            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalUpdated = 0;
let totalSkipped = 0;
let totalErrors = 0;

// Processa tutti i file mappati
for (const [filename, specialty] of Object.entries(FILE_SPECIALTY_MAP)) {
  const filePath = path.join(PAGES_DIR, filename);
  
  // Verifica esistenza file
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${filename} - FILE NON TROVATO`);
    totalErrors++;
    continue;
  }
  
  // Leggi il file
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Verifica se già aggiornato
  if (html.includes('SEZIONE INFO CLINICHE AGGIUNTIVE')) {
    console.log(`⏭️  ${filename} - già aggiornato`);
    totalSkipped++;
    continue;
  }
  
  // Ottieni i dati clinici (usa Default se non trovato)
  const clinicalData = CLINICAL_INFO[specialty] || CLINICAL_INFO['Default'];
  
  // Genera il blocco HTML
  const clinicalBlock = generateClinicalInfoBlock(specialty, clinicalData);
  
  // Trova il punto di inserimento (prima del footer o prima di </main>)
  let insertionDone = false;
  
  // Strategia 1: Prima del footer
  const footerMatch = html.match(/<footer[^>]*class="footer"/i);
  if (footerMatch) {
    const insertPoint = footerMatch.index;
    html = html.slice(0, insertPoint) + clinicalBlock + '\n\n    ' + html.slice(insertPoint);
    insertionDone = true;
  }
  
  // Strategia 2: Prima di </main>
  if (!insertionDone) {
    const mainEndMatch = html.lastIndexOf('</main>');
    if (mainEndMatch !== -1) {
      html = html.slice(0, mainEndMatch) + clinicalBlock + '\n\n    ' + html.slice(mainEndMatch);
      insertionDone = true;
    }
  }
  
  // Strategia 3: Prima di </body>
  if (!insertionDone) {
    const bodyEndMatch = html.lastIndexOf('</body>');
    if (bodyEndMatch !== -1) {
      html = html.slice(0, bodyEndMatch) + clinicalBlock + '\n\n    ' + html.slice(bodyEndMatch);
      insertionDone = true;
    }
  }
  
  if (!insertionDone) {
    console.log(`⚠️  ${filename} - Impossibile trovare punto di inserimento`);
    totalErrors++;
    continue;
  }
  
  // Scrivi il file aggiornato
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ ${filename} - ${specialty} - AGGIORNATO`);
  totalUpdated++;
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                         RIEPILOGO                              ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`   ✅ Aggiornati:  ${totalUpdated}`);
console.log(`   ⏭️  Saltati:     ${totalSkipped}`);
console.log(`   ❌ Errori:      ${totalErrors}`);
console.log(`   📊 Totale:      ${totalUpdated + totalSkipped + totalErrors}`);
console.log('\n🎉 DEEP CLINICAL INJECTION COMPLETATO!\n');
