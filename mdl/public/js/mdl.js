/**
 * MDL Bio-Clinic — Dashboard JavaScript v3.0
 * Medicina del Lavoro — Sorveglianza Sanitaria D.Lgs. 81/2008
 *
 * Architecture: COMPANY-CENTRIC with WORKER HEALTH SURVEILLANCE
 *   Dashboard → Elenco Aziende → Scheda Azienda (tabs)
 *   Worker → Scheda Lavoratore (Panoramica, Esami Previsti, Referti, Idoneità, Visite, Anagrafica)
 *
 * @version 3.0.0
 */
(function () {
  'use strict';

  var API = '/api';

  /* ── State ─────────────────────────────────────────────────────── */
  var state = {
    session: null,
    user: null,
    section: 'dashboard',
    companies: [],
    activeCompany: null,
    activeTab: 'tab-dipendenti',
    activeWorker: null,       // worker detail data
    activeWorkerTab: 'wtab-panoramica'
  };

  /* ── MDL public namespace ─────────────────────────────────────── */
  window.MDL = {};

  /* ── DOM helpers ───────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function show(el) { if (typeof el === 'string') el = $(el); if (el) el.classList.remove('d-none'); }
  function hide(el) { if (typeof el === 'string') el = $(el); if (el) el.classList.add('d-none'); }

  function toast(msg, type) {
    var c = $('toastContainer'); if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 4000);
  }

  function debounce(fn, ms) {
    var timer;
    return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
  }

  function on(id, evt, fn) { var el = $(id); if (el) el.addEventListener(evt, fn); }

  /* ── API (with 401 auto-logout) ────────────────────────────────── */
  function api(method, path, body) {
    var opts = { method: method, headers: {} };
    if (state.session) opts.headers['Authorization'] = 'Bearer ' + state.session.access_token;
    if (body && !(body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }
    return fetch(API + path, opts).then(function (r) {
      if (r.status === 401) {
        clearSession(); showLogin();
        toast('Sessione scaduta. Effettua nuovamente il login.', 'warning');
        throw new Error('Sessione scaduta');
      }
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Errore server (' + r.status + ')');
        return data;
      });
    });
  }

  /* ── Formatters ────────────────────────────────────────────────── */
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var now = new Date(); now.setHours(0,0,0,0);
    var target = new Date(dateStr); target.setHours(0,0,0,0);
    return Math.ceil((target - now) / 86400000);
  }

  var ROLE_LABELS = {
    super_admin: 'Super Admin', medico_competente: 'Medico Competente',
    medico_collaboratore: 'Medico Collaboratore', segreteria_mdl: 'Segreteria MDL',
    datore_lavoro: 'Datore di Lavoro', rspp: 'RSPP', lavoratore: 'Lavoratore'
  };
  /* ── PHASE 0: Frontend RBAC helpers ──────────────────────────── */
  var CLINICAL_ROLES_FE = ['super_admin', 'medico_competente', 'medico_collaboratore'];
  function isClinicalRole() {
    return state.user && CLINICAL_ROLES_FE.indexOf(state.user.role) >= 0;
  }
  function canSeeSensitiveData() {
    return isClinicalRole(); // same group: only MC/SA see is_pregnant, is_disabled etc.
  }

  var RISK_BADGE = { basso: 'success', medio: 'warning', alto: 'danger' };
  var RISK_LABEL = { basso: 'Basso', medio: 'Medio', alto: 'Alto' };
  var VISIT_LABELS = {
    preventiva: 'Preventiva', periodica: 'Periodica', richiesta_lavoratore: 'Rich. lavoratore',
    cambio_mansione: 'Cambio mansione', cessazione: 'Cessazione', pre_ripresa: 'Pre-ripresa', straordinaria: 'Straordinaria'
  };
  var STATUS_BADGE = {
    programmata: 'primary', confermata: 'info', in_corso: 'warning',
    completata: 'success', non_presentato: 'danger', annullata: 'gray'
  };
  var FITNESS_LABELS = {
    idoneo: 'Idoneo',
    idoneo_con_prescrizioni: 'Idoneo con prescrizioni',
    idoneo_con_limitazioni_temporanee: 'Idoneo con limitazioni temporanee',
    idoneo_con_limitazioni_permanenti: 'Idoneo con limitazioni permanenti',
    temporaneamente_non_idoneo: 'Temporaneamente non idoneo',
    non_idoneo_permanente: 'Non idoneo permanente'
  };
  var FITNESS_BADGE_TYPE = {
    idoneo: 'success',
    idoneo_con_prescrizioni: 'warning',
    idoneo_con_limitazioni_temporanee: 'warning',
    idoneo_con_limitazioni_permanenti: 'danger',
    temporaneamente_non_idoneo: 'danger',
    non_idoneo_permanente: 'danger'
  };
  var PERIODICITY_LABELS = {
    semestrale: 'Semestrale', annuale: 'Annuale', biennale: 'Biennale',
    triennale: 'Triennale', quinquennale: 'Quinquennale', una_tantum: 'Una tantum'
  };
  var EXAM_CAT_LABELS = {
    ematochimico: 'Esami di Laboratorio', strumentale: 'Esami Strumentali',
    specialistico: 'Visite Specialistiche', tossicologico: 'Monitoraggio Biologico / Tossicologico'
  };
  var EXAM_CAT_ICONS = {
    ematochimico: '&#129514;', strumentale: '&#128200;', specialistico: '&#129658;', tossicologico: '&#128300;'
  };
  var EXAM_CAT_ORDER = ['ematochimico', 'strumentale', 'specialistico', 'tossicologico'];

  function groupExamsByCategory(exams) {
    var groups = {};
    (exams || []).forEach(function (e) {
      var cat = e.exam_category || 'altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return groups;
  }

  /* ── Table helpers ─────────────────────────────────────────────── */
  function emptyRow(c, m) { return '<tr><td colspan="' + c + '" style="text-align:center;padding:2rem;color:#9ca3af">' + m + '</td></tr>'; }
  function errorRow(c, m) { return '<tr><td colspan="' + c + '" style="text-align:center;padding:2rem;color:#dc2626">' + esc(m) + '</td></tr>'; }
  function loadingRow(c) { return '<tr><td colspan="' + c + '" style="text-align:center;padding:2rem;color:#9ca3af">Caricamento...</td></tr>'; }
  function dl(l, v) { return '<div><div class="detail-label">' + l + '</div><div class="detail-value">' + esc(String(v != null ? v : '—')) + '</div></div>'; }

  /* ── Semaforo (traffic light) for idoneità validity ────────────── */
  function fitnessStatusIndicator(fitness) {
    if (!fitness) return '<span class="semaforo semaforo-grigio" title="Nessuna idoneita">●</span><span class="semaforo-label">Nessuna idoneita</span>';
    var days = daysUntil(fitness.next_visit_date);
    var jType = fitness.judgment_type;

    // Non idoneo types always red
    if (jType === 'non_idoneo_permanente' || jType === 'temporaneamente_non_idoneo') {
      return '<span class="semaforo semaforo-rosso" title="' + esc(FITNESS_LABELS[jType]) + '">●</span><span class="semaforo-label">' + esc(FITNESS_LABELS[jType]) + '</span>';
    }

    // Check expiry
    if (days === null) {
      return '<span class="semaforo semaforo-verde" title="Idoneo">●</span><span class="semaforo-label">' + esc(FITNESS_LABELS[jType]) + '</span>';
    }
    if (days < 0) {
      return '<span class="semaforo semaforo-rosso" title="Scaduta da ' + Math.abs(days) + ' giorni">●</span><span class="semaforo-label">Scaduta (' + fmtDate(fitness.next_visit_date) + ')</span>';
    }
    if (days <= 30) {
      return '<span class="semaforo semaforo-rosso" title="Scade tra ' + days + ' giorni">●</span><span class="semaforo-label">Scade tra ' + days + 'gg</span>';
    }
    if (days <= 90) {
      return '<span class="semaforo semaforo-giallo" title="Scade tra ' + days + ' giorni">●</span><span class="semaforo-label">Scade ' + fmtDate(fitness.next_visit_date) + '</span>';
    }
    return '<span class="semaforo semaforo-verde" title="Valida fino al ' + fmtDate(fitness.next_visit_date) + '">●</span><span class="semaforo-label">Valida fino ' + fmtDate(fitness.next_visit_date) + '</span>';
  }

  /* ── Auth ───────────────────────────────────────────────────────── */
  function loadSession() {
    try {
      var s = localStorage.getItem('mdl_session');
      var u = localStorage.getItem('mdl_user');
      if (s && u) { state.session = JSON.parse(s); state.user = JSON.parse(u); return true; }
    } catch (e) { localStorage.removeItem('mdl_session'); localStorage.removeItem('mdl_user'); }
    return false;
  }
  function saveSession(ses, usr) {
    state.session = ses; state.user = usr;
    localStorage.setItem('mdl_session', JSON.stringify(ses));
    localStorage.setItem('mdl_user', JSON.stringify(usr));
  }
  function clearSession() {
    state.session = null; state.user = null;
    localStorage.removeItem('mdl_session'); localStorage.removeItem('mdl_user');
  }
  function showLogin() { show('loginPage'); hide('appShell'); }
  function showApp() {
    hide('loginPage'); show('appShell');
    updateUserUI();
    // Show/hide nav items based on role
    var canMgUsers = state.user && ['super_admin','medico_competente'].indexOf(state.user.role) >= 0;
    document.querySelectorAll('.nav-mc-only').forEach(function(el) {
      el.style.display = canMgUsers ? '' : 'none';
    });
    var hash = window.location.hash.slice(1);
    if (hash.indexOf('azienda/') === 0) {
      navigateTo('aziende');
      openCompany(hash.slice(8));
    } else if (hash.indexOf('lavoratore/') === 0) {
      openWorkerDetail(hash.slice(11));
    } else {
      var hashMap = { protocolli: 'protocolli-globale' };
      navigateTo(hashMap[hash] || hash || 'dashboard');
    }
  }

  function updateUserUI() {
    if (!state.user) return;
    var u = state.user;
    $('userName').textContent = u.first_name + ' ' + u.last_name;
    $('userRole').textContent = ROLE_LABELS[u.role] || u.role;
    $('userInitials').textContent = ((u.first_name || 'X')[0] + (u.last_name || 'X')[0]).toUpperCase();
    $('todayDate').textContent = new Date().toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  NAVIGATION                                                    */
  /* ═══════════════════════════════════════════════════════════════ */
  function navigateTo(section) {
    section = section || 'dashboard';
    if (section !== 'company-detail') state.activeCompany = null;
    if (section !== 'worker-detail') state.activeWorker = null;
    state.section = section;

    document.querySelectorAll('.nav-item').forEach(function (el) {
      var s = el.getAttribute('data-section');
      el.classList.toggle('active', s === section ||
        (section === 'company-detail' && s === 'aziende') ||
        (section === 'worker-detail' && s === 'lavoratori'));
    });

    document.querySelectorAll('#contentArea > .section').forEach(function (el) {
      el.id === 'sec-' + section ? el.classList.remove('d-none') : el.classList.add('d-none');
    });

    var titles = {
      dashboard: 'Dashboard', aziende: 'Aziende Clienti',
      lavoratori: 'Lavoratori', visite: 'Visite Mediche',
      agenda: 'Agenda', scadenzario: 'Scadenzario',
      'protocolli-globale': 'Protocolli Sanitari', utenti: 'Gestione Utenti',
      impostazioni: 'Impostazioni'
    };

    if (section === 'company-detail' && state.activeCompany) {
      setBreadcrumb([
        { label: 'Aziende', link: 'aziende' },
        { label: state.activeCompany.business_name }
      ]);
      $('pageTitle').textContent = state.activeCompany.business_name;
    } else if (section === 'worker-detail' && state.activeWorker) {
      var w = state.activeWorker.worker;
      var crumbs = [{ label: 'Lavoratori', link: 'lavoratori' }];
      if (w.mdl_companies) {
        crumbs.push({ label: w.mdl_companies.business_name, link: 'azienda/' + w.company_id });
      }
      crumbs.push({ label: w.last_name + ' ' + w.first_name });
      setBreadcrumb(crumbs);
      $('pageTitle').textContent = w.last_name + ' ' + w.first_name;
    } else {
      setBreadcrumb([{ label: titles[section] || section }]);
      $('pageTitle').textContent = titles[section] || section;
    }

    var loaders = {
      dashboard: loadDashboard,
      aziende: loadAziende,
      lavoratori: loadLavoratoriGlobal,
      visite: loadVisiteGlobal,
      scadenzario: loadScadenzarioGlobale,
      'protocolli-globale': loadProtocolliGlobale,
      utenti: loadUtenti
    };
    if (loaders[section]) loaders[section]();
  }

  function setBreadcrumb(items) {
    var bc = $('breadcrumb');
    bc.innerHTML = items.map(function (item, i) {
      var sep = i > 0 ? '<span class="breadcrumb-sep">&rsaquo;</span>' : '';
      if (item.link) {
        return sep + '<span class="breadcrumb-item"><a class="breadcrumb-link" data-nav="' + item.link + '">' + esc(item.label) + '</a></span>';
      }
      return sep + '<span class="breadcrumb-item">' + esc(item.label) + '</span>';
    }).join('');
    bc.querySelectorAll('.breadcrumb-link').forEach(function (el) {
      el.addEventListener('click', function () {
        var nav = el.getAttribute('data-nav');
        if (nav.indexOf('azienda/') === 0) {
          openCompany(nav.slice(8));
        } else {
          navigateTo(nav);
          window.location.hash = nav;
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  DASHBOARD                                                     */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadDashboard() {
    api('GET', '/companies?limit=1').then(function (r) {
      $('statAziende').textContent = r.pagination ? r.pagination.total : 0;
    }).catch(function () { $('statAziende').textContent = '—'; });

    api('GET', '/workers?limit=1').then(function (r) {
      $('statLavoratori').textContent = r.pagination ? r.pagination.total : 0;
    }).catch(function () { $('statLavoratori').textContent = '—'; });

    var today = new Date().toISOString().slice(0, 10);
    api('GET', '/visits?scheduled_date=' + today + '&status=programmata&limit=1').then(function (r) {
      $('statVisiteOggi').textContent = r.pagination ? r.pagination.total : 0;
    }).catch(function () { $('statVisiteOggi').textContent = '—'; });

    api('GET', '/deadlines').then(function (r) {
      var c = r.counts || {};
      $('statScadenze30').textContent = (c.scadute || 0) + (c.entro_30 || 0);
      var items = (r.data || []).slice(0, 6);
      var el = $('expiringItems');
      if (!items.length) {
        el.innerHTML = '<p style="color:#9ca3af;padding:0.5rem 0">Nessuna scadenza imminente</p>';
        return;
      }
      el.innerHTML = items.map(function (i) {
        return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid #f3f4f6">' +
          '<span style="min-width:70px">' + deadlineBadge(i.days_until) + '</span>' +
          '<div style="flex:1;font-size:0.82rem"><strong>' + esc(i.subject || i.title) + '</strong>' +
          '<br><small style="color:#9ca3af">' + (DEADLINE_CAT[i.category] || i.category) + (i.company_name ? ' — ' + esc(i.company_name) : '') + '</small></div>' +
          '<span style="font-size:0.78rem;color:#6b7280">' + fmtDate(i.due_date) + '</span></div>';
      }).join('');
    }).catch(function () { $('statScadenze30').textContent = '—'; });

    api('GET', '/visits?upcoming=true&limit=5').then(function (r) {
      var el = $('upcomingVisits');
      if (!r.data || r.data.length === 0) {
        el.innerHTML = '<p style="color:#9ca3af;padding:0.5rem 0">Nessuna visita programmata</p>';
        return;
      }
      el.innerHTML = r.data.map(function (v) {
        var w = v.mdl_workers || {};
        return '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid #f3f4f6">' +
          '<span style="font-weight:600;font-size:0.82rem;min-width:80px">' + fmtDate(v.scheduled_date) + '</span>' +
          '<div style="flex:1"><strong style="font-size:0.82rem">' + esc(w.last_name || '') + ' ' + esc(w.first_name || '') + '</strong>' +
          '<br><small style="color:#9ca3af">' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</small></div>' +
          '<span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '">' + esc(v.status) + '</span></div>';
      }).join('');
    }).catch(function () { $('upcomingVisits').innerHTML = '<p style="color:#dc2626">Errore caricamento</p>'; });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  AZIENDE LIST (card grid)                                      */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadAziende() {
    var grid = $('aziendeGrid');
    grid.innerHTML = '<div style="padding:2rem;text-align:center;color:#9ca3af">Caricamento aziende...</div>';

    var search = ($('searchAziende') || {}).value || '';
    var params = search.trim() ? '?search=' + encodeURIComponent(search.trim()) : '';

    api('GET', '/companies' + params).then(function (r) {
      state.companies = r.data || [];
      if (state.companies.length === 0) {
        grid.innerHTML = '<div style="padding:3rem;text-align:center;color:#9ca3af">' +
          '<div style="font-size:2.5rem;margin-bottom:0.75rem;opacity:0.3">&#9830;</div>' +
          '<div style="font-size:0.9rem;margin-bottom:0.5rem">Nessuna azienda trovata</div>' +
          '<div style="font-size:0.78rem">Clicca "+ Nuova Azienda" per aggiungere la prima azienda cliente</div></div>';
        return;
      }

      grid.innerHTML = state.companies.map(function (c) {
        return '<div class="company-card risk-' + (c.risk_level || 'basso') + '" data-id="' + c.id + '">' +
          '<div class="company-card-title">' + esc(c.business_name) + '</div>' +
          '<div class="company-card-meta">' +
            '<span>P.IVA: ' + esc(c.vat_number) + '</span>' +
            (c.sector ? '<span>' + esc(c.sector) + '</span>' : '') +
            (c.address_city ? '<span>' + esc(c.address_city) + (c.address_province ? ' (' + c.address_province + ')' : '') + '</span>' : '') +
          '</div>' +
          '<div class="company-card-stats">' +
            '<span class="company-card-stat"><strong>' + (c.total_employees || 0) + '</strong> dipendenti</span>' +
            '<span class="company-card-stat">Rischio: <span class="badge badge-' + (RISK_BADGE[c.risk_level] || 'gray') + '" style="margin-left:0.25rem">' + (RISK_LABEL[c.risk_level] || '—') + '</span></span>' +
            '<span class="company-card-stat badge ' + (c.is_active ? 'badge-success' : 'badge-gray') + '">' + (c.is_active ? 'Attiva' : 'Inattiva') + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      grid.querySelectorAll('.company-card').forEach(function (card) {
        card.addEventListener('click', function () {
          openCompany(card.getAttribute('data-id'));
        });
      });
    }).catch(function (err) {
      grid.innerHTML = '<div style="padding:2rem;text-align:center;color:#dc2626">Errore: ' + esc(err.message) + '</div>';
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  COMPANY DETAIL (scheda azienda)                               */
  /* ═══════════════════════════════════════════════════════════════ */
  function openCompany(id) {
    navigateToCompanyDetail(null);
    $('companyHeader').innerHTML = '<div style="padding:1rem;color:#9ca3af">Caricamento azienda...</div>';

    api('GET', '/companies/' + id).then(function (r) {
      if (!r.data) { toast('Azienda non trovata', 'error'); navigateTo('aziende'); return; }
      state.activeCompany = r.data;
      window.location.hash = 'azienda/' + id;
      navigateToCompanyDetail(r.data);
      renderCompanyHeader(r.data);
      switchTab('tab-dipendenti');
    }).catch(function (err) {
      toast(err.message, 'error');
      navigateTo('aziende');
    });
  }

  function navigateToCompanyDetail(company) {
    state.section = 'company-detail';
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-section') === 'aziende');
    });
    document.querySelectorAll('#contentArea > .section').forEach(function (el) {
      el.id === 'sec-company-detail' ? el.classList.remove('d-none') : el.classList.add('d-none');
    });
    if (company) {
      setBreadcrumb([
        { label: 'Aziende', link: 'aziende' },
        { label: company.business_name }
      ]);
      $('pageTitle').textContent = company.business_name;
    }
  }

  function renderCompanyHeader(c) {
    var initials = (c.business_name || 'XX').substring(0, 2).toUpperCase();
    $('companyHeader').innerHTML =
      '<div class="company-avatar">' + esc(initials) + '</div>' +
      '<div class="company-header-info">' +
        '<h2>' + esc(c.business_name) + '</h2>' +
        '<div class="company-header-meta">' +
          '<span>P.IVA: <strong>' + esc(c.vat_number) + '</strong></span>' +
          (c.ateco_code ? '<span>ATECO: ' + esc(c.ateco_code) + '</span>' : '') +
          (c.sector ? '<span>' + esc(c.sector) + '</span>' : '') +
          (c.address_city ? '<span>' + esc(c.address_city) + (c.address_province ? ' (' + c.address_province + ')' : '') + '</span>' : '') +
          '<span>Dip.: <strong>' + (c.total_employees || 0) + '</strong></span>' +
        '</div>' +
        '<div class="company-header-badges">' +
          '<span class="badge badge-' + (RISK_BADGE[c.risk_level] || 'gray') + '">Rischio ' + (RISK_LABEL[c.risk_level] || '—') + '</span>' +
          '<span class="badge ' + (c.is_active ? 'badge-success' : 'badge-gray') + '">' + (c.is_active ? 'Attiva' : 'Inattiva') + '</span>' +
        '</div>' +
      '</div>';
  }

  /* ── Tab switching ──────────────────────────────────────────── */
  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('#companyTabs .tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('#sec-company-detail .tab-panel').forEach(function (p) {
      p.id === tabId ? p.classList.add('active') : p.classList.remove('active');
    });

    if (!state.activeCompany) return;
    var cid = state.activeCompany.id;
    var loaders = {
      'tab-dipendenti': function () { loadDipendenti(cid); },
      'tab-mansioni': function () { loadMansioni(); },
      'tab-visite': function () { loadVisite(cid); },
      'tab-scadenze': function () { loadScadenze(cid); },
      'tab-protocolli': function () { loadProtocolli(); },
      'tab-documenti': function () { loadDocumenti(cid); },
      'tab-info': function () { loadCompanyInfo(); }
    };
    if (loaders[tabId]) loaders[tabId]();
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: DIPENDENTI                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadDipendenti(companyId) {
    var tbody = $('dipendentiBody');
    tbody.innerHTML = loadingRow(7);

    var search = ($('searchDipendenti') || {}).value || '';
    var params = '?company_id=' + companyId + '&limit=100';
    if (search.trim()) params += '&search=' + encodeURIComponent(search.trim());

    api('GET', '/workers' + params).then(function (r) {
      if (!r.data || r.data.length === 0) {
        tbody.innerHTML = emptyRow(7, 'Nessun dipendente registrato per questa azienda');
        return;
      }
      tbody.innerHTML = r.data.map(function (w) {
        var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
        var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
        return '<tr>' +
          '<td><strong>' + esc(w.last_name) + ' ' + esc(w.first_name) + '</strong></td>' +
          '<td><code>' + esc(w.fiscal_code) + '</code></td>' +
          '<td>' + esc(roleName) + '</td>' +
          '<td>—</td><td>—</td><td>—</td>' +
          '<td><button class="btn btn-primary btn-sm" onclick="MDL.openWorker(\'' + w.id + '\')">Scheda</button> ' +
          '<button class="btn btn-outline btn-sm" onclick="MDL.scheduleVisitFor(\'' + w.id + '\',\'' + esc(w.last_name + ' ' + w.first_name) + '\')">Visita</button></td>' +
        '</tr>';
      }).join('');
    }).catch(function (err) {
      tbody.innerHTML = errorRow(7, 'Errore: ' + err.message);
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: MANSIONI E RISCHI                                        */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadMansioni() {
    var tbody = $('mansioniBody');
    tbody.innerHTML = loadingRow(6);
    if (!state.activeCompany) return;
    var cid = state.activeCompany.id;
    var canEdit = state.user && ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'].indexOf(state.user.role) >= 0;

    api('GET', '/companies/' + cid + '/job-roles').then(function (r) {
      var roles = r.data || [];
      // mantiene sincronizzati gli altri form che leggono le mansioni
      if (state.activeCompany) state.activeCompany.mdl_job_roles = roles;
      if (roles.length === 0) {
        tbody.innerHTML = emptyRow(6, 'Nessuna mansione definita. Usa "+ Nuova Mansione" per crearla.');
        return;
      }
      tbody.innerHTML = roles.map(function (r) {
        var cnt = (r.mdl_worker_jobs && r.mdl_worker_jobs[0] && r.mdl_worker_jobs[0].count) || 0;
        var actions = '<button class="btn btn-outline btn-sm" onclick="MDL.editJobRole(\'' + r.id + '\')">Modifica</button>';
        if (canEdit) actions += ' <button class="btn btn-danger btn-sm" onclick="MDL.deleteJobRole(\'' + r.id + '\',\'' + esc(r.role_name) + '\')">Disattiva</button>';
        return '<tr>' +
          '<td><strong>' + esc(r.role_name) + '</strong></td>' +
          '<td><span class="badge badge-' + (RISK_BADGE[r.risk_level] || 'gray') + '">' + (RISK_LABEL[r.risk_level] || '—') + '</span></td>' +
          '<td style="max-width:300px;white-space:normal;font-size:0.78rem">' + esc((r.risk_factors || []).join(', ') || '—') + '</td>' +
          '<td>' + cnt + '</td>' +
          '<td><span class="badge ' + (r.is_active ? 'badge-success' : 'badge-gray') + '">' + (r.is_active ? 'Attiva' : 'Inattiva') + '</span></td>' +
          '<td>' + actions + '</td>' +
        '</tr>';
      }).join('');
    }).catch(function (err) {
      tbody.innerHTML = errorRow(6, 'Errore: ' + err.message);
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: VISITE MEDICHE                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadVisite(companyId) {
    var tbody = $('visiteBody');
    tbody.innerHTML = loadingRow(7);

    var status = ($('filterVisitStatus') || {}).value || '';
    var params = '?company_id=' + companyId + '&limit=50';
    if (status) params += '&status=' + status;

    api('GET', '/visits' + params).then(function (r) {
      if (!r.data || r.data.length === 0) {
        tbody.innerHTML = emptyRow(7, 'Nessuna visita registrata per questa azienda');
        return;
      }
      tbody.innerHTML = r.data.map(function (v) {
        var w = v.mdl_workers || {};
        return '<tr>' +
          '<td>' + fmtDate(v.scheduled_date) + '</td>' +
          '<td>' + esc(v.scheduled_time || '—') + '</td>' +
          '<td><strong>' + esc(w.last_name || '') + ' ' + esc(w.first_name || '') + '</strong></td>' +
          '<td>' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</td>' +
          '<td><span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '">' + esc(v.status) + '</span></td>' +
          '<td>—</td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="MDL.viewVisit(\'' + v.id + '\')">Apri</button></td>' +
        '</tr>';
      }).join('');
    }).catch(function (err) {
      tbody.innerHTML = errorRow(7, 'Errore: ' + err.message);
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: SCADENZE (per azienda)                                   */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadScadenze(companyId) {
    $('scadenzeList').innerHTML = '<p style="text-align:center;padding:1.5rem;color:#9ca3af">Caricamento scadenze...</p>';
    api('GET', '/deadlines?company_id=' + companyId).then(function (r) {
      var c = r.counts || {};
      $('cmpStatScadute').textContent = c.scadute || 0;
      $('cmpStatScad30').textContent = c.entro_30 || 0;
      $('cmpStatScad90').textContent = (c.entro_30 || 0) + (c.entro_60 || 0) + (c.entro_90 || 0);
      $('scadenzeList').innerHTML = renderDeadlinesTable(r.data || []);
    }).catch(function (e) {
      $('scadenzeList').innerHTML = '<p style="text-align:center;padding:1.5rem;color:#dc2626">Errore: ' + esc(e.message) + '</p>';
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: PROTOCOLLI                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadProtocolli() {
    var container = $('protocolliContent');
    if (!container) return;
    if (!state.activeCompany) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">Caricamento protocolli...</div>';

    api('GET', '/companies/' + state.activeCompany.id + '/protocols').then(function (r) {
      var protocols = r.data || [];
      state.activeProtocols = protocols;
      var canEditProt = state.user && ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'].indexOf(state.user.role) >= 0;
      if (protocols.length === 0) {
        container.innerHTML = '<div class="section-toolbar"><h3 style="font-size:1rem;font-weight:600">Protocolli Sanitari</h3>' +
          '<button class="btn btn-primary" onclick="MDL.newProtocolFromTemplate()">+ Nuovo Protocollo da modello</button></div>' +
          '<div class="empty-state"><div class="empty-state-icon">&#128203;</div>' +
          '<div class="empty-state-text">Nessun protocollo sanitario definito</div>' +
          '<div class="empty-state-sub">Seleziona un protocollo standard e assegnalo a una mansione</div></div>';
        return;
      }

      var html = '<div class="section-toolbar"><h3 style="font-size:1rem;font-weight:600">Protocolli Sanitari (' + protocols.length + ' mansioni)</h3>' +
        '<button class="btn btn-primary" onclick="MDL.newProtocolFromTemplate()">+ Nuovo Protocollo da modello</button></div>';

      html += protocols.map(function (p) {
        var jr = p.mdl_job_roles || {};
        var exams = p.mdl_protocol_exams || [];
        var groups = groupExamsByCategory(exams);
        var mandatory = exams.filter(function (e) { return e.is_mandatory; }).length;
        var optional = exams.length - mandatory;

        var card = '<div class="protocol-card">' +
          '<div class="protocol-card-header">' +
            '<div class="protocol-card-title">' +
              '<h4>' + esc(p.protocol_name) + ' <small style="color:#6b7280;font-weight:400">v' + esc(p.version || '1.0') + '</small></h4>' +
              '<div class="protocol-card-meta">' +
                '<span>Mansione: <strong>' + esc(jr.role_name || '—') + '</strong></span>' +
                (jr.risk_level ? ' <span class="badge badge-' + (RISK_BADGE[jr.risk_level] || 'gray') + '" style="font-size:0.65rem">Rischio ' + (RISK_LABEL[jr.risk_level] || jr.risk_level) + '</span>' : '') +
                '<span style="margin-left:0.5rem">Periodicita visita: <strong>' + (PERIODICITY_LABELS[p.visit_periodicity] || p.visit_periodicity) + '</strong></span>' +
              '</div>' +
            '</div>' +
            '<div class="protocol-card-stats">' +
              '<div class="protocol-stat"><span class="protocol-stat-num">' + exams.length + '</span><span class="protocol-stat-label">Esami totali</span></div>' +
              '<div class="protocol-stat"><span class="protocol-stat-num" style="color:var(--danger)">' + mandatory + '</span><span class="protocol-stat-label">Obbligatori</span></div>' +
              '<div class="protocol-stat"><span class="protocol-stat-num" style="color:#6b7280">' + optional + '</span><span class="protocol-stat-label">Opzionali</span></div>' +
            '</div>' +
          '</div>';

        /* Grouped exam lists */
        card += '<div class="protocol-exam-groups">';
        EXAM_CAT_ORDER.forEach(function (cat) {
          var catExams = groups[cat];
          if (!catExams || catExams.length === 0) return;
          card += '<div class="exam-cat-group">' +
            '<div class="exam-cat-header">' + (EXAM_CAT_ICONS[cat] || '') + ' ' + (EXAM_CAT_LABELS[cat] || cat) + ' <span class="exam-cat-count">(' + catExams.length + ')</span></div>' +
            '<div class="exam-cat-list">';
          catExams.forEach(function (e) {
            card += '<div class="exam-cat-item">' +
              '<code class="exam-cat-code">' + esc(e.exam_code) + '</code>' +
              '<span class="exam-cat-name">' + esc(e.exam_name) + '</span>' +
              '<span class="exam-cat-period">' + (PERIODICITY_LABELS[e.periodicity] || e.periodicity) + '</span>' +
              (e.is_mandatory ? '<span class="badge badge-danger" style="font-size:0.6rem">Obbl.</span>' : '<span class="badge badge-gray" style="font-size:0.6rem">Opz.</span>') +
            '</div>';
          });
          card += '</div></div>';
        });
        card += '</div>';

        if (jr.risk_factors && jr.risk_factors.length > 0) {
          card += '<div class="protocol-risk-factors"><strong>Fattori di rischio:</strong> ' +
            jr.risk_factors.map(function (f) { return '<span class="risk-factor-tag">' + esc(f) + '</span>'; }).join(' ') + '</div>';
        }
        if (p.notes) {
          card += '<div class="protocol-notes"><small class="text-muted">' + esc(p.notes) + '</small></div>';
        }
        if (canEditProt) {
          card += '<div class="protocol-card-actions" style="margin-top:0.6rem;display:flex;gap:0.5rem">' +
            '<button class="btn btn-outline btn-sm" onclick="MDL.editProtocol(\'' + p.id + '\')">Modifica</button>' +
            '<button class="btn btn-danger btn-sm" onclick="MDL.deleteProtocol(\'' + p.id + '\',\'' + esc(p.protocol_name || '') + '\')">Disattiva</button>' +
          '</div>';
        }

        card += '</div>';
        return card;
      }).join('');

      container.innerHTML = html;
    }).catch(function (err) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626">Errore: ' + esc(err.message) + '</div>';
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: DATI AZIENDA (info)                                      */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadCompanyInfo() {
    var c = state.activeCompany;
    if (!c) return;

    var grid = $('companyInfoGrid');
    grid.innerHTML =
      dl('Ragione Sociale', c.business_name) + dl('P.IVA', c.vat_number) +
      dl('Cod. Fiscale', c.fiscal_code) + dl('Codice ATECO', c.ateco_code) +
      dl('Settore', c.sector) + dl('Livello Rischio', RISK_LABEL[c.risk_level] || c.risk_level) +
      dl('Indirizzo', [c.address_street, c.address_city, c.address_province ? '(' + c.address_province + ')' : '', c.address_zip].filter(Boolean).join(', ') || null) +
      dl('PEC', c.pec_email) + dl('Telefono', c.phone) +
      dl('Email', c.email) + dl('N. Dipendenti', c.total_employees) +
      dl('Contratto', c.contract_type) + dl('Note', c.notes);

    var contacts = c.mdl_safety_contacts || [];
    var cEl = $('companySafetyContacts');
    if (contacts.length > 0) {
      cEl.innerHTML = '<div class="detail-section"><h4>Figure della Sicurezza (' + contacts.length + ')</h4>' +
        contacts.map(function (s) {
          return '<p style="font-size:0.82rem;margin-bottom:0.4rem">&bull; <strong>' + esc(s.role.toUpperCase()) + ':</strong> ' + esc(s.full_name) +
            (s.email ? ' — <span style="color:#6b7280">' + esc(s.email) + '</span>' : '') +
            (s.phone ? ' — ' + esc(s.phone) : '') +
            (s.is_external ? ' <span class="badge badge-info">Esterno</span>' : '') + '</p>';
        }).join('') + '</div>';
    } else {
      cEl.innerHTML = '';
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  TAB: DOCUMENTI AZIENDALI                                      */
  /* ═══════════════════════════════════════════════════════════════ */

  var DOC_SLOTS = [
    { key: 'dvr',                     icon: '📋', label: 'DVR',                                     desc: 'Documento di Valutazione dei Rischi' },
    { key: 'nomina_mc',               icon: '✍️', label: 'Nomina MC',                                desc: 'Nomina Medico Competente firmata' },
    { key: 'visura_camerale',          icon: '🏢', label: 'Visura Camerale',                          desc: 'Visura camerale aggiornata' },
    { key: 'documento_amministratore', icon: '👤', label: 'Documento Amministratore',                 desc: 'Documento identità Legale Rappresentante' }
  ];

  var DOC_SLOT_MAP = {};
  DOC_SLOTS.forEach(function (s) { DOC_SLOT_MAP[s.key] = s; });

  function loadDocumenti(companyId) {
    var container = $('companyDocsGrid');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#9ca3af">Caricamento documenti...</p>';

    api('GET', '/companies/' + companyId + '/documents').then(function (r) {
      var docs = r.data || [];

      // Build lookup: slot_key → latest doc (description field stores slot_key)
      var docBySlot = {};
      docs.forEach(function (d) {
        var slotKey = d.description || '';
        if (!docBySlot[slotKey] || new Date(d.created_at) > new Date(docBySlot[slotKey].created_at)) {
          docBySlot[slotKey] = d;
        }
      });

      var html = '<div class="doc-slots-grid">';
      DOC_SLOTS.forEach(function (slot) {
        var doc = docBySlot[slot.key];
        var hasDoc = !!doc;
        var isExpired = hasDoc && doc.expiry_date && daysUntil(doc.expiry_date) < 0;
        var isExpiringSoon = hasDoc && doc.expiry_date && daysUntil(doc.expiry_date) >= 0 && daysUntil(doc.expiry_date) <= 30;

        var statusClass = hasDoc ? (isExpired ? 'doc-expired' : (isExpiringSoon ? 'doc-expiring' : 'doc-ok')) : 'doc-missing';
        var statusLabel = hasDoc ? (isExpired ? 'Scaduto' : (isExpiringSoon ? 'In scadenza' : 'Caricato')) : 'Non caricato';
        var statusBadge = hasDoc ?
          (isExpired ? 'badge-danger' : (isExpiringSoon ? 'badge-warning' : 'badge-success')) :
          'badge-gray';

        html += '<div class="doc-slot-card ' + statusClass + '">' +
          '<div class="doc-slot-header">' +
            '<span class="doc-slot-icon">' + slot.icon + '</span>' +
            '<div class="doc-slot-title">' +
              '<strong>' + esc(slot.label) + '</strong>' +
              '<small>' + esc(slot.desc) + '</small>' +
            '</div>' +
            '<span class="badge ' + statusBadge + '">' + statusLabel + '</span>' +
          '</div>';

        if (hasDoc) {
          html += '<div class="doc-slot-info">' +
            '<div class="doc-slot-meta">' +
              '<span>📄 ' + esc(doc.original_name || 'documento') + '</span>' +
              '<span>' + fmtDate(doc.created_at) + '</span>' +
              (doc.file_size_bytes ? '<span>' + formatFileSize(doc.file_size_bytes) + '</span>' : '') +
            '</div>';
          if (doc.effective_date || doc.expiry_date) {
            html += '<div class="doc-slot-dates">';
            if (doc.effective_date) html += '<span>Validità dal: ' + fmtDate(doc.effective_date) + '</span>';
            if (doc.expiry_date) html += '<span>Scadenza: <strong' + (isExpired ? ' class="text-danger"' : (isExpiringSoon ? ' class="text-warning"' : '')) + '>' + fmtDate(doc.expiry_date) + '</strong></span>';
            html += '</div>';
          }
          html += '</div>' +
            '<div class="doc-slot-actions">' +
              '<button class="btn btn-primary btn-sm" onclick="MDL.downloadCompanyDoc(\'' + esc(doc.storage_path) + '\')">📥 Scarica</button> ' +
              '<button class="btn btn-outline btn-sm" onclick="MDL.uploadCompanyDoc(\'' + esc(slot.key) + '\')">🔄 Aggiorna</button> ' +
              '<button class="btn btn-danger btn-sm" onclick="MDL.deleteCompanyDoc(\'' + esc(doc.id) + '\',\'' + esc(slot.label) + '\')">🗑 Elimina</button>' +
            '</div>';
        } else {
          html += '<div class="doc-slot-empty">' +
            '<p>Nessun documento caricato</p>' +
            '<button class="btn btn-primary btn-sm" onclick="MDL.uploadCompanyDoc(\'' + esc(slot.key) + '\')">📤 Carica Documento</button>' +
          '</div>';
        }

        html += '</div>';
      });
      html += '</div>';

      // History section (all versions)
      if (docs.length > 0) {
        html += '<div class="doc-history-section">' +
          '<h4 style="margin-bottom:0.75rem;font-size:0.9rem;font-weight:600;color:var(--gray-700)">Storico Documenti (' + docs.length + ')</h4>' +
          '<div class="table-container"><table class="data-table"><thead><tr>' +
            '<th>Tipo</th><th>Nome File</th><th>Data Caricamento</th><th>Dim.</th><th>Validità</th><th>Scadenza</th><th>Azioni</th>' +
          '</tr></thead><tbody>';
        docs.forEach(function (d) {
          var slotInfo = DOC_SLOT_MAP[d.description] || { label: d.title || d.document_type };
          var expired = d.expiry_date && daysUntil(d.expiry_date) < 0;
          html += '<tr' + (expired ? ' style="opacity:0.6"' : '') + '>' +
            '<td><strong>' + esc(slotInfo.label || d.title) + '</strong></td>' +
            '<td>' + esc(d.original_name || '—') + '</td>' +
            '<td>' + fmtDate(d.created_at) + '</td>' +
            '<td>' + formatFileSize(d.file_size_bytes) + '</td>' +
            '<td>' + fmtDate(d.effective_date) + '</td>' +
            '<td>' + (expired ? '<span class="text-danger">' : '') + fmtDate(d.expiry_date) + (expired ? '</span>' : '') + '</td>' +
            '<td class="row-actions">' +
              '<button class="btn btn-outline btn-sm" onclick="MDL.downloadCompanyDoc(\'' + esc(d.storage_path) + '\')">📥</button> ' +
              '<button class="btn btn-danger btn-sm" onclick="MDL.deleteCompanyDoc(\'' + esc(d.id) + '\',\'' + esc(slotInfo.label || d.title) + '\')">🗑</button>' +
            '</td>' +
          '</tr>';
        });
        html += '</tbody></table></div></div>';
      }

      container.innerHTML = html;
    }).catch(function (err) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div>' +
        '<div class="empty-state-text">Errore caricamento documenti</div>' +
        '<div class="empty-state-sub">' + esc(err.message) + '</div></div>';
    });
  }

  function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  MDL.downloadCompanyDoc = function (path) {
    api('GET', '/files/download?path=' + encodeURIComponent(path)).then(function (r) {
      if (r.data && r.data.signedUrl) {
        window.open(r.data.signedUrl, '_blank');
      } else {
        toast('URL di download non disponibile', 'error');
      }
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.uploadCompanyDoc = function (slotKey) {
    var slot = DOC_SLOT_MAP[slotKey];
    if (!slot) return;

    var html = '<div class="form-grid">' +
      '<div class="form-group form-full">' +
        '<label>Tipo Documento</label>' +
        '<input type="text" class="form-input" value="' + esc(slot.label + ' — ' + slot.desc) + '" disabled>' +
      '</div>' +
      '<div class="form-group form-full">' +
        '<label>File (PDF, JPEG, PNG — max 25 MB) *</label>' +
        '<input type="file" class="form-input" id="docFileInput" accept=".pdf,.jpg,.jpeg,.png">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Data Validità (dal)</label>' +
        '<input type="date" class="form-input" id="docEffDate">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Data Scadenza</label>' +
        '<input type="date" class="form-input" id="docExpDate">' +
      '</div>' +
      '<div class="form-group form-full">' +
        '<label>Note</label>' +
        '<textarea class="form-input" id="docNotes" rows="2" placeholder="Note opzionali..."></textarea>' +
      '</div>' +
    '</div>';

    openModal('Carica ' + slot.label, html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" id="btnUploadDoc" onclick="MDL.doUploadCompanyDoc(\'' + esc(slotKey) + '\')">📤 Carica</button>'
    );
  };

  MDL.doUploadCompanyDoc = function (slotKey) {
    var fileInput = $('docFileInput');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      toast('Seleziona un file', 'warning');
      return;
    }
    var file = fileInput.files[0];
    var cid = state.activeCompany ? state.activeCompany.id : null;
    if (!cid) { toast('Azienda non selezionata', 'error'); return; }

    var fd = new FormData();
    fd.append('file', file);
    fd.append('slot_key', slotKey);
    var effDate = ($('docEffDate') || {}).value;
    var expDate = ($('docExpDate') || {}).value;
    var notes = ($('docNotes') || {}).value;
    if (effDate) fd.append('effective_date', effDate);
    if (expDate) fd.append('expiry_date', expDate);
    if (notes) fd.append('notes', notes);

    var btn = $('btnUploadDoc');
    if (btn) { btn.disabled = true; btn.textContent = 'Caricamento...'; }

    api('POST', '/companies/' + cid + '/documents', fd).then(function () {
      toast('Documento caricato con successo', 'success');
      closeModal();
      loadDocumenti(cid);
    }).catch(function (e) {
      toast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = '📤 Carica'; }
    });
  };

  MDL.deleteCompanyDoc = function (docId, label) {
    if (!confirm('Eliminare il documento "' + label + '"? Questa azione è irreversibile.')) return;
    var cid = state.activeCompany ? state.activeCompany.id : null;
    if (!cid) return;

    api('DELETE', '/companies/' + cid + '/documents?doc_id=' + docId).then(function () {
      toast('Documento eliminato', 'success');
      loadDocumenti(cid);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  SCADENZARIO GLOBALE                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadScadenzarioGlobale() {
    $('scadenzarioGlobal').innerHTML = '<p style="text-align:center;padding:1.5rem;color:#9ca3af">Caricamento scadenze...</p>';
    api('GET', '/deadlines').then(function (r) {
      var c = r.counts || {};
      $('globStatScadute').textContent = c.scadute || 0;
      $('globStatScad30').textContent = c.entro_30 || 0;
      $('globStatScad60').textContent = c.entro_60 || 0;
      $('globStatScad90').textContent = c.entro_90 || 0;
      $('scadenzarioGlobal').innerHTML = renderDeadlinesTable(r.data || []);
    }).catch(function (e) {
      $('scadenzarioGlobal').innerHTML = '<p style="text-align:center;padding:1.5rem;color:#dc2626">Errore: ' + esc(e.message) + '</p>';
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  GLOBAL: LAVORATORI (all companies)                            */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadLavoratoriGlobal() {
    var tbody = $('lavoratoriGlobalBody');
    tbody.innerHTML = loadingRow(7);

    populateCompanyFilter('filterLavAzienda');

    var search = ($('searchLavoratoriGlobal') || {}).value || '';
    var companyId = ($('filterLavAzienda') || {}).value || '';
    var params = '?limit=100';
    if (search.trim()) params += '&search=' + encodeURIComponent(search.trim());
    if (companyId) params += '&company_id=' + companyId;

    api('GET', '/workers' + params).then(function (r) {
      if (!r.data || r.data.length === 0) {
        tbody.innerHTML = emptyRow(7, 'Nessun lavoratore trovato');
        return;
      }
      tbody.innerHTML = r.data.map(function (w) {
        var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
        var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
        var companyName = w.mdl_companies ? w.mdl_companies.business_name : '—';
        return '<tr>' +
          '<td><strong>' + esc(w.last_name) + ' ' + esc(w.first_name) + '</strong></td>' +
          '<td><code>' + esc(w.fiscal_code) + '</code></td>' +
          '<td><a style="color:var(--primary);cursor:pointer" onclick="MDL.goCompany(\'' + w.company_id + '\')">' + esc(companyName) + '</a></td>' +
          '<td>' + esc(roleName) + '</td>' +
          '<td>—</td><td>—</td>' +
          '<td><button class="btn btn-primary btn-sm" onclick="MDL.openWorker(\'' + w.id + '\')">Scheda</button></td>' +
        '</tr>';
      }).join('');
    }).catch(function (err) {
      tbody.innerHTML = errorRow(7, 'Errore: ' + err.message);
    });
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  GLOBAL: VISITE (all companies)                                */
  /* ═══════════════════════════════════════════════════════════════ */
  function loadVisiteGlobal() {
    var tbody = $('visiteGlobalBody');
    tbody.innerHTML = loadingRow(7);

    populateCompanyFilter('filterVisiteAzienda');

    var status = ($('filterVisiteGlobalStatus') || {}).value || '';
    var companyId = ($('filterVisiteAzienda') || {}).value || '';
    var params = '?limit=50';
    if (status) params += '&status=' + status;
    if (companyId) params += '&company_id=' + companyId;

    api('GET', '/visits' + params).then(function (r) {
      if (!r.data || r.data.length === 0) {
        tbody.innerHTML = emptyRow(7, 'Nessuna visita trovata');
        return;
      }
      tbody.innerHTML = r.data.map(function (v) {
        var w = v.mdl_workers || {};
        return '<tr>' +
          '<td>' + fmtDate(v.scheduled_date) + '</td>' +
          '<td>' + esc(v.scheduled_time || '—') + '</td>' +
          '<td><strong>' + esc(w.last_name || '') + ' ' + esc(w.first_name || '') + '</strong></td>' +
          '<td>—</td>' +
          '<td>' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</td>' +
          '<td><span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '">' + esc(v.status) + '</span></td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="MDL.viewVisit(\'' + v.id + '\')">Apri</button></td>' +
        '</tr>';
      }).join('');
    }).catch(function (err) {
      tbody.innerHTML = errorRow(7, 'Errore: ' + err.message);
    });
  }

  function populateCompanyFilter(selectId) {
    var sel = $(selectId);
    if (!sel || sel.options.length > 1) return;
    if (state.companies.length > 0) {
      state.companies.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.business_name;
        sel.appendChild(opt);
      });
    } else {
      api('GET', '/companies?limit=100').then(function (r) {
        state.companies = r.data || [];
        state.companies.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.id; opt.textContent = c.business_name;
          sel.appendChild(opt);
        });
      }).catch(function () {});
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  WORKER DETAIL — SCHEDA LAVORATORE                             */
  /* ═══════════════════════════════════════════════════════════════ */
  function openWorkerDetail(workerId) {
    // Show section with loading
    state.section = 'worker-detail';
    document.querySelectorAll('#contentArea > .section').forEach(function (el) {
      el.id === 'sec-worker-detail' ? el.classList.remove('d-none') : el.classList.add('d-none');
    });
    $('workerDetailContent').innerHTML = '<div style="padding:3rem;text-align:center;color:#9ca3af">Caricamento scheda lavoratore...</div>';

    api('GET', '/workers/' + workerId).then(function (r) {
      if (!r.data) { toast('Lavoratore non trovato', 'error'); navigateTo('lavoratori'); return; }
      state.activeWorker = r.data;
      window.location.hash = 'lavoratore/' + workerId;

      var w = r.data.worker;
      // Update breadcrumb and title
      var crumbs = [{ label: 'Lavoratori', link: 'lavoratori' }];
      if (w.mdl_companies) {
        crumbs.push({ label: w.mdl_companies.business_name, link: 'azienda/' + w.company_id });
      }
      crumbs.push({ label: w.last_name + ' ' + w.first_name });
      setBreadcrumb(crumbs);
      $('pageTitle').textContent = w.last_name + ' ' + w.first_name;

      renderWorkerDetail(r.data);
      switchWorkerTab('wtab-panoramica');
    }).catch(function (err) {
      toast(err.message, 'error');
      navigateTo('lavoratori');
    });
  }

  function renderWorkerDetail(data) {
    var w = data.worker;
    var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
    var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
    var riskLevel = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.risk_level : null;
    var companyName = w.mdl_companies ? w.mdl_companies.business_name : '—';
    var initials = ((w.first_name || 'X')[0] + (w.last_name || 'X')[0]).toUpperCase();

    var html =
      /* Worker Header */
      '<div class="worker-detail-header">' +
        '<div class="worker-avatar-lg">' + esc(initials) + '</div>' +
        '<div class="worker-header-main">' +
          '<h2>' + esc(w.last_name) + ' ' + esc(w.first_name) + '</h2>' +
          '<div class="worker-header-meta">' +
            '<span>CF: <strong>' + esc(w.fiscal_code) + '</strong></span>' +
            '<span>Mansione: <strong>' + esc(roleName) + '</strong></span>' +
            '<span>Azienda: <a style="color:var(--primary);cursor:pointer" onclick="MDL.goCompany(\'' + w.company_id + '\')">' + esc(companyName) + '</a></span>' +
            (riskLevel ? '<span>Rischio: <span class="badge badge-' + (RISK_BADGE[riskLevel] || 'gray') + '">' + (RISK_LABEL[riskLevel] || riskLevel) + '</span></span>' : '') +
          '</div>' +
          '<div class="worker-fitness-summary">' + fitnessStatusIndicator(data.currentFitness) + '</div>' +
        '</div>' +
      '</div>' +

      /* Worker Tabs */
      '<div class="tab-bar" id="workerTabs">' +
        '<button class="tab-btn active" data-wtab="wtab-panoramica">Panoramica</button>' +
        '<button class="tab-btn" data-wtab="wtab-esami">Esami Previsti</button>' +
        '<button class="tab-btn" data-wtab="wtab-referti">Referti</button>' +
        '<button class="tab-btn" data-wtab="wtab-idoneita">Idoneit&agrave;</button>' +
        '<button class="tab-btn" data-wtab="wtab-visite">Visite</button>' +
        '<button class="tab-btn" data-wtab="wtab-anagrafica">Anagrafica</button>' +
      '</div>' +

      /* Tab Panels */
      '<div id="wtab-panoramica" class="tab-panel active"></div>' +
      '<div id="wtab-esami" class="tab-panel"></div>' +
      '<div id="wtab-referti" class="tab-panel"></div>' +
      '<div id="wtab-idoneita" class="tab-panel"></div>' +
      '<div id="wtab-visite" class="tab-panel"></div>' +
      '<div id="wtab-anagrafica" class="tab-panel"></div>';

    $('workerDetailContent').innerHTML = html;

    // Bind tab clicks
    document.querySelectorAll('#workerTabs .tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchWorkerTab(btn.getAttribute('data-wtab'));
      });
    });
  }

  function switchWorkerTab(tabId) {
    state.activeWorkerTab = tabId;
    document.querySelectorAll('#workerTabs .tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-wtab') === tabId);
    });
    document.querySelectorAll('#workerDetailContent .tab-panel').forEach(function (p) {
      p.id === tabId ? p.classList.add('active') : p.classList.remove('active');
    });

    if (!state.activeWorker) return;
    var loaders = {
      'wtab-panoramica': renderPanoramica,
      'wtab-esami': renderEsamiPrevisti,
      'wtab-referti': renderReferti,
      'wtab-idoneita': renderIdoneita,
      'wtab-visite': renderVisiteWorker,
      'wtab-anagrafica': renderAnagrafica
    };
    if (loaders[tabId]) loaders[tabId]();
  }

  /* ── PANORAMICA ─────────────────────────────────────────────── */
  function renderPanoramica() {
    var data = state.activeWorker;
    var w = data.worker;
    var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
    var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
    var riskLevel = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.risk_level : null;
    var fitness = data.currentFitness;
    var protocol = data.protocol;
    var totalExams = data.protocolExams.length;
    var completedExams = data.protocolExams.filter(function (e) { return e.completed; }).length;
    var nextVisitDate = fitness ? fitness.next_visit_date : null;

    var html =
      '<div class="panoramica-grid">' +
        /* Idoneità Card */
        '<div class="panoramica-card panoramica-card-fitness">' +
          '<h4>Idoneita Attuale</h4>' +
          (fitness ?
            '<div class="fitness-big-status">' + fitnessStatusIndicator(fitness) + '</div>' +
            '<div class="fitness-detail-mini">' +
              '<div>' + esc(FITNESS_LABELS[fitness.judgment_type] || fitness.judgment_type) + '</div>' +
              '<div class="text-muted">Emessa: ' + fmtDate(fitness.issued_date) + '</div>' +
              (fitness.prescriptions ? '<div class="fitness-prescriptions"><strong>Prescrizioni:</strong> ' + esc(fitness.prescriptions) + '</div>' : '') +
              (fitness.limitations ? '<div class="fitness-prescriptions"><strong>Limitazioni:</strong> ' + esc(fitness.limitations) + '</div>' : '') +
              '<div class="text-muted">Prossima visita: ' + fmtDate(nextVisitDate) + '</div>' +
            '</div>'
          :
            '<div class="fitness-big-status"><span class="semaforo semaforo-grigio">&#9679;</span> <span class="semaforo-label">Nessuna idoneita registrata</span></div>'
          ) +
          '<button class="btn btn-primary btn-sm mt-1" onclick="MDL.uploadIdoneita()">Carica Idoneita</button>' +
        '</div>' +

        /* Esami Card */
        '<div class="panoramica-card">' +
          '<h4>Protocollo Sanitario</h4>' +
          (protocol ?
            '<div class="text-muted mb-1">' + esc(protocol.protocol_name) + ' <small>(' + (PERIODICITY_LABELS[protocol.visit_periodicity] || protocol.visit_periodicity) + ')</small></div>' +
            '<div class="exam-progress">' +
              '<div class="exam-progress-bar"><div class="exam-progress-fill" style="width:' + (totalExams ? Math.round(completedExams / totalExams * 100) : 0) + '%"></div></div>' +
              '<div class="exam-progress-text">' + completedExams + '/' + totalExams + ' esami completati</div>' +
            '</div>' +
            (function () {
              var pGroups = groupExamsByCategory(data.protocolExams);
              var miniHtml = '<div class="panoramica-exam-list">';
              EXAM_CAT_ORDER.forEach(function (cat) {
                var ce = pGroups[cat];
                if (!ce || ce.length === 0) return;
                miniHtml += '<div class="panoramica-exam-cat">' +
                  '<span class="panoramica-exam-cat-label">' + (EXAM_CAT_ICONS[cat] || '') + ' ' + (EXAM_CAT_LABELS[cat] || cat) + '</span>' +
                  '<span class="panoramica-exam-cat-list">' + ce.map(function (e) {
                    return '<span class="panoramica-exam-tag' + (e.completed ? ' exam-tag-done' : '') + '" title="' + esc(e.exam_name) + ' (' + (PERIODICITY_LABELS[e.periodicity] || e.periodicity) + ')">' + esc(e.exam_code) + '</span>';
                  }).join('') + '</span></div>';
              });
              miniHtml += '</div>';
              return miniHtml;
            })()
          :
            '<div class="text-muted">Nessun protocollo assegnato</div>'
          ) +
        '</div>' +

        /* Visite Card */
        '<div class="panoramica-card">' +
          '<h4>Visite Recenti</h4>' +
          (data.visits.length > 0 ?
            data.visits.slice(0, 3).map(function (v) {
              return '<div class="mini-visit-row">' +
                '<span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '">' + esc(v.status) + '</span>' +
                '<span>' + fmtDate(v.scheduled_date) + '</span>' +
                '<span class="text-muted">' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</span>' +
              '</div>';
            }).join('')
          :
            '<div class="text-muted">Nessuna visita</div>'
          ) +
          '<button class="btn btn-outline btn-sm mt-1" onclick="MDL.scheduleVisitForCurrent()">Programma Visita</button>' +
        '</div>' +

        /* Anagrafica Quick Card */
        '<div class="panoramica-card">' +
          '<h4>Informazioni</h4>' +
          '<div style="font-size:0.82rem">' +
            '<p><strong>Data Nascita:</strong> ' + fmtDate(w.date_of_birth) + '</p>' +
            '<p><strong>Assunzione:</strong> ' + fmtDate(w.hire_date) + '</p>' +
            '<p><strong>Mansione:</strong> ' + esc(roleName) + '</p>' +
            (riskLevel ? '<p><strong>Rischio:</strong> <span class="badge badge-' + (RISK_BADGE[riskLevel] || 'gray') + '">' + (RISK_LABEL[riskLevel] || riskLevel) + '</span></p>' : '') +
            '<p><strong>Contratto:</strong> ' + esc(w.contract_type || '—') + '</p>' +
            (w.department ? '<p><strong>Reparto:</strong> ' + esc(w.department) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    $('wtab-panoramica').innerHTML = html;
  }

  /* ── ESAMI PREVISTI ─────────────────────────────────────────── */
  function renderEsamiPrevisti() {
    var data = state.activeWorker;
    var exams = data.protocolExams;

    if (!data.protocol || exams.length === 0) {
      $('wtab-esami').innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128269;</div>' +
        '<div class="empty-state-text">Nessun protocollo sanitario assegnato</div>' +
        '<div class="empty-state-sub">Assegna una mansione con protocollo per vedere gli esami previsti</div></div>';
      return;
    }

    var mandatory = exams.filter(function (e) { return e.is_mandatory; }).length;
    var completed = exams.filter(function (e) { return e.completed; }).length;
    var groups = groupExamsByCategory(exams);

    var html = '<div class="section-toolbar">' +
      '<h3 style="font-size:1rem;font-weight:600">' + esc(data.protocol.protocol_name) +
        ' <span class="text-muted" style="font-weight:400;font-size:0.82rem">(' + (PERIODICITY_LABELS[data.protocol.visit_periodicity] || data.protocol.visit_periodicity) + ')</span></h3>' +
      '<div class="exam-summary-badges">' +
        '<span class="badge badge-primary">' + exams.length + ' esami</span> ' +
        '<span class="badge badge-danger">' + mandatory + ' obbligatori</span> ' +
        '<span class="badge badge-' + (completed === exams.length ? 'success' : 'warning') + '">' + completed + '/' + exams.length + ' completati</span>' +
      '</div></div>';

    /* Render grouped by category */
    EXAM_CAT_ORDER.forEach(function (cat) {
      var catExams = groups[cat];
      if (!catExams || catExams.length === 0) return;
      var catCompleted = catExams.filter(function (e) { return e.completed; }).length;

      html += '<div class="exam-category-section">' +
        '<div class="exam-category-title">' + (EXAM_CAT_ICONS[cat] || '') + ' ' + (EXAM_CAT_LABELS[cat] || cat) +
        ' <span class="exam-cat-count">(' + catCompleted + '/' + catExams.length + ' completati)</span></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr>' +
        '<th style="width:40px">Stato</th><th style="width:60px">Codice</th><th>Esame</th><th>Periodicita</th><th style="width:60px">Obbl.</th><th>Ultimo Risultato</th><th>Data</th>' +
        '</tr></thead><tbody>';

      html += catExams.map(function (e) {
        var statusIcon = e.completed ?
          '<span class="exam-status exam-done" title="Completato">&#10004;</span>' :
          '<span class="exam-status exam-pending" title="Da eseguire">&#9711;</span>';
        var lastResult = e.latestResult;
        var resultText = '—';
        var resultDate = '—';
        if (lastResult) {
          resultText = lastResult.result_text || lastResult.result_value || '—';
          if (lastResult.is_abnormal) resultText = '<span class="text-danger">' + esc(String(resultText)) + ' &#9888;</span>';
          else if (lastResult.is_normal) resultText = '<span class="text-success">' + esc(String(resultText)) + '</span>';
          else resultText = esc(String(resultText));
          resultDate = fmtDate(lastResult.exam_date);
        }
        return '<tr' + (!e.completed ? ' class="exam-row-pending"' : '') + '>' +
          '<td>' + statusIcon + '</td>' +
          '<td><code>' + esc(e.exam_code) + '</code></td>' +
          '<td><strong>' + esc(e.exam_name) + '</strong></td>' +
          '<td>' + (PERIODICITY_LABELS[e.periodicity] || esc(e.periodicity || '—')) + '</td>' +
          '<td>' + (e.is_mandatory ? '<span class="badge badge-danger">Si</span>' : '<span class="badge badge-gray">No</span>') + '</td>' +
          '<td>' + resultText + '</td>' +
          '<td>' + resultDate + '</td>' +
        '</tr>';
      }).join('');

      html += '</tbody></table></div></div>';
    });

    $('wtab-esami').innerHTML = html;
  }

  /* ── REFERTI ────────────────────────────────────────────────── */
  function renderReferti() {
    var data = state.activeWorker;
    var exams = data.visitExams;

    var html = '<div class="section-toolbar">' +
      '<h3 style="font-size:1rem;font-weight:600">Referti (' + exams.length + ')</h3>' +
      '<button class="btn btn-primary" onclick="MDL.uploadReferto()">&#128206; Carica Referto</button>' +
    '</div>';

    if (exams.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">&#128196;</div>' +
        '<div class="empty-state-text">Nessun referto caricato</div>' +
        '<div class="empty-state-sub">Carica i referti degli esami eseguiti</div></div>';
      $('wtab-referti').innerHTML = html;
      return;
    }

    html += '<div class="table-container"><table class="data-table">' +
      '<thead><tr><th>Data</th><th>Codice</th><th>Esame</th><th>Risultato</th><th>Normale</th><th>Visita</th><th>Allegato</th></tr></thead><tbody>';

    html += exams.map(function (e) {
      var normalBadge = e.is_abnormal ? '<span class="badge badge-danger">Anomalo</span>' :
        (e.is_normal ? '<span class="badge badge-success">Normale</span>' : '<span class="badge badge-gray">—</span>');
      var visitDate = e.mdl_visits ? fmtDate(e.mdl_visits.scheduled_date) : '—';
      var attachBtn = e.attachment_path ?
        '<button class="btn btn-outline btn-sm" onclick="MDL.downloadFile(\'' + esc(e.attachment_path) + '\')">&#128196; Scarica</button>' :
        '<span class="text-muted">—</span>';
      return '<tr>' +
        '<td>' + fmtDate(e.exam_date) + '</td>' +
        '<td><code>' + esc(e.exam_code) + '</code></td>' +
        '<td><strong>' + esc(e.exam_name) + '</strong></td>' +
        '<td>' + esc(e.result_text || e.result_value || '—') + (e.result_unit ? ' ' + esc(e.result_unit) : '') +
          (e.reference_range ? ' <small class="text-muted">(' + esc(e.reference_range) + ')</small>' : '') + '</td>' +
        '<td>' + normalBadge + '</td>' +
        '<td>' + visitDate + '</td>' +
        '<td>' + attachBtn + '</td>' +
      '</tr>';
    }).join('');

    html += '</tbody></table></div>';
    $('wtab-referti').innerHTML = html;
  }

  /* ── IDONEITA ───────────────────────────────────────────────── */
  function renderIdoneita() {
    var data = state.activeWorker;
    var judgments = data.fitnessJudgments;

    var html = '<div class="section-toolbar">' +
      '<h3 style="font-size:1rem;font-weight:600">Giudizi di Idoneit&agrave; (' + judgments.length + ')</h3>' +
      '<button class="btn btn-primary" onclick="MDL.uploadIdoneita()">&#128196; Carica Idoneit&agrave;</button>' +
    '</div>';

    if (judgments.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">&#128203;</div>' +
        '<div class="empty-state-text">Nessuna idoneita registrata</div>' +
        '<div class="empty-state-sub">Carica il primo giudizio di idoneita</div></div>';
      $('wtab-idoneita').innerHTML = html;
      return;
    }

    html += '<div class="idoneita-timeline">';
    html += judgments.map(function (f, i) {
      var isCurrent = f.is_current;
      var days = daysUntil(f.next_visit_date);
      var statusClass = 'semaforo-grigio';
      if (isCurrent) {
        if (f.judgment_type === 'non_idoneo_permanente' || f.judgment_type === 'temporaneamente_non_idoneo') statusClass = 'semaforo-rosso';
        else if (days !== null && days < 0) statusClass = 'semaforo-rosso';
        else if (days !== null && days <= 30) statusClass = 'semaforo-rosso';
        else if (days !== null && days <= 90) statusClass = 'semaforo-giallo';
        else statusClass = 'semaforo-verde';
      }

      return '<div class="idoneita-card' + (isCurrent ? ' idoneita-current' : '') + '">' +
        '<div class="idoneita-card-header">' +
          '<span class="semaforo ' + statusClass + '">&#9679;</span>' +
          '<span class="idoneita-type">' + esc(FITNESS_LABELS[f.judgment_type] || f.judgment_type) + '</span>' +
          (isCurrent ? '<span class="badge badge-primary">Corrente</span>' : '<span class="badge badge-gray">Storico</span>') +
          '<span class="idoneita-date">' + fmtDate(f.issued_date) + '</span>' +
        '</div>' +
        '<div class="idoneita-card-body">' +
          (f.prescriptions ? '<div class="idoneita-detail"><strong>Prescrizioni:</strong> ' + esc(f.prescriptions) + '</div>' : '') +
          (f.limitations ? '<div class="idoneita-detail"><strong>Limitazioni:</strong> ' + esc(f.limitations) + '</div>' : '') +
          (f.next_visit_date ? '<div class="idoneita-detail"><strong>Prossima visita:</strong> ' + fmtDate(f.next_visit_date) +
            (isCurrent && days !== null ? ' <span class="text-muted">(' + (days >= 0 ? 'tra ' + days + ' giorni' : 'scaduta da ' + Math.abs(days) + ' giorni') + ')</span>' : '') + '</div>' : '') +
          (f.reevaluation_date ? '<div class="idoneita-detail"><strong>Rivalutazione:</strong> ' + fmtDate(f.reevaluation_date) + '</div>' : '') +
        '</div>' +
        '<div class="idoneita-card-actions">' +
          '<button class="btn btn-primary btn-sm" onclick="MDL.generateCertificate(\'' + f.id + '\')">&#128221; Genera</button> ' +
          (f.pdf_path ?
            '<button class="btn btn-outline btn-sm" onclick="MDL.downloadFile(\'' + esc(f.pdf_path) + '\')">&#128196; Scarica PDF</button>' :
            '<span class="text-muted" style="font-size:0.75rem">Nessun PDF caricato</span>') +
        '</div>' +
      '</div>';
    }).join('');
    html += '</div>';

    $('wtab-idoneita').innerHTML = html;
  }

  /* ── VISITE (per lavoratore) ────────────────────────────────── */
  function renderVisiteWorker() {
    var data = state.activeWorker;
    var visits = data.visits;

    var html = '<div class="section-toolbar">' +
      '<h3 style="font-size:1rem;font-weight:600">Storico Visite (' + visits.length + ')</h3>' +
      '<button class="btn btn-primary" onclick="MDL.scheduleVisitForCurrent()">+ Programma Visita</button>' +
    '</div>';

    if (visits.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">&#128197;</div>' +
        '<div class="empty-state-text">Nessuna visita registrata</div></div>';
      $('wtab-visite').innerHTML = html;
      return;
    }

    html += '<div class="table-container"><table class="data-table">' +
      '<thead><tr><th>Data Programmata</th><th>Ora</th><th>Tipo</th><th>Stato</th><th>Data Effettiva</th>' + (isClinicalRole() ? '<th>Note</th>' : '') + '</tr></thead><tbody>';

    html += visits.map(function (v) {
      return '<tr>' +
        '<td>' + fmtDate(v.scheduled_date) + '</td>' +
        '<td>' + esc(v.scheduled_time || '—') + '</td>' +
        '<td>' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</td>' +
        '<td><span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '">' + esc(v.status) + '</span></td>' +
        '<td>' + fmtDate(v.actual_date) + '</td>' +
        (isClinicalRole() ? '<td style="max-width:200px;white-space:normal;font-size:0.78rem">' + esc(v.notes || '—') + '</td>' : '') +
      '</tr>';
    }).join('');

    html += '</tbody></table></div>';
    $('wtab-visite').innerHTML = html;
  }

  /* ── ANAGRAFICA ─────────────────────────────────────────────── */
  function renderAnagrafica() {
    var w = state.activeWorker.worker;
    var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
    var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';

    var html = '<div class="detail-grid">' +
      dl('Cognome', w.last_name) + dl('Nome', w.first_name) +
      dl('Codice Fiscale', w.fiscal_code) + dl('Data Nascita', fmtDate(w.date_of_birth)) +
      dl('Luogo Nascita', w.place_of_birth) + dl('Sesso', w.gender === 'M' ? 'Maschio' : w.gender === 'F' ? 'Femmina' : w.gender) +
      dl('Indirizzo', [w.address_street, w.address_city, w.address_province ? '(' + w.address_province + ')' : '', w.address_zip].filter(Boolean).join(', ') || null) +
      dl('Telefono', w.phone) + dl('Email', w.email) + dl('Lingua', w.language) +
      '</div>' +
      '<div class="detail-section"><h4>Informazioni Lavorative</h4><div class="detail-grid">' +
      dl('Data Assunzione', fmtDate(w.hire_date)) + dl('Tipo Contratto', w.contract_type) +
      dl('Mansione Attuale', roleName) + dl('Reparto', w.department) +
      dl('Qualifica', w.qualification) + dl('Turno', w.work_schedule) +
      '</div></div>' +
      /* PHASE 0 FIX: Condizioni Particolari visibili SOLO a ruoli clinici (MC/SA) */
      (canSeeSensitiveData() ?
        '<div class="detail-section"><h4>Condizioni Particolari</h4><div class="detail-grid">' +
        dl('Gestante', w.is_pregnant ? 'Si' : 'No') + dl('Minore', w.is_minor ? 'Si' : 'No') +
        dl('Disabilita', w.is_disabled ? 'Si' : 'No') + dl('Lav. Notturno', w.is_night_worker ? 'Si' : 'No') +
        '</div></div>'
      : /* Non-clinical: show only non-sensitive flag */
        '<div class="detail-section"><h4>Condizioni Particolari</h4><div class="detail-grid">' +
        dl('Lav. Notturno', w.is_night_worker ? 'Si' : 'No') +
        '</div></div>'
      ) +
      (canSeeSensitiveData() && w.notes ? '<div class="detail-section"><h4>Note</h4><p style="font-size:0.85rem">' + esc(w.notes) + '</p></div>' : '');

    $('wtab-anagrafica').innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  MODALS: New Company, New Worker, New Visit                    */
  /* ═══════════════════════════════════════════════════════════════ */
  function companyFormHtml(c) {
    c = c || {};
    return '<div class="form-grid">' +
      '<div class="form-group form-full"><label>Ragione Sociale *</label><input type="text" class="form-input" id="cmpName" value="' + esc(c.business_name || '') + '"></div>' +
      '<div class="form-group"><label>P.IVA *</label><input type="text" class="form-input" id="cmpVat" value="' + esc(c.vat_number || '') + '" maxlength="11"></div>' +
      '<div class="form-group"><label>Cod. Fiscale</label><input type="text" class="form-input" id="cmpCf" value="' + esc(c.fiscal_code || '') + '"></div>' +
      '<div class="form-group"><label>Codice ATECO</label><input type="text" class="form-input" id="cmpAteco" value="' + esc(c.ateco_code || '') + '"></div>' +
      '<div class="form-group"><label>Settore</label><input type="text" class="form-input" id="cmpSector" value="' + esc(c.sector || '') + '"></div>' +
      '<div class="form-group"><label>Livello Rischio</label><select class="form-input" id="cmpRisk">' +
        '<option value="basso"' + (c.risk_level === 'basso' ? ' selected' : '') + '>Basso</option>' +
        '<option value="medio"' + (c.risk_level === 'medio' ? ' selected' : '') + '>Medio</option>' +
        '<option value="alto"' + (c.risk_level === 'alto' ? ' selected' : '') + '>Alto</option></select></div>' +
      '<div class="form-group form-full"><label>Indirizzo</label><input type="text" class="form-input" id="cmpStreet" value="' + esc(c.address_street || '') + '"></div>' +
      '<div class="form-group"><label>Citta</label><input type="text" class="form-input" id="cmpCity" value="' + esc(c.address_city || '') + '"></div>' +
      '<div class="form-group"><label>Provincia</label><input type="text" class="form-input" id="cmpProv" value="' + esc(c.address_province || '') + '" maxlength="2"></div>' +
      '<div class="form-group"><label>CAP</label><input type="text" class="form-input" id="cmpZip" value="' + esc(c.address_zip || '') + '" maxlength="5"></div>' +
      '<div class="form-group"><label>PEC</label><input type="email" class="form-input" id="cmpPec" value="' + esc(c.pec_email || '') + '"></div>' +
      '<div class="form-group"><label>Telefono</label><input type="text" class="form-input" id="cmpPhone" value="' + esc(c.phone || '') + '"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" class="form-input" id="cmpEmail" value="' + esc(c.email || '') + '"></div>' +
      '<div class="form-group"><label>N. Dipendenti</label><input type="number" class="form-input" id="cmpEmp" value="' + (c.total_employees || '') + '"></div>' +
      '<div class="form-group form-full"><label>Note</label><textarea class="form-input" id="cmpNotes">' + esc(c.notes || '') + '</textarea></div>' +
    '</div>';
  }

  function readCompanyForm() {
    var v = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    return {
      business_name: v('cmpName'), vat_number: v('cmpVat'), fiscal_code: v('cmpCf'),
      ateco_code: v('cmpAteco'), sector: v('cmpSector'), risk_level: v('cmpRisk'),
      address_street: v('cmpStreet'), address_city: v('cmpCity'),
      address_province: v('cmpProv').toUpperCase(), address_zip: v('cmpZip'),
      pec_email: v('cmpPec'), phone: v('cmpPhone'), email: v('cmpEmail'),
      total_employees: parseInt(v('cmpEmp')) || null, notes: v('cmpNotes') || null
    };
  }

  function showNewWorkerModal(preCompanyId) {
    var roles = (state.activeCompany && state.activeCompany.mdl_job_roles) || [];
    var roleOpts = roles.map(function (r) {
      return '<option value="' + r.id + '">' + esc(r.role_name) + '</option>';
    }).join('');

    var html = '<div class="form-grid">' +
      '<div class="form-group"><label>Cognome *</label><input type="text" class="form-input" id="wrkLastName"></div>' +
      '<div class="form-group"><label>Nome *</label><input type="text" class="form-input" id="wrkFirstName"></div>' +
      '<div class="form-group"><label>Codice Fiscale *</label><input type="text" class="form-input" id="wrkCf" maxlength="16" style="text-transform:uppercase"></div>' +
      '<div class="form-group"><label>Data Nascita *</label><input type="date" class="form-input" id="wrkDob"></div>' +
      '<div class="form-group"><label>Sesso *</label><select class="form-input" id="wrkGender"><option value="M">Maschio</option><option value="F">Femmina</option></select></div>' +
      '<div class="form-group"><label>Luogo Nascita</label><input type="text" class="form-input" id="wrkBirthPlace"></div>' +
      '<div class="form-group"><label>Mansione</label><select class="form-input" id="wrkRole"><option value="">— Seleziona —</option>' + roleOpts + '</select></div>' +
      '<div class="form-group"><label>Data Assunzione</label><input type="date" class="form-input" id="wrkHire"></div>' +
      '<div class="form-group"><label>Tipo Contratto</label><select class="form-input" id="wrkContract">' +
        '<option value="indeterminato">Indeterminato</option><option value="determinato">Determinato</option>' +
        '<option value="somministrato">Somministrato</option><option value="apprendista">Apprendista</option>' +
        '<option value="collaborazione">Collaborazione</option><option value="tirocinio">Tirocinio</option>' +
        '<option value="altro">Altro</option></select></div>' +
      '<div class="form-group"><label>Reparto</label><input type="text" class="form-input" id="wrkDept"></div>' +
      '<div class="form-group"><label>Telefono</label><input type="text" class="form-input" id="wrkPhone"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" class="form-input" id="wrkEmail"></div>' +
      '<div class="form-group form-full"><label>Note</label><textarea class="form-input" id="wrkNotes"></textarea></div>' +
    '</div>';

    openModal('Nuovo Dipendente', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveNewWorker()">Salva Dipendente</button>');
  }

  function showNewVisitModal(wid, wname) {
    var cid = state.activeCompany ? state.activeCompany.id : '';
    var workerSelect = '';
    if (wid) {
      workerSelect = '<input type="hidden" id="visitWorker" value="' + wid + '">' +
        '<div class="form-group"><label>Lavoratore</label><input class="form-input" value="' + esc(wname || '') + '" disabled></div>';
    } else {
      workerSelect = '<div class="form-group"><label>Lavoratore *</label><select class="form-input" id="visitWorker"><option value="">Caricamento...</option></select></div>';
    }

    var html = workerSelect +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Tipo Visita *</label><select class="form-input" id="visitType">' +
        '<option value="periodica">Periodica</option><option value="preventiva">Preventiva</option>' +
        '<option value="richiesta_lavoratore">Su richiesta</option><option value="cambio_mansione">Cambio mansione</option>' +
        '<option value="cessazione">Cessazione</option><option value="straordinaria">Straordinaria</option></select></div>' +
      '<div class="form-group"><label>Data *</label><input type="date" class="form-input" id="visitDate" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div class="form-group"><label>Ora</label><input type="time" class="form-input" id="visitTime"></div>' +
      '<div class="form-group"><label>Sede</label><input type="text" class="form-input" id="visitLocation"></div>' +
      '</div>' +
      '<div class="form-group"><label>Note</label><textarea class="form-input" id="visitNotes"></textarea></div>';

    openModal('Programma Visita', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveNewVisit()">Salva Visita</button>');

    if (!wid && cid) {
      api('GET', '/workers?company_id=' + cid + '&limit=100').then(function (r) {
        var sel = $('visitWorker');
        if (sel) {
          sel.innerHTML = '<option value="">— Seleziona lavoratore —</option>' +
            (r.data || []).map(function (w) {
              return '<option value="' + w.id + '">' + esc(w.last_name + ' ' + w.first_name) + '</option>';
            }).join('');
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  UPLOAD MODALS (Referti & Idoneità)                            */
  /* ═══════════════════════════════════════════════════════════════ */
  function showUploadRefertoModal() {
    var data = state.activeWorker;
    if (!data) return;
    var w = data.worker;

    // Build exam code options from protocol
    var examOpts = data.protocolExams.map(function (e) {
      return '<option value="' + esc(e.exam_code) + '">' + esc(e.exam_code + ' — ' + e.exam_name) + '</option>';
    }).join('');

    // Build visit options
    var visitOpts = data.visits.map(function (v) {
      return '<option value="' + v.id + '">' + fmtDate(v.scheduled_date) + ' — ' + (VISIT_LABELS[v.visit_type] || v.visit_type) + ' (' + v.status + ')</option>';
    }).join('');

    var html = '<p style="font-size:0.85rem;margin-bottom:1rem">Carica un referto per <strong>' + esc(w.last_name + ' ' + w.first_name) + '</strong></p>' +
      '<div class="form-grid">' +
        '<div class="form-group"><label>Visita di riferimento *</label><select class="form-input" id="uploadVisitId">' +
          '<option value="">— Seleziona visita —</option>' + visitOpts + '</select></div>' +
        '<div class="form-group"><label>Esame *</label><select class="form-input" id="uploadExamCode">' +
          '<option value="">— Seleziona esame —</option>' + examOpts + '</select></div>' +
        '<div class="form-group form-full"><label>File PDF/Immagine *</label>' +
          '<input type="file" class="form-input" id="uploadFile" accept=".pdf,.jpg,.jpeg,.png" style="padding:0.35rem"></div>' +
      '</div>' +
      '<div class="detail-section" style="margin-top:0.75rem"><h4>Esito esame (compilazione referto)</h4>' +
      '<div class="form-grid">' +
        '<div class="form-group"><label>Data esame</label><input type="date" class="form-input" id="refExamDate" value="' + new Date().toISOString().slice(0,10) + '"></div>' +
        '<div class="form-group"><label>Laboratorio / Struttura</label><input type="text" class="form-input" id="refLab" placeholder="Es. Lab. Bio-Clinic"></div>' +
        '<div class="form-group"><label>Valore</label><input type="text" class="form-input" id="refValue" placeholder="Es. 14.2"></div>' +
        '<div class="form-group"><label>Unità</label><input type="text" class="form-input" id="refUnit" placeholder="Es. g/dL"></div>' +
        '<div class="form-group"><label>Range di riferimento</label><input type="text" class="form-input" id="refRange" placeholder="Es. 13.0-17.0"></div>' +
        '<div class="form-group"><label>Esito</label><select class="form-input" id="refNormal">' +
          '<option value="">— Non specificato —</option>' +
          '<option value="normal">Nella norma</option>' +
          '<option value="abnormal">Alterato / anomalo</option></select></div>' +
        '<div class="form-group form-full"><label>Refertazione / note</label><textarea class="form-input" id="refText" rows="2" placeholder="Descrizione testuale del referto..."></textarea></div>' +
      '</div></div>';

    openModal('Carica Referto', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" id="btnDoUploadReferto" onclick="MDL.doUploadReferto()">Carica</button>');
  }

  function showUploadIdoneitaModal() {
    var data = state.activeWorker;
    if (!data) return;
    var w = data.worker;

    // Build fitness judgment options (to link PDF)
    var fitOpts = data.fitnessJudgments.map(function (f) {
      return '<option value="' + f.id + '">' + fmtDate(f.issued_date) + ' — ' + esc(FITNESS_LABELS[f.judgment_type] || f.judgment_type) +
        (f.is_current ? ' (Corrente)' : '') + '</option>';
    }).join('');

    var html = '<p style="font-size:0.85rem;margin-bottom:1rem">Carica un certificato di idoneita per <strong>' + esc(w.last_name + ' ' + w.first_name) + '</strong></p>' +
      '<div class="form-group"><label>Giudizio di riferimento</label><select class="form-input" id="uploadFitnessId">' +
        '<option value="">— Nessun giudizio (carica come allegato) —</option>' + fitOpts + '</select></div>' +
      '<div class="form-group"><label>File PDF *</label>' +
        '<input type="file" class="form-input" id="uploadFile" accept=".pdf,.jpg,.jpeg,.png" style="padding:0.35rem"></div>';

    openModal('Carica Idoneita', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" id="btnDoUploadIdoneita" onclick="MDL.doUploadIdoneita()">Carica</button>');
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  MDL PUBLIC API (onclick handlers)                             */
  /* ═══════════════════════════════════════════════════════════════ */

  MDL.closeModal = function () { hide('modalOverlay'); };

  MDL.openWorker = function (id) { openWorkerDetail(id); };

  MDL.saveNewCompany = function () {
    var d = readCompanyForm();
    if (!d.business_name || !d.vat_number) { toast('Ragione sociale e P.IVA obbligatori', 'warning'); return; }
    api('POST', '/companies', d).then(function () {
      closeModal(); toast('Azienda creata', 'success'); loadAziende();
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.editCompany = function () {
    if (!state.activeCompany) return;
    openModal('Modifica Azienda', companyFormHtml(state.activeCompany),
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.updateCompany()">Salva</button>');
  };

  MDL.updateCompany = function () {
    if (!state.activeCompany) return;
    var d = readCompanyForm();
    if (!d.business_name) { toast('Ragione sociale obbligatoria', 'warning'); return; }
    api('PATCH', '/companies/' + state.activeCompany.id, d).then(function () {
      closeModal(); toast('Azienda aggiornata', 'success');
      openCompany(state.activeCompany.id);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.disableCompany = function () {
    if (!state.activeCompany) return;
    if (!confirm('Disattivare questa azienda?')) return;
    api('DELETE', '/companies/' + state.activeCompany.id).then(function () {
      toast('Azienda disattivata', 'success');
      navigateTo('aziende');
      window.location.hash = 'aziende';
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.saveNewWorker = function () {
    if (!state.activeCompany) return;
    var v = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    var d = {
      company_id: state.activeCompany.id,
      last_name: v('wrkLastName'), first_name: v('wrkFirstName'),
      fiscal_code: v('wrkCf').toUpperCase(),
      date_of_birth: v('wrkDob'), gender: v('wrkGender'),
      place_of_birth: v('wrkBirthPlace') || null,
      job_role_id: v('wrkRole') || null,
      hire_date: v('wrkHire') || null,
      contract_type: v('wrkContract') || 'indeterminato',
      department: v('wrkDept') || null,
      phone: v('wrkPhone') || null, email: v('wrkEmail') || null,
      notes: v('wrkNotes') || null
    };
    if (!d.last_name || !d.first_name) { toast('Nome e cognome obbligatori', 'warning'); return; }
    if (!d.fiscal_code) { toast('Codice fiscale obbligatorio', 'warning'); return; }
    if (!d.date_of_birth) { toast('Data di nascita obbligatoria', 'warning'); return; }

    api('POST', '/workers', d).then(function () {
      closeModal(); toast('Dipendente aggiunto', 'success');
      if (state.activeCompany) loadDipendenti(state.activeCompany.id);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.saveNewVisit = function () {
    var v = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    var d = {
      worker_id: v('visitWorker'), visit_type: v('visitType'),
      scheduled_date: v('visitDate'), scheduled_time: v('visitTime') || null,
      location: v('visitLocation') || null, notes: v('visitNotes') || null
    };
    if (!d.worker_id) { toast('Seleziona un lavoratore', 'warning'); return; }
    if (!d.scheduled_date) { toast('Data obbligatoria', 'warning'); return; }
    api('POST', '/visits', d).then(function () {
      closeModal(); toast('Visita programmata', 'success');
      if (state.activeTab === 'tab-visite' && state.activeCompany) loadVisite(state.activeCompany.id);
      if (state.activeWorker) openWorkerDetail(state.activeWorker.worker.id);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.viewWorker = function (id) { openWorkerDetail(id); };

  MDL.viewVisit = function (id) { openVisitDetail(id); };
  MDL.viewRole = function () { toast('Dettaglio mansione — in sviluppo', 'info'); };
  MDL.goCompany = function (id) { openCompany(id); };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  PROTOCOLLI STANDARD (template)                                */
  /* ═══════════════════════════════════════════════════════════════ */
  var templateCache = null;

  function loadTemplates() {
    if (templateCache) return Promise.resolve(templateCache);
    return api('GET', '/protocol-templates').then(function (r) {
      templateCache = r.data || [];
      return templateCache;
    });
  }

  // Render delle categorie di esami di un protocollo/template (riuso UI)
  function renderExamGroupsHtml(exams) {
    var groups = groupExamsByCategory(exams);
    var out = '<div class="protocol-exam-groups">';
    EXAM_CAT_ORDER.forEach(function (cat) {
      var catExams = groups[cat];
      if (!catExams || catExams.length === 0) return;
      out += '<div class="exam-cat-group">' +
        '<div class="exam-cat-header">' + (EXAM_CAT_ICONS[cat] || '') + ' ' + (EXAM_CAT_LABELS[cat] || cat) +
        ' <span class="exam-cat-count">(' + catExams.length + ')</span></div><div class="exam-cat-list">';
      catExams.forEach(function (e) {
        out += '<div class="exam-cat-item">' +
          '<code class="exam-cat-code">' + esc(e.exam_code) + '</code>' +
          '<span class="exam-cat-name">' + esc(e.exam_name) + '</span>' +
          '<span class="exam-cat-period">' + (PERIODICITY_LABELS[e.periodicity] || e.periodicity) + '</span>' +
          (e.is_mandatory ? '<span class="badge badge-danger" style="font-size:0.6rem">Obbl.</span>' : '<span class="badge badge-gray" style="font-size:0.6rem">Opz.</span>') +
        '</div>';
      });
      out += '</div></div>';
    });
    out += '</div>';
    return out;
  }

  // Catalogo globale dei protocolli standard (sola lettura)
  function loadProtocolliGlobale() {
    var section = $('sec-protocolli-globale');
    if (!section) return;
    section.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">Caricamento catalogo protocolli...</div>';

    var canEdit = state.user && ['super_admin', 'medico_competente', 'medico_collaboratore'].indexOf(state.user.role) >= 0;

    loadTemplates().then(function (templates) {
      var newBtn = canEdit ? '<button class="btn btn-primary" onclick="MDL.newTemplate()">+ Nuovo modello</button>' : '';
      if (!templates.length) {
        section.innerHTML = '<div class="section-toolbar"><h3 style="font-size:1rem;font-weight:600">Protocolli Standard</h3>' + newBtn + '</div>' +
          '<div class="empty-state"><div class="empty-state-icon">&#9776;</div>' +
          '<div class="empty-state-text">Nessun protocollo standard disponibile</div>' +
          '<div class="empty-state-sub">Crea il primo modello da riutilizzare nelle aziende</div></div>';
        return;
      }
      var html = '<div class="section-toolbar"><h3 style="font-size:1rem;font-weight:600">Protocolli Standard (' + templates.length + ')</h3>' + newBtn + '</div>' +
        '<p class="text-muted" style="font-size:0.8rem;margin:-0.25rem 0 0.75rem">I modelli sono applicabili alle mansioni dalla scheda azienda → Protocolli.</p>';
      html += templates.map(function (t) {
        var exams = t.mdl_protocol_template_exams || [];
        return '<div class="protocol-card">' +
          '<div class="protocol-card-header"><div class="protocol-card-title">' +
            '<h4>' + esc(t.name) + '</h4>' +
            '<div class="protocol-card-meta">' +
              (t.legal_reference ? '<span>' + esc(t.legal_reference) + '</span> ' : '') +
              '<span>Periodicità visita: <strong>' + (PERIODICITY_LABELS[t.visit_periodicity] || t.visit_periodicity) + '</strong></span>' +
            '</div>' +
            (t.description ? '<div class="text-muted" style="font-size:0.8rem;margin-top:0.25rem">' + esc(t.description) + '</div>' : '') +
          '</div>' +
          '<div class="protocol-card-stats"><div class="protocol-stat"><span class="protocol-stat-num">' + exams.length + '</span><span class="protocol-stat-label">Esami</span></div></div>' +
          '</div>' + renderExamGroupsHtml(exams) +
          ((t.risk_factors && t.risk_factors.length) ? '<div class="protocol-risk-factors"><strong>Fattori di rischio:</strong> ' +
            t.risk_factors.map(function (f) { return '<span class="risk-factor-tag">' + esc(f) + '</span>'; }).join(' ') + '</div>' : '') +
          (canEdit ? '<div class="protocol-card-actions" style="margin-top:0.6rem;display:flex;gap:0.5rem">' +
            '<button class="btn btn-outline btn-sm" onclick="MDL.editTemplate(\'' + t.id + '\')">Modifica</button>' +
            '<button class="btn btn-danger btn-sm" onclick="MDL.deleteTemplate(\'' + t.id + '\',\'' + esc(t.name) + '\')">Elimina</button>' +
          '</div>' : '') +
        '</div>';
      }).join('');
      section.innerHTML = html;
    }).catch(function (err) {
      section.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626">Errore: ' + esc(err.message) + '</div>';
    });
  }

  // Modale: applica un protocollo standard a una mansione dell'azienda corrente
  MDL.newProtocolFromTemplate = function () {
    if (!state.activeCompany) { toast('Apri prima una scheda azienda', 'warning'); return; }
    var roles = (state.activeCompany.mdl_job_roles || []).filter(function (r) { return r.is_active !== false; });
    if (!roles.length) {
      toast('Definisci prima almeno una mansione per questa azienda', 'warning');
      return;
    }

    var roleOpts = roles.map(function (r) {
      return '<option value="' + r.id + '">' + esc(r.role_name) + '</option>';
    }).join('');

    var html = '<div class="form-grid">' +
      '<div class="form-group"><label>Mansione *</label><select class="form-input" id="protRole">' + roleOpts + '</select></div>' +
      '<div class="form-group"><label>Protocollo standard *</label><select class="form-input" id="protTemplate"><option value="">Caricamento modelli...</option></select></div>' +
      '</div>' +
      '<div id="protTemplatePreview" class="text-muted" style="font-size:0.82rem;margin-top:0.5rem">Seleziona un modello per vedere gli esami inclusi.</div>';

    openModal('Nuovo Protocollo da modello', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" id="btnApplyTemplate" onclick="MDL.applyTemplate()">Crea Protocollo</button>');

    loadTemplates().then(function (templates) {
      var sel = $('protTemplate');
      if (!sel) return;
      sel.innerHTML = '<option value="">— Seleziona modello —</option>' +
        templates.map(function (t) {
          var n = (t.mdl_protocol_template_exams || []).length;
          return '<option value="' + t.id + '">' + esc(t.name) + ' (' + n + ' esami)</option>';
        }).join('');
      sel.addEventListener('change', function () {
        var t = templates.find(function (x) { return x.id === sel.value; });
        var prev = $('protTemplatePreview');
        if (prev) prev.innerHTML = t ? renderExamGroupsHtml(t.mdl_protocol_template_exams || []) :
          'Seleziona un modello per vedere gli esami inclusi.';
      });
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.applyTemplate = function () {
    var jobRoleId = ($('protRole') || {}).value;
    var templateId = ($('protTemplate') || {}).value;
    if (!jobRoleId) { toast('Seleziona una mansione', 'warning'); return; }
    if (!templateId) { toast('Seleziona un protocollo standard', 'warning'); return; }
    var cid = state.activeCompany ? state.activeCompany.id : null;
    if (!cid) return;

    var btn = $('btnApplyTemplate');
    if (btn) { btn.disabled = true; btn.textContent = 'Creazione...'; }

    api('POST', '/companies/' + cid + '/protocols', { job_role_id: jobRoleId, template_id: templateId }).then(function () {
      closeModal();
      toast('Protocollo creato dalla libreria standard', 'success');
      if (state.activeTab === 'tab-protocolli') loadProtocolli();
    }).catch(function (e) {
      toast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Crea Protocollo'; }
    });
  };

  MDL.scheduleVisitFor = function (wid, wname) {
    closeModal();
    setTimeout(function () { showNewVisitModal(wid, wname); }, 250);
  };

  MDL.scheduleVisitForCurrent = function () {
    if (!state.activeWorker) return;
    var w = state.activeWorker.worker;
    showNewVisitModal(w.id, w.last_name + ' ' + w.first_name);
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  GENERAZIONE CERTIFICATO DI IDONEITÀ                           */
  /* ═══════════════════════════════════════════════════════════════ */
  // Profili medico per l'intestazione del certificato.
  // NB: completare i campi segnati con «da completare» con i dati reali
  // (n. iscrizione albo, recapiti, eventuale firma) forniti dal titolare.
  var DOCTOR_PROFILES = {
    mancia: {
      name: 'Dott. Gianfranco Mancia',
      role: 'Medico Competente',
      albo: 'Iscr. Albo Medici — da completare',
      studios: [
        'Studio: viale Umberto 363 – 07100 Sassari',
        'Studio: viale A. Moro 64/d – 07026 Olbia'
      ],
      contacts: 'tel. 079 5xxxxx – email: gmancia@…  (da completare)'
    },
    bosincu: {
      name: 'Dott. Bosincu',
      role: 'Medico Competente',
      albo: 'Iscr. Albo Medici — da completare',
      studios: ['Indirizzo studio — da completare'],
      contacts: 'recapiti — da completare'
    }
  };

  // Contesto del certificato in corso di generazione ({fj, worker})
  var certContext = null;
  var certVisitTmp = null; // stash dal dettaglio visita

  function openCertPicker(fj, worker) {
    if (!fj || !worker) { toast('Dati del giudizio non disponibili', 'error'); return; }
    certContext = { fj: fj, worker: worker };

    var docOpts = Object.keys(DOCTOR_PROFILES).map(function (k) {
      return '<option value="' + k + '">' + esc(DOCTOR_PROFILES[k].name) + '</option>';
    }).join('');

    var html = '<p style="font-size:0.85rem">Genera il certificato di idoneità per <strong>' +
        esc(worker.last_name + ' ' + worker.first_name) + '</strong>.</p>' +
      '<div class="form-group"><label>Medico Competente firmatario *</label>' +
        '<select class="form-input" id="certDoctor">' + docOpts + '</select></div>' +
      '<div class="form-group"><label>Luogo di emissione</label>' +
        '<input type="text" class="form-input" id="certPlace" value="Sassari"></div>' +
      '<p class="text-muted" style="font-size:0.78rem">Prescrizioni e limitazioni vengono incluse automaticamente in base al giudizio (' +
        esc(FITNESS_LABELS[fj.judgment_type] || fj.judgment_type) + ').</p>';

    openModal('Genera Certificato di Idoneità', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.doGenerateCertificate()">Genera documento</button>');
  }

  // Dal tab Idoneità della scheda lavoratore (lookup per id)
  MDL.generateCertificate = function (fitnessId) {
    var data = state.activeWorker;
    var fj = data && (data.fitnessJudgments || []).find(function (f) { return f.id === fitnessId; });
    if (!fj) { toast('Giudizio non trovato', 'error'); return; }
    openCertPicker(fj, data.worker);
  };

  // Dal dettaglio visita (usa il contesto stash-ato in renderVisitDetail)
  MDL.generateCertificateFromVisit = function () {
    if (!certVisitTmp) { toast('Giudizio non disponibile', 'error'); return; }
    openCertPicker(certVisitTmp.fj, certVisitTmp.worker);
  };

  MDL.doGenerateCertificate = function () {
    if (!certContext) { toast('Contesto non disponibile', 'error'); return; }
    var doctorKey = ($('certDoctor') || {}).value || 'mancia';
    var place = ($('certPlace') || {}).value || 'Sassari';
    closeModal();
    buildCertificateWindow(certContext.fj, certContext.worker, DOCTOR_PROFILES[doctorKey], place);
  };

  function buildCertificateWindow(fj, w, doctor, place) {
    var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
    var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
    var companyName = w.mdl_companies ? w.mdl_companies.business_name : '—';
    var judgment = FITNESS_LABELS[fj.judgment_type] || fj.judgment_type;
    var hasPresc = !!fj.prescriptions;
    var hasLim = !!fj.limitations;

    var rows = [
      ['Lavoratore', esc(w.last_name + ' ' + w.first_name)],
      ['Codice Fiscale', esc(w.fiscal_code || '—')],
      ['Data di nascita', fmtDate(w.date_of_birth)],
      ['Azienda', esc(companyName)],
      ['Mansione specifica', esc(roleName)]
    ].map(function (r) {
      return '<tr><td class="lbl">' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    }).join('');

    var studios = (doctor.studios || []).map(function (s) { return esc(s); }).join('<br>');

    var presBlock = '';
    if (hasPresc) presBlock += '<p><strong>Prescrizioni:</strong> ' + esc(fj.prescriptions) + '</p>';
    if (hasLim) presBlock += '<p><strong>Limitazioni:</strong> ' + esc(fj.limitations) + '</p>';
    if (!hasPresc && !hasLim) presBlock = '<p><em>Senza prescrizioni né limitazioni.</em></p>';

    var nextBlock = '';
    if (fj.next_visit_date) nextBlock += '<p>Il lavoratore è sottoposto a nuova visita medica entro il <strong>' + fmtDate(fj.next_visit_date) + '</strong>.</p>';
    if (fj.reevaluation_date) nextBlock += '<p>Data di rivalutazione: <strong>' + fmtDate(fj.reevaluation_date) + '</strong>.</p>';

    var doc = '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">' +
      '<title>Certificato di Idoneità — ' + esc(w.last_name + ' ' + w.first_name) + '</title>' +
      '<style>' +
      '@page{size:A4;margin:22mm 20mm}' +
      'body{font-family:Georgia,\'Times New Roman\',serif;color:#111;font-size:12pt;line-height:1.5}' +
      '.head{border-bottom:2px solid #1e40af;padding-bottom:8px;margin-bottom:18px}' +
      '.head .dn{font-size:14pt;font-weight:bold}' +
      '.head .meta{font-size:9.5pt;color:#444;margin-top:2px}' +
      'h1{font-size:14pt;text-align:center;text-transform:uppercase;letter-spacing:.5px;margin:18px 0 4px}' +
      '.sub{text-align:center;font-size:9.5pt;color:#444;margin-bottom:18px}' +
      'table{width:100%;border-collapse:collapse;margin:10px 0}' +
      'td{padding:5px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}' +
      'td.lbl{width:38%;color:#444;font-weight:bold}' +
      '.giudizio{margin:16px 0;padding:12px 14px;border:2px solid #1e40af;border-radius:6px;font-size:13pt}' +
      '.giudizio b{display:block;font-size:9.5pt;color:#1e40af;text-transform:uppercase;margin-bottom:4px}' +
      '.ric{font-size:9.5pt;color:#333;margin-top:18px;border-top:1px solid #ccc;padding-top:8px}' +
      '.sign{margin-top:42px;display:flex;justify-content:space-between}' +
      '.sign .box{width:46%;text-align:center}' +
      '.sign .line{margin-top:42px;border-top:1px solid #111;padding-top:4px;font-size:10pt}' +
      '@media print{button{display:none}}' +
      '</style></head><body>' +
      '<div class="head"><div class="dn">' + esc(doctor.name) + ' — ' + esc(doctor.role) + '</div>' +
        '<div class="meta">' + esc(doctor.albo || '') + (studios ? '<br>' + studios : '') +
        (doctor.contacts ? '<br>' + esc(doctor.contacts) : '') + '</div></div>' +
      '<h1>Giudizio di Idoneità alla Mansione Specifica</h1>' +
      '<div class="sub">art. 41, comma 6, D.Lgs. 81/2008</div>' +
      '<table>' + rows + '</table>' +
      '<div class="giudizio"><b>Giudizio espresso</b>' + esc(judgment) + '</div>' +
      presBlock + nextBlock +
      '<div class="ric">Avverso il presente giudizio è ammesso ricorso, entro 30 giorni dalla data di ' +
        'comunicazione, all\'Organo di Vigilanza territorialmente competente (ASL/SPreSAL), ' +
        'ai sensi dell\'art. 41, comma 9, del D.Lgs. 81/2008.</div>' +
      '<div class="sign"><div class="box"><div class="line">' + esc(place) + ', ' + fmtDate(fj.issued_date) + '<br>(luogo e data)</div></div>' +
        '<div class="box"><div class="line">' + esc(doctor.name) + '<br>Il Medico Competente</div></div></div>' +
      '<div style="margin-top:24px;text-align:center"><button onclick="window.print()" ' +
        'style="padding:8px 22px;font-size:11pt;cursor:pointer">Stampa / Salva come PDF</button></div>' +
      '</body></html>';

    var win = window.open('', '_blank');
    if (!win) { toast('Abilita i popup per generare il certificato', 'warning'); return; }
    win.document.open();
    win.document.write(doc);
    win.document.close();
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  EDITOR ESAMI + CRUD MODELLI E PROTOCOLLI                      */
  /* ═══════════════════════════════════════════════════════════════ */
  var EXAM_CATS = ['ematochimico', 'strumentale', 'specialistico', 'tossicologico'];
  var PERIODS = ['semestrale', 'annuale', 'biennale', 'triennale', 'quinquennale', 'una_tantum'];

  function periodSelectHtml(id, sel) {
    return '<select class="form-input" id="' + id + '">' + PERIODS.map(function (p) {
      return '<option value="' + p + '"' + (sel === p ? ' selected' : '') + '>' + (PERIODICITY_LABELS[p] || p) + '</option>';
    }).join('') + '</select>';
  }

  function examRowHtml(e) {
    e = e || {};
    var cat = e.exam_category || 'ematochimico';
    var per = e.periodicity || 'annuale';
    return '<tr class="exam-edit-row">' +
      '<td><input class="form-input ex-code" value="' + esc(e.exam_code || '') + '" style="width:80px" placeholder="COD"></td>' +
      '<td><input class="form-input ex-name" value="' + esc(e.exam_name || '') + '" placeholder="Nome esame"></td>' +
      '<td><select class="form-input ex-cat">' + EXAM_CATS.map(function (c) {
        return '<option value="' + c + '"' + (cat === c ? ' selected' : '') + '>' + (EXAM_CAT_LABELS[c] || c) + '</option>';
      }).join('') + '</select></td>' +
      '<td><select class="form-input ex-per">' + PERIODS.map(function (p) {
        return '<option value="' + p + '"' + (per === p ? ' selected' : '') + '>' + (PERIODICITY_LABELS[p] || p) + '</option>';
      }).join('') + '</select></td>' +
      '<td style="text-align:center"><input type="checkbox" class="ex-mand"' + (e.is_mandatory !== false ? ' checked' : '') + '></td>' +
      '<td><button type="button" class="btn btn-danger btn-sm" onclick="MDL.removeExamRow(this)">&times;</button></td>' +
    '</tr>';
  }

  function examEditorHtml(exams) {
    var rows = (exams || []).map(examRowHtml).join('');
    return '<div class="table-container" style="margin-top:0.25rem"><table class="data-table"><thead><tr>' +
      '<th>Codice</th><th>Esame</th><th>Categoria</th><th>Periodicità</th><th>Obbl.</th><th></th>' +
      '</tr></thead><tbody id="examEditorBody">' + rows + '</tbody></table></div>' +
      '<button type="button" class="btn btn-outline btn-sm" style="margin-top:0.4rem" onclick="MDL.addExamRow()">+ Aggiungi esame</button>';
  }

  MDL.addExamRow = function () {
    var b = $('examEditorBody');
    if (!b) return;
    var tmp = document.createElement('tbody');
    tmp.innerHTML = examRowHtml({});
    b.appendChild(tmp.firstChild);
  };
  MDL.removeExamRow = function (btn) {
    var tr = btn.closest ? btn.closest('tr') : btn.parentNode.parentNode;
    if (tr) tr.parentNode.removeChild(tr);
  };
  function readExamEditor() {
    var rows = [];
    var body = $('examEditorBody');
    if (!body) return rows;
    Array.prototype.forEach.call(body.querySelectorAll('tr.exam-edit-row'), function (tr, i) {
      var code = (tr.querySelector('.ex-code') || {}).value;
      var name = (tr.querySelector('.ex-name') || {}).value;
      if (!code || !name || !code.trim() || !name.trim()) return;
      rows.push({
        exam_code: code.trim(), exam_name: name.trim(),
        exam_category: (tr.querySelector('.ex-cat') || {}).value,
        periodicity: (tr.querySelector('.ex-per') || {}).value,
        is_mandatory: (tr.querySelector('.ex-mand') || {}).checked,
        sort_order: i + 1
      });
    });
    return rows;
  }

  /* ── MODELLI (template) ─────────────────────────────────────── */
  function templateFormHtml(t) {
    t = t || {};
    return '<div class="form-grid">' +
      '<div class="form-group form-full"><label>Nome modello *</label><input class="form-input" id="tplName" value="' + esc(t.name || '') + '"></div>' +
      '<div class="form-group"><label>Periodicità visita</label>' + periodSelectHtml('tplPer', t.visit_periodicity || 'annuale') + '</div>' +
      '<div class="form-group"><label>Riferimento normativo</label><input class="form-input" id="tplLegal" value="' + esc(t.legal_reference || '') + '"></div>' +
      '<div class="form-group form-full"><label>Fattori di rischio (separati da virgola)</label><input class="form-input" id="tplRisk" value="' + esc((t.risk_factors || []).join(', ')) + '"></div>' +
      '<div class="form-group form-full"><label>Descrizione</label><textarea class="form-input" id="tplDesc" rows="2">' + esc(t.description || '') + '</textarea></div>' +
    '</div>' +
    '<h4 style="margin:0.75rem 0 0.25rem">Esami previsti</h4>' + examEditorHtml(t.mdl_protocol_template_exams || []);
  }

  MDL.newTemplate = function () {
    openModal('Nuovo modello di protocollo', templateFormHtml(),
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveTemplate(\'\')">Salva modello</button>');
    var d = $('modalDialog'); if (d) d.classList.add('modal-lg');
  };
  MDL.editTemplate = function (id) {
    var t = (templateCache || []).find(function (x) { return x.id === id; });
    if (!t) { toast('Modello non trovato', 'error'); return; }
    openModal('Modifica modello: ' + esc(t.name), templateFormHtml(t),
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveTemplate(\'' + id + '\')">Salva modifiche</button>');
    var d = $('modalDialog'); if (d) d.classList.add('modal-lg');
  };
  MDL.saveTemplate = function (id) {
    var name = ($('tplName') || {}).value;
    if (!name || !name.trim()) { toast('Nome del modello obbligatorio', 'warning'); return; }
    var body = {
      name: name.trim(),
      visit_periodicity: ($('tplPer') || {}).value,
      legal_reference: ($('tplLegal') || {}).value || null,
      risk_factors: ($('tplRisk') || {}).value || '',
      description: ($('tplDesc') || {}).value || null,
      exams: readExamEditor()
    };
    var p = id ? api('PATCH', '/protocol-templates/' + id, body) : api('POST', '/protocol-templates', body);
    p.then(function () {
      templateCache = null;
      closeModal();
      toast(id ? 'Modello aggiornato' : 'Modello creato', 'success');
      if (state.section === 'protocolli-globale') loadProtocolliGlobale();
    }).catch(function (e) { toast(e.message, 'error'); });
  };
  MDL.deleteTemplate = function (id, name) {
    if (!confirm('Disattivare il modello "' + name + '"?')) return;
    api('DELETE', '/protocol-templates/' + id).then(function () {
      templateCache = null;
      toast('Modello disattivato', 'success');
      loadProtocolliGlobale();
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  /* ── PROTOCOLLO AZIENDALE (modifica) ────────────────────────── */
  MDL.editProtocol = function (id) {
    var p = (state.activeProtocols || []).find(function (x) { return x.id === id; });
    if (!p) { toast('Protocollo non trovato', 'error'); return; }
    var jr = p.mdl_job_roles || {};
    var html = '<div class="form-grid">' +
      '<div class="form-group form-full"><label>Nome protocollo *</label><input class="form-input" id="prName" value="' + esc(p.protocol_name || '') + '"></div>' +
      '<div class="form-group"><label>Mansione</label><input class="form-input" value="' + esc(jr.role_name || '—') + '" disabled></div>' +
      '<div class="form-group"><label>Periodicità visita</label>' + periodSelectHtml('prPer', p.visit_periodicity) + '</div>' +
      '<div class="form-group form-full"><label>Note</label><textarea class="form-input" id="prNotes" rows="2">' + esc(p.notes || '') + '</textarea></div>' +
    '</div>' +
    '<h4 style="margin:0.75rem 0 0.25rem">Esami previsti</h4>' + examEditorHtml(p.mdl_protocol_exams || []);
    openModal('Modifica protocollo', html,
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveProtocol(\'' + id + '\')">Salva modifiche</button>');
    var d = $('modalDialog'); if (d) d.classList.add('modal-lg');
  };
  MDL.saveProtocol = function (id) {
    var name = ($('prName') || {}).value;
    if (!name || !name.trim()) { toast('Nome protocollo obbligatorio', 'warning'); return; }
    var body = {
      protocol_name: name.trim(),
      visit_periodicity: ($('prPer') || {}).value,
      notes: ($('prNotes') || {}).value || null,
      exams: readExamEditor()
    };
    api('PATCH', '/protocols/' + id, body).then(function () {
      closeModal();
      toast('Protocollo aggiornato', 'success');
      loadProtocolli();
    }).catch(function (e) { toast(e.message, 'error'); });
  };
  MDL.deleteProtocol = function (id, name) {
    if (!confirm('Disattivare il protocollo "' + name + '"?')) return;
    api('DELETE', '/protocols/' + id).then(function () {
      toast('Protocollo disattivato', 'success');
      loadProtocolli();
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  MANSIONI (CRUD)                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  var RISK_FACTOR_HINT = 'rumore, vibrazioni, chimico, biologico, vdt, mmc, radiazioni, polveri, lavori_quota, rischio_elettrico';

  function jobRoleFormHtml(r) {
    r = r || {};
    var rl = r.risk_level || 'basso';
    return '<div class="form-grid">' +
      '<div class="form-group form-full"><label>Nome mansione *</label><input class="form-input" id="jrName" value="' + esc(r.role_name || '') + '"></div>' +
      '<div class="form-group"><label>Livello di rischio</label><select class="form-input" id="jrRisk">' +
        ['basso', 'medio', 'alto'].map(function (x) { return '<option value="' + x + '"' + (rl === x ? ' selected' : '') + '>' + (RISK_LABEL[x] || x) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Rif. DVR</label><input class="form-input" id="jrDvr" value="' + esc(r.dvr_reference || '') + '"></div>' +
      '<div class="form-group form-full"><label>Fattori di rischio (separati da virgola)</label>' +
        '<input class="form-input" id="jrFactors" value="' + esc((r.risk_factors || []).join(', ')) + '" placeholder="' + RISK_FACTOR_HINT + '"></div>' +
      '<div class="form-group form-full"><label>Descrizione</label><textarea class="form-input" id="jrDesc" rows="2">' + esc(r.description || '') + '</textarea></div>' +
    '</div>';
  }

  MDL.newJobRole = function () {
    if (!state.activeCompany) { toast('Apri prima una scheda azienda', 'warning'); return; }
    openModal('Nuova mansione', jobRoleFormHtml(),
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveJobRole(\'\')">Salva mansione</button>');
  };
  MDL.editJobRole = function (id) {
    var r = ((state.activeCompany && state.activeCompany.mdl_job_roles) || []).find(function (x) { return x.id === id; });
    if (!r) { toast('Mansione non trovata', 'error'); return; }
    openModal('Modifica mansione', jobRoleFormHtml(r),
      '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveJobRole(\'' + id + '\')">Salva modifiche</button>');
  };
  MDL.viewRole = function (id) { MDL.editJobRole(id); };
  MDL.saveJobRole = function (id) {
    var name = ($('jrName') || {}).value;
    if (!name || !name.trim()) { toast('Nome mansione obbligatorio', 'warning'); return; }
    if (!state.activeCompany) return;
    var body = {
      role_name: name.trim(),
      risk_level: ($('jrRisk') || {}).value,
      dvr_reference: ($('jrDvr') || {}).value || null,
      risk_factors: ($('jrFactors') || {}).value || '',
      description: ($('jrDesc') || {}).value || null
    };
    var cid = state.activeCompany.id;
    var p = id ? api('PATCH', '/job-roles/' + id, body) : api('POST', '/companies/' + cid + '/job-roles', body);
    p.then(function () {
      closeModal();
      toast(id ? 'Mansione aggiornata' : 'Mansione creata', 'success');
      loadMansioni();
    }).catch(function (e) { toast(e.message, 'error'); });
  };
  MDL.deleteJobRole = function (id, name) {
    if (!confirm('Disattivare la mansione "' + name + '"?')) return;
    api('DELETE', '/job-roles/' + id).then(function () {
      toast('Mansione disattivata', 'success');
      loadMansioni();
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  SCADENZARIO                                                   */
  /* ═══════════════════════════════════════════════════════════════ */
  var DEADLINE_CAT = { visita: 'Visita medica', documento: 'Documento', formazione: 'Formazione' };

  function deadlineBadge(d) {
    if (d === null || d === undefined) return '<span class="badge badge-gray">—</span>';
    if (d < 0) return '<span class="badge badge-danger">Scaduta da ' + Math.abs(d) + 'gg</span>';
    if (d <= 30) return '<span class="badge badge-danger">' + d + 'gg</span>';
    if (d <= 90) return '<span class="badge badge-warning">' + d + 'gg</span>';
    return '<span class="badge badge-success">' + d + 'gg</span>';
  }

  function renderDeadlinesTable(items) {
    if (!items || !items.length) {
      return '<p style="text-align:center;padding:2rem;color:#9ca3af">Nessuna scadenza nell\'orizzonte selezionato.</p>';
    }
    var rows = items.map(function (i) {
      return '<tr>' +
        '<td>' + (DEADLINE_CAT[i.category] || i.category) + '</td>' +
        '<td><strong>' + esc(i.subject || i.title || '—') + '</strong>' + (i.title && i.title !== i.subject ? ' <small class="text-muted">' + esc(i.title) + '</small>' : '') + '</td>' +
        '<td>' + esc(i.company_name || '—') + '</td>' +
        '<td>' + fmtDate(i.due_date) + '</td>' +
        '<td>' + deadlineBadge(i.days_until) + '</td>' +
        '<td>' + (i.worker_id ? '<button class="btn btn-outline btn-sm" onclick="MDL.openWorker(\'' + i.worker_id + '\')">Scheda</button>' :
          (i.company_id ? '<button class="btn btn-outline btn-sm" onclick="MDL.goCompany(\'' + i.company_id + '\')">Azienda</button>' : '')) + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="table-container"><table class="data-table"><thead><tr>' +
      '<th>Tipo</th><th>Oggetto</th><th>Azienda</th><th>Scadenza</th><th>Tra</th><th></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  MDL.uploadReferto = function () { showUploadRefertoModal(); };
  MDL.uploadIdoneita = function () { showUploadIdoneitaModal(); };

  MDL.doUploadReferto = function () {
    var fileInput = $('uploadFile');
    var visitId = ($('uploadVisitId') || {}).value;
    var examCode = ($('uploadExamCode') || {}).value;
    if (!fileInput || !fileInput.files[0]) { toast('Seleziona un file', 'warning'); return; }
    if (!visitId) { toast('Seleziona la visita di riferimento', 'warning'); return; }
    if (!examCode) { toast('Seleziona il tipo di esame', 'warning'); return; }

    var btn = $('btnDoUploadReferto');
    if (btn) { btn.disabled = true; btn.textContent = 'Caricamento...'; }

    var fd = new FormData();
    fd.append('file', fileInput.files[0]);
    fd.append('category', 'referti');
    fd.append('worker_id', state.activeWorker.worker.id);
    fd.append('visit_id', visitId);
    fd.append('exam_code', examCode);

    // Campi strutturati del referto (opzionali)
    var ex = (state.activeWorker.protocolExams || []).find(function (e) { return e.exam_code === examCode; });
    if (ex && ex.exam_name) fd.append('exam_name', ex.exam_name);
    var refVal = ($('refValue') || {}).value;
    var refUnit = ($('refUnit') || {}).value;
    var refRange = ($('refRange') || {}).value;
    var refText = ($('refText') || {}).value;
    var refLab = ($('refLab') || {}).value;
    var refDate = ($('refExamDate') || {}).value;
    var refNormal = ($('refNormal') || {}).value;
    if (refDate) fd.append('exam_date', refDate);
    if (refVal) fd.append('result_value', refVal);
    if (refUnit) fd.append('result_unit', refUnit);
    if (refRange) fd.append('reference_range', refRange);
    if (refText) fd.append('result_text', refText);
    if (refLab) fd.append('lab_name', refLab);
    if (refNormal === 'normal') { fd.append('is_normal', 'true'); fd.append('is_abnormal', 'false'); }
    if (refNormal === 'abnormal') { fd.append('is_normal', 'false'); fd.append('is_abnormal', 'true'); }

    api('POST', '/files/upload', fd).then(function () {
      closeModal();
      toast('Referto caricato con successo', 'success');
      openWorkerDetail(state.activeWorker.worker.id);
    }).catch(function (e) {
      toast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Carica'; }
    });
  };

  MDL.doUploadIdoneita = function () {
    var fileInput = $('uploadFile');
    var fitnessId = ($('uploadFitnessId') || {}).value;
    if (!fileInput || !fileInput.files[0]) { toast('Seleziona un file', 'warning'); return; }

    var btn = $('btnDoUploadIdoneita');
    if (btn) { btn.disabled = true; btn.textContent = 'Caricamento...'; }

    var fd = new FormData();
    fd.append('file', fileInput.files[0]);
    fd.append('category', 'idoneita');
    fd.append('worker_id', state.activeWorker.worker.id);
    if (fitnessId) fd.append('fitness_id', fitnessId);

    api('POST', '/files/upload', fd).then(function () {
      closeModal();
      toast('Idoneita caricata con successo', 'success');
      openWorkerDetail(state.activeWorker.worker.id);
    }).catch(function (e) {
      toast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Carica'; }
    });
  };

  MDL.downloadFile = function (path) {
    api('GET', '/files/download?path=' + encodeURIComponent(path)).then(function (r) {
      if (r.data && r.data.signedUrl) {
        window.open(r.data.signedUrl, '_blank');
      } else {
        toast('URL di download non disponibile', 'error');
      }
    }).catch(function (e) {
      toast('Errore download: ' + e.message, 'error');
    });
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  VISIT DETAIL — SCHEDA VISITA                                  */
  /* ═══════════════════════════════════════════════════════════════ */
  function openVisitDetail(visitId) {
    openModal('Caricamento visita...', '<div style="text-align:center;padding:2rem;color:#9ca3af">Caricamento dettagli visita...</div>', '');

    api('GET', '/visits/' + visitId).then(function (r) {
      if (!r.data) { toast('Visita non trovata', 'error'); closeModal(); return; }
      renderVisitDetail(r.data);
    }).catch(function (err) {
      toast(err.message, 'error');
      closeModal();
    });
  }

  function renderVisitDetail(data) {
    var v = data.visit;
    var w = v.mdl_workers || {};
    var company = w.mdl_companies || {};
    var currentJob = (w.mdl_worker_jobs || []).find(function (j) { return j.is_current; });
    var roleName = currentJob && currentJob.mdl_job_roles ? currentJob.mdl_job_roles.role_name : '—';
    var exams = data.visitExams || [];
    var fj = data.fitnessJudgment;
    var protocol = data.protocol;
    var protocolExams = data.protocolExams || [];
    var physician = data.physician;

    // Build exam completion map for this visit
    var doneExamCodes = {};
    exams.forEach(function (e) { doneExamCodes[e.exam_code] = e; });

    var title = (VISIT_LABELS[v.visit_type] || v.visit_type) + ' — ' + esc(w.last_name || '') + ' ' + esc(w.first_name || '');

    /* ── Visit Header ── */
    var html = '<div class="visit-detail-header">' +
      '<div class="visit-detail-row">' +
        '<div class="visit-detail-col">' +
          '<div class="detail-label">Lavoratore</div>' +
          '<div class="detail-value"><a style="color:var(--primary);cursor:pointer;font-weight:600" onclick="MDL.closeModal();MDL.openWorker(\'' + w.id + '\')">' + esc(w.last_name + ' ' + w.first_name) + '</a></div>' +
        '</div>' +
        '<div class="visit-detail-col">' +
          '<div class="detail-label">Azienda</div>' +
          '<div class="detail-value">' + esc(company.business_name || '—') + '</div>' +
        '</div>' +
        '<div class="visit-detail-col">' +
          '<div class="detail-label">Mansione</div>' +
          '<div class="detail-value">' + esc(roleName) + '</div>' +
        '</div>' +
        '<div class="visit-detail-col">' +
          '<div class="detail-label">Cod. Fiscale</div>' +
          '<div class="detail-value"><code>' + esc(w.fiscal_code || '—') + '</code></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Visit Info ── */
    html += '<div class="visit-info-grid">' +
      '<div class="visit-info-card">' +
        '<div class="visit-info-label">Data Programmata</div>' +
        '<div class="visit-info-value">' + fmtDate(v.scheduled_date) + '</div>' +
      '</div>' +
      '<div class="visit-info-card">' +
        '<div class="visit-info-label">Ora</div>' +
        '<div class="visit-info-value">' + esc(v.scheduled_time || '—') + '</div>' +
      '</div>' +
      '<div class="visit-info-card">' +
        '<div class="visit-info-label">Tipo</div>' +
        '<div class="visit-info-value">' + (VISIT_LABELS[v.visit_type] || v.visit_type) + '</div>' +
      '</div>' +
      '<div class="visit-info-card">' +
        '<div class="visit-info-label">Stato</div>' +
        '<div class="visit-info-value"><span class="badge badge-' + (STATUS_BADGE[v.status] || 'gray') + '" style="font-size:0.82rem;padding:0.25rem 0.6rem">' + esc(v.status) + '</span></div>' +
      '</div>' +
      (v.actual_date ? '<div class="visit-info-card"><div class="visit-info-label">Data Effettiva</div><div class="visit-info-value">' + fmtDate(v.actual_date) + '</div></div>' : '') +
      (v.location ? '<div class="visit-info-card"><div class="visit-info-label">Sede</div><div class="visit-info-value">' + esc(v.location) + '</div></div>' : '') +
      (physician ? '<div class="visit-info-card"><div class="visit-info-label">Medico</div><div class="visit-info-value">Dr. ' + esc(physician.last_name + ' ' + physician.first_name) + '</div></div>' : '') +
      (v.duration_minutes ? '<div class="visit-info-card"><div class="visit-info-label">Durata</div><div class="visit-info-value">' + v.duration_minutes + ' min</div></div>' : '') +
    '</div>';

    /* ── Status Actions ── */
    html += '<div class="visit-actions-bar">';
    if (v.status === 'programmata') {
      html += '<button class="btn btn-primary btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'confermata\')">Conferma</button> ';
      html += '<button class="btn btn-warning btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'in_corso\')">Inizia Visita</button> ';
      html += '<button class="btn btn-danger btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'annullata\')">Annulla</button>';
    } else if (v.status === 'confermata') {
      html += '<button class="btn btn-warning btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'in_corso\')">Inizia Visita</button> ';
      html += '<button class="btn btn-danger btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'non_presentato\')">Non Presentato</button> ';
      html += '<button class="btn btn-outline btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'annullata\')">Annulla</button>';
    } else if (v.status === 'in_corso') {
      html += '<button class="btn btn-success btn-sm" onclick="MDL.updateVisitStatus(\'' + v.id + '\',\'completata\')">Completa Visita</button> ';
    }
    if (v.status !== 'completata' && v.status !== 'annullata') {
      html += '<button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="MDL.editVisitSchedule(\'' + v.id + '\',\'' + esc(v.scheduled_date || '') + '\',\'' + esc(v.scheduled_time || '') + '\',\'' + esc(v.location || '') + '\')">Modifica Programmazione</button>';
    }
    html += '</div>';

    /* ── Accertamenti / Esami ── */
    var doneCount = 0;
    protocolExams.forEach(function (pe) { if (doneExamCodes[pe.exam_code]) doneCount++; });
    html += '<div class="visit-section"><h4>Accertamenti Sanitari';
    if (protocolExams.length > 0) {
      html += ' <span class="exam-cat-count">(' + doneCount + '/' + protocolExams.length + ' completati)</span>';
    }
    html += '</h4>';
    if (protocolExams.length > 0) {
      var peGroups = groupExamsByCategory(protocolExams);
      EXAM_CAT_ORDER.forEach(function (cat) {
        var catExams = peGroups[cat];
        if (!catExams || catExams.length === 0) return;
        var catDone = catExams.filter(function (pe) { return !!doneExamCodes[pe.exam_code]; }).length;
        html += '<div class="exam-category-section">' +
          '<div class="exam-category-title">' + (EXAM_CAT_ICONS[cat] || '') + ' ' + (EXAM_CAT_LABELS[cat] || cat) +
          ' <span class="exam-cat-count">(' + catDone + '/' + catExams.length + ')</span></div>' +
          '<div class="table-container"><table class="data-table"><thead><tr>' +
          '<th style="width:40px">Stato</th><th style="width:60px">Codice</th><th>Esame</th><th>Periodicita</th><th>Risultato</th><th>Normale</th><th>Allegato</th>' +
          '</tr></thead><tbody>';
        html += catExams.map(function (pe) {
          var done = doneExamCodes[pe.exam_code];
          var statusIcon = done ?
            '<span class="exam-status exam-done" title="Completato">&#10004;</span>' :
            '<span class="exam-status exam-pending" title="Da eseguire">&#9711;</span>';
          var result = done ? (done.result_text || done.result_value || '—') : '—';
          var normalBadge = done ? (done.is_abnormal ? '<span class="badge badge-danger">Anomalo</span>' :
            (done.is_normal ? '<span class="badge badge-success">Normale</span>' : '<span class="badge badge-gray">—</span>')) : '—';
          var attachBtn = done && done.attachment_path ?
            '<button class="btn btn-outline btn-sm" onclick="MDL.downloadFile(\'' + esc(done.attachment_path) + '\')">&#128196;</button>' : '—';
          return '<tr' + (done && done.is_abnormal ? ' style="background:#fef2f2"' : (!done ? ' class="exam-row-pending"' : '')) + '>' +
            '<td>' + statusIcon + '</td>' +
            '<td><code>' + esc(pe.exam_code) + '</code></td>' +
            '<td>' + esc(pe.exam_name) + (pe.is_mandatory ? ' <span class="badge badge-danger" style="font-size:0.6rem">Obbl.</span>' : '') + '</td>' +
            '<td><span class="text-muted" style="font-size:0.75rem">' + (PERIODICITY_LABELS[pe.periodicity] || pe.periodicity || '') + '</span></td>' +
            '<td>' + esc(String(result)) + (done && done.result_unit ? ' ' + esc(done.result_unit) : '') + '</td>' +
            '<td>' + normalBadge + '</td>' +
            '<td>' + attachBtn + '</td>' +
          '</tr>';
        }).join('');
        html += '</tbody></table></div></div>';
      });
    } else if (exams.length > 0) {
      // No protocol but has exams
      html += '<div class="table-container"><table class="data-table"><thead><tr>' +
        '<th>Codice</th><th>Esame</th><th>Data</th><th>Risultato</th><th>Normale</th><th>Allegato</th>' +
      '</tr></thead><tbody>';
      html += exams.map(function (e) {
        var normalBadge = e.is_abnormal ? '<span class="badge badge-danger">Anomalo</span>' :
          (e.is_normal ? '<span class="badge badge-success">Normale</span>' : '<span class="badge badge-gray">—</span>');
        var attachBtn = e.attachment_path ?
          '<button class="btn btn-outline btn-sm" onclick="MDL.downloadFile(\'' + esc(e.attachment_path) + '\')">&#128196;</button>' : '—';
        return '<tr' + (e.is_abnormal ? ' style="background:#fef2f2"' : '') + '>' +
          '<td><code>' + esc(e.exam_code) + '</code></td>' +
          '<td>' + esc(e.exam_name) + '</td>' +
          '<td>' + fmtDate(e.exam_date) + '</td>' +
          '<td>' + esc(e.result_text || e.result_value || '—') + (e.result_unit ? ' ' + esc(e.result_unit) : '') + '</td>' +
          '<td>' + normalBadge + '</td>' +
          '<td>' + attachBtn + '</td>' +
        '</tr>';
      }).join('');
      html += '</tbody></table></div>';
    } else {
      html += '<p class="text-muted" style="padding:1rem 0">Nessun accertamento registrato per questa visita.</p>';
    }
    html += '</div>';

    /* ── Dati Clinici — PHASE 0 FIX: ONLY clinical roles (MC/SA), NOT segreteria ── */
    if (isClinicalRole() && v.anamnesis_family !== undefined) {
      var hasClinical = v.height_cm || v.weight_kg || v.blood_pressure_systolic || v.physical_examination || v.anamnesis_occupational;
      html += '<div class="visit-section"><h4>Dati Clinici' + (!hasClinical ? ' <span class="text-muted" style="font-weight:normal;font-size:0.75rem">(non compilati)</span>' : '') + '</h4>';
      if (hasClinical) {
        html += '<div class="visit-clinical-grid">';
        if (v.height_cm || v.weight_kg) {
          html += '<div class="visit-clinical-item"><span class="detail-label">Parametri</span>';
          html += '<span class="detail-value">';
          if (v.height_cm) html += 'Alt. ' + v.height_cm + ' cm ';
          if (v.weight_kg) html += 'Peso ' + v.weight_kg + ' kg ';
          if (v.bmi) html += 'BMI ' + v.bmi;
          html += '</span></div>';
        }
        if (v.blood_pressure_systolic) {
          html += '<div class="visit-clinical-item"><span class="detail-label">Pressione</span>' +
            '<span class="detail-value">' + v.blood_pressure_systolic + '/' + (v.blood_pressure_diastolic || '—') + ' mmHg' +
            (v.heart_rate ? ' — FC ' + v.heart_rate + ' bpm' : '') + '</span></div>';
        }
        if (v.visual_acuity_right || v.visual_acuity_left) {
          html += '<div class="visit-clinical-item"><span class="detail-label">Visus</span>' +
            '<span class="detail-value">DX: ' + esc(v.visual_acuity_right || '—') + ' / SX: ' + esc(v.visual_acuity_left || '—') + '</span></div>';
        }
        html += '</div>';

        var clinicalSections = [
          { label: 'Anamnesi Familiare', value: v.anamnesis_family },
          { label: 'Anamnesi Fisiologica', value: v.anamnesis_physiological },
          { label: 'Anamnesi Patologica Remota', value: v.anamnesis_pathological_remote },
          { label: 'Anamnesi Patologica Prossima', value: v.anamnesis_pathological_recent },
          { label: 'Anamnesi Lavorativa', value: v.anamnesis_occupational },
          { label: 'Esame Obiettivo', value: v.physical_examination },
          { label: 'Conclusioni', value: v.conclusions }
        ];
        clinicalSections.forEach(function (s) {
          if (s.value) {
            html += '<div style="margin-top:0.75rem"><div class="detail-label">' + s.label + '</div>' +
              '<div class="detail-value" style="white-space:pre-wrap;font-size:0.82rem">' + esc(s.value) + '</div></div>';
          }
        });
      } else {
        html += '<p class="text-muted" style="padding:0.5rem 0;font-size:0.82rem">Nessun dato clinico compilato. Compilare durante la visita.</p>';
      }
      html += '</div>';
    }

    /* ── Giudizio di Idoneità ── */
    // stash per la generazione del certificato dal dettaglio visita
    certVisitTmp = fj ? { fj: fj, worker: w } : null;
    html += '<div class="visit-section"><h4>Giudizio di Idoneit&agrave;</h4>';
    if (fj) {
      var fjStatusClass = FITNESS_BADGE_TYPE[fj.judgment_type] || 'gray';
      html += '<div class="idoneita-card idoneita-current" style="border-left-width:4px">' +
        '<div class="idoneita-card-header">' +
          '<span class="badge badge-' + fjStatusClass + '" style="font-size:0.82rem;padding:0.25rem 0.6rem">' + esc(FITNESS_LABELS[fj.judgment_type] || fj.judgment_type) + '</span>' +
          '<span class="idoneita-date">Emesso: ' + fmtDate(fj.issued_date) + '</span>' +
        '</div>' +
        '<div class="idoneita-card-body">' +
          (fj.prescriptions ? '<div class="idoneita-detail"><strong>Prescrizioni:</strong> ' + esc(fj.prescriptions) + '</div>' : '') +
          (fj.limitations ? '<div class="idoneita-detail"><strong>Limitazioni:</strong> ' + esc(fj.limitations) + '</div>' : '') +
          (fj.next_visit_date ? '<div class="idoneita-detail"><strong>Prossima visita:</strong> ' + fmtDate(fj.next_visit_date) + '</div>' : '') +
        '</div>' +
        '<div class="idoneita-card-actions">' +
          '<button class="btn btn-primary btn-sm" onclick="MDL.generateCertificateFromVisit()">&#128221; Genera</button> ' +
          (fj.pdf_path ? '<button class="btn btn-outline btn-sm" onclick="MDL.downloadFile(\'' + esc(fj.pdf_path) + '\')">&#128196; Scarica PDF</button>' : '') +
        '</div>' +
      '</div>';
    } else {
      html += '<p class="text-muted" style="padding:0.5rem 0;font-size:0.82rem">Nessun giudizio di idoneita emesso per questa visita.</p>';
      if (v.status === 'completata' || v.status === 'in_corso') {
        html += '<button class="btn btn-primary btn-sm" onclick="MDL.showIssueFitnessModal(\'' + v.id + '\')">Emetti Giudizio di Idoneit&agrave;</button>';
      }
    }
    html += '</div>';

    /* ── Note ── */
    if (v.notes) {
      html += '<div class="visit-section"><h4>Note</h4>' +
        '<p style="font-size:0.82rem;white-space:pre-wrap">' + esc(v.notes) + '</p></div>';
    }

    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modalDialog').classList.add('modal-lg');
    $('modalFooter').innerHTML =
      '<button class="btn btn-outline" onclick="MDL.closeVisitModal()">Chiudi</button>' +
      (w.id ? ' <button class="btn btn-primary" onclick="MDL.closeModal();MDL.openWorker(\'' + w.id + '\')">Apri Scheda Lavoratore</button>' : '');
  }

  MDL.closeVisitModal = function () {
    $('modalDialog').classList.remove('modal-lg');
    closeModal();
  };

  MDL.updateVisitStatus = function (visitId, newStatus) {
    var labels = {
      confermata: 'Confermare', in_corso: 'Iniziare', completata: 'Completare',
      non_presentato: 'Segnare come non presentato', annullata: 'Annullare'
    };
    if (!confirm((labels[newStatus] || 'Aggiornare') + ' questa visita?')) return;

    var body = { status: newStatus };
    if (newStatus === 'completata') body.actual_date = new Date().toISOString().slice(0, 10);

    api('PATCH', '/visits/' + visitId, body).then(function () {
      toast('Stato visita aggiornato: ' + newStatus, 'success');
      // Re-open the visit to refresh the view
      openVisitDetail(visitId);
      // Refresh tables in background
      if (state.activeTab === 'tab-visite' && state.activeCompany) loadVisite(state.activeCompany.id);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.editVisitSchedule = function (visitId, curDate, curTime, curLocation) {
    var inner = '<div class="form-grid">' +
      '<div class="form-group"><label>Data</label><input type="date" class="form-input" id="editVisitDate" value="' + esc(curDate) + '"></div>' +
      '<div class="form-group"><label>Ora</label><input type="time" class="form-input" id="editVisitTime" value="' + esc(curTime) + '"></div>' +
      '<div class="form-group form-full"><label>Sede</label><input type="text" class="form-input" id="editVisitLocation" value="' + esc(curLocation) + '"></div>' +
    '</div>';

    // Use a nested approach — store original modal, show edit form
    $('modalTitle').textContent = 'Modifica Programmazione';
    $('modalBody').innerHTML = inner;
    $('modalFooter').innerHTML =
      '<button class="btn btn-outline" onclick="MDL.viewVisit(\'' + visitId + '\')">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveVisitSchedule(\'' + visitId + '\')">Salva</button>';
  };

  MDL.saveVisitSchedule = function (visitId) {
    var d = {};
    var dateVal = ($('editVisitDate') || {}).value;
    var timeVal = ($('editVisitTime') || {}).value;
    var locVal = ($('editVisitLocation') || {}).value;
    if (dateVal) d.scheduled_date = dateVal;
    if (timeVal) d.scheduled_time = timeVal;
    if (locVal !== undefined) d.location = locVal || null;

    api('PATCH', '/visits/' + visitId, d).then(function () {
      toast('Programmazione aggiornata', 'success');
      openVisitDetail(visitId);
      if (state.activeTab === 'tab-visite' && state.activeCompany) loadVisite(state.activeCompany.id);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  MDL.showIssueFitnessModal = function (visitId) {
    var html = '<div class="form-grid">' +
      '<div class="form-group form-full"><label>Tipo Giudizio *</label><select class="form-input" id="fjType">' +
        '<option value="">— Seleziona —</option>' +
        '<option value="idoneo">Idoneo</option>' +
        '<option value="idoneo_con_prescrizioni">Idoneo con prescrizioni</option>' +
        '<option value="idoneo_con_limitazioni_temporanee">Idoneo con limitazioni temporanee</option>' +
        '<option value="idoneo_con_limitazioni_permanenti">Idoneo con limitazioni permanenti</option>' +
        '<option value="temporaneamente_non_idoneo">Temporaneamente non idoneo</option>' +
        '<option value="non_idoneo_permanente">Non idoneo permanente</option>' +
      '</select></div>' +
      '<div class="form-group form-full"><label>Prescrizioni</label><textarea class="form-input" id="fjPrescriptions" rows="2" placeholder="Es: Uso DPI antirumore..."></textarea></div>' +
      '<div class="form-group form-full"><label>Limitazioni</label><textarea class="form-input" id="fjLimitations" rows="2" placeholder="Es: Non adibire a lavori in quota..."></textarea></div>' +
      '<div class="form-group"><label>Data Emissione</label><input type="date" class="form-input" id="fjDate" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div class="form-group"><label>Data Rivalutazione</label><input type="date" class="form-input" id="fjReevalDate"></div>' +
      '<div class="form-group"><label>Prossima Visita</label><input type="date" class="form-input" id="fjNextVisit"></div>' +
      '<div class="form-group"><label>Tipo Prossima</label><select class="form-input" id="fjNextType">' +
        '<option value="periodica">Periodica</option><option value="straordinaria">Straordinaria</option></select></div>' +
    '</div>';

    $('modalTitle').textContent = 'Emetti Giudizio di Idoneita';
    $('modalBody').innerHTML = html;
    $('modalFooter').innerHTML =
      '<button class="btn btn-outline" onclick="MDL.viewVisit(\'' + visitId + '\')">Annulla</button> ' +
      '<button class="btn btn-primary" onclick="MDL.saveFitnessJudgment(\'' + visitId + '\')">Emetti Giudizio</button>';
  };

  MDL.saveFitnessJudgment = function (visitId) {
    var v = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    var d = {
      judgment_type: v('fjType'),
      prescriptions: v('fjPrescriptions') || null,
      limitations: v('fjLimitations') || null,
      issued_date: v('fjDate') || null,
      reevaluation_date: v('fjReevalDate') || null,
      next_visit_date: v('fjNextVisit') || null,
      next_visit_type: v('fjNextType') || 'periodica'
    };
    if (!d.judgment_type) { toast('Seleziona il tipo di giudizio', 'warning'); return; }

    api('POST', '/visits/' + visitId + '/fitness-judgment', d).then(function () {
      toast('Giudizio di idoneita emesso', 'success');
      openVisitDetail(visitId);
    }).catch(function (e) { toast(e.message, 'error'); });
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  MODAL SYSTEM                                                  */
  /* ═══════════════════════════════════════════════════════════════ */
  function openModal(title, bodyHtml, footerHtml) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = bodyHtml;
    $('modalFooter').innerHTML = footerHtml || '<button class="btn btn-outline" onclick="MDL.closeModal()">Chiudi</button>';
    show('modalOverlay');
  }
  function closeModal() { hide('modalOverlay'); }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  GESTIONE UTENTI (MC/SA only)                                  */
  /* ═══════════════════════════════════════════════════════════════ */

  var ROLE_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'medico_competente', label: 'Medico Competente' },
    { value: 'medico_collaboratore', label: 'Medico Collaboratore' },
    { value: 'segreteria_mdl', label: 'Segreteria' },
    { value: 'datore_lavoro', label: 'Datore di Lavoro' },
    { value: 'rspp', label: 'RSPP' },
    { value: 'lavoratore', label: 'Lavoratore' }
  ];
  var COMPANY_BOUND = ['datore_lavoro', 'rspp', 'lavoratore'];
  var ROLE_BADGES = {
    super_admin: 'badge-danger', medico_competente: 'badge-primary',
    medico_collaboratore: 'badge-info', segreteria_mdl: 'badge-warning',
    datore_lavoro: 'badge-success', rspp: 'badge-success', lavoratore: 'badge-secondary'
  };

  function loadUtenti() {
    var container = $('usersTableContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Caricamento utenti...</p>';

    var search = ($('userSearch') || {}).value || '';
    var roleFilter = ($('userRoleFilter') || {}).value || '';
    var params = '?limit=50';
    if (search) params += '&search=' + encodeURIComponent(search);
    if (roleFilter) params += '&role=' + encodeURIComponent(roleFilter);

    apiFetch('/users' + params).then(function (r) {
      if (!r.success) { container.innerHTML = '<p class="text-danger">Errore: ' + esc(r.error) + '</p>'; return; }
      var users = r.data || [];
      if (!users.length) {
        container.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Nessun utente trovato.</p>';
        return;
      }
      var html = '<table class="data-table"><thead><tr>' +
        '<th>Nome</th><th>Email</th><th>Ruolo</th><th>Azienda</th><th>Ultimo accesso</th><th>Stato</th><th>Azioni</th>' +
        '</tr></thead><tbody>';
      users.forEach(function (u) {
        var compName = u.mdl_companies ? u.mdl_companies.business_name : '—';
        var lastLogin = u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('it-IT') : 'Mai';
        var statusBadge = u.is_active
          ? '<span class="badge badge-success">Attivo</span>'
          : '<span class="badge badge-secondary">Disattivato</span>';
        var roleBadge = '<span class="badge ' + (ROLE_BADGES[u.role] || 'badge-secondary') + '">' + (ROLE_LABELS[u.role] || u.role) + '</span>';
        var isSelf = state.user && u.id === state.user.id;
        var actions = isSelf ? '<span style="color:var(--text-muted);font-size:.85em">Tu</span>' :
          '<button class="btn btn-sm btn-outline" onclick="window.__mdl_editUser(\'' + u.id + '\')">Modifica</button>';
        html += '<tr>' +
          '<td><strong>' + esc(u.last_name) + '</strong> ' + esc(u.first_name) + '</td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td>' + roleBadge + '</td>' +
          '<td>' + esc(compName) + '</td>' +
          '<td>' + lastLogin + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + actions + '</td></tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    });
  }

  // Cached companies for user form
  var _companiesCache = null;
  function getCompanies() {
    if (_companiesCache) return Promise.resolve(_companiesCache);
    return apiFetch('/companies?limit=100&active=true').then(function (r) {
      _companiesCache = (r.data || []).filter(function (c) {
        return c.business_name !== '__CATALOGO_PROTOCOLLI_STANDARD__';
      });
      return _companiesCache;
    });
  }

  function openUserForm(userId) {
    var isEdit = !!userId;
    var title = isEdit ? 'Modifica Utente' : 'Nuovo Utente';

    var loadData = isEdit
      ? apiFetch('/users/' + userId)
      : Promise.resolve({ success: true, data: {} });

    Promise.all([loadData, getCompanies()]).then(function (results) {
      var userData = results[0].data || {};
      var companies = results[1];

      if (isEdit && !results[0].success) {
        toast('Utente non trovato', 'error');
        return;
      }

      // Build role options (respect creatableRolesFor)
      var myRole = state.user ? state.user.role : '';
      var creatableMap = {
        super_admin: ['super_admin','medico_competente','medico_collaboratore','segreteria_mdl','datore_lavoro','rspp','lavoratore'],
        medico_competente: ['medico_collaboratore','segreteria_mdl','datore_lavoro','rspp','lavoratore']
      };
      var creatableRoles = creatableMap[myRole] || [];

      var roleOpts = ROLE_OPTIONS.filter(function (ro) {
        return creatableRoles.indexOf(ro.value) >= 0;
      }).map(function (ro) {
        var sel = userData.role === ro.value ? ' selected' : '';
        return '<option value="' + ro.value + '"' + sel + '>' + ro.label + '</option>';
      }).join('');

      var compOpts = '<option value="">— Nessuna —</option>' + companies.map(function (c) {
        var sel = userData.company_id === c.id ? ' selected' : '';
        return '<option value="' + c.id + '"' + sel + '>' + esc(c.business_name) + '</option>';
      }).join('');

      var needsCompany = userData.role && COMPANY_BOUND.indexOf(userData.role) >= 0;

      var body = '<form id="userForm" class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">' +
        '<div class="form-group"><label>Nome *</label><input id="uf_first_name" class="form-control" value="' + esc(userData.first_name || '') + '" required></div>' +
        '<div class="form-group"><label>Cognome *</label><input id="uf_last_name" class="form-control" value="' + esc(userData.last_name || '') + '" required></div>' +
        '<div class="form-group"><label>Email *</label><input id="uf_email" type="email" class="form-control" value="' + esc(userData.email || '') + '"' + (isEdit ? ' readonly style="background:#f0f0f0"' : ' required') + '></div>' +
        '<div class="form-group"><label>Telefono</label><input id="uf_phone" class="form-control" value="' + esc(userData.phone || '') + '"></div>' +
        '<div class="form-group"><label>Codice Fiscale</label><input id="uf_fiscal_code" class="form-control" maxlength="16" value="' + esc(userData.fiscal_code || '') + '"></div>' +
        '<div class="form-group"><label>Ruolo *</label><select id="uf_role" class="form-control" onchange="window.__mdl_toggleCompanyField()">' + roleOpts + '</select></div>' +
        '<div class="form-group" id="uf_company_group" style="' + (needsCompany ? '' : 'display:none') + '"><label>Azienda</label><select id="uf_company_id" class="form-control">' + compOpts + '</select></div>' +
        (isEdit ? '' : '<div class="form-group"><label>Password *</label><input id="uf_password" type="password" class="form-control" minlength="8" placeholder="Minimo 8 caratteri" required></div>') +
        (isEdit ? '<div class="form-group"><label>Nuova Password</label><input id="uf_password" type="password" class="form-control" minlength="8" placeholder="Lascia vuoto per non cambiare"></div>' : '') +
        (isEdit ? '<div class="form-group"><label>Stato</label><select id="uf_is_active" class="form-control"><option value="true"' + (userData.is_active !== false ? ' selected' : '') + '>Attivo</option><option value="false"' + (userData.is_active === false ? ' selected' : '') + '>Disattivato</option></select></div>' : '') +
        '</form>';

      var footer = '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
        '<button class="btn btn-primary" onclick="window.__mdl_saveUser(\'' + (userId || '') + '\')">' + (isEdit ? 'Salva Modifiche' : 'Crea Utente') + '</button>';

      openModal(title, body, footer);
    });
  }

  function toggleCompanyField() {
    var role = ($('uf_role') || {}).value || '';
    var grp = $('uf_company_group');
    if (grp) grp.style.display = COMPANY_BOUND.indexOf(role) >= 0 ? '' : 'none';
  }

  function saveUser(userId) {
    var isEdit = !!userId;
    var data = {
      first_name: ($('uf_first_name') || {}).value || '',
      last_name: ($('uf_last_name') || {}).value || '',
      role: ($('uf_role') || {}).value || '',
      phone: ($('uf_phone') || {}).value || '',
      fiscal_code: ($('uf_fiscal_code') || {}).value || '',
      company_id: ($('uf_company_id') || {}).value || null,
    };

    var pw = ($('uf_password') || {}).value || '';
    if (!isEdit) {
      data.email = ($('uf_email') || {}).value || '';
      data.password = pw;
    } else if (pw) {
      data.password = pw;
    }

    // Validate
    if (!data.first_name || !data.last_name || !data.role) {
      toast('Compila tutti i campi obbligatori', 'error'); return;
    }
    if (!isEdit && (!data.email || !data.password)) {
      toast('Email e password sono obbligatori', 'error'); return;
    }
    if (pw && pw.length < 8) {
      toast('La password deve essere di almeno 8 caratteri', 'error'); return;
    }

    // is_active for edit
    if (isEdit) {
      var activeVal = ($('uf_is_active') || {}).value;
      if (activeVal !== undefined) data.is_active = activeVal === 'true';
    }

    var method = isEdit ? 'PATCH' : 'POST';
    var url = isEdit ? '/users/' + userId : '/users';

    apiFetch(url, { method: method, body: JSON.stringify(data) }).then(function (r) {
      if (r.success) {
        toast(isEdit ? 'Utente aggiornato' : 'Utente creato', 'success');
        closeModal();
        loadUtenti();
      } else {
        toast(r.error || 'Errore', 'error');
      }
    });
  }

  // Expose to global for onclick handlers
  window.__mdl_openUserForm = function (id) { openUserForm(id); };
  window.__mdl_editUser = function (id) { openUserForm(id); };
  window.__mdl_saveUser = function (id) { saveUser(id); };
  window.__mdl_toggleCompanyField = toggleCompanyField;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  INIT                                                          */
  /* ═══════════════════════════════════════════════════════════════ */
  function init() {
    // Login
    var loginForm = $('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = $('loginEmail').value.trim();
        var password = $('loginPassword').value;
        var errEl = $('loginError');
        errEl.classList.remove('visible'); errEl.textContent = '';
        $('loginBtn').disabled = true; $('loginBtn').textContent = 'Accesso...';

        api('POST', '/auth/login', { email: email, password: password }).then(function (r) {
          if (r.success) { saveSession(r.session, r.user); showApp(); }
          else { errEl.textContent = r.error || 'Errore login'; errEl.classList.add('visible'); }
        }).catch(function (err) {
          errEl.textContent = err.message; errEl.classList.add('visible');
        }).finally(function () {
          $('loginBtn').disabled = false; $('loginBtn').textContent = 'Accedi';
        });
      });
    }

    // Logout
    on('logoutBtn', 'click', function () { clearSession(); showLogin(); window.location.hash = ''; });

    // Hash navigation
    window.addEventListener('hashchange', function () {
      if (!state.session) return;
      var h = window.location.hash.slice(1);
      if (h.indexOf('azienda/') === 0) {
        openCompany(h.slice(8));
      } else if (h.indexOf('lavoratore/') === 0) {
        openWorkerDetail(h.slice(11));
      } else {
        var hMap = { protocolli: 'protocolli-globale' };
        navigateTo(hMap[h] || h || 'dashboard');
      }
    });

    // Modal
    on('modalCloseBtn', 'click', closeModal);
    on('modalOverlay', 'click', function (e) { if (e.target === $('modalOverlay')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('modalOverlay') && !$('modalOverlay').classList.contains('d-none')) closeModal();
    });

    // Tab switching (company)
    document.querySelectorAll('#companyTabs .tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Aziende search
    on('searchAziende', 'input', debounce(loadAziende, 400));
    on('btnNuovaAzienda', 'click', function () {
      openModal('Nuova Azienda Cliente', companyFormHtml(),
        '<button class="btn btn-outline" onclick="MDL.closeModal()">Annulla</button> ' +
        '<button class="btn btn-primary" onclick="MDL.saveNewCompany()">Salva Azienda</button>');
    });

    // Company detail events
    on('searchDipendenti', 'input', debounce(function () {
      if (state.activeCompany) loadDipendenti(state.activeCompany.id);
    }, 400));
    on('btnNuovoDipendente', 'click', showNewWorkerModal);
    on('filterVisitStatus', 'change', function () {
      if (state.activeCompany) loadVisite(state.activeCompany.id);
    });
    on('btnNuovaVisita', 'click', function () { showNewVisitModal(); });
    on('btnEditAzienda', 'click', function () { MDL.editCompany(); });
    on('btnDisattivaAzienda', 'click', function () { MDL.disableCompany(); });
    on('btnNuovaMansione', 'click', function () { MDL.newJobRole(); });
    on('btnNuovoProtocollo', 'click', function () { toast('Creazione protocollo — in sviluppo', 'info'); });

    // Global Lavoratori events
    on('searchLavoratoriGlobal', 'input', debounce(loadLavoratoriGlobal, 400));
    on('filterLavAzienda', 'change', loadLavoratoriGlobal);
    on('btnNuovoLavGlobal', 'click', showNewWorkerModal);

    // Global Visite events
    on('filterVisiteGlobalStatus', 'change', loadVisiteGlobal);
    on('filterVisiteAzienda', 'change', loadVisiteGlobal);
    on('btnNuovaVisitaGlobal', 'click', function () { showNewVisitModal(); });

    // Utenti events
    on('userSearch', 'input', debounce(loadUtenti, 400));
    on('userRoleFilter', 'change', loadUtenti);

    // Check session
    if (loadSession()) { showApp(); } else { showLogin(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
