/**
 * BIO-CLINIC UNIFIED SEARCH ENGINE v3.1.0 - CLINICAL TRIAGE
 * ===========================================================
 * Entity-based search with CLINICAL TRIAGE ranking
 * Single source of truth for all search interfaces
 * 
 * FEATURES:
 * - CLINICAL TRIAGE: ONE primary result per query
 * - Hierarchical results: Primary → Related → Pack suggestion
 * - Entity-based search (not keyword matching)
 * - Semantic synonym resolution
 * - Lab exams integration (1136+ tests)
 * 
 * TRIAGE RULES:
 * - Each query has ONE definitive primary result
 * - Related exams are grouped and collapsed
 * - Packs are ALWAYS shown AFTER primary result
 * 
 * @version 3.1.0
 * @date 2026-02-02
 * @author Bio-Clinic Engineering
 */

(function(global) {
    'use strict';

    // ===========================================
    // CONFIGURATION
    // ===========================================
    const CONFIG = {
        paths: {
            entities: '/data/unified-entities.json',
            synonyms: '/data/synonyms.json',
            labExams: '/data/listino-processed.json',
            clinicalPriority: '/data/clinical-priority.json'
        },
        search: {
            minQueryLength: 2,
            maxResults: 15,
            maxPerSection: 5,
            debounceMs: 150,
            highlightTag: 'mark'
        },
        weights: {
            exactMatch: 100,
            startsWith: 80,
            wordBoundary: 60,
            contains: 40,
            synonym: 70,
            fuzzy: 20
        },
        resultOrder: ['specialty', 'procedure', 'exam', 'pack', 'pathway', 'physician']
    };

    // ===========================================
    // STATE
    // ===========================================
    let isInitialized = false;
    let isInitializing = false;
    let entities = [];
    let synonymsMap = {};
    let labExams = [];
    let clinicalPriority = {};
    let searchIndex = new Map();

    // ===========================================
    // INITIALIZATION
    // ===========================================
    async function init() {
        if (isInitialized) return Promise.resolve(true);
        if (isInitializing) {
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
        console.log('[BioClinicSearch] Initializing v3.1.0 (Clinical Triage)...');

        try {
            // Load data in parallel
            const [entitiesData, synonymsData, labData, priorityData] = await Promise.all([
                fetchJSON(CONFIG.paths.entities),
                fetchJSON(CONFIG.paths.synonyms),
                fetchJSON(CONFIG.paths.labExams).catch(() => ({ esami: [] })),
                fetchJSON(CONFIG.paths.clinicalPriority).catch(() => ({}))
            ]);

            // Process entities
            if (entitiesData && entitiesData.entities) {
                entities = entitiesData.entities;
                console.log(`[BioClinicSearch] Loaded ${entities.length} entities`);
            }

            // Process synonyms
            if (synonymsData && synonymsData.synonyms) {
                synonymsMap = synonymsData.synonyms;
                console.log('[BioClinicSearch] Loaded synonym mappings');
            }

            // Process lab exams
            if (labData) {
                labExams = labData.esami || labData || [];
                if (Array.isArray(labExams)) {
                    console.log(`[BioClinicSearch] Loaded ${labExams.length} lab exams`);
                }
            }

            // Process clinical priority mappings
            if (priorityData && priorityData.primary_mappings) {
                clinicalPriority = priorityData;
                console.log(`[BioClinicSearch] Loaded ${Object.keys(priorityData.primary_mappings).length} clinical priority mappings`);
            }

            // Build search index
            buildSearchIndex();

            isInitialized = true;
            isInitializing = false;
            console.log('[BioClinicSearch] Ready');
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('bioclinic-search-ready'));
            
            return true;
        } catch (error) {
            console.error('[BioClinicSearch] Init failed:', error);
            isInitializing = false;
            return false;
        }
    }

    // ===========================================
    // DATA LOADING
    // ===========================================
    async function fetchJSON(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.json();
    }

    // ===========================================
    // INDEX BUILDING
    // ===========================================
    function buildSearchIndex() {
        searchIndex.clear();
        
        // Index entities
        entities.forEach(entity => {
            const tokens = extractTokens(entity);
            tokens.forEach(token => {
                if (!searchIndex.has(token)) {
                    searchIndex.set(token, []);
                }
                searchIndex.get(token).push({
                    type: 'entity',
                    entity: entity,
                    token: token
                });
            });
        });

        // Index lab exams
        if (Array.isArray(labExams)) {
            labExams.forEach(exam => {
                const name = exam.nome || exam.name || '';
                const tokens = tokenize(name);
                tokens.forEach(token => {
                    if (!searchIndex.has(token)) {
                        searchIndex.set(token, []);
                    }
                    searchIndex.get(token).push({
                        type: 'lab_exam',
                        exam: exam,
                        token: token
                    });
                });
            });
        }

        console.log(`[BioClinicSearch] Index built with ${searchIndex.size} unique tokens`);
    }

    function extractTokens(entity) {
        const tokens = new Set();
        
        // Name
        if (entity.name) {
            tokenize(entity.name).forEach(t => tokens.add(t));
        }
        
        // Search names array
        if (entity.name_search && Array.isArray(entity.name_search)) {
            entity.name_search.forEach(term => {
                if (term) tokenize(term).forEach(t => tokens.add(t));
            });
        }
        
        // ID as token
        if (entity.id) {
            tokens.add(entity.id.toLowerCase());
            // Split hyphenated IDs
            entity.id.split('-').forEach(part => {
                if (part.length > 2) tokens.add(part.toLowerCase());
            });
        }
        
        // Category
        if (entity.category) {
            tokens.add(entity.category.toLowerCase());
        }
        
        // Meta description
        if (entity.meta && entity.meta.description) {
            tokenize(entity.meta.description).forEach(t => tokens.add(t));
        }
        
        // Indications
        if (entity.meta && entity.meta.indications) {
            entity.meta.indications.forEach(ind => {
                tokenize(ind).forEach(t => tokens.add(t));
            });
        }
        
        return tokens;
    }

    function tokenize(text) {
        if (!text) return [];
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    function normalize(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // ===========================================
    // SEARCH FUNCTIONS - CLINICAL TRIAGE
    // ===========================================
    
    /**
     * TRIAGE SEARCH - Returns hierarchical clinical results
     * 
     * Structure:
     * - primary: ONE definitive result (the answer)
     * - related: Collapsed section of related exams/procedures
     * - packSuggestion: Optional pack suggestion (ALWAYS last)
     */
    function search(query, options = {}) {
        if (!isInitialized) {
            console.warn('[BioClinicSearch] Not initialized, call init() first');
            return { results: [], query: query, triage: null };
        }

        const normalizedQuery = normalize(query);
        if (normalizedQuery.length < CONFIG.search.minQueryLength) {
            return { results: [], query: query, triage: null };
        }

        const {
            maxResults = CONFIG.search.maxResults,
            types = null,
            includeLabExams = true,
            triageMode = true  // Enable clinical triage by default
        } = options;

        // ===========================================
        // STEP 1: Check for clinical priority mapping
        // ===========================================
        const priorityMapping = getClinicalPriority(normalizedQuery);
        
        if (priorityMapping && triageMode) {
            // Use TRIAGE mode - structured clinical results
            return buildTriageResults(normalizedQuery, priorityMapping, query);
        }

        // ===========================================
        // STEP 2: Fallback to standard search (no mapping found)
        // ===========================================
        return standardSearch(query, normalizedQuery, { maxResults, types, includeLabExams });
    }

    /**
     * Get clinical priority mapping for a query
     */
    function getClinicalPriority(normalizedQuery) {
        if (!clinicalPriority.primary_mappings) return null;
        
        // Exact match first
        if (clinicalPriority.primary_mappings[normalizedQuery]) {
            return clinicalPriority.primary_mappings[normalizedQuery];
        }
        
        // Check if query is contained in any mapping key
        for (const [key, mapping] of Object.entries(clinicalPriority.primary_mappings)) {
            if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
                return mapping;
            }
        }
        
        return null;
    }

    /**
     * Build TRIAGE results - hierarchical clinical structure
     */
    function buildTriageResults(normalizedQuery, mapping, originalQuery) {
        const triage = {
            primary: null,
            related: [],
            packSuggestion: null,
            specialtyContext: null
        };

        // 1. Find PRIMARY result
        const primaryResult = findResultById(mapping.primary_id, mapping.primary_type);
        if (primaryResult) {
            primaryResult.isPrimary = true;
            primaryResult.triageLevel = 1;
            triage.primary = primaryResult;
        }

        // 2. Find RELATED results (collapsed)
        if (mapping.related_ids && Array.isArray(mapping.related_ids)) {
            mapping.related_ids.forEach(relatedId => {
                const related = findResultById(relatedId);
                if (related && related.id !== mapping.primary_id) {
                    related.isPrimary = false;
                    related.triageLevel = 2;
                    related.noHighlight = true;  // Don't highlight in related
                    triage.related.push(related);
                }
            });
        }

        // 3. Add PACK SUGGESTION (always last)
        if (mapping.pack_suggestion) {
            const pack = findResultById(`pack-${mapping.pack_suggestion}`, 'pack') ||
                        findResultById(mapping.pack_suggestion, 'pack');
            if (pack) {
                pack.isPrimary = false;
                pack.triageLevel = 3;
                pack.isSuggestion = true;
                triage.packSuggestion = pack;
            }
        }

        // 4. Set specialty context
        if (mapping.specialty_context) {
            triage.specialtyContext = mapping.specialty_context;
        }

        // Build flat results array (for compatibility)
        const results = [];
        if (triage.primary) results.push(triage.primary);
        results.push(...triage.related);
        if (triage.packSuggestion) results.push(triage.packSuggestion);

        return {
            results: results,
            grouped: groupResultsByType(results),
            query: originalQuery,
            count: results.length,
            triage: triage,  // NEW: Structured triage data
            hasTriage: true
        };
    }

    /**
     * Find a result by ID across all data sources
     */
    function findResultById(id, preferredType = null) {
        if (!id) return null;

        // Search in entities
        const entity = entities.find(e => e.id === id);
        if (entity) {
            return formatResult({ type: 'entity', entity }, 100, '');
        }

        // Search in lab exams
        const exam = labExams.find(e => 
            e.id === id || 
            slugify(e.nome || e.name) === id ||
            (e.codice && e.codice.toLowerCase() === id.toLowerCase())
        );
        if (exam) {
            return formatResult({ type: 'lab_exam', exam }, 100, '');
        }

        return null;
    }

    /**
     * Standard search (fallback when no clinical mapping exists)
     */
    function standardSearch(query, normalizedQuery, options) {
        const { maxResults, types, includeLabExams } = options;
        const scores = new Map();
        const queryTokens = tokenize(query);

        // 1. Direct token matching
        queryTokens.forEach(token => {
            if (searchIndex.has(token)) {
                searchIndex.get(token).forEach(item => {
                    const key = getItemKey(item);
                    const currentScore = scores.get(key) || { item, score: 0, matches: [] };
                    currentScore.score += CONFIG.weights.exactMatch;
                    currentScore.matches.push({ type: 'exact', token });
                    scores.set(key, currentScore);
                });
            }

            // Prefix matching
            searchIndex.forEach((items, indexToken) => {
                if (indexToken !== token && indexToken.startsWith(token)) {
                    items.forEach(item => {
                        const key = getItemKey(item);
                        const currentScore = scores.get(key) || { item, score: 0, matches: [] };
                        currentScore.score += CONFIG.weights.startsWith;
                        currentScore.matches.push({ type: 'prefix', token });
                        scores.set(key, currentScore);
                    });
                }
            });
        });

        // 2. Synonym resolution
        const synonymResult = resolveSynonym(normalizedQuery);
        if (synonymResult) {
            applySemanticBoost(scores, synonymResult);
        }

        // 3. Convert scores to results
        let results = Array.from(scores.values())
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => formatResult(s.item, s.score, query));

        // 4. Apply type priority to promote exams over packs
        results = applyTypePriority(results);

        // 5. Filter by type if specified
        if (types && Array.isArray(types)) {
            results = results.filter(r => types.includes(r.type));
        }

        // 6. Filter lab exams if disabled
        if (!includeLabExams) {
            results = results.filter(r => r.type !== 'exam');
        }

        // 7. Semantic fallback if no results
        if (results.length === 0) {
            results = getSemanticFallback(normalizedQuery);
        }

        // 8. Limit results
        results = results.slice(0, maxResults);

        // 9. Mark first result as primary
        if (results.length > 0) {
            results[0].isPrimary = true;
            results[0].triageLevel = 1;
            results.slice(1).forEach(r => {
                r.isPrimary = false;
                r.triageLevel = 2;
            });
        }

        return {
            results: results,
            grouped: groupResultsByType(results),
            query: query,
            count: results.length,
            triage: null,
            hasTriage: false
        };
    }

    /**
     * Apply type priority to ensure exams come before packs
     */
    function applyTypePriority(results) {
        const typePriority = clinicalPriority.type_priority_order || {
            exam: 100,
            procedure: 90,
            specialty: 80,
            pathway: 70,
            pack: 60,
            physician: 50
        };

        return results.sort((a, b) => {
            // First by score
            const scoreDiff = b.score - a.score;
            if (Math.abs(scoreDiff) > 20) return scoreDiff;
            
            // Then by type priority
            const aPriority = typePriority[a.type] || 0;
            const bPriority = typePriority[b.type] || 0;
            return bPriority - aPriority;
        });
    }

    function getItemKey(item) {
        if (item.type === 'entity') {
            return `entity:${item.entity.id}`;
        } else if (item.type === 'lab_exam') {
            return `exam:${item.exam.codice || item.exam.code || item.exam.nome}`;
        }
        return `unknown:${Math.random()}`;
    }

    function formatResult(item, score, query) {
        if (item.type === 'entity') {
            const entity = item.entity;
            return {
                id: entity.id,
                type: entity.type,
                name: entity.name || formatPackName(entity.id),
                description: entity.meta?.description || '',
                url: entity.page_url || '#',
                bookable: entity.bookable !== false,
                specialty_parent: entity.specialty_parent || null,
                schema_type: entity.schema_type,
                score: score,
                highlight: highlightMatch(entity.name || formatPackName(entity.id), query),
                meta: entity.meta || {}
            };
        } else if (item.type === 'lab_exam') {
            const exam = item.exam;
            return {
                id: exam.codice || exam.code || slugify(exam.nome),
                type: 'exam',
                name: exam.nome || exam.name,
                description: exam.categoria || exam.category || 'Esame di laboratorio',
                url: `/laboratorio/#${slugify(exam.nome || exam.name)}`,
                price: exam.prezzo_listino || exam.prezzo || exam.price,
                turnaround: exam.tempo || exam.turnaround,
                specialty_parent: 'laboratorio',
                bookable: true,
                score: score,
                highlight: highlightMatch(exam.nome || exam.name, query),
                meta: {
                    sample_type: exam.materiale || exam.sample,
                    notes: exam.note || exam.notes
                }
            };
        }
        return null;
    }

    function formatPackName(id) {
        // Convert pack-checkup-base to "Check-up Base"
        return id
            .replace(/^pack-/, '')
            .replace(/-/g, ' ')
            .replace(/checkup/g, 'Check-up')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    function highlightMatch(text, query) {
        if (!text || !query) return text;
        const normalizedText = text.toLowerCase();
        const normalizedQuery = query.toLowerCase();
        const index = normalizedText.indexOf(normalizedQuery);
        if (index === -1) return text;
        
        const tag = CONFIG.search.highlightTag;
        return text.substring(0, index) + 
               `<${tag}>` + text.substring(index, index + query.length) + `</${tag}>` +
               text.substring(index + query.length);
    }

    function slugify(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // ===========================================
    // SYNONYM RESOLUTION
    // ===========================================
    function resolveSynonym(query) {
        const normalizedQuery = normalize(query);

        // Check each synonym category
        const categories = [
            'specialists_to_specialty',
            'colloquial_to_clinical', 
            'exam_abbreviations',
            'genetic_prenatal',
            'procedures',
            'device_therapies',
            'symptoms_to_entities',
            'pathways',
            'packs',
            'typo_corrections'
        ];

        for (const category of categories) {
            const mapping = synonymsMap[category];
            if (!mapping) continue;

            // Direct lookup
            if (mapping[normalizedQuery]) {
                return {
                    category: category,
                    original: query,
                    resolved: mapping[normalizedQuery]
                };
            }

            // Check if query contains a synonym
            for (const [synonym, resolution] of Object.entries(mapping)) {
                if (normalizedQuery.includes(normalize(synonym))) {
                    return {
                        category: category,
                        original: query,
                        synonym: synonym,
                        resolved: resolution
                    };
                }
            }
        }

        return null;
    }

    function applySemanticBoost(scores, synonymResult) {
        const resolved = synonymResult.resolved;

        // Boost specialty matches
        if (resolved.specialty || typeof resolved === 'string') {
            const specialtyId = resolved.specialty || resolved;
            entities.filter(e => e.id === specialtyId || e.type === 'specialty')
                .forEach(entity => {
                    if (entity.id === specialtyId || 
                        normalize(entity.name).includes(normalize(specialtyId))) {
                        const key = `entity:${entity.id}`;
                        const current = scores.get(key) || { 
                            item: { type: 'entity', entity }, 
                            score: 0, 
                            matches: [] 
                        };
                        current.score += CONFIG.weights.synonym;
                        current.matches.push({ type: 'synonym', resolved: specialtyId });
                        scores.set(key, current);
                    }
                });
        }

        // Boost procedure matches
        if (resolved.procedure) {
            entities.filter(e => e.id === resolved.procedure || e.type === 'procedure')
                .forEach(entity => {
                    if (entity.id === resolved.procedure) {
                        const key = `entity:${entity.id}`;
                        const current = scores.get(key) || {
                            item: { type: 'entity', entity },
                            score: 0,
                            matches: []
                        };
                        current.score += CONFIG.weights.synonym;
                        scores.set(key, current);
                    }
                });
        }

        // Boost exam matches
        if (resolved.exam) {
            labExams.forEach(exam => {
                const examId = slugify(exam.nome || exam.name);
                if (examId.includes(resolved.exam) || 
                    normalize(exam.nome || exam.name).includes(resolved.exam)) {
                    const key = `exam:${exam.codice || examId}`;
                    const current = scores.get(key) || {
                        item: { type: 'lab_exam', exam },
                        score: 0,
                        matches: []
                    };
                    current.score += CONFIG.weights.synonym;
                    scores.set(key, current);
                }
            });
        }

        // Boost pack matches
        if (resolved.pack) {
            entities.filter(e => e.type === 'pack')
                .forEach(entity => {
                    if (entity.id.includes(resolved.pack)) {
                        const key = `entity:${entity.id}`;
                        const current = scores.get(key) || {
                            item: { type: 'entity', entity },
                            score: 0,
                            matches: []
                        };
                        current.score += CONFIG.weights.synonym;
                        scores.set(key, current);
                    }
                });
        }

        // Boost pathway matches  
        if (resolved.pathway) {
            entities.filter(e => e.type === 'pathway')
                .forEach(entity => {
                    if (entity.id === resolved.pathway || entity.id.includes(resolved.pathway)) {
                        const key = `entity:${entity.id}`;
                        const current = scores.get(key) || {
                            item: { type: 'entity', entity },
                            score: 0,
                            matches: []
                        };
                        current.score += CONFIG.weights.synonym;
                        scores.set(key, current);
                    }
                });
        }
    }

    // ===========================================
    // SEMANTIC FALLBACK
    // ===========================================
    function getSemanticFallback(query) {
        const results = [];
        const queryTokens = tokenize(query);

        // Check semantic groups
        if (synonymsMap.semantic_groups) {
            for (const [group, members] of Object.entries(synonymsMap.semantic_groups)) {
                if (queryTokens.some(t => normalize(group).includes(t) || t.includes(normalize(group)))) {
                    // Found a semantic group, suggest its members
                    members.forEach(memberId => {
                        const entity = entities.find(e => e.id === memberId);
                        if (entity) {
                            results.push({
                                id: entity.id,
                                type: entity.type,
                                name: entity.name || formatPackName(entity.id),
                                description: `Correlato a "${group}"`,
                                url: entity.page_url || '#',
                                bookable: entity.bookable !== false,
                                score: 30,
                                isFallback: true
                            });
                        }
                    });
                }
            }
        }

        // If still no results, suggest main fallbacks
        if (results.length === 0 && synonymsMap.fallback_suggestions) {
            synonymsMap.fallback_suggestions.forEach(suggestion => {
                const entity = entities.find(e => e.id === suggestion.id);
                results.push({
                    id: suggestion.id,
                    type: suggestion.type || 'specialty',
                    name: suggestion.label,
                    description: 'Suggerimento',
                    url: suggestion.url || entity?.page_url || '#',
                    bookable: true,
                    score: 10,
                    isFallback: true
                });
            });
        }

        return results.slice(0, 5);
    }

    // ===========================================
    // RESULT GROUPING
    // ===========================================
    function groupResultsByType(results) {
        const groups = {};
        const typeLabels = {
            specialty: { label: 'Specialità', icon: 'stethoscope', order: 1 },
            procedure: { label: 'Prestazioni', icon: 'clipboard-list', order: 2 },
            exam: { label: 'Esami di Laboratorio', icon: 'vial', order: 3 },
            pack: { label: 'Check-up e Pacchetti', icon: 'box', order: 4 },
            pathway: { label: 'Percorsi di Cura', icon: 'route', order: 5 },
            physician: { label: 'Medici Specialisti', icon: 'user-md', order: 6 }
        };

        results.forEach(result => {
            const type = result.type;
            if (!groups[type]) {
                const typeInfo = typeLabels[type] || { label: type, icon: 'circle', order: 99 };
                groups[type] = {
                    type: type,
                    label: typeInfo.label,
                    icon: typeInfo.icon,
                    order: typeInfo.order,
                    results: []
                };
            }
            groups[type].results.push(result);
        });

        // Sort groups by order and limit results per group
        return Object.values(groups)
            .sort((a, b) => a.order - b.order)
            .map(group => ({
                ...group,
                results: group.results.slice(0, CONFIG.search.maxPerSection)
            }));
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================
    function getEntityById(id) {
        return entities.find(e => e.id === id) || null;
    }

    function getEntitiesByType(type) {
        return entities.filter(e => e.type === type);
    }

    function getRelatedEntities(entityId) {
        const entity = getEntityById(entityId);
        if (!entity || !entity.relations) return [];

        const related = [];
        
        // Related procedures
        if (entity.relations.related_procedures) {
            entity.relations.related_procedures.forEach(procId => {
                const proc = getEntityById(procId);
                if (proc) related.push(proc);
            });
        }

        // Related physicians
        if (entity.relations.physicians) {
            entity.relations.physicians.forEach(physId => {
                const phys = getEntityById(physId);
                if (phys) related.push(phys);
            });
        }

        // Pathways
        if (entity.relations.pathways) {
            entity.relations.pathways.forEach(pathId => {
                const path = getEntityById(pathId);
                if (path) related.push(path);
            });
        }

        return related;
    }

    function searchLabExams(query, limit = 20) {
        if (!isInitialized || !labExams.length) return [];
        
        const normalizedQuery = normalize(query);
        return labExams
            .filter(exam => {
                const name = normalize(exam.nome || exam.name || '');
                const code = normalize(exam.codice || exam.code || '');
                return name.includes(normalizedQuery) || code.includes(normalizedQuery);
            })
            .slice(0, limit)
            .map(exam => formatResult({ type: 'lab_exam', exam }, 50, query));
    }

    // ===========================================
    // PUBLIC API
    // ===========================================
    const BioClinicSearch = {
        // Core
        init,
        search,
        
        // Utilities
        getEntityById,
        getEntitiesByType,
        getRelatedEntities,
        searchLabExams,
        
        // State
        isReady: () => isInitialized,
        
        // Config
        getConfig: () => ({ ...CONFIG }),
        
        // Debug
        getStats: () => ({
            initialized: isInitialized,
            entitiesCount: entities.length,
            labExamsCount: labExams.length,
            indexSize: searchIndex.size,
            synonymCategories: Object.keys(synonymsMap).length
        }),
        
        // Version
        version: '3.1.0'
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BioClinicSearch;
    }
    global.BioClinicSearch = BioClinicSearch;

})(typeof window !== 'undefined' ? window : global);
