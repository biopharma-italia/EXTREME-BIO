/**
 * BIO-CLINIC UNIFIED SEARCH ENGINE
 * ================================
 * Version: 1.0.0
 * Generated: 2026-01-31
 * 
 * Sistema di triage digitale per Bio-Clinic Sassari.
 * NON è un motore testuale - è un assistente clinico che:
 * - Capisce l'intento dell'utente
 * - Risale sempre a una risposta pertinente (mai "nessun risultato")
 * - Prioritizza l'utente, non i pacchetti
 * 
 * © Bio-Clinic Sassari - bio-clinic.it
 */

const BioClinicUnifiedSearch = (function() {
  'use strict';

  // =============================================
  // CONFIGURAZIONE
  // =============================================
  const CONFIG = {
    minQueryLength: 2,
    maxResultsPerSection: 5,
    maxAutocomplete: 8,
    debounceMs: 200,
    dataPath: '/data',
    enableAnalytics: true
  };

  // =============================================
  // TASK 2: NORMALIZZAZIONE & SINONIMI
  // =============================================
  
  /**
   * Mappa sinonimi estesa per normalizzazione query
   * Gestisce: singolare/plurale, maschile/femminile,
   * termini colloquiali vs clinici, abbreviazioni
   */
  const SYNONYMS = {
    // ===== SPECIALISTI → SPECIALITÀ =====
    'ginecologo': { canonical: 'ginecologia', type: 'specialty' },
    'ginecologa': { canonical: 'ginecologia', type: 'specialty' },
    'ginecologhe': { canonical: 'ginecologia', type: 'specialty' },
    'ginecologi': { canonical: 'ginecologia', type: 'specialty' },
    'cardiologo': { canonical: 'cardiologia', type: 'specialty' },
    'cardiologa': { canonical: 'cardiologia', type: 'specialty' },
    'cardiologi': { canonical: 'cardiologia', type: 'specialty' },
    'endocrinologo': { canonical: 'endocrinologia', type: 'specialty' },
    'endocrinologa': { canonical: 'endocrinologia', type: 'specialty' },
    'endocrinologi': { canonical: 'endocrinologia', type: 'specialty' },
    'dermatologo': { canonical: 'dermatologia', type: 'specialty' },
    'dermatologa': { canonical: 'dermatologia', type: 'specialty' },
    'dermatologi': { canonical: 'dermatologia', type: 'specialty' },
    'neurologo': { canonical: 'neurologia', type: 'specialty' },
    'neurologa': { canonical: 'neurologia', type: 'specialty' },
    'neurologi': { canonical: 'neurologia', type: 'specialty' },
    'oculista': { canonical: 'oculistica', type: 'specialty' },
    'oculisti': { canonical: 'oculistica', type: 'specialty' },
    'ortopedico': { canonical: 'ortopedia', type: 'specialty' },
    'ortopedica': { canonical: 'ortopedia', type: 'specialty' },
    'ortopedici': { canonical: 'ortopedia', type: 'specialty' },
    'urologo': { canonical: 'urologia', type: 'specialty' },
    'urologa': { canonical: 'urologia', type: 'specialty' },
    'urologi': { canonical: 'urologia', type: 'specialty' },
    'otorino': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    'otorinolaringoiatra': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    'pneumologo': { canonical: 'pneumologia', type: 'specialty' },
    'pneumologa': { canonical: 'pneumologia', type: 'specialty' },
    'gastroenterologo': { canonical: 'gastroenterologia', type: 'specialty' },
    'gastroenterologa': { canonical: 'gastroenterologia', type: 'specialty' },
    'ematologo': { canonical: 'ematologia', type: 'specialty' },
    'ematologa': { canonical: 'ematologia', type: 'specialty' },
    'reumatologo': { canonical: 'reumatologia', type: 'specialty' },
    'reumatologhe': { canonical: 'reumatologia', type: 'specialty' },
    'nutrizionista': { canonical: 'nutrizione', type: 'specialty' },
    'dietologo': { canonical: 'nutrizione', type: 'specialty' },
    'dietologa': { canonical: 'nutrizione', type: 'specialty' },
    'ostetrica': { canonical: 'ostetricia', type: 'specialty' },
    'ostetriche': { canonical: 'ostetricia', type: 'specialty' },
    'andrologo': { canonical: 'urologia', type: 'specialty' },
    'medico competente': { canonical: 'medicina-lavoro', type: 'specialty' },
    
    // ===== SPECIALITÀ → SPECIALISTI (bidirezionale) =====
    'ginecologia': { canonical: 'ginecologia', relatedSpecialist: 'ginecologo', type: 'specialty' },
    'cardiologia': { canonical: 'cardiologia', relatedSpecialist: 'cardiologo', type: 'specialty' },
    'endocrinologia': { canonical: 'endocrinologia', relatedSpecialist: 'endocrinologo', type: 'specialty' },
    'dermatologia': { canonical: 'dermatologia', relatedSpecialist: 'dermatologo', type: 'specialty' },
    'neurologia': { canonical: 'neurologia', relatedSpecialist: 'neurologo', type: 'specialty' },
    'oculistica': { canonical: 'oculistica', relatedSpecialist: 'oculista', type: 'specialty' },
    'ortopedia': { canonical: 'ortopedia', relatedSpecialist: 'ortopedico', type: 'specialty' },
    'urologia': { canonical: 'urologia', relatedSpecialist: 'urologo', type: 'specialty' },
    
    // ===== TERMINI COLLOQUIALI → CLINICI =====
    'visita cuore': { canonical: 'cardiologia', type: 'specialty', procedure: 'visita-cardiologica' },
    'controllo cuore': { canonical: 'cardiologia', type: 'specialty', procedure: 'visita-cardiologica' },
    'visita donna': { canonical: 'ginecologia', type: 'specialty', procedure: 'visita-ginecologica' },
    'visita tiroide': { canonical: 'endocrinologia', type: 'specialty', procedure: 'visita-endocrinologica' },
    'controllo tiroide': { canonical: 'endocrinologia', type: 'specialty', procedure: 'ecografia-tiroidea' },
    'visita pelle': { canonical: 'dermatologia', type: 'specialty', procedure: 'visita-dermatologica' },
    'controllo nei': { canonical: 'dermatologia', type: 'specialty', procedure: 'mappatura-nevi' },
    'visita occhi': { canonical: 'oculistica', type: 'specialty', procedure: 'visita-oculistica' },
    'controllo vista': { canonical: 'oculistica', type: 'specialty', procedure: 'visita-oculistica' },
    
    // ===== ABBREVIAZIONI CLINICHE =====
    'eco': { canonical: 'ecografia', type: 'procedure_prefix' },
    'ecg': { canonical: 'elettrocardiogramma', type: 'procedure' },
    'ekg': { canonical: 'elettrocardiogramma', type: 'procedure' },
    'emg': { canonical: 'elettromiografia', type: 'procedure' },
    'tsh': { canonical: 'tsh-ultrasensibile', type: 'test' },
    'ft3': { canonical: 'ft3', type: 'test' },
    'ft4': { canonical: 'ft4', type: 'test' },
    'psa': { canonical: 'psa-totale', type: 'test' },
    'pcr': { canonical: 'proteina-c-reattiva', type: 'test' },
    'ves': { canonical: 'ves', type: 'test' },
    'hba1c': { canonical: 'emoglobina-glicata', type: 'test' },
    'glicata': { canonical: 'emoglobina-glicata', type: 'test' },
    'hdl': { canonical: 'colesterolo-hdl', type: 'test' },
    'ldl': { canonical: 'colesterolo-ldl', type: 'test' },
    'got': { canonical: 'ast-got', type: 'test' },
    'gpt': { canonical: 'alt-gpt', type: 'test' },
    'ast': { canonical: 'ast-got', type: 'test' },
    'alt': { canonical: 'alt-gpt', type: 'test' },
    'oct': { canonical: 'oct', type: 'procedure' },
    'moc': { canonical: 'densitometria-ossea', type: 'procedure' },
    'bia': { canonical: 'bioimpedenziometria', type: 'procedure' },
    
    // ===== SINTOMI → SPECIALITÀ/PERCORSI =====
    'dimagrire': { canonical: 'slim-care', type: 'pathway', specialty: 'endocrinologia' },
    'perdere peso': { canonical: 'slim-care', type: 'pathway', specialty: 'endocrinologia' },
    'obesità': { canonical: 'slim-care', type: 'pathway', specialty: 'endocrinologia' },
    'sovrappeso': { canonical: 'slim-care', type: 'pathway', specialty: 'endocrinologia' },
    'wegovy': { canonical: 'slim-care', type: 'pathway' },
    'mounjaro': { canonical: 'slim-care', type: 'pathway' },
    'ozempic': { canonical: 'slim-care', type: 'pathway' },
    'semaglutide': { canonical: 'slim-care', type: 'pathway' },
    'tirzepatide': { canonical: 'slim-care', type: 'pathway' },
    'fertilità': { canonical: 'pma-fertilita', type: 'pathway', specialty: 'ginecologia' },
    'infertilità': { canonical: 'pma-fertilita', type: 'pathway', specialty: 'ginecologia' },
    'pma': { canonical: 'pma-fertilita', type: 'pathway', specialty: 'ginecologia' },
    'fecondazione': { canonical: 'pma-fertilita', type: 'pathway' },
    'gravidanza': { canonical: 'ostetricia', type: 'specialty' },
    'incinta': { canonical: 'ostetricia', type: 'specialty' },
    'menopausa': { canonical: 'slim-care-donna', type: 'pathway', specialty: 'ginecologia' },
    'pcos': { canonical: 'slim-care-donna', type: 'pathway', specialty: 'ginecologia' },
    'ovaio policistico': { canonical: 'slim-care-donna', type: 'pathway', specialty: 'ginecologia' },
    
    // ===== PRESTAZIONI COMUNI =====
    'pap test': { canonical: 'pap-test', type: 'procedure', specialty: 'ginecologia' },
    'paptest': { canonical: 'pap-test', type: 'procedure', specialty: 'ginecologia' },
    'screening cervicale': { canonical: 'pap-test', type: 'procedure' },
    'hpv test': { canonical: 'hpv-test', type: 'procedure', specialty: 'ginecologia' },
    'colposcopia': { canonical: 'colposcopia', type: 'procedure', specialty: 'ginecologia' },
    'videocolposcopia': { canonical: 'colposcopia', type: 'procedure', specialty: 'ginecologia' },
    'caressflow': { canonical: 'caressflow', type: 'procedure', specialty: 'ginecologia' },
    'caress flow': { canonical: 'caressflow', type: 'procedure', specialty: 'ginecologia' },
    'radiofrequenza': { canonical: 'radiofrequenza-vaginale', type: 'procedure', specialty: 'ginecologia' },
    'radiofrequenza vaginale': { canonical: 'radiofrequenza-vaginale', type: 'procedure', specialty: 'ginecologia' },
    'atrofia vaginale': { canonical: 'radiofrequenza-vaginale', type: 'procedure', specialty: 'ginecologia' },
    'secchezza vaginale': { canonical: 'caressflow', type: 'procedure', specialty: 'ginecologia' },
    'nipt': { canonical: 'nipt', type: 'test', specialty: 'genetica' },
    'fetal dna': { canonical: 'nipt', type: 'test', specialty: 'genetica' },
    'dna fetale': { canonical: 'nipt', type: 'test', specialty: 'genetica' },
    'prenataladvance': { canonical: 'nipt', type: 'test', specialty: 'genetica' },
    'test prenatale': { canonical: 'nipt', type: 'test', specialty: 'ostetricia' },
    'morfologica': { canonical: 'ecografia-morfologica', type: 'procedure', specialty: 'ostetricia' },
    'translucenza': { canonical: 'translucenza-nucale', type: 'procedure', specialty: 'ostetricia' },
    'bitest': { canonical: 'bi-test', type: 'test', specialty: 'ostetricia' },
    'bi-test': { canonical: 'bi-test', type: 'test', specialty: 'ostetricia' },
    'holter': { canonical: 'holter-ecg', type: 'procedure', specialty: 'cardiologia' },
    'holter pressorio': { canonical: 'holter-pressorio', type: 'procedure', specialty: 'cardiologia' },
    'ecocardiogramma': { canonical: 'ecocardiogramma', type: 'procedure', specialty: 'cardiologia' },
    'mappatura nei': { canonical: 'mappatura-nevi', type: 'procedure', specialty: 'dermatologia' },
    'dermatoscopia': { canonical: 'mappatura-nevi', type: 'procedure', specialty: 'dermatologia' },
    'spirometria': { canonical: 'spirometria', type: 'procedure', specialty: 'pneumologia' },
    'spermiogramma': { canonical: 'spermiogramma', type: 'test', specialty: 'laboratorio' },
    
    // ===== PARTI DEL CORPO → SPECIALITÀ =====
    'cuore': { canonical: 'cardiologia', type: 'specialty' },
    'tiroide': { canonical: 'endocrinologia', type: 'specialty', test: 'tsh-ultrasensibile' },
    'prostata': { canonical: 'urologia', type: 'specialty', test: 'psa-totale' },
    'seno': { canonical: 'ginecologia', type: 'specialty', procedure: 'ecografia-mammaria' },
    'mammella': { canonical: 'ginecologia', type: 'specialty', procedure: 'ecografia-mammaria' },
    'utero': { canonical: 'ginecologia', type: 'specialty' },
    'ovaie': { canonical: 'ginecologia', type: 'specialty' },
    'fegato': { canonical: 'gastroenterologia', type: 'specialty' },
    'stomaco': { canonical: 'gastroenterologia', type: 'specialty' },
    'intestino': { canonical: 'gastroenterologia', type: 'specialty' },
    'reni': { canonical: 'nefrologia', type: 'specialty' },
    'polmoni': { canonical: 'pneumologia', type: 'specialty' },
    'cervello': { canonical: 'neurologia', type: 'specialty' },
    'articolazioni': { canonical: 'ortopedia', type: 'specialty' },
    'ossa': { canonical: 'ortopedia', type: 'specialty' },
    'ginocchio': { canonical: 'ortopedia', type: 'specialty' },
    'spalla': { canonical: 'ortopedia', type: 'specialty' },
    'schiena': { canonical: 'ortopedia', type: 'specialty' },
    'pelle': { canonical: 'dermatologia', type: 'specialty' },
    'nei': { canonical: 'dermatologia', type: 'specialty', procedure: 'mappatura-nevi' },
    'occhi': { canonical: 'oculistica', type: 'specialty' },
    'orecchio': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    'naso': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    'gola': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    
    // ===== SINTOMI → SPECIALITÀ =====
    'mal di testa': { canonical: 'neurologia', type: 'specialty' },
    'cefalea': { canonical: 'neurologia', type: 'specialty' },
    'emicrania': { canonical: 'neurologia', type: 'specialty' },
    'vertigini': { canonical: 'neurologia', type: 'specialty' },
    'formicolio': { canonical: 'neurologia', type: 'specialty' },
    'palpitazioni': { canonical: 'cardiologia', type: 'specialty' },
    'tachicardia': { canonical: 'cardiologia', type: 'specialty' },
    'aritmia': { canonical: 'cardiologia', type: 'specialty' },
    'affanno': { canonical: 'cardiologia', type: 'specialty' },
    'pressione alta': { canonical: 'cardiologia', type: 'specialty' },
    'ipertensione': { canonical: 'cardiologia', type: 'specialty' },
    'stanchezza': { canonical: 'endocrinologia', type: 'specialty', pack: 'checkup-tiroide' },
    'diabete': { canonical: 'endocrinologia', type: 'specialty' },
    'glicemia': { canonical: 'endocrinologia', type: 'specialty', test: 'glicemia' },
    'colesterolo': { canonical: 'cardiologia', type: 'specialty', test: 'colesterolo-totale' },
    'anemia': { canonical: 'ematologia', type: 'specialty', test: 'emocromo-completo' },
    'prurito': { canonical: 'dermatologia', type: 'specialty' },
    'acne': { canonical: 'dermatologia', type: 'specialty' },
    'psoriasi': { canonical: 'dermatologia', type: 'specialty' },
    'allergia': { canonical: 'dermatologia', type: 'specialty' },
    'dolore pelvico': { canonical: 'ginecologia', type: 'specialty' },
    'ciclo irregolare': { canonical: 'ginecologia', type: 'specialty' },
    'bruciore urinario': { canonical: 'urologia', type: 'specialty' },
    'mal di schiena': { canonical: 'ortopedia', type: 'specialty' },
    'dolore ginocchio': { canonical: 'ortopedia', type: 'specialty' },
    
    // ===== CONTESTO LAVORATIVO =====
    'lavoro': { canonical: 'medicina-lavoro', type: 'specialty' },
    'azienda': { canonical: 'medicina-lavoro', type: 'specialty' },
    'aziende': { canonical: 'medicina-lavoro', type: 'specialty' },
    'dipendenti': { canonical: 'medicina-lavoro', type: 'specialty' },
    'idoneità': { canonical: 'medicina-lavoro', type: 'specialty' },
    'sorveglianza sanitaria': { canonical: 'medicina-lavoro', type: 'specialty' },
    'visita aziendale': { canonical: 'medicina-lavoro', type: 'specialty' },
    
    // ===== SPORT =====
    'certificato sportivo': { canonical: 'medicina-sport', type: 'specialty' },
    'idoneità sportiva': { canonical: 'medicina-sport', type: 'specialty' },
    'sport': { canonical: 'medicina-sport', type: 'specialty' },
    'agonistico': { canonical: 'medicina-sport', type: 'specialty' },
    
    // ===== GENETICA =====
    'genetica': { canonical: 'genetica', type: 'specialty' },
    'brca': { canonical: 'brca-plus', type: 'test', specialty: 'genetica' },
    'oncogenetica': { canonical: 'pannello-oncogenetico', type: 'test', specialty: 'genetica' },
    'carrier screening': { canonical: 'carrier-screening', type: 'test', specialty: 'genetica' },
    'era test': { canonical: 'era-test', type: 'test', specialty: 'genetica' },
    'emma test': { canonical: 'emma-test', type: 'test', specialty: 'genetica' },
    'alice test': { canonical: 'alice-test', type: 'test', specialty: 'genetica' },
    'endometrio': { canonical: 'era-test', type: 'test', specialty: 'genetica' },
    
    // ===== ESAMI LABORATORIO COMUNI =====
    'emocromo': { canonical: 'emocromo-completo', type: 'test', specialty: 'laboratorio' },
    'esame urine': { canonical: 'esame-urine-completo', type: 'test', specialty: 'laboratorio' },
    'urine': { canonical: 'esame-urine-completo', type: 'test', specialty: 'laboratorio' },
    'urinocoltura': { canonical: 'urinocoltura', type: 'test', specialty: 'laboratorio' },
    'bilirubina': { canonical: 'bilirubina-totale', type: 'test', specialty: 'laboratorio' },
    'transaminasi': { canonical: 'ast-got', type: 'test', specialty: 'laboratorio' },
    'gamma gt': { canonical: 'gamma-gt', type: 'test', specialty: 'laboratorio' },
    'ggt': { canonical: 'gamma-gt', type: 'test', specialty: 'laboratorio' },
    'creatinina': { canonical: 'creatinina', type: 'test', specialty: 'laboratorio' },
    'azotemia': { canonical: 'azotemia', type: 'test', specialty: 'laboratorio' },
    'coagulazione': { canonical: 'pt-inr', type: 'test', specialty: 'laboratorio' },
    'pt': { canonical: 'pt-inr', type: 'test', specialty: 'laboratorio' },
    'inr': { canonical: 'pt-inr', type: 'test', specialty: 'laboratorio' },
    'ptt': { canonical: 'ptt-aptt', type: 'test', specialty: 'laboratorio' },
    'd-dimero': { canonical: 'd-dimero', type: 'test', specialty: 'laboratorio' },
    'fibrinogeno': { canonical: 'fibrinogeno', type: 'test', specialty: 'laboratorio' },
    'sangue occulto': { canonical: 'sangue-occulto-feci', type: 'test', specialty: 'laboratorio' },
    'esame feci': { canonical: 'sangue-occulto-feci', type: 'test', specialty: 'laboratorio' },
    'calprotectina': { canonical: 'calprotectina-fecale', type: 'test', specialty: 'laboratorio' },
    'vitamina d': { canonical: 'vitamina-d', type: 'test', specialty: 'laboratorio' },
    'vitamina b12': { canonical: 'vitamina-b12', type: 'test', specialty: 'laboratorio' },
    'acido folico': { canonical: 'acido-folico', type: 'test', specialty: 'laboratorio' },
    'ferro': { canonical: 'sideremia', type: 'test', specialty: 'laboratorio' },
    'sideremia': { canonical: 'sideremia', type: 'test', specialty: 'laboratorio' },
    'ferritina': { canonical: 'ferritina', type: 'test', specialty: 'laboratorio' },
    'trigliceridi': { canonical: 'trigliceridi', type: 'test', specialty: 'laboratorio' },
    'colesterolo totale': { canonical: 'colesterolo-totale', type: 'test', specialty: 'laboratorio' },
    
    // ===== CHECK-UP =====
    'check up': { canonical: 'checkup-base', type: 'pack' },
    'checkup': { canonical: 'checkup-base', type: 'pack' },
    'analisi': { canonical: 'laboratorio', type: 'specialty' },
    'esami sangue': { canonical: 'laboratorio', type: 'specialty' },
    'esami del sangue': { canonical: 'laboratorio', type: 'specialty' },
    'prelievo': { canonical: 'laboratorio', type: 'specialty' },
    'laboratorio': { canonical: 'laboratorio', type: 'specialty' },
    
    // ===== TYPO COMUNI =====
    'tiroyde': { canonical: 'endocrinologia', type: 'specialty' },
    'tirodite': { canonical: 'endocrinologia', type: 'specialty' },
    'ecographia': { canonical: 'ecografia', type: 'procedure_prefix' },
    'ginecologgia': { canonical: 'ginecologia', type: 'specialty' },
    'cardiologa': { canonical: 'cardiologia', type: 'specialty' },
    'dermatologgia': { canonical: 'dermatologia', type: 'specialty' }
  };

  /**
   * Normalizza una query utente
   * @param {string} query - Query originale
   * @returns {Object} - { normalized, tokens, intent, synonymMatch }
   */
  function normalizeQuery(query) {
    if (!query || typeof query !== 'string') {
      return { normalized: '', tokens: [], intent: null, synonymMatch: null };
    }
    
    // Pulizia base
    let normalized = query
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
      .replace(/[^\w\s-]/g, ' ')       // Rimuove caratteri speciali
      .replace(/\s+/g, ' ')            // Normalizza spazi
      .trim();
    
    // Tokenizzazione
    const tokens = normalized.split(' ').filter(t => t.length >= 2);
    
    // Cerca match nei sinonimi
    let synonymMatch = null;
    let intent = null;
    
    // Prima cerca match esatto della frase completa
    if (SYNONYMS[normalized]) {
      synonymMatch = SYNONYMS[normalized];
      intent = synonymMatch.type;
    } else {
      // Cerca match per singoli token
      for (const token of tokens) {
        if (SYNONYMS[token]) {
          synonymMatch = SYNONYMS[token];
          intent = synonymMatch.type;
          break;
        }
      }
      
      // Cerca match per coppie di token
      if (!synonymMatch && tokens.length >= 2) {
        for (let i = 0; i < tokens.length - 1; i++) {
          const pair = tokens[i] + ' ' + tokens[i + 1];
          if (SYNONYMS[pair]) {
            synonymMatch = SYNONYMS[pair];
            intent = synonymMatch.type;
            break;
          }
        }
      }
    }
    
    return {
      original: query,
      normalized,
      tokens,
      intent,
      synonymMatch
    };
  }

  // =============================================
  // TASK 6: DATA MODEL UNIFICATO
  // =============================================
  
  /**
   * Indice unificato di tutte le entità cercabili
   * Ogni entità ha: id, type, name, synonyms[], related_to[], priority_weight, url
   */
  let UNIFIED_INDEX = {
    specialties: new Map(),
    procedures: new Map(),
    tests: new Map(),
    pathways: new Map(),
    packs: new Map(),
    physicians: new Map()
  };

  // Cache per ricerche veloci
  let SEARCH_CACHE = new Map();
  const CACHE_MAX_SIZE = 100;

  /**
   * Carica i dati da JSON
   */
  async function loadData() {
    try {
      const [
        specialtiesData,
        proceduresData,
        testsData,
        pathwaysData,
        packsData,
        physiciansData
      ] = await Promise.all([
        fetch(`${CONFIG.dataPath}/entities/specialties.json`).then(r => r.json()).catch(() => ({ specialties: [] })),
        fetch(`${CONFIG.dataPath}/entities/procedures.json`).then(r => r.json()).catch(() => ({ procedures: [] })),
        fetch(`${CONFIG.dataPath}/entities/tests.json`).then(r => r.json()).catch(() => ({ tests: [] })),
        fetch(`${CONFIG.dataPath}/entities/pathways.json`).then(r => r.json()).catch(() => ({ pathways: [] })),
        fetch(`${CONFIG.dataPath}/entities/packs.json`).then(r => r.json()).catch(() => ({ packs: [] })),
        fetch(`${CONFIG.dataPath}/entities/physicians-complete.json`).then(r => r.json()).catch(() => ({ physicians: [] }))
      ]);

      // Indicizza specialità
      if (specialtiesData.specialties) {
        for (const spec of specialtiesData.specialties) {
          UNIFIED_INDEX.specialties.set(spec.slug, {
            id: spec.slug,
            type: 'specialty',
            name: spec.name,
            nameShort: spec.name.split(' ')[0],
            synonyms: spec.keywords || [],
            procedures: spec.main_procedures || [],
            tests: spec.main_tests || [],
            physicians: spec.physicians || [],
            pathways: spec.related_pathways || [],
            pageUrl: spec.page_url,
            icon: spec.icon,
            priority: 100
          });
        }
      }

      // Indicizza procedure
      if (proceduresData.procedures) {
        for (const proc of proceduresData.procedures) {
          UNIFIED_INDEX.procedures.set(proc.id, {
            id: proc.id,
            type: 'procedure',
            name: proc.name,
            nameExtended: proc.name_extended,
            specialtyId: proc.specialty_id,
            synonyms: proc.search_terms || [],
            indications: proc.indications || [],
            physicians: proc.physicians || [],
            pathways: proc.pathways || [],
            relatedProcedures: proc.related_procedures || [],
            pageUrl: proc.page_url || `/pages/${proc.id}.html`,
            duration: proc.duration_minutes,
            priority: proc.booking_priority === 'high' ? 90 : 70
          });
        }
      }

      // Indicizza test di laboratorio
      if (testsData.tests) {
        for (const test of testsData.tests) {
          UNIFIED_INDEX.tests.set(test.id, {
            id: test.id,
            type: 'test',
            name: test.name,
            code: test.code,
            categoryId: test.category_id,
            synonyms: [...(test.aliases || []), ...(test.search_terms || [])],
            indications: test.indications || [],
            includedInPacks: test.included_in_packs || [],
            primaryPack: test.primary_pack,
            relatedTests: test.related_tests || [],
            pageUrl: `/laboratorio/index.html#${test.id}`,
            preparation: test.preparation,
            turnaround: test.turnaround_time,
            priority: test.primary_pack ? 80 : 60
          });
        }
      }

      // Indicizza percorsi
      if (pathwaysData.pathways) {
        for (const path of pathwaysData.pathways) {
          UNIFIED_INDEX.pathways.set(path.id, {
            id: path.id,
            type: 'pathway',
            name: path.name,
            nameShort: path.name_short,
            synonyms: [...(path.aliases || []), ...(path.symptom_keywords || [])],
            specialtyId: path.specialty_id,
            procedures: path.includes?.procedures || [],
            tests: path.includes?.tests || [],
            physicians: path.includes?.physicians || [],
            pageUrl: path.cta_url,
            isFlagship: path.is_flagship,
            description: path.description_short,
            priority: path.is_flagship ? 95 : 85
          });
        }
      }

      // Indicizza pacchetti
      if (packsData.packs) {
        for (const pack of packsData.packs) {
          UNIFIED_INDEX.packs.set(pack.id, {
            id: pack.id,
            type: 'pack',
            name: pack.name,
            categoryId: pack.category,
            synonyms: [],
            targetPatient: pack.target_patient,
            targetConditions: pack.target_conditions || [],
            examsIncluded: pack.exams_included || [],
            pageUrl: pack.cta_url,
            price: null, // Da database.js
            savings: pack.savings_percentage,
            priority: pack.priority_score || 70
          });
        }
      }

      // Indicizza medici
      if (physiciansData.physicians) {
        for (const doc of physiciansData.physicians) {
          UNIFIED_INDEX.physicians.set(doc.id, {
            id: doc.id,
            type: 'physician',
            name: doc.name,
            fullName: doc.full_name,
            title: doc.title,
            specialtyId: doc.specialty_id,
            jobTitle: doc.job_title,
            synonyms: [doc.name.toLowerCase(), doc.full_name.toLowerCase()],
            procedures: doc.procedures || [],
            pathways: doc.pathways || [],
            pageUrl: `/equipe/${doc.slug}.html`,
            bookingUrl: doc.miodottore_url,
            bookingEnabled: doc.booking_enabled,
            roleBadge: doc.role_badge,
            priority: doc.role_badge ? 85 : 75
          });
        }
      }

      // Integra dati da BioClinicDB (database.js) se disponibile
      await integrateFromBioClinicDB();

      console.log('[UnifiedSearch] Data loaded:', {
        specialties: UNIFIED_INDEX.specialties.size,
        procedures: UNIFIED_INDEX.procedures.size,
        tests: UNIFIED_INDEX.tests.size,
        pathways: UNIFIED_INDEX.pathways.size,
        packs: UNIFIED_INDEX.packs.size,
        physicians: UNIFIED_INDEX.physicians.size
      });

      return true;
    } catch (error) {
      console.error('[UnifiedSearch] Error loading data:', error);
      return false;
    }
  }

  /**
   * Integra dati dal database BioClinicDB (database.js)
   * Aggiunge 1136 esami, 13 pack e procedure diagnostiche
   */
  async function integrateFromBioClinicDB() {
    // Verifica che BioClinicDB sia disponibile
    if (typeof BioClinicDB === 'undefined') {
      console.log('[UnifiedSearch] BioClinicDB non disponibile, skip integrazione');
      return;
    }

    try {
      // 1. Integra ESAMI dal listino (1136 esami)
      if (BioClinicDB.listino && Array.isArray(BioClinicDB.listino)) {
        for (const esame of BioClinicDB.listino) {
          // Evita duplicati (controlla se già esiste)
          if (UNIFIED_INDEX.tests.has(esame.id)) continue;
          
          UNIFIED_INDEX.tests.set(esame.id, {
            id: esame.id,
            type: 'test',
            name: esame.nome,
            category: esame.cat,
            price: esame.prezzo,
            synonyms: [...(esame.sintomi || []), esame.nome.toLowerCase()],
            symptoms: esame.sintomi || [],
            turnaround: esame.referto,
            preparation: esame.prep,
            upsellPack: esame.upsell,
            pageUrl: `/laboratorio/index.html#${esame.id}`,
            priority: esame.upsell ? 65 : 55 // Esami con pack suggerito hanno priorità leggermente maggiore
          });
        }
        console.log(`[UnifiedSearch] Integrati ${BioClinicDB.listino.length} esami da BioClinicDB`);
      }

      // 2. Integra PACCHETTI (13 pack)
      if (BioClinicDB.pacchetti && Array.isArray(BioClinicDB.pacchetti)) {
        for (const pack of BioClinicDB.pacchetti) {
          // Aggiorna o aggiungi
          const existing = UNIFIED_INDEX.packs.get(pack.id);
          UNIFIED_INDEX.packs.set(pack.id, {
            id: pack.id,
            type: 'pack',
            name: pack.nome,
            price: pack.prezzo,
            description: pack.descrizione,
            target: pack.target || [],
            synonyms: [...(pack.tags || []), ...(pack.target || [])],
            examsIncluded: pack.esami_chiave || [],
            examsCount: pack.esami_count,
            savings: pack.risparmio,
            icon: pack.icona,
            pageUrl: existing?.pageUrl || `/laboratorio/index.html#pack-${pack.id}`,
            priority: 70
          });
        }
        console.log(`[UnifiedSearch] Integrati ${BioClinicDB.pacchetti.length} pacchetti da BioClinicDB`);
      }

      // 3. Integra MEDICI con pubblicazioni
      if (BioClinicDB.physiciansWithPublications && Array.isArray(BioClinicDB.physiciansWithPublications)) {
        for (const doc of BioClinicDB.physiciansWithPublications) {
          // Aggiorna medici esistenti con info pubblicazioni
          const existing = UNIFIED_INDEX.physicians.get(doc.slug);
          if (existing) {
            existing.citations = doc.citations;
            existing.publications = doc.publications;
            existing.knowsAbout = doc.knowsAbout;
            existing.synonyms = [...(existing.synonyms || []), ...(doc.knowsAbout || [])];
            existing.priority = 90; // Medici con pubblicazioni hanno priorità maggiore
          } else {
            UNIFIED_INDEX.physicians.set(doc.slug, {
              id: doc.slug,
              type: 'physician',
              name: doc.name,
              specialty: doc.specialty,
              synonyms: [doc.name.toLowerCase(), ...(doc.knowsAbout || [])],
              citations: doc.citations,
              publications: doc.publications,
              knowsAbout: doc.knowsAbout,
              pageUrl: `/equipe/${doc.slug}.html`,
              priority: 90
            });
          }
        }
      }

      // 4. Integra PROCEDURE DIAGNOSTICHE
      if (BioClinicDB.procedureDiagnostiche && Array.isArray(BioClinicDB.procedureDiagnostiche)) {
        for (const proc of BioClinicDB.procedureDiagnostiche) {
          // Aggiorna o aggiungi
          const existing = UNIFIED_INDEX.procedures.get(proc.id);
          if (existing) {
            existing.synonyms = [...new Set([...(existing.synonyms || []), ...(proc.keywords || [])])];
            existing.correlati = proc.correlati;
          } else {
            UNIFIED_INDEX.procedures.set(proc.id, {
              id: proc.id,
              type: 'procedure',
              name: proc.nome,
              description: proc.descrizione,
              specialtyId: proc.specialty_id,
              synonyms: proc.keywords || [],
              correlati: proc.correlati || [],
              duration: proc.durata,
              preparation: proc.preparazione,
              price: proc.prezzo,
              pageUrl: proc.page_url || `/pages/${proc.id}.html`,
              priority: 85
            });
          }
        }
      }

      // 5. Indicizza per SINTOMI (ricerca sintomatica)
      if (BioClinicDB.bySymptom) {
        // bySymptom è un indice { sintomo: [esami] }
        // Lo usiamo per arricchire i sinonimi dei test
        Object.entries(BioClinicDB.bySymptom).forEach(([sintomo, esami]) => {
          esami.forEach(esame => {
            const test = UNIFIED_INDEX.tests.get(esame.id);
            if (test && !test.synonyms.includes(sintomo)) {
              test.synonyms.push(sintomo);
            }
          });
        });
      }

    } catch (error) {
      console.error('[UnifiedSearch] Errore integrazione BioClinicDB:', error);
    }
  }

  // =============================================
  // TASK 3: PRIORITÀ RISULTATI
  // =============================================

  /**
   * Algoritmo di ranking multi-criterio
   * 
   * CASO A (TERMINE = SPECIALITÀ):
   *   1) Pagina Specialità
   *   2) Prestazioni principali
   *   3) Medici
   *   4) Percorsi correlati
   *   5) Pack / check-up pertinenti
   * 
   * CASO B (TERMINE = PRESTAZIONE/ESAME):
   *   1) Pagina Servizio (se esiste)
   *   2) Specialità di riferimento
   *   3) Medici che la eseguono
   *   4) Percorso clinico che la include
   *   5) Pacchetto laboratorio / check-up
   * 
   * CASO C (TERMINE NON TROVATO):
   *   Risalire alla specialità, suggerire prestazioni affini
   */
  function rankResults(results, query, queryContext) {
    const { intent, synonymMatch } = queryContext;
    
    // Calcola score per ogni risultato
    const scoredResults = results.map(result => {
      let score = result.priority || 50;
      
      // Bonus per match diretto nel nome
      const nameMatch = result.name?.toLowerCase().includes(query.normalized);
      if (nameMatch) score += 30;
      
      // Bonus per match nei sinonimi
      const synonymMatchBonus = result.synonyms?.some(s => 
        s.toLowerCase().includes(query.normalized) || 
        query.normalized.includes(s.toLowerCase())
      );
      if (synonymMatchBonus) score += 20;
      
      // Applica logica per CASO A/B
      if (intent === 'specialty' || (synonymMatch?.type === 'specialty')) {
        // CASO A: priorità a specialità
        switch (result.type) {
          case 'specialty': score += 50; break;
          case 'procedure': score += 40; break;
          case 'physician': score += 30; break;
          case 'pathway': score += 20; break;
          case 'pack': score += 10; break; // Pack in fondo
        }
      } else if (intent === 'procedure' || intent === 'test') {
        // CASO B: priorità a prestazione/esame
        switch (result.type) {
          case 'procedure': score += 50; break;
          case 'test': score += 50; break;
          case 'specialty': score += 35; break;
          case 'physician': score += 25; break;
          case 'pathway': score += 15; break;
          case 'pack': score += 10; break;
        }
      } else if (intent === 'pathway') {
        // Priorità percorsi
        switch (result.type) {
          case 'pathway': score += 50; break;
          case 'specialty': score += 30; break;
          case 'procedure': score += 25; break;
          case 'physician': score += 20; break;
          case 'pack': score += 10; break;
        }
      }
      
      // TASK 4: Pack mai in prima posizione (a meno che ricerca esplicita)
      if (result.type === 'pack' && !query.normalized.includes('pack') && 
          !query.normalized.includes('check')) {
        score -= 15;
      }
      
      return { ...result, score };
    });
    
    // Ordina per score decrescente
    return scoredResults.sort((a, b) => b.score - a.score);
  }

  // =============================================
  // RICERCA PRINCIPALE
  // =============================================

  /**
   * Esegue ricerca unificata su tutti i domini
   * @param {string} query - Query utente
   * @returns {Object} - Risultati raggruppati per tipo
   */
  function search(query) {
    if (!query || query.length < CONFIG.minQueryLength) {
      return { results: [], groups: {}, fallback: null };
    }

    // Controlla cache
    const cacheKey = query.toLowerCase().trim();
    if (SEARCH_CACHE.has(cacheKey)) {
      return SEARCH_CACHE.get(cacheKey);
    }

    // Normalizza query
    const queryContext = normalizeQuery(query);
    const { normalized, tokens, synonymMatch } = queryContext;

    let allResults = [];
    let directMatch = false;

    // Se c'è un match sinonimo, cerca direttamente
    if (synonymMatch) {
      directMatch = true;
      const canonical = synonymMatch.canonical;
      
      // Cerca nel dominio appropriato
      switch (synonymMatch.type) {
        case 'specialty':
          const spec = UNIFIED_INDEX.specialties.get(canonical);
          if (spec) {
            allResults.push(spec);
            // Aggiungi prestazioni correlate
            spec.procedures.forEach(procId => {
              const proc = UNIFIED_INDEX.procedures.get(procId);
              if (proc) allResults.push(proc);
            });
            // Aggiungi medici
            spec.physicians.forEach(docId => {
              const doc = UNIFIED_INDEX.physicians.get(docId);
              if (doc) allResults.push(doc);
            });
            // Aggiungi percorsi
            spec.pathways.forEach(pathId => {
              const path = UNIFIED_INDEX.pathways.get(pathId);
              if (path) allResults.push(path);
            });
          }
          break;
          
        case 'procedure':
          const proc = UNIFIED_INDEX.procedures.get(canonical);
          if (proc) {
            allResults.push(proc);
            // Aggiungi specialità
            const relSpec = UNIFIED_INDEX.specialties.get(proc.specialtyId);
            if (relSpec) allResults.push(relSpec);
            // Aggiungi medici
            proc.physicians.forEach(docId => {
              const doc = UNIFIED_INDEX.physicians.get(docId);
              if (doc) allResults.push(doc);
            });
          }
          break;
          
        case 'test':
          const test = UNIFIED_INDEX.tests.get(canonical);
          if (test) {
            allResults.push(test);
            // Aggiungi pack se c'è
            if (test.primaryPack) {
              const pack = UNIFIED_INDEX.packs.get(test.primaryPack);
              if (pack) allResults.push(pack);
            }
          }
          break;
          
        case 'pathway':
          const pathway = UNIFIED_INDEX.pathways.get(canonical);
          if (pathway) {
            allResults.push(pathway);
            // Aggiungi specialità
            const pathSpec = UNIFIED_INDEX.specialties.get(pathway.specialtyId);
            if (pathSpec) allResults.push(pathSpec);
            // Aggiungi medici del percorso
            pathway.physicians.forEach(docId => {
              const doc = UNIFIED_INDEX.physicians.get(docId);
              if (doc) allResults.push(doc);
            });
          }
          break;
          
        case 'pack':
          const pack = UNIFIED_INDEX.packs.get(canonical);
          if (pack) allResults.push(pack);
          break;
      }
    }

    // Ricerca full-text su tutti i domini
    const searchInCollection = (collection, type) => {
      for (const [id, item] of collection) {
        // Evita duplicati
        if (allResults.some(r => r.id === id && r.type === type)) continue;
        
        // Match nel nome
        const nameMatch = item.name?.toLowerCase().includes(normalized);
        
        // Match nei sinonimi
        const synonymsMatch = item.synonyms?.some(s => {
          const sLower = s.toLowerCase();
          return sLower.includes(normalized) || normalized.includes(sLower);
        });
        
        // Match negli ambiti (indications, targetConditions)
        const indicationsMatch = item.indications?.some(i => i.toLowerCase().includes(normalized)) ||
                                 item.targetConditions?.some(c => c.toLowerCase().includes(normalized));
        
        // Match per token singoli
        const tokenMatch = tokens.some(token => 
          item.name?.toLowerCase().includes(token) ||
          item.synonyms?.some(s => s.toLowerCase().includes(token))
        );
        
        if (nameMatch || synonymsMatch || indicationsMatch || tokenMatch) {
          allResults.push(item);
        }
      }
    };

    // Cerca in tutti i domini
    searchInCollection(UNIFIED_INDEX.specialties, 'specialty');
    searchInCollection(UNIFIED_INDEX.procedures, 'procedure');
    searchInCollection(UNIFIED_INDEX.tests, 'test');
    searchInCollection(UNIFIED_INDEX.pathways, 'pathway');
    searchInCollection(UNIFIED_INDEX.packs, 'pack');
    searchInCollection(UNIFIED_INDEX.physicians, 'physician');

    // Rank results
    const rankedResults = rankResults(allResults, queryContext, queryContext);

    // Raggruppa per tipo (TASK 5)
    const groups = {
      specialties: [],
      procedures: [],
      tests: [],
      pathways: [],
      packs: [],
      physicians: []
    };

    rankedResults.forEach(result => {
      const groupKey = result.type + 's';
      if (groups[groupKey] && groups[groupKey].length < CONFIG.maxResultsPerSection) {
        groups[groupKey].push(result);
      }
    });

    // TASK 3 - CASO C: Fallback semantico se nessun risultato
    let fallback = null;
    if (rankedResults.length === 0) {
      fallback = generateFallback(queryContext);
    }

    const searchResult = {
      query: query,
      normalized,
      intent: queryContext.intent,
      directMatch,
      results: rankedResults.slice(0, 20),
      groups,
      fallback,
      totalCount: rankedResults.length
    };

    // Salva in cache
    if (SEARCH_CACHE.size >= CACHE_MAX_SIZE) {
      // Rimuovi entry più vecchia
      const firstKey = SEARCH_CACHE.keys().next().value;
      SEARCH_CACHE.delete(firstKey);
    }
    SEARCH_CACHE.set(cacheKey, searchResult);

    // Analytics
    if (CONFIG.enableAnalytics) {
      trackSearch(query, searchResult);
    }

    return searchResult;
  }

  /**
   * TASK 3 - CASO C: Genera fallback semantico
   * Mai restituire "nessun risultato"
   */
  function generateFallback(queryContext) {
    const { normalized, tokens } = queryContext;
    
    // Strategia 1: Trova specialità più vicina
    let bestSpecialty = null;
    let bestScore = 0;
    
    for (const [id, spec] of UNIFIED_INDEX.specialties) {
      let score = 0;
      tokens.forEach(token => {
        if (spec.name.toLowerCase().includes(token)) score += 3;
        if (spec.synonyms?.some(s => s.includes(token))) score += 2;
      });
      if (score > bestScore) {
        bestScore = score;
        bestSpecialty = spec;
      }
    }
    
    // Strategia 2: Suggerisci percorsi generici
    const genericPathways = Array.from(UNIFIED_INDEX.pathways.values())
      .filter(p => p.isFlagship)
      .slice(0, 2);
    
    // Strategia 3: Suggerisci check-up base
    const baseCheckup = UNIFIED_INDEX.packs.get('checkup-base');
    
    return {
      message: `Non abbiamo trovato "${normalized}" come voce specifica, ma potrebbe interessarti:`,
      suggestions: {
        specialty: bestSpecialty,
        pathways: genericPathways,
        pack: baseCheckup
      },
      contactPrompt: 'Hai bisogno di aiuto? Chiamaci al +39 079 956 1332'
    };
  }

  /**
   * Autocomplete veloce per input
   */
  function autocomplete(query) {
    if (!query || query.length < CONFIG.minQueryLength) {
      return [];
    }

    const results = search(query);
    const suggestions = [];

    // Priorità: specialità > procedure > medici > percorsi
    results.groups.specialties.slice(0, 2).forEach(s => {
      suggestions.push({
        type: 'specialty',
        icon: s.icon || '🏥',
        label: s.name,
        url: s.pageUrl
      });
    });

    results.groups.procedures.slice(0, 2).forEach(p => {
      suggestions.push({
        type: 'procedure',
        icon: '🩺',
        label: p.name,
        url: p.pageUrl
      });
    });

    results.groups.physicians.slice(0, 2).forEach(d => {
      suggestions.push({
        type: 'physician',
        icon: '👨‍⚕️',
        label: d.fullName,
        subtitle: d.jobTitle,
        url: d.pageUrl
      });
    });

    results.groups.pathways.slice(0, 1).forEach(pw => {
      suggestions.push({
        type: 'pathway',
        icon: '🎯',
        label: pw.nameShort || pw.name,
        url: pw.pageUrl
      });
    });

    return suggestions.slice(0, CONFIG.maxAutocomplete);
  }

  // =============================================
  // TASK 5: RENDERING UI
  // =============================================

  /**
   * Genera HTML per i risultati raggruppati
   */
  function renderResults(searchResult) {
    if (!searchResult || searchResult.totalCount === 0) {
      if (searchResult?.fallback) {
        return renderFallback(searchResult.fallback);
      }
      return '';
    }

    const { groups, directMatch, query } = searchResult;
    let html = '';

    // Sezione Percorsi Consigliati (solo se pertinenti)
    if (groups.pathways.length > 0) {
      html += renderSection('Percorsi Consigliati', groups.pathways, 'pathway');
    }

    // Sezione Specialità
    if (groups.specialties.length > 0) {
      html += renderSection('Specialità', groups.specialties, 'specialty');
    }

    // Sezione Prestazioni
    if (groups.procedures.length > 0) {
      html += renderSection('Prestazioni', groups.procedures, 'procedure');
    }

    // Sezione Esami di Laboratorio
    if (groups.tests.length > 0) {
      html += renderSection('Esami di Laboratorio', groups.tests, 'test');
    }

    // Sezione Medici
    if (groups.physicians.length > 0) {
      html += renderSection('I Nostri Specialisti', groups.physicians, 'physician');
    }

    // Sezione Check-up (in fondo, come suggerimento)
    if (groups.packs.length > 0) {
      html += renderSection('Check-up e Pacchetti', groups.packs, 'pack', true);
    }

    return html;
  }

  function renderSection(title, items, type, isSuggestion = false) {
    const suggestionClass = isSuggestion ? 'search-section--suggestion' : '';
    
    let html = `
      <div class="search-section ${suggestionClass}" data-section="${type}">
        <h3 class="search-section__title">
          ${isSuggestion ? '<span class="suggestion-badge">Potrebbe interessarti</span>' : ''}
          ${title}
        </h3>
        <ul class="search-section__list">
    `;

    items.forEach(item => {
      html += renderItem(item, type);
    });

    html += `
        </ul>
      </div>
    `;

    return html;
  }

  function renderItem(item, type) {
    const icons = {
      specialty: '🏥',
      procedure: '🩺',
      test: '🧪',
      pathway: '🎯',
      pack: '📦',
      physician: '👨‍⚕️'
    };

    const icon = item.icon || icons[type] || '📋';
    const url = item.pageUrl || item.url || '#';
    const subtitle = getSubtitle(item, type);

    return `
      <li class="search-item search-item--${type}">
        <a href="${url}" class="search-item__link">
          <span class="search-item__icon">${icon}</span>
          <div class="search-item__content">
            <span class="search-item__name">${item.name || item.fullName}</span>
            ${subtitle ? `<span class="search-item__subtitle">${subtitle}</span>` : ''}
          </div>
          <span class="search-item__cta">${getCTA(type)}</span>
        </a>
      </li>
    `;
  }

  function getSubtitle(item, type) {
    switch (type) {
      case 'physician':
        return item.jobTitle || '';
      case 'procedure':
        return item.duration ? `Durata: ~${item.duration} min` : '';
      case 'test':
        return item.turnaround ? `Referto: ${item.turnaround}` : '';
      case 'pathway':
        return item.description || '';
      case 'pack':
        return item.targetPatient || '';
      default:
        return '';
    }
  }

  function getCTA(type) {
    switch (type) {
      case 'specialty':
      case 'pathway':
        return 'Scopri →';
      case 'procedure':
      case 'pack':
        return 'Prenota →';
      case 'physician':
        return 'Profilo →';
      case 'test':
        return 'Dettagli →';
      default:
        return 'Vedi →';
    }
  }

  function renderFallback(fallback) {
    let html = `
      <div class="search-fallback">
        <p class="search-fallback__message">${fallback.message}</p>
        <div class="search-fallback__suggestions">
    `;

    if (fallback.suggestions.specialty) {
      html += `
        <a href="${fallback.suggestions.specialty.pageUrl}" class="search-fallback__item">
          <span class="icon">🏥</span>
          <span>${fallback.suggestions.specialty.name}</span>
        </a>
      `;
    }

    fallback.suggestions.pathways?.forEach(pw => {
      html += `
        <a href="${pw.pageUrl}" class="search-fallback__item">
          <span class="icon">🎯</span>
          <span>${pw.nameShort || pw.name}</span>
        </a>
      `;
    });

    if (fallback.suggestions.pack) {
      html += `
        <a href="${fallback.suggestions.pack.pageUrl}" class="search-fallback__item">
          <span class="icon">📦</span>
          <span>${fallback.suggestions.pack.name}</span>
        </a>
      `;
    }

    html += `
        </div>
        <p class="search-fallback__contact">${fallback.contactPrompt}</p>
      </div>
    `;

    return html;
  }

  // =============================================
  // ANALYTICS
  // =============================================

  function trackSearch(query, result) {
    if (typeof gtag === 'function') {
      gtag('event', 'search', {
        search_term: query,
        results_count: result.totalCount,
        intent: result.intent || 'unknown',
        has_results: result.totalCount > 0
      });
    }

    // Log interno per debugging
    console.log('[UnifiedSearch] Query:', query, '| Results:', result.totalCount, '| Intent:', result.intent);
  }

  // =============================================
  // INIZIALIZZAZIONE
  // =============================================

  let isInitialized = false;

  async function init() {
    if (isInitialized) return true;
    
    console.log('[UnifiedSearch] Initializing...');
    const loaded = await loadData();
    
    if (loaded) {
      isInitialized = true;
      console.log('[UnifiedSearch] Ready!');
    }
    
    return loaded;
  }

  // =============================================
  // API PUBBLICA
  // =============================================

  return {
    init,
    search,
    autocomplete,
    normalizeQuery,
    renderResults,
    
    // Per debug/testing
    getIndex: () => UNIFIED_INDEX,
    getSynonyms: () => SYNONYMS,
    clearCache: () => SEARCH_CACHE.clear(),
    
    // Configurazione
    setConfig: (newConfig) => Object.assign(CONFIG, newConfig)
  };

})();

// Auto-init quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BioClinicUnifiedSearch.init());
} else {
  BioClinicUnifiedSearch.init();
}

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BioClinicUnifiedSearch;
}
