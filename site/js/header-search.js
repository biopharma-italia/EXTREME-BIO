/**
 * BIO-CLINIC Header Search Component
 * Auto-injects search functionality into header across all pages
 */

(function() {
  'use strict';

  // Check if search.js is loaded
  const waitForSearch = () => {
    return new Promise((resolve) => {
      if (window.bioClinicSearch) {
        resolve(window.bioClinicSearch);
      } else {
        // Wait and check again
        const interval = setInterval(() => {
          if (window.bioClinicSearch) {
            clearInterval(interval);
            resolve(window.bioClinicSearch);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(interval);
          resolve(null);
        }, 5000);
      }
    });
  };

  // Inject search button into header
  const injectHeaderSearch = async () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Check if already injected
    if (document.getElementById('header-search-toggle')) return;

    // Create search toggle button
    const searchToggle = document.createElement('button');
    searchToggle.id = 'header-search-toggle';
    searchToggle.className = 'header-search-toggle';
    searchToggle.setAttribute('aria-label', 'Cerca');
    searchToggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    `;

    // Create expanded search container
    const searchExpanded = document.createElement('div');
    searchExpanded.id = 'header-search-expanded';
    searchExpanded.className = 'header-search-expanded';
    searchExpanded.innerHTML = `
      <div class="search-input-wrapper">
        <input type="text" id="header-search-input" class="search-input" 
               placeholder="Cerca prestazioni, medici, esami..." 
               autocomplete="off" aria-label="Cerca">
        <button class="search-btn" aria-label="Cerca">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
      </div>
      <div id="header-autocomplete" class="search-autocomplete"></div>
    `;

    // Create wrapper
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'header-search';
    searchWrapper.appendChild(searchToggle);
    searchWrapper.appendChild(searchExpanded);

    // Find the right place to insert (before the CTA button)
    const ctaBtn = nav.querySelector('.btn.btn-primary');
    if (ctaBtn) {
      nav.insertBefore(searchWrapper, ctaBtn);
    } else {
      nav.appendChild(searchWrapper);
    }

    // Inject search results panel if not exists
    if (!document.getElementById('search-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'search-overlay';
      overlay.className = 'search-overlay';
      document.body.appendChild(overlay);
    }

    if (!document.getElementById('search-results-panel')) {
      const panel = document.createElement('div');
      panel.id = 'search-results-panel';
      panel.className = 'search-results-panel';
      panel.innerHTML = `
        <div class="search-results-header">
          <h3>Risultati della ricerca</h3>
          <button id="search-results-close" class="search-results-close" aria-label="Chiudi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="search-results-content" class="search-results-content"></div>
      `;
      document.body.appendChild(panel);
    }

    // Wait for search engine and re-bind
    const search = await waitForSearch();
    if (search) {
      search.bindElements();
      search.bindEvents();
    }

    // Add CSS for header search toggle styling
    addHeaderSearchStyles();
  };

  // Add necessary styles
  const addHeaderSearchStyles = () => {
    if (document.getElementById('header-search-styles')) return;

    const style = document.createElement('style');
    style.id = 'header-search-styles';
    style.textContent = `
      .header-search {
        position: relative;
        display: flex;
        align-items: center;
        margin-right: 1rem;
      }
      
      .header-search-toggle {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s ease;
      }
      
      .header-search-toggle:hover {
        background: var(--gray-100);
      }
      
      .header-search-toggle svg {
        width: 20px;
        height: 20px;
        stroke: var(--gray-600);
      }
      
      .header-search-expanded {
        position: absolute;
        top: 100%;
        right: 0;
        width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        padding: 1rem;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        z-index: 1000;
      }
      
      .header-search-expanded.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(5px);
      }
      
      @media (max-width: 768px) {
        .header-search-expanded {
          width: calc(100vw - 2rem);
          right: -1rem;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeaderSearch);
  } else {
    injectHeaderSearch();
  }
})();
