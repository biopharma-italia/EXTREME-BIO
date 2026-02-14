/**
 * BIO-CLINIC SEARCH UI ADAPTER
 * ============================
 * Version: 1.0.0
 * Date: 2026-02-01
 * 
 * UI adapter that connects BioClinicSearchEngine to different page interfaces.
 * The engine is THE SAME for all pages. This adapter handles:
 * - DOM binding
 * - Event handling
 * - Result rendering (mode-specific)
 * - Debouncing
 * - Keyboard navigation
 * 
 * CRITICAL: This adapter NEVER filters search results.
 * It only controls HOW results are displayed.
 * 
 * © Bio-Clinic Sassari - bio-clinic.it
 */

const SearchUIAdapter = (function() {
  'use strict';

  // =============================================
  // DEFAULT CONFIGURATION
  // =============================================
  const DEFAULT_CONFIG = {
    mode: 'full',           // 'full' | 'lab' | 'compact'
    debounceMs: 200,
    minQueryLength: 2,
    inputSelector: null,    // Must be provided
    resultsSelector: null,  // Optional - created if not provided
    autocompleteSelector: null,
    showAutocomplete: true,
    showPanel: true,
    panelSelector: '#unified-search-panel',
    overlaySelector: '#unified-search-overlay'
  };

  // =============================================
  // ADAPTER CLASS
  // =============================================
  
  class Adapter {
    constructor(options = {}) {
      this.config = { ...DEFAULT_CONFIG, ...options };
      this.debounceTimer = null;
      this.selectedIndex = -1;
      this.currentResults = null;
      this.isOpen = false;
      
      // DOM elements
      this.input = null;
      this.resultsContainer = null;
      this.autocompleteContainer = null;
      this.panel = null;
      this.overlay = null;
      
      // Initialize
      this.init();
    }
    
    /**
     * Initialize the adapter
     */
    async init() {
      // Wait for engine to be ready
      if (typeof BioClinicSearchEngine === 'undefined') {
        console.error('[SearchAdapter] BioClinicSearchEngine not available');
        return;
      }
      
      await BioClinicSearchEngine.init();
      
      // Find DOM elements
      this.bindElements();
      
      if (!this.input) {
        console.warn('[SearchAdapter] No input element found');
        return;
      }
      
      // Bind events
      this.bindEvents();
      
      // Create containers if needed
      this.createContainers();
      
      console.log(`[SearchAdapter] Initialized in ${this.config.mode} mode`);
    }
    
    /**
     * Find and bind DOM elements
     */
    bindElements() {
      // Input element
      if (this.config.inputSelector) {
        this.input = document.querySelector(this.config.inputSelector);
      }
      
      // Try common selectors if not found
      if (!this.input) {
        this.input = document.querySelector('#hero-search-input, #header-search-input, #searchInput, #search-input, [data-search-input]');
      }
      
      // Results container
      if (this.config.resultsSelector) {
        this.resultsContainer = document.querySelector(this.config.resultsSelector);
      }
      
      // Autocomplete container
      if (this.config.autocompleteSelector) {
        this.autocompleteContainer = document.querySelector(this.config.autocompleteSelector);
      }
      
      // Panel and overlay
      if (this.config.showPanel) {
        this.panel = document.querySelector(this.config.panelSelector);
        this.overlay = document.querySelector(this.config.overlaySelector);
      }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
      // Input events
      this.input.addEventListener('input', (e) => this.handleInput(e));
      this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
      this.input.addEventListener('focus', () => this.handleFocus());
      
      // Click outside to close
      document.addEventListener('click', (e) => {
        if (!this.input.contains(e.target) && 
            (!this.autocompleteContainer || !this.autocompleteContainer.contains(e.target)) &&
            (!this.resultsContainer || !this.resultsContainer.contains(e.target))) {
          this.close();
        }
      });
      
      // Panel close button
      if (this.panel) {
        const closeBtn = this.panel.querySelector('.close-btn, [data-close]');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.close());
        }
      }
      
      // Overlay click
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }
      
      // Form submit
      const form = this.input.closest('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.executeSearch();
        });
      }
    }
    
    /**
     * Create containers if they don't exist
     */
    createContainers() {
      // Create autocomplete container
      if (!this.autocompleteContainer && this.config.showAutocomplete) {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.className = 'search-autocomplete autocomplete-dropdown';
        this.autocompleteContainer.style.display = 'none';
        this.input.parentNode.appendChild(this.autocompleteContainer);
      }
      
      // Inject panel if needed and not exists
      if (this.config.showPanel && !this.panel) {
        this.injectPanel();
      }
    }
    
    /**
     * Inject unified search panel into DOM
     */
    injectPanel() {
      const panelHTML = `
        <div id="unified-search-overlay" class="unified-search-overlay"></div>
        <div id="unified-search-panel" class="unified-search-panel">
          <div class="unified-search-header">
            <span class="unified-search-query">Risultati per: <strong id="unified-search-query-display"></strong></span>
            <button class="unified-search-close" data-close>&times;</button>
          </div>
          <div class="unified-search-content" id="unified-search-content"></div>
          <div class="unified-search-fallback" id="unified-search-fallback"></div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', panelHTML);
      
      this.panel = document.getElementById('unified-search-panel');
      this.overlay = document.getElementById('unified-search-overlay');
      this.resultsContainer = document.getElementById('unified-search-content');
      
      // Bind close events
      const closeBtn = this.panel.querySelector('[data-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }
      this.overlay.addEventListener('click', () => this.close());
    }
    
    // =============================================
    // EVENT HANDLERS
    // =============================================
    
    /**
     * Handle input with debounce
     */
    handleInput(e) {
      const query = e.target.value.trim();
      
      // Clear previous timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // Hide if query too short
      if (query.length < this.config.minQueryLength) {
        this.hideAutocomplete();
        return;
      }
      
      // Debounce search
      this.debounceTimer = setTimeout(() => {
        this.performSearch(query);
      }, this.config.debounceMs);
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
      if (!this.autocompleteContainer) return;
      
      const items = this.autocompleteContainer.querySelectorAll('.autocomplete-item');
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
          this.updateSelection(items);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.updateSelection(items);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            const url = items[this.selectedIndex].dataset.url;
            if (url && url !== '#') {
              window.location.href = url;
            }
          } else {
            this.executeSearch();
          }
          break;
          
        case 'Escape':
          this.close();
          this.input.blur();
          break;
      }
    }
    
    /**
     * Handle focus
     */
    handleFocus() {
      if (this.input.value.length >= this.config.minQueryLength && this.currentResults) {
        this.showAutocomplete();
      }
    }
    
    /**
     * Update selection highlight
     */
    updateSelection(items) {
      items.forEach((item, idx) => {
        item.classList.toggle('selected', idx === this.selectedIndex);
      });
    }
    
    // =============================================
    // SEARCH EXECUTION
    // =============================================
    
    /**
     * Perform search (autocomplete mode)
     */
    async performSearch(query) {
      // USE THE SINGLE ENGINE
      const results = BioClinicSearchEngine.search(query);
      this.currentResults = results;
      this.selectedIndex = -1;
      
      // Render autocomplete
      if (this.config.showAutocomplete) {
        const suggestions = BioClinicSearchEngine.autocomplete(query);
        this.renderAutocomplete(suggestions);
        this.showAutocomplete();
      }
    }
    
    /**
     * Execute full search (Enter key or button click)
     */
    executeSearch() {
      const query = this.input.value.trim();
      if (query.length < this.config.minQueryLength) return;
      
      // USE THE SINGLE ENGINE
      const results = BioClinicSearchEngine.search(query);
      this.currentResults = results;
      
      // Render based on mode
      this.renderResults(results);
      
      // Show panel or results section
      if (this.config.showPanel && this.panel) {
        this.showPanel(query);
      }
      
      this.hideAutocomplete();
    }
    
    // =============================================
    // RENDERING - MODE SPECIFIC
    // =============================================
    
    /**
     * Render autocomplete suggestions
     */
    renderAutocomplete(suggestions) {
      if (!this.autocompleteContainer) return;
      
      if (!suggestions || suggestions.length === 0) {
        this.autocompleteContainer.innerHTML = `
          <div class="autocomplete-empty">
            <span>Premi Invio per cercare</span>
          </div>
        `;
        return;
      }
      
      const typeLabels = {
        specialty: 'Specialità',
        procedure: 'Prestazione',
        test: 'Esame',
        pack: 'Check-up',
        pathway: 'Percorso',
        physician: 'Medico'
      };
      
      const html = suggestions.map((item, idx) => `
        <div class="autocomplete-item ${idx === this.selectedIndex ? 'selected' : ''}" 
             data-index="${idx}" 
             data-url="${item.url || '#'}">
          <span class="autocomplete-icon">${item.icon || '📋'}</span>
          <span class="autocomplete-label">${item.label}</span>
          ${item.subtitle ? `<span class="autocomplete-subtitle">${item.subtitle}</span>` : ''}
          <span class="autocomplete-type">${typeLabels[item.type] || ''}</span>
        </div>
      `).join('');
      
      this.autocompleteContainer.innerHTML = html;
      
      // Bind click events
      this.autocompleteContainer.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', () => {
          const url = el.dataset.url;
          if (url && url !== '#') {
            window.location.href = url;
          }
        });
      });
    }
    
    /**
     * Render full results (mode-specific)
     */
    renderResults(results) {
      if (!this.resultsContainer) return;
      
      switch (this.config.mode) {
        case 'lab':
          this.renderLabResults(results);
          break;
        case 'compact':
          this.renderCompactResults(results);
          break;
        default:
          this.renderFullResults(results);
      }
    }
    
    /**
     * Full mode: all entity types visible
     */
    renderFullResults(results) {
      if (!results || results.results.length === 0) {
        this.renderFallback(results?.fallback);
        return;
      }
      
      let html = '';
      
      // Render each section
      const sections = [
        { key: 'specialties', title: 'Specialità', icon: '🏥' },
        { key: 'procedures', title: 'Prestazioni', icon: '🩺' },
        { key: 'tests', title: 'Esami', icon: '🔬' },
        { key: 'packs', title: 'Check-up', icon: '📦' },
        { key: 'pathways', title: 'Percorsi', icon: '🛤️' },
        { key: 'physicians', title: 'Medici', icon: '👨‍⚕️' }
      ];
      
      sections.forEach(section => {
        const items = results.groups[section.key];
        if (items && items.length > 0) {
          html += this.renderSection(section.title, items, section.icon);
        }
      });
      
      this.resultsContainer.innerHTML = html;
    }
    
    /**
     * Lab mode: tests prominent, packs as suggestions
     */
    renderLabResults(results) {
      if (!results || results.results.length === 0) {
        this.renderFallback(results?.fallback);
        return;
      }
      
      let html = '';
      
      // Pack suggestion (first priority)
      if (results.groups.packs.length > 0) {
        const pack = results.groups.packs[0];
        html += `
          <div class="pack-suggestion">
            <span class="pack-icon">${pack.icon}</span>
            <div class="pack-info">
              <h3>💡 Ti consigliamo: ${pack.name}</h3>
              <p>${pack.description || ''}</p>
              ${pack.price ? `<p class="pack-price">€${pack.price.toFixed ? pack.price.toFixed(2) : pack.price}</p>` : ''}
            </div>
            <a href="tel:+390799561332" class="btn btn-primary">Prenota</a>
          </div>
        `;
      }
      
      // Tests section (main content)
      if (results.groups.tests.length > 0) {
        html += `
          <div class="results-section tests-section">
            <h3 class="results-title">${results.groups.tests.length} esami trovati</h3>
            <div class="exam-results">
              ${results.groups.tests.map(test => this.renderExamCard(test)).join('')}
            </div>
          </div>
        `;
      }
      
      // Related procedures (if any)
      if (results.groups.procedures.length > 0) {
        html += `
          <div class="results-section">
            <h4>Prestazioni correlate</h4>
            ${results.groups.procedures.slice(0, 3).map(p => `
              <a href="${p.url}" class="related-item">${p.icon} ${p.name}</a>
            `).join('')}
          </div>
        `;
      }
      
      this.resultsContainer.innerHTML = html;
    }
    
    /**
     * Compact mode: minimal display
     */
    renderCompactResults(results) {
      if (!results || results.results.length === 0) {
        this.renderFallback(results?.fallback);
        return;
      }
      
      const html = results.results.slice(0, 10).map(item => `
        <a href="${item.url || '#'}" class="compact-result">
          <span class="compact-icon">${item.icon}</span>
          <span class="compact-name">${item.name}</span>
        </a>
      `).join('');
      
      this.resultsContainer.innerHTML = `<div class="compact-results">${html}</div>`;
    }
    
    /**
     * Render a section of results
     */
    renderSection(title, items, icon) {
      return `
        <div class="results-section">
          <h3 class="section-title">${icon} ${title}</h3>
          <div class="section-items">
            ${items.map(item => this.renderResultItem(item)).join('')}
          </div>
        </div>
      `;
    }
    
    /**
     * Render a single result item
     */
    renderResultItem(item) {
      return `
        <a href="${item.url || '#'}" class="result-item result-${item.type}">
          <span class="result-icon">${item.icon}</span>
          <div class="result-content">
            <span class="result-name">${item.name}</span>
            ${item.description_short ? `<span class="result-desc">${item.description_short}</span>` : ''}
            ${item.price ? `<span class="result-price">€${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>` : ''}
          </div>
        </a>
      `;
    }
    
    /**
     * Render exam card (lab mode)
     */
    renderExamCard(exam) {
      const tags = [];
      if (exam.category) tags.push(`<span class="exam-tag cat">${exam.category}</span>`);
      if (exam.preparation) tags.push(`<span class="exam-tag prep">📋 ${exam.preparation}</span>`);
      if (exam.turnaround) tags.push(`<span class="exam-tag referto">⏱️ ${exam.turnaround}</span>`);
      
      return `
        <div class="exam-card">
          <div class="exam-header">
            <span class="exam-name">${exam.name}</span>
            ${exam.price ? `<span class="exam-price">€${typeof exam.price === 'number' ? exam.price.toFixed(2) : exam.price}</span>` : ''}
          </div>
          ${tags.length > 0 ? `<div class="exam-meta">${tags.join('')}</div>` : ''}
        </div>
      `;
    }
    
    /**
     * Render fallback when no results
     */
    renderFallback(fallback) {
      if (!fallback) {
        this.resultsContainer.innerHTML = `
          <div class="no-results">
            <p>Nessun risultato trovato.</p>
            <p>Contattaci: <a href="tel:+390799561332">079 956 1332</a></p>
          </div>
        `;
        return;
      }
      
      if (fallback.type === 'partial') {
        this.resultsContainer.innerHTML = `
          <div class="partial-results">
            <p>${fallback.message}</p>
            <div class="suggestions">
              ${fallback.suggestions.map(s => `<button class="suggestion-btn" onclick="document.querySelector('${this.config.inputSelector || '#searchInput'}').value='${s}'">${s}</button>`).join('')}
            </div>
          </div>
        `;
      } else {
        this.resultsContainer.innerHTML = `
          <div class="contact-fallback">
            <p>${fallback.message}</p>
            <a href="tel:+39${fallback.phone?.replace(/\s/g, '')}" class="btn btn-primary">${fallback.cta || 'Chiama'}</a>
          </div>
        `;
      }
    }
    
    // =============================================
    // VISIBILITY CONTROL
    // =============================================
    
    showAutocomplete() {
      if (this.autocompleteContainer) {
        this.autocompleteContainer.style.display = 'block';
        this.isOpen = true;
      }
    }
    
    hideAutocomplete() {
      if (this.autocompleteContainer) {
        this.autocompleteContainer.style.display = 'none';
      }
    }
    
    showPanel(query) {
      if (this.panel) {
        this.panel.classList.add('active');
        const queryDisplay = this.panel.querySelector('#unified-search-query-display');
        if (queryDisplay) queryDisplay.textContent = query;
      }
      if (this.overlay) {
        this.overlay.classList.add('active');
      }
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }
    
    hidePanel() {
      if (this.panel) this.panel.classList.remove('active');
      if (this.overlay) this.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    close() {
      this.hideAutocomplete();
      this.hidePanel();
      this.isOpen = false;
    }
  }
  
  // =============================================
  // FACTORY FUNCTION
  // =============================================
  
  function create(options) {
    return new Adapter(options);
  }
  
  // =============================================
  // AUTO-INITIALIZE
  // =============================================
  
  // Auto-initialize for common page types
  function autoInit() {
    // Check if we're on a page with search
    const heroInput = document.getElementById('hero-search-input');
    const labInput = document.getElementById('searchInput');
    const headerInput = document.getElementById('header-search-input');
    
    // Home page with hero search
    if (heroInput) {
      create({
        mode: 'full',
        inputSelector: '#hero-search-input',
        showPanel: true
      });
    }
    
    // Lab page
    if (labInput && !heroInput) {
      // Don't auto-init if there's inline performSearch
      // Let the page handle it
      console.log('[SearchAdapter] Lab input detected - manual init recommended');
    }
    
    // Header search (any page)
    if (headerInput) {
      create({
        mode: 'compact',
        inputSelector: '#header-search-input',
        showPanel: true
      });
    }
  }
  
  // Run auto-init on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }
  
  // =============================================
  // PUBLIC API
  // =============================================
  
  return {
    create: create,
    Adapter: Adapter
  };
  
})();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchUIAdapter;
}

console.log('[SearchUIAdapter] Ready');
