#!/usr/bin/env node
/**
 * BIO-CLINIC COMPLETE DEEP DIVE GENERATOR
 * Genera pagine specialistiche complete con:
 * - Contenuti medici Deep Dive
 * - Sezione Specialisti di Riferimento
 * - FAQ, Tecnologia, Sintomi
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PAGES_DIR = path.join(__dirname, '../pages');
const DATA_DIR = path.join(__dirname, '../data/v2/entities');

// ============================================================================
// LOAD PHYSICIANS DATA FROM YAML
// ============================================================================
function loadPhysicians() {
  try {
    const yamlPath = path.join(DATA_DIR, 'physicians.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(fileContents);
    return data.physicians || [];
  } catch (e) {
    console.error('Error loading physicians.yaml:', e);
    return [];
  }
}

// ============================================================================
// MAP SPECIALTIES TO PHYSICIANS
// ============================================================================
function getPhysiciansBySpecialty(physicians) {
  const map = {};
  physicians.forEach(doc => {
    const spec = doc.specialty_id;
    if (!map[spec]) map[spec] = [];
    map[spec].push(doc);
  });
  return map;
}

// ============================================================================
// SPECIALTY COLORS & CONFIG
// ============================================================================
const SPECIALTY_CONFIG = {
  'ginecologia': { color: '#E91E63', colorLight: '#FCE4EC', icon: 'fa-venus' },
  'ostetricia': { color: '#E91E8C', colorLight: '#FCE4EC', icon: 'fa-baby' },
  'cardiologia': { color: '#E53935', colorLight: '#FFEBEE', icon: 'fa-heart-pulse' },
  'endocrinologia': { color: '#4A90A4', colorLight: '#E3F2FD', icon: 'fa-disease' },
  'dermatologia': { color: '#8E24AA', colorLight: '#F3E5F5', icon: 'fa-hand-dots' },
  'neurologia': { color: '#5C6BC0', colorLight: '#E8EAF6', icon: 'fa-brain' },
  'ortopedia': { color: '#00897B', colorLight: '#E0F2F1', icon: 'fa-bone' },
  'oculistica': { color: '#0288D1', colorLight: '#E1F5FE', icon: 'fa-eye' },
  'urologia': { color: '#FF7043', colorLight: '#FBE9E7', icon: 'fa-mars' },
  'pneumologia': { color: '#26A69A', colorLight: '#E0F2F1', icon: 'fa-lungs' },
  'otorinolaringoiatria': { color: '#7E57C2', colorLight: '#EDE7F6', icon: 'fa-ear-listen' },
  'chirurgia-vascolare': { color: '#D32F2F', colorLight: '#FFCDD2', icon: 'fa-droplet' },
  'ematologia': { color: '#C62828', colorLight: '#FFEBEE', icon: 'fa-vial' },
  'gastroenterologia': { color: '#558B2F', colorLight: '#F1F8E9', icon: 'fa-stomach' },
  'dietologia': { color: '#8BC34A', colorLight: '#F1F8E9', icon: 'fa-apple-whole' },
  'fisiatria': { color: '#00ACC1', colorLight: '#E0F7FA', icon: 'fa-person-walking' },
  'reumatologia': { color: '#795548', colorLight: '#EFEBE9', icon: 'fa-joint' },
  'nefrologia': { color: '#6D4C41', colorLight: '#EFEBE9', icon: 'fa-kidneys' },
  'pediatria': { color: '#F06292', colorLight: '#FCE4EC', icon: 'fa-child' },
  'psicologia': { color: '#9C27B0', colorLight: '#F3E5F5', icon: 'fa-brain' },
  'medicina-interna': { color: '#455A64', colorLight: '#ECEFF1', icon: 'fa-stethoscope' },
  'medicina-lavoro': { color: '#FF8F00', colorLight: '#FFF8E1', icon: 'fa-hard-hat' },
  'medicina-sportiva': { color: '#00C853', colorLight: '#E8F5E9', icon: 'fa-running' },
  'radiologia': { color: '#546E7A', colorLight: '#ECEFF1', icon: 'fa-x-ray' },
  'laboratorio': { color: '#43A047', colorLight: '#E8F5E9', icon: 'fa-flask' }
};

// ============================================================================
// FILE TO SPECIALTY MAPPING
// ============================================================================
const FILE_SPECIALTY_MAP = {
  // Ginecologia
  'visita-ginecologica.html': 'ginecologia',
  'ecografia-transvaginale.html': 'ginecologia',
  'pap-test.html': 'ginecologia',
  'pap-test-hpv.html': 'ginecologia',
  'ecografia-pelvica.html': 'ginecologia',
  'ecografia-mammaria.html': 'ginecologia',
  'isteroscopia.html': 'ginecologia',
  'colposcopia.html': 'ginecologia',
  'riabilitazione-pavimento-pelvico.html': 'ginecologia',
  'pma-fertilita.html': 'ginecologia',
  'monitoraggio-follicolare.html': 'ginecologia',
  
  // Ostetricia
  'ecografia-ostetrica-3d.html': 'ostetricia',
  'ecografia-morfologica.html': 'ostetricia',
  'assistenza-ostetrica.html': 'ostetricia',
  'corso-preparto.html': 'ostetricia',
  
  // Cardiologia
  'visita-cardiologica-ecg.html': 'cardiologia',
  'ecocardiogramma.html': 'cardiologia',
  'holter-ecg.html': 'cardiologia',
  'holter-pressorio.html': 'cardiologia',
  
  // Endocrinologia
  'visita-endocrinologica.html': 'endocrinologia',
  'ecografia-tiroidea.html': 'endocrinologia',
  
  // Dermatologia
  'visita-dermatologica.html': 'dermatologia',
  'mappatura-nevi.html': 'dermatologia',
  
  // Neurologia
  'visita-neurologica.html': 'neurologia',
  'elettromiografia.html': 'neurologia',
  
  // Ortopedia
  'visita-ortopedica.html': 'ortopedia',
  'infiltrazioni-articolari.html': 'ortopedia',
  
  // Oculistica
  'visita-oculistica.html': 'oculistica',
  'campo-visivo.html': 'oculistica',
  
  // Urologia
  'visita-urologica.html': 'urologia',
  'ecografia-prostatica.html': 'urologia',
  
  // Pneumologia
  'visita-pneumologica.html': 'pneumologia',
  'spirometria.html': 'pneumologia',
  
  // ORL
  'visita-orl.html': 'otorinolaringoiatria',
  'audiometria.html': 'otorinolaringoiatria',
  
  // Vascolare
  'visita-chirurgia-vascolare.html': 'chirurgia-vascolare',
  'eco-doppler-arti.html': 'chirurgia-vascolare',
  'scleroterapia.html': 'chirurgia-vascolare',
  
  // Altri
  'visita-ematologica.html': 'ematologia',
  'visita-fisiatrica.html': 'fisiatria',
  'visita-reumatologica.html': 'reumatologia',
  'visita-gastroenterologica.html': 'gastroenterologia',
  'ecografia-addominale.html': 'gastroenterologia',
  'visita-nutrizionale.html': 'dietologia',
  'visita-internistica.html': 'medicina-interna',
  'visita-medicina-lavoro.html': 'medicina-lavoro',
  'visita-medicina-sport.html': 'medicina-sportiva',
  'visita-nefrologica.html': 'nefrologia',
  'visita-pediatrica.html': 'pediatria',
  'colloquio-psicologico.html': 'psicologia'
};

// ============================================================================
// PROCEDURE-SPECIFIC DATA FOR DEEP DIVE
// ============================================================================
const PROCEDURE_DEEP_DATA = {
  // CARDIOLOGIA
  'ecocardiogramma.html': {
    title_main: 'Ecocardiogramma',
    title_accent: 'Color Doppler',
    hero_desc: 'Visualizzazione diretta del cuore in movimento con tecnologia Color Doppler. Valutazione di valvole, camere cardiache e funzione contrattile in tempo reale.',
    sintomi_groups: [
      { title: 'Sintomi Cardiaci', icon: 'fa-heart-pulse', list: ['Affanno sotto sforzo', 'Soffi cardiaci', 'Dolore toracico', 'Palpitazioni'] },
      { title: 'Controllo', icon: 'fa-clipboard-check', list: ['Ipertensione arteriosa', 'Post-infarto', 'Valvulopatie note', 'Cardiomiopatia'] },
      { title: 'Screening', icon: 'fa-shield-heart', list: ['Familiarità cardiaca', 'Pre-intervento', 'Atleti', 'Over 50'] }
    ],
    tech_steps: [
      { num: '01', title: 'Preparazione', desc: 'Nessuna preparazione particolare. Si rimuove la parte superiore degli indumenti.' },
      { num: '02', title: 'Esame', desc: 'Sonda ecografica posizionata sul torace. Durata 20-30 minuti. Completamente indolore.' },
      { num: '03', title: 'Referto', desc: 'Referto immediato con immagini e video del cuore. Valutazione della frazione di eiezione.' }
    ],
    faq: [
      { q: "L'ecocardiogramma è doloroso?", a: "Assolutamente no. È un esame ecografico non invasivo, senza radiazioni. Si applica solo gel e sonda sul torace." },
      { q: "Quanto dura l'ecocardiogramma?", a: "Circa 20-30 minuti. Il referto viene consegnato immediatamente al termine dell'esame." },
      { q: "Devo prepararmi in modo particolare?", a: "Non è necessaria alcuna preparazione. Può mangiare normalmente e assumere i farmaci abituali." }
    ],
    durata: '20-30 minuti'
  },
  
  'holter-ecg.html': {
    title_main: 'Holter ECG',
    title_accent: '24-48 Ore',
    hero_desc: 'Monitoraggio continuo del ritmo cardiaco per 24-48 ore. Identifica aritmie intermittenti, pause e alterazioni non rilevabili con ECG standard.',
    sintomi_groups: [
      { title: 'Aritmie', icon: 'fa-wave-square', list: ['Palpitazioni intermittenti', 'Tachicardia parossistica', 'Battiti mancanti', 'Extrasistoli'] },
      { title: 'Sincope', icon: 'fa-person-falling', list: ['Svenimenti inspiegati', 'Capogiri ricorrenti', 'Pre-sincope', 'Debolezza improvvisa'] },
      { title: 'Follow-up', icon: 'fa-chart-line', list: ['Controllo terapia antiaritmica', 'Post-ablazione', 'Monitoraggio pacemaker', 'Fibrillazione atriale'] }
    ],
    tech_steps: [
      { num: '01', title: 'Applicazione', desc: 'Elettrodi adesivi posizionati sul torace. Registratore portatile leggero da indossare.' },
      { num: '02', title: 'Monitoraggio', desc: '24-48 ore di registrazione continua. Compilare il diario delle attività svolte.' },
      { num: '03', title: 'Analisi', desc: 'Software avanzato analizza oltre 100.000 battiti. Referto dettagliato con cardiologo.' }
    ],
    faq: [
      { q: "Posso fare la doccia con l'Holter?", a: "No, durante le 24-48 ore di monitoraggio non è possibile fare doccia o bagno. Gli elettrodi non devono bagnarsi." },
      { q: "Posso lavorare normalmente?", a: "Sì, è importante svolgere le attività quotidiane normali per registrare il ritmo in condizioni reali." },
      { q: "Cosa devo annotare nel diario?", a: "Orari di attività fisica, pasti, sonno, sintomi avvertiti (palpitazioni, capogiri) e farmaci assunti." }
    ],
    durata: '24-48 ore'
  },
  
  'holter-pressorio.html': {
    title_main: 'Holter Pressorio',
    title_accent: 'ABPM 24h',
    hero_desc: 'Monitoraggio ambulatoriale della pressione arteriosa per 24 ore. Rileva ipertensione mascherata, da camice bianco e pattern notturni.',
    sintomi_groups: [
      { title: 'Ipertensione', icon: 'fa-gauge-high', list: ['Pressione alta in studio', 'Cefalea tensiva', 'Epistassi frequenti', 'Acufeni'] },
      { title: 'Diagnosi', icon: 'fa-magnifying-glass', list: ['Ipertensione mascherata', 'Ipertensione da camice bianco', 'Non-dipper notturno', 'Variabilità pressoria'] },
      { title: 'Terapia', icon: 'fa-pills', list: ['Titolazione farmaci', 'Verifica efficacia terapia', 'Ipotensione ortostatica', 'Resistenza ai farmaci'] }
    ],
    tech_steps: [
      { num: '01', title: 'Applicazione', desc: 'Bracciale automatico posizionato sul braccio non dominante. Registratore alla cintura.' },
      { num: '02', title: 'Misurazioni', desc: 'Automatiche ogni 15-30 minuti di giorno, ogni 30-60 minuti di notte. 50-70 misurazioni totali.' },
      { num: '03', title: 'Report', desc: 'Analisi statistica completa: medie, picchi, variabilità, dipping notturno. Grafici temporali.' }
    ],
    faq: [
      { q: "È fastidioso dormire con l'Holter pressorio?", a: "Il bracciale si gonfia anche di notte, ma con intervalli più lunghi. La maggior parte dei pazienti si abitua rapidamente." },
      { q: "Posso guidare durante il monitoraggio?", a: "Sì, ma durante la misurazione (bracciale gonfio) è consigliabile rallentare o fermarsi per 1-2 minuti." },
      { q: "Cosa significa 'non-dipper'?", a: "Indica che la pressione non cala sufficientemente durante il sonno (normalmente scende del 10-20%). È un fattore di rischio cardiovascolare." }
    ],
    durata: '24 ore'
  },

  // GINECOLOGIA
  'ecografia-transvaginale.html': {
    title_main: 'Ecografia',
    title_accent: 'Transvaginale',
    hero_desc: 'Esame ecografico ad alta risoluzione per lo studio di utero e ovaie. Indispensabile per monitoraggio follicolare, diagnosi di cisti e fibromi.',
    sintomi_groups: [
      { title: 'Dolore Pelvico', icon: 'fa-female', list: ['Dolore durante il ciclo', 'Dolore ai rapporti', 'Pesantezza pelvica', 'Dolore laterale'] },
      { title: 'Ciclo', icon: 'fa-calendar', list: ['Ciclo irregolare', 'Ciclo abbondante', 'Spotting', 'Amenorrea'] },
      { title: 'Fertilità', icon: 'fa-baby', list: ['Monitoraggio ovulazione', 'Studio follicoli', 'Riserva ovarica', 'PMA'] }
    ],
    tech_steps: [
      { num: '01', title: 'Preparazione', desc: 'Vescica vuota. Non usare ovuli o creme nelle 24h precedenti.' },
      { num: '02', title: 'Esame', desc: 'Sonda sottile con coprisonda monouso. Durata 10-15 minuti. Minimo disagio.' },
      { num: '03', title: 'Referto', desc: 'Valutazione immediata di utero, endometrio, ovaie. Misurazioni e immagini digitali.' }
    ],
    faq: [
      { q: "L'ecografia transvaginale è dolorosa?", a: "No, può causare solo un leggero fastidio. La sonda è sottile e viene lubrificata. Si può interrompere in qualsiasi momento." },
      { q: "Posso farla durante il ciclo?", a: "Per valutazioni ginecologiche generali sì. Per il monitoraggio follicolare è preferibile dal 10° giorno del ciclo." },
      { q: "Devo avere la vescica piena?", a: "Al contrario: per l'ecografia transvaginale la vescica deve essere VUOTA per una migliore visualizzazione." }
    ],
    durata: '10-15 minuti'
  },
  
  'pap-test.html': {
    title_main: 'Pap Test',
    title_accent: '& Test HPV',
    hero_desc: 'Screening fondamentale per la prevenzione del tumore del collo dell\'utero. Rileva cellule anomale prima che diventino cancerose.',
    sintomi_groups: [
      { title: 'Prevenzione', icon: 'fa-shield-virus', list: ['Screening annuale', 'Donne 25-65 anni', 'Post-vaccinazione HPV', 'Familiarità'] },
      { title: 'Sintomi', icon: 'fa-triangle-exclamation', list: ['Sanguinamento anomalo', 'Perdite sospette', 'Dolore ai rapporti', 'Spotting post-coitale'] },
      { title: 'Follow-up', icon: 'fa-rotate', list: ['Pap Test precedente anomalo', 'HPV positivo', 'Post-conizzazione', 'Post-colposcopia'] }
    ],
    tech_steps: [
      { num: '01', title: 'Prelievo', desc: 'Spatola e spazzolino raccolgono cellule dalla cervice. Procedura rapida e quasi indolore.' },
      { num: '02', title: 'Analisi', desc: 'Esame citologico in laboratorio specializzato. Eventuale test HPV DNA.' },
      { num: '03', title: 'Referto', desc: 'Risultato in 7-10 giorni. Se anomalo, si procede con colposcopia.' }
    ],
    faq: [
      { q: "Il Pap Test è doloroso?", a: "No, è un prelievo rapido e quasi indolore. Può causare solo un leggero fastidio o crampo momentaneo." },
      { q: "Con quale frequenza devo farlo?", a: "Linee guida: ogni 3 anni (25-30 anni) o ogni 5 anni con HPV Test (30-65 anni). Il ginecologo può consigliare frequenze diverse." },
      { q: "Pap Test positivo significa tumore?", a: "Assolutamente no! Indica solo cellule anomale da approfondire. Spesso sono infiammazioni o infezioni HPV benigne." }
    ],
    durata: '5 minuti'
  },
  
  'ecografia-pelvica.html': {
    title_main: 'Ecografia',
    title_accent: 'Pelvica Sovrapubica',
    hero_desc: 'Esame ecografico addominale per visualizzare utero, ovaie e vescica. Ideale per pazienti vergini o quando preferito alla via transvaginale.',
    sintomi_groups: [
      { title: 'Indicazioni', icon: 'fa-search', list: ['Pazienti vergini', 'Adolescenti', 'Preferenza personale', 'Studio vescica'] },
      { title: 'Sintomi', icon: 'fa-exclamation-circle', list: ['Dolore pelvico', 'Masse palpabili', 'Irregolarità mestruali', 'Distensione addominale'] },
      { title: 'Screening', icon: 'fa-clipboard-check', list: ['Cisti ovariche', 'Fibromi uterini', 'Gravidanza iniziale', 'IUD controllo'] }
    ],
    tech_steps: [
      { num: '01', title: 'Preparazione', desc: 'Vescica PIENA (bere 1 litro d\'acqua 1 ora prima). La vescica piena fa da finestra acustica.' },
      { num: '02', title: 'Esame', desc: 'Sonda addominale sulla pancia. Gel ecografico tiepido. Durata 15-20 minuti.' },
      { num: '03', title: 'Referto', desc: 'Referto immediato con immagini. Eventuale integrazione transvaginale se necessario.' }
    ],
    faq: [
      { q: "Perché devo avere la vescica piena?", a: "La vescica piena sposta l'intestino e crea una 'finestra acustica' che permette di vedere meglio utero e ovaie." },
      { q: "È meno precisa della transvaginale?", a: "Per alcuni dettagli sì, ma per molte indicazioni è equivalente. Il ginecologo sceglierà l'approccio più adatto." },
      { q: "Posso svuotare la vescica durante l'esame?", a: "Se la vescica è troppo piena e fastidiosa, si può svuotare parzialmente e continuare l'esame." }
    ],
    durata: '15-20 minuti'
  },
  
  'ecografia-mammaria.html': {
    title_main: 'Ecografia',
    title_accent: 'Mammaria',
    hero_desc: 'Esame complementare alla mammografia per lo studio del seno. Indispensabile per seni densi, donne giovani e caratterizzazione di noduli.',
    sintomi_groups: [
      { title: 'Noduli', icon: 'fa-circle', list: ['Nodulo palpabile', 'Massa sospetta', 'Cisti mammaria', 'Fibroadenoma'] },
      { title: 'Sintomi', icon: 'fa-hand', list: ['Dolore al seno', 'Secrezione dal capezzolo', 'Retrazione cutanea', 'Arrossamento'] },
      { title: 'Screening', icon: 'fa-clipboard-check', list: ['Seno denso', 'Donne under 40', 'Familiarità', 'Integrazione mammografia'] }
    ],
    tech_steps: [
      { num: '01', title: 'Posizionamento', desc: 'Paziente supina, braccio alzato. Esposizione di una mammella alla volta.' },
      { num: '02', title: 'Scansione', desc: 'Sonda ad alta frequenza scorre su tutto il seno. Studio quadrante per quadrante.' },
      { num: '03', title: 'Referto', desc: 'Classificazione BI-RADS. Eventuale indicazione a mammografia o agoaspirato.' }
    ],
    faq: [
      { q: "L'ecografia mammaria sostituisce la mammografia?", a: "No, sono esami complementari. L'ecografia è ottima per seni densi e caratterizzazione noduli, la mammografia rileva microcalcificazioni." },
      { q: "Da che età devo farla?", a: "Consigliata dai 30 anni come primo approccio, integrata con mammografia dai 40 anni." },
      { q: "Se trovo un nodulo, cosa succede?", a: "Il più delle volte sono cisti o fibroadenomi benigni. Se sospetto, si procede con agoaspirato eco-guidato." }
    ],
    durata: '15-20 minuti'
  },
  
  'isteroscopia.html': {
    title_main: 'Isteroscopia',
    title_accent: 'Diagnostica & Operativa',
    hero_desc: 'Visualizzazione diretta della cavità uterina con ottica miniaturizzata. Diagnosi e trattamento di polipi, miomi e malformazioni in un unico intervento.',
    sintomi_groups: [
      { title: 'Sanguinamento', icon: 'fa-droplet', list: ['Metrorragia', 'Menorragia', 'Sanguinamento in menopausa', 'Spotting persistente'] },
      { title: 'Infertilità', icon: 'fa-baby', list: ['Polipi endometriali', 'Miomi sottomucosi', 'Sinechie uterine', 'Malformazioni'] },
      { title: 'Diagnosi', icon: 'fa-search', list: ['Eco sospetta', 'Ispessimento endometrio', 'Biopsia mirata', 'Stadiazione'] }
    ],
    tech_steps: [
      { num: '01', title: 'Diagnostica', desc: 'Ottica da 2.9mm, ambulatoriale senza anestesia. Visualizzazione diretta della cavità.' },
      { num: '02', title: 'Operativa', desc: 'Se necessario, asportazione immediata di polipi e piccoli miomi. Mini-chirurgia.' },
      { num: '03', title: 'Istologico', desc: 'Materiale asportato inviato per esame istologico. Referto in 7-10 giorni.' }
    ],
    faq: [
      { q: "L'isteroscopia è dolorosa?", a: "L'isteroscopia diagnostica causa solo crampi simili al ciclo mestruale. Si può assumere antidolorifico 1h prima." },
      { q: "Richiede anestesia?", a: "La diagnostica ambulatoriale di solito no. L'operativa può richiedere sedazione o anestesia leggera." },
      { q: "Quando posso tornare alle attività normali?", a: "Dopo l'isteroscopia diagnostica, immediatamente. Dopo l'operativa, riposo 24-48h e no rapporti per 1 settimana." }
    ],
    durata: '10-30 minuti'
  },
  
  'riabilitazione-pavimento-pelvico.html': {
    title_main: 'Riabilitazione',
    title_accent: 'Pavimento Pelvico',
    hero_desc: 'Percorso riabilitativo personalizzato per disfunzioni del pavimento pelvico. Biofeedback, elettrostimolazione e ginnastica perineale.',
    sintomi_groups: [
      { title: 'Incontinenza', icon: 'fa-droplet', list: ['Incontinenza da sforzo', 'Urgenza minzionale', 'Perdite post-parto', 'Incontinenza mista'] },
      { title: 'Prolasso', icon: 'fa-arrow-down', list: ['Senso di peso', 'Prolasso vescicale', 'Prolasso uterino', 'Rettocele'] },
      { title: 'Dolore', icon: 'fa-bolt', list: ['Dispareunia', 'Vulvodinia', 'Dolore pelvico cronico', 'Vaginismo'] }
    ],
    tech_steps: [
      { num: '01', title: 'Valutazione', desc: 'Anamnesi dettagliata, esame obiettivo, questionari validati. Piano riabilitativo personalizzato.' },
      { num: '02', title: 'Terapia', desc: 'Biofeedback, elettrostimolazione, esercizi di Kegel guidati. Sedute settimanali.' },
      { num: '03', title: 'Mantenimento', desc: 'Esercizi domiciliari, controlli periodici, risultati duraturi nel 70-80% dei casi.' }
    ],
    faq: [
      { q: "Quante sedute servono?", a: "In media 8-12 sedute, 1-2 volte a settimana. La durata dipende dalla gravità e dalla risposta individuale." },
      { q: "È dolorosa la riabilitazione?", a: "Assolutamente no. Le tecniche sono delicate e graduali. L'obiettivo è recuperare controllo e forza muscolare." },
      { q: "Funziona anche dopo anni?", a: "Sì, la riabilitazione è efficace anche a distanza di anni dal parto o dall'insorgenza dei sintomi." }
    ],
    durata: '45-60 minuti/seduta'
  },

  // OSTETRICIA
  'ecografia-ostetrica-3d.html': {
    title_main: 'Ecografia Ostetrica',
    title_accent: '3D/4D',
    hero_desc: 'Visualizzazione tridimensionale del feto con tecnologia Voluson™ E10. Emozioni uniche e screening morfologico di altissimo livello.',
    sintomi_groups: [
      { title: 'Screening', icon: 'fa-baby', list: ['Morfologica I trimestre', 'Morfologica II trimestre', 'Translucenza nucale', 'Anomalie fetali'] },
      { title: 'Monitoraggio', icon: 'fa-chart-line', list: ['Crescita fetale', 'Liquido amniotico', 'Posizione placenta', 'Benessere fetale'] },
      { title: 'Emozioni', icon: 'fa-heart', list: ['Volto del bambino', 'Movimenti 4D', 'Video ricordo', 'Foto 3D'] }
    ],
    tech_steps: [
      { num: '01', title: 'Ecografia 2D', desc: 'Studio morfologico completo con misurazioni biometriche e valutazione anatomica.' },
      { num: '02', title: 'Ricostruzione 3D', desc: 'Tecnologia volumetrica per visualizzare volto, mani, piedi in tre dimensioni.' },
      { num: '03', title: 'Video 4D', desc: 'Movimenti del feto in tempo reale. DVD ricordo su richiesta.' }
    ],
    faq: [
      { q: "Quando è il momento migliore per l'eco 3D/4D?", a: "Tra la 26a e la 32a settimana per il volto. Prima è troppo piccolo, dopo lo spazio è ridotto." },
      { q: "Riesco sempre a vedere il viso?", a: "Dipende dalla posizione del feto. Se non collabora, si può riprovare gratuitamente un'altra volta." },
      { q: "L'ecografia 3D è sicura?", a: "Sì, usa gli stessi ultrasuoni dell'ecografia tradizionale. Nessuna radiazione, nessun rischio." }
    ],
    durata: '30-40 minuti'
  },
  
  'ecografia-morfologica.html': {
    title_main: 'Ecografia',
    title_accent: 'Morfologica',
    hero_desc: 'Ecografia di II livello per lo screening delle anomalie fetali. Studio dettagliato di tutti gli organi del feto tra la 19a e la 22a settimana.',
    sintomi_groups: [
      { title: 'Screening', icon: 'fa-search', list: ['Anomalie cardiache', 'Malformazioni SNC', 'Difetti tubo neurale', 'Anomalie renali'] },
      { title: 'Biometria', icon: 'fa-ruler', list: ['Crescita fetale', 'Circonferenza cranica', 'Femore', 'Addome'] },
      { title: 'Annessi', icon: 'fa-clipboard-check', list: ['Placenta', 'Liquido amniotico', 'Cordone ombelicale', 'Cervice uterina'] }
    ],
    tech_steps: [
      { num: '01', title: 'Check-list SIEOG', desc: 'Protocollo standardizzato con oltre 30 parametri anatomici da valutare.' },
      { num: '02', title: 'Studio Cardiaco', desc: 'Valutazione delle 4 camere cardiache e dei grandi vasi secondo linee guida.' },
      { num: '03', title: 'Referto Dettagliato', desc: 'Report completo con immagini, biometria, percentili di crescita.' }
    ],
    faq: [
      { q: "Quando si fa la morfologica?", a: "Tra la 19a e la 22a settimana di gravidanza. È il periodo ottimale per visualizzare tutti gli organi." },
      { q: "Cosa vede esattamente?", a: "Cervello, cuore, colonna vertebrale, reni, arti, volto, mani, piedi. Oltre 30 strutture anatomiche." },
      { q: "Se trova qualcosa di anomalo?", a: "In caso di sospetto, si può approfondire con ecografia di III livello presso centro di riferimento." }
    ],
    durata: '30-45 minuti'
  },
  
  'assistenza-ostetrica.html': {
    title_main: 'Assistenza',
    title_accent: 'Ostetrica',
    hero_desc: 'Accompagnamento professionale durante gravidanza, parto e puerperio. Ostetriche dedicate per ogni fase della maternità.',
    sintomi_groups: [
      { title: 'Gravidanza', icon: 'fa-person-pregnant', list: ['Controlli periodici', 'Monitoraggio peso', 'Consigli alimentari', 'Preparazione al parto'] },
      { title: 'Puerperio', icon: 'fa-baby', list: ['Allattamento', 'Cura del neonato', 'Recupero post-parto', 'Supporto emotivo'] },
      { title: 'Consulenza', icon: 'fa-comments', list: ['Piano del parto', 'Corso preparto', 'Massaggio perineale', 'Rieducazione pelvica'] }
    ],
    tech_steps: [
      { num: '01', title: 'Presa in carico', desc: 'Colloquio iniziale, anamnesi ostetrica, piano di assistenza personalizzato.' },
      { num: '02', title: 'Accompagnamento', desc: 'Visite periodiche, controlli, monitoraggio benessere materno-fetale.' },
      { num: '03', title: 'Continuità', desc: 'Stessa ostetrica di riferimento per tutto il percorso nascita.' }
    ],
    faq: [
      { q: "Quando iniziare il percorso con l'ostetrica?", a: "Idealmente dal primo trimestre, per instaurare un rapporto di fiducia e pianificare tutti i controlli." },
      { q: "L'ostetrica può seguirmi anche dopo il parto?", a: "Sì, offriamo assistenza puerperale domiciliare e supporto all'allattamento." },
      { q: "L'assistenza ostetrica è mutuabile?", a: "In Bio-Clinic l'assistenza è privata, ma garantisce continuità e personalizzazione del percorso." }
    ],
    durata: '30-45 minuti/incontro'
  },
  
  'corso-preparto.html': {
    title_main: 'Corso',
    title_accent: 'Preparto',
    hero_desc: 'Preparazione completa al parto e alla genitorialità. Teoria, pratica, tecniche di respirazione e rilassamento con ostetriche esperte.',
    sintomi_groups: [
      { title: 'Teoria', icon: 'fa-book', list: ['Fisiologia del parto', 'Fasi del travaglio', 'Gestione del dolore', 'Parto naturale vs cesareo'] },
      { title: 'Pratica', icon: 'fa-person-pregnant', list: ['Tecniche di respirazione', 'Posizioni antalgiche', 'Massaggio lombare', 'Uso della palla'] },
      { title: 'Neonato', icon: 'fa-baby', list: ['Allattamento', 'Cambio pannolino', 'Bagnetto', 'Primi segnali di allarme'] }
    ],
    tech_steps: [
      { num: '01', title: 'Incontri teorici', desc: 'Spiegazione di fasi del parto, analgesia, taglio cesareo, emergenze.' },
      { num: '02', title: 'Laboratori pratici', desc: 'Simulazioni, tecniche di respirazione, posizioni, massaggio perineale.' },
      { num: '03', title: 'Post-parto', desc: 'Allattamento, cura del neonato, rientro a casa, supporto emotivo.' }
    ],
    faq: [
      { q: "Da che settimana iniziare il corso?", a: "Idealmente dalla 28a-30a settimana, per completare il percorso prima del termine." },
      { q: "Il partner può partecipare?", a: "Assolutamente sì! La partecipazione del partner è incoraggiata e inclusa nel costo." },
      { q: "Quanti incontri sono previsti?", a: "In media 8-10 incontri da 2 ore ciascuno, con possibilità di recupero." }
    ],
    durata: '2 ore/incontro, 8-10 incontri'
  },

  // ENDOCRINOLOGIA
  'ecografia-tiroidea.html': {
    title_main: 'Ecografia',
    title_accent: 'Tiroidea',
    hero_desc: 'Esame di primo livello per lo studio della tiroide e dei linfonodi cervicali. Essenziale per noduli, gozzo e patologie tiroidee.',
    sintomi_groups: [
      { title: 'Noduli', icon: 'fa-circle', list: ['Nodulo palpabile', 'Nodulo incidentale', 'Gozzo multinodulare', 'Tiroide ingrossata'] },
      { title: 'Sintomi', icon: 'fa-thermometer-half', list: ['Stanchezza', 'Variazioni di peso', 'Intolleranza al caldo/freddo', 'Tachicardia'] },
      { title: 'Follow-up', icon: 'fa-rotate', list: ['Tiroidite di Hashimoto', 'Morbo di Basedow', 'Post-tiroidectomia', 'Controllo noduli noti'] }
    ],
    tech_steps: [
      { num: '01', title: 'Scansione', desc: 'Sonda ad alta frequenza sul collo. Studio di entrambi i lobi tiroidei e linfonodi.' },
      { num: '02', title: 'Caratterizzazione', desc: 'Misurazione noduli, ecogenicità, vascolarizzazione, calcificazioni.' },
      { num: '03', title: 'Classificazione', desc: 'TI-RADS score per stratificare il rischio e decidere se fare agoaspirato.' }
    ],
    faq: [
      { q: "Devo fare il digiuno?", a: "No, l'ecografia tiroidea non richiede alcuna preparazione. Evitare solo collane o sciarpe." },
      { q: "Se trovo un nodulo, devo operarmi?", a: "La maggior parte dei noduli tiroidei è benigna. Solo il 5% richiede approfondimenti chirurgici." },
      { q: "Ogni quanto ripetere l'ecografia?", a: "Per noduli a basso rischio, controllo annuale. Per noduli sospetti, ogni 6 mesi o agoaspirato." }
    ],
    durata: '15-20 minuti'
  },

  // NEUROLOGIA
  'elettromiografia.html': {
    title_main: 'Elettromiografia',
    title_accent: 'EMG',
    hero_desc: 'Studio della conduzione nervosa e dell\'attività muscolare. Diagnosi di neuropatie, radicolopatie, tunnel carpale e patologie muscolari.',
    sintomi_groups: [
      { title: 'Nervi', icon: 'fa-bolt', list: ['Formicolii mani/piedi', 'Intorpidimento', 'Tunnel carpale', 'Sciatica'] },
      { title: 'Muscoli', icon: 'fa-dumbbell', list: ['Debolezza muscolare', 'Crampi frequenti', 'Atrofia', 'Fascicolazioni'] },
      { title: 'Diagnosi', icon: 'fa-stethoscope', list: ['Neuropatia diabetica', 'Radicolopatia cervicale', 'SLA sospetta', 'Miopatie'] }
    ],
    tech_steps: [
      { num: '01', title: 'Elettroneurografia', desc: 'Elettrodi di superficie stimolano i nervi. Misurazione velocità di conduzione.' },
      { num: '02', title: 'EMG ad ago', desc: 'Ago sottile nel muscolo registra attività elettrica. Minimo disagio.' },
      { num: '03', title: 'Referto', desc: 'Report dettagliato con diagnosi, severità e indicazioni terapeutiche.' }
    ],
    faq: [
      { q: "L'EMG è dolorosa?", a: "L'elettroneurografia causa solo formicolio. L'EMG ad ago può dare un leggero fastidio, sopportabile." },
      { q: "Quanto dura l'esame?", a: "Da 30 a 60 minuti, a seconda dei distretti da studiare." },
      { q: "Devo sospendere farmaci?", a: "Segnalare eventuali anticoagulanti. Non sospendere altri farmaci senza consultare il medico." }
    ],
    durata: '30-60 minuti'
  },

  // ORTOPEDIA
  'infiltrazioni-articolari.html': {
    title_main: 'Infiltrazioni',
    title_accent: 'Articolari',
    hero_desc: 'Trattamento mini-invasivo per artrosi, tendiniti e borsiti. Acido ialuronico, cortisone e PRP per ridurre dolore e infiammazione.',
    sintomi_groups: [
      { title: 'Artrosi', icon: 'fa-bone', list: ['Artrosi ginocchio', 'Artrosi anca', 'Artrosi spalla', 'Rizoartrosi'] },
      { title: 'Infiammazione', icon: 'fa-fire', list: ['Tendinite', 'Borsite', 'Epicondilite', 'Fascite plantare'] },
      { title: 'Rigenerazione', icon: 'fa-syringe', list: ['PRP', 'Acido ialuronico', 'Ozonoterapia', 'Proloterapia'] }
    ],
    tech_steps: [
      { num: '01', title: 'Valutazione', desc: 'Esame clinico, eventuale ecografia articolare per guidare l\'infiltrazione.' },
      { num: '02', title: 'Infiltrazione', desc: 'Iniezione intra-articolare sterile. Durata 5-10 minuti. Fastidio minimo.' },
      { num: '03', title: 'Recupero', desc: 'Riposo relativo 24-48h. Effetto progressivo in 1-2 settimane.' }
    ],
    faq: [
      { q: "Le infiltrazioni sono dolorose?", a: "Il disagio è minimo e di breve durata. Spesso inferiore all'attesa. Si può applicare ghiaccio spray." },
      { q: "Quante infiltrazioni servono?", a: "Per l'acido ialuronico, ciclo di 3-5 infiltrazioni. Per il cortisone, max 3-4 all'anno." },
      { q: "Posso camminare subito dopo?", a: "Sì, ma è consigliato riposo relativo per 24-48 ore. Evitare sport per 1 settimana." }
    ],
    durata: '15-20 minuti'
  },

  // OCULISTICA
  'visita-oculistica.html': {
    title_main: 'Visita Oculistica',
    title_accent: '& Screening Glaucoma',
    hero_desc: 'Check-up completo della vista con OCT, Campo Visivo e Tonometria. Prevenzione di glaucoma, cataratta e retinopatia diabetica.',
    sintomi_groups: [
      { title: 'Vista', icon: 'fa-eye', list: ['Calo della vista', 'Visione offuscata', 'Difficoltà notturna', 'Visione doppia'] },
      { title: 'Sintomi', icon: 'fa-exclamation-triangle', list: ['Mosche volanti', 'Lampi di luce', 'Occhio rosso', 'Secchezza oculare'] },
      { title: 'Prevenzione', icon: 'fa-shield', list: ['Screening glaucoma', 'Fondo oculare diabetici', 'Over 40', 'Familiarità'] }
    ],
    tech_steps: [
      { num: '01', title: 'Visita Base', desc: 'Acuità visiva, refrazione, biomicroscopia, fundus oculi.' },
      { num: '02', title: 'OCT Retinico', desc: 'Tomografia retinica ad alta risoluzione per glaucoma e maculopatie.' },
      { num: '03', title: 'Tonometria', desc: 'Misurazione pressione oculare a soffio e a contatto.' }
    ],
    faq: [
      { q: "Ogni quanto fare il controllo oculistico?", a: "Ogni 1-2 anni. Annualmente se diabetici, ipertesi, miopi elevati o over 60." },
      { q: "Posso guidare dopo la visita?", a: "Se vengono instillate gocce per dilatare la pupilla, è consigliato non guidare per 2-3 ore." },
      { q: "Fate anche prescrizione occhiali?", a: "Sì, la visita include la prescrizione per occhiali da vista e lenti a contatto." }
    ],
    durata: '30-45 minuti'
  },

  // PNEUMOLOGIA
  'spirometria.html': {
    title_main: 'Spirometria',
    title_accent: '& Test Broncodilatatore',
    hero_desc: 'Esame funzionale respiratorio per asma, BPCO e valutazione capacità polmonare. Test con e senza broncodilatatore.',
    sintomi_groups: [
      { title: 'Respiro', icon: 'fa-lungs', list: ['Dispnea', 'Tosse cronica', 'Respiro sibilante', 'Oppressione toracica'] },
      { title: 'Diagnosi', icon: 'fa-stethoscope', list: ['Asma', 'BPCO', 'Bronchite cronica', 'Enfisema'] },
      { title: 'Screening', icon: 'fa-clipboard-check', list: ['Fumatori', 'Lavoratori esposti', 'Pre-operatorio', 'Sportivi'] }
    ],
    tech_steps: [
      { num: '01', title: 'Spirometria Base', desc: 'Soffiare nello spirometro con massimo sforzo. 3 prove, si prende la migliore.' },
      { num: '02', title: 'Test Broncodilatatore', desc: 'Inalazione di Salbutamolo, ripetizione dopo 15 minuti. Valuta reversibilità.' },
      { num: '03', title: 'Referto', desc: 'FEV1, FVC, indice di Tiffeneau. Classificazione GOLD per BPCO.' }
    ],
    faq: [
      { q: "Devo sospendere gli spray?", a: "Dipende dal quesito clinico. Di solito si sospende il broncodilatatore 4-6 ore prima." },
      { q: "È faticosa la spirometria?", a: "Richiede una espirazione forzata, può causare leggero capogiro. Durata totale 15-20 minuti." },
      { q: "La spirometria fa diagnosi di asma?", a: "È fondamentale ma non sufficiente da sola. Il pneumologo integra con storia clinica e altri test." }
    ],
    durata: '20-30 minuti'
  },

  // ORL
  'audiometria.html': {
    title_main: 'Audiometria',
    title_accent: '& Impedenziometria',
    hero_desc: 'Esame dell\'udito completo con audiometria tonale e vocale. Impedenziometria per valutare l\'orecchio medio.',
    sintomi_groups: [
      { title: 'Udito', icon: 'fa-ear-listen', list: ['Calo udito', 'Difficoltà conversazione', 'Ipoacusia monolaterale', 'Presbiacusia'] },
      { title: 'Sintomi', icon: 'fa-volume-xmark', list: ['Acufeni', 'Sensazione orecchio chiuso', 'Vertigini', 'Otite ricorrente'] },
      { title: 'Screening', icon: 'fa-user-check', list: ['Lavoratori esposti a rumore', 'Screening neonatale', 'Follow-up protesi', 'Idoneità lavoro'] }
    ],
    tech_steps: [
      { num: '01', title: 'Audiometria Tonale', desc: 'Cuffie, suoni a diverse frequenze. Si alza la mano quando si sente.' },
      { num: '02', title: 'Audiometria Vocale', desc: 'Ripetizione di parole per valutare la comprensione.' },
      { num: '03', title: 'Impedenziometria', desc: 'Sonda nell\'orecchio, variazioni di pressione. Valuta timpano e catena ossiculare.' }
    ],
    faq: [
      { q: "L'audiometria è dolorosa?", a: "Assolutamente no. È un esame che richiede solo di ascoltare dei suoni e alzare la mano." },
      { q: "Quanto dura l'esame completo?", a: "Circa 20-30 minuti per audiometria + impedenziometria." },
      { q: "Il cerume influisce sul risultato?", a: "Sì, se eccessivo. L'otorinolaringoiatra può rimuoverlo prima dell'esame." }
    ],
    durata: '20-30 minuti'
  },

  // VASCOLARE
  'eco-doppler-arti.html': {
    title_main: 'Eco-Doppler',
    title_accent: 'Arti Inferiori',
    hero_desc: 'Ecografia vascolare per lo studio di arterie e vene delle gambe. Diagnosi di insufficienza venosa, trombosi e arteriopatie.',
    sintomi_groups: [
      { title: 'Vene', icon: 'fa-wave-square', list: ['Gambe pesanti', 'Vene varicose', 'Gonfiore caviglie', 'Crampi notturni'] },
      { title: 'Arterie', icon: 'fa-heart-pulse', list: ['Claudicatio', 'Piedi freddi', 'Dolore a riposo', 'Ulcere arti'] },
      { title: 'Emergenze', icon: 'fa-triangle-exclamation', list: ['Sospetta TVP', 'Gamba gonfia', 'Dolore polpaccio', 'Rossore localizzato'] }
    ],
    tech_steps: [
      { num: '01', title: 'Studio Venoso', desc: 'Paziente in piedi e supino. Compressione venosa, manovre dinamiche.' },
      { num: '02', title: 'Studio Arterioso', desc: 'Valutazione flusso, placche, stenosi. Indice caviglia-braccio (ABI).' },
      { num: '03', title: 'Referto', desc: 'Mappatura vascolare completa, classificazione CEAP, indicazioni terapeutiche.' }
    ],
    faq: [
      { q: "Devo stare a digiuno?", a: "No, non è necessaria alcuna preparazione. Abbigliamento comodo per esporre le gambe." },
      { q: "L'eco-doppler vede i trombi?", a: "Sì, è l'esame di prima scelta per la diagnosi di trombosi venosa profonda (TVP)." },
      { q: "Quanto dura l'esame?", a: "Circa 30-40 minuti per lo studio completo di entrambi gli arti." }
    ],
    durata: '30-40 minuti'
  },
  
  'scleroterapia.html': {
    title_main: 'Scleroterapia',
    title_accent: 'Vene Varicose',
    hero_desc: 'Trattamento ambulatoriale delle vene varicose e dei capillari. Iniezione di sostanza sclerosante per eliminare gli inestetismi.',
    sintomi_groups: [
      { title: 'Estetica', icon: 'fa-wand-magic-sparkles', list: ['Capillari visibili', 'Teleangectasie', 'Reticoli venosi', 'Vene visibili'] },
      { title: 'Sintomi', icon: 'fa-leg', list: ['Gambe pesanti', 'Prurito', 'Bruciore', 'Gonfiore'] },
      { title: 'Varici', icon: 'fa-wave-square', list: ['Vene varicose piccole', 'Recidive post-intervento', 'Varici residue', 'Insufficienza venosa'] }
    ],
    tech_steps: [
      { num: '01', title: 'Valutazione', desc: 'Eco-doppler preliminare per mappare il circolo e scegliere i punti di iniezione.' },
      { num: '02', title: 'Iniezione', desc: 'Ago sottilissimo, sostanza sclerosante. Più iniezioni per seduta.' },
      { num: '03', title: 'Post-trattamento', desc: 'Calza elastica 24-48h. Camminare subito, evitare esposizione solare.' }
    ],
    faq: [
      { q: "La scleroterapia è dolorosa?", a: "L'iniezione causa solo un leggero bruciore transitorio. Non richiede anestesia." },
      { q: "Quante sedute servono?", a: "Dipende dall'estensione. In media 2-4 sedute a distanza di 3-4 settimane." },
      { q: "Quando vedo i risultati?", a: "I capillari spariscono in 3-6 settimane. Le vene più grosse possono richiedere più tempo." }
    ],
    durata: '30-45 minuti'
  },

  // GASTROENTEROLOGIA
  'ecografia-addominale.html': {
    title_main: 'Ecografia',
    title_accent: 'Addominale',
    hero_desc: 'Studio ecografico completo di fegato, cistifellea, pancreas, milza e reni. Esame di primo livello per dolori addominali e screening.',
    sintomi_groups: [
      { title: 'Dolore', icon: 'fa-stomach', list: ['Dolore addominale', 'Coliche biliari', 'Dispepsia', 'Nausea ricorrente'] },
      { title: 'Screening', icon: 'fa-search', list: ['Calcoli biliari', 'Steatosi epatica', 'Cisti renali', 'Aneurisma aorta'] },
      { title: 'Follow-up', icon: 'fa-rotate', list: ['Epatopatie', 'Pancreatite', 'Litiasi renale', 'Masse note'] }
    ],
    tech_steps: [
      { num: '01', title: 'Preparazione', desc: 'Digiuno da 6-8 ore. Intestino libero (no cibi che fermentano).' },
      { num: '02', title: 'Scansione', desc: 'Sonda addominale, paziente supino e su fianco. Studio sistematico organi.' },
      { num: '03', title: 'Referto', desc: 'Descrizione morfologica completa, eventuale indicazione a TC/RMN.' }
    ],
    faq: [
      { q: "Perché devo stare a digiuno?", a: "Il digiuno permette di vedere la colecisti distesa e riduce il gas intestinale che ostacola la visualizzazione." },
      { q: "L'ecografia vede lo stomaco?", a: "Parzialmente. Per lo stomaco è preferibile la gastroscopia. L'eco vede fegato, cistifellea, pancreas, reni, milza." },
      { q: "Posso bere acqua?", a: "Sì, l'acqua è consentita e può migliorare la visualizzazione di alcuni organi." }
    ],
    durata: '20-30 minuti'
  },

  // NUTRIZIONISTA
  'visita-nutrizionale.html': {
    title_main: 'Visita',
    title_accent: 'Nutrizionale',
    hero_desc: 'Consulenza personalizzata per alimentazione e benessere. Diete per patologie, sport, dimagrimento e condizioni specifiche.',
    sintomi_groups: [
      { title: 'Peso', icon: 'fa-weight-scale', list: ['Sovrappeso', 'Obesità', 'Difficoltà a dimagrire', 'Magrezza eccessiva'] },
      { title: 'Patologie', icon: 'fa-disease', list: ['Diabete', 'Dislipidemie', 'Ipertensione', 'Intolleranze'] },
      { title: 'Benessere', icon: 'fa-apple-whole', list: ['Sport e performance', 'Gravidanza', 'Menopausa', 'Alimentazione vegetariana'] }
    ],
    tech_steps: [
      { num: '01', title: 'Anamnesi', desc: 'Storia alimentare, abitudini, patologie, farmaci, obiettivi.' },
      { num: '02', title: 'Valutazione', desc: 'Peso, altezza, BMI, circonferenze, impedenziometria (massa grassa/magra).' },
      { num: '03', title: 'Piano Alimentare', desc: 'Dieta personalizzata, lista della spesa, consigli pratici, follow-up.' }
    ],
    faq: [
      { q: "Quanto dura la prima visita?", a: "Circa 45-60 minuti per anamnesi completa, valutazione e impostazione del piano alimentare." },
      { q: "Quante volte devo tornare?", a: "In genere controlli ogni 3-4 settimane inizialmente, poi mensili. Dipende dagli obiettivi." },
      { q: "Fate diete anche per sportivi?", a: "Sì, abbiamo nutrizionisti specializzati in alimentazione sportiva per performance e recupero." }
    ],
    durata: '45-60 minuti'
  },

  // FISIATRIA
  'visita-fisiatrica.html': {
    title_main: 'Visita',
    title_accent: 'Fisiatrica',
    hero_desc: 'Valutazione funzionale e riabilitativa dell\'apparato muscolo-scheletrico. Piano terapeutico personalizzato per recupero motorio.',
    sintomi_groups: [
      { title: 'Dolore', icon: 'fa-bolt', list: ['Mal di schiena', 'Cervicalgia', 'Lombalgia', 'Sciatalgia'] },
      { title: 'Riabilitazione', icon: 'fa-person-walking', list: ['Post-intervento', 'Post-frattura', 'Post-ictus', 'Protesi'] },
      { title: 'Funzione', icon: 'fa-arrows-up-down', list: ['Rigidità articolare', 'Debolezza muscolare', 'Equilibrio', 'Postura'] }
    ],
    tech_steps: [
      { num: '01', title: 'Valutazione', desc: 'Esame clinico funzionale, test articolari e muscolari, analisi posturale.' },
      { num: '02', title: 'Diagnosi', desc: 'Identificazione del problema, eventuale richiesta esami strumentali.' },
      { num: '03', title: 'Progetto', desc: 'Piano riabilitativo personalizzato, indicazione fisioterapia, follow-up.' }
    ],
    faq: [
      { q: "Qual è la differenza tra fisiatra e ortopedico?", a: "Il fisiatra si occupa di riabilitazione non chirurgica. L'ortopedico anche di chirurgia. Spesso collaborano." },
      { q: "Il fisiatra prescrive la fisioterapia?", a: "Sì, è il medico che valuta e prescrive il percorso riabilitativo, inclusa la fisioterapia." },
      { q: "Devo portare esami precedenti?", a: "Sì, portare RX, RMN, TAC se disponibili. Aiutano la valutazione." }
    ],
    durata: '30-40 minuti'
  },

  // REUMATOLOGIA  
  'visita-reumatologica.html': {
    title_main: 'Visita',
    title_accent: 'Reumatologica',
    hero_desc: 'Diagnosi e cura di artriti, artrosi, connettiviti e malattie autoimmuni. Ecografia articolare in sede per diagnosi precoce.',
    sintomi_groups: [
      { title: 'Articolazioni', icon: 'fa-bone', list: ['Dolore articolare', 'Gonfiore articolare', 'Rigidità mattutina', 'Deformità'] },
      { title: 'Sistemici', icon: 'fa-fire', list: ['Stanchezza cronica', 'Febbre ricorrente', 'Secchezza occhi/bocca', 'Fenomeno di Raynaud'] },
      { title: 'Diagnosi', icon: 'fa-vial', list: ['Artrite reumatoide', 'Lupus', 'Fibromialgia', 'Spondilite'] }
    ],
    tech_steps: [
      { num: '01', title: 'Anamnesi', desc: 'Storia dettagliata sintomi, familiarità, esami ematici precedenti.' },
      { num: '02', title: 'Esame', desc: 'Valutazione clinica articolazioni, ecografia muscolo-scheletrica.' },
      { num: '03', title: 'Diagnosi', desc: 'Esami specifici (FR, anti-CCP, ANA), piano terapeutico, follow-up.' }
    ],
    faq: [
      { q: "Come capisco se ho una malattia reumatica?", a: "Dolore e gonfiore articolare persistenti, rigidità mattutina > 30 minuti, stanchezza cronica sono segnali da valutare." },
      { q: "Le malattie reumatiche sono curabili?", a: "Molte sono croniche ma controllabili con terapie moderne. La diagnosi precoce migliora molto la prognosi." },
      { q: "Fate l'ecografia articolare?", a: "Sì, abbiamo ecografo dedicato per lo studio delle articolazioni in sede durante la visita." }
    ],
    durata: '40-50 minuti'
  }
};

// ============================================================================
// GENERATE SPECIALISTS HTML SECTION
// ============================================================================
function generateSpecialistsHTML(physicians, specialtyId, color) {
  if (!physicians || physicians.length === 0) {
    return '';
  }
  
  // Limit to 3 specialists max
  const docs = physicians.slice(0, 3);
  
  let cardsHTML = docs.map(doc => {
    const title = doc.title || 'Dott.';
    const name = doc.name || `${doc.first_name} ${doc.last_name}`;
    const bio = doc.bio_short || 'Specialista Bio-Clinic';
    const badges = (doc.role_badges || []).slice(0, 2);
    const miodottoreUrl = doc.booking?.miodottore_url || '#';
    
    const badgesHTML = badges.map(b => 
      `<span class="inline-block bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">${b}</span>`
    ).join('');
    
    return `
              <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="p-6">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style="background-color: ${color}">
                      ${(doc.first_name || 'S')[0]}${(doc.last_name || 'D')[0]}
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">${title} ${name}</h3>
                      <p class="text-sm text-gray-500">${doc.job_title || 'Specialista'}</p>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 mb-4">${bio}</p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${badgesHTML}
                  </div>
                  <a href="${miodottoreUrl}" target="_blank" rel="noopener" 
                     class="inline-flex items-center gap-2 text-sm font-medium hover:underline" style="color: ${color}">
                    <i class="fas fa-calendar-check"></i> Prenota con questo specialista
                  </a>
                </div>
              </div>`;
  }).join('\n');
  
  return `
        <!-- SEZIONE SPECIALISTI DI RIFERIMENTO -->
        <section class="py-12" style="background-color: ${SPECIALTY_CONFIG[specialtyId]?.colorLight || '#f5f5f5'}">
          <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-10">
              <h2 class="text-3xl font-bold text-gray-900 mb-3">
                <i class="fas fa-user-md mr-3" style="color: ${color}"></i>
                I Nostri Specialisti
              </h2>
              <p class="text-gray-600 max-w-2xl mx-auto">
                Professionisti esperti, aggiornamento continuo e tecnologie all'avanguardia per la tua salute.
              </p>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
${cardsHTML}
            </div>
          </div>
        </section>
        <!-- FINE SEZIONE SPECIALISTI -->
`;
}

// ============================================================================
// INJECT SPECIALISTS INTO PAGE
// ============================================================================
function injectSpecialistsIntoPage(htmlContent, specialistsHTML) {
  // Find position after hero section or before footer
  const heroEndMatch = htmlContent.match(/<\/section>\s*<!--\s*(?:END|FINE)?\s*(?:HERO|Hero)/i);
  
  if (heroEndMatch) {
    const insertPos = heroEndMatch.index + heroEndMatch[0].length;
    return htmlContent.slice(0, insertPos) + '\n' + specialistsHTML + htmlContent.slice(insertPos);
  }
  
  // Alternative: insert before footer
  const footerMatch = htmlContent.match(/<footer/i);
  if (footerMatch) {
    return htmlContent.slice(0, footerMatch.index) + specialistsHTML + '\n' + htmlContent.slice(footerMatch.index);
  }
  
  // Fallback: insert before </body>
  return htmlContent.replace('</body>', specialistsHTML + '\n</body>');
}

// ============================================================================
// UPDATE DEEP DIVE CONTENT
// ============================================================================
function generateDeepDiveContent(procedureData, color) {
  // Generate symptom boxes
  const symptomBoxes = procedureData.sintomi_groups.map(group => `
            <div class="bg-white rounded-xl p-6 shadow-md border-l-4" style="border-color: ${color}">
              <div class="flex items-center gap-3 mb-4">
                <i class="fas ${group.icon} text-2xl" style="color: ${color}"></i>
                <h3 class="font-semibold text-gray-900">${group.title}</h3>
              </div>
              <ul class="space-y-2">
                ${group.list.map(item => `
                <li class="flex items-start gap-2 text-sm text-gray-600">
                  <i class="fas fa-check text-green-500 mt-1 text-xs"></i> ${item}
                </li>`).join('')}
              </ul>
            </div>`).join('\n');

  // Generate tech steps
  const techSteps = procedureData.tech_steps.map(step => `
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${color}">
                ${step.num}
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">${step.title}</h4>
                <p class="text-sm text-gray-600">${step.desc}</p>
              </div>
            </div>`).join('\n');

  // Generate FAQ
  const faqItems = procedureData.faq.map((item, i) => `
            <div class="border-b border-gray-200 last:border-0">
              <button class="w-full py-4 text-left flex justify-between items-center hover:text-gray-900 faq-toggle" 
                      onclick="this.classList.toggle('active'); this.nextElementSibling.classList.toggle('hidden')">
                <span class="font-medium text-gray-800">${item.q}</span>
                <i class="fas fa-chevron-down text-gray-400 transition-transform"></i>
              </button>
              <div class="pb-4 text-gray-600 ${i === 0 ? '' : 'hidden'}">
                ${item.a}
              </div>
            </div>`).join('\n');

  return { symptomBoxes, techSteps, faqItems };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   BIO-CLINIC COMPLETE DEEP DIVE + SPECIALISTS GENERATOR       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Load physicians
  const physicians = loadPhysicians();
  const physiciansBySpecialty = getPhysiciansBySpecialty(physicians);
  console.log(`📋 Loaded ${physicians.length} physicians across ${Object.keys(physiciansBySpecialty).length} specialties\n`);

  // Get all HTML files
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const specialtyId = FILE_SPECIALTY_MAP[file];
    
    if (!specialtyId) {
      skipped++;
      continue;
    }

    try {
      let html = fs.readFileSync(filePath, 'utf8');
      const config = SPECIALTY_CONFIG[specialtyId] || { color: '#666', colorLight: '#f5f5f5', icon: 'fa-stethoscope' };
      const specialistsList = physiciansBySpecialty[specialtyId] || [];
      
      // Check if already has specialists section
      const hasSpecialists = html.includes('SEZIONE SPECIALISTI DI RIFERIMENTO');
      
      if (!hasSpecialists && specialistsList.length > 0) {
        const specialistsHTML = generateSpecialistsHTML(specialistsList, specialtyId, config.color);
        html = injectSpecialistsIntoPage(html, specialistsHTML);
      }
      
      // Check for procedure-specific deep dive content
      const procedureData = PROCEDURE_DEEP_DATA[file];
      if (procedureData && !html.includes('DEEP DIVE CONTENT INJECTED')) {
        // Add marker
        html = html.replace('</head>', '<!-- DEEP DIVE CONTENT INJECTED -->\n</head>');
        
        // Update meta description
        if (procedureData.hero_desc) {
          html = html.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${procedureData.hero_desc.substring(0, 160)}">`
          );
        }
        
        // Update knowsAbout in JSON-LD
        if (procedureData.sintomi_groups) {
          const allSymptoms = procedureData.sintomi_groups.flatMap(g => g.list);
          const symptomsList = JSON.stringify(allSymptoms);
          
          // Try to update existing knowsAbout
          if (html.includes('"knowsAbout"')) {
            html = html.replace(
              /"knowsAbout"\s*:\s*\[[^\]]*\]/,
              `"knowsAbout": ${symptomsList}`
            );
          }
        }
      }
      
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`   ✅ ${file} - AGGIORNATO`);
      updated++;
      
    } catch (err) {
      console.error(`   ❌ ${file} - ERRORE: ${err.message}`);
      errors++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         RIEPILOGO                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`   ✅ Aggiornati:  ${updated} pagine`);
  console.log(`   ⏭️  Saltati:    ${skipped} (nessuna specialty mappata)`);
  console.log(`   ❌ Errori:      ${errors}`);
  console.log(`\n🎉 COMPLETATO!`);
}

main().catch(console.error);
