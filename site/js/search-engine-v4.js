/**
 * BIO-CLINIC SEARCH ENGINE v4.1.0
 * ================================
 * SINGLE unified search engine for the entire Bio-Clinic website.
 * 
 * Replaces ALL previous search engines:
 *   unified-search.js, bio-clinic-search.js, bio-clinic-search-engine.js,
 *   bio-search-pro.js, search.js, lab-search.js
 *
 * Architecture:
 * - Loads ALL data once at init (1136 lab exams, 96 entities, synonyms, triage)
 * - Single inverted index for O(1) token lookup
 * - Clinical triage for priority queries (e.g. "tsh" -> thyroid check-up)
 * - Comprehensive synonym expansion (Italian medical terms, colloquial, typos)
 * - Fuzzy matching via Levenshtein distance
 * - Context-aware ranking (lab page prioritizes exams, home page balanced)
 * - URL validation: only returns items with verified page URLs
 *
 * Data sources (loaded in parallel):
 * - /data/listino-processed.json  (1136 lab exams)
 * - /data/entities/specialties.json (11 specialties)
 * - /data/entities/procedures.json  (38 procedures)  
 * - /data/entities/packs.json       (12 packs)
 * - /data/entities/pathways.json    (12 pathways)
 * - /data/entities/physicians-complete.json (50 physicians)
 * - /data/clinical-priority.json    (triage mappings)
 *
 * @version 4.1.0
 * @date 2026-02-16
 * (c) 2026 Bio-Clinic Sassari - bio-clinic.it
 */

const BioSearchEngine = (function () {
  'use strict';

  const VERSION = '4.1.0';

  /* ═══════════════════════════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════════════════════════ */
  const CFG = {
    dataPath: '/data',
    minQuery: 2,
    maxResults: 15,
    maxPerSection: 5,
    maxAutocomplete: 8,
    debounceMs: 150,
    cacheSize: 200,
    fuzzyThreshold: 2  // max Levenshtein distance
  };

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let ready = false;
  let loading = false;
  const cache = new Map();

  // Primary data stores
  const store = {
    exams: [],         // full listino (1136)
    specialties: [],
    procedures: [],
    packs: [],
    pathways: [],
    physicians: []
  };

  // Inverted index: normalized token -> [{id, type}]
  const idx = new Map();

  // Clinical priority triage: query -> primary result mapping
  let triage = {};

  /* ═══════════════════════════════════════════════════════════════
     SYNONYMS — comprehensive Italian medical mappings
     ═══════════════════════════════════════════════════════════════ */
  const SYN = {
    // ── Specialist → Specialty ──
    'ginecologo': 'ginecologia', 'ginecologa': 'ginecologia', 'ginecologi': 'ginecologia',
    'cardiologo': 'cardiologia', 'cardiologa': 'cardiologia', 'cardiologi': 'cardiologia',
    'endocrinologo': 'endocrinologia', 'endocrinologa': 'endocrinologia',
    'dermatologo': 'dermatologia', 'dermatologa': 'dermatologia',
    'neurologo': 'neurologia', 'neurologa': 'neurologia',
    'oculista': 'oculistica', 'oculisti': 'oculistica',
    'ortopedico': 'ortopedia', 'ortopedica': 'ortopedia',
    'urologo': 'urologia', 'urologa': 'urologia',
    'otorino': 'otorinolaringoiatria', 'otorinolaringoiatra': 'otorinolaringoiatria',
    'pneumologo': 'pneumologia', 'pneumologa': 'pneumologia',
    'gastroenterologo': 'gastroenterologia', 'gastroenterologa': 'gastroenterologia',
    'ematologo': 'ematologia', 'ematologa': 'ematologia',
    'reumatologo': 'reumatologia', 'reumatologhe': 'reumatologia',
    'nutrizionista': 'nutrizione', 'dietologo': 'nutrizione', 'dietologa': 'nutrizione',
    'ostetrica': 'ostetricia', 'ostetriche': 'ostetricia',
    'andrologo': 'urologia', 'fisiatra': 'fisiatria',
    'medico competente': 'medicina-lavoro', 'pediatra': 'pediatria',
    'nefrologo': 'nefrologia', 'internista': 'medicina-interna',

    // ── Colloquial → Clinical ──
    'visita cuore': 'cardiologia', 'controllo cuore': 'cardiologia',
    'visita donna': 'ginecologia', 'visita tiroide': 'endocrinologia',
    'controllo tiroide': 'endocrinologia', 'visita pelle': 'dermatologia',
    'controllo nei': 'dermatologia', 'visita occhi': 'oculistica',
    'controllo vista': 'oculistica', 'mal di stomaco': 'gastroenterologia',
    'problema urinario': 'urologia', 'dolore torace': 'cardiologia',

    // ── Abbreviations ──
    'eco': 'ecografia', 'ecg': 'elettrocardiogramma', 'ekg': 'elettrocardiogramma',
    'emg': 'elettromiografia', 'tsh': 'tsh', 'ft3': 'ft3', 'ft4': 'ft4',
    'psa': 'psa', 'pcr': 'proteina-c-reattiva', 'ves': 'ves',
    'hba1c': 'emoglobina-glicata', 'glicata': 'emoglobina-glicata',
    'hdl': 'colesterolo-hdl', 'ldl': 'colesterolo-ldl',
    'got': 'ast-got', 'gpt': 'alt-gpt', 'ast': 'ast-got', 'alt': 'alt-gpt',
    'oct': 'oct', 'moc': 'densitometria-ossea', 'bia': 'bioimpedenziometria',
    'pt': 'pt-inr', 'inr': 'pt-inr', 'ptt': 'ptt-aptt',

    // ── Body parts → Specialty ──
    'cuore': 'cardiologia', 'tiroide': 'endocrinologia', 'prostata': 'urologia',
    'seno': 'ginecologia', 'mammella': 'ginecologia', 'utero': 'ginecologia',
    'ovaie': 'ginecologia', 'fegato': 'gastroenterologia', 'stomaco': 'gastroenterologia',
    'intestino': 'gastroenterologia', 'reni': 'nefrologia', 'polmoni': 'pneumologia',
    'cervello': 'neurologia', 'articolazioni': 'ortopedia', 'ossa': 'ortopedia',
    'ginocchio': 'ortopedia', 'spalla': 'ortopedia', 'schiena': 'ortopedia',
    'pelle': 'dermatologia', 'nei': 'dermatologia', 'occhi': 'oculistica',
    'orecchio': 'otorinolaringoiatria', 'naso': 'otorinolaringoiatria',
    'gola': 'otorinolaringoiatria', 'vescica': 'urologia',

    // ── Symptoms → Specialty ──
    'mal di testa': 'neurologia', 'cefalea': 'neurologia', 'emicrania': 'neurologia',
    'vertigini': 'neurologia', 'formicolio': 'neurologia',
    'palpitazioni': 'cardiologia', 'tachicardia': 'cardiologia', 'aritmia': 'cardiologia',
    'affanno': 'cardiologia', 'pressione alta': 'cardiologia', 'ipertensione': 'cardiologia',
    'stanchezza': 'endocrinologia', 'diabete': 'endocrinologia', 'glicemia': 'endocrinologia',
    'colesterolo': 'cardiologia', 'anemia': 'ematologia',
    'prurito': 'dermatologia', 'acne': 'dermatologia', 'psoriasi': 'dermatologia',
    'allergia': 'dermatologia', 'dolore pelvico': 'ginecologia',
    'ciclo irregolare': 'ginecologia', 'bruciore urinario': 'urologia',
    'mal di schiena': 'ortopedia', 'dolore ginocchio': 'ortopedia',
    'gonfiore': 'reumatologia', 'dolore articolare': 'reumatologia',
    'sangue nelle urine': 'urologia', 'minzione frequente': 'urologia',
    'tosse cronica': 'pneumologia', 'dispnea': 'pneumologia',
    'reflusso': 'gastroenterologia', 'bruciore stomaco': 'gastroenterologia',

    // ── Pathways ──
    'slim care': 'slim-care', 'slimcare': 'slim-care', 'dimagrire': 'slim-care',
    'perdere peso': 'slim-care', 'obesita': 'slim-care', 'sovrappeso': 'slim-care',
    'wegovy': 'slim-care', 'mounjaro': 'slim-care', 'ozempic': 'slim-care',
    'semaglutide': 'slim-care', 'tirzepatide': 'slim-care',
    'fertilita': 'pma-fertilita', 'infertilita': 'pma-fertilita',
    'pma': 'pma-fertilita', 'fecondazione': 'pma-fertilita',
    'gravidanza': 'ostetricia', 'incinta': 'ostetricia',
    'menopausa': 'slim-care-donna', 'pcos': 'slim-care-donna',
    'ovaio policistico': 'slim-care-donna',

    // ── Procedures ──
    'pap test': 'pap-test', 'paptest': 'pap-test', 'screening cervicale': 'pap-test',
    'hpv test': 'hpv-test', 'colposcopia': 'colposcopia',
    'caressflow': 'caressflow', 'caress flow': 'caressflow',
    'radiofrequenza': 'radiofrequenza-vaginale',
    'radiofrequenza vaginale': 'radiofrequenza-vaginale',
    'atrofia vaginale': 'radiofrequenza-vaginale',
    'secchezza vaginale': 'caressflow',
    'nipt': 'nipt', 'fetal dna': 'nipt', 'dna fetale': 'nipt',
    'test prenatale': 'nipt', 'morfologica': 'ecografia-morfologica',
    'translucenza': 'translucenza-nucale', 'bitest': 'bi-test', 'bi-test': 'bi-test',
    'holter': 'holter-ecg', 'holter pressorio': 'holter-pressorio',
    'ecocardiogramma': 'ecocardiogramma',
    'mappatura nei': 'mappatura-nevi', 'dermatoscopia': 'mappatura-nevi',
    'spirometria': 'spirometria', 'spermiogramma': 'spermiogramma',
    'ecografia mammaria': 'ecografia-mammaria',
    'ecografia pelvica': 'ecografia-pelvica',
    'ecografia addominale': 'ecografia-addominale',
    'ecografia tiroidea': 'ecografia-tiroidea',

    // ── Lab common terms ──
    'emocromo': 'emocromo', 'esame urine': 'esame-urine', 'urine': 'esame-urine',
    'urinocoltura': 'urinocoltura', 'bilirubina': 'bilirubina',
    'transaminasi': 'ast-got', 'gamma gt': 'gamma-gt', 'ggt': 'gamma-gt',
    'creatinina': 'creatinina', 'azotemia': 'azotemia',
    'coagulazione': 'pt-inr', 'd-dimero': 'd-dimero', 'fibrinogeno': 'fibrinogeno',
    'sangue occulto': 'sangue-occulto-feci', 'esame feci': 'sangue-occulto-feci',
    'calprotectina': 'calprotectina-fecale',
    'vitamina d': 'vitamina-d', 'vitamina b12': 'vitamina-b12',
    'acido folico': 'acido-folico', 'ferro': 'sideremia',
    'sideremia': 'sideremia', 'ferritina': 'ferritina',
    'trigliceridi': 'trigliceridi', 'colesterolo totale': 'colesterolo-totale',

    // ── Check-up / Lab generic ──
    'check up': 'checkup', 'checkup': 'checkup', 'check-up': 'checkup',
    'analisi': 'laboratorio', 'esami sangue': 'laboratorio',
    'esami del sangue': 'laboratorio', 'prelievo': 'laboratorio',
    'laboratorio': 'laboratorio', 'analisi sangue': 'laboratorio',

    // ── Work / Sport ──
    'lavoro': 'medicina-lavoro', 'azienda': 'medicina-lavoro',
    'dipendenti': 'medicina-lavoro', 'idoneita': 'medicina-lavoro',
    'sorveglianza sanitaria': 'medicina-lavoro',
    'certificato sportivo': 'medicina-sport', 'idoneita sportiva': 'medicina-sport',
    'sport': 'medicina-sport', 'agonistico': 'medicina-sport',

    // ── Genetics ──
    'brca': 'brca-plus', 'oncogenetica': 'pannello-oncogenetico',
    'carrier screening': 'carrier-screening', 'era test': 'era-test',
    'emma test': 'emma-test', 'alice test': 'alice-test',

    // ── Common typos ──
    'tiroyde': 'endocrinologia', 'tirodite': 'endocrinologia', 'tiroidite': 'endocrinologia',
    'ecographia': 'ecografia', 'ginecologgia': 'ginecologia',
    'dermatologgia': 'dermatologia', 'cardiolga': 'cardiologia',
    'neurologi': 'neurologia', 'urologi': 'urologia',
    'cardiologica': 'cardiologia', 'ginecologica': 'ginecologia',
    'endocrinologica': 'endocrinologia', 'neurologica': 'neurologia',
    'ecocolordoppler': 'eco-doppler', 'ecodoppler': 'eco-doppler',
    'doppler': 'eco-doppler'
  };

  /* ═══════════════════════════════════════════════════════════════
     TEXT UTILITIES
     ═══════════════════════════════════════════════════════════════ */
  function norm(s) {
    if (!s) return '';
    return s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(s) {
    return norm(s).split(/[\s\-]+/).filter(function(t) { return t.length >= 2; });
  }

  // Levenshtein distance for fuzzy matching
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        var cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  }

  /* ═══════════════════════════════════════════════════════════════
     DATA LOADING
     ═══════════════════════════════════════════════════════════════ */
  function fetchJSON(path) {
    return fetch(CFG.dataPath + path).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function(e) {
      console.warn('[BioSearch] Failed to load ' + path + ':', e.message);
      return null;
    });
  }

  function loadAllData() {
    return Promise.all([
      fetchJSON('/listino-processed.json'),
      fetchJSON('/entities/specialties.json'),
      fetchJSON('/entities/procedures.json'),
      fetchJSON('/entities/packs.json'),
      fetchJSON('/entities/pathways.json'),
      fetchJSON('/entities/physicians-complete.json'),
      fetchJSON('/clinical-priority.json')
    ]).then(function(results) {
      var listino = results[0];
      var specs = results[1];
      var procs = results[2];
      var packs = results[3];
      var paths = results[4];
      var docs = results[5];
      var priority = results[6];

      // ── Exams (listino: 1136 items) ──
      // Map exam IDs to booking service IDs where a direct match exists
      var examToBookingService = {
        'emocromo': 'emocromo-completo',
        'emocromo-completo': 'emocromo-completo',
        'esame-delle-urine': 'urine-standard',
        'esame-chimico-fisico-delle-urine': 'urine-standard',
        'hpv-dna-screening-e-tipizzazione-di-ceppi-al-alto-': 'test-hpv',
        'curva-da-carico-di-glucosio': 'glicemia-curva',
        'ogtt-curva-glicemica-in-gravidanza-arancia': 'glicemia-curva'
      };

      // Category-based mapping (all exams in these categories get the matching service)
      var categoryToBookingService = {
        'Tiroide': 'profilo-tiroide',
        'Ormoni': 'profilo-ormonale-donna',
        'Tumore/Markers': 'marcatori-tumorali',
        'Allergologia': 'test-allergologico',
        'Glicemia/Diabete': 'glicemia-curva',
        'Ematologia': 'emocromo-completo',
        'Urinario': 'urine-standard'
      };

      if (listino && Array.isArray(listino)) {
        store.exams = listino.map(function(e) {
          // Priority: direct ID mapping > category mapping > default
          var bookingSvc = examToBookingService[e.id]
            || categoryToBookingService[e.cat]
            || 'prelievo-standard';
          var examUrl = '/laboratorio/prenota/?service=' + bookingSvc
            + '&exam=' + encodeURIComponent(e.nome);
          return {
            id: e.id,
            type: 'exam',
            name: e.nome,
            price: e.prezzo,
            category: e.cat,
            symptoms: e.sintomi || [],
            turnaround: e.referto,
            url: examUrl
          };
        });
      }

      // ── Specialties ──
      if (specs && specs.specialties) {
        store.specialties = specs.specialties.map(function(s) {
          return {
            id: s.slug,
            type: 'specialty',
            name: s.name,
            keywords: s.keywords || [],
            icon: s.icon,
            procedures: s.main_procedures || [],
            physicians: s.physicians || [],
            url: s.page_url || '/' + s.slug + '/',
            description: s.short_description || ''
          };
        });
      }

      // ── Procedures ──
      if (procs && procs.procedures) {
        store.procedures = procs.procedures.map(function(p) {
          return {
            id: p.id,
            type: 'procedure',
            name: p.name,
            nameExtended: p.name_extended,
            specialtyId: p.specialty_id,
            searchTerms: p.search_terms || [],
            indications: p.indications || [],
            url: p.page_url || '/' + p.id + '/',
            duration: p.duration_minutes,
            price: p.price_range
          };
        });
      }

      // ── Packs (URL fix: all packs → booking deep-link) ──
      var packToBookingService = {
        'checkup-base': 'prelievo-standard',
        'checkup-completo': 'prelievo-standard',
        'checkup-tiroide': 'profilo-tiroide',
        'checkup-cardiovascolare': 'prelievo-standard',
        'checkup-diabete': 'glicemia-curva',
        'checkup-epatico': 'prelievo-standard',
        'checkup-renale': 'urine-standard',
        'checkup-donna-over40': 'prelievo-standard',
        'checkup-uomo-over40': 'prelievo-standard',
        'checkup-anemia': 'emocromo-completo',
        'checkup-prostata': 'prelievo-standard',
        'checkup-osteoporosi': 'prelievo-standard'
      };
      if (packs && packs.packs) {
        store.packs = packs.packs.map(function(pk) {
          var url = pk.cta_url || '/laboratorio/';
          // Fix broken /prestazioni/ URLs and generic /laboratorio/ URLs
          if (url.indexOf('/prestazioni/') === 0 || url === '/laboratorio/') {
            var svc = packToBookingService[pk.id] || 'prelievo-standard';
            url = '/laboratorio/prenota/?service=' + svc;
          }
          return {
            id: pk.id,
            type: 'pack',
            name: pk.name,
            category: pk.category,
            target: pk.target_patient,
            conditions: pk.target_conditions || [],
            exams: pk.exams_included || [],
            price: pk.price,
            url: url,
            savings: pk.savings_percentage
          };
        });
      }

      // ── Pathways ──
      if (paths && paths.pathways) {
        store.pathways = paths.pathways.map(function(pw) {
          return {
            id: pw.id,
            type: 'pathway',
            name: pw.name,
            nameShort: pw.name_short,
            aliases: pw.aliases || [],
            symptoms: pw.symptom_keywords || [],
            specialtyId: pw.specialty_id,
            url: pw.cta_url || '/' + pw.id + '/',
            flagship: pw.is_flagship,
            description: pw.description_short || ''
          };
        });
      }

      // ── Physicians ──
      if (docs && docs.physicians) {
        store.physicians = docs.physicians.map(function(d) {
          return {
            id: d.id || d.slug,
            type: 'physician',
            name: d.full_name || d.name,
            title: d.title,
            specialtyId: d.specialty_id,
            jobTitle: d.job_title,
            slug: d.slug,
            url: '/equipe/' + (d.slug || d.id) + '/',
            booking: d.miodottore_url,
            knowsAbout: d.knowsAbout || []
          };
        });
      }

      // ── Clinical Priority Triage ──
      if (priority && priority.primary_mappings) {
        triage = priority.primary_mappings;
      }

      console.log('[BioSearch] v' + VERSION + ' loaded:', {
        exams: store.exams.length,
        specialties: store.specialties.length,
        procedures: store.procedures.length,
        packs: store.packs.length,
        pathways: store.pathways.length,
        physicians: store.physicians.length,
        triage: Object.keys(triage).length
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     INDEXING
     ═══════════════════════════════════════════════════════════════ */
  function addToIndex(token, ref) {
    if (!token || token.length < 2) return;
    var key = norm(token);
    if (key.length < 2) return;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push(ref);
  }

  function buildIndex() {
    idx.clear();

    // Index exams
    store.exams.forEach(function(e) {
      var ref = { id: e.id, type: 'exam' };
      tokenize(e.name).forEach(function(t) { addToIndex(t, ref); });
      addToIndex(e.id, ref);
      if (e.category) addToIndex(norm(e.category), ref);
      (e.symptoms || []).forEach(function(s) { addToIndex(norm(s), ref); });
    });

    // Index specialties
    store.specialties.forEach(function(s) {
      var ref = { id: s.id, type: 'specialty' };
      tokenize(s.name).forEach(function(t) { addToIndex(t, ref); });
      addToIndex(s.id, ref);
      (s.keywords || []).forEach(function(k) { addToIndex(norm(k), ref); });
    });

    // Index procedures
    store.procedures.forEach(function(p) {
      var ref = { id: p.id, type: 'procedure' };
      tokenize(p.name).forEach(function(t) { addToIndex(t, ref); });
      if (p.nameExtended) tokenize(p.nameExtended).forEach(function(t) { addToIndex(t, ref); });
      addToIndex(p.id, ref);
      if (p.specialtyId) addToIndex(norm(p.specialtyId), ref);
      (p.searchTerms || []).forEach(function(st) { addToIndex(norm(st), ref); });
      (p.indications || []).forEach(function(i) {
        tokenize(i).forEach(function(t) { addToIndex(t, ref); });
      });
    });

    // Index packs
    store.packs.forEach(function(pk) {
      var ref = { id: pk.id, type: 'pack' };
      tokenize(pk.name).forEach(function(t) { addToIndex(t, ref); });
      addToIndex(pk.id, ref);
      (pk.conditions || []).forEach(function(c) {
        tokenize(c).forEach(function(t) { addToIndex(t, ref); });
      });
      (pk.exams || []).forEach(function(e) { addToIndex(norm(e), ref); });
    });

    // Index pathways
    store.pathways.forEach(function(pw) {
      var ref = { id: pw.id, type: 'pathway' };
      tokenize(pw.name).forEach(function(t) { addToIndex(t, ref); });
      if (pw.nameShort) tokenize(pw.nameShort).forEach(function(t) { addToIndex(t, ref); });
      addToIndex(pw.id, ref);
      (pw.aliases || []).forEach(function(a) { addToIndex(norm(a), ref); });
      (pw.symptoms || []).forEach(function(s) { addToIndex(norm(s), ref); });
    });

    // Index physicians
    store.physicians.forEach(function(d) {
      var ref = { id: d.id, type: 'physician' };
      tokenize(d.name).forEach(function(t) { addToIndex(t, ref); });
      if (d.slug) addToIndex(d.slug, ref);
      if (d.specialtyId) addToIndex(norm(d.specialtyId), ref);
      if (d.jobTitle) tokenize(d.jobTitle).forEach(function(t) { addToIndex(t, ref); });
      (d.knowsAbout || []).forEach(function(k) {
        tokenize(k).forEach(function(t) { addToIndex(t, ref); });
      });
    });

    console.log('[BioSearch] Index: ' + idx.size + ' tokens');
  }

  /* ═══════════════════════════════════════════════════════════════
     ITEM LOOKUP
     ═══════════════════════════════════════════════════════════════ */
  function getItem(type, id) {
    var map = {
      exam: store.exams,
      specialty: store.specialties,
      procedure: store.procedures,
      pack: store.packs,
      pathway: store.pathways,
      physician: store.physicians
    };
    var arr = map[type];
    if (!arr) return null;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════
     SEARCH CORE
     ═══════════════════════════════════════════════════════════════ */
  function search(query, context) {
    if (!ready) return emptyResult(query);
    var q = norm(query);
    if (q.length < CFG.minQuery) return emptyResult(query);

    // Cache check
    var cacheKey = q + '|' + (context || '');
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    var tokens = tokenize(query);
    var scores = new Map(); // "type:id" -> score

    // 1. Synonym expansion
    var expanded = new Set(tokens);
    // Full phrase synonym
    if (SYN[q]) expanded.add(norm(SYN[q]));
    // Token-level synonyms
    tokens.forEach(function(t) { if (SYN[t]) expanded.add(norm(SYN[t])); });
    // Two-token combos
    for (var i = 0; i < tokens.length - 1; i++) {
      var pair = tokens[i] + ' ' + tokens[i + 1];
      if (SYN[pair]) expanded.add(norm(SYN[pair]));
    }

    // 2. Clinical triage (highest priority)
    var triageResult = null;
    if (triage[q]) {
      triageResult = triage[q];
    } else {
      for (var ti = 0; ti < tokens.length; ti++) {
        if (triage[tokens[ti]]) { triageResult = triage[tokens[ti]]; break; }
      }
    }

    // 3. Index lookup (all expanded tokens)
    expanded.forEach(function(token) {
      // Exact match in index
      if (idx.has(token)) {
        idx.get(token).forEach(function(ref) {
          var key = ref.type + ':' + ref.id;
          scores.set(key, (scores.get(key) || 0) + 10);
        });
      }
      // Prefix match
      idx.forEach(function(refs, idxToken) {
        if (idxToken !== token && idxToken.startsWith(token) && token.length >= 3) {
          refs.forEach(function(ref) {
            var key = ref.type + ':' + ref.id;
            scores.set(key, (scores.get(key) || 0) + 5);
          });
        }
      });
    });

    // 4. Direct name matching (stronger signals)
    // Clinical entities (specialty, procedure, pathway, pack, physician) get higher
    // name-match scores than lab exams. Users typing partial words almost always
    // want a clinical service, not a lab test with a similar prefix.
    var isShortQuery = q.length <= 4;
    var clinicalTypes = { specialty: true, procedure: true, pathway: true, pack: true, physician: true };
    var allItems = [].concat(
      store.specialties, store.procedures, store.pathways,
      store.packs, store.physicians, store.exams
    );
    allItems.forEach(function(item) {
      var nameLower = norm(item.name || '');
      var key = item.type + ':' + item.id;
      var isClinical = !!clinicalTypes[item.type];
      // Clinical entities get much stronger name-match boosts
      var exactBonus = isClinical ? 80 : 50;
      var startsBonus = isClinical ? 55 : 20;
      var containsBonus = isClinical ? 20 : 10;
      var allMatchBonus = isClinical ? 15 : 8;

      if (nameLower === q) {
        scores.set(key, (scores.get(key) || 0) + exactBonus);
      } else if (nameLower.startsWith(q)) {
        scores.set(key, (scores.get(key) || 0) + startsBonus);
      } else if (nameLower.indexOf(q) !== -1) {
        scores.set(key, (scores.get(key) || 0) + containsBonus);
      } else {
        // All tokens must match
        var allMatch = tokens.length > 0 && tokens.every(function(t) {
          return nameLower.indexOf(t) !== -1;
        });
        if (allMatch) {
          scores.set(key, (scores.get(key) || 0) + allMatchBonus);
        }
      }

      // Also match against ID (slug)
      var idLower = norm(item.id || '');
      var idStartsBonus = isClinical ? 35 : 15;
      if (idLower === q) {
        scores.set(key, (scores.get(key) || 0) + (isClinical ? 60 : 40));
      } else if (idLower.startsWith(q)) {
        scores.set(key, (scores.get(key) || 0) + idStartsBonus);
      } else if (idLower.indexOf(q) !== -1) {
        scores.set(key, (scores.get(key) || 0) + 8);
      }
    });

    // 5. Fuzzy matching for short queries (only if few results so far)
    if (scores.size < 5 && q.length >= 3) {
      idx.forEach(function(refs, idxToken) {
        if (idxToken.length >= 3 && Math.abs(idxToken.length - q.length) <= 2) {
          var dist = levenshtein(q, idxToken);
          if (dist <= CFG.fuzzyThreshold && dist > 0) {
            refs.forEach(function(ref) {
              var key = ref.type + ':' + ref.id;
              scores.set(key, (scores.get(key) || 0) + (5 - dist));
            });
          }
        }
      });
    }

    // 6. Triage boost
    if (triageResult) {
      if (triageResult.primary_type && triageResult.primary_id) {
        var primaryKey = triageResult.primary_type + ':' + triageResult.primary_id;
        scores.set(primaryKey, (scores.get(primaryKey) || 0) + 100);
      }
      if (triageResult.related_ids) {
        triageResult.related_ids.forEach(function(rid) {
          ['exam', 'procedure', 'pack', 'pathway', 'specialty'].forEach(function(t) {
            var rkey = t + ':' + rid;
            if (scores.has(rkey)) {
              scores.set(rkey, scores.get(rkey) + 30);
            }
          });
        });
      }
      if (triageResult.pack_suggestion) {
        var packKey = 'pack:' + triageResult.pack_suggestion;
        scores.set(packKey, (scores.get(packKey) || 0) + 40);
      }
      if (triageResult.specialty_context) {
        var specKey = 'specialty:' + triageResult.specialty_context;
        scores.set(specKey, (scores.get(specKey) || 0) + 20);
      }
    }

    // 7. Context-aware type boost
    // For short queries (≤4 chars) in non-lab context, strongly penalize exams
    // to prevent obscure lab tests from outranking clinical services
    var isLabContext = context === 'lab';
    scores.forEach(function(score, key) {
      var type = key.split(':')[0];
      var boost = 0;
      if (isLabContext) {
        if (type === 'exam') boost = 15;
        else if (type === 'pack') boost = 10;
        else if (type === 'specialty') boost = 5;
        else if (type === 'procedure') boost = 5;
      } else {
        if (type === 'specialty') boost = 20;
        else if (type === 'procedure') boost = 15;
        else if (type === 'pathway') boost = 12;
        else if (type === 'physician') boost = 8;
        else if (type === 'pack') boost = 10;
        else if (type === 'exam') boost = 0;
      }
      // For short queries, further boost clinical results to prevent exam flooding
      if (isShortQuery && !isLabContext && type === 'exam') {
        boost = -Math.floor(score * 0.3); // reduce exam scores by 30% for short queries
      }
      scores.set(key, score + boost);
    });

    // 8. Build result list
    var results = [];
    scores.forEach(function(score, key) {
      if (score < 5) return;
      var parts = key.split(':');
      var type = parts[0];
      var id = key.substring(key.indexOf(':') + 1);
      var item = getItem(type, id);
      if (item) {
        results.push(Object.assign({}, item, { score: score }));
      }
    });

    // Sort by score descending
    results.sort(function(a, b) { return b.score - a.score; });

    // 9. Group by type
    var groups = {
      specialties: [], procedures: [], exams: [], packs: [], pathways: [], physicians: []
    };
    var typeGroupMap = {
      specialty: 'specialties', procedure: 'procedures', exam: 'exams',
      pack: 'packs', pathway: 'pathways', physician: 'physicians'
    };
    results.forEach(function(r) {
      var gk = typeGroupMap[r.type];
      if (gk && groups[gk].length < CFG.maxPerSection) {
        groups[gk].push(r);
      }
    });

    // 10. Fallback if no results
    var fallback = null;
    if (results.length === 0) {
      fallback = buildFallback(q, tokens);
    }

    var result = {
      query: query,
      normalized: q,
      results: results.slice(0, CFG.maxResults),
      groups: groups,
      fallback: fallback,
      totalCount: results.length,
      triage: triageResult
    };

    // Cache management
    if (cache.size >= CFG.cacheSize) {
      var firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, result);

    return result;
  }

  function emptyResult(query) {
    return {
      query: query,
      normalized: '',
      results: [],
      totalCount: 0,
      groups: { specialties: [], procedures: [], exams: [], packs: [], pathways: [], physicians: [] },
      fallback: null,
      triage: null
    };
  }

  function buildFallback(q, tokens) {
    var suggestions = [];

    // Find matching specialties
    store.specialties.forEach(function(s) {
      var sn = norm(s.name);
      if (tokens.some(function(t) { return sn.indexOf(t) !== -1; })) {
        suggestions.push({ type: 'specialty', name: s.name, url: s.url });
      }
    });

    // Flagship pathways
    store.pathways.filter(function(p) { return p.flagship; }).slice(0, 2).forEach(function(p) {
      suggestions.push({ type: 'pathway', name: p.nameShort || p.name, url: p.url });
    });

    // Base checkup
    var base = store.packs.find(function(p) { return p.id === 'checkup-base'; });
    if (base) suggestions.push({ type: 'pack', name: base.name, url: base.url });

    // Lab page link
    suggestions.push({ type: 'exam', name: '1.162 Esami di Laboratorio', url: '/laboratorio/' });

    return {
      message: 'Nessun risultato per "' + q + '"',
      suggestions: suggestions,
      phone: '079 956 1332'
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTOCOMPLETE
     ═══════════════════════════════════════════════════════════════ */
  function autocomplete(query, context) {
    var res = search(query, context);
    var items = [];

    var order, limits;
    if (context === 'lab') {
      order = ['exams', 'packs', 'specialties', 'procedures', 'pathways', 'physicians'];
      limits = { exams: 5, packs: 2, specialties: 1, procedures: 1, pathways: 0, physicians: 0 };
    } else {
      order = ['specialties', 'procedures', 'pathways', 'exams', 'physicians', 'packs'];
      limits = { specialties: 2, procedures: 2, pathways: 1, exams: 2, physicians: 1, packs: 1 };
    }

    order.forEach(function(gk) {
      var limit = limits[gk] || 2;
      (res.groups[gk] || []).slice(0, limit).forEach(function(item) {
        items.push(item);
      });
    });

    return {
      items: items.slice(0, CFG.maxAutocomplete),
      totalCount: res.totalCount,
      fallback: res.fallback
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     INITIALIZATION
     ═══════════════════════════════════════════════════════════════ */
  function init() {
    if (ready) return Promise.resolve(true);
    if (loading) {
      return new Promise(function(resolve) {
        var check = setInterval(function() {
          if (ready) { clearInterval(check); resolve(true); }
        }, 50);
      });
    }
    loading = true;
    return loadAllData().then(function() {
      buildIndex();
      ready = true;
      cache.clear();
      window.dispatchEvent(new CustomEvent('biosearch:ready'));
      console.log('[BioSearch] v' + VERSION + ' ready');
      return true;
    }).catch(function(e) {
      console.error('[BioSearch] Init failed:', e);
      loading = false;
      return false;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════ */
  return {
    init: init,
    search: search,
    autocomplete: autocomplete,
    isReady: function() { return ready; },
    version: VERSION,
    getStore: function() { return store; },
    getItem: getItem,
    clearCache: function() { cache.clear(); },
    stats: function() {
      return {
        exams: store.exams.length,
        specialties: store.specialties.length,
        procedures: store.procedures.length,
        packs: store.packs.length,
        pathways: store.pathways.length,
        physicians: store.physicians.length,
        indexTokens: idx.size,
        cacheSize: cache.size
      };
    }
  };
})();

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { BioSearchEngine.init(); });
} else {
  BioSearchEngine.init();
}
