/**
 * BIO-SEARCH PRO - Clinical Recommendation Engine
 * ================================================
 * Version: 1.0.0
 * 
 * Motore di raccomandazione clinica lato client con:
 * - Ranking business-first (Pack > Specialisti > Esami)
 * - UI a Cluster (sezioni visive distinte)
 * - Red Flags Detection (gestione keyword critiche)
 * - Integrazione con BioClinicDB esistente
 * 
 * © Bio-Clinic Sassari
 */

const BioSearchPro = (function() {
  'use strict';

  // =============================================
  // 1. CONFIGURAZIONE
  // =============================================

  const CONFIG = {
    // Pesi per ranking business-first
    weights: {
      pack: 100,        // 🥇 Pacchetti - massima priorità
      pathway: 95,      // 🥇 Percorsi clinici (Slim Care, PMA)
      specialist: 80,   // 🥈 Specialisti/Medici
      procedure: 60,    // 🥉 Prestazioni/Visite
      exam: 50          // 🥉 Esami singoli
    },

    // Boost per match esatti
    boosts: {
      exactMatch: 50,
      startsWithMatch: 30,
      containsMatch: 10,
      synonymMatch: 15,
      symptomMatch: 25
    },

    // Red Flags - keyword che attivano modalità emergenza
    redFlags: [
      'tumore', 'cancro', 'neoplasia', 'metastasi',
      'hiv', 'aids', 'sieropositivo',
      'infarto', 'ictus', 'emergenza', 'urgenza', 'urgente',
      'emorragia', 'sangue nelle feci', 'sangue nelle urine',
      'dolore toracico', 'difficoltà respiratorie',
      'overdose', 'avvelenamento', 'suicidio',
      'violenza', 'abuso'
    ],

    // Limiti visualizzazione
    limits: {
      maxResults: 15,
      maxPerSection: 5,
      minQueryLength: 2,
      debounceMs: 150
    },

    // Contatti emergenza
    emergency: {
      phone: '079 956 1332',
      whatsapp: '393791234567', // Numero WhatsApp clinica
      message: 'Per queste necessità cliniche, ti consigliamo di contattare direttamente il nostro team medico per una valutazione prioritaria.'
    }
  };

  // =============================================
  // 2. STATE
  // =============================================

  let state = {
    isInitialized: false,
    currentQuery: '',
    lastResults: null,
    activeDropdown: null,
    selectedIndex: -1
  };

  // =============================================
  // 3. DATA ACCESS (integra con BioClinicDB)
  // =============================================

  /**
   * Ottieni tutti i dati cercabili
   */
  function getAllSearchableItems() {
    const items = [];

    // 1. PACCHETTI (priorità massima)
    if (window.BioClinicDB?.pacchetti) {
      BioClinicDB.pacchetti.forEach(pack => {
        items.push({
          type: 'pack',
          id: pack.id,
          name: pack.nome,
          description: pack.descrizione,
          price: pack.prezzo,
          icon: pack.icona || '📦',
          tags: pack.tags || [],
          keywords: [
            pack.nome.toLowerCase(),
            ...(pack.tags || []),
            ...(pack.esami_chiave || [])
          ],
          url: `/laboratorio/#pack-${pack.id}`,
          bookingType: 'whatsapp', // Pack sempre via WhatsApp
          meta: {
            esami_count: pack.esami_count,
            risparmio: pack.risparmio,
            target: pack.target
          }
        });
      });
    }

    // 2. PERCORSI CLINICI (pathway)
    const pathways = [
      {
        id: 'slim-care',
        name: 'Slim Care',
        description: 'Percorso dimagrimento con Wegovy e Mounjaro',
        icon: '🎯',
        tags: ['dimagrimento', 'peso', 'obesità', 'wegovy', 'mounjaro', 'ozempic'],
        url: '/pages/slim-care.html',
        bookingType: 'whatsapp',
        price: null,
        featured: true
      },
      {
        id: 'slim-care-donna',
        name: 'Slim Care Donna',
        description: 'Percorso dimagrimento specifico per donne con PCOS e menopausa',
        icon: '👩',
        tags: ['donna', 'pcos', 'menopausa', 'dimagrimento', 'peso'],
        url: '/pages/slim-care-donna.html',
        bookingType: 'whatsapp',
        price: null,
        featured: true
      },
      {
        id: 'pma-fertilita',
        name: 'PMA / Fertilità',
        description: 'Procreazione Medicalmente Assistita e percorsi fertilità',
        icon: '👶',
        tags: ['fertilità', 'pma', 'fecondazione', 'gravidanza', 'infertilità', 'icsi', 'fivet'],
        url: '/pages/pma-fertilita.html',
        bookingType: 'whatsapp',
        price: null,
        featured: true
      }
    ];

    pathways.forEach(p => {
      items.push({
        type: 'pathway',
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        icon: p.icon,
        tags: p.tags,
        keywords: [p.name.toLowerCase(), ...p.tags],
        url: p.url,
        bookingType: p.bookingType,
        featured: p.featured
      });
    });

    // 3. SPECIALISTI/MEDICI
    if (window.BioClinicDB?.config?.specialisti) {
      Object.entries(BioClinicDB.config.specialisti).forEach(([id, spec]) => {
        items.push({
          type: 'specialist',
          id: id,
          name: spec.nome,
          description: `Visita ${spec.nome}`,
          icon: '👨‍⚕️',
          tags: [id],
          keywords: [spec.nome.toLowerCase(), id],
          url: spec.link || `/equipe/?specialty=${id}`,
          bookingType: 'miodottore',
          price: null
        });
      });
    }

    // Aggiungi specialità dal database se disponibile
    const specialties = [
      { id: 'ginecologia', name: 'Ginecologia', icon: '👩‍⚕️', keywords: ['ginecologo', 'ginecologia', 'utero', 'ovaie', 'pap test'] },
      { id: 'cardiologia', name: 'Cardiologia', icon: '❤️', keywords: ['cardiologo', 'cardiologia', 'cuore', 'ecg', 'holter'] },
      { id: 'endocrinologia', name: 'Endocrinologia', icon: '🦋', keywords: ['endocrinologo', 'tiroide', 'diabete', 'ormoni'] },
      { id: 'dermatologia', name: 'Dermatologia', icon: '🔬', keywords: ['dermatologo', 'pelle', 'nei', 'nevi', 'acne'] },
      { id: 'neurologia', name: 'Neurologia', icon: '🧠', keywords: ['neurologo', 'cervello', 'emicrania', 'mal di testa'] },
      { id: 'ortopedia', name: 'Ortopedia', icon: '🦴', keywords: ['ortopedico', 'ossa', 'ginocchio', 'spalla', 'schiena'] },
      { id: 'oculistica', name: 'Oculistica', icon: '👁️', keywords: ['oculista', 'occhi', 'vista', 'miopia'] },
      { id: 'urologia', name: 'Urologia', icon: '🔵', keywords: ['urologo', 'prostata', 'psa', 'reni', 'vescica'] },
      { id: 'gastroenterologia', name: 'Gastroenterologia', icon: '🫁', keywords: ['gastroenterologo', 'stomaco', 'intestino', 'colon'] },
      { id: 'pneumologia', name: 'Pneumologia', icon: '🌬️', keywords: ['pneumologo', 'polmoni', 'asma', 'bronchi'] }
    ];

    specialties.forEach(spec => {
      // Evita duplicati
      if (!items.find(i => i.type === 'specialist' && i.id === spec.id)) {
        items.push({
          type: 'specialist',
          id: spec.id,
          name: spec.name,
          description: `Visita ${spec.name}`,
          icon: spec.icon,
          tags: spec.keywords,
          keywords: spec.keywords,
          url: `/pages/${spec.id}.html`,
          bookingType: 'miodottore',
          price: null
        });
      }
    });

    // 4. ESAMI LABORATORIO
    if (window.BioClinicDB?.listino) {
      BioClinicDB.listino.forEach(esame => {
        items.push({
          type: 'exam',
          id: esame.id,
          name: esame.nome,
          description: esame.cat,
          price: esame.prezzo,
          icon: '🧪',
          tags: esame.sintomi || [],
          keywords: [
            esame.nome.toLowerCase(),
            esame.cat?.toLowerCase(),
            ...(esame.sintomi || [])
          ].filter(Boolean),
          url: `/laboratorio/#esame-${esame.id}`,
          bookingType: 'direct', // Accesso diretto per lab
          meta: {
            prep: esame.prep,
            referto: esame.referto,
            urgente: esame.urgente,
            upsell: esame.upsell
          }
        });
      });
    }

    return items;
  }

  // =============================================
  // 4. ALGORITMO DI RANKING
  // =============================================

  /**
   * Calcola score di un item rispetto alla query
   */
  function calculateScore(item, query, queryWords) {
    let score = CONFIG.weights[item.type] || 0;
    const q = query.toLowerCase();
    const name = item.name.toLowerCase();

    // Exact match sul nome
    if (name === q) {
      score += CONFIG.boosts.exactMatch;
    }
    // Starts with
    else if (name.startsWith(q)) {
      score += CONFIG.boosts.startsWithMatch;
    }
    // Contains
    else if (name.includes(q)) {
      score += CONFIG.boosts.containsMatch;
    }

    // Match su keywords
    item.keywords.forEach(kw => {
      if (kw === q) score += 20;
      else if (kw.startsWith(q)) score += 15;
      else if (kw.includes(q)) score += 8;
    });

    // Match su ogni parola della query
    queryWords.forEach(word => {
      if (word.length < 2) return;
      
      if (name.includes(word)) score += 5;
      item.keywords.forEach(kw => {
        if (kw.includes(word)) score += 3;
      });
    });

    // Bonus per item featured
    if (item.featured) score += 20;

    // Bonus per sintomi (ricerca naturale)
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => {
        if (q.includes(tag) || tag.includes(q)) {
          score += CONFIG.boosts.symptomMatch;
        }
      });
    }

    return score;
  }

  /**
   * Esegui ricerca con ranking
   */
  function search(query) {
    if (!query || query.length < CONFIG.limits.minQueryLength) {
      return { results: [], hasRedFlag: false, query: query };
    }

    const q = query.toLowerCase().trim();
    const queryWords = q.split(/\s+/).filter(w => w.length >= 2);

    // Check Red Flags
    const hasRedFlag = CONFIG.redFlags.some(flag => q.includes(flag));

    // Get all items
    const allItems = getAllSearchableItems();

    // Score and filter
    const scored = allItems
      .map(item => ({
        ...item,
        score: calculateScore(item, q, queryWords)
      }))
      .filter(item => item.score > CONFIG.weights[item.type]) // Deve avere match
      .sort((a, b) => b.score - a.score);

    // Raggruppa per tipo
    const grouped = {
      packs: scored.filter(i => i.type === 'pack' || i.type === 'pathway'),
      specialists: scored.filter(i => i.type === 'specialist'),
      exams: scored.filter(i => i.type === 'exam')
    };

    return {
      results: scored.slice(0, CONFIG.limits.maxResults),
      grouped: grouped,
      hasRedFlag: hasRedFlag,
      query: query,
      total: scored.length
    };
  }

  // =============================================
  // 5. RENDERING UI
  // =============================================

  /**
   * Genera HTML per dropdown clustered
   */
  function renderClusteredDropdown(searchResult) {
    const { grouped, hasRedFlag, query } = searchResult;

    if (hasRedFlag) {
      return renderRedFlagAlert();
    }

    const sections = [];

    // Sezione Percorsi/Pack (priorità 1)
    if (grouped.packs.length > 0) {
      sections.push(`
        <div class="bio-search-section bio-search-packs">
          <div class="bio-search-section-header">
            <span class="bio-search-section-icon">⭐</span>
            <span class="bio-search-section-title">PERCORSI CONSIGLIATI</span>
          </div>
          <div class="bio-search-section-items">
            ${grouped.packs.slice(0, CONFIG.limits.maxPerSection).map((item, idx) => 
              renderSearchItem(item, idx)
            ).join('')}
          </div>
        </div>
      `);
    }

    // Sezione Specialisti (priorità 2)
    if (grouped.specialists.length > 0) {
      sections.push(`
        <div class="bio-search-section bio-search-specialists">
          <div class="bio-search-section-header">
            <span class="bio-search-section-icon">👨‍⚕️</span>
            <span class="bio-search-section-title">MEDICI SPECIALISTI</span>
          </div>
          <div class="bio-search-section-items">
            ${grouped.specialists.slice(0, CONFIG.limits.maxPerSection).map((item, idx) => 
              renderSearchItem(item, idx + grouped.packs.length)
            ).join('')}
          </div>
        </div>
      `);
    }

    // Sezione Esami (priorità 3)
    if (grouped.exams.length > 0) {
      sections.push(`
        <div class="bio-search-section bio-search-exams">
          <div class="bio-search-section-header">
            <span class="bio-search-section-icon">🔬</span>
            <span class="bio-search-section-title">ESAMI LABORATORIO</span>
          </div>
          <div class="bio-search-section-items">
            ${grouped.exams.slice(0, CONFIG.limits.maxPerSection).map((item, idx) => 
              renderSearchItem(item, idx + grouped.packs.length + grouped.specialists.length)
            ).join('')}
          </div>
        </div>
      `);
    }

    if (sections.length === 0) {
      return `
        <div class="bio-search-empty">
          <p>Nessun risultato per "<strong>${escapeHtml(query)}</strong>"</p>
          <p class="bio-search-empty-hint">Prova con termini diversi o <a href="tel:+390799561332">chiama il 079 956 1332</a></p>
        </div>
      `;
    }

    return `
      <div class="bio-search-results-clustered">
        ${sections.join('')}
        <div class="bio-search-footer">
          <a href="/laboratorio/?q=${encodeURIComponent(query)}" class="bio-search-view-all">
            Vedi tutti i risultati →
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Render singolo item
   */
  function renderSearchItem(item, index) {
    const priceHtml = item.price 
      ? `<span class="bio-search-item-price">€${item.price.toFixed(2)}</span>`
      : '';

    const badgeHtml = item.featured 
      ? `<span class="bio-search-item-badge">CONSIGLIATO</span>` 
      : '';

    const typeClass = `bio-search-item-${item.type}`;

    return `
      <div class="bio-search-item ${typeClass}" 
           data-index="${index}"
           data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}'
           tabindex="0"
           role="option">
        <div class="bio-search-item-icon">${item.icon}</div>
        <div class="bio-search-item-content">
          <div class="bio-search-item-name">
            ${escapeHtml(item.name)}
            ${badgeHtml}
          </div>
          <div class="bio-search-item-desc">${escapeHtml(item.description || '')}</div>
        </div>
        ${priceHtml}
        <div class="bio-search-item-action">
          <button class="bio-search-item-btn" onclick="BioSearchPro.handleBooking(${JSON.stringify(item).replace(/"/g, '&quot;')})">
            Prenota
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render Red Flag Alert
   */
  function renderRedFlagAlert() {
    return `
      <div class="bio-search-red-flag">
        <div class="bio-search-red-flag-icon">⚠️</div>
        <div class="bio-search-red-flag-content">
          <h4>Contatto Prioritario Consigliato</h4>
          <p>${CONFIG.emergency.message}</p>
          <div class="bio-search-red-flag-actions">
            <a href="tel:+39${CONFIG.emergency.phone.replace(/\s/g, '')}" class="bio-search-red-flag-btn primary">
              📞 Chiama Ora: ${CONFIG.emergency.phone}
            </a>
            <a href="https://wa.me/${CONFIG.emergency.whatsapp}?text=Buongiorno, ho bisogno di un consulto prioritario" 
               target="_blank" class="bio-search-red-flag-btn secondary">
              💬 WhatsApp Prioritario
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // =============================================
  // 6. SMART BOOKING HANDLER
  // =============================================

  /**
   * Gestisce il routing intelligente delle prenotazioni
   */
  function handleBooking(item) {
    if (typeof item === 'string') {
      try {
        item = JSON.parse(item);
      } catch (e) {
        console.error('[BioSearchPro] Invalid item data');
        return;
      }
    }

    console.log('[BioSearchPro] Booking:', item.name, '- Type:', item.bookingType);

    switch (item.bookingType) {
      case 'whatsapp':
        // CASO A: Pack/Pathway ad alto valore -> WhatsApp
        openWhatsAppBooking(item);
        break;

      case 'miodottore':
        // CASO B: Visite standard -> MioDottore
        openMioDottoreBooking(item);
        break;

      case 'direct':
        // CASO C: Laboratorio -> Modal accesso diretto
        showDirectAccessModal(item);
        break;

      case 'shop':
        // CASO D: Shop/Device -> Form ritiro
        showShopModal(item);
        break;

      default:
        // Fallback -> Telefono
        window.location.href = 'tel:+390799561332';
    }

    // Analytics event
    trackBookingIntent(item);
  }

  /**
   * CASO A: WhatsApp per pack e percorsi alto valore
   */
  function openWhatsAppBooking(item) {
    const message = encodeURIComponent(
      `Salve, vorrei prenotare: ${item.name}.\n\n` +
      `Potete ricontattarmi per fissare un appuntamento?\n\n` +
      `Grazie`
    );
    
    const whatsappUrl = `https://wa.me/${CONFIG.emergency.whatsapp}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * CASO B: MioDottore per visite standard
   */
  function openMioDottoreBooking(item) {
    // Prova ad usare il widget MioDottore se disponibile
    const widgetBtn = document.querySelector(`[data-zlw-doctor="${item.id}"]`);
    
    if (widgetBtn) {
      widgetBtn.click();
    } else {
      // Fallback: vai alla pagina specialità o équipe
      if (item.url) {
        window.location.href = item.url;
      } else {
        window.location.href = `/equipe/?specialty=${item.id}`;
      }
    }
  }

  /**
   * CASO C: Modal accesso diretto laboratorio
   */
  function showDirectAccessModal(item) {
    const modal = createModal({
      title: '🧪 Accesso Diretto Laboratorio',
      content: `
        <div class="bio-modal-lab">
          <div class="bio-modal-lab-exam">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.price ? `<span class="price">€${item.price.toFixed(2)}</span>` : ''}
          </div>
          
          <div class="bio-modal-lab-info">
            <div class="bio-modal-lab-row">
              <span class="icon">🕐</span>
              <span><strong>Orario prelievi:</strong> Lun-Ven 07:00-11:00</span>
            </div>
            <div class="bio-modal-lab-row">
              <span class="icon">📍</span>
              <span><strong>Dove:</strong> Via Renzo Mossa 23, Sassari</span>
            </div>
            <div class="bio-modal-lab-row">
              <span class="icon">📋</span>
              <span><strong>Preparazione:</strong> ${item.meta?.prep || 'Nessuna particolare'}</span>
            </div>
            <div class="bio-modal-lab-row">
              <span class="icon">⏱️</span>
              <span><strong>Referto:</strong> ${item.meta?.referto || 'Entro 24-48h'}</span>
            </div>
          </div>

          ${item.meta?.upsell ? `
            <div class="bio-modal-lab-upsell">
              <p>💡 <strong>Consiglio:</strong> Questo esame è incluso nel pacchetto 
              <a href="#" onclick="BioSearchPro.showPackDetails('${item.meta.upsell}'); return false;">
                ${getPackName(item.meta.upsell)}
              </a> - Risparmia con il check-up completo!
              </p>
            </div>
          ` : ''}

          <p class="bio-modal-lab-note">
            <strong>Non serve appuntamento.</strong> Presentati direttamente in sede.
          </p>
        </div>
      `,
      actions: [
        {
          label: '📞 Chiama per info',
          href: 'tel:+390799561332',
          primary: false
        },
        {
          label: '📍 Indicazioni',
          href: 'https://maps.google.com/?q=Via+Renzo+Mossa+23+Sassari',
          target: '_blank',
          primary: true
        }
      ]
    });

    document.body.appendChild(modal);
  }

  /**
   * CASO D: Modal shop/device
   */
  function showShopModal(item) {
    const modal = createModal({
      title: '🛒 Ritiro in Sede',
      content: `
        <div class="bio-modal-shop">
          <div class="bio-modal-shop-product">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.price ? `<span class="price">€${item.price.toFixed(2)}</span>` : ''}
          </div>
          
          <form id="shop-form" class="bio-modal-form">
            <div class="form-group">
              <label for="shop-name">Nome e Cognome *</label>
              <input type="text" id="shop-name" required>
            </div>
            <div class="form-group">
              <label for="shop-phone">Telefono *</label>
              <input type="tel" id="shop-phone" required>
            </div>
            <div class="form-group">
              <label for="shop-email">Email</label>
              <input type="email" id="shop-email">
            </div>
            <div class="form-group">
              <label for="shop-notes">Note</label>
              <textarea id="shop-notes" rows="2"></textarea>
            </div>
          </form>
        </div>
      `,
      actions: [
        {
          label: 'Annulla',
          onclick: 'BioSearchPro.closeModal()',
          primary: false
        },
        {
          label: 'Prenota Ritiro',
          onclick: `BioSearchPro.submitShopForm('${item.id}')`,
          primary: true
        }
      ]
    });

    document.body.appendChild(modal);
  }

  /**
   * Ottieni nome pack da ID
   */
  function getPackName(packId) {
    if (window.BioClinicDB?.pacchetti) {
      const pack = BioClinicDB.pacchetti.find(p => p.id === packId);
      return pack ? pack.nome : packId;
    }
    return packId;
  }

  /**
   * Mostra dettagli pack
   */
  function showPackDetails(packId) {
    closeModal();
    
    if (window.BioClinicDB?.getPack) {
      const pack = BioClinicDB.getPack(packId);
      if (pack) {
        handleBooking({
          type: 'pack',
          id: pack.id,
          name: pack.nome,
          description: pack.descrizione,
          price: pack.prezzo,
          bookingType: 'whatsapp'
        });
      }
    }
  }

  // =============================================
  // 7. UI HELPERS
  // =============================================

  /**
   * Crea modal generico
   */
  function createModal(options) {
    // Rimuovi modal esistenti
    closeModal();

    const modal = document.createElement('div');
    modal.className = 'bio-modal-overlay';
    modal.id = 'bio-modal';
    modal.innerHTML = `
      <div class="bio-modal">
        <button class="bio-modal-close" onclick="BioSearchPro.closeModal()">&times;</button>
        <h3 class="bio-modal-title">${options.title}</h3>
        <div class="bio-modal-content">${options.content}</div>
        <div class="bio-modal-actions">
          ${options.actions.map(action => {
            if (action.href) {
              return `<a href="${action.href}" ${action.target ? `target="${action.target}"` : ''} 
                        class="bio-modal-btn ${action.primary ? 'primary' : 'secondary'}">${action.label}</a>`;
            } else {
              return `<button onclick="${action.onclick}" 
                        class="bio-modal-btn ${action.primary ? 'primary' : 'secondary'}">${action.label}</button>`;
            }
          }).join('')}
        </div>
      </div>
    `;

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // ESC to close
    document.addEventListener('keydown', handleEscKey);

    return modal;
  }

  function handleEscKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const modal = document.getElementById('bio-modal');
    if (modal) {
      modal.remove();
    }
    document.removeEventListener('keydown', handleEscKey);
  }

  function submitShopForm(itemId) {
    const form = document.getElementById('shop-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      item: itemId,
      name: document.getElementById('shop-name').value,
      phone: document.getElementById('shop-phone').value,
      email: document.getElementById('shop-email').value,
      notes: document.getElementById('shop-notes').value
    };

    // Invia via WhatsApp (fallback semplice)
    const message = encodeURIComponent(
      `Richiesta ritiro prodotto:\n\n` +
      `Prodotto: ${itemId}\n` +
      `Nome: ${data.name}\n` +
      `Telefono: ${data.phone}\n` +
      `Email: ${data.email || 'Non specificata'}\n` +
      `Note: ${data.notes || 'Nessuna'}`
    );
    
    window.open(`https://wa.me/${CONFIG.emergency.whatsapp}?text=${message}`, '_blank');
    closeModal();
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Track booking intent (analytics placeholder)
   */
  function trackBookingIntent(item) {
    // Google Analytics / Tag Manager integration
    if (window.gtag) {
      gtag('event', 'booking_intent', {
        'event_category': 'conversion',
        'event_label': item.name,
        'item_type': item.type,
        'booking_method': item.bookingType
      });
    }

    // Console log per debug
    console.log('[BioSearchPro] Track booking:', {
      name: item.name,
      type: item.type,
      bookingType: item.bookingType
    });
  }

  // =============================================
  // 8. INITIALIZATION & BINDING
  // =============================================

  /**
   * Inizializza BioSearch Pro su un input
   */
  function init(inputSelector, dropdownSelector) {
    const input = document.querySelector(inputSelector);
    const dropdown = document.querySelector(dropdownSelector);

    if (!input) {
      console.warn('[BioSearchPro] Input not found:', inputSelector);
      return;
    }

    // Crea dropdown se non esiste, altrimenti aggiungi classe bio-search-dropdown
    let dropdownEl = dropdown;
    if (!dropdownEl) {
      dropdownEl = document.createElement('div');
      dropdownEl.className = 'bio-search-dropdown';
      dropdownEl.id = inputSelector.replace('#', '') + '-dropdown';
      input.parentNode.style.position = 'relative';
      input.parentNode.appendChild(dropdownEl);
    } else {
      // Aggiungi classe bio-search-dropdown se manca
      if (!dropdownEl.classList.contains('bio-search-dropdown')) {
        dropdownEl.classList.add('bio-search-dropdown');
      }
    }

    // Debounce timer
    let debounceTimer = null;

    // Input handler
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < CONFIG.limits.minQueryLength) {
        hideDropdown(dropdownEl);
        return;
      }

      debounceTimer = setTimeout(() => {
        const results = search(query);
        state.lastResults = results;
        
        dropdownEl.innerHTML = renderClusteredDropdown(results);
        showDropdown(dropdownEl);
        
        bindDropdownEvents(dropdownEl, input);
      }, CONFIG.limits.debounceMs);
    });

    // Focus handler
    input.addEventListener('focus', () => {
      if (state.lastResults && input.value.length >= CONFIG.limits.minQueryLength) {
        showDropdown(dropdownEl);
      }
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      handleKeyboardNav(e, dropdownEl, input);
    });

    // Click outside
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdownEl.contains(e.target)) {
        hideDropdown(dropdownEl);
      }
    });

    state.isInitialized = true;
    console.log('[BioSearchPro] Initialized on:', inputSelector);
  }

  function showDropdown(dropdown) {
    dropdown.classList.add('active');
    state.activeDropdown = dropdown;
  }

  function hideDropdown(dropdown) {
    dropdown.classList.remove('active');
    state.activeDropdown = null;
    state.selectedIndex = -1;
  }

  function bindDropdownEvents(dropdown, input) {
    const items = dropdown.querySelectorAll('.bio-search-item');
    
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        const itemData = JSON.parse(item.dataset.item);
        input.value = itemData.name;
        hideDropdown(dropdown);
        
        // Naviga o prenota
        if (itemData.url) {
          window.location.href = itemData.url;
        }
      });

      item.addEventListener('mouseenter', () => {
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        state.selectedIndex = index;
      });
    });
  }

  function handleKeyboardNav(e, dropdown, input) {
    if (!dropdown.classList.contains('active')) return;

    const items = dropdown.querySelectorAll('.bio-search-item');
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        state.selectedIndex = Math.min(state.selectedIndex + 1, items.length - 1);
        updateSelection(items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
        updateSelection(items);
        break;

      case 'Enter':
        e.preventDefault();
        if (state.selectedIndex >= 0 && items[state.selectedIndex]) {
          items[state.selectedIndex].click();
        }
        break;

      case 'Escape':
        hideDropdown(dropdown);
        break;
    }
  }

  function updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === state.selectedIndex);
    });

    // Scroll into view
    if (state.selectedIndex >= 0 && items[state.selectedIndex]) {
      items[state.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // =============================================
  // 9. PUBLIC API
  // =============================================

  return {
    // Core
    init,
    search,
    
    // Booking
    handleBooking,
    
    // UI
    renderClusteredDropdown,
    showPackDetails,
    closeModal,
    submitShopForm,
    
    // Config
    CONFIG,
    
    // State (debug)
    getState: () => state,
    
    // Version
    version: '1.0.0'
  };

})();

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Init su hero search se presente
  if (document.getElementById('hero-search-input')) {
    BioSearchPro.init('#hero-search-input', '#hero-autocomplete');
  }
  
  // Init su header search se presente
  if (document.getElementById('header-search-input')) {
    BioSearchPro.init('#header-search-input', '#header-autocomplete');
  }

  // Init su lab search se presente
  if (document.getElementById('searchInput')) {
    BioSearchPro.init('#searchInput', null);
  }

  console.log('[BioSearchPro] v1.0.0 loaded');
});

// Export globale
window.BioSearchPro = BioSearchPro;
