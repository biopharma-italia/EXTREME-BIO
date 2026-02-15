/**
 * BIO-CLINIC UNIFIED SEARCH ENGINE
 * =================================
 * Version: 2.0.0
 * Date: 2026-02-01
 * 
 * THE SINGLE SOURCE OF TRUTH for all search operations.
 * This engine is used by ALL search interfaces across the site.
 * 
 * Features:
 * - Single index for all entity types
 * - Unified synonym/alias normalization
 * - Clinical ranking with pack uplinking
 * - Never returns "no results" for valid terms
 * - Build-time validated coverage
 * 
 * © Bio-Clinic Sassari - bio-clinic.it
 */

const BioClinicSearchEngine = (function() {
  'use strict';

  // =============================================
  // CONFIGURATION
  // =============================================
  const CONFIG = {
    minQueryLength: 2,
    maxResults: 20,
    maxPerSection: 5,
    dataPath: '/data',
    version: '2.0.0'
  };

  // =============================================
  // STATE
  // =============================================
  let isInitialized = false;
  let isInitializing = false;
  
  // Unified index - single source of truth
  const INDEX = {
    specialties: new Map(),
    procedures: new Map(),
    tests: new Map(),
    packs: new Map(),
    pathways: new Map(),
    physicians: new Map()
  };

  // =============================================
  // SYNONYMS - COMPLETE NORMALIZATION MAP
  // =============================================
  const SYNONYMS = {
    // ===== SPECIALISTS → SPECIALTIES =====
    'ginecologo': { canonical: 'ginecologia', type: 'specialty' },
    'ginecologa': { canonical: 'ginecologia', type: 'specialty' },
    'ginecologi': { canonical: 'ginecologia', type: 'specialty' },
    'cardiologo': { canonical: 'cardiologia', type: 'specialty' },
    'cardiologi': { canonical: 'cardiologia', type: 'specialty' },
    'endocrinologo': { canonical: 'endocrinologia', type: 'specialty' },
    'endocrinologi': { canonical: 'endocrinologia', type: 'specialty' },
    'dermatologo': { canonical: 'dermatologia', type: 'specialty' },
    'dermatologi': { canonical: 'dermatologia', type: 'specialty' },
    'neurologo': { canonical: 'neurologia', type: 'specialty' },
    'oculista': { canonical: 'oculistica', type: 'specialty' },
    'ortopedico': { canonical: 'ortopedia', type: 'specialty' },
    'urologo': { canonical: 'urologia', type: 'specialty' },
    'otorino': { canonical: 'otorinolaringoiatria', type: 'specialty' },
    'nutrizionista': { canonical: 'nutrizione', type: 'specialty' },
    'dietologo': { canonical: 'nutrizione', type: 'specialty' },
    'nefrologo': { canonical: 'nefrologia', type: 'specialty' },

    // ===== COLLOQUIAL → CLINICAL =====
    'visita cuore': { canonical: 'cardiologia', type: 'specialty', procedure: 'visita-cardiologica' },
    'controllo cuore': { canonical: 'cardiologia', type: 'specialty', procedure: 'visita-cardiologica' },
    'visita donna': { canonical: 'ginecologia', type: 'specialty', procedure: 'visita-ginecologica' },
    'visita tiroide': { canonical: 'endocrinologia', type: 'specialty', procedure: 'visita-endocrinologica' },
    'controllo tiroide': { canonical: 'endocrinologia', type: 'specialty', test: 'tsh-ultrasensibile' },
    'visita pelle': { canonical: 'dermatologia', type: 'specialty', procedure: 'visita-dermatologica' },
    'controllo nei': { canonical: 'dermatologia', type: 'specialty', procedure: 'mappatura-nei' },

    // ===== LAB EXAM ABBREVIATIONS =====
    'tsh': { canonical: 'tsh-ultrasensibile', type: 'test', pack: 'checkup-tiroide' },
    'ft3': { canonical: 'ft3', type: 'test', pack: 'checkup-tiroide' },
    'ft4': { canonical: 'ft4', type: 'test', pack: 'checkup-tiroide' },
    'psa': { canonical: 'psa-totale', type: 'test', pack: 'checkup-uomo-over40' },
    'hba1c': { canonical: 'emoglobina-glicata', type: 'test', pack: 'checkup-diabete' },
    'glicata': { canonical: 'emoglobina-glicata', type: 'test', pack: 'checkup-diabete' },
    'got': { canonical: 'got-ast', type: 'test' },
    'gpt': { canonical: 'gpt-alt', type: 'test' },
    'ast': { canonical: 'got-ast', type: 'test' },
    'alt': { canonical: 'gpt-alt', type: 'test' },
    'ggt': { canonical: 'gamma-gt', type: 'test' },
    'gamma gt': { canonical: 'gamma-gt', type: 'test' },
    'ves': { canonical: 'ves', type: 'test' },
    'pcr': { canonical: 'proteina-c-reattiva', type: 'test' },
    'hcg': { canonical: 'beta-hcg', type: 'test' },
    'beta hcg': { canonical: 'beta-hcg', type: 'test' },
    'emocromo': { canonical: 'emocromo-completo', type: 'test', pack: 'checkup-base' },
    'esame sangue': { canonical: 'emocromo-completo', type: 'test' },
    'analisi sangue': { canonical: 'emocromo-completo', type: 'test' },
    'esame urine': { canonical: 'esame-urine-completo', type: 'test' },
    'urine': { canonical: 'esame-urine-completo', type: 'test' },
    'analisi urine': { canonical: 'esame-urine-completo', type: 'test' },
    
    // ===== GENETIC/PRENATAL =====
    'nipt': { canonical: 'nipt-fetal-dna-standard', type: 'test', specialty: 'ginecologia' },
    'fetal dna': { canonical: 'nipt-fetal-dna-standard', type: 'test' },
    'test prenatale': { canonical: 'nipt-fetal-dna-standard', type: 'test' },
    'screening prenatale': { canonical: 'nipt-fetal-dna-standard', type: 'test' },
    'dna fetale': { canonical: 'nipt-fetal-dna-standard', type: 'test' },
    
    // ===== PROCEDURES =====
    'colposcopia': { canonical: 'colposcopia', type: 'procedure', specialty: 'ginecologia' },
    'videocolposcopia': { canonical: 'colposcopia', type: 'procedure' },
    'pap test': { canonical: 'pap-test', type: 'procedure', specialty: 'ginecologia' },
    'paptest': { canonical: 'pap-test', type: 'procedure' },
    'ecg': { canonical: 'elettrocardiogramma', type: 'procedure' },
    'elettrocardiogramma': { canonical: 'elettrocardiogramma', type: 'procedure' },
    'ecocardiogramma': { canonical: 'ecocardiogramma', type: 'procedure' },
    'eco cuore': { canonical: 'ecocardiogramma', type: 'procedure' },
    'holter': { canonical: 'holter-ecg', type: 'procedure' },
    'holter pressorio': { canonical: 'holter-pressorio', type: 'procedure' },
    'eco tiroide': { canonical: 'ecografia-tiroidea', type: 'procedure' },
    'ecografia tiroide': { canonical: 'ecografia-tiroidea', type: 'procedure' },
    'eco transvaginale': { canonical: 'ecografia-transvaginale', type: 'procedure' },
    'ecografia transvaginale': { canonical: 'ecografia-transvaginale', type: 'procedure' },
    'eco mammaria': { canonical: 'ecografia-mammaria', type: 'procedure' },
    'ecografia seno': { canonical: 'ecografia-mammaria', type: 'procedure' },
    'isteroscopia': { canonical: 'isteroscopia', type: 'procedure', specialty: 'ginecologia' },
    'isterosalpingografia': { canonical: 'isterosalpingografia', type: 'procedure' },
    'hsg': { canonical: 'isterosalpingografia', type: 'procedure' },
    
    // ===== DEVICE THERAPIES (CRITICAL) =====
    'caressflow': { canonical: 'caressflow', type: 'procedure', specialty: 'ginecologia' },
    'caress flow': { canonical: 'caressflow', type: 'procedure' },
    'radiofrequenza': { canonical: 'radiofrequenza-vaginale', type: 'procedure', specialty: 'ginecologia' },
    'radiofrequenza vaginale': { canonical: 'radiofrequenza-vaginale', type: 'procedure' },
    'rf vaginale': { canonical: 'radiofrequenza-vaginale', type: 'procedure' },
    'secchezza vaginale': { canonical: 'caressflow', type: 'procedure', symptom: true },
    'atrofia vaginale': { canonical: 'radiofrequenza-vaginale', type: 'procedure', symptom: true },
    'lassità vaginale': { canonical: 'caressflow', type: 'procedure', symptom: true },
    
    // ===== PATHWAYS =====
    'slim care': { canonical: 'slim-care', type: 'pathway', specialty: 'endocrinologia' },
    'slimcare': { canonical: 'slim-care', type: 'pathway' },
    'dimagrire': { canonical: 'slim-care', type: 'pathway' },
    'perdere peso': { canonical: 'slim-care', type: 'pathway' },
    'obesità': { canonical: 'slim-care', type: 'pathway' },
    'sovrappeso': { canonical: 'slim-care', type: 'pathway' },
    'wegovy': { canonical: 'slim-care', type: 'pathway' },
    'ozempic': { canonical: 'slim-care', type: 'pathway' },
    'pma': { canonical: 'pma-fertilita', type: 'pathway', specialty: 'ginecologia' },
    'fertilità': { canonical: 'pma-fertilita', type: 'pathway' },
    'infertilità': { canonical: 'pma-fertilita', type: 'pathway' },
    'fecondazione': { canonical: 'pma-fertilita', type: 'pathway' },
    
    // ===== PACKS =====
    'check up': { canonical: 'checkup-base', type: 'pack' },
    'check-up': { canonical: 'checkup-base', type: 'pack' },
    'checkup': { canonical: 'checkup-base', type: 'pack' },
    'controllo annuale': { canonical: 'checkup-base', type: 'pack' },
    'profilo tiroide': { canonical: 'checkup-tiroide', type: 'pack' },
    'check up donna': { canonical: 'checkup-donna-over40', type: 'pack' },
    'check up uomo': { canonical: 'checkup-uomo-over40', type: 'pack' },
    
    // ===== SYMPTOM MAPPINGS =====
    'stanchezza': { canonical: 'endocrinologia', type: 'specialty', tests: ['tsh-ultrasensibile', 'emocromo-completo', 'ferritina'] },
    'anemia': { canonical: 'ematologia', type: 'specialty', tests: ['emocromo-completo', 'ferritina', 'sideremia'] },
    'colesterolo alto': { canonical: 'cardiologia', type: 'specialty', pack: 'checkup-cardiovascolare' },
    'diabete': { canonical: 'endocrinologia', type: 'specialty', pack: 'checkup-diabete' },
    'tiroide': { canonical: 'endocrinologia', type: 'specialty', pack: 'checkup-tiroide' },
    'gravidanza': { canonical: 'ginecologia', type: 'specialty', test: 'beta-hcg' },
    'prostata': { canonical: 'urologia', type: 'specialty', test: 'psa-totale' },
    
    // ===== TYPO CORRECTIONS =====
    'tiroyde': { canonical: 'endocrinologia', type: 'specialty', typo: true },
    'ginecologgia': { canonical: 'ginecologia', type: 'specialty', typo: true },
    'emocormo': { canonical: 'emocromo-completo', type: 'test', typo: true },
    'colposcpoia': { canonical: 'colposcopia', type: 'procedure', typo: true }
  };

  // =============================================
  // INITIALIZATION
  // =============================================
  
  async function init() {
    if (isInitialized) return true;
    if (isInitializing) {
      // Wait for initialization to complete
      return new Promise(resolve => {
        const check = setInterval(() => {
          if (isInitialized) {
            clearInterval(check);
            resolve(true);
          }
        }, 50);
      });
    }
    
    isInitializing = true;
    
    try {
      // Load all data sources in parallel
      const [specialtiesData, proceduresData, testsData, packsData, pathwaysData, physiciansData] = await Promise.all([
        fetch(`${CONFIG.dataPath}/entities/specialties.json`).then(r => r.json()).catch(() => ({ specialties: [] })),
        fetch(`${CONFIG.dataPath}/entities/procedures.json`).then(r => r.json()).catch(() => ({ procedures: [] })),
        fetch(`${CONFIG.dataPath}/entities/tests.json`).then(r => r.json()).catch(() => ({ tests: [] })),
        fetch(`${CONFIG.dataPath}/entities/packs.json`).then(r => r.json()).catch(() => ({ packs: {} })),
        fetch(`${CONFIG.dataPath}/entities/pathways.json`).then(r => r.json()).catch(() => ({ pathways: [] })),
        fetch(`${CONFIG.dataPath}/entities/physicians.json`).then(r => r.json()).catch(() => ({ physicians: [] }))
      ]);
      
      // Index specialties
      if (specialtiesData.specialties) {
        specialtiesData.specialties.forEach(s => {
          INDEX.specialties.set(s.id, {
            ...s,
            type: 'specialty',
            icon: s.icon || '🏥',
            synonyms: s.aliases || [],
            url: s.page_url || `/${s.id}/`
          });
        });
      }
      
      // Index procedures
      if (proceduresData.procedures) {
        proceduresData.procedures.forEach(p => {
          INDEX.procedures.set(p.id, {
            ...p,
            type: 'procedure',
            icon: '🩺',
            synonyms: p.search_terms || [],
            url: p.page_url || `/${p.id}/`
          });
        });
      }
      
      // Index tests from tests.json
      if (testsData.tests) {
        testsData.tests.forEach(t => {
          INDEX.tests.set(t.id, {
            ...t,
            type: 'test',
            icon: '🔬',
            synonyms: t.aliases || [],
            url: '/laboratorio/'
          });
        });
      }
      
      // Index packs
      if (packsData.packs) {
        Object.entries(packsData.packs).forEach(([id, p]) => {
          INDEX.packs.set(id, {
            ...p,
            id: id,
            type: 'pack',
            icon: '📦',
            synonyms: [],
            url: `/laboratorio/`
          });
        });
      }
      
      // Index pathways
      if (pathwaysData.pathways) {
        pathwaysData.pathways.forEach(p => {
          INDEX.pathways.set(p.id, {
            ...p,
            type: 'pathway',
            icon: p.icon || '🛤️',
            synonyms: p.aliases || [],
            url: p.page_url || `/${p.id}/`
          });
        });
      }
      
      // Index physicians
      if (physiciansData.physicians) {
        physiciansData.physicians.forEach(p => {
          INDEX.physicians.set(p.id || p.slug, {
            ...p,
            id: p.id || p.slug,
            type: 'physician',
            icon: '👨‍⚕️',
            synonyms: [],
            url: p.page_url || `/equipe/${p.slug || p.id}/`
          });
        });
      }
      
      // Integrate BioClinicDB if available (for complete lab exam coverage)
      await integrateLabDatabase();
      
      isInitialized = true;
      isInitializing = false;
      
      console.log(`[SearchEngine] Initialized: ${INDEX.tests.size} tests, ${INDEX.procedures.size} procedures, ${INDEX.packs.size} packs`);
      return true;
      
    } catch (error) {
      console.error('[SearchEngine] Initialization failed:', error);
      isInitializing = false;
      return false;
    }
  }
  
  /**
   * Integrate lab exams from BioClinicDB (database.js)
   */
  async function integrateLabDatabase() {
    if (typeof BioClinicDB === 'undefined') {
      console.log('[SearchEngine] BioClinicDB not available, skipping integration');
      return;
    }
    
    // Integrate lab exams (listino)
    if (BioClinicDB.listino && Array.isArray(BioClinicDB.listino)) {
      BioClinicDB.listino.forEach(exam => {
        if (!INDEX.tests.has(exam.id)) {
          INDEX.tests.set(exam.id, {
            id: exam.id,
            name: exam.nome,
            price: exam.prezzo,
            category: exam.cat,
            symptoms: exam.sintomi || [],
            turnaround: exam.referto,
            preparation: exam.prep,
            upsell: exam.upsell,
            type: 'test',
            icon: '🔬',
            synonyms: [],
            url: '/laboratorio/'
          });
        }
      });
      console.log(`[SearchEngine] Integrated ${BioClinicDB.listino.length} lab exams from BioClinicDB`);
    }
    
    // Integrate packs (pacchetti)
    if (BioClinicDB.pacchetti && Array.isArray(BioClinicDB.pacchetti)) {
      BioClinicDB.pacchetti.forEach(pack => {
        const packId = pack.id;
        if (!INDEX.packs.has(packId)) {
          INDEX.packs.set(packId, {
            id: packId,
            name: pack.nome,
            price: pack.prezzo,
            description: pack.descrizione,
            exams: pack.esami_chiave || [],
            savings: pack.risparmio,
            target: pack.target || [],
            type: 'pack',
            icon: pack.icona || '📦',
            synonyms: pack.tags || [],
            url: '/laboratorio/'
          });
        }
      });
      console.log(`[SearchEngine] Integrated ${BioClinicDB.pacchetti.length} packs from BioClinicDB`);
    }
  }

  // =============================================
  // SEARCH FUNCTION - THE SINGLE ENTRY POINT
  // =============================================
  
  /**
   * Main search function - called by ALL search interfaces
   * @param {string} query - User's search query
   * @returns {object} Search results with all entity types
   */
  function search(query) {
    if (!query || query.length < CONFIG.minQueryLength) {
      return emptyResults(query);
    }
    
    // 1. NORMALIZE
    const normalized = normalize(query);
    const tokens = tokenize(normalized);
    
    // 2. CHECK SYNONYMS
    const synonymInfo = SYNONYMS[normalized];
    const canonical = synonymInfo?.canonical || normalized;
    const directType = synonymInfo?.type;
    
    // 3. SEARCH ALL INDEXES
    const allResults = [];
    
    // Search with both original and canonical terms
    const searchTerms = [normalized, canonical];
    if (synonymInfo?.test) searchTerms.push(synonymInfo.test);
    if (synonymInfo?.procedure) searchTerms.push(synonymInfo.procedure);
    if (synonymInfo?.pack) searchTerms.push(synonymInfo.pack);
    
    // Search each index
    searchInIndex(INDEX.specialties, searchTerms, tokens, allResults, 'specialty');
    searchInIndex(INDEX.procedures, searchTerms, tokens, allResults, 'procedure');
    searchInIndex(INDEX.tests, searchTerms, tokens, allResults, 'test');
    searchInIndex(INDEX.packs, searchTerms, tokens, allResults, 'pack');
    searchInIndex(INDEX.pathways, searchTerms, tokens, allResults, 'pathway');
    searchInIndex(INDEX.physicians, searchTerms, tokens, allResults, 'physician');
    
    // 4. APPLY DIRECT MATCH BOOST
    if (synonymInfo) {
      allResults.forEach(r => {
        if (r.id === canonical || r.id === synonymInfo.test || r.id === synonymInfo.procedure) {
          r._score += 100; // Direct match boost
        }
      });
    }
    
    // 5. RANK RESULTS
    allResults.sort((a, b) => b._score - a._score);
    
    // 6. GROUP BY TYPE
    const groups = {
      specialties: [],
      procedures: [],
      tests: [],
      packs: [],
      pathways: [],
      physicians: []
    };
    
    allResults.forEach(result => {
      const groupKey = result.type + 's';
      if (groups[groupKey] && groups[groupKey].length < CONFIG.maxPerSection) {
        groups[groupKey].push(result);
      }
    });
    
    // 7. GENERATE FALLBACK IF NO RESULTS
    let fallback = null;
    if (allResults.length === 0) {
      fallback = generateFallback(query, normalized);
    }
    
    return {
      query: query,
      normalized: normalized,
      canonical: canonical,
      directMatch: synonymInfo ? true : false,
      results: allResults.slice(0, CONFIG.maxResults),
      groups: groups,
      fallback: fallback,
      stats: {
        total: allResults.length,
        specialties: groups.specialties.length,
        procedures: groups.procedures.length,
        tests: groups.tests.length,
        packs: groups.packs.length,
        pathways: groups.pathways.length,
        physicians: groups.physicians.length
      }
    };
  }
  
  /**
   * Search within a specific index
   */
  function searchInIndex(index, searchTerms, tokens, results, type) {
    for (const [id, item] of index) {
      // Skip if already in results
      if (results.some(r => r.id === id && r.type === type)) continue;
      
      let score = 0;
      const itemName = (item.name || '').toLowerCase();
      const itemSynonyms = (item.synonyms || []).map(s => s.toLowerCase());
      
      for (const term of searchTerms) {
        // Exact ID match
        if (id === term) score += 100;
        // Exact name match
        if (itemName === term) score += 90;
        // Name starts with term
        if (itemName.startsWith(term)) score += 70;
        // Name contains term
        if (itemName.includes(term)) score += 50;
        // Synonym match
        if (itemSynonyms.some(s => s.includes(term) || term.includes(s))) score += 40;
      }
      
      // Token matching
      for (const token of tokens) {
        if (token.length < 2) continue;
        if (itemName.includes(token)) score += 20;
        if (itemSynonyms.some(s => s.includes(token))) score += 15;
      }
      
      // Category/specialty match for tests
      if (item.category) {
        for (const term of searchTerms) {
          if (item.category.toLowerCase().includes(term)) score += 30;
        }
      }
      
      if (score > 0) {
        results.push({
          ...item,
          id: id,
          type: type,
          _score: score
        });
      }
    }
  }
  
  /**
   * Autocomplete function for quick suggestions
   */
  function autocomplete(query) {
    if (!query || query.length < CONFIG.minQueryLength) return [];
    
    const results = search(query);
    const suggestions = [];
    
    // Convert to autocomplete format
    ['specialties', 'procedures', 'tests', 'packs', 'pathways', 'physicians'].forEach(type => {
      results.groups[type].slice(0, 3).forEach(item => {
        suggestions.push({
          id: item.id,
          type: item.type,
          label: item.name,
          subtitle: getSubtitle(item),
          icon: item.icon,
          url: item.url || '#'
        });
      });
    });
    
    return suggestions.slice(0, 8);
  }
  
  /**
   * Get subtitle for autocomplete
   */
  function getSubtitle(item) {
    switch (item.type) {
      case 'test':
        return item.price ? `€${item.price}` : item.category;
      case 'pack':
        return item.price ? `€${item.price}` : 'Check-up';
      case 'physician':
        return item.specialty || 'Specialista';
      case 'procedure':
        return item.specialty_id || 'Prestazione';
      default:
        return '';
    }
  }

  // =============================================
  // HELPER FUNCTIONS
  // =============================================
  
  function normalize(query) {
    return query
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  }
  
  function tokenize(query) {
    return query.split(/\s+/).filter(t => t.length >= 2);
  }
  
  function emptyResults(query) {
    return {
      query: query || '',
      normalized: '',
      canonical: '',
      directMatch: false,
      results: [],
      groups: {
        specialties: [],
        procedures: [],
        tests: [],
        packs: [],
        pathways: [],
        physicians: []
      },
      fallback: null,
      stats: { total: 0 }
    };
  }
  
  function generateFallback(query, normalized) {
    // Try to detect intent from partial matches
    const partialMatches = [];
    
    // Check if any synonym key partially matches
    Object.keys(SYNONYMS).forEach(key => {
      if (key.includes(normalized) || normalized.includes(key)) {
        partialMatches.push({
          term: key,
          info: SYNONYMS[key]
        });
      }
    });
    
    if (partialMatches.length > 0) {
      return {
        type: 'partial',
        message: 'Forse cercavi:',
        suggestions: partialMatches.slice(0, 3).map(m => m.term)
      };
    }
    
    // Default fallback
    return {
      type: 'contact',
      message: 'Non abbiamo trovato risultati per la tua ricerca.',
      cta: 'Contattaci per assistenza',
      phone: '079 956 1332'
    };
  }

  // =============================================
  // PUBLIC API
  // =============================================
  
  return {
    // Core functions
    init: init,
    search: search,
    autocomplete: autocomplete,
    
    // Utility
    normalize: normalize,
    getSynonym: (term) => SYNONYMS[normalize(term)],
    
    // Index access (for debugging/validation)
    getIndex: () => INDEX,
    getStats: () => ({
      tests: INDEX.tests.size,
      procedures: INDEX.procedures.size,
      packs: INDEX.packs.size,
      specialties: INDEX.specialties.size,
      pathways: INDEX.pathways.size,
      physicians: INDEX.physicians.size
    }),
    
    // Configuration
    config: CONFIG,
    version: CONFIG.version
  };
})();

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BioClinicSearchEngine.init());
  } else {
    BioClinicSearchEngine.init();
  }
}

// Export for Node.js (validation scripts)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BioClinicSearchEngine;
}

console.log('[BioClinicSearchEngine] v' + BioClinicSearchEngine.version + ' loaded');
/* Deploy Sun Feb  1 15:52:32 UTC 2026 */
