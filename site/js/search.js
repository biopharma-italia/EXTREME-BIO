/**
 * BIO-CLINIC Clinical Knowledge Search Engine
 * Version: 2.0.0
 * AI-First Unified Search System
 * 
 * Features:
 * - Multi-entity search (tests, procedures, physicians, packs, pathways)
 * - Fuzzy matching with typo tolerance
 * - Synonym expansion
 * - Clinical up-linking (test → pack, procedure → pathway)
 * - Preparation icons for lab tests
 * - Schema.org JSON-LD generation
 */

class BioClinicSearch {
  constructor() {
    this.searchIndex = null;
    this.synonyms = null;
    this.entities = {
      tests: null,
      procedures: null,
      physicians: null,
      packs: null,
      pathways: null,
      specialties: null
    };
    this.isLoaded = false;
    this.isLoading = false;
    this.searchDebounceTimer = null;
    this.currentQuery = '';
    
    // DOM Elements
    this.heroSearchInput = null;
    this.headerSearchInput = null;
    this.autocompleteDropdown = null;
    this.resultsPanel = null;
    this.overlay = null;
    
    // Configuration
    this.config = {
      minQueryLength: 2,
      debounceMs: 200,
      maxAutocompleteResults: 8,
      maxResultsPerSection: 5,
      dataBasePath: '/data'
    };
    
    this.init();
  }
  
  async init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    this.bindElements();
    this.bindEvents();
    this.preloadData();
  }
  
  bindElements() {
    // Hero Search (Homepage)
    this.heroSearchInput = document.getElementById('hero-search-input');
    this.heroSearchBtn = document.getElementById('hero-search-btn');
    this.heroAutocomplete = document.getElementById('hero-autocomplete');
    
    // Header Search (All pages)
    this.headerSearchToggle = document.getElementById('header-search-toggle');
    this.headerSearchExpanded = document.getElementById('header-search-expanded');
    this.headerSearchInput = document.getElementById('header-search-input');
    this.headerAutocomplete = document.getElementById('header-autocomplete');
    
    // Results Panel
    this.resultsPanel = document.getElementById('search-results-panel');
    this.resultsContent = document.getElementById('search-results-content');
    this.resultsClose = document.getElementById('search-results-close');
    this.overlay = document.getElementById('search-overlay');
  }
  
  bindEvents() {
    // Hero Search Events
    if (this.heroSearchInput) {
      this.heroSearchInput.addEventListener('input', (e) => this.handleInput(e, 'hero'));
      this.heroSearchInput.addEventListener('focus', () => this.handleFocus('hero'));
      this.heroSearchInput.addEventListener('keydown', (e) => this.handleKeydown(e, 'hero'));
    }
    
    if (this.heroSearchBtn) {
      this.heroSearchBtn.addEventListener('click', () => this.executeSearch('hero'));
    }
    
    // Header Search Events
    if (this.headerSearchToggle) {
      this.headerSearchToggle.addEventListener('click', () => this.toggleHeaderSearch());
    }
    
    if (this.headerSearchInput) {
      this.headerSearchInput.addEventListener('input', (e) => this.handleInput(e, 'header'));
      this.headerSearchInput.addEventListener('focus', () => this.handleFocus('header'));
      this.headerSearchInput.addEventListener('keydown', (e) => this.handleKeydown(e, 'header'));
    }
    
    // Close Results
    if (this.resultsClose) {
      this.resultsClose.addEventListener('click', () => this.closeResults());
    }
    
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeResults());
    }
    
    // Click outside to close
    document.addEventListener('click', (e) => this.handleClickOutside(e));
    
    // Quick suggestion tags
    document.querySelectorAll('[data-search-suggestion]').forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.dataset.searchSuggestion;
        if (this.heroSearchInput) {
          this.heroSearchInput.value = query;
          this.executeSearch('hero');
        }
      });
    });
  }
  
  async preloadData() {
    // Load search index immediately
    try {
      const indexResponse = await fetch(`${this.config.dataBasePath}/search/index.json`);
      this.searchIndex = await indexResponse.json();
      
      const synonymsResponse = await fetch(`${this.config.dataBasePath}/search/synonyms.json`);
      this.synonyms = await synonymsResponse.json();
      
      this.isLoaded = true;
      console.log('[BioClinicSearch] Search index loaded');
    } catch (error) {
      console.error('[BioClinicSearch] Failed to load search index:', error);
    }
  }
  
  async loadEntityData(entityType) {
    if (this.entities[entityType]) return this.entities[entityType];
    
    try {
      const response = await fetch(`${this.config.dataBasePath}/entities/${entityType}.json`);
      this.entities[entityType] = await response.json();
      return this.entities[entityType];
    } catch (error) {
      console.error(`[BioClinicSearch] Failed to load ${entityType}:`, error);
      return null;
    }
  }
  
  handleInput(e, context) {
    const query = e.target.value.trim();
    
    clearTimeout(this.searchDebounceTimer);
    
    if (query.length < this.config.minQueryLength) {
      this.hideAutocomplete(context);
      return;
    }
    
    this.searchDebounceTimer = setTimeout(() => {
      this.showAutocomplete(query, context);
    }, this.config.debounceMs);
  }
  
  handleFocus(context) {
    const input = context === 'hero' ? this.heroSearchInput : this.headerSearchInput;
    if (input && input.value.length >= this.config.minQueryLength) {
      this.showAutocomplete(input.value, context);
    }
  }
  
  handleKeydown(e, context) {
    const autocomplete = context === 'hero' ? this.heroAutocomplete : this.headerAutocomplete;
    
    if (!autocomplete || !autocomplete.classList.contains('active')) return;
    
    const items = autocomplete.querySelectorAll('.search-autocomplete-item');
    const activeItem = autocomplete.querySelector('.search-autocomplete-item.active');
    let activeIndex = Array.from(items).indexOf(activeItem);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        this.setActiveAutocompleteItem(items, activeIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        this.setActiveAutocompleteItem(items, activeIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeItem) {
          activeItem.click();
        } else {
          this.executeSearch(context);
        }
        break;
        
      case 'Escape':
        this.hideAutocomplete(context);
        break;
    }
  }
  
  setActiveAutocompleteItem(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }
  
  handleClickOutside(e) {
    // Header search
    if (this.headerSearchExpanded && 
        !this.headerSearchExpanded.contains(e.target) &&
        !this.headerSearchToggle?.contains(e.target)) {
      this.headerSearchExpanded.classList.remove('active');
    }
    
    // Autocomplete
    if (this.heroAutocomplete && 
        !this.heroAutocomplete.contains(e.target) &&
        !this.heroSearchInput?.contains(e.target)) {
      this.hideAutocomplete('hero');
    }
    
    if (this.headerAutocomplete && 
        !this.headerAutocomplete.contains(e.target) &&
        !this.headerSearchInput?.contains(e.target)) {
      this.hideAutocomplete('header');
    }
  }
  
  toggleHeaderSearch() {
    if (this.headerSearchExpanded) {
      this.headerSearchExpanded.classList.toggle('active');
      if (this.headerSearchExpanded.classList.contains('active')) {
        this.headerSearchInput?.focus();
      }
    }
  }
  
  async showAutocomplete(query, context) {
    if (!this.isLoaded) {
      await this.preloadData();
    }
    
    const autocomplete = context === 'hero' ? this.heroAutocomplete : this.headerAutocomplete;
    if (!autocomplete) return;
    
    const results = this.search(query);
    
    if (results.length === 0) {
      this.hideAutocomplete(context);
      return;
    }
    
    autocomplete.innerHTML = results
      .slice(0, this.config.maxAutocompleteResults)
      .map(result => this.renderAutocompleteItem(result))
      .join('');
    
    // Bind click events
    autocomplete.querySelectorAll('.search-autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const input = context === 'hero' ? this.heroSearchInput : this.headerSearchInput;
        if (input) {
          input.value = item.dataset.query || query;
        }
        this.hideAutocomplete(context);
        this.executeSearch(context);
      });
    });
    
    autocomplete.classList.add('active');
  }
  
  hideAutocomplete(context) {
    const autocomplete = context === 'hero' ? this.heroAutocomplete : this.headerAutocomplete;
    if (autocomplete) {
      autocomplete.classList.remove('active');
    }
  }
  
  renderAutocompleteItem(result) {
    const icons = {
      pathway: '<path d="M18 10h-4V6h4v4zm-6 4H8v-4h4v4zm6 0h-4v-4h4v4zm0-10H6v14h12V4z"/>',
      procedure: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      test: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
      physician: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      pack: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
      specialty: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
    };
    
    const typeLabels = {
      pathway: 'Percorso',
      procedure: 'Prestazione',
      test: 'Esame',
      physician: 'Medico',
      pack: 'Check-up',
      specialty: 'Specialità'
    };
    
    return `
      <div class="search-autocomplete-item" data-query="${result.name}">
        <div class="search-autocomplete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icons[result.type] || icons.procedure}
          </svg>
        </div>
        <div class="search-autocomplete-text">
          <div class="search-autocomplete-title">${result.name}</div>
          ${result.subtitle ? `<div class="search-autocomplete-subtitle">${result.subtitle}</div>` : ''}
        </div>
        <span class="search-autocomplete-type">${typeLabels[result.type] || result.type}</span>
      </div>
    `;
  }
  
  search(query) {
    if (!this.searchIndex) return [];
    
    const normalizedQuery = this.normalizeQuery(query);
    const expandedTerms = this.expandSynonyms(normalizedQuery);
    
    const results = [];
    const seenIds = new Set();
    
    // Search in index
    for (const term of expandedTerms) {
      const termData = this.searchIndex.terms[term];
      if (termData) {
        // Add results with priority
        if (termData.pathways) {
          termData.pathways.forEach(id => {
            if (!seenIds.has(`pathway:${id}`)) {
              seenIds.add(`pathway:${id}`);
              results.push({
                type: 'pathway',
                id,
                name: this.formatId(id),
                subtitle: 'Percorso clinico completo',
                priority: 100,
                uplink: termData.uplink
              });
            }
          });
        }
        
        if (termData.packs) {
          termData.packs.forEach(id => {
            if (!seenIds.has(`pack:${id}`)) {
              seenIds.add(`pack:${id}`);
              results.push({
                type: 'pack',
                id,
                name: this.formatId(id),
                subtitle: 'Pacchetto esami',
                priority: 90,
                uplink: termData.uplink
              });
            }
          });
        }
        
        if (termData.procedures) {
          termData.procedures.forEach(id => {
            if (!seenIds.has(`procedure:${id}`)) {
              seenIds.add(`procedure:${id}`);
              results.push({
                type: 'procedure',
                id,
                name: this.formatId(id),
                subtitle: termData.clinical_context || '',
                priority: 80
              });
            }
          });
        }
        
        if (termData.tests) {
          termData.tests.forEach(id => {
            if (!seenIds.has(`test:${id}`)) {
              seenIds.add(`test:${id}`);
              results.push({
                type: 'test',
                id,
                name: this.formatId(id),
                subtitle: 'Esame di laboratorio',
                priority: 70,
                uplink: termData.uplink
              });
            }
          });
        }
        
        if (termData.physicians) {
          termData.physicians.forEach(id => {
            if (!seenIds.has(`physician:${id}`)) {
              seenIds.add(`physician:${id}`);
              results.push({
                type: 'physician',
                id,
                name: this.formatId(id),
                subtitle: termData.specialties?.[0] ? this.formatId(termData.specialties[0]) : 'Specialista',
                priority: 60
              });
            }
          });
        }
        
        if (termData.specialties) {
          termData.specialties.forEach(id => {
            if (!seenIds.has(`specialty:${id}`)) {
              seenIds.add(`specialty:${id}`);
              results.push({
                type: 'specialty',
                id,
                name: this.formatId(id),
                subtitle: 'Specialità medica',
                priority: 50
              });
            }
          });
        }
      }
    }
    
    // Sort by priority
    results.sort((a, b) => b.priority - a.priority);
    
    return results;
  }
  
  normalizeQuery(query) {
    return query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }
  
  expandSynonyms(query) {
    const terms = [query];
    
    // Check aliases
    if (this.searchIndex?.aliases) {
      for (const [alias, target] of Object.entries(this.searchIndex.aliases)) {
        if (query.includes(alias)) {
          terms.push(query.replace(alias, target));
        }
      }
    }
    
    // Check synonyms
    if (this.synonyms?.synonyms) {
      for (const [key, data] of Object.entries(this.synonyms.synonyms)) {
        if (data.alternatives?.includes(query)) {
          terms.push(data.primary);
        }
      }
    }
    
    // Check common misspellings
    if (this.synonyms?.common_misspellings) {
      const correction = this.synonyms.common_misspellings[query];
      if (correction) {
        terms.push(correction);
      }
    }
    
    return [...new Set(terms)];
  }
  
  formatId(id) {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  async executeSearch(context) {
    const input = context === 'hero' ? this.heroSearchInput : this.headerSearchInput;
    const query = input?.value.trim();
    
    if (!query || query.length < this.config.minQueryLength) return;
    
    this.currentQuery = query;
    this.hideAutocomplete(context);
    this.showResults();
    this.renderLoading();
    
    // Load entity data if needed
    await Promise.all([
      this.loadEntityData('tests'),
      this.loadEntityData('procedures'),
      this.loadEntityData('physicians'),
      this.loadEntityData('packs'),
      this.loadEntityData('pathways'),
      this.loadEntityData('specialties')
    ]);
    
    const results = this.search(query);
    this.renderResults(results, query);
  }
  
  showResults() {
    if (this.overlay) this.overlay.classList.add('active');
    if (this.resultsPanel) this.resultsPanel.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeResults() {
    if (this.overlay) this.overlay.classList.remove('active');
    if (this.resultsPanel) this.resultsPanel.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  renderLoading() {
    if (!this.resultsContent) return;
    
    this.resultsContent.innerHTML = `
      <div class="search-loading">
        <div class="search-loading-spinner"></div>
        <span>Ricerca in corso...</span>
      </div>
    `;
  }
  
  renderResults(results, query) {
    if (!this.resultsContent) return;
    
    if (results.length === 0) {
      this.resultsContent.innerHTML = `
        <div class="search-no-results">
          <svg class="search-no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <h4>Nessun risultato per "${query}"</h4>
          <p>Prova con termini diversi o contattaci al <a href="tel:+390799561332">079 956 1332</a></p>
        </div>
      `;
      return;
    }
    
    // Group results by type
    const grouped = this.groupResultsByType(results);
    
    let html = '';
    
    // Check for uplink suggestion
    const uplink = results.find(r => r.uplink)?.uplink;
    if (uplink) {
      html += this.renderUplink(uplink);
    }
    
    // Render sections
    if (grouped.pathways.length > 0) {
      html += this.renderSection('Percorsi Consigliati', grouped.pathways, 'pathway');
    }
    
    if (grouped.packs.length > 0) {
      html += this.renderSection('Check-up e Pacchetti', grouped.packs, 'pack');
    }
    
    if (grouped.procedures.length > 0) {
      html += this.renderSection('Prestazioni', grouped.procedures, 'procedure');
    }
    
    if (grouped.tests.length > 0) {
      html += this.renderSection('Esami di Laboratorio', grouped.tests, 'test');
    }
    
    if (grouped.physicians.length > 0) {
      html += this.renderSection('Specialisti', grouped.physicians, 'physician');
    }
    
    if (grouped.specialties.length > 0) {
      html += this.renderSection('Specialità', grouped.specialties, 'specialty');
    }
    
    this.resultsContent.innerHTML = html;
    
    // Inject Schema.org for SEO/AI readability
    this.injectSchemaOrg(results, query);
    
    // Track search analytics
    this.trackSearchEvent(query, results.length);
  }
  
  groupResultsByType(results) {
    return {
      pathways: results.filter(r => r.type === 'pathway'),
      packs: results.filter(r => r.type === 'pack'),
      procedures: results.filter(r => r.type === 'procedure'),
      tests: results.filter(r => r.type === 'test'),
      physicians: results.filter(r => r.type === 'physician'),
      specialties: results.filter(r => r.type === 'specialty')
    };
  }
  
  renderUplink(uplink) {
    const pack = this.entities.packs?.packs?.find(p => p.id === uplink.id);
    const name = pack?.name || this.formatId(uplink.id);
    
    return `
      <div class="search-uplink">
        <div class="search-uplink-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Consigliato
        </div>
        <div class="search-uplink-title">${name}</div>
        <div class="search-uplink-message">${uplink.message}</div>
        <a href="/prestazioni/${uplink.id}" class="search-uplink-cta">
          Scopri il pacchetto
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    `;
  }
  
  renderSection(title, items, type) {
    const icons = {
      pathway: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      pack: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
      procedure: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      test: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
      physician: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      specialty: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>'
    };
    
    return `
      <div class="search-result-section">
        <div class="search-result-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icons[type] || icons.procedure}
          </svg>
          ${title}
        </div>
        ${items.slice(0, this.config.maxResultsPerSection).map(item => 
          this.renderResultCard(item, type)
        ).join('')}
      </div>
    `;
  }
  
  renderResultCard(item, type) {
    // Get full entity data
    let entity = null;
    
    switch (type) {
      case 'test':
        entity = this.entities.tests?.tests?.find(t => t.id === item.id);
        break;
      case 'procedure':
        entity = this.entities.procedures?.procedures?.find(p => p.id === item.id);
        break;
      case 'physician':
        entity = this.entities.physicians?.physicians?.find(p => p.id === item.id);
        break;
      case 'pack':
        entity = this.entities.packs?.packs?.find(p => p.id === item.id);
        break;
      case 'pathway':
        entity = this.entities.pathways?.pathways?.find(p => p.id === item.id);
        break;
      case 'specialty':
        entity = this.entities.specialties?.specialties?.find(s => s.id === item.id);
        break;
    }
    
    if (type === 'physician' && entity) {
      return this.renderPhysicianCard(entity);
    }
    
    if (type === 'pack' && entity) {
      return this.renderPackCard(entity);
    }
    
    const name = entity?.name || item.name;
    const description = entity?.description_short || item.subtitle || '';
    const specialtyClass = this.getSpecialtyClass(entity?.specialty_id || entity?.category_id);
    
    let prepIcons = '';
    if (type === 'test' && entity?.preparation) {
      prepIcons = this.renderPrepIcons(entity.preparation);
    }
    
    return `
      <a href="${this.getEntityUrl(type, item.id)}" class="search-result-card">
        <div class="search-result-card-icon ${specialtyClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${this.getTypeIcon(type)}
          </svg>
        </div>
        <div class="search-result-card-content">
          <div class="search-result-card-title">${name}</div>
          ${description ? `<div class="search-result-card-desc">${description}</div>` : ''}
          ${prepIcons}
        </div>
      </a>
    `;
  }
  
  renderPhysicianCard(physician) {
    const initials = physician.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    const specialty = this.formatId(physician.specialty);
    const procedures = physician.procedures?.slice(0, 3).map(p => this.formatId(p)).join(', ') || '';
    
    return `
      <a href="/equipe/${physician.id}.html" class="search-physician-card">
        <div class="search-physician-avatar">${initials}</div>
        <div class="search-physician-card-content">
          <div class="search-physician-name">${physician.full_name}</div>
          <div class="search-physician-specialty">${specialty}</div>
          ${procedures ? `<div class="search-physician-procedures">${procedures}</div>` : ''}
        </div>
        <span class="search-physician-cta">Prenota</span>
      </a>
    `;
  }
  
  renderPackCard(pack) {
    const exams = pack.exams_included?.slice(0, 5).map(e => this.formatId(e)) || [];
    const moreCount = (pack.exams_count || 0) - 5;
    
    return `
      <div class="search-pack-card">
        <div class="search-pack-header">
          <div class="search-pack-name">${pack.name}</div>
          ${pack.savings_percentage > 0 ? `<div class="search-pack-savings">-${pack.savings_percentage}%</div>` : ''}
        </div>
        <div class="search-pack-benefit">${pack.clinical_benefit}</div>
        <div class="search-pack-exams">
          ${exams.map(e => `<span class="search-pack-exam-tag">${e}</span>`).join('')}
          ${moreCount > 0 ? `<span class="search-pack-exam-tag">+${moreCount} altri</span>` : ''}
        </div>
        <a href="/prestazioni/${pack.id}" class="search-pack-cta">
          ${pack.cta_text || 'Prenota'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    `;
  }
  
  renderPrepIcons(preparation) {
    const icons = [];
    
    if (preparation.is_fasting_required) {
      icons.push(`<span class="search-prep-icon fasting">🥐🚫 Digiuno ${preparation.fasting_hours || 8}h</span>`);
    }
    
    if (preparation.is_urine_sample) {
      icons.push(`<span class="search-prep-icon urine">💧 Campione urine</span>`);
    }
    
    if (preparation.is_morning_only) {
      icons.push(`<span class="search-prep-icon morning">⏰ Prelievo mattutino</span>`);
    }
    
    if (icons.length === 0) return '';
    
    return `<div class="search-prep-icons">${icons.slice(0, 3).join('')}</div>`;
  }
  
  getSpecialtyClass(specialtyId) {
    const mapping = {
      'ginecologia': 'specialty-gyn',
      'ostetricia': 'specialty-gyn',
      'cardiologia': 'specialty-card',
      'endocrinologia': 'specialty-endo',
      'laboratorio': 'specialty-lab',
      'dermatologia': 'specialty-derm'
    };
    
    return mapping[specialtyId] || 'specialty-default';
  }
  
  getTypeIcon(type) {
    const icons = {
      pathway: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      pack: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
      procedure: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      test: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
      physician: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      specialty: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>'
    };
    
    return icons[type] || icons.procedure;
  }
  
  getEntityUrl(type, id) {
    const urls = {
      pathway: `/pages/${id}.html`,
      pack: `/prestazioni/${id}`,
      procedure: `/prestazioni/${id}`,
      test: `/laboratorio/${id}`,
      physician: `/equipe/${id}.html`,
      specialty: `/pages/${id}.html`
    };
    
    return urls[type] || '#';
  }
  
  /**
   * Generate Schema.org JSON-LD for search results
   * Makes results AI/SEO readable
   */
  generateSchemaOrg(results, query) {
    const schemaItems = [];
    
    // Group results for schema
    const grouped = this.groupResultsByType(results);
    
    // MedicalTest items
    grouped.tests.forEach(item => {
      const entity = this.entities.tests?.tests?.find(t => t.id === item.id);
      if (entity) {
        schemaItems.push({
          "@type": "MedicalTest",
          "@id": `https://bio-clinic.it/laboratorio/${item.id}/#test`,
          "name": entity.name,
          "description": entity.description_short,
          "usesDevice": entity.schema_org?.usesDevice || "Laboratorio Analisi Bio-Clinic",
          "normalRange": entity.turnaround_time ? `Referto in ${entity.turnaround_time}` : undefined,
          "availableAtOrFrom": {
            "@type": "MedicalClinic",
            "@id": "https://bio-clinic.it/#organization",
            "name": "Bio-Clinic Sassari"
          }
        });
      }
    });
    
    // MedicalProcedure items
    grouped.procedures.forEach(item => {
      const entity = this.entities.procedures?.procedures?.find(p => p.id === item.id);
      if (entity) {
        schemaItems.push({
          "@type": "MedicalProcedure",
          "@id": `https://bio-clinic.it/prestazioni/${item.id}/#procedure`,
          "name": entity.name,
          "description": entity.description_short,
          "procedureType": entity.schema_org?.procedureType || "http://schema.org/DiagnosticProcedure",
          "howPerformed": entity.description_full,
          "availableAtOrFrom": {
            "@type": "MedicalClinic",
            "@id": "https://bio-clinic.it/#organization",
            "name": "Bio-Clinic Sassari"
          }
        });
      }
    });
    
    // Physician items
    grouped.physicians.forEach(item => {
      const entity = this.entities.physicians?.physicians?.find(p => p.id === item.id);
      if (entity) {
        schemaItems.push({
          "@type": "Physician",
          "@id": `https://bio-clinic.it/equipe/${item.id}/#physician`,
          "name": entity.full_name,
          "jobTitle": entity.job_title,
          "medicalSpecialty": this.formatId(entity.specialty),
          "worksFor": {
            "@type": "MedicalClinic",
            "@id": "https://bio-clinic.it/#organization",
            "name": "Bio-Clinic Sassari"
          }
        });
      }
    });
    
    // Pack items (as Product + MedicalTest collection)
    grouped.packs.forEach(item => {
      const entity = this.entities.packs?.packs?.find(p => p.id === item.id);
      if (entity) {
        schemaItems.push({
          "@type": ["Product", "MedicalTest"],
          "@id": `https://bio-clinic.it/prestazioni/${item.id}/#pack`,
          "name": entity.name,
          "description": entity.clinical_benefit,
          "category": "Check-up Medico",
          "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "MedicalClinic",
              "@id": "https://bio-clinic.it/#organization"
            }
          }
        });
      }
    });
    
    // Create SearchResultsPage schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      "@id": `https://bio-clinic.it/search?q=${encodeURIComponent(query)}`,
      "mainEntity": {
        "@type": "ItemList",
        "name": `Risultati di ricerca per "${query}"`,
        "numberOfItems": results.length,
        "itemListElement": schemaItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": item
        }))
      },
      "about": {
        "@type": "MedicalClinic",
        "@id": "https://bio-clinic.it/#organization",
        "name": "Bio-Clinic Sassari",
        "telephone": "+39 079 956 1332",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Via Renzo Mossa, 23",
          "addressLocality": "Sassari",
          "postalCode": "07100",
          "addressCountry": "IT"
        }
      }
    };
    
    return schema;
  }
  
  /**
   * Inject Schema.org into page for current search
   */
  injectSchemaOrg(results, query) {
    // Remove existing search schema
    const existingSchema = document.getElementById('search-schema-org');
    if (existingSchema) {
      existingSchema.remove();
    }
    
    // Generate new schema
    const schema = this.generateSchemaOrg(results, query);
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'search-schema-org';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    
    // Append to head
    document.head.appendChild(script);
    
    console.log('[BioClinicSearch] Schema.org injected for query:', query);
  }
  
  /**
   * Track search analytics event
   */
  trackSearchEvent(query, resultsCount, selectedResult = null) {
    // Google Analytics 4 event
    if (typeof gtag === 'function') {
      gtag('event', 'search', {
        'search_term': query,
        'results_count': resultsCount
      });
      
      if (selectedResult) {
        gtag('event', 'select_content', {
          'content_type': selectedResult.type,
          'item_id': selectedResult.id
        });
      }
    }
    
    // Custom analytics endpoint (if configured)
    if (window.bioClinicAnalytics?.trackSearch) {
      window.bioClinicAnalytics.trackSearch({
        query,
        resultsCount,
        selectedResult,
        timestamp: new Date().toISOString()
      });
    }
    
    // Console log for debugging
    console.log('[BioClinicSearch] Analytics:', {
      event: selectedResult ? 'result_click' : 'search',
      query,
      resultsCount,
      selectedResult
    });
  }
}

// Initialize
window.bioClinicSearch = new BioClinicSearch();
