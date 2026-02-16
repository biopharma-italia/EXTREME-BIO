/**
 * BIO-CLINIC LAB SEARCH CONTROLLER
 * ==================================
 * Version: 1.0.0 — 2026-02-16
 * 
 * Connects the lab search bar to BioClinicUnifiedSearch engine.
 * Focused on: lab exams, packs, categories.
 * Falls back to full search for specialties/procedures.
 * 
 * Dependencies: unified-search.js (BioClinicUnifiedSearch)
 */

(function() {
  'use strict';

  const CONFIG = {
    debounceMs: 200,
    minQueryLength: 2,
    maxAutocomplete: 10,
    maxExamResults: 15
  };

  let debounceTimer = null;
  let selectedIndex = -1;
  let currentSuggestions = [];
  let labInput = null;
  let autocompleteEl = null;
  let isOpen = false;

  /**
   * Initialize lab search
   */
  async function init() {
    labInput = document.getElementById('lab-search-input');
    autocompleteEl = document.getElementById('lab-autocomplete');
    const searchBtn = document.getElementById('lab-search-btn');

    if (!labInput || !autocompleteEl) {
      return;
    }

    // Ensure engine is ready
    if (typeof BioClinicUnifiedSearch !== 'undefined') {
      await BioClinicUnifiedSearch.init();
    } else {
      console.warn('[LabSearch] BioClinicUnifiedSearch not available');
      return;
    }

    // Bind events
    labInput.addEventListener('input', handleInput);
    labInput.addEventListener('keydown', handleKeydown);
    labInput.addEventListener('focus', handleFocus);

    if (searchBtn) {
      searchBtn.addEventListener('click', executeSearch);
    }

    // Click outside closes
    document.addEventListener('click', (e) => {
      if (!labInput.contains(e.target) && !autocompleteEl.contains(e.target)) {
        hideAutocomplete();
      }
    });

    // Bind suggestion tags
    document.querySelectorAll('.lab-suggestion-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.dataset.query;
        if (query) {
          labInput.value = query;
          labInput.focus();
          performSearch(query);
        }
      });
      // Hover effect
      tag.addEventListener('mouseenter', () => {
        tag.style.borderColor = 'var(--primary, #00704A)';
        tag.style.color = 'var(--primary, #00704A)';
      });
      tag.addEventListener('mouseleave', () => {
        tag.style.borderColor = 'var(--gray-200, #e5e7eb)';
        tag.style.color = 'var(--text-dark)';
      });
    });

    // Handle URL query parameter
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery) {
      labInput.value = urlQuery;
      performSearch(urlQuery);
    }

    console.log('[LabSearch] v1.0.0 initialized');
  }

  /**
   * Input handler with debounce
   */
  function handleInput(e) {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < CONFIG.minQueryLength) {
      hideAutocomplete();
      return;
    }

    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, CONFIG.debounceMs);
  }

  /**
   * Focus handler
   */
  function handleFocus() {
    if (labInput.value.length >= CONFIG.minQueryLength && currentSuggestions.length > 0) {
      showAutocomplete();
    }
  }

  /**
   * Keyboard navigation
   */
  function handleKeydown(e) {
    const items = autocompleteEl.querySelectorAll('.lab-autocomplete-item');

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
          executeSearch();
        }
        break;

      case 'Escape':
        hideAutocomplete();
        labInput.blur();
        break;
    }
  }

  /**
   * Perform search and render results
   */
  function performSearch(query) {
    if (typeof BioClinicUnifiedSearch === 'undefined') return;

    const result = BioClinicUnifiedSearch.search(query);
    selectedIndex = -1;

    if (!result || result.totalCount === 0) {
      // No results — show helpful fallback
      renderNoResults(query, result?.fallback);
      showAutocomplete();
      return;
    }

    // Build suggestions focused on lab exams
    currentSuggestions = [];

    // 1. Tests first (primary for lab page)
    if (result.groups.tests) {
      result.groups.tests.slice(0, 6).forEach(item => {
        currentSuggestions.push({
          type: 'test',
          icon: '🧪',
          name: item.name,
          subtitle: item.price ? `€${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}` : (item.category || item.turnaround || ''),
          url: item.pageUrl || '/laboratorio/',
          badge: null
        });
      });
    }

    // 2. Packs (lab-relevant)
    if (result.groups.packs) {
      result.groups.packs.slice(0, 3).forEach(item => {
        currentSuggestions.push({
          type: 'pack',
          icon: '📦',
          name: item.name,
          subtitle: item.price ? `€${typeof item.price === 'number' ? item.price.toFixed(2) : item.price} — Risparmia!` : (item.description || ''),
          url: item.pageUrl || '/laboratorio/',
          badge: 'PACCHETTO'
        });
      });
    }

    // 3. Specialties (if user searches a specialty from lab page)
    if (result.groups.specialties) {
      result.groups.specialties.slice(0, 2).forEach(item => {
        currentSuggestions.push({
          type: 'specialty',
          icon: item.icon || '🏥',
          name: item.name,
          subtitle: 'Visita specialistica',
          url: item.pageUrl || `/${item.id}/`,
          badge: null
        });
      });
    }

    // 4. Procedures (if relevant)
    if (result.groups.procedures) {
      result.groups.procedures.slice(0, 2).forEach(item => {
        currentSuggestions.push({
          type: 'procedure',
          icon: '🩺',
          name: item.name,
          subtitle: item.duration ? `~${item.duration} min` : '',
          url: item.pageUrl || '#',
          badge: null
        });
      });
    }

    // 5. Pathways
    if (result.groups.pathways) {
      result.groups.pathways.slice(0, 1).forEach(item => {
        currentSuggestions.push({
          type: 'pathway',
          icon: '🎯',
          name: item.nameShort || item.name,
          subtitle: item.description || 'Percorso consigliato',
          url: item.pageUrl || '#',
          badge: 'PERCORSO'
        });
      });
    }

    renderAutocomplete(currentSuggestions, query, result.totalCount);
    showAutocomplete();

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'lab_search', {
        search_term: query,
        results_count: result.totalCount
      });
    }
  }

  /**
   * Execute full search (Enter or button click)
   */
  function executeSearch() {
    const query = labInput.value.trim();
    if (query.length < CONFIG.minQueryLength) return;
    performSearch(query);
  }

  /**
   * Render autocomplete dropdown
   */
  function renderAutocomplete(suggestions, query, totalCount) {
    if (!suggestions || suggestions.length === 0) {
      renderNoResults(query);
      return;
    }

    const typeLabels = {
      test: 'Esame',
      pack: 'Check-up',
      specialty: 'Specialità',
      procedure: 'Prestazione',
      pathway: 'Percorso'
    };

    let html = '<div class="lab-autocomplete-header" style="padding:0.75rem 1rem 0.5rem;border-bottom:1px solid var(--gray-200, #e5e7eb);display:flex;justify-content:space-between;align-items:center;">';
    html += `<span style="font-size:0.8rem;color:var(--text-light);">${totalCount} risultati per "${escapeHtml(query)}"</span>`;
    html += '</div>';

    suggestions.forEach((item, idx) => {
      const badgeHtml = item.badge 
        ? `<span style="background:var(--primary, #00704A);color:#fff;font-size:0.65rem;padding:0.1rem 0.4rem;border-radius:4px;font-weight:600;letter-spacing:0.03em;">${item.badge}</span>` 
        : `<span style="color:var(--text-light);font-size:0.75rem;">${typeLabels[item.type] || ''}</span>`;

      html += `
        <div class="lab-autocomplete-item ${idx === selectedIndex ? 'selected' : ''}" 
             data-index="${idx}" data-url="${item.url}"
             style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;cursor:pointer;transition:background 0.15s;border-bottom:1px solid var(--gray-100, #f3f4f6);">
          <span style="font-size:1.2rem;flex-shrink:0;width:28px;text-align:center;">${item.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:500;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${highlightMatch(item.name, query)}</div>
            ${item.subtitle ? `<div style="font-size:0.8rem;color:var(--text-light);margin-top:0.1rem;">${escapeHtml(item.subtitle)}</div>` : ''}
          </div>
          ${badgeHtml}
        </div>
      `;
    });

    // Footer with CTA
    html += `
      <div style="padding:0.75rem 1rem;background:var(--gray-50, #f9fafb);border-radius:0 0 12px 12px;text-align:center;">
        <a href="tel:+390799561332" style="color:var(--primary, #00704A);font-size:0.85rem;text-decoration:none;font-weight:500;">
          Non trovi l'esame? Chiama 079 956 1332
        </a>
      </div>
    `;

    autocompleteEl.innerHTML = html;

    // Bind click events
    autocompleteEl.querySelectorAll('.lab-autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.dataset.url;
        if (url && url !== '#') {
          window.location.href = url;
        }
      });
      el.addEventListener('mouseenter', () => {
        el.style.background = 'var(--gray-50, #f9fafb)';
        autocompleteEl.querySelectorAll('.lab-autocomplete-item').forEach((item, i) => {
          item.classList.toggle('selected', item === el);
          if (item === el) selectedIndex = i;
        });
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = '';
      });
    });
  }

  /**
   * Render no results
   */
  function renderNoResults(query, fallback) {
    let html = `
      <div style="padding:1.5rem 1rem;text-align:center;">
        <p style="color:var(--text-light);margin:0 0 0.5rem;">Nessun esame trovato per "<strong>${escapeHtml(query)}</strong>"</p>
    `;

    if (fallback && fallback.suggestions) {
      html += '<p style="font-size:0.85rem;color:var(--text-light);margin:0 0 0.75rem;">Forse cercavi:</p>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;">';
      
      if (fallback.suggestions.specialty) {
        html += `<a href="${fallback.suggestions.specialty.pageUrl || '#'}" style="background:var(--gray-100);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.85rem;color:var(--primary, #00704A);text-decoration:none;">🏥 ${fallback.suggestions.specialty.name}</a>`;
      }
      if (fallback.suggestions.pathways) {
        fallback.suggestions.pathways.forEach(pw => {
          html += `<a href="${pw.pageUrl || '#'}" style="background:var(--gray-100);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.85rem;color:var(--primary, #00704A);text-decoration:none;">🎯 ${pw.nameShort || pw.name}</a>`;
        });
      }
      
      html += '</div>';
    }

    html += `
        <p style="margin:1rem 0 0;font-size:0.9rem;">
          <a href="tel:+390799561332" style="color:var(--primary, #00704A);text-decoration:none;font-weight:500;">
            📞 Chiama il 079 956 1332 per assistenza
          </a>
        </p>
      </div>
    `;

    autocompleteEl.innerHTML = html;
    currentSuggestions = [];
  }

  /**
   * Selection update
   */
  function updateSelection(items) {
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
      el.style.background = idx === selectedIndex ? 'var(--gray-50, #f9fafb)' : '';
    });
    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Show/hide autocomplete
   */
  function showAutocomplete() {
    autocompleteEl.style.display = 'block';
    isOpen = true;
  }

  function hideAutocomplete() {
    autocompleteEl.style.display = 'none';
    isOpen = false;
    selectedIndex = -1;
  }

  /**
   * Utilities
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);
    if (index === -1) return escaped;
    
    return escapeHtml(text.substring(0, index)) + 
           '<mark style="background:rgba(0,112,74,0.12);color:inherit;padding:0 1px;border-radius:2px;">' + 
           escapeHtml(text.substring(index, index + query.length)) + '</mark>' +
           escapeHtml(text.substring(index + query.length));
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.BioClinicLabSearch = { init, search: executeSearch };
})();
