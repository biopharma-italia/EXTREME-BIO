/**
 * BIO-CLINIC SEARCH UI v4.1.0
 * ============================
 * Single UI controller for ALL pages (home, lab, specialty pages).
 * Connects to BioSearchEngine v4.1.
 *
 * Replaces ALL previous UI files:
 *   search-ui.js, search-ui-adapter.js, search-controller.js,
 *   header-search.js, lab-search.js
 *
 * Modes:
 * - 'home'   : Hero search on homepage (full dropdown with sections)
 * - 'lab'    : Lab page search (exam-focused results)
 * - 'header' : Compact header search on any page
 *
 * Features:
 * - Debounced input
 * - Full keyboard navigation (arrows, enter, escape)
 * - Section-grouped results with type badges
 * - Price/category/turnaround for lab exams
 * - No-results fallback with suggestions + phone CTA
 * - Suggestion tag support (data-bs-query attribute)
 * - Auto-injects header search if not present
 * - Mobile responsive
 * - XSS-safe HTML escaping
 * - Analytics integration (gtag)
 *
 * @version 4.1.0
 * @date 2026-02-16
 * (c) 2026 Bio-Clinic Sassari - bio-clinic.it
 */

var BioSearchUI = (function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     TYPE METADATA
     ═══════════════════════════════════════════════════════════════ */
  var TYPE_META = {
    specialty:  { label: 'Specialit\u00e0',  icon: '\uD83C\uDFE5', cta: 'Scopri',  css: 'specialty' },
    procedure:  { label: 'Prestazione',      icon: '\uD83E\uDE7A', cta: 'Prenota', css: 'procedure' },
    exam:       { label: 'Esame',            icon: '\uD83E\uDDEA', cta: 'Prenota', css: 'exam' },
    pack:       { label: 'Check-up',         icon: '\uD83D\uDCE6', cta: 'Scopri',  css: 'pack' },
    pathway:    { label: 'Percorso',         icon: '\uD83C\uDFAF', cta: 'Scopri',  css: 'pathway' },
    physician:  { label: 'Medico',           icon: '\uD83D\uDC68\u200D\u2695\uFE0F', cta: 'Profilo', css: 'physician' }
  };

  var SECTION_ORDER = {
    home:   ['pathways', 'specialties', 'procedures', 'exams', 'physicians', 'packs'],
    lab:    ['exams', 'packs', 'specialties', 'procedures', 'pathways', 'physicians'],
    header: ['specialties', 'procedures', 'exams', 'pathways', 'physicians', 'packs']
  };

  var SECTION_TITLES = {
    specialties: 'Specialit\u00e0',
    procedures:  'Prestazioni',
    exams:       'Esami di Laboratorio',
    packs:       'Check-up e Pacchetti',
    pathways:    'Percorsi Consigliati',
    physicians:  'I Nostri Specialisti'
  };

  /* ═══════════════════════════════════════════════════════════════
     HTML ESCAPING (XSS protection)
     ═══════════════════════════════════════════════════════════════ */
  var escDiv = null;
  function esc(s) {
    if (!s) return '';
    if (!escDiv) escDiv = document.createElement('div');
    escDiv.textContent = s;
    return escDiv.innerHTML;
  }

  function escAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  }

  function highlightText(text, query) {
    if (!text || !query) return esc(text);
    var lower = text.toLowerCase();
    var qLower = query.toLowerCase().trim();
    var pos = lower.indexOf(qLower);
    if (pos === -1) return esc(text);
    return esc(text.substring(0, pos)) +
      '<mark>' + esc(text.substring(pos, pos + qLower.length)) + '</mark>' +
      esc(text.substring(pos + qLower.length));
  }

  /* ═══════════════════════════════════════════════════════════════
     SUBTITLE GENERATORS
     ═══════════════════════════════════════════════════════════════ */
  function getSubtitle(item) {
    switch (item.type) {
      case 'exam':
        var parts = [];
        if (item.price != null && item.price > 0) parts.push('\u20AC ' + Number(item.price).toFixed(2));
        if (item.category) parts.push(item.category);
        if (item.turnaround) parts.push('Referto: ' + item.turnaround);
        return parts.join(' \u2022 ');
      case 'physician':
        return item.jobTitle || item.title || '';
      case 'procedure':
        var pParts = [];
        if (item.duration) pParts.push('~' + item.duration + ' min');
        if (item.price) pParts.push(item.price);
        return pParts.join(' \u2022 ');
      case 'pack':
        var pkParts = [];
        if (item.target) pkParts.push(item.target);
        if (item.savings) pkParts.push('Risparmia ' + item.savings + '%');
        if (item.price) pkParts.push('\u20AC ' + item.price);
        return pkParts.join(' \u2022 ');
      case 'pathway':
        return item.description || '';
      case 'specialty':
        return item.description || '';
      default:
        return '';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     SEARCH UI INSTANCE
     ═══════════════════════════════════════════════════════════════ */
  function SearchUIInstance(inputEl, opts) {
    this.input = inputEl;
    this.mode = opts.mode || 'home';
    this.debounceMs = opts.debounceMs || 150;
    this.minQuery = opts.minQuery || 2;
    this.onNavigate = opts.onNavigate || null;

    this.timer = null;
    this.selectedIdx = -1;
    this.itemEls = [];
    this.isOpen = false;
    this.dropdown = null;
    this.lastQuery = '';

    this._createDropdown();
    this._bind();
  }

  SearchUIInstance.prototype._createDropdown = function() {
    // Remove any existing dropdown for this input
    var wrapper = this.input.closest('.bs-search-wrap') || this.input.parentElement;
    var existing = wrapper.querySelector('.bs-dropdown');
    if (existing) existing.remove();

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'bs-dropdown bs-dropdown--' + this.mode;
    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-label', 'Risultati ricerca');
    this.dropdown.style.display = 'none';

    wrapper.style.position = 'relative';
    wrapper.appendChild(this.dropdown);
  };

  SearchUIInstance.prototype._bind = function() {
    var self = this;

    this.input.addEventListener('input', function() { self._onInput(); });
    this.input.addEventListener('keydown', function(e) { self._onKeydown(e); });
    this.input.addEventListener('focus', function() { self._onFocus(); });

    // Close on click outside
    document.addEventListener('click', function(e) {
      if (!self.input.contains(e.target) && !self.dropdown.contains(e.target)) {
        self._close();
      }
    });

    // Suggestion tags (both data-bs-query and data-search-suggestion and data-query)
    var container = this.input.closest('section') || this.input.closest('.bs-search-section') || document;
    var tags = container.querySelectorAll('[data-bs-query], [data-search-suggestion], [data-query]');
    tags.forEach(function(tag) {
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        var q = tag.dataset.bsQuery || tag.dataset.searchSuggestion || tag.dataset.query || '';
        if (q) {
          self.input.value = q;
          self.input.focus();
          self._doSearch(q);
        }
      });
    });

    // Form submission prevention
    var form = this.input.closest('form');
    if (form) {
      form.addEventListener('submit', function(e) { e.preventDefault(); });
    }
  };

  SearchUIInstance.prototype._onInput = function() {
    var self = this;
    clearTimeout(this.timer);
    var q = this.input.value.trim();
    if (q.length < this.minQuery) {
      this._close();
      return;
    }
    this.timer = setTimeout(function() { self._doSearch(q); }, this.debounceMs);
  };

  SearchUIInstance.prototype._onFocus = function() {
    var q = this.input.value.trim();
    if (q.length >= this.minQuery && this.itemEls.length > 0) {
      this._open();
    }
  };

  SearchUIInstance.prototype._onKeydown = function(e) {
    if (!this.isOpen) return;
    var els = this.itemEls;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIdx = Math.min(this.selectedIdx + 1, els.length - 1);
        this._highlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIdx = Math.max(this.selectedIdx - 1, -1);
        this._highlight();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIdx >= 0 && els[this.selectedIdx]) {
          this._navigate(els[this.selectedIdx].dataset.url);
        }
        break;
      case 'Escape':
        this._close();
        this.input.blur();
        break;
    }
  };

  SearchUIInstance.prototype._highlight = function() {
    var self = this;
    this.itemEls.forEach(function(el, i) {
      el.classList.toggle('bs-item--active', i === self.selectedIdx);
    });
    if (this.selectedIdx >= 0 && this.itemEls[this.selectedIdx]) {
      this.itemEls[this.selectedIdx].scrollIntoView({ block: 'nearest' });
    }
  };

  SearchUIInstance.prototype._navigate = function(url) {
    if (!url || url === '#') return;
    this._close();

    // Analytics
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'search_click', {
          search_term: this.input.value,
          clicked_url: url,
          search_mode: this.mode
        });
      }
    } catch (e) { /* ignore analytics errors */ }

    if (this.onNavigate) this.onNavigate(url);
    window.location.href = url;
  };

  SearchUIInstance.prototype._doSearch = function(query) {
    if (typeof BioSearchEngine === 'undefined') {
      console.warn('[BioSearchUI] BioSearchEngine not loaded');
      return;
    }

    var self = this;
    var context = this.mode === 'lab' ? 'lab' : null;

    // Ensure engine is ready
    BioSearchEngine.init().then(function() {
      var result = BioSearchEngine.search(query, context);
      self.lastQuery = query;
      self.selectedIdx = -1;
      self._render(result, query);
      self._open();

      // Analytics
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'search', {
            search_term: query,
            results_count: result.totalCount,
            search_mode: self.mode
          });
        }
      } catch (e) { /* ignore */ }
    });
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER RESULTS
     ═══════════════════════════════════════════════════════════════ */
  SearchUIInstance.prototype._render = function(result, query) {
    if (result.totalCount === 0) {
      this._renderEmpty(query, result.fallback);
      return;
    }

    var order = SECTION_ORDER[this.mode] || SECTION_ORDER.home;
    var html = '';
    var totalShown = 0;

    // Header with count
    html += '<div class="bs-header">';
    html += '<span class="bs-header__count">';
    html += result.totalCount + ' risultat' + (result.totalCount === 1 ? 'o' : 'i');
    html += '</span>';
    html += '</div>';

    // Sections
    var self = this;
    order.forEach(function(gk) {
      var items = result.groups[gk];
      if (!items || items.length === 0) return;

      html += '<div class="bs-section" data-section="' + gk + '">';
      html += '<div class="bs-section__title">' + (SECTION_TITLES[gk] || gk) + '</div>';

      items.forEach(function(item) {
        var meta = TYPE_META[item.type] || TYPE_META.exam;
        var subtitle = getSubtitle(item);
        var nameHtml = highlightText(item.name || '', query);
        var url = item.url || '#';

        html += '<div class="bs-item bs-item--' + meta.css + '" ';
        html += 'data-url="' + escAttr(url) + '" ';
        html += 'data-idx="' + totalShown + '" ';
        html += 'role="option" tabindex="-1">';

        html += '<span class="bs-item__icon">' + meta.icon + '</span>';
        html += '<div class="bs-item__body">';
        html += '<div class="bs-item__name">' + nameHtml + '</div>';
        if (subtitle) {
          html += '<div class="bs-item__sub">' + esc(subtitle) + '</div>';
        }
        html += '</div>';
        // Show CTA button for exam/procedure types, badge for others
        if (meta.cta === 'Prenota') {
          html += '<span class="bs-item__cta">' + esc(meta.cta) + ' \u2192</span>';
        } else {
          html += '<span class="bs-item__badge bs-badge--' + meta.css + '">' + esc(meta.cta || meta.label) + '</span>';
        }
        html += '</div>';

        totalShown++;
      });

      html += '</div>';
    });

    // Footer with CTA
    html += '<div class="bs-footer">';
    html += '<a href="tel:+390799561332" class="bs-footer__link">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">';
    html += '<path d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 5.18 2 2 0 015.11 3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 11.91a16 16 0 006 6l2.27-2.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>';
    html += '</svg>';
    html += ' Non trovi? Chiama <strong>079 956 1332</strong>';
    html += '</a>';
    html += '</div>';

    this.dropdown.innerHTML = html;
    this.itemEls = Array.from(this.dropdown.querySelectorAll('.bs-item'));

    // Bind clicks
    var navSelf = this;
    this.itemEls.forEach(function(el) {
      el.addEventListener('click', function() {
        navSelf._navigate(el.dataset.url);
      });
      el.addEventListener('mouseenter', function() {
        navSelf.itemEls.forEach(function(e) { e.classList.remove('bs-item--active'); });
        el.classList.add('bs-item--active');
      });
    });
  };

  SearchUIInstance.prototype._renderEmpty = function(query, fallback) {
    var html = '<div class="bs-empty">';
    html += '<div class="bs-empty__icon">\uD83D\uDD0D</div>';
    html += '<p class="bs-empty__msg">Nessun risultato per "<strong>' + esc(query) + '</strong>"</p>';

    if (fallback && fallback.suggestions && fallback.suggestions.length > 0) {
      html += '<p class="bs-empty__hint">Forse cercavi:</p>';
      html += '<div class="bs-empty__tags">';
      fallback.suggestions.forEach(function(s) {
        var meta = TYPE_META[s.type] || TYPE_META.specialty;
        html += '<a href="' + escAttr(s.url || '#') + '" class="bs-empty__tag">';
        html += meta.icon + ' ' + esc(s.name);
        html += '</a>';
      });
      html += '</div>';
    }

    html += '<div class="bs-empty__cta">';
    html += '<a href="tel:+390799561332">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">';
    html += '<path d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 5.18 2 2 0 015.11 3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 11.91a16 16 0 006 6l2.27-2.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>';
    html += '</svg>';
    html += ' Chiama <strong>079 956 1332</strong> per assistenza';
    html += '</a>';
    html += '</div>';
    html += '</div>';

    this.dropdown.innerHTML = html;
    this.itemEls = [];
  };

  SearchUIInstance.prototype._open = function() {
    this.dropdown.style.display = 'block';
    this.isOpen = true;
    this.input.setAttribute('aria-expanded', 'true');
  };

  SearchUIInstance.prototype._close = function() {
    this.dropdown.style.display = 'none';
    this.isOpen = false;
    this.selectedIdx = -1;
    this.input.setAttribute('aria-expanded', 'false');
  };

  SearchUIInstance.prototype.destroy = function() {
    this._close();
    if (this.dropdown && this.dropdown.parentElement) {
      this.dropdown.parentElement.removeChild(this.dropdown);
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     HEADER SEARCH INJECTION
     ═══════════════════════════════════════════════════════════════ */
  function injectHeaderSearch() {
    // Don't inject if already present
    if (document.getElementById('header-search-input')) return null;

    var nav = document.querySelector('.nav-links, .navbar-nav, nav ul');
    if (!nav) return null;

    var ctaBtn = document.querySelector('.btn-primary-nav, .cta-primary, nav .btn-primary');

    var wrapper = document.createElement('div');
    wrapper.className = 'bs-header-search bs-search-wrap';
    wrapper.innerHTML =
      '<button class="bs-header-toggle" aria-label="Cerca" type="button">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">' +
          '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
        '</svg>' +
      '</button>' +
      '<div class="bs-header-expand">' +
        '<input type="text" id="header-search-input" class="bs-header-input"' +
        ' placeholder="Cerca specialit\u00e0, esami, medici..."' +
        ' autocomplete="off" aria-expanded="false" aria-label="Cerca">' +
        '<button class="bs-header-close" type="button" aria-label="Chiudi">&times;</button>' +
      '</div>';

    if (ctaBtn && ctaBtn.parentElement) {
      ctaBtn.parentElement.insertBefore(wrapper, ctaBtn);
    } else {
      nav.appendChild(wrapper);
    }

    // Toggle behavior
    var toggle = wrapper.querySelector('.bs-header-toggle');
    var input = wrapper.querySelector('#header-search-input');
    var closeBtn = wrapper.querySelector('.bs-header-close');

    toggle.addEventListener('click', function() {
      wrapper.classList.toggle('bs-header-search--open');
      if (wrapper.classList.contains('bs-header-search--open')) {
        input.focus();
      }
    });

    closeBtn.addEventListener('click', function() {
      wrapper.classList.remove('bs-header-search--open');
      input.value = '';
    });

    return input;
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO-INIT
     ═══════════════════════════════════════════════════════════════ */
  var instances = [];

  function autoInit() {
    // 1. Home hero search
    var heroInput = document.getElementById('hero-search-input');
    if (heroInput) {
      instances.push(new SearchUIInstance(heroInput, { mode: 'home' }));
    }

    // 2. Lab search
    var labInput = document.getElementById('lab-search-input');
    if (labInput) {
      instances.push(new SearchUIInstance(labInput, { mode: 'lab' }));
    }

    // 3. Header search (inject if not present)
    var headerInput = document.getElementById('header-search-input');
    if (!headerInput) {
      headerInput = injectHeaderSearch();
    }
    if (headerInput) {
      instances.push(new SearchUIInstance(headerInput, { mode: 'header' }));
    }

    // 4. Generic data-bs-search inputs
    document.querySelectorAll('[data-bs-search]').forEach(function(el) {
      var mode = el.dataset.bsSearch || 'home';
      var alreadyBound = instances.some(function(inst) { return inst.input === el; });
      if (!alreadyBound) {
        instances.push(new SearchUIInstance(el, { mode: mode }));
      }
    });

    if (instances.length > 0) {
      console.log('[BioSearchUI] v4.1.0 initialized: ' + instances.length + ' instance(s)');
    }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════ */
  return {
    create: function(el, opts) { return new SearchUIInstance(el, opts || {}); },
    instances: function() { return instances; },
    SearchUIInstance: SearchUIInstance
  };
})();
