/**
 * BIO-CLINIC SEARCH UI ADAPTER v3.0.0
 * ====================================
 * Connects BioClinicSearch engine to page interfaces
 * Same engine, different UI for each context
 * 
 * MODES:
 * - 'home': Full search panel (hero area)
 * - 'header': Compact dropdown (always visible header)
 * - 'lab': Lab-focused with exam emphasis
 * 
 * @version 3.0.0
 * @date 2026-02-02
 */

(function(global) {
    'use strict';

    // ===========================================
    // CONFIGURATION
    // ===========================================
    const UI_CONFIG = {
        selectors: {
            home: {
                input: '.hero-search-input, #hero-search-input, [data-search="home"]',
                results: '.hero-search-results, #hero-search-results',
                container: '.hero-search, .search-box-hero'
            },
            header: {
                input: '.header-search-input, #header-search-input, [data-search="header"]',
                results: '.header-search-dropdown, #header-search-dropdown',
                container: '.header-search'
            },
            lab: {
                input: '.lab-search-input, #lab-search-input, [data-search="lab"]',
                results: '.lab-search-results, #lab-search-results',
                container: '.lab-search'
            }
        },
        debounceMs: 200,
        minQueryLength: 2
    };

    // ===========================================
    // SEARCH UI ADAPTER CLASS
    // ===========================================
    class SearchUIAdapter {
        constructor(mode = 'auto') {
            this.mode = mode;
            this.input = null;
            this.resultsContainer = null;
            this.container = null;
            this.debounceTimer = null;
            this.currentQuery = '';
            this.selectedIndex = -1;
            this.results = [];
            this.isOpen = false;
            
            this._boundOnInput = this._onInput.bind(this);
            this._boundOnKeydown = this._onKeydown.bind(this);
            this._boundOnFocus = this._onFocus.bind(this);
            this._boundOnClickOutside = this._onClickOutside.bind(this);
        }

        // ===========================================
        // INITIALIZATION
        // ===========================================
        async init() {
            // Detect mode if auto
            if (this.mode === 'auto') {
                this.mode = this._detectMode();
            }

            console.log(`[SearchUI] Initializing in ${this.mode} mode`);

            // Find DOM elements
            if (!this._bindElements()) {
                console.warn('[SearchUI] Could not bind elements for mode:', this.mode);
                return false;
            }

            // Initialize search engine
            if (typeof BioClinicSearch !== 'undefined') {
                await BioClinicSearch.init();
            } else {
                console.error('[SearchUI] BioClinicSearch not found');
                return false;
            }

            // Bind events
            this._bindEvents();
            
            // Create results container if needed
            this._ensureResultsContainer();

            console.log('[SearchUI] Ready');
            return true;
        }

        _detectMode() {
            // Check URL path
            const path = window.location.pathname;
            if (path.includes('/laboratorio')) return 'lab';
            
            // Check for home hero
            if (document.querySelector('.hero-search, .search-box-hero')) return 'home';
            
            // Default to header
            return 'header';
        }

        _bindElements() {
            const selectors = UI_CONFIG.selectors[this.mode] || UI_CONFIG.selectors.header;
            
            // Try each selector until we find the input
            this.input = this._findElement(selectors.input);
            this.resultsContainer = this._findElement(selectors.results);
            this.container = this._findElement(selectors.container);

            // Fallback: search for any search input
            if (!this.input) {
                this.input = document.querySelector('input[type="search"], input[placeholder*="cerca"], input[placeholder*="Cerca"]');
            }

            return !!this.input;
        }

        _findElement(selector) {
            if (!selector) return null;
            const selectors = selector.split(',').map(s => s.trim());
            for (const s of selectors) {
                const el = document.querySelector(s);
                if (el) return el;
            }
            return null;
        }

        _bindEvents() {
            if (this.input) {
                this.input.addEventListener('input', this._boundOnInput);
                this.input.addEventListener('keydown', this._boundOnKeydown);
                this.input.addEventListener('focus', this._boundOnFocus);
            }
            
            document.addEventListener('click', this._boundOnClickOutside);
        }

        _ensureResultsContainer() {
            if (this.resultsContainer) return;

            // Create results container based on mode
            this.resultsContainer = document.createElement('div');
            this.resultsContainer.className = `search-results-dropdown search-results-${this.mode}`;
            this.resultsContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                max-height: 400px;
                overflow-y: auto;
                z-index: 9999;
                display: none;
            `;

            const parent = this.container || this.input.parentElement;
            if (parent) {
                parent.style.position = 'relative';
                parent.appendChild(this.resultsContainer);
            }
        }

        // ===========================================
        // EVENT HANDLERS
        // ===========================================
        _onInput(e) {
            const query = e.target.value.trim();
            this.currentQuery = query;

            // Debounce
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this._performSearch(query);
            }, UI_CONFIG.debounceMs);
        }

        _onKeydown(e) {
            if (!this.isOpen || !this.results.length) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this._selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this._selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this._selectCurrent();
                    break;
                case 'Escape':
                    this._closeResults();
                    break;
            }
        }

        _onFocus() {
            if (this.currentQuery.length >= UI_CONFIG.minQueryLength && this.results.length) {
                this._openResults();
            }
        }

        _onClickOutside(e) {
            if (this.container && !this.container.contains(e.target)) {
                this._closeResults();
            } else if (this.input && !this.input.contains(e.target) && 
                       this.resultsContainer && !this.resultsContainer.contains(e.target)) {
                this._closeResults();
            }
        }

        // ===========================================
        // SEARCH & RENDER
        // ===========================================
        _performSearch(query) {
            if (query.length < UI_CONFIG.minQueryLength) {
                this._closeResults();
                return;
            }

            // Search with mode-specific options
            const options = this._getSearchOptions();
            const searchResult = BioClinicSearch.search(query, options);

            this.results = searchResult.results;
            this.selectedIndex = -1;

            if (this.results.length > 0) {
                this._renderResults(searchResult);
                this._openResults();
            } else {
                this._renderNoResults(query);
                this._openResults();
            }
        }

        _getSearchOptions() {
            switch (this.mode) {
                case 'lab':
                    return { 
                        types: ['exam', 'pack'],
                        maxResults: 20,
                        includeLabExams: true
                    };
                case 'header':
                    return {
                        maxResults: 8,
                        includeLabExams: false
                    };
                case 'home':
                default:
                    return {
                        maxResults: 15,
                        includeLabExams: true
                    };
            }
        }

        _renderResults(searchResult) {
            if (!this.resultsContainer) return;

            const { grouped, query, triage, hasTriage } = searchResult;
            
            // Use TRIAGE renderer if available
            if (hasTriage && triage && this.mode !== 'header') {
                this.resultsContainer.innerHTML = this._renderTriageResults(triage, query);
                this._bindResultClicks();
                this._bindAccordions();
                return;
            }
            
            // Use mode-specific renderer
            switch (this.mode) {
                case 'lab':
                    this.resultsContainer.innerHTML = this._renderLabResults(grouped, query);
                    break;
                case 'header':
                    this.resultsContainer.innerHTML = this._renderHeaderResults(grouped, query);
                    break;
                case 'home':
                default:
                    this.resultsContainer.innerHTML = this._renderHomeResults(grouped, query);
            }

            // Bind click handlers
            this._bindResultClicks();
        }

        /**
         * TRIAGE RENDERER - Hierarchical clinical results
         */
        _renderTriageResults(triage, query) {
            const { primary, related, packSuggestion } = triage;
            
            return `
                <div class="search-triage-results">
                    ${primary ? this._renderPrimaryResult(primary) : ''}
                    ${related.length > 0 ? this._renderRelatedSection(related) : ''}
                    ${packSuggestion ? this._renderPackSuggestion(packSuggestion) : ''}
                </div>
            `;
        }

        /**
         * PRIMARY RESULT - Large card, prominent CTA
         */
        _renderPrimaryResult(result) {
            return `
                <div class="triage-primary">
                    <div class="triage-primary-badge">
                        <i class="fas fa-check-circle"></i> Risultato principale
                    </div>
                    <a href="${result.url}" class="triage-primary-card" data-index="0" data-id="${result.id}" data-type="${result.type}">
                        <div class="triage-primary-header">
                            <span class="triage-type-badge triage-type-${result.type}">${this._getTypeLabel(result.type)}</span>
                            ${result.price ? `<span class="triage-primary-price">€${typeof result.price === 'number' ? result.price.toFixed(2) : result.price}</span>` : ''}
                        </div>
                        <h3 class="triage-primary-name">${result.name}</h3>
                        ${result.description ? `<p class="triage-primary-desc">${result.description}</p>` : ''}
                        ${result.meta?.duration_minutes ? `<span class="triage-meta"><i class="fas fa-clock"></i> ${result.meta.duration_minutes} min</span>` : ''}
                        <div class="triage-primary-cta">
                            <span class="triage-cta-btn">Scopri di più <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </a>
                </div>
            `;
        }

        /**
         * RELATED SECTION - Collapsed accordion
         */
        _renderRelatedSection(related) {
            return `
                <div class="triage-related">
                    <button class="triage-related-toggle" aria-expanded="false">
                        <span><i class="fas fa-layer-group"></i> Altri esami correlati (${related.length})</span>
                        <i class="fas fa-chevron-down triage-toggle-icon"></i>
                    </button>
                    <div class="triage-related-content" hidden>
                        ${related.map((result, idx) => `
                            <a href="${result.url}" class="triage-related-item" data-index="${idx + 1}" data-id="${result.id}">
                                <span class="triage-related-name">${result.name}</span>
                                ${result.price ? `<span class="triage-related-price">€${typeof result.price === 'number' ? result.price.toFixed(2) : result.price}</span>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * PACK SUGGESTION - Always at bottom
         */
        _renderPackSuggestion(pack) {
            return `
                <div class="triage-suggestion">
                    <div class="triage-suggestion-label">
                        <i class="fas fa-tags"></i> Risparmia con il pacchetto
                    </div>
                    <a href="${pack.url}" class="triage-suggestion-card" data-id="${pack.id}" data-type="pack">
                        <div class="triage-suggestion-info">
                            <span class="triage-suggestion-name">${pack.name}</span>
                            ${pack.meta?.description ? `<span class="triage-suggestion-desc">${this._truncate(pack.meta.description, 80)}</span>` : ''}
                        </div>
                        ${pack.price ? `<span class="triage-suggestion-price">€${typeof pack.price === 'number' ? pack.price.toFixed(2) : pack.price}</span>` : ''}
                    </a>
                </div>
            `;
        }

        /**
         * Bind accordion toggle for related section
         */
        _bindAccordions() {
            const toggles = this.resultsContainer?.querySelectorAll('.triage-related-toggle');
            toggles?.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const content = toggle.nextElementSibling;
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                    
                    toggle.setAttribute('aria-expanded', !isExpanded);
                    content.hidden = isExpanded;
                    
                    // Rotate chevron
                    const icon = toggle.querySelector('.triage-toggle-icon');
                    if (icon) {
                        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                    }
                });
            });
        }

        _renderHomeResults(grouped, query) {
            return `
                <div class="search-results-home">
                    ${grouped.map(group => `
                        <div class="search-group">
                            <div class="search-group-header">
                                <i class="fas fa-${group.icon}"></i>
                                <span>${group.label}</span>
                                <span class="search-group-count">${group.results.length}</span>
                            </div>
                            <div class="search-group-items">
                                ${group.results.map((result, idx) => `
                                    <a href="${result.url}" 
                                       class="search-result-item" 
                                       data-index="${idx}"
                                       data-id="${result.id}"
                                       data-type="${result.type}">
                                        <div class="search-result-main">
                                            <span class="search-result-name">${result.highlight || result.name}</span>
                                            ${result.price ? `<span class="search-result-price">€${result.price}</span>` : ''}
                                        </div>
                                        ${result.description ? `<span class="search-result-desc">${this._truncate(result.description, 60)}</span>` : ''}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <div class="search-footer">
                        <a href="/pages/ricerca.html?q=${encodeURIComponent(query)}" class="search-all-link">
                            Vedi tutti i risultati per "${query}" →
                        </a>
                    </div>
                </div>
            `;
        }

        _renderHeaderResults(grouped, query) {
            const flatResults = grouped.flatMap(g => g.results).slice(0, 8);
            
            return `
                <div class="search-results-header">
                    ${flatResults.map((result, idx) => `
                        <a href="${result.url}" 
                           class="search-result-compact" 
                           data-index="${idx}">
                            <span class="result-type-badge result-type-${result.type}">${this._getTypeLabel(result.type)}</span>
                            <span class="result-name">${result.highlight || result.name}</span>
                        </a>
                    `).join('')}
                    ${flatResults.length > 5 ? `
                        <a href="/pages/ricerca.html?q=${encodeURIComponent(query)}" class="search-more-link">
                            Altri risultati →
                        </a>
                    ` : ''}
                </div>
            `;
        }

        _renderLabResults(grouped, query) {
            return `
                <div class="search-results-lab">
                    ${grouped.map(group => `
                        <div class="lab-search-section">
                            <h4 class="lab-section-title">${group.label}</h4>
                            ${group.results.map((result, idx) => `
                                <a href="${result.url}" 
                                   class="lab-result-item" 
                                   data-index="${idx}">
                                    <div class="lab-result-info">
                                        <span class="lab-result-name">${result.highlight || result.name}</span>
                                        ${result.turnaround ? `<span class="lab-result-time">⏱ ${result.turnaround}</span>` : ''}
                                    </div>
                                    ${result.price ? `<span class="lab-result-price">€${result.price.toFixed(2)}</span>` : ''}
                                </a>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        _renderNoResults(query) {
            if (!this.resultsContainer) return;

            this.resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>Nessun risultato per "<strong>${query}</strong>"</p>
                    <p class="search-suggestions">Prova a cercare:</p>
                    <div class="search-suggestion-links">
                        <a href="/pages/ginecologia.html">Ginecologia</a>
                        <a href="/pages/cardiologia.html">Cardiologia</a>
                        <a href="/laboratorio/">Laboratorio Analisi</a>
                    </div>
                </div>
            `;
        }

        _bindResultClicks() {
            if (!this.resultsContainer) return;

            this.resultsContainer.querySelectorAll('a[data-index]').forEach(el => {
                el.addEventListener('click', (e) => {
                    // Track click for analytics
                    const resultId = el.dataset.id;
                    const resultType = el.dataset.type;
                    this._trackClick(resultId, resultType, this.currentQuery);
                });
            });
        }

        // ===========================================
        // NAVIGATION
        // ===========================================
        _selectNext() {
            const items = this.resultsContainer?.querySelectorAll('[data-index]');
            if (!items?.length) return;

            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this._updateSelection(items);
        }

        _selectPrevious() {
            const items = this.resultsContainer?.querySelectorAll('[data-index]');
            if (!items?.length) return;

            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this._updateSelection(items);
        }

        _selectCurrent() {
            if (this.selectedIndex < 0) return;

            const items = this.resultsContainer?.querySelectorAll('[data-index]');
            if (!items?.length) return;

            const selected = items[this.selectedIndex];
            if (selected?.href) {
                window.location.href = selected.href;
            }
        }

        _updateSelection(items) {
            items.forEach((item, idx) => {
                item.classList.toggle('selected', idx === this.selectedIndex);
            });

            // Scroll into view
            if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        // ===========================================
        // VISIBILITY
        // ===========================================
        _openResults() {
            if (this.resultsContainer) {
                this.resultsContainer.style.display = 'block';
                this.isOpen = true;
            }
        }

        _closeResults() {
            if (this.resultsContainer) {
                this.resultsContainer.style.display = 'none';
                this.isOpen = false;
                this.selectedIndex = -1;
            }
        }

        // ===========================================
        // UTILITIES
        // ===========================================
        _truncate(text, maxLength) {
            if (!text || text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        }

        _getTypeLabel(type) {
            const labels = {
                specialty: 'Specialità',
                procedure: 'Prestazione',
                exam: 'Esame',
                pack: 'Pacchetto',
                pathway: 'Percorso',
                physician: 'Medico'
            };
            return labels[type] || type;
        }

        _trackClick(id, type, query) {
            // Analytics tracking (placeholder)
            if (typeof gtag === 'function') {
                gtag('event', 'search_result_click', {
                    search_term: query,
                    result_id: id,
                    result_type: type
                });
            }
        }

        // ===========================================
        // CLEANUP
        // ===========================================
        destroy() {
            if (this.input) {
                this.input.removeEventListener('input', this._boundOnInput);
                this.input.removeEventListener('keydown', this._boundOnKeydown);
                this.input.removeEventListener('focus', this._boundOnFocus);
            }
            document.removeEventListener('click', this._boundOnClickOutside);
            clearTimeout(this.debounceTimer);
        }
    }

    // ===========================================
    // AUTO-INITIALIZATION
    // ===========================================
    function autoInit() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initSearchUI());
        } else {
            initSearchUI();
        }
    }

    function initSearchUI() {
        // Find all search inputs and initialize appropriate adapters
        const homeSearch = document.querySelector('.hero-search-input, #hero-search-input, [data-search="home"]');
        const headerSearch = document.querySelector('.header-search-input, #header-search-input, [data-search="header"]');
        const labSearch = document.querySelector('.lab-search-input, #lab-search-input, [data-search="lab"]');

        let activeAdapter = null;

        if (homeSearch) {
            const homeAdapter = new SearchUIAdapter('home');
            homeAdapter.init();
            global.bioClinicSearchHome = homeAdapter;
            activeAdapter = homeAdapter;
        }

        if (headerSearch) {
            const headerAdapter = new SearchUIAdapter('header');
            headerAdapter.init();
            global.bioClinicSearchHeader = headerAdapter;
            if (!activeAdapter) activeAdapter = headerAdapter;
        }

        if (labSearch) {
            const labAdapter = new SearchUIAdapter('lab');
            labAdapter.init();
            global.bioClinicSearchLab = labAdapter;
            if (!activeAdapter) activeAdapter = labAdapter;
        }

        // If no specific search found, try auto mode
        if (!homeSearch && !headerSearch && !labSearch) {
            const autoAdapter = new SearchUIAdapter('auto');
            autoAdapter.init();
            global.bioClinicSearchAuto = autoAdapter;
            activeAdapter = autoAdapter;
        }

        // Bind suggestion tags (Tiroide, Cardiologia, etc.) after a short delay
        // to ensure adapters are fully initialized
        setTimeout(() => {
            bindSuggestionTags();
        }, 500);
    }

    /**
     * Bind click handlers to suggestion tags
     */
    function bindSuggestionTags() {
        const tags = document.querySelectorAll('[data-search-suggestion], .search-suggestion-tag[data-search-suggestion]');
        
        tags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const query = tag.dataset.searchSuggestion || tag.textContent.trim();
                
                // Find the search input
                const input = document.querySelector('#hero-search-input, .hero-search-input, #searchInput, .lab-search-input');
                
                if (input && query) {
                    input.value = query;
                    input.focus();
                    
                    // Get the active adapter from global
                    const adapter = global.bioClinicSearchHome || global.bioClinicSearchLab || global.bioClinicSearchHeader || global.bioClinicSearchAuto;
                    
                    // Trigger search via adapter if available and ready
                    if (adapter && typeof adapter._performSearch === 'function') {
                        console.log('[SearchUI] Triggering search via adapter for:', query);
                        adapter._performSearch(query);
                    } else {
                        // Fallback: dispatch input event
                        console.log('[SearchUI] Fallback: dispatching input event for:', query);
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });
        });
        
        console.log('[SearchUI] Bound', tags.length, 'suggestion tags');
    }

    // ===========================================
    // CSS INJECTION (minimal styles for dropdown)
    // ===========================================
    function injectStyles() {
        const css = `
            .search-results-dropdown {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .search-group {
                border-bottom: 1px solid #eee;
                padding: 0.5rem 0;
            }
            .search-group:last-child {
                border-bottom: none;
            }
            .search-group-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
            }
            .search-group-count {
                background: #e5e7eb;
                padding: 0.125rem 0.5rem;
                border-radius: 10px;
                font-size: 0.65rem;
            }
            .search-result-item,
            .search-result-compact,
            .lab-result-item {
                display: block;
                padding: 0.75rem 1rem;
                text-decoration: none;
                color: #333;
                transition: background 0.15s;
            }
            .search-result-item:hover,
            .search-result-compact:hover,
            .lab-result-item:hover,
            .search-result-item.selected,
            .search-result-compact.selected,
            .lab-result-item.selected {
                background: #f3f4f6;
            }
            .search-result-main {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .search-result-name {
                font-weight: 500;
            }
            .search-result-name mark {
                background: #fef08a;
                padding: 0 2px;
            }
            .search-result-price,
            .lab-result-price {
                font-weight: 600;
                color: #059669;
            }
            .search-result-desc {
                display: block;
                font-size: 0.8rem;
                color: #666;
                margin-top: 0.25rem;
            }
            .result-type-badge {
                font-size: 0.65rem;
                padding: 0.125rem 0.5rem;
                border-radius: 4px;
                margin-right: 0.5rem;
                background: #e5e7eb;
                color: #374151;
            }
            .result-type-specialty { background: #dbeafe; color: #1e40af; }
            .result-type-procedure { background: #dcfce7; color: #166534; }
            .result-type-exam { background: #fef3c7; color: #92400e; }
            .result-type-pack { background: #fae8ff; color: #86198f; }
            .search-footer,
            .search-more-link {
                padding: 0.75rem 1rem;
                text-align: center;
                border-top: 1px solid #eee;
            }
            .search-all-link,
            .search-more-link {
                color: #2563eb;
                font-weight: 500;
                text-decoration: none;
            }
            .search-no-results {
                padding: 1.5rem;
                text-align: center;
                color: #666;
            }
            .search-suggestion-links {
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 0.5rem;
            }
            .search-suggestion-links a {
                background: #f3f4f6;
                padding: 0.375rem 0.75rem;
                border-radius: 6px;
                text-decoration: none;
                color: #374151;
                font-size: 0.875rem;
            }
            .lab-search-section {
                padding: 0.5rem 0;
            }
            .lab-section-title {
                padding: 0.5rem 1rem;
                margin: 0;
                font-size: 0.75rem;
                color: #666;
                text-transform: uppercase;
            }
            .lab-result-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .lab-result-info {
                display: flex;
                flex-direction: column;
            }
            .lab-result-time {
                font-size: 0.75rem;
                color: #666;
            }
        `;

        if (!document.getElementById('search-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'search-ui-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    // ===========================================
    // EXPORTS
    // ===========================================
    const SearchUI = {
        Adapter: SearchUIAdapter,
        init: autoInit,
        injectStyles
    };

    // Auto-inject styles
    injectStyles();

    // Auto-initialize
    autoInit();

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SearchUI;
    }
    global.SearchUI = SearchUI;

})(typeof window !== 'undefined' ? window : global);
