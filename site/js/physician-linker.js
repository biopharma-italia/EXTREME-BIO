/**
 * PHYSICIAN AUTO-LINKER
 * =====================
 * Trasforma automaticamente ogni menzione di un medico in un link cliccabile.
 * 
 * Funzionalità:
 * - Scansiona il DOM per nomi di medici
 * - Crea link alla pagina profilo dinamica
 * - Aggiunge tooltip con info rapide
 * - Supporta hover preview card
 * 
 * © Bio-Clinic Sassari
 */

const PhysicianLinker = (function() {
  'use strict';

  // =============================================
  // 1. CONFIGURATION
  // =============================================

  const CONFIG = {
    // Selettori da escludere (già linkati, header, nav, etc)
    excludeSelectors: [
      'a', 'button', 'script', 'style', 'head', 'nav', 
      '.no-auto-link', '[data-no-link]', 
      '.physician-card', '.related-card', '.team-card'
    ],
    
    // Classi CSS per i link creati
    linkClass: 'physician-link',
    
    // Base URL per profili
    profileBaseUrl: '/equipe/profilo.html',
    
    // Abilita hover card preview
    enableHoverCard: true,
    
    // Delay hover card (ms)
    hoverDelay: 300
  };

  // =============================================
  // 2. PHYSICIAN DATABASE (loaded dynamically)
  // =============================================

  let physicians = [];
  let physicianPatterns = [];
  let isLoaded = false;

  /**
   * Carica i dati dei medici
   */
  async function loadPhysicians() {
    if (isLoaded) return;

    try {
      const response = await fetch('/data/entities/physicians-complete.json');
      const data = await response.json();
      
      physicians = data.physicians || [];
      
      // Crea pattern di ricerca per ogni medico
      physicianPatterns = physicians.map(p => {
        // Varianti del nome da cercare
        const variants = [
          p.full_name,                          // "Dott. Francesco Dessole"
          p.name,                               // "Francesco Dessole"
          `Dr. ${p.name}`,                      // "Dr. Francesco Dessole"
          `${p.title} ${p.name}`,               // "Dott. Francesco Dessole"
          p.name.split(' ').reverse().join(' ') // "Dessole Francesco"
        ].filter(Boolean);

        // Aggiungi varianti con titoli alternativi
        if (p.title === 'Dott.') {
          variants.push(`Dr. ${p.name}`);
          variants.push(`Dottor ${p.name}`);
        }
        if (p.title === 'Dott.ssa') {
          variants.push(`Dr.ssa ${p.name}`);
          variants.push(`Dottoressa ${p.name}`);
        }
        if (p.title === 'Prof.') {
          variants.push(`Professor ${p.name}`);
          variants.push(`Professore ${p.name}`);
        }

        return {
          physician: p,
          variants: [...new Set(variants)], // Rimuovi duplicati
          regex: new RegExp(
            `\\b(${variants.map(v => escapeRegex(v)).join('|')})\\b`,
            'gi'
          )
        };
      });

      // Ordina per lunghezza nome (più lungo prima per evitare match parziali)
      physicianPatterns.sort((a, b) => 
        Math.max(...b.variants.map(v => v.length)) - 
        Math.max(...a.variants.map(v => v.length))
      );

      isLoaded = true;
      console.log(`[PhysicianLinker] Loaded ${physicians.length} physicians`);
      
    } catch (error) {
      console.error('[PhysicianLinker] Failed to load physicians:', error);
    }
  }

  /**
   * Escape special regex characters
   */
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // =============================================
  // 3. DOM SCANNING & LINKING
  // =============================================

  /**
   * Scansiona e linka tutti i nomi dei medici nel documento
   */
  async function linkAll(rootElement = document.body) {
    await loadPhysicians();
    
    if (!isLoaded || physicians.length === 0) {
      console.warn('[PhysicianLinker] No physicians loaded');
      return;
    }

    // Ottieni tutti i nodi di testo
    const walker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Salta nodi vuoti o con solo whitespace
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Salta nodi in elementi esclusi
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const isExcluded = CONFIG.excludeSelectors.some(sel => {
            try {
              return parent.matches(sel) || parent.closest(sel);
            } catch {
              return false;
            }
          });
          
          if (isExcluded) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Processa ogni nodo di testo
    let linksCreated = 0;
    
    textNodes.forEach(textNode => {
      const result = processTextNode(textNode);
      if (result) {
        linksCreated += result;
      }
    });

    console.log(`[PhysicianLinker] Created ${linksCreated} links`);
    
    // Setup hover cards se abilitato
    if (CONFIG.enableHoverCard) {
      setupHoverCards();
    }

    return linksCreated;
  }

  /**
   * Processa un singolo nodo di testo
   */
  function processTextNode(textNode) {
    const text = textNode.textContent;
    let modified = false;
    let linksCreated = 0;
    
    // Cerca match per ogni pattern medico
    let resultHTML = text;
    const matches = [];
    
    physicianPatterns.forEach(({ physician, regex }) => {
      let match;
      const localRegex = new RegExp(regex.source, regex.flags);
      
      while ((match = localRegex.exec(text)) !== null) {
        matches.push({
          physician,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }
    });

    // Rimuovi match sovrapposti (mantieni il più lungo)
    const filteredMatches = [];
    matches.sort((a, b) => a.start - b.start);
    
    matches.forEach(match => {
      const overlaps = filteredMatches.some(existing => 
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end)
      );
      
      if (!overlaps) {
        filteredMatches.push(match);
      }
    });

    if (filteredMatches.length === 0) return 0;

    // Costruisci HTML con link
    let lastIndex = 0;
    const parts = [];
    
    filteredMatches.forEach(match => {
      // Testo prima del match
      if (match.start > lastIndex) {
        parts.push(escapeHTML(text.substring(lastIndex, match.start)));
      }
      
      // Link al medico
      const link = createPhysicianLink(match.physician, match.text);
      parts.push(link);
      linksCreated++;
      
      lastIndex = match.end;
    });
    
    // Testo dopo l'ultimo match
    if (lastIndex < text.length) {
      parts.push(escapeHTML(text.substring(lastIndex)));
    }

    // Sostituisci il nodo di testo con gli elementi creati
    if (linksCreated > 0) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = parts.join('');
      textNode.replaceWith(...wrapper.childNodes);
    }

    return linksCreated;
  }

  /**
   * Crea HTML per il link al medico
   */
  function createPhysicianLink(physician, displayText) {
    const profileUrl = `${CONFIG.profileBaseUrl}?id=${physician.slug}`;
    const staticPageUrl = `/equipe/${physician.slug}.html`;
    
    // Usa la pagina statica se esiste, altrimenti profilo dinamico
    const href = staticPageUrl;
    
    const isFemale = physician.title?.includes('ssa');
    const emoji = isFemale ? '👩‍⚕️' : '👨‍⚕️';
    
    return `<a href="${href}" 
               class="${CONFIG.linkClass}" 
               data-physician-id="${physician.id}"
               data-physician-name="${escapeHTML(physician.full_name)}"
               data-physician-specialty="${escapeHTML(physician.job_title)}"
               title="Vedi profilo di ${escapeHTML(physician.full_name)}"
               >${displayText}</a>`;
  }

  /**
   * Escape HTML entities
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =============================================
  // 4. HOVER CARDS
  // =============================================

  let hoverCard = null;
  let hoverTimeout = null;

  /**
   * Setup hover cards per i link dei medici
   */
  function setupHoverCards() {
    // Crea hover card container
    if (!hoverCard) {
      hoverCard = document.createElement('div');
      hoverCard.className = 'physician-hover-card';
      hoverCard.innerHTML = `
        <div class="phc-header">
          <div class="phc-photo"></div>
          <div class="phc-info">
            <div class="phc-name"></div>
            <div class="phc-specialty"></div>
          </div>
        </div>
        <div class="phc-actions">
          <a href="#" class="phc-btn-profile">Vedi Profilo</a>
          <a href="tel:+390799561332" class="phc-btn-call">Chiama</a>
        </div>
      `;
      document.body.appendChild(hoverCard);
    }

    // Bind events ai link
    document.querySelectorAll(`.${CONFIG.linkClass}`).forEach(link => {
      link.addEventListener('mouseenter', handleLinkHover);
      link.addEventListener('mouseleave', handleLinkLeave);
    });

    // Hide on card leave
    hoverCard.addEventListener('mouseleave', hideHoverCard);
    hoverCard.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
    });
  }

  function handleLinkHover(e) {
    const link = e.target;
    const physicianId = link.dataset.physicianId;
    const physician = physicians.find(p => p.id === physicianId);
    
    if (!physician) return;

    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      showHoverCard(link, physician);
    }, CONFIG.hoverDelay);
  }

  function handleLinkLeave() {
    hoverTimeout = setTimeout(hideHoverCard, 200);
  }

  function showHoverCard(anchor, physician) {
    const isFemale = physician.title?.includes('ssa');
    const emoji = isFemale ? '👩‍⚕️' : '👨‍⚕️';
    
    hoverCard.querySelector('.phc-photo').textContent = emoji;
    hoverCard.querySelector('.phc-name').textContent = physician.full_name;
    hoverCard.querySelector('.phc-specialty').textContent = physician.job_title;
    hoverCard.querySelector('.phc-btn-profile').href = `/equipe/${physician.slug}.html`;
    
    // Position card
    const rect = anchor.getBoundingClientRect();
    const cardRect = hoverCard.getBoundingClientRect();
    
    let top = rect.bottom + 10;
    let left = rect.left;
    
    // Adjust if overflows viewport
    if (left + 280 > window.innerWidth) {
      left = window.innerWidth - 290;
    }
    if (top + 150 > window.innerHeight) {
      top = rect.top - 160;
    }
    
    hoverCard.style.top = `${top + window.scrollY}px`;
    hoverCard.style.left = `${left}px`;
    hoverCard.classList.add('active');
  }

  function hideHoverCard() {
    hoverCard?.classList.remove('active');
  }

  // =============================================
  // 5. CSS INJECTION
  // =============================================

  function injectStyles() {
    if (document.getElementById('physician-linker-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'physician-linker-styles';
    style.textContent = `
      /* Physician Link */
      .physician-link {
        color: var(--primary, #00A651);
        font-weight: 600;
        text-decoration: none;
        border-bottom: 1px dotted var(--primary, #00A651);
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .physician-link:hover {
        color: var(--primary-dark, #008c44);
        border-bottom-style: solid;
      }
      
      /* Hover Card */
      .physician-hover-card {
        position: absolute;
        z-index: 10000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        padding: 1rem;
        width: 280px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px);
        transition: all 0.2s ease;
        pointer-events: none;
      }
      
      .physician-hover-card.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
      }
      
      .phc-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      
      .phc-photo {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00A651, #26A69A);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }
      
      .phc-name {
        font-weight: 700;
        color: #1f2937;
        font-size: 0.95rem;
      }
      
      .phc-specialty {
        color: #6b7280;
        font-size: 0.85rem;
      }
      
      .phc-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .phc-btn-profile,
      .phc-btn-call {
        flex: 1;
        padding: 0.5rem;
        text-align: center;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s;
      }
      
      .phc-btn-profile {
        background: var(--primary, #00A651);
        color: white;
      }
      
      .phc-btn-profile:hover {
        background: #008c44;
      }
      
      .phc-btn-call {
        background: #f3f4f6;
        color: #374151;
      }
      
      .phc-btn-call:hover {
        background: #e5e7eb;
      }
    `;
    
    document.head.appendChild(style);
  }

  // =============================================
  // 6. PUBLIC API
  // =============================================

  // Inject styles on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  return {
    // Core
    linkAll,
    loadPhysicians,
    
    // Utilities
    getPhysicians: () => physicians,
    isLoaded: () => isLoaded,
    
    // Config
    CONFIG,
    
    // Version
    version: '1.0.0'
  };

})();

// Auto-run on DOM ready (can be disabled with data attribute)
document.addEventListener('DOMContentLoaded', () => {
  // Check if auto-link is disabled
  if (document.body.dataset.noPhysicianAutoLink) {
    console.log('[PhysicianLinker] Auto-link disabled');
    return;
  }
  
  // Run after a small delay to ensure page is rendered
  setTimeout(() => {
    PhysicianLinker.linkAll();
  }, 100);
});

// Export
window.PhysicianLinker = PhysicianLinker;
