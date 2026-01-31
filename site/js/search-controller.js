/**
 * BIO-CLINIC SEARCH CONTROLLER
 * ============================
 * Controller che connette BioClinicUnifiedSearch alla UI
 * Gestisce: input, debounce, rendering, navigazione keyboard
 */

(function() {
  'use strict';

  // Configurazione
  const CONFIG = {
    debounceMs: 200,
    minQueryLength: 2,
    searchInputSelector: '#hero-search-input, #header-search-input, #search-input, .search-input, [data-search-input]',
    resultsContainerSelector: '#unified-search-content, .search-results-container, [data-search-results]',
    autocompleteSelector: '#hero-autocomplete, .search-autocomplete, .autocomplete-dropdown, [data-autocomplete]',
    // Nuovi selettori per il pannello unificato
    unifiedPanelSelector: '#unified-search-panel',
    unifiedOverlaySelector: '#unified-search-overlay',
    queryDisplaySelector: '#unified-search-query-display',
    resultsCountSelector: '.unified-results-count',
    fallbackSelector: '#unified-search-fallback'
  };

  // Stato
  let debounceTimer = null;
  let selectedIndex = -1;
  let currentResults = [];

  // Elementi DOM
  let searchInput = null;
  let resultsContainer = null;
  let autocompleteContainer = null;
  let unifiedPanel = null;
  let unifiedOverlay = null;
  let queryDisplay = null;
  let resultsCount = null;
  let fallbackContainer = null;

  /**
   * Inizializza il controller
   */
  function init() {
    // Trova elementi DOM
    searchInput = document.querySelector(CONFIG.searchInputSelector);
    resultsContainer = document.querySelector(CONFIG.resultsContainerSelector);
    autocompleteContainer = document.querySelector(CONFIG.autocompleteSelector);
    
    // Elementi pannello unificato
    unifiedPanel = document.querySelector(CONFIG.unifiedPanelSelector);
    unifiedOverlay = document.querySelector(CONFIG.unifiedOverlaySelector);
    queryDisplay = document.querySelector(CONFIG.queryDisplaySelector);
    resultsCount = document.querySelector(CONFIG.resultsCountSelector);
    fallbackContainer = document.querySelector(CONFIG.fallbackSelector);

    if (!searchInput) {
      console.warn('[SearchController] Nessun input di ricerca trovato');
      return;
    }

    // Crea container risultati se non esiste
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'search-results-container';
      resultsContainer.setAttribute('data-search-results', '');
      searchInput.parentNode.appendChild(resultsContainer);
    }

    // Crea autocomplete se non esiste
    if (!autocompleteContainer) {
      autocompleteContainer = document.createElement('div');
      autocompleteContainer.className = 'autocomplete-dropdown search-autocomplete';
      autocompleteContainer.setAttribute('data-autocomplete', '');
      searchInput.parentNode.appendChild(autocompleteContainer);
    }

    // Bind eventi
    bindEvents();
    
    // Bind eventi pannello unificato
    bindUnifiedPanelEvents();

    console.log('[SearchController] Inizializzato con pannello unificato');
  }

  /**
   * Bind eventi DOM
   */
  function bindEvents() {
    // Input: ricerca con debounce
    searchInput.addEventListener('input', handleInput);

    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeydown);

    // Focus/blur
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length >= CONFIG.minQueryLength) {
        showAutocomplete();
      }
    });

    // Click fuori chiude
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && 
          !resultsContainer.contains(e.target) &&
          !autocompleteContainer.contains(e.target)) {
        hideAll();
      }
    });

    // Form submit
    const form = searchInput.closest('form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  /**
   * Gestione input con debounce
   */
  function handleInput(e) {
    const query = e.target.value.trim();

    // Cancella timer precedente
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Nascondi se query troppo corta
    if (query.length < CONFIG.minQueryLength) {
      hideAll();
      return;
    }

    // Debounce
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, CONFIG.debounceMs);
  }

  /**
   * Esegue ricerca e mostra autocomplete
   */
  async function performSearch(query) {
    // Assicurati che il motore sia pronto
    if (typeof BioClinicUnifiedSearch === 'undefined') {
      console.error('[SearchController] BioClinicUnifiedSearch non disponibile');
      return;
    }

    await BioClinicUnifiedSearch.init();

    // Esegui autocomplete
    const suggestions = BioClinicUnifiedSearch.autocomplete(query);
    currentResults = suggestions;
    selectedIndex = -1;

    renderAutocomplete(suggestions);
    showAutocomplete();
  }

  /**
   * Renderizza autocomplete
   */
  function renderAutocomplete(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      autocompleteContainer.innerHTML = `
        <div class="autocomplete-empty">
          <span>Nessun suggerimento. Premi Invio per cercare.</span>
        </div>
      `;
      return;
    }

    const typeLabels = {
      specialty: 'Specialità',
      procedure: 'Prestazione',
      test: 'Esame',
      pathway: 'Percorso',
      pack: 'Check-up',
      physician: 'Medico'
    };

    let html = suggestions.map((item, index) => `
      <div class="autocomplete-item ${index === selectedIndex ? 'selected' : ''}" 
           data-index="${index}" 
           data-url="${item.url}">
        <span class="autocomplete-item__icon">${item.icon}</span>
        <span class="autocomplete-item__label">${item.label}</span>
        ${item.subtitle ? `<span class="autocomplete-item__subtitle">${item.subtitle}</span>` : ''}
        <span class="autocomplete-item__type">${typeLabels[item.type] || item.type}</span>
      </div>
    `).join('');

    autocompleteContainer.innerHTML = html;

    // Bind click su items
    autocompleteContainer.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.dataset.url;
        if (url && url !== '#') {
          window.location.href = url;
        }
      });
    });
  }

  /**
   * Keyboard navigation
   */
  function handleKeydown(e) {
    const items = autocompleteContainer.querySelectorAll('.autocomplete-item');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(items);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const url = items[selectedIndex].dataset.url;
          if (url && url !== '#') {
            window.location.href = url;
          }
        } else {
          // Esegui ricerca completa
          executeFullSearch();
        }
        break;
        
      case 'Escape':
        hideAll();
        searchInput.blur();
        break;
    }
  }

  /**
   * Aggiorna selezione visiva
   */
  function updateSelection(items) {
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
    });

    // Scroll into view se necessario
    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Submit form - ricerca completa
   */
  function handleSubmit(e) {
    e.preventDefault();
    executeFullSearch();
  }

  /**
   * Esegue ricerca completa e mostra risultati nel pannello unificato
   */
  async function executeFullSearch() {
    const query = searchInput.value.trim();
    
    if (query.length < CONFIG.minQueryLength) {
      return;
    }
    
    // Mostra pannello unificato se disponibile
    if (unifiedPanel && typeof BioClinicUnifiedSearch !== 'undefined') {
      await BioClinicUnifiedSearch.init();
      const result = BioClinicUnifiedSearch.search(query);
      
      hideAutocomplete();
      renderUnifiedResults(result);
      showUnifiedPanel();
      return;
    }

    // Fallback: usa il vecchio sistema
    if (typeof BioClinicUnifiedSearch !== 'undefined') {
      await BioClinicUnifiedSearch.init();
      const result = BioClinicUnifiedSearch.search(query);
      
      hideAutocomplete();
      renderFullResults(result);
      showResults();
    }
  }
  
  /**
   * Bind eventi per il pannello unificato
   */
  function bindUnifiedPanelEvents() {
    if (!unifiedPanel) return;
    
    // Pulsante chiudi
    const closeBtn = document.querySelector('#unified-search-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideUnifiedPanel);
    }
    
    // Overlay click
    if (unifiedOverlay) {
      unifiedOverlay.addEventListener('click', hideUnifiedPanel);
    }
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && unifiedPanel.classList.contains('active')) {
        hideUnifiedPanel();
      }
    });
  }
  
  /**
   * Renderizza risultati nel pannello unificato categorizzato
   */
  function renderUnifiedResults(searchResult) {
    if (!unifiedPanel || !searchResult) return;
    
    // Aggiorna query display
    if (queryDisplay) {
      queryDisplay.textContent = searchResult.query;
    }
    
    // Nascondi tutte le sezioni
    const sections = unifiedPanel.querySelectorAll('.unified-results-section');
    sections.forEach(s => s.style.display = 'none');
    
    // Nascondi fallback inizialmente
    if (fallbackContainer) {
      fallbackContainer.style.display = 'none';
    }
    
    let totalRendered = 0;
    
    // Mappa tipo -> sezione
    const sectionMap = {
      pathway: 'unified-results-pathways',
      specialty: 'unified-results-specialties',
      procedure: 'unified-results-procedures',
      test: 'unified-results-tests',
      physician: 'unified-results-physicians',
      pack: 'unified-results-packs'
    };
    
    // Raggruppa risultati per tipo
    const grouped = {};
    searchResult.allResults.forEach(item => {
      const type = item.type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });
    
    // Renderizza ogni gruppo
    Object.entries(grouped).forEach(([type, items]) => {
      const sectionId = sectionMap[type];
      if (!sectionId) return;
      
      const section = document.getElementById(sectionId);
      if (!section) return;
      
      const container = section.querySelector('.unified-section-items');
      if (!container) return;
      
      // Genera HTML per items (max 5 per categoria)
      const displayItems = items.slice(0, 5);
      container.innerHTML = displayItems.map(item => renderUnifiedItem(item)).join('');
      
      section.style.display = 'block';
      totalRendered += displayItems.length;
    });
    
    // Aggiorna conteggio
    if (resultsCount) {
      resultsCount.textContent = `${totalRendered} risultati trovati`;
    }
    
    // Gestisci fallback se nessun risultato
    if (totalRendered === 0 && searchResult.fallback) {
      showFallback(searchResult);
    }
    
    // Bind click sui risultati
    bindResultClicks();
  }
  
  /**
   * Renderizza singolo item nel pannello unificato
   */
  function renderUnifiedItem(item) {
    const ctaText = getCTAText(item.type);
    const ctaClass = getCTAClass(item.type);
    const icon = getTypeIcon(item.type);
    
    return `
      <div class="unified-result-item" data-type="${item.type}">
        <div class="unified-result-item__main">
          <span class="unified-result-item__icon">${icon}</span>
          <div class="unified-result-item__content">
            <a href="${item.url || '#'}" class="unified-result-item__title">${item.name}</a>
            ${item.specialty ? `<span class="unified-result-item__specialty">${item.specialty}</span>` : ''}
            ${item.description ? `<p class="unified-result-item__desc">${item.description.substring(0, 100)}...</p>` : ''}
          </div>
        </div>
        <a href="${item.url || '#'}" class="unified-result-item__cta ${ctaClass}">${ctaText}</a>
      </div>
    `;
  }
  
  /**
   * Mostra fallback con suggerimenti
   */
  function showFallback(searchResult) {
    if (!fallbackContainer) return;
    
    const fallbackText = fallbackContainer.querySelector('.unified-fallback-text');
    const fallbackSuggestions = fallbackContainer.querySelector('.unified-fallback-suggestions');
    
    if (fallbackText) {
      fallbackText.innerHTML = searchResult.fallback?.message || 
        `Non troviamo "<strong>${searchResult.query}</strong>" come voce specifica.`;
    }
    
    if (fallbackSuggestions && searchResult.fallback?.suggestions) {
      fallbackSuggestions.innerHTML = `
        <p>Forse cercavi:</p>
        <div class="unified-fallback-links">
          ${searchResult.fallback.suggestions.map(s => 
            `<a href="${s.url}" class="unified-fallback-link">${s.name}</a>`
          ).join('')}
        </div>
      `;
    }
    
    fallbackContainer.style.display = 'block';
  }
  
  /**
   * Helper: testo CTA per tipo
   */
  function getCTAText(type) {
    const map = {
      specialty: 'Scopri',
      procedure: 'Prenota',
      test: 'Dettagli',
      pathway: 'Scopri Percorso',
      pack: 'Vedi Pack',
      physician: 'Profilo'
    };
    return map[type] || 'Dettagli';
  }
  
  /**
   * Helper: classe CTA per tipo
   */
  function getCTAClass(type) {
    const map = {
      specialty: 'cta-specialty',
      procedure: 'cta-procedure',
      test: 'cta-test',
      pathway: 'cta-pathway',
      pack: 'cta-pack',
      physician: 'cta-physician'
    };
    return map[type] || '';
  }
  
  /**
   * Helper: icona per tipo
   */
  function getTypeIcon(type) {
    const map = {
      specialty: '🏥',
      procedure: '📋',
      test: '🧪',
      pathway: '📍',
      pack: '📦',
      physician: '👨‍⚕️'
    };
    return map[type] || '🔍';
  }
  
  /**
   * Bind click tracking sui risultati
   */
  function bindResultClicks() {
    const items = unifiedPanel.querySelectorAll('.unified-result-item a');
    items.forEach(el => {
      el.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'unified_search_click', {
            search_term: searchInput.value,
            clicked_url: el.href,
            result_type: el.closest('.unified-result-item')?.dataset.type
          });
        }
      });
    });
  }
  
  /**
   * Mostra pannello unificato
   */
  function showUnifiedPanel() {
    if (unifiedPanel) {
      unifiedPanel.classList.add('active');
      document.body.classList.add('unified-search-open');
    }
    if (unifiedOverlay) {
      unifiedOverlay.classList.add('active');
    }
  }
  
  /**
   * Nascondi pannello unificato
   */
  function hideUnifiedPanel() {
    if (unifiedPanel) {
      unifiedPanel.classList.remove('active');
      document.body.classList.remove('unified-search-open');
    }
    if (unifiedOverlay) {
      unifiedOverlay.classList.remove('active');
    }
  }

  /**
   * Renderizza risultati completi
   */
  function renderFullResults(searchResult) {
    if (!searchResult) {
      resultsContainer.innerHTML = '<div class="search-loading">Caricamento...</div>';
      return;
    }

    // Usa il renderer del motore
    const html = BioClinicUnifiedSearch.renderResults(searchResult);
    
    if (html) {
      resultsContainer.innerHTML = html;
    } else {
      resultsContainer.innerHTML = `
        <div class="search-fallback">
          <p>Nessun risultato per "${searchResult.query}"</p>
          <p class="search-fallback__contact">
            Hai bisogno di aiuto? 
            <a href="tel:+390799561332">Chiamaci</a>
          </p>
        </div>
      `;
    }

    // Bind click sui risultati
    resultsContainer.querySelectorAll('.search-item__link').forEach(el => {
      el.addEventListener('click', (e) => {
        // Track click
        if (typeof gtag === 'function') {
          gtag('event', 'search_result_click', {
            search_term: searchResult.query,
            clicked_url: el.href
          });
        }
      });
    });
  }

  /**
   * Mostra/nascondi elementi
   */
  function showAutocomplete() {
    autocompleteContainer.classList.add('active');
    resultsContainer.classList.remove('active');
  }

  function hideAutocomplete() {
    autocompleteContainer.classList.remove('active');
  }

  function showResults() {
    resultsContainer.classList.add('active');
    autocompleteContainer.classList.remove('active');
  }

  function hideResults() {
    resultsContainer.classList.remove('active');
  }

  function hideAll() {
    hideAutocomplete();
    hideResults();
    selectedIndex = -1;
  }

  // ===== INTEGRAZIONE CON HEADER SEARCH =====

  /**
   * Integra con il sistema di ricerca esistente nell'header
   * Cerca i selettori specifici del sito Bio-Clinic
   */
  function integrateWithHeader() {
    // Selettori specifici Bio-Clinic
    const headerSelectors = [
      '#hero-search-input',
      '#header-search-input',
      '.hero-search input',
      '.header-search input',
      '[data-bio-search]'
    ];

    headerSelectors.forEach(selector => {
      const input = document.querySelector(selector);
      if (input && input !== searchInput) {
        // Duplica binding per questo input
        input.addEventListener('input', (e) => {
          searchInput = input;
          handleInput(e);
        });
        input.addEventListener('keydown', (e) => {
          searchInput = input;
          handleKeydown(e);
        });
        input.addEventListener('focus', () => {
          searchInput = input;
          if (input.value.length >= CONFIG.minQueryLength) {
            performSearch(input.value);
          }
        });

        console.log('[SearchController] Integrato con:', selector);
      }
    });
  }

  // ===== PAGINA RISULTATI DEDICATA =====

  /**
   * Gestisce la pagina dei risultati di ricerca
   */
  function handleSearchResultsPage() {
    const resultsPageContainer = document.querySelector('.search-results-page');
    if (!resultsPageContainer) return;

    // Leggi query da URL
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (!query) {
      resultsPageContainer.innerHTML = `
        <div class="search-results-page__header">
          <h1>Ricerca</h1>
          <p>Inserisci un termine di ricerca per trovare specialità, prestazioni, medici e check-up.</p>
        </div>
      `;
      return;
    }

    // Mostra loading
    resultsPageContainer.innerHTML = `
      <div class="search-results-page__header">
        <h1 class="search-results-page__query">Risultati per: <strong>${query}</strong></h1>
      </div>
      <div class="search-loading">Ricerca in corso...</div>
    `;

    // Esegui ricerca
    setTimeout(async () => {
      if (typeof BioClinicUnifiedSearch !== 'undefined') {
        await BioClinicUnifiedSearch.init();
        const result = BioClinicUnifiedSearch.search(query);
        
        const html = BioClinicUnifiedSearch.renderResults(result);
        
        resultsPageContainer.innerHTML = `
          <div class="search-results-page__header">
            <h1 class="search-results-page__query">Risultati per: <strong>${query}</strong></h1>
            <p class="search-results-page__count">${result.totalCount} risultati trovati</p>
          </div>
          ${html || '<p>Nessun risultato trovato.</p>'}
        `;
      }
    }, 100);
  }

  // ===== INIEZIONE PANNELLO DINAMICO =====
  
  /**
   * Inietta il pannello risultati se non esiste nella pagina
   * Questo permette di non dover aggiungere HTML a tutte le pagine
   */
  function injectPanelIfNeeded() {
    // Controlla se il pannello esiste già
    if (document.getElementById('unified-search-panel')) {
      return; // Pannello già presente
    }
    
    // HTML del pannello da iniettare
    const panelHTML = `
      <div id="unified-search-overlay" class="unified-search-overlay"></div>
      <div id="unified-search-panel" class="unified-search-panel">
        <div class="unified-search-panel-header">
          <div class="unified-search-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3>Risultati per "<span id="unified-search-query-display"></span>"</h3>
          </div>
          <button id="unified-search-close" class="unified-search-close" aria-label="Chiudi pannello">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="unified-search-content" class="unified-search-content">
          <div id="unified-search-fallback" class="unified-search-fallback" style="display:none;">
            <div class="unified-fallback-icon">🔍</div>
            <p class="unified-fallback-text"></p>
            <div class="unified-fallback-suggestions"></div>
          </div>
          <section id="unified-results-pathways" class="unified-results-section" data-section="pathways" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Percorsi Consigliati
            </h4>
            <div class="unified-section-items"></div>
          </section>
          <section id="unified-results-specialties" class="unified-results-section" data-section="specialties" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Specialità
            </h4>
            <div class="unified-section-items"></div>
          </section>
          <section id="unified-results-procedures" class="unified-results-section" data-section="procedures" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Prestazioni
            </h4>
            <div class="unified-section-items"></div>
          </section>
          <section id="unified-results-tests" class="unified-results-section" data-section="tests" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M14.5 4h-5l-.5.67V9l-4.9 7.35A2 2 0 0 0 5.77 20h12.46a2 2 0 0 0 1.66-3.65L15 9V4.67L14.5 4z"/>
              </svg>
              Esami di Laboratorio
            </h4>
            <div class="unified-section-items"></div>
          </section>
          <section id="unified-results-physicians" class="unified-results-section" data-section="physicians" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              I Nostri Specialisti
            </h4>
            <div class="unified-section-items"></div>
          </section>
          <section id="unified-results-packs" class="unified-results-section" data-section="packs" style="display:none;">
            <h4 class="unified-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              Check-up e Pacchetti
              <span class="unified-section-badge">Risparmio</span>
            </h4>
            <div class="unified-section-items"></div>
          </section>
        </div>
        <div class="unified-search-panel-footer">
          <span class="unified-results-count">0 risultati trovati</span>
          <a href="tel:+390799561332" class="unified-cta-call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Non trovi? Chiama: 079 956 1332
          </a>
        </div>
      </div>
    `;
    
    // Inietta prima di </body>
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    // Aggiorna i riferimenti agli elementi
    unifiedPanel = document.getElementById('unified-search-panel');
    unifiedOverlay = document.getElementById('unified-search-overlay');
    queryDisplay = document.getElementById('unified-search-query-display');
    resultsCount = document.querySelector('.unified-results-count');
    fallbackContainer = document.getElementById('unified-search-fallback');
    resultsContainer = document.getElementById('unified-search-content');
    
    // Bind eventi del nuovo pannello
    bindUnifiedPanelEvents();
    
    console.log('[SearchController] Pannello iniettato dinamicamente');
  }

  // ===== INIZIALIZZAZIONE =====

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPanelIfNeeded();
      init();
      integrateWithHeader();
      handleSearchResultsPage();
    });
  } else {
    injectPanelIfNeeded();
    init();
    integrateWithHeader();
    handleSearchResultsPage();
  }

  // Export globale
  window.BioClinicSearchController = {
    init,
    search: executeFullSearch,
    hide: hideAll
  };

})();
