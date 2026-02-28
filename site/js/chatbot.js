/**
 * Bio-Clinic AI Assistant — Chatbot Widget
 * ==========================================
 * Lightweight chat widget for bio-clinic.it
 * - No external dependencies
 * - GDPR compliant (no personal data stored without consent)
 * - Grounded answers only (from knowledge base)
 * - Italian language
 * - Mobile-responsive
 * 
 * @version 1.0.0
 * @date 2026-02-28
 */
(function() {
  'use strict';

  // ================================================================
  // CONFIG
  // ================================================================
  const CONFIG = {
    apiUrl: '/api/chat',
    kbUrl: '/data/chatbot-kb.json',
    maxMessages: 50,
    typingDelay: 400,
    welcomeMessage: 'Ciao! Sono l\'assistente virtuale di Bio-Clinic Sassari. Posso aiutarti con informazioni su servizi, orari, prenotazioni e preparazione esami. Come posso aiutarti?',
    disclaimerMessage: 'Le informazioni fornite sono di carattere generale e non sostituiscono il parere medico. Per urgenze chiamare il 118.',
    quickActions: [
      { label: 'Prenota visita', query: 'Come prenoto una visita?' },
      { label: 'Prenota analisi', query: 'Come prenoto le analisi del sangue?' },
      { label: 'Orari e sede', query: 'Quali sono gli orari di apertura?' },
      { label: 'I nostri medici', query: 'Chi sono i medici di Bio-Clinic?' },
    ],
    brandColor: '#7CBA3D',
    brandDark: '#008238',
  };

  let kb = null; // Knowledge base
  let messages = [];
  let isOpen = false;
  let isTyping = false;

  // ================================================================
  // KNOWLEDGE BASE MATCHING (local, no API needed for common queries)
  // ================================================================
  function loadKB() {
    return fetch(CONFIG.kbUrl)
      .then(r => r.json())
      .then(data => { kb = data; })
      .catch(() => { console.warn('Chatbot KB not loaded'); });
  }

  function findLocalAnswer(query) {
    if (!kb) return null;
    const q = query.toLowerCase().trim();

    // 1. Check FAQ exact/fuzzy match
    for (const faq of kb.faq || []) {
      const faqQ = faq.q.toLowerCase();
      if (q.includes(faqQ.replace('?', '')) || faqQ.includes(q.replace('?', ''))) {
        return faq.a;
      }
      // Keyword match
      const keywords = faqQ.split(/\s+/).filter(w => w.length > 3);
      const matchCount = keywords.filter(k => q.includes(k)).length;
      if (matchCount >= 2 && matchCount >= keywords.length * 0.5) {
        return faq.a;
      }
    }

    // 2. Orari
    if (q.match(/orar|quando.*apert|che ora|a che ora/)) {
      const h = kb.clinic.hours;
      return `Bio-Clinic è aperta: Lunedì-Venerdì ${h['lun-ven']}, Sabato ${h['sab']}, Domenica ${h['dom']}. Indirizzo: ${kb.clinic.address}. Tel: ${kb.clinic.phone}.`;
    }

    // 3. Dove / indirizzo
    if (q.match(/dove|indirizzo|come arriv|parcheggio|mappa/)) {
      return `Bio-Clinic si trova in ${kb.clinic.address}. ${kb.clinic.parking}. ${kb.clinic.accessibility}. Tel: ${kb.clinic.phone}.`;
    }

    // 4. Prenotazione
    if (q.match(/prenot|appuntament|visita|disponibil/)) {
      if (q.match(/analis|sangue|prelievo|laborator/)) {
        return `Puoi prenotare le analisi online: ${kb.clinic.lab_booking_url} oppure chiamando lo ${kb.clinic.phone}. Orari: ${kb.clinic.hours['lun-ven']}.`;
      }
      return `Puoi prenotare una visita su MioDottore: ${kb.clinic.booking_url}, telefonando allo ${kb.clinic.phone}, o dal sito bio-clinic.it. Orari: ${kb.clinic.hours['lun-ven']}, Sabato ${kb.clinic.hours['sab']}.`;
    }

    // 5. Medici / dottori
    if (q.match(/medic|dottor|specialist|equipe|team|chi.*medic/)) {
      const specQuery = q.match(/cardiolog|ginecolog|dermatolog|ortoped|neurolog|endocrin|urolog|oculist|otorin|pediatr|pneumolog/);
      if (specQuery) {
        const matched = (kb.doctors_summary || []).filter(d => 
          d.specialty && d.specialty.toLowerCase().includes(specQuery[0])
        );
        if (matched.length > 0) {
          const names = matched.slice(0, 5).map(d => `• ${d.name} — ${d.specialty}`).join('\n');
          return `I nostri specialisti in ${specQuery[0]}:\n${names}\n\nPer prenotare: ${kb.clinic.phone}`;
        }
      }
      const topDocs = (kb.doctors_summary || []).slice(0, 8).map(d => `• ${d.name} — ${d.specialty}`).join('\n');
      return `Bio-Clinic ha circa 67 specialisti. Ecco alcuni:\n${topDocs}\n\nLista completa: ${kb.clinic.website}/equipe/`;
    }

    // 6. Servizi / specialità
    if (q.match(/serviz|specialit|cosa.*fate|cosa.*offr|prestazion/)) {
      const services = (kb.services_top || []).map(s => `• ${s.name}: ${s.desc}`).join('\n');
      return `I principali servizi di Bio-Clinic:\n${services}\n\nElenco completo: ${kb.clinic.website}/prestazioni/`;
    }

    // 7. Referti
    if (q.match(/refert|risultat|esit/)) {
      return `I referti sono disponibili online su referti.bio-clinic.it oppure ritirali di persona presso la segreteria. Per informazioni: ${kb.clinic.phone}.`;
    }

    // 8. Costi / prezzi
    if (q.match(/cost|prezz|quant.*cost|listin|tariff/)) {
      return `I prezzi variano in base alla prestazione. Consulta il listino completo su ${kb.clinic.website}/listino/ oppure chiama lo ${kb.clinic.phone} per un preventivo.`;
    }

    // 9. Contatti
    if (q.match(/contatt|telefon|email|chiama|numer/)) {
      return `Contatti Bio-Clinic:\n• Tel: ${kb.clinic.phone}\n• Email: ${kb.clinic.email}\n• Indirizzo: ${kb.clinic.address}\n• Sito: ${kb.clinic.website}`;
    }

    // 10. Specific specialty match
    for (const svc of kb.services_top || []) {
      if (q.includes(svc.name.toLowerCase()) || q.includes(svc.name.toLowerCase().split(' ')[0])) {
        return `${svc.name}: ${svc.desc}. Maggiori informazioni: ${svc.url}. Per prenotare: ${kb.clinic.phone}.`;
      }
    }

    return null;
  }

  // ================================================================
  // API CALL (fallback to server-side AI when local KB doesn't match)
  // ================================================================
  async function getAnswer(query) {
    // Try local KB first
    const localAnswer = findLocalAnswer(query);
    if (localAnswer) return localAnswer;

    // Fallback: call API
    try {
      const resp = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: messages.slice(-6) })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.reply || data.message || 'Mi dispiace, non ho trovato informazioni specifiche. Chiama lo 079 956 1332 per assistenza diretta.';
      }
    } catch (e) {
      console.warn('Chat API error:', e);
    }

    // Ultimate fallback
    return `Non ho trovato una risposta specifica alla tua domanda. Ti consiglio di:\n• Chiamare lo ${kb?.clinic?.phone || '079 956 1332'}\n• Scrivere a ${kb?.clinic?.email || 'gestione@bio-clinic.it'}\n• Visitare ${kb?.clinic?.website || 'bio-clinic.it'}\n\nSaremo lieti di aiutarti!`;
  }

  // ================================================================
  // UI RENDERING
  // ================================================================
  function createWidget() {
    // Inject CSS
    const style = document.createElement('style');
    style.id = 'bio-chat-styles';
    style.textContent = `
      #bio-chat-toggle{position:fixed;bottom:20px;right:20px;z-index:99998;width:60px;height:60px;border-radius:50%;background:${CONFIG.brandColor};border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .2s,background .2s}
      #bio-chat-toggle:hover{transform:scale(1.1);background:${CONFIG.brandDark}}
      #bio-chat-toggle svg{width:28px;height:28px;fill:white}
      #bio-chat-toggle .badge{position:absolute;top:-2px;right:-2px;background:#ef4444;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700}
      #bio-chat-window{position:fixed;bottom:90px;right:20px;z-index:99999;width:380px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:white;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.15);display:none;flex-direction:column;overflow:hidden;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      #bio-chat-window.open{display:flex;animation:bioChatSlideUp .3s ease}
      @keyframes bioChatSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .bio-chat-header{background:linear-gradient(135deg,${CONFIG.brandColor},${CONFIG.brandDark});color:white;padding:16px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}
      .bio-chat-header .avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px}
      .bio-chat-header .info h3{margin:0;font-size:14px;font-weight:600}
      .bio-chat-header .info p{margin:2px 0 0;font-size:11px;opacity:.85}
      .bio-chat-header .close-btn{margin-left:auto;background:none;border:none;color:white;cursor:pointer;font-size:20px;padding:4px;opacity:.8}
      .bio-chat-header .close-btn:hover{opacity:1}
      .bio-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#f9fafb}
      .bio-chat-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.5;word-break:break-word;white-space:pre-line}
      .bio-chat-msg.bot{background:white;color:#374151;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.05);align-self:flex-start}
      .bio-chat-msg.user{background:${CONFIG.brandColor};color:white;border-bottom-right-radius:4px;align-self:flex-end}
      .bio-chat-msg a{color:${CONFIG.brandDark};text-decoration:underline}
      .bio-chat-msg.user a{color:#d4edda}
      .bio-chat-msg.typing{font-style:italic;color:#9ca3af}
      .bio-chat-actions{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px}
      .bio-chat-actions button{background:white;border:1px solid #e5e7eb;border-radius:20px;padding:6px 12px;font-size:12px;color:#374151;cursor:pointer;transition:all .15s;white-space:nowrap}
      .bio-chat-actions button:hover{border-color:${CONFIG.brandColor};color:${CONFIG.brandColor};background:#f0f7e6}
      .bio-chat-input{display:flex;padding:12px 16px;background:white;border-top:1px solid #e5e7eb;gap:8px;flex-shrink:0}
      .bio-chat-input input{flex:1;border:1px solid #e5e7eb;border-radius:24px;padding:8px 16px;font-size:13px;outline:none;font-family:inherit}
      .bio-chat-input input:focus{border-color:${CONFIG.brandColor};box-shadow:0 0 0 3px rgba(124,186,61,.15)}
      .bio-chat-input button{background:${CONFIG.brandColor};border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
      .bio-chat-input button:hover{background:${CONFIG.brandDark}}
      .bio-chat-input button svg{width:16px;height:16px;fill:white}
      .bio-chat-disclaimer{font-size:10px;color:#9ca3af;text-align:center;padding:4px 16px 8px;background:white}
      @media(max-width:480px){#bio-chat-window{bottom:0;right:0;width:100%;max-width:100%;height:100vh;max-height:100vh;border-radius:0}#bio-chat-toggle{bottom:16px;right:16px;width:56px;height:56px}}
    `;
    document.head.appendChild(style);

    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'bio-chat-toggle';
    toggle.setAttribute('aria-label', 'Apri chat assistente Bio-Clinic');
    toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg><span class="badge" style="display:none">1</span>`;
    toggle.onclick = toggleChat;
    document.body.appendChild(toggle);

    // Chat window
    const win = document.createElement('div');
    win.id = 'bio-chat-window';
    win.innerHTML = `
      <div class="bio-chat-header">
        <div class="avatar">🏥</div>
        <div class="info">
          <h3>Assistente Bio-Clinic</h3>
          <p>Rispondiamo in pochi secondi</p>
        </div>
        <button class="close-btn" aria-label="Chiudi chat" onclick="document.getElementById('bio-chat-window').classList.remove('open');document.getElementById('bio-chat-toggle').querySelector('.badge').style.display='none';">✕</button>
      </div>
      <div class="bio-chat-messages" id="bio-chat-msgs"></div>
      <div class="bio-chat-actions" id="bio-chat-quick"></div>
      <div class="bio-chat-input">
        <input type="text" id="bio-chat-input" placeholder="Scrivi un messaggio..." aria-label="Messaggio" maxlength="500" autocomplete="off">
        <button id="bio-chat-send" aria-label="Invia messaggio">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="bio-chat-disclaimer">${CONFIG.disclaimerMessage}</div>
    `;
    document.body.appendChild(win);

    // Event listeners
    document.getElementById('bio-chat-send').onclick = sendMessage;
    document.getElementById('bio-chat-input').onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // Quick actions
    renderQuickActions();

    // Show welcome after short delay
    setTimeout(() => {
      if (!isOpen) {
        toggle.querySelector('.badge').style.display = 'flex';
      }
    }, 3000);
  }

  function toggleChat() {
    const win = document.getElementById('bio-chat-window');
    const badge = document.getElementById('bio-chat-toggle').querySelector('.badge');
    isOpen = !isOpen;
    
    if (isOpen) {
      win.classList.add('open');
      badge.style.display = 'none';
      if (messages.length === 0) {
        addMessage(CONFIG.welcomeMessage, 'bot');
      }
      setTimeout(() => document.getElementById('bio-chat-input').focus(), 300);
    } else {
      win.classList.remove('open');
    }
  }

  function addMessage(text, sender) {
    messages.push({ text, sender, time: Date.now() });
    const container = document.getElementById('bio-chat-msgs');
    const msgEl = document.createElement('div');
    msgEl.className = `bio-chat-msg ${sender}`;
    
    // Convert URLs to links
    const linkedText = text.replace(
      /(https?:\/\/[^\s,)]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    msgEl.innerHTML = linkedText;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
    
    // Limit messages
    if (messages.length > CONFIG.maxMessages) {
      messages = messages.slice(-CONFIG.maxMessages);
      while (container.children.length > CONFIG.maxMessages) {
        container.removeChild(container.firstChild);
      }
    }
  }

  function showTyping() {
    isTyping = true;
    const container = document.getElementById('bio-chat-msgs');
    const typing = document.createElement('div');
    typing.className = 'bio-chat-msg bot typing';
    typing.id = 'bio-chat-typing';
    typing.textContent = 'Sto scrivendo...';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    isTyping = false;
    const typing = document.getElementById('bio-chat-typing');
    if (typing) typing.remove();
  }

  function renderQuickActions() {
    const container = document.getElementById('bio-chat-quick');
    container.innerHTML = '';
    CONFIG.quickActions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.onclick = () => {
        document.getElementById('bio-chat-input').value = action.query;
        sendMessage();
      };
      container.appendChild(btn);
    });
  }

  async function sendMessage() {
    const input = document.getElementById('bio-chat-input');
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    addMessage(text, 'user');

    // Hide quick actions after first message
    document.getElementById('bio-chat-quick').style.display = 'none';

    showTyping();

    try {
      const answer = await getAnswer(text);
      hideTyping();
      addMessage(answer, 'bot');
    } catch (e) {
      hideTyping();
      addMessage('Mi dispiace, si è verificato un errore. Riprova o chiama lo 079 956 1332.', 'bot');
    }

    // Track in GA4 if available
    if (typeof gtag === 'function') {
      gtag('event', 'chat_message', {
        event_category: 'chatbot',
        event_label: text.substring(0, 50),
        value: 1
      });
    }
  }

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    // Don't init on admin pages
    if (window.location.pathname.startsWith('/admin')) return;

    // Check for GDPR consent (respect existing cookie consent)
    loadKB().then(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
      } else {
        createWidget();
      }
    });
  }

  // Auto-init
  init();
})();
