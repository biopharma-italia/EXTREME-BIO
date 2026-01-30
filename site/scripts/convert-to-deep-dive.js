#!/usr/bin/env node
/**
 * Script per convertire le pagine al template Deep Dive
 * Pagine da convertire: oculistica, pediatrica, internistica, 
 * medicina-lavoro, medicina-sport, nefrologica, nutrizionale
 */

const fs = require('fs');
const path = require('path');

// Configurazione delle pagine da convertire
const pageConfigs = {
  'visita-oculistica': {
    specialty: 'Oculistica',
    color: '#0288D1',
    colorLight: '#E1F5FE',
    icon: 'fa-eye',
    duration: '30 minuti',
    description: 'Valutazione completa della salute degli occhi con strumentazione diagnostica avanzata: OCT (Tomografia), Campo Visivo Computerizzato e Tonometria.',
    services: ['OCT - Tomografia Ottica', 'Campo Visivo Computerizzato', 'Tonometria'],
    symptoms: [
      { group: 'Vista & Visione', icon: 'fa-eye', items: ['Calo della vista', 'Visione offuscata', 'Difficoltà notturna', 'Visione doppia'] },
      { group: 'Allarmi Visivi', icon: 'fa-exclamation-triangle', items: ['Mosche volanti', 'Lampi di luce', 'Macchie nel campo visivo', 'Visione distorta'] },
      { group: 'Prevenzione', icon: 'fa-shield-alt', items: ['Screening glaucoma', 'Fondo oculare diabetici', 'Check-up over 40', 'Familiarità patologie'] }
    ],
    loopText: 'Integrazione con percorso Diabetologico e Cardiologico per la prevenzione della Retinopatia.',
    faqs: [
      { q: 'Cosa sono le mosche volanti?', a: 'Le mosche volanti (miodesopsie) sono ombre nel campo visivo causate da opacità nel vitreo. In Bio-Clinic valutiamo con OCT se sono un segnale di distacco retinico.' },
      { q: 'Come si diagnostica il glaucoma?', a: 'Il glaucoma si diagnostica con tonometria (misurazione pressione oculare), campo visivo computerizzato e OCT del nervo ottico.' },
      { q: 'Ogni quanto fare il controllo oculistico?', a: 'Consigliamo un controllo annuale dopo i 40 anni, o più frequente in caso di diabete, ipertensione o familiarità per glaucoma.' }
    ]
  },
  'visita-pediatrica': {
    specialty: 'Pediatria',
    color: '#FF9800',
    colorLight: '#FFF3E0',
    icon: 'fa-baby',
    duration: '30 minuti',
    description: 'Visite pediatriche complete per la salute e lo sviluppo del tuo bambino. Bilanci di crescita, vaccinazioni e consulenza specialistica.',
    services: ['Bilancio di Crescita', 'Consulenza Vaccinale', 'Screening Neonatale'],
    symptoms: [
      { group: 'Crescita & Sviluppo', icon: 'fa-chart-line', items: ['Controllo peso e altezza', 'Sviluppo psicomotorio', 'Tappe dello sviluppo', 'Alimentazione'] },
      { group: 'Sintomi Comuni', icon: 'fa-thermometer', items: ['Febbre ricorrente', 'Tosse persistente', 'Disturbi gastrointestinali', 'Eruzioni cutanee'] },
      { group: 'Prevenzione', icon: 'fa-syringe', items: ['Piano vaccinale', 'Screening neonatali', 'Controlli periodici', 'Certificati'] }
    ],
    loopText: 'Percorso integrato con laboratorio per esami ematici pediatrici e test allergologici.',
    faqs: [
      { q: 'Ogni quanto portare il bambino dal pediatra?', a: 'Nei primi anni di vita consigliamo visite mensili, poi trimestrali fino ai 3 anni e semestrali fino ai 6 anni.' },
      { q: 'Fate i vaccini?', a: 'Sì, eseguiamo tutte le vaccinazioni del calendario vaccinale pediatrico.' },
      { q: 'Posso prenotare una visita urgente?', a: 'Sì, per urgenze pediatriche chiamare il 079 956 1332 per disponibilità in giornata.' }
    ]
  },
  'visita-internistica': {
    specialty: 'Medicina Interna',
    color: '#673AB7',
    colorLight: '#EDE7F6',
    icon: 'fa-stethoscope',
    duration: '40 minuti',
    description: 'Valutazione clinica globale per patologie complesse, polipatologie e diagnosi differenziale. L\'internista è il medico delle diagnosi difficili.',
    services: ['Valutazione Clinica Globale', 'Gestione Polipatologie', 'Diagnosi Differenziale'],
    symptoms: [
      { group: 'Sintomi Generali', icon: 'fa-user-injured', items: ['Stanchezza cronica', 'Perdita di peso', 'Febbre persistente', 'Sudorazione notturna'] },
      { group: 'Patologie Complesse', icon: 'fa-notes-medical', items: ['Polipatologie', 'Interazioni farmacologiche', 'Diagnosi incerte', 'Second opinion'] },
      { group: 'Prevenzione', icon: 'fa-clipboard-check', items: ['Check-up completo', 'Screening oncologici', 'Valutazione rischio', 'Follow-up cronici'] }
    ],
    loopText: 'Coordinamento con tutti gli specialisti Bio-Clinic per percorsi diagnostici integrati.',
    faqs: [
      { q: 'Quando rivolgersi all\'internista?', a: 'Quando hai sintomi che coinvolgono più organi, prendi molti farmaci, o il tuo medico non riesce a fare una diagnosi precisa.' },
      { q: 'L\'internista è diverso dal medico di base?', a: 'Sì, l\'internista è uno specialista ospedaliero esperto in diagnosi complesse e gestione di polipatologie.' },
      { q: 'Fate anche esami in sede?', a: 'Sì, il nostro laboratorio può eseguire tutti gli esami richiesti con referto in giornata.' }
    ]
  },
  'visita-medicina-lavoro': {
    specialty: 'Medicina del Lavoro',
    color: '#607D8B',
    colorLight: '#ECEFF1',
    icon: 'fa-hard-hat',
    duration: '30 minuti',
    description: 'Visite mediche per lavoratori, sorveglianza sanitaria e certificazioni di idoneità. Conformità al D.Lgs. 81/08.',
    services: ['Visita Preventiva', 'Visita Periodica', 'Certificato Idoneità'],
    symptoms: [
      { group: 'Visite Obbligatorie', icon: 'fa-clipboard-list', items: ['Visita pre-assuntiva', 'Visita periodica', 'Visita su richiesta', 'Visita cambio mansione'] },
      { group: 'Rischi Lavorativi', icon: 'fa-exclamation-circle', items: ['Rischio chimico', 'Rischio rumore', 'Videoterminali', 'Movimentazione carichi'] },
      { group: 'Certificazioni', icon: 'fa-certificate', items: ['Idoneità alla mansione', 'Idoneità con prescrizioni', 'Inidoneità temporanea', 'Cartella sanitaria'] }
    ],
    loopText: 'Pacchetti aziendali personalizzati con esami di laboratorio, audiometria e spirometria.',
    faqs: [
      { q: 'Quali esami sono inclusi nella visita?', a: 'Dipende dai rischi della mansione. Generalmente: visita, esami del sangue, esame urine, visiotest, audiometria se esposto a rumore.' },
      { q: 'Rilasciate il certificato di idoneità?', a: 'Sì, al termine della visita rilasciamo il certificato di idoneità alla mansione specifica.' },
      { q: 'Fate convenzioni aziendali?', a: 'Sì, offriamo pacchetti per aziende con tariffe dedicate. Contattaci per un preventivo.' }
    ]
  },
  'visita-medicina-sport': {
    specialty: 'Medicina dello Sport',
    color: '#4CAF50',
    colorLight: '#E8F5E9',
    icon: 'fa-running',
    duration: '45 minuti',
    description: 'Certificati medico-sportivi agonistici e non agonistici. ECG, spirometria e test da sforzo per la tua sicurezza nello sport.',
    services: ['ECG a Riposo', 'Spirometria', 'Test da Sforzo'],
    symptoms: [
      { group: 'Certificati', icon: 'fa-id-card', items: ['Agonistico', 'Non agonistico', 'Attività ludico-motoria', 'Rinnovo annuale'] },
      { group: 'Sport Specifici', icon: 'fa-futbol', items: ['Calcio', 'Nuoto', 'Ciclismo', 'Fitness/Palestra'] },
      { group: 'Esami Inclusi', icon: 'fa-heartbeat', items: ['ECG a riposo', 'Spirometria', 'Esame urine', 'Test da sforzo (agonistico)'] }
    ],
    loopText: 'Certificati rilasciati in giornata. Test da sforzo con Treadmill Schiller per agonisti.',
    faqs: [
      { q: 'Quanto dura il certificato agonistico?', a: 'Il certificato agonistico ha validità annuale e deve essere rinnovato prima della scadenza.' },
      { q: 'Serve prenotazione?', a: 'Sì, è necessaria la prenotazione. Per il certificato non agonistico spesso disponibilità in giornata.' },
      { q: 'Cosa devo portare?', a: 'Documento d\'identità, tessera sanitaria, eventuale certificato precedente e richiesta della società sportiva (per agonistico).' }
    ]
  },
  'visita-nefrologica': {
    specialty: 'Nefrologia',
    color: '#795548',
    colorLight: '#EFEBE9',
    icon: 'fa-kidneys',
    duration: '30 minuti',
    description: 'Specialisti nella diagnosi e cura delle malattie renali. Monitoraggio della funzione renale e prevenzione dell\'insufficienza renale.',
    services: ['Ecografia Renale', 'Dosaggio Creatinina', 'Esame Urine Completo'],
    symptoms: [
      { group: 'Sintomi Renali', icon: 'fa-tint', items: ['Urine schiumose', 'Sangue nelle urine', 'Minzione frequente', 'Gonfiore gambe/viso'] },
      { group: 'Fattori di Rischio', icon: 'fa-exclamation-triangle', items: ['Diabete', 'Ipertensione', 'Calcoli renali', 'Familiarità nefropatie'] },
      { group: 'Monitoraggio', icon: 'fa-chart-line', items: ['Creatinina elevata', 'GFR ridotto', 'Proteinuria', 'Follow-up IRC'] }
    ],
    loopText: 'Integrazione con laboratorio per profilo renale completo e con cardiologia per gestione ipertensione.',
    faqs: [
      { q: 'Quando fare un controllo nefrologico?', a: 'Se hai diabete, ipertensione, calcoli renali ricorrenti, o se gli esami del sangue mostrano creatinina alta o GFR basso.' },
      { q: 'Fate la dialisi?', a: 'No, siamo un poliambulatorio. Gestiamo la prevenzione e il monitoraggio pre-dialisi, indirizzando ai centri dialisi quando necessario.' },
      { q: 'Posso fare gli esami lo stesso giorno?', a: 'Sì, il nostro laboratorio può eseguire profilo renale completo con referto in giornata.' }
    ]
  },
  'visita-nutrizionale': {
    specialty: 'Nutrizione',
    color: '#8BC34A',
    colorLight: '#F1F8E9',
    icon: 'fa-apple-alt',
    duration: '45 minuti',
    description: 'Piani alimentari personalizzati, diete per patologie e supporto per il dimagrimento. Valutazione della composizione corporea.',
    services: ['Bioimpedenziometria', 'Piano Alimentare', 'Follow-up Mensile'],
    symptoms: [
      { group: 'Obiettivi', icon: 'fa-bullseye', items: ['Perdita di peso', 'Aumento massa muscolare', 'Alimentazione sportiva', 'Benessere generale'] },
      { group: 'Patologie', icon: 'fa-notes-medical', items: ['Diabete tipo 2', 'Dislipidemie', 'Intolleranze alimentari', 'Disturbi intestinali'] },
      { group: 'Life Style', icon: 'fa-heart', items: ['Educazione alimentare', 'Mindful eating', 'Gestione fame emotiva', 'Alimentazione in gravidanza'] }
    ],
    loopText: 'Percorso integrato Slim Care con Wegovy/Mounjaro per perdita peso medicalizzata.',
    faqs: [
      { q: 'Prescrivete farmaci per dimagrire?', a: 'Il nutrizionista crea il piano alimentare. Per farmaci come Wegovy/Mounjaro, il percorso Slim Care include l\'endocrinologo prescrittore.' },
      { q: 'Ogni quanto i controlli?', a: 'Generalmente ogni 2-4 settimane nel primo periodo, poi mensili per il mantenimento.' },
      { q: 'Fate test per intolleranze?', a: 'Sì, il nostro laboratorio esegue test per intolleranze alimentari e celiachia.' }
    ]
  }
};

// Template Deep Dive
function generateDeepDiveTemplate(config, pageName) {
  const { specialty, color, colorLight, icon, duration, description, services, symptoms, loopText, faqs } = config;
  
  return `    <!-- HERO DEEP DIVE -->
    <section class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto pb-16 pt-10 px-4 sm:px-6 lg:px-8">
            <div class="lg:grid lg:grid-cols-12 lg:gap-8">
                <div class="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                    <span class="theme-text font-bold tracking-wider uppercase text-xs">Eccellenza Medica Bio-Clinic</span>
                    <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">
                        ${specialty.split(' ')[0]}
                        <span class="block theme-text">${specialty.includes(' ') ? specialty.split(' ').slice(1).join(' ') : ''}</span>
                    </h1>
                    <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                        ${description}
                    </p>
                    
                    <div class="mt-6 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span class="flex items-center gap-2"><i class="far fa-clock theme-text"></i> ${duration}</span>
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
                    <div class="relative mx-auto w-full rounded-2xl shadow-xl overflow-hidden theme-bg-light p-8 text-center min-h-[250px]">
                        <i class="fas ${icon} text-9xl theme-text opacity-30"></i>
                        <div class="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>
                        <div class="absolute bottom-6 left-6 right-6 text-left">
                            <p class="text-sm font-bold text-gray-800">${loopText}</p>
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
${symptoms.map(s => `
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center theme-bg-light">
                            <i class="fas ${s.icon} theme-text"></i>
                        </div>
                        <h3 class="font-bold text-gray-800">${s.group}</h3>
                    </div>
                    <ul class="space-y-2">
${s.items.map(item => `                        <li class="flex items-start gap-2 text-sm text-gray-600"><i class="fas fa-check text-green-500 mt-1 text-xs"></i> ${item}</li>`).join('\n')}
                    </ul>
                </div>`).join('')}
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
${services.map((service, i) => `
                        <li class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white theme-bg">
                                0${i + 1}
                            </div>
                            <div>
                                <strong class="block text-gray-800 text-lg">${service}</strong>
                                <span class="text-sm text-gray-500">Strumentazione avanzata per una diagnosi precisa e completa.</span>
                            </div>
                        </li>`).join('')}
                    </ul>
                </div>
                <div class="space-y-8">
                    <!-- PREPARAZIONE -->
                    <div class="bg-gray-50 border border-gray-200 p-8 rounded-2xl">
                        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i class="fas fa-clipboard-list theme-text"></i> Come Prepararsi
                        </h3>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-2">
                        <li>Portare documentazione medica precedente</li>
                        <li>Elenco farmaci attualmente assunti</li>
                        <li>Tessera sanitaria e documento d'identità</li>
                        <li>Eventuali esami recenti</li>
                        </ul>
                    </div>
                    
                    <!-- FAQ -->
                    <div class="bg-white border border-gray-200 p-8 rounded-2xl">
                        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i class="fas fa-comments theme-text"></i> Domande Frequenti
                        </h3>
                        <div class="space-y-3">
${faqs.map(faq => `
                        <details class="group bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <summary class="flex justify-between items-center p-4 cursor-pointer font-semibold text-gray-700 hover:text-green-600 transition list-none">
                                <span>${faq.q}</span>
                                <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                            </summary>
                            <div class="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 bg-gray-50/50">
                                ${faq.a}
                            </div>
                        </details>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA PRENOTA -->
    <section id="prenota" class="py-16 text-white text-center scroll-mt-28" style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);">
        <div class="max-w-3xl mx-auto px-4">
            <h2 class="text-3xl font-bold mb-4">La tua salute al centro.</h2>
            <p class="mb-8 opacity-90 text-lg">Prenota la tua visita specialistica senza attese.</p>
            <div class="flex flex-col sm:flex-row justify-center gap-4">
                <a href="tel:+390799561332" class="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white rounded-lg font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105" style="color: ${color};">
                    <i class="fas fa-phone"></i> 079 956 1332
                </a>
                <a href="https://wa.me/390799561332" class="inline-flex items-center justify-center gap-2 px-10 py-4 bg-green-500 text-white rounded-lg font-bold text-lg shadow-lg hover:bg-green-600 transition transform hover:scale-105">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
            <p class="mt-8 opacity-70 text-sm">📍 Via Renzo Mossa, 23 - 07100 Sassari | Lun-Ven 07:00-21:00, Sab 08:00-14:00</p>
        </div>
    </section>`;
}

// Funzione per aggiornare una pagina
function updatePage(pageName) {
  const config = pageConfigs[pageName];
  if (!config) {
    console.log(`⚠️ Configurazione non trovata per: ${pageName}`);
    return false;
  }
  
  const filePath = path.join(__dirname, '..', 'pages', `${pageName}.html`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File non trovato: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Aggiorna le variabili CSS del tema
  const themeStyles = `
    <style>
        body { padding-top: 100px !important; margin: 0 !important; font-family: 'Inter', sans-serif; }
        .header { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; z-index: 9999 !important; background: #fff !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
        .theme-text { color: ${config.color}; }
        .theme-bg { background-color: ${config.color}; }
        .theme-bg-light { background-color: ${config.colorLight}; }
        .theme-border { border-color: ${config.color}; }
        .text-bio-green { color: #00704A; }
        .bg-bio-green { background-color: #00704A; }
        html { scroll-behavior: smooth; }
    </style>`;
  
  // Trova e sostituisci il blocco <style> esistente
  content = content.replace(/<style>[\s\S]*?<\/style>/, themeStyles);
  
  // Trova l'inizio del contenuto main
  const mainStart = content.indexOf('<main');
  const mainEnd = content.indexOf('</main>');
  
  if (mainStart === -1 || mainEnd === -1) {
    console.log(`⚠️ Tag <main> non trovato in: ${pageName}`);
    return false;
  }
  
  // Genera il nuovo contenuto Deep Dive
  const deepDiveContent = generateDeepDiveTemplate(config, pageName);
  
  // Trova la sezione degli specialisti (se esiste) per preservarla
  const specialistsMatch = content.match(/<!-- SEZIONE SPECIALISTI[\s\S]*?<!-- FINE SEZIONE SPECIALISTI -->/);
  const specialistsSection = specialistsMatch ? specialistsMatch[0] : '';
  
  // Ricostruisci il contenuto main
  const newMainContent = `<main>
    ${deepDiveContent}
    </main>

    <!-- FOOTER -->
    ${specialistsSection}`;
  
  // Sostituisci tutto il contenuto da <main> a </main> inclusa la sezione specialisti
  const beforeMain = content.substring(0, mainStart);
  let afterMainEnd = content.indexOf('<footer');
  if (afterMainEnd === -1) {
    afterMainEnd = content.indexOf('<!-- FOOTER');
  }
  
  // Trova la fine del footer
  const footerSection = content.substring(content.indexOf('<footer'));
  
  const newContent = beforeMain + newMainContent + '\n' + footerSection;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Aggiornato: ${pageName}.html`);
  return true;
}

// Main
console.log('=== Conversione pagine a template Deep Dive ===\n');

const pagesToConvert = Object.keys(pageConfigs);
let successCount = 0;

pagesToConvert.forEach(pageName => {
  if (updatePage(pageName)) {
    successCount++;
  }
});

console.log(`\n✅ Completato: ${successCount}/${pagesToConvert.length} pagine aggiornate`);
