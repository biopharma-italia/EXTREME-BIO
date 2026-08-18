/**
 * DASHBOARD.JS — Bio-Clinic Referti Dashboard
 * Full Supabase integration: Auth, CRUD, Storage, Realtime
 * @version 2.1.0  @date 2026-02-25
 * Fixes: P0-1 race condition download_count, P0-2 XSS badges, P0-5 password change,
 *        P1-6 double-click protection, P1-7 bulk throttle, P1-8 patient filter,
 *        P1-9 WS heartbeat cleanup, P2 accents/timeAgo/profile
 */
(function () {
  'use strict';

  // ── Supabase config ─────────────────────────────
  var SB_URL = 'https://mdxqgzkxrcrotxxbhoai.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFnemt4cmNyb3R4eGJob2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODYxMzIsImV4cCI6MjA4NzU2MjEzMn0.HHExeiCGqnx4di_u9gghUnTfgQVAIjKuN6kt_vLFddA';

  var ROLE_LABELS = {
    patient: 'Paziente', lab_technician: 'Tecnico Lab',
    physician: 'Medico', admin: 'Amministratore', super_admin: 'Super Admin',
    ostetrica: 'Ostetrica'
  };

  // Override label per utenti con ruolo ostetrica ma job title diverso
  // (fino a quando la migration 015 non aggiunge i nuovi enum values)
  var ROLE_OVERRIDE_BY_EMAIL = {
    'cinzia.guarino@bio-clinic.it': 'Biologa',
    'sara.meloni@bio-clinic.it': 'Biologa',
    'gabriele.delogu@bio-clinic.it': 'Tecnico'
  };

  function roleLabel(role, email) {
    if (email && ROLE_OVERRIDE_BY_EMAIL[email]) return ROLE_OVERRIDE_BY_EMAIL[email];
    return ROLE_LABELS[role] || role;
  }
  var STATUS_LABELS = {
    pending: 'In Attesa', validated: 'Validato', signed: 'Firmato',
    released: 'Rilasciato', archived: 'Archiviato', revoked: 'Revocato'
  };

  // ── State ────────────────────────────────────────
  var state = { user: null, profile: null, token: null, currentPage: 'my-reports', realtimeWs: null };

  // ── Helpers ──────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function fmtDate(d) {
    if (!d) return '--';
    var dt = new Date(d);
    return dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function fmtDateTime(d) {
    if (!d) return '--';
    var dt = new Date(d);
    return dt.toLocaleDateString('it-IT') + ' ' + dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtSize(b) {
    if (!b) return '--';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function timeAgo(d) {
    if (!d) return '';
    var now = Date.now();
    var ms = now - new Date(d).getTime();
    var sec = Math.floor(ms / 1000);
    if (sec < 60) return 'adesso';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' min fa';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h fa';
    var days = Math.floor(hr / 24);
    if (days === 1) return 'ieri';
    return days + 'g fa';
  }
  function genPassword(len) {
    var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    var arr = new Uint8Array(len || 16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function (b) { return charset[b % charset.length]; }).join('');
  }

  // ── Supabase REST ────────────────────────────────
  function sbHeaders() {
    var h = { 'apikey': SB_KEY, 'Content-Type': 'application/json' };
    if (state.token) h['Authorization'] = 'Bearer ' + state.token;
    return h;
  }
  function sbGet(table, query) {
    return fetch(SB_URL + '/rest/v1/' + table + '?' + (query || ''), {
      headers: Object.assign({}, sbHeaders(), { 'Prefer': 'count=exact' })
    }).then(function (r) {
      if (!r.ok) throw new Error('API error: ' + r.status);
      return r.json();
    });
  }
  // COUNT helper: HEAD request with Prefer: count=exact
  // Returns total row count from Content-Range header (e.g. "0-0/549" → 549)
  function sbCount(table, filter) {
    var q = 'select=id';
    if (filter) q += '&' + filter;
    return fetch(SB_URL + '/rest/v1/' + table + '?' + q, {
      method: 'HEAD',
      headers: Object.assign({}, sbHeaders(), { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' })
    }).then(function (r) {
      var cr = r.headers.get('content-range') || '';
      var m = cr.match(/\/(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    }).catch(function () { return 0; });
  }
  function sbPost(table, data) {
    return fetch(SB_URL + '/rest/v1/' + table, {
      method: 'POST', headers: Object.assign({}, sbHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    });
  }
  function sbPatch(table, query, data, opts) {
    return fetch(SB_URL + '/rest/v1/' + table + '?' + query, {
      method: 'PATCH', headers: Object.assign({}, sbHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    }).then(function (result) {
      if (opts && opts.requireMatch && Array.isArray(result) && result.length === 0) {
        throw new Error('Permesso negato: nessun record aggiornato (verifica il tuo ruolo)');
      }
      return result;
    });
  }
  function sbRpc(fn, args) {
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers: sbHeaders(), body: JSON.stringify(args || {})
    }).then(function (r) {
      if (!r.ok) throw new Error('RPC error');
      return r.json();
    });
  }

  // ── Notify Release (email to patient) ──────────
  // Track which reports have already been notified to prevent duplicates
  var _notifiedReports = {};

  function notifyRelease(reportId) {
    // P1-6: Idempotency guard — prevent duplicate notifications
    if (_notifiedReports[reportId]) {
      return Promise.resolve({ success: true, already_notified: true });
    }
    _notifiedReports[reportId] = true;

    return fetch('/api/notify-release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ report_id: reportId })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.email_sent && data.whatsapp_sent) {
        toast('Notifica inviata (Email + WhatsApp)', 'success');
      } else if (data.email_sent) {
        toast('Email inviata a ' + data.patient_email, 'success');
        // Phase A: explicit operator feedback when WhatsApp was NOT sent
        if (data.whatsapp_skip_reason) {
          toast('\u26a0\ufe0f WhatsApp NON inviato: ' + data.whatsapp_skip_reason, 'warning');
        }
      } else if (data.whatsapp_sent) {
        toast('WhatsApp inviato al paziente', 'success');
      } else if (data.success) {
        toast('Notifica in-app inviata', 'info');
        if (data.whatsapp_skip_reason) {
          toast('\u26a0\ufe0f WhatsApp NON inviato: ' + data.whatsapp_skip_reason, 'warning');
        }
      }
      return data;
    }).catch(function (err) {
      console.warn('[notifyRelease] API non disponibile, notifica via DB', err);
      // Fallback: mark notified directly via Supabase (admin has UPDATE rights)
      return sbPatch('reports', 'id=eq.' + reportId, {
        patient_notified: true,
        patient_notified_at: new Date().toISOString()
      }).then(function () {
        // Get patient_id from report to create in-app notification
        return sbGet('reports', 'id=eq.' + reportId + '&select=patient_id,report_type,sample_date');
      }).then(function (rpts) {
        if (!rpts || !rpts[0] || !rpts[0].patient_id) return;
        return sbPost('notifications', {
          user_id: rpts[0].patient_id, channel: 'in_app',
          subject: 'Nuovo referto disponibile',
          body: 'Il suo referto ' + (rpts[0].report_type || '') + ' del ' + (rpts[0].sample_date || '') + ' è disponibile per il download.',
          report_id: reportId, status: 'sent', sent_at: new Date().toISOString()
        });
      }).then(function () {
        toast('Paziente notificato (notifica in-app)', 'info');
      }).catch(function () {
        // Remove from notified set so user can retry
        delete _notifiedReports[reportId];
      });
    });
  }

  // ── Mark report as viewed by patient ───────────
  var _viewedReports = {};

  function markReportViewed(reportId) {
    // P1-6: Debounce — only mark once per session
    if (_viewedReports[reportId]) return;
    _viewedReports[reportId] = true;

    // Try RPC first (atomic), then API, then fallback
    sbRpc('mark_report_viewed', { p_report_id: reportId }).catch(function () {
      // Fallback to API
      fetch('/api/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
        body: JSON.stringify({ report_id: reportId })
      }).catch(function () {
        // Last fallback: direct patch
        sbPatch('reports', 'id=eq.' + reportId, {
          patient_viewed: true,
          patient_viewed_at: new Date().toISOString()
        }).catch(function () {});
      });
    });
  }

  // Supabase Auth REST
  function sbAuthSignUp(email, password, metadata) {
    return fetch(SB_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
      body: JSON.stringify({ email: email, password: password, data: metadata })
    }).then(function (r) { return r.json(); });
  }
  function sbAuthUpdateUser(data) {
    return fetch(SB_URL + '/auth/v1/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    });
  }

  // ── Auth ─────────────────────────────────────────
  function getSession() {
    try {
      var raw = localStorage.getItem('sb-session');
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s.expires_at && s.expires_at < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('sb-session');
        return null;
      }
      return s;
    } catch (e) { return null; }
  }

  function refreshToken() {
    var session = getSession();
    if (!session || !session.refresh_token) return Promise.reject('No session');
    return fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (r) {
      if (!r.ok) throw new Error('Refresh failed');
      return r.json();
    }).then(function (data) {
      state.token = data.access_token;
      localStorage.setItem('sb-session', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
        user: data.user || session.user
      }));
      return data;
    });
  }

  function logout() {
    // Try to sign out via API
    fetch(SB_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + state.token }
    }).catch(function () {});
    localStorage.removeItem('sb-session');
    if (state.realtimeWs) { try { state.realtimeWs.close(); } catch (e) {} }
    window.location.href = '/';
  }

  // ── Token refresh timer ─────────────────────────
  function startRefreshTimer() {
    setInterval(function () {
      var session = getSession();
      if (!session) return;
      var expiresIn = (session.expires_at || 0) - Math.floor(Date.now() / 1000);
      if (expiresIn < 300) { // refresh 5 min before expiry
        refreshToken().catch(function () {
          toast('Sessione scaduta. Effettua nuovamente il login.', 'warning');
          setTimeout(logout, 2000);
        });
      }
    }, 60000); // check every minute
  }

  // ── Init ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var session = getSession();
    if (!session || !session.access_token) {
      window.location.href = '/';
      return;
    }
    state.token = session.access_token;
    state.user = session.user;

    initTheme();
    initSidebar();
    initRouter();
    initNotifications();
    initModal();
    initInviteUser();
    initPasswordChange();
    loadUserProfile();
    startRefreshTimer();
    initRealtime();
  });

  // ── Theme ────────────────────────────────────────
  function initTheme() {
    var saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    $('themeToggle').addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ── Sidebar ──────────────────────────────────────
  function initSidebar() {
    var sidebar = $('sidebar');
    var overlay = $('sidebarOverlay');
    var toggle = $('sidebarToggle');
    var close = $('sidebarClose');

    function open() { sidebar.classList.add('open'); overlay.classList.add('active'); }
    function shut() { sidebar.classList.remove('open'); overlay.classList.remove('active'); }

    toggle.addEventListener('click', open);
    close.addEventListener('click', shut);
    overlay.addEventListener('click', shut);

    $('logoutBtn').addEventListener('click', logout);
  }

  function updateSidebarForRole(role) {
    $$('.nav-section').forEach(function (sec) {
      var roles = (sec.dataset.roles || '').split(',');
      sec.style.display = roles.indexOf(role) >= 0 ? '' : 'none';
    });
    $$('.nav-item').forEach(function (item) {
      var roles = (item.dataset.roles || '').split(',');
      item.style.display = roles.indexOf(role) >= 0 ? '' : 'none';
    });

    // Default page per role (or use hash)
    var hash = window.location.hash.replace('#', '');
    if (hash && $('page-' + hash)) {
      navigateTo(hash);
    } else if (role === 'patient') {
      navigateTo('my-reports');
    } else if (role === 'lab_technician') {
      navigateTo('upload');
    } else if (role === 'physician') {
      navigateTo('sign-release');
    } else if (role === 'ostetrica') {
      navigateTo('upload');
    } else {
      navigateTo('all-reports');
    }
  }

  // ── Router ───────────────────────────────────────
  function initRouter() {
    $$('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var page = this.dataset.page;
        if (page) navigateTo(page);
        $('sidebar').classList.remove('open');
        $('sidebarOverlay').classList.remove('active');
      });
    });

    window.addEventListener('hashchange', function () {
      var hash = window.location.hash.replace('#', '');
      if (hash && hash !== state.currentPage) navigateTo(hash);
    });
  }

  function navigateTo(page) {
    state.currentPage = page;
    window.location.hash = page;

    $$('.page').forEach(function (p) { p.classList.remove('active'); p.hidden = true; });
    var target = $('page-' + page);
    if (target) {
      target.classList.add('active');
      target.hidden = false;
      $('pageTitle').textContent = target.dataset.title || '';
    }

    $$('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.dataset.page === page);
    });

    loadPageData(page);
  }

  function loadPageData(page) {
    switch (page) {
      case 'my-reports': loadMyReports(); break;
      case 'my-profile': loadProfile(); break;
      case 'upload': initUploadPage(); break;
      case 'bulk-upload': initBulkUpload(); break;
      case 'queue': loadQueue(); break;
      case 'sign-release': loadSignRelease(); break;
      case 'all-reports': loadAllReports(); break;
      case 'users': loadUsers(); break;
      case 'audit': loadAuditLog(); break;
      case 'ai-report': initAIReport(); break;
      case 'analytics': if (window._initAnalytics) window._initAnalytics(); break;
    }
  }

  // ── Realtime (Supabase Postgres Changes via WebSocket) ────
  var _heartbeatInterval = null;
  var _reconnectTimeout = null;

  function initRealtime() {
    // P1-9: Clean up previous heartbeat interval and reconnect timeout
    if (_heartbeatInterval) { clearInterval(_heartbeatInterval); _heartbeatInterval = null; }
    if (_reconnectTimeout) { clearTimeout(_reconnectTimeout); _reconnectTimeout = null; }
    if (state.realtimeWs) { try { state.realtimeWs.close(); } catch (e) {} state.realtimeWs = null; }

    try {
      var wsUrl = SB_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SB_KEY + '&vsn=1.0.0';
      var ws = new WebSocket(wsUrl);
      state.realtimeWs = ws;
      var heartbeatRef = 0;

      ws.onopen = function () {
        // Subscribe to reports changes
        ws.send(JSON.stringify({
          topic: 'realtime:public:reports',
          event: 'phx_join',
          payload: { config: { postgres_changes: [{ event: '*', schema: 'public', table: 'reports' }] } },
          ref: '1'
        }));
        // Subscribe to notifications
        ws.send(JSON.stringify({
          topic: 'realtime:public:notifications',
          event: 'phx_join',
          payload: { config: { postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'notifications' }] } },
          ref: '2'
        }));
        // P1-9 FIX: Heartbeat with proper cleanup reference
        _heartbeatInterval = setInterval(function () {
          heartbeatRef++;
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(heartbeatRef) }));
          }
        }, 30000);
      };

      ws.onmessage = function (evt) {
        try {
          var msg = JSON.parse(evt.data);
          if (msg.event === 'postgres_changes') {
            var payload = msg.payload;
            if (payload.table === 'reports') {
              handleReportChange(payload);
            } else if (payload.table === 'notifications') {
              handleNotificationChange(payload);
            }
          }
        } catch (e) { /* ignore parse errors */ }
      };

      ws.onclose = function () {
        // P1-9 FIX: Clean up heartbeat on close before reconnecting
        if (_heartbeatInterval) { clearInterval(_heartbeatInterval); _heartbeatInterval = null; }
        // Reconnect after 5 seconds with exponential backoff
        _reconnectTimeout = setTimeout(initRealtime, 5000);
      };

      ws.onerror = function () {
        // Clean up on error — onclose will fire after this
        if (_heartbeatInterval) { clearInterval(_heartbeatInterval); _heartbeatInterval = null; }
      };
    } catch (e) {
      // Realtime not available, fall back to polling
      setInterval(function () {
        if (state.currentPage === 'my-reports') loadMyReports();
        if (state.currentPage === 'queue') loadQueue();
        if (state.currentPage === 'sign-release') loadSignRelease();
      }, 30000);
    }
  }

  function handleReportChange(payload) {
    var page = state.currentPage;
    if (page === 'my-reports') loadMyReports();
    else if (page === 'queue') loadQueue();
    else if (page === 'sign-release') loadSignRelease();
    else if (page === 'all-reports') loadAllReports();

    // Show toast for new reports
    if (payload.eventType === 'INSERT') {
      toast('Nuovo referto aggiunto al sistema', 'info');
    } else if (payload.eventType === 'UPDATE') {
      var newRecord = payload.new || {};
      if (newRecord.status === 'released') {
        toast('Un referto è stato rilasciato', 'success');
      }
    }
  }

  function handleNotificationChange(payload) {
    if (state.profile && payload.new && payload.new.user_id === state.profile.id) {
      $('notifDot').hidden = false;
      toast(payload.new.subject || 'Nuova notifica', 'info');
    }
  }

  // ── User Profile ─────────────────────────────────
  function loadUserProfile() {
    if (!state.user) return;

    var meta = state.user.user_metadata || {};
    var name = ((meta.first_name || '') + ' ' + (meta.last_name || '')).trim() || state.user.email;
    var initials = (meta.first_name || '?')[0] + (meta.last_name || '?')[0];

    function applyProfile(profile) {
      state.profile = profile;
      var n = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim() || state.user.email;
      var ini = (profile.first_name || '?')[0] + (profile.last_name || '?')[0];
      $('userName').textContent = n;
      $('userRole').textContent = roleLabel(profile.role, profile.email);
      // Avatar uses logo image — do not overwrite with initials
      updateSidebarForRole(profile.role);
      loadDashboardBadges(profile.role);
    }

    function applyFallback() {
      $('userName').textContent = name;
      $('userRole').textContent = roleLabel(meta.role || 'patient', state.user ? state.user.email : '');
      // Avatar uses logo image — do not overwrite with initials
      updateSidebarForRole(meta.role || 'patient');
    }

    function createMissingProfile() {
      // Auto-create profile from user_metadata (safety net)
      var profileData = {
        auth_id: state.user.id,
        email: state.user.email,
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        fiscal_code: meta.fiscal_code || null,
        role: meta.role || 'patient',
        is_active: true,
        is_email_verified: true,
        language: 'it',
        timezone: 'Europe/Rome'
      };
      return sbPost('users', profileData).then(function (result) {
        if (result && result.length > 0) {
          applyProfile(result[0]);
        } else {
          applyFallback();
        }
      }).catch(function () {
        applyFallback();
      });
    }

    sbGet('users', 'auth_id=eq.' + state.user.id + '&select=*').then(function (data) {
      if (data && data.length > 0) {
        applyProfile(data[0]);
      } else {
        // Profile missing — auto-create it
        createMissingProfile();
      }
    }).catch(function () {
      applyFallback();
    });
  }

  function loadDashboardBadges(role) {
    // Load badge counts for sidebar — use HEAD count for accurate numbers
    if (role === 'lab_technician' || role === 'admin' || role === 'super_admin' || role === 'ostetrica') {
      sbCount('reports', 'status=eq.pending').then(function (n) {
        updateBadge('badgePending', n);
      });
    }
    if (role === 'physician' || role === 'admin' || role === 'super_admin' || role === 'ostetrica' || role === 'lab_technician') {
      sbCount('reports', 'or=(status.eq.validated,status.eq.signed)').then(function (n) {
        updateBadge('badgeSign', n);
      });
    }
    if (role === 'patient') {
      sbCount('reports', 'status=eq.released&patient_downloaded=eq.false').then(function (n) {
        updateBadge('badgeNewReports', n);
      });
    }
  }

  // ── MY REPORTS (Patient) ─────────────────────────
  function loadMyReports() {
    if (!state.user) return;
    var filterStatus = $('filterMyStatus').value;
    var search = $('searchMyReports').value.trim();

    // Query reports directly with patient join (more reliable with RLS than views)
    var reportsQ = 'select=*,patient:patient_id(first_name,last_name,fiscal_code)&order=created_at.desc&limit=50';
    // P1-8: Add explicit patient_id filter for patient role (defense-in-depth alongside RLS)
    if (state.profile && state.profile.role === 'patient') {
      reportsQ += '&patient_id=eq.' + state.profile.id;
    }
    if (filterStatus) reportsQ += '&status=eq.' + filterStatus;
    if (search) reportsQ += '&or=(report_number.ilike.*' + encodeURIComponent(search) + '*,report_type.ilike.*' + encodeURIComponent(search) + '*)';

    sbGet('reports', reportsQ).then(function (data) {
      var body = $('myReportsBody');
      if (!data || !Array.isArray(data) || data.length === 0) {
        body.innerHTML = '<tr class="table-empty"><td colspan="6"><div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>Nessun referto disponibile</p><span>I tuoi referti appariranno qui quando saranno pronti</span></div></td></tr>';
        $('statAvailable').textContent = '0';
        $('statInProgress').textContent = '0';
        $('statDownloaded').textContent = '0';
        return;
      }

      // Cache report data for alert-before-download
      state._reportsCache = {};
      data.forEach(function (r) { state._reportsCache[r.id] = r; });

      var available = 0, inProgress = 0, downloaded = 0;
      var rows = data.map(function (r) {
        if (r.status === 'released') available++;
        else inProgress++;
        if (r.download_count > 0) downloaded++;

        var urgentBadge = r.is_urgent ? ' <span class="badge badge-urgent" title="Urgente">!</span>' : '';
        var abnormalBadge = r.has_abnormal_values ? ' <span class="badge badge-abnormal" title="Valori anomali">A</span>' : '';
        var hasAlert = r.has_abnormal_values || r.physician_notes;
        var alertBadge = hasAlert ? ' <span class="badge" style="background:#f59e0b;color:#fff;font-size:0.65rem" title="Leggere avviso prima del download">&#9888; Avviso</span>' : '';
        var newBadge = (r.status === 'released' && !r.patient_viewed) ? ' <span class="badge" style="background:#ef4444;color:#fff;font-size:0.7rem;animation:pulse 2s infinite">NUOVO</span>' : '';

        // P1-8: Auto-mark viewed when patient loads report list
        if (r.status === 'released' && !r.patient_viewed && state.profile && state.profile.role === 'patient') {
          // Don't auto-mark here; only on explicit detail/download
        }

        return '<tr>' +
          '<td><strong>' + esc(r.report_number || '--') + '</strong>' + urgentBadge + abnormalBadge + alertBadge + newBadge + '</td>' +
          '<td>' + esc(r.report_type || '--') + '</td>' +
          '<td>' + esc(r.category || '--') + '</td>' +
          '<td>' + fmtDate(r.sample_date) + '</td>' +
          '<td><span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></td>' +
          '<td>' + (r.status === 'released'
            ? '<button class="btn btn-primary btn-sm" onclick="window._safeDownload(\'' + r.id + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Scarica</button>'
            + ' <button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Dettagli</button>'
            : '<button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Dettagli</button>'
            + ' <span style="color:var(--text-muted);font-size:0.82rem">Non ancora disponibile</span>') +
          '</td></tr>';
      });

      body.innerHTML = rows.join('');
      $('statAvailable').textContent = available;
      $('statInProgress').textContent = inProgress;
      $('statDownloaded').textContent = downloaded;
    }).catch(function () {
      toast('Errore nel caricamento dei referti', 'error');
    });

    if (!$('filterMyStatus')._bound) {
      $('filterMyStatus').addEventListener('change', loadMyReports);
      $('searchMyReports').addEventListener('input', debounce(loadMyReports, 400));
      $('filterMyStatus')._bound = true;
    }
  }

  // ── PROFILE ──────────────────────────────────────
  function loadProfile() {
    if (!state.profile && !state.user) return;
    var p = state.profile || {};
    var meta = (state.user && state.user.user_metadata) || {};

    $('profName').value = p.first_name || meta.first_name || '';
    $('profSurname').value = p.last_name || meta.last_name || '';
    $('profEmail').value = p.email || (state.user && state.user.email) || '';
    $('profFiscal').value = p.fiscal_code || meta.fiscal_code || '';
    $('profPhone').value = p.phone || '';

    if (p.totp_enabled) {
      $('badge2fa').textContent = 'Attiva';
      $('badge2fa').className = 'badge badge-active';
    }

    $('lastPwChange').textContent = p.updated_at ? fmtDate(p.updated_at) : '--';

    if (!$('profileForm')._bound) {
      $('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!state.profile) return;
        // P2 FIX: Allow editing more profile fields
        var updates = {
          phone: $('profPhone').value.trim()
        };
        // Only include notification preferences if element exists
        if ($('profNotifChannel')) {
          updates.preferred_notification_channel = $('profNotifChannel').value;
        }
        sbPatch('users', 'id=eq.' + state.profile.id, updates).then(function () {
          showMsg('profileMessage', 'Profilo aggiornato con successo', 'success');
          toast('Profilo salvato', 'success');
          // Update local state
          Object.assign(state.profile, updates);
        }).catch(function () {
          showMsg('profileMessage', 'Errore nel salvataggio', 'error');
        });
      });

      $('changePasswordBtn').addEventListener('click', function () {
        $('pwChangeOverlay').hidden = false;
      });

      $('viewSessionsBtn').addEventListener('click', function () {
        openModal('Sessioni Attive',
          '<div style="text-align:center;padding:1rem"><p style="color:var(--text-secondary)">Sessione corrente attiva da:</p>' +
          '<p style="font-size:1.2rem;font-weight:700;margin:0.5rem 0">' + (state.user ? fmtDateTime(state.user.last_sign_in_at || state.user.created_at) : '--') + '</p>' +
          '<p style="font-size:0.85rem;color:var(--text-muted)">Per disconnettere tutte le sessioni, usa il pulsante Esci.</p></div>',
          '<button class="btn btn-outline" onclick="window._closeModal()">Chiudi</button>' +
          '<button class="btn btn-danger btn-sm" onclick="window._logoutAll()">Disconnetti Tutto</button>');
      });

      $('profileForm')._bound = true;
    }
  }

  window._logoutAll = function () {
    closeModal();
    logout();
  };

  // ── UPLOAD REPORTS (Lab) ── Multi-file ──────────────
  var uploadFiles = [];

  function initUploadPage() {
    var dropZone = $('dropZone');
    var fileInput = $('fileInput');

    if (!dropZone._bound) {
      $('browseBtn').addEventListener('click', function () { fileInput.click(); });

      fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          addFiles(Array.from(this.files));
        }
      });

      ['dragenter', 'dragover'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
      });
      dropZone.addEventListener('drop', function (e) {
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
          addFiles(Array.from(files));
        }
      });

      $('uploadFiscal').addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
      });

      $('lookupPatient').addEventListener('click', lookupPatient);
      $('uploadForm').addEventListener('submit', handleUpload);
      $('uploadSampleDate').valueAsDate = new Date();

      // ── Filter Tipo Esame options by selected Categoria ──
      (function initCategoryFilter() {
        var catSel = $('uploadCategory');
        var typeSel = $('uploadType');
        if (!catSel || !typeSel) return;
        // Store all original options
        var allOpts = Array.from(typeSel.options).map(function (o) {
          return { value: o.value, text: o.textContent, cat: o.getAttribute('data-cat') || '' };
        });
        function filterTypes() {
          var cat = catSel.value;
          typeSel.innerHTML = '';
          allOpts.forEach(function (o) {
            if (!o.value) { typeSel.appendChild(new Option(o.text, '')); return; } // "Seleziona..."
            if (o.value === 'altro') { return; } // append at end
            if (!o.cat || o.cat === cat) {
              typeSel.appendChild(new Option(o.text, o.value));
            }
          });
          // Always add "Altro" at the end
          typeSel.appendChild(new Option('Altro', 'altro'));
        }
        catSel.addEventListener('change', function () { filterTypes(); typeSel.value = ''; });
        filterTypes(); // initial filter
      })();

      // "Registra Paziente" button from upload page
      $('invitePatientFromUpload').addEventListener('click', function () {
        var fc = $('uploadFiscal').value.trim().toUpperCase();
        // Open invite modal pre-filled for patient creation
        $('inviteOverlay').hidden = false;
        $('inviteForm').reset();
        $('inviteMessage').textContent = '';
        $('invPassword').value = genPassword(16);
        $('invRole').value = 'patient';
        $('invRole').disabled = true;
        $('invFiscal').value = fc;
        togglePatientFields();

        // Pre-compilare con dati GIPO se disponibili
        if (state._gipoData) {
          var g = state._gipoData;
          if (g.first_name) $('invFirstName').value = g.first_name;
          if (g.last_name) $('invLastName').value = g.last_name;
          if (g.email) $('invEmail').value = g.email;
          if (g.phone && $('invPhone')) $('invPhone').value = g.phone;
          if (g.date_of_birth && $('invDob')) $('invDob').value = g.date_of_birth;
          if (g.gender && $('invGender')) $('invGender').value = g.gender;
        }

        // Set a flag so that after creation we return to upload and re-search
        state._inviteFromUpload = true;
        state._inviteFromUploadFC = fc;
      });

      dropZone._bound = true;
    }

    loadRecentUploads();
  }

  function addFiles(files) {
    var rejected = 0;
    files.forEach(function (file) {
      if (file.type !== 'application/pdf') {
        rejected++;
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast('File "' + file.name + '" troppo grande (max 25 MB)', 'error');
        return;
      }
      // Avoid duplicates by name+size
      var isDup = uploadFiles.some(function (f) {
        return f.name === file.name && f.size === file.size;
      });
      if (!isDup) {
        uploadFiles.push(file);
      }
    });
    if (rejected > 0) toast(rejected + ' file ignorat' + (rejected === 1 ? 'o' : 'i') + ' (solo PDF)', 'error');
    renderFileList();
    // Reset input so same file can be re-selected
    $('fileInput').value = '';
  }

  function removeFileAtIndex(idx) {
    uploadFiles.splice(idx, 1);
    renderFileList();
  }

  function renderFileList() {
    var listEl = $('uploadFileList');
    var contentEl = $('dropZoneContent');
    if (uploadFiles.length === 0) {
      listEl.hidden = true;
      listEl.innerHTML = '';
      if (contentEl) contentEl.style.display = '';
      return;
    }
    if (contentEl) contentEl.style.display = 'none';
    listEl.hidden = false;

    var totalSize = 0;
    var html = '';
    uploadFiles.forEach(function (f, i) {
      totalSize += f.size;
      html += '<div class="upload-file-item" id="fileItem' + i + '">'
        + '<svg class="file-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
        + '<div class="file-info">'
        + '<span class="file-name" title="' + f.name.replace(/"/g, '&quot;') + '">' + f.name + '</span>'
        + '<span class="file-meta">' + fmtSize(f.size) + '</span>'
        + '</div>'
        + '<span class="file-status status-waiting" id="fileStatus' + i + '">In attesa</span>'
        + '<button type="button" class="file-remove" data-idx="' + i + '" aria-label="Rimuovi">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        + '</button>'
        + '</div>';
    });
    html += '<div class="upload-file-count">'
      + '<strong>' + uploadFiles.length + '</strong> file selezionat' + (uploadFiles.length === 1 ? 'o' : 'i')
      + ' &middot; ' + fmtSize(totalSize) + ' totale'
      + '</div>';
    listEl.innerHTML = html;

    // Bind remove buttons
    listEl.querySelectorAll('.file-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFileAtIndex(parseInt(this.getAttribute('data-idx'), 10));
      });
    });
  }

  function lookupPatient() {
    var fc = $('uploadFiscal').value.trim().toUpperCase();
    if (fc.length !== 16) {
      $('uploadFiscal-error').textContent = 'Il codice fiscale deve essere di 16 caratteri';
      $('invitePatientFromUpload').hidden = true;
      return;
    }
    $('uploadFiscal-error').textContent = '';
    $('patientFound').hidden = true;
    $('invitePatientFromUpload').hidden = true;
    state._gipoData = null;

    // Step 1: cerca in "users" (paziente già registrato nel portale referti)
    fetch('/api/admin/users/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ fiscal_code: fc })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.success && res.data) {
        // Trovato in users — paziente già registrato
        var p = res.data;
        $('patientFoundName').textContent = p.first_name + ' ' + p.last_name + ' (' + p.email + ')';
        $('patientFound').hidden = false;
        $('patientFound').dataset.patientId = p.id;
        $('invitePatientFromUpload').hidden = true;
      } else {
        // Step 2: non in users — cerca nell'anagrafica GIPO
        lookupGipoPatient(fc);
      }
    }).catch(function () {
      $('uploadFiscal-error').textContent = 'Errore nella ricerca';
      $('invitePatientFromUpload').hidden = true;
    });
  }

  // Cerca il CF nell'anagrafica GIPO per pre-compilare il form di creazione
  function lookupGipoPatient(fc) {
    fetch('/api/admin/gipo/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ fiscal_code: fc })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.success && res.data) {
        // Trovato in GIPO — mostra messaggio e prepara i dati per pre-compilazione
        var g = res.data;
        state._gipoData = g;
        $('uploadFiscal-error').textContent = '';
        var infoText = 'Trovato in GIPO: ' + esc(g.first_name) + ' ' + esc(g.last_name);
        if (g.email) infoText += ' (' + esc(g.email) + ')';
        infoText += ' — Clicca "Registra Paziente" per creare l\'account (dati pre-compilati)';
        $('uploadFiscal-error').textContent = infoText;
        $('uploadFiscal-error').style.color = '#00704A';
        $('invitePatientFromUpload').hidden = false;
        $('invitePatientFromUpload').textContent = 'Registra Paziente (dati GIPO)';
      } else {
        // Non trovato neanche in GIPO
        state._gipoData = null;
        $('uploadFiscal-error').textContent = 'Paziente non trovato nel sistema';
        $('uploadFiscal-error').style.color = '';
        $('invitePatientFromUpload').hidden = false;
        $('invitePatientFromUpload').textContent = 'Registra Paziente';
      }
    }).catch(function () {
      // GIPO lookup fallita — mostra comunque il pulsante registra
      state._gipoData = null;
      $('uploadFiscal-error').textContent = 'Paziente non trovato nel sistema';
      $('uploadFiscal-error').style.color = '';
      $('invitePatientFromUpload').hidden = false;
      $('invitePatientFromUpload').textContent = 'Registra Paziente';
    });
  }

  // Compute SHA-256 hash of a File using Web Crypto API
  function computeSHA256(file) {
    return file.arrayBuffer().then(function (buffer) {
      return crypto.subtle.digest('SHA-256', buffer);
    }).then(function (hashBuffer) {
      var bytes = new Uint8Array(hashBuffer);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    });
  }

  function handleUpload(e) {
    e.preventDefault();
    $('uploadMessage').textContent = '';
    $('uploadMessage').className = 'form-message';

    var patientId = $('patientFound').dataset.patientId;
    if (!patientId) {
      showMsg('uploadMessage', 'Cerca e seleziona un paziente prima', 'error');
      return;
    }
    if (uploadFiles.length === 0) {
      showMsg('uploadMessage', 'Seleziona almeno un file PDF', 'error');
      return;
    }
    if (!$('uploadType').value) {
      showMsg('uploadMessage', 'Seleziona il tipo di esame', 'error');
      return;
    }

    $('uploadSubmit').disabled = true;
    $('uploadProgress').hidden = false;
    // Disable remove buttons during upload
    document.querySelectorAll('.file-remove').forEach(function (b) { b.disabled = true; b.style.opacity = '0.3'; });

    var total = uploadFiles.length;
    var completed = 0;
    var failed = 0;
    var reportNumbers = [];

    function updateOverallProgress() {
      var pct = Math.round(((completed + failed) / total) * 100);
      $('progressFill').style.width = pct + '%';
      $('progressText').textContent = pct + '%';
      $('progressLabel').textContent = 'Caricamento ' + (completed + failed) + ' di ' + total + '...';
    }

    function setFileStatus(idx, status, text) {
      var el = $('fileStatus' + idx);
      var item = $('fileItem' + idx);
      if (el) {
        el.className = 'file-status status-' + status;
        el.textContent = text;
      }
      if (item) {
        item.classList.remove('uploading', 'done', 'error');
        if (status === 'uploading') item.classList.add('uploading');
        if (status === 'done') item.classList.add('done');
        if (status === 'error') item.classList.add('error');
      }
    }

    function uploadSingleFile(idx) {
      if (idx >= total) {
        // All done
        finishMultiUpload(completed, failed, reportNumbers);
        return;
      }

      var file = uploadFiles[idx];
      setFileStatus(idx, 'uploading', 'Caricamento...');
      updateOverallProgress();

      computeSHA256(file).then(function (checksum) {
        var reportData = {
          patient_id: patientId,
          patient_fiscal_code: $('uploadFiscal').value.trim().toUpperCase(),
          report_type: $('uploadType').value,
          category: $('uploadCategory').value,
          department: 'laboratorio',
          sample_date: $('uploadSampleDate').value,
          is_urgent: $('uploadUrgent').checked,
          has_abnormal_values: $('uploadAbnormal').checked,
          status: 'pending',
          uploaded_by: state.profile ? state.profile.id : null
        };

        return sbPost('reports', reportData).then(function (reports) {
          if (!reports || reports.length === 0) throw new Error('Failed to create report');
          var report = Array.isArray(reports) ? reports[0] : reports;

          var path = patientId + '/' + report.id + '/' + file.name;
          return fetch(SB_URL + '/storage/v1/object/referti/' + path, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': 'Bearer ' + state.token,
              'Content-Type': file.type,
              'x-upsert': 'true'
            },
            body: file
          }).then(function (r) {
            if (!r.ok) throw new Error('Upload storage failed: ' + r.status);
            return r.json().then(function () {
              return sbPost('report_files', {
                report_id: report.id,
                storage_path: path,
                storage_bucket: 'referti',
                original_name: file.name,
                mime_type: 'application/pdf',
                file_size_bytes: file.size,
                checksum_sha256: checksum,
                is_encrypted: false,
                is_primary: true,
                file_type: 'report_pdf',
                uploaded_by: state.profile ? state.profile.id : null
              });
            });
          }).then(function () {
            completed++;
            reportNumbers.push(report.report_number || report.id);
            setFileStatus(idx, 'done', 'Caricato');
            updateOverallProgress();
            // Next file
            uploadSingleFile(idx + 1);
          });
        });
      }).catch(function (err) {
        failed++;
        setFileStatus(idx, 'error', 'Errore');
        console.error('[Upload] File ' + file.name + ' error:', err);
        updateOverallProgress();
        // Continue with next file
        uploadSingleFile(idx + 1);
      });
    }

    // Start sequential upload
    uploadSingleFile(0);
  }

  function finishMultiUpload(completed, failed, reportNumbers) {
    setTimeout(function () {
      $('uploadSubmit').disabled = false;
      $('uploadProgress').hidden = true;
      $('progressFill').style.width = '0%';

      if (completed > 0 && failed === 0) {
        showMsg('uploadMessage', completed + ' refert' + (completed === 1 ? 'o caricato' : 'i caricati') + ' con successo!', 'success');
        toast(completed + ' refert' + (completed === 1 ? 'o caricato' : 'i caricati'), 'success');
      } else if (completed > 0 && failed > 0) {
        showMsg('uploadMessage', completed + ' caricato/i, ' + failed + ' fallito/i. Riprova per i file non riusciti.', 'error');
        toast(completed + ' ok, ' + failed + ' errore', 'error');
      } else {
        showMsg('uploadMessage', 'Tutti i caricamenti sono falliti. Riprova.', 'error');
        toast('Errore caricamento', 'error');
      }

      // Only reset form if ALL succeeded
      if (failed === 0) {
        $('uploadForm').reset();
        uploadFiles = [];
        $('uploadFileList').hidden = true;
        $('uploadFileList').innerHTML = '';
        var contentEl = $('dropZoneContent');
        if (contentEl) contentEl.style.display = '';
        $('patientFound').hidden = true;
        $('uploadSampleDate').valueAsDate = new Date();
      } else {
        // Keep failed files, remove succeeded ones
        var newFiles = [];
        uploadFiles.forEach(function (f, i) {
          var statusEl = $('fileStatus' + i);
          if (statusEl && statusEl.textContent !== 'Caricato') {
            newFiles.push(f);
          }
        });
        uploadFiles = newFiles;
        renderFileList();
        // Re-enable remove buttons
        document.querySelectorAll('.file-remove').forEach(function (b) { b.disabled = false; b.style.opacity = ''; });
      }

      loadRecentUploads();
    }, 400);
  }

  function animateProgress(from, to, duration) {
    var fill = $('progressFill');
    var text = $('progressText');
    var start = performance.now();
    function step(ts) {
      var p = Math.min((ts - start) / duration, 1);
      var val = Math.round(from + (to - from) * p);
      fill.style.width = val + '%';
      text.textContent = val + '%';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ██  BULK UPLOAD — Upload Massivo con estrazione automatica CF da PDF  ██
  // ══════════════════════════════════════════════════════════════════════════

  var bulkFiles = [];   // Array of { file: File, cf: string|null, pdfName: string|null, pdfDate: string|null, pdfType: string|null, lookupResult: object|null }
  var _bulkBound = false;

  function initBulkUpload() {
    var dropZone = $('bulkDropZone');
    var fileInput = $('bulkFileInput');
    if (!dropZone || !fileInput) return;

    if (!_bulkBound) {
      $('bulkBrowseBtn').addEventListener('click', function () { fileInput.click(); });

      fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          bulkAddFiles(Array.from(this.files));
          this.value = '';
        }
      });

      ['dragenter', 'dragover'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
      });
      dropZone.addEventListener('drop', function (e) {
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
          bulkAddFiles(Array.from(files));
        }
      });

      $('bulkSelectAll').addEventListener('change', function () {
        var checked = this.checked;
        document.querySelectorAll('.bulk-row-check').forEach(function (cb) {
          if (!cb.disabled) cb.checked = checked;
        });
        bulkUpdateUploadBtn();
      });

      $('bulkUploadBtn').addEventListener('click', bulkStartUpload);
      $('bulkClearBtn').addEventListener('click', function () {
        bulkFiles = [];
        $('bulkPreviewCard').hidden = true;
        $('bulkResultCard').hidden = true;
        $('bulkMessage').textContent = '';
        $('bulkDropContent').style.display = '';
      });

      _bulkBound = true;
    }

    // Reset state
    $('bulkPreviewCard').hidden = true;
    $('bulkResultCard').hidden = true;
    $('bulkMessage').textContent = '';
  }

  function bulkAddFiles(newFiles) {
    var pdfs = newFiles.filter(function (f) { return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'); });
    if (pdfs.length === 0) { toast('Seleziona solo file PDF', 'error'); return; }

    // Dedup
    pdfs.forEach(function (f) {
      var exists = bulkFiles.some(function (bf) { return bf.file.name === f.name && bf.file.size === f.size; });
      if (!exists && bulkFiles.length < 50) {
        bulkFiles.push({ file: f, cf: null, pdfName: null, pdfDate: null, pdfType: null, lookupResult: null });
      }
    });

    if (bulkFiles.length >= 50) toast('Limite: max 50 file per batch', 'error');
    bulkParsePDFs();
  }

  // ── PDF Parsing with pdf.js (browser-side) ──────────────────────────────
  function bulkParsePDFs() {
    var total = bulkFiles.length;
    var parsed = 0;
    $('bulkParsingProgress').hidden = false;
    $('bulkParsingLabel').textContent = 'Analisi PDF in corso...';
    $('bulkParsingPct').textContent = '0%';
    $('bulkParsingFill').style.width = '0%';

    var cfRegex = /[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/;
    // Date regexes: try "Data prelievo: dd/mm/yy" on same line first
    var dateRegex1 = /Data\s*(?:prelievo|Prelievo)[:\s]*(\d{2}\/\d{2}\/\d{2,4})/i;
    // Generic: any date dd/mm/yy or dd/mm/yyyy
    var dateRegexAll = /\d{2}\/\d{2}\/\d{2,4}/g;

    // Known exam type keywords to detect from PDF text
    var examKeywords = [
      { key: 'emocromo', re: /EMOCROMO/i },
      { key: 'biochimica_clinica', re: /BIOCHIMICA\s*CLINICA/i },
      { key: 'profilo_lipidico', re: /PROFILO\s*LIPIDICO|COLESTEROLO\s*TOTALE|TRIGLICERIDI/i },
      { key: 'profilo_tiroideo', re: /TIROIDE|TSH|FT3|FT4|PROFILO\s*TIROIDEO/i },
      { key: 'glicemia', re: /GLICEMIA|EMOGLOBINA\s*GLICATA|HBA1C/i },
      { key: 'esame_urine', re: /ESAME\s*URINE|URINE\s*COMPLETO/i },
      { key: 'profilo_epatico', re: /PROFILO\s*EPATICO|TRANSAMINASI|GOT|GPT|AST|ALT/i },
      { key: 'profilo_renale', re: /PROFILO\s*RENALE|CREATININA|AZOTEMIA/i },
      { key: 'coagulazione', re: /COAGULAZIONE|PT|INR|PTT|FIBRINOGENO/i },
      { key: 'sierologia', re: /SIEROLOGIA|SIEROLOGICO/i },
      { key: 'siero', re: /SIERO\b/i },
      { key: 'sieroimmunologia', re: /SIEROIMMUNOLOGIA|IMMUNOGLOBULINE/i },
      { key: 'allergologia', re: /ALLERGOLOG|IGE\s*SPECIFICHE|RAST|PRICK/i },
      { key: 'ematologia', re: /EMATOLOGIA/i },
      { key: 'bhcg', re: /BHCG|BETA\s*HCG|B-HCG/i },
      { key: 'tossicologia', re: /TOSSICOLOG|DROGHE|STUPEFACENTI/i },
      { key: 'markers_tumorali', re: /MARKER|CEA|CA\s*125|CA\s*19|PSA|AFP/i },
      { key: 'gastropanel', re: /GASTROPANEL|PEPSINOGENO|GASTRINA/i },
      { key: 'disbiosi_intestinale', re: /DISBIOSI|MICROBIOTA/i },
      { key: 'medicina_lavoro', re: /MEDICINA\s*(?:DEL\s*)?LAVORO/i },
      { key: 'alex_test', re: /ALEX\s*TEST/i },
      { key: 'breath_test_lattosio', re: /BREATH\s*TEST\s*LATTOSIO/i },
      { key: 'urea_breath_test', re: /UREA\s*BREATH/i },
      { key: 'curva_da_carico', re: /CURVA\s*(?:DA\s*)?CARICO|OGTT/i },
      { key: 'microbiologia', re: /MICROBIOLOGIA|URINOCOLTURA|TAMPONE|ANTIBIOGRAMMA/i }
    ];

    var promises = bulkFiles.map(function (entry, idx) {
      if (entry.cf) { parsed++; return Promise.resolve(); } // already parsed
      return parseSinglePDF(entry.file).then(function (result) {
        entry.cf = result.cf;
        entry.pdfName = result.name;
        entry.pdfDate = result.date;
        entry.pdfType = result.type;
        parsed++;
        var pct = Math.round((parsed / total) * 100);
        $('bulkParsingPct').textContent = pct + '%';
        $('bulkParsingFill').style.width = pct + '%';
        $('bulkParsingLabel').textContent = 'Analisi ' + parsed + ' di ' + total + '...';
      }).catch(function (err) {
        console.warn('[BulkParse] Error parsing ' + entry.file.name, err);
        parsed++;
      });
    });

    function parseSinglePDF(file) {
      return file.arrayBuffer().then(function (buffer) {
        return pdfjsLib.getDocument({ data: buffer }).promise;
      }).then(function (pdf) {
        return pdf.getPage(1).then(function (page) {
          return page.getTextContent();
        }).then(function (content) {
          var text = content.items.map(function (i) { return i.str; }).join(' ');
          var textUpper = text.toUpperCase();

          // Extract CF
          var cfMatch = textUpper.match(cfRegex);
          var cf = cfMatch ? cfMatch[0] : null;

          // Extract patient name (typically after clinic header, before metadata)
          var name = null;
          var lines = text.split(/\n|\r/).filter(function(l) { return l.trim(); });
          // Try to find name near "Sig." or "Paziente:" or after clinic header
          for (var li = 0; li < Math.min(lines.length, 15); li++) {
            var line = lines[li].trim();
            if (/^(Sig\.|Sig\.ra|Paziente|Spett\.le)\s*/i.test(line)) {
              name = line.replace(/^(Sig\.|Sig\.ra|Paziente|Spett\.le)\s*/i, '').trim();
              break;
            }
          }
          // Fallback: use text items to find name pattern (ALL CAPS, near top)
          if (!name) {
            var items = content.items;
            for (var ii = 0; ii < Math.min(items.length, 30); ii++) {
              var s = items[ii].str.trim();
              // Look for all-caps name that isn't the clinic or address
              if (s.length > 5 && /^[A-Z\s]+$/.test(s) && !/CENTRO|MEDICO|POLISPECIALISTICO|SASSARI|VIA|TEL|FAX|EMAIL|LABORATORIO|ANALISI/i.test(s)) {
                name = s;
                break;
              }
            }
          }

          // Extract sample date (Data prelievo)
          // Strategy: In Bio-Clinic PDFs, header labels (Data prelievo, Data di nascita,
          // Sesso, CF) appear grouped, then values follow in the same order.
          // The first date after the labels block = Data prelievo,
          // the second date = Data di nascita.
          var dateStr = null;
          var dm1 = text.match(dateRegex1);
          if (dm1) {
            // "Data prelievo" immediately followed by a date on the same line
            dateStr = dm1[1];
          } else {
            // Positional approach: find all dates, pick the one that is NOT Data nascita.
            // Look for the labels block boundary — dates appear after "Medico" or after CF.
            var allDates = [];
            var dmAll;
            while ((dmAll = dateRegexAll.exec(text)) !== null) {
              allDates.push({ val: dmAll[0], pos: dmAll.index });
            }
            if (allDates.length >= 2) {
              // First date = Data prelievo, second date = Data di nascita
              dateStr = allDates[0].val;
            } else if (allDates.length === 1) {
              // Only one date found — check context to decide
              var dateCtx = text.substring(Math.max(0, allDates[0].pos - 30), allDates[0].pos);
              if (!/nascita/i.test(dateCtx)) {
                dateStr = allDates[0].val;
              }
            }
          }
          // Convert to ISO: dd/mm/yy or dd/mm/yyyy → yyyy-mm-dd
          var isoDate = null;
          if (dateStr) {
            var parts = dateStr.split('/');
            if (parts.length === 3) {
              var dd = parts[0], mm = parts[1], yy = parts[2];
              if (yy.length === 2) yy = (parseInt(yy) > 50 ? '19' : '20') + yy;
              isoDate = yy + '-' + mm + '-' + dd;
            }
          }

          // Detect exam type
          var detectedType = null;
          for (var ek = 0; ek < examKeywords.length; ek++) {
            if (examKeywords[ek].re.test(textUpper)) {
              detectedType = examKeywords[ek].key;
              break;
            }
          }

          return { cf: cf, name: name, date: isoDate, type: detectedType };
        });
      });
    }

    Promise.all(promises).then(function () {
      $('bulkParsingProgress').hidden = true;
      bulkLookupPatients();
    });
  }

  // ── Batch Patient Lookup ──────────────────────────────────────────────────
  function bulkLookupPatients() {
    var codes = [];
    bulkFiles.forEach(function (entry) {
      if (entry.cf && codes.indexOf(entry.cf) === -1) codes.push(entry.cf);
    });

    if (codes.length === 0) {
      bulkRenderPreview();
      return;
    }

    fetch('/api/admin/users/batch-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ fiscal_codes: codes })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.success && res.results) {
        bulkFiles.forEach(function (entry) {
          if (entry.cf && res.results[entry.cf]) {
            entry.lookupResult = res.results[entry.cf];
          }
        });
      }
      bulkRenderPreview();
    }).catch(function (err) {
      console.error('[BulkLookup] Error:', err);
      toast('Errore nella ricerca pazienti', 'error');
      bulkRenderPreview();
    });
  }

  // ── Render Preview Table ──────────────────────────────────────────────────
  function bulkRenderPreview() {
    var tbody = $('bulkPreviewBody');
    tbody.innerHTML = '';

    var statsOk = 0, statsGipo = 0, statsNotFound = 0, statsNoCF = 0;

    bulkFiles.forEach(function (entry, idx) {
      var tr = document.createElement('tr');
      tr.id = 'bulkRow' + idx;

      var source = entry.lookupResult ? entry.lookupResult.source : null;
      var pData = (entry.lookupResult && entry.lookupResult.data) ? entry.lookupResult.data : null;

      var statusBadge = '';
      var statusClass = '';
      var canUpload = false;
      var patientName = entry.pdfName || '—';

      if (!entry.cf) {
        statusBadge = '<span class="badge" style="background:#ef4444;color:#fff">CF non estratto</span>';
        statusClass = 'bulk-no-cf';
        statsNoCF++;
      } else if (source === 'users') {
        statusBadge = '<span class="badge" style="background:#22c55e;color:#fff">Profilo esistente</span>';
        statusClass = 'bulk-ok';
        patientName = pData ? esc(pData.first_name + ' ' + pData.last_name) : patientName;
        canUpload = true;
        statsOk++;
      } else if (source === 'gipo') {
        statusBadge = '<span class="badge" style="background:#3b82f6;color:#fff">Da GIPO (auto-crea profilo)</span>';
        statusClass = 'bulk-gipo';
        patientName = pData ? esc(pData.first_name + ' ' + pData.last_name) : patientName;
        canUpload = true;
        statsGipo++;
      } else {
        // CF present but patient not found — show as actionable
        statusBadge = '<span class="badge" style="background:#f59e0b;color:#000">Non trovato — Registra</span>';
        statusClass = 'bulk-notfound';
        statsNotFound++;
      }
      // Mark already uploaded files
      if (entry._uploaded) {
        statusBadge = '<span class="badge" style="background:#22c55e;color:#fff">Caricato</span>';
        statusClass = 'bulk-done';
        canUpload = false;
      }

      var examType = entry.pdfType || ($('bulkDefaultType').value || 'altro');
      var examLabel = examType.replace(/_/g, ' ');
      // Capitalize first letter
      examLabel = examLabel.charAt(0).toUpperCase() + examLabel.slice(1);

      tr.className = statusClass;

      // Build action cell content
      var actionHtml = '';
      if (entry._uploaded) {
        actionHtml = '<small style="color:#22c55e">Completato</small>';
      } else if (!entry.cf) {
        actionHtml = '<button class="btn btn-primary btn-xs bulk-manual-cf" data-idx="' + idx + '" style="font-weight:600;padding:4px 12px">Inserisci CF</button>';
      } else if (source === 'not_found') {
        actionHtml = '<button class="btn btn-primary btn-xs bulk-create-patient" data-idx="' + idx + '" style="font-weight:600;padding:4px 12px">Registra Paziente</button>';
      } else if (source === 'gipo') {
        actionHtml = '<small style="color:#3b82f6">Auto-crea al caricamento</small>';
      } else if (source === 'users') {
        actionHtml = '<small style="color:#22c55e">Pronto</small>';
      }

      tr.innerHTML = ''
        + '<td><input type="checkbox" class="bulk-row-check" data-idx="' + idx + '" ' + (canUpload ? 'checked' : (entry._uploaded ? '' : 'disabled')) + '></td>'
        + '<td title="' + esc(entry.file.name) + '">' + esc(entry.file.name.length > 20 ? entry.file.name.substring(0, 17) + '...' : entry.file.name) + '</td>'
        + '<td><code style="font-size:0.8rem">' + (entry.cf ? esc(entry.cf) : '<em>—</em>') + '</code></td>'
        + '<td>' + patientName + (pData && pData.email ? '<br><small style="color:var(--text-secondary)">' + esc(pData.email) + '</small>' : '') + '</td>'
        + '<td>' + esc(examLabel) + '</td>'
        + '<td>' + (entry.pdfDate || '—') + '</td>'
        + '<td>' + statusBadge + '</td>'
        + '<td style="white-space:nowrap">' + actionHtml + '</td>';

      tbody.appendChild(tr);
    });

    // Stats bar
    $('bulkStats').innerHTML = ''
      + '<span style="padding:4px 10px;border-radius:8px;background:#dcfce7;color:#166534;font-size:0.85rem;font-weight:500">' + statsOk + ' pronti</span>'
      + (statsGipo > 0 ? '<span style="padding:4px 10px;border-radius:8px;background:#dbeafe;color:#1e40af;font-size:0.85rem;font-weight:500">' + statsGipo + ' da GIPO (auto-crea)</span>' : '')
      + (statsNotFound > 0 ? '<span style="padding:4px 10px;border-radius:8px;background:#fef3c7;color:#92400e;font-size:0.85rem;font-weight:500">' + statsNotFound + ' non trovati</span>' : '')
      + (statsNoCF > 0 ? '<span style="padding:4px 10px;border-radius:8px;background:#fee2e2;color:#991b1b;font-size:0.85rem;font-weight:500">' + statsNoCF + ' CF non estratto</span>' : '');

    // Bind events
    tbody.querySelectorAll('.bulk-row-check').forEach(function (cb) {
      cb.addEventListener('change', bulkUpdateUploadBtn);
    });
    tbody.querySelectorAll('.bulk-manual-cf').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.dataset.idx);
        var cf = prompt('Inserisci il Codice Fiscale per: ' + bulkFiles[i].file.name);
        if (cf && cf.trim().length === 16) {
          bulkFiles[i].cf = cf.trim().toUpperCase();
          // Re-run lookup for this single CF
          fetch('/api/admin/users/batch-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
            body: JSON.stringify({ fiscal_codes: [bulkFiles[i].cf] })
          }).then(function (r) { return r.json(); }).then(function (res) {
            if (res.success && res.results && res.results[bulkFiles[i].cf]) {
              bulkFiles[i].lookupResult = res.results[bulkFiles[i].cf];
            }
            bulkRenderPreview();
          });
        }
      });
    });
    tbody.querySelectorAll('.bulk-create-patient').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.dataset.idx);
        var entry = bulkFiles[i];
        // Open the invite modal pre-filled
        $('inviteOverlay').hidden = false;
        $('inviteForm').reset();
        $('inviteMessage').textContent = '';
        $('invPassword').value = genPassword(16);
        $('invRole').value = 'patient';
        $('invRole').disabled = true;
        $('invFiscal').value = entry.cf || '';
        togglePatientFields();
        if (entry.pdfName) {
          var nameParts = entry.pdfName.split(/\s+/);
          if (nameParts.length >= 2) {
            $('invLastName').value = nameParts[0];
            $('invFirstName').value = nameParts.slice(1).join(' ');
          }
        }
        // Set flag to re-lookup after creation
        state._inviteFromBulk = true;
        state._inviteFromBulkIdx = i;
      });
    });

    $('bulkPreviewCard').hidden = false;
    bulkUpdateUploadBtn();
  }

  function bulkUpdateUploadBtn() {
    var checked = document.querySelectorAll('.bulk-row-check:checked').length;
    $('bulkUploadBtn').disabled = checked === 0;
    $('bulkUploadSummary').textContent = checked + ' di ' + bulkFiles.length + ' file selezionati per il caricamento';
  }

  // ── Bulk Upload Execution ──────────────────────────────────────────────────
  function bulkStartUpload() {
    var toUpload = [];
    document.querySelectorAll('.bulk-row-check:checked').forEach(function (cb) {
      toUpload.push(parseInt(cb.dataset.idx));
    });

    if (toUpload.length === 0) return;

    $('bulkUploadBtn').disabled = true;
    $('bulkClearBtn').disabled = true;
    $('bulkUploadProgress').hidden = false;
    $('bulkUploadLabel').textContent = 'Preparazione...';
    $('bulkUploadPct').textContent = '0%';
    $('bulkUploadFill').style.width = '0%';

    var category = $('bulkCategory').value || 'laboratorio';
    var defaultType = $('bulkDefaultType').value;
    var total = toUpload.length;
    var completed = 0;
    var failed = 0;
    var results = [];

    // First: auto-create profiles for GIPO entries
    var gipoToCreate = toUpload.filter(function (idx) {
      return bulkFiles[idx].lookupResult && bulkFiles[idx].lookupResult.source === 'gipo';
    });

    var createChain = Promise.resolve();

    gipoToCreate.forEach(function (idx) {
      createChain = createChain.then(function () {
        return bulkAutoCreatePatient(idx);
      });
    });

    createChain.then(function () {
      $('bulkUploadLabel').textContent = 'Caricamento referti...';
      // Sequential upload
      bulkUploadNext(toUpload, 0, category, defaultType, total, completed, failed, results);
    }).catch(function (err) {
      console.error('[BulkUpload] GIPO create chain error:', err);
      $('bulkUploadLabel').textContent = 'Caricamento referti...';
      bulkUploadNext(toUpload, 0, category, defaultType, total, completed, failed, results);
    });
  }

  function bulkAutoCreatePatient(idx) {
    var entry = bulkFiles[idx];
    if (!entry.lookupResult || entry.lookupResult.source !== 'gipo') return Promise.resolve();
    var g = entry.lookupResult.data;

    // Check we have enough data
    if (!g.email) {
      // No email → can't create account, mark as pending
      entry._createError = 'Email mancante nei dati GIPO';
      return Promise.resolve();
    }

    var password = genPassword(16);
    var reqBody = {
      email: g.email,
      first_name: g.first_name,
      last_name: g.last_name,
      role: 'patient',
      password: password,
      send_invite: true,
      fiscal_code: g.fiscal_code
    };
    if (g.phone) reqBody.phone = g.phone;
    if (g.date_of_birth) reqBody.date_of_birth = g.date_of_birth;
    if (g.gender) reqBody.gender = g.gender;

    return fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify(reqBody)
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.success && data.data && data.data.id) {
        // Update lookup result to "users" so upload works
        entry.lookupResult = {
          source: 'users',
          data: { id: data.data.id, first_name: g.first_name, last_name: g.last_name, email: g.email, fiscal_code: g.fiscal_code }
        };
        entry._autoCreated = true;
        // Update row in table
        var row = $('bulkRow' + idx);
        if (row) {
          var badge = row.querySelector('.badge');
          if (badge) { badge.style.background = '#22c55e'; badge.textContent = 'Profilo creato'; }
        }
      } else {
        entry._createError = data.error || 'Errore creazione profilo';
        console.warn('[BulkUpload] Failed to create patient for ' + g.fiscal_code, data);
      }
    }).catch(function (err) {
      entry._createError = err.message || 'Errore rete';
      console.error('[BulkUpload] Create patient error for ' + g.fiscal_code, err);
    });
  }

  function bulkUploadNext(indices, pos, category, defaultType, total, completed, failed, results) {
    if (pos >= indices.length) {
      bulkFinish(completed, failed, results);
      return;
    }

    var idx = indices[pos];
    var entry = bulkFiles[idx];
    var pct = Math.round(((completed + failed) / total) * 100);
    $('bulkUploadPct').textContent = pct + '%';
    $('bulkUploadFill').style.width = pct + '%';
    $('bulkUploadLabel').textContent = 'Caricamento ' + (completed + failed + 1) + ' di ' + total + '...';

    // Update row status
    var row = $('bulkRow' + idx);
    if (row) row.classList.add('uploading');

    // Check patient ID
    var patientId = null;
    if (entry.lookupResult && entry.lookupResult.source === 'users' && entry.lookupResult.data) {
      patientId = entry.lookupResult.data.id;
    }

    if (!patientId) {
      // Can't upload without patient
      failed++;
      results.push({ file: entry.file.name, success: false, reason: entry._createError || 'Paziente non trovato', _origIdx: idx });
      if (row) { row.classList.remove('uploading'); row.classList.add('error'); }
      bulkUploadNext(indices, pos + 1, category, defaultType, total, completed, failed, results);
      return;
    }

    var examType = entry.pdfType || defaultType || 'altro';
    var sampleDate = entry.pdfDate || new Date().toISOString().slice(0, 10);

    computeSHA256(entry.file).then(function (checksum) {
      var reportData = {
        patient_id: patientId,
        patient_fiscal_code: entry.cf,
        report_type: examType,
        category: category,
        department: 'laboratorio',
        sample_date: sampleDate,
        status: 'pending',
        uploaded_by: state.profile ? state.profile.id : null
      };

      return sbPost('reports', reportData).then(function (reports) {
        if (!reports || reports.length === 0) throw new Error('Failed to create report');
        var report = Array.isArray(reports) ? reports[0] : reports;

        var path = patientId + '/' + report.id + '/' + entry.file.name;
        return fetch(SB_URL + '/storage/v1/object/referti/' + path, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': 'Bearer ' + state.token,
            'Content-Type': entry.file.type || 'application/pdf',
            'x-upsert': 'true'
          },
          body: entry.file
        }).then(function (r) {
          if (!r.ok) throw new Error('Upload storage failed: ' + r.status);
          return r.json().then(function () {
            return sbPost('report_files', {
              report_id: report.id,
              storage_path: path,
              storage_bucket: 'referti',
              original_name: entry.file.name,
              mime_type: 'application/pdf',
              file_size_bytes: entry.file.size,
              checksum_sha256: checksum,
              is_encrypted: false,
              is_primary: true,
              file_type: 'report_pdf',
              uploaded_by: state.profile ? state.profile.id : null
            });
          });
        }).then(function () {
          completed++;
          results.push({ file: entry.file.name, success: true, reportId: report.id, patientName: entry.lookupResult.data.first_name + ' ' + entry.lookupResult.data.last_name, autoCreated: entry._autoCreated || false, _origIdx: idx });
          if (row) { row.classList.remove('uploading'); row.classList.add('done'); var b = row.querySelector('.badge'); if (b) { b.style.background = '#22c55e'; b.textContent = 'Caricato'; } }
          bulkUploadNext(indices, pos + 1, category, defaultType, total, completed, failed, results);
        });
      });
    }).catch(function (err) {
      failed++;
      results.push({ file: entry.file.name, success: false, reason: err.message || 'Errore', _origIdx: idx });
      console.error('[BulkUpload] Error uploading ' + entry.file.name, err);
      if (row) { row.classList.remove('uploading'); row.classList.add('error'); var b = row.querySelector('.badge'); if (b) { b.style.background = '#ef4444'; b.textContent = 'Errore'; } }
      bulkUploadNext(indices, pos + 1, category, defaultType, total, completed, failed, results);
    });
  }

  function bulkFinish(completed, failed, results) {
    $('bulkUploadProgress').hidden = true;
    $('bulkUploadBtn').disabled = false;
    $('bulkClearBtn').disabled = false;

    var autoCreated = results.filter(function (r) { return r.autoCreated; }).length;

    // Build result summary
    var html = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">'
      + '<span style="padding:6px 14px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:600">' + completed + ' caricati</span>'
      + (failed > 0 ? '<span style="padding:6px 14px;border-radius:8px;background:#fee2e2;color:#991b1b;font-weight:600">' + failed + ' errori</span>' : '')
      + (autoCreated > 0 ? '<span style="padding:6px 14px;border-radius:8px;background:#dbeafe;color:#1e40af;font-weight:600">' + autoCreated + ' profili auto-creati da GIPO</span>' : '')
      + '</div>';

    if (results.length > 0) {
      html += '<table class="data-table" style="font-size:0.85rem"><thead><tr><th>File</th><th>Paziente</th><th>Esito</th></tr></thead><tbody>';
      results.forEach(function (r) {
        html += '<tr>'
          + '<td>' + esc(r.file) + '</td>'
          + '<td>' + (r.patientName ? esc(r.patientName) : '—') + '</td>'
          + '<td>' + (r.success
              ? '<span style="color:#22c55e;font-weight:500">Caricato' + (r.autoCreated ? ' (profilo creato)' : '') + '</span>'
              : '<span style="color:#ef4444;font-weight:500">' + esc(r.reason) + '</span>')
          + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    $('bulkResultBody').innerHTML = html;
    $('bulkResultCard').hidden = false;

    if (completed > 0) {
      toast(completed + ' refert' + (completed === 1 ? 'o caricato' : 'i caricati') + (autoCreated > 0 ? ' (' + autoCreated + ' profili creati)' : ''), 'success');
    }
    if (failed > 0 && completed === 0) {
      toast('Tutti i caricamenti falliti', 'error');
    }

    // Mark uploaded files so they show as "Completato" in the preview
    results.forEach(function (r) {
      if (r.success && r._origIdx !== undefined && bulkFiles[r._origIdx]) {
        bulkFiles[r._origIdx]._uploaded = true;
      }
    });

    // Check how many files still need attention
    var pending = bulkFiles.filter(function (e) { return !e._uploaded; });

    if (pending.length > 0) {
      // Re-render preview — uploaded files show as "Completato", pending ones keep their buttons
      setTimeout(function () { bulkRenderPreview(); }, 600);
      showMsg('bulkMessage', pending.length + ' file ancora da completare — usa i pulsanti per inserire il CF o registrare il paziente', '');
    } else {
      // All done — offer to clear
      bulkFiles = [];
      setTimeout(function () {
        $('bulkPreviewCard').hidden = true;
        $('bulkDropContent').style.display = '';
      }, 500);
    }
  }

  // ── End of Bulk Upload ─────────────────────────────────────────────────────

  function loadRecentUploads() {
    var q = 'select=id,report_number,report_type,status,patient_fiscal_code,created_at&order=created_at.desc&limit=8';
    if (state.profile && (state.profile.role === 'lab_technician' || state.profile.role === 'ostetrica')) {
      q += '&uploaded_by=eq.' + state.profile.id;
    }
    sbGet('reports', q).then(function (data) {
      var el = $('recentUploads');
      if (!data || !Array.isArray(data) || data.length === 0) {
        el.innerHTML = '<div class="empty-state small"><p>Nessun caricamento recente</p></div>';
        return;
      }
      el.innerHTML = data.map(function (r) {
        var iconClass = r.status === 'pending' ? 'pending' : 'success';
        var deleteBtn = r.status === 'pending'
          ? '<button class="btn btn-xs btn-delete-report" style="background:#ef4444;color:#fff;border:0;margin-left:6px;padding:2px 7px;font-size:0.7rem;border-radius:4px" onclick="event.stopPropagation();window._deleteReport(\'' + r.id + '\')" title="Elimina referto">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M9 6V4h6v2"/></svg></button>'
          : '';
        return '<div class="upload-item">' +
          '<div class="upload-item-icon ' + iconClass + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>' +
          '<div class="upload-item-info"><span class="upload-item-name">' + esc(r.report_number || r.report_type) + '</span>' +
          '<span class="upload-item-meta">' + esc(r.report_type) + ' &middot; ' + timeAgo(r.created_at) + '</span></div>' +
          '<span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span>' +
          deleteBtn + '</div>';
      }).join('');
    });
  }

  // ── VALIDATION QUEUE (Lab) ───────────────────────
  function loadQueue() {
    var filter = $('filterQueueUrgent').value;

    // Show/hide toggles based on role
    var role = state.profile ? state.profile.role : null;
    var isOsteRole = role === 'ostetrica';
    var isLabRole = role === 'lab_technician';
    var isAdmin = role === 'admin' || role === 'super_admin';

    // Ostetrica toggle: visible for ostetrica + admin
    var showOsteToggle = isOsteRole || isAdmin;
    var osteToggleQ = $('osteFilterQueue');
    if (osteToggleQ && role && !showOsteToggle) {
      osteToggleQ.style.display = 'none';
    }

    // Lab toggle: visible for lab_technician + admin
    var showLabToggle = isLabRole || isAdmin;
    var labToggleQ = $('labFilterQueue');
    if (labToggleQ && role && !showLabToggle) {
      labToggleQ.style.display = 'none';
    }

    var osteFilterOn = showOsteToggle && $('filterOstetricheQueue') && $('filterOstetricheQueue').checked;
    var labFilterOn = showLabToggle && $('filterLabTechQueue') && $('filterLabTechQueue').checked;

    // Resolve IDs for active filters
    var osteIdLookup = osteFilterOn ? fetchOstetricaIds() : Promise.resolve(null);
    var labIdLookup = labFilterOn ? fetchLabTechIds() : Promise.resolve(null);

    Promise.all([osteIdLookup, labIdLookup]).then(function (results) {
      var osteIds = results[0];
      var labIds = results[1];

      // Merge IDs from both active filters
      var allFilterIds = [];
      if (osteIds && osteIds.length > 0) allFilterIds = allFilterIds.concat(osteIds);
      if (labIds && labIds.length > 0) allFilterIds = allFilterIds.concat(labIds);

      var uploadedByFilter = allFilterIds.length > 0
        ? '&uploaded_by=in.(' + allFilterIds.join(',') + ')'
        : '';

      var q = 'status=eq.pending&select=*,patient:patient_id(first_name,last_name)&order=is_urgent.desc,created_at.asc&limit=50';
      if (filter === 'urgent') q += '&is_urgent=eq.true';
      if (filter === 'abnormal') q += '&has_abnormal_values=eq.true';
      q += uploadedByFilter;

      sbGet('reports', q).then(function (data) {
        renderQueue(data);
      });

      // Accurate sidebar badge count (independent of table limit)
      var countFilter = 'status=eq.pending' + uploadedByFilter;
      sbCount('reports', countFilter).then(function (n) {
        updateBadge('badgePending', n);
      });
    });

    if (!$('filterQueueUrgent')._bound) {
      $('filterQueueUrgent').addEventListener('change', loadQueue);
      // Bind ostetrica queue toggle + set default based on role
      if ($('filterOstetricheQueue')) {
        if (isAdmin && !isOsteRole) {
          $('filterOstetricheQueue').checked = false;
        }
        $('filterOstetricheQueue').addEventListener('change', loadQueue);
      }
      // Bind lab tech queue toggle + set default based on role
      if ($('filterLabTechQueue')) {
        if (isAdmin && !isLabRole) {
          $('filterLabTechQueue').checked = false;
        }
        $('filterLabTechQueue').addEventListener('change', loadQueue);
      }
      // Bulk validate visible for ostetrica, lab_technician, admin, super_admin
      $('selectAllQueue').addEventListener('change', function () {
        var checked = this.checked;
        $$('#queueBody input[type="checkbox"]').forEach(function (cb) { cb.checked = checked; });
      });
      $('validateAllBtn').addEventListener('click', bulkValidate);
      $('filterQueueUrgent')._bound = true;
    }
  }

  function renderQueue(data) {
    var body = $('queueBody');
    if (!data || !Array.isArray(data) || data.length === 0) {
      body.innerHTML = '<tr class="table-empty"><td colspan="8"><div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Nessun referto in coda</p><span>Tutti i referti sono stati validati</span></div></td></tr>';
      return;
    }
    body.innerHTML = data.map(function (r) {
      var pName = r.patient ? (r.patient.first_name + ' ' + r.patient.last_name) : (r.patient_fiscal_code || '--');
      var flags = '';
      if (r.is_urgent) flags += '<span class="badge badge-urgent">Urgente</span> ';
      if (r.has_abnormal_values) flags += '<span class="badge badge-abnormal">Anomalo</span>';
      return '<tr>' +
        '<td><input type="checkbox" value="' + r.id + '" class="queue-cb"></td>' +
        '<td><strong>' + esc(r.report_number || '--') + '</strong></td>' +
        '<td>' + esc(pName) + '</td>' +
        '<td>' + esc(r.report_type || '--') + '</td>' +
        '<td>' + fmtDate(r.sample_date) + '</td>' +
        '<td>' + (flags || '--') + '</td>' +
        '<td>' + timeAgo(r.created_at) + '</td>' +
        '<td>' + '<button class="btn btn-primary btn-sm" onclick="window._validateReport(\'' + r.id + '\')">Valida</button> ' +
        (!r.has_abnormal_values
          ? '<button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackReport(\'' + r.id + '\')">Fast-Track</button> '
          : '') +
        '<button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Vedi</button>' +
        ' <button class="btn btn-sm btn-delete-report" style="background:#ef4444;color:#fff;border:0" onclick="window._deleteReport(\'' + r.id + '\')">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>Elimina</button>' +
        '</td></tr>';
    }).join('');
  }

  function bulkValidate() {
    var ids = [];
    $$('#queueBody .queue-cb:checked').forEach(function (cb) { ids.push(cb.value); });
    if (ids.length === 0) { toast('Seleziona almeno un referto', 'warning'); return; }

    var now = new Date().toISOString();
    var validatedBy = state.profile ? state.profile.id : null;
    var promises = ids.map(function (id) {
      return sbPatch('reports', 'id=eq.' + id, { status: 'validated', validated_at: now, validated_by: validatedBy });
    });
    Promise.all(promises).then(function () {
      toast(ids.length + ' referti validati', 'success');
      loadQueue();
    }).catch(function () { toast('Errore nella validazione', 'error'); });
  }

  // ── SIGN & RELEASE (Physician) ───────────────────
  function loadSignRelease() {
    var filter = $('filterSignStatus').value;
    var q = 'select=*,patient:patient_id(first_name,last_name)&order=is_urgent.desc,created_at.asc&limit=50';
    if (filter) {
      q += '&status=eq.' + filter;
    } else {
      q += '&or=(status.eq.validated,status.eq.signed)';
    }

    sbGet('reports', q).then(function (data) {
      renderSignTable(data);
    });
    // Accurate sidebar badge count (independent of table limit)
    sbCount('reports', 'or=(status.eq.validated,status.eq.signed)').then(function (n) {
      updateBadge('badgeSign', n);
    });

    if (!$('filterSignStatus')._bound) {
      $('filterSignStatus').addEventListener('change', loadSignRelease);
      if ($('bulkReleaseBtn')) {
        $('bulkReleaseBtn').addEventListener('click', bulkRelease);
      }
      $('filterSignStatus')._bound = true;
    }
  }

  function renderSignTable(data) {
    var body = $('signBody');
    if (!data || !Array.isArray(data) || data.length === 0) {
      body.innerHTML = '<tr class="table-empty"><td colspan="7"><div class="empty-state"><p>Nessun referto da firmare</p></div></td></tr>';
      return;
    }
    body.innerHTML = data.map(function (r) {
      var pName = r.patient ? (r.patient.first_name + ' ' + r.patient.last_name) : '--';
      var flags = '';
      if (r.is_urgent) flags += '<span class="badge badge-urgent">Urgente</span> ';
      if (r.has_abnormal_values) flags += '<span class="badge badge-abnormal">Anomalo</span>';

      var actions = '';
      if (r.status === 'validated') {
        actions = '<button class="btn btn-primary btn-sm" onclick="window._signReport(\'' + r.id + '\')">Firma</button>';
        if (!r.has_abnormal_values) {
          actions += ' <button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackSign(\'' + r.id + '\')">Firma & Rilascia</button>';
        }
      } else if (r.status === 'signed') {
        actions = '<button class="btn btn-primary btn-sm" onclick="window._releaseReport(\'' + r.id + '\')">Rilascia</button>';
      }
      actions += ' <button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Vedi</button>';

      return '<tr>' +
        '<td><strong>' + esc(r.report_number || '--') + '</strong></td>' +
        '<td>' + esc(pName) + '</td>' +
        '<td>' + esc(r.report_type || '--') + '</td>' +
        '<td><span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '<td>' + fmtDateTime(r.validated_at) + '</td>' +
        '<td>' + (flags || '--') + '</td>' +
        '<td>' + actions + '</td></tr>';
    }).join('');
  }

  // P1-7: Throttled batch processing for bulk operations
  function processBatch(items, batchSize, fn, delayMs) {
    var idx = 0;
    function nextBatch() {
      if (idx >= items.length) return Promise.resolve();
      var batch = items.slice(idx, idx + batchSize);
      idx += batchSize;
      return Promise.all(batch.map(fn)).then(function () {
        if (idx < items.length) {
          return new Promise(function (resolve) {
            setTimeout(function () { resolve(nextBatch()); }, delayMs);
          });
        }
      });
    }
    return nextBatch();
  }

  function bulkRelease() {
    sbGet('reports', 'status=eq.signed&select=id&limit=100').then(function (data) {
      if (!data || data.length === 0) { toast('Nessun referto firmato da rilasciare', 'info'); return; }
      var now = new Date().toISOString();
      var releasedBy = state.profile ? state.profile.id : null;
      openModal('Rilascio Multiplo',
        '<p>Stai per rilasciare <strong>' + data.length + '</strong> referti firmati ai pazienti.</p>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary)">I pazienti riceveranno una notifica.</p>',
        '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button>' +
        '<button class="btn btn-primary" id="confirmBulkRelease">Rilascia Tutti</button>');
      setTimeout(function () {
        var btn = $('confirmBulkRelease');
        if (btn) btn.addEventListener('click', function () {
          btn.disabled = true;
          btn.textContent = 'Elaborazione...';
          var promises = data.map(function (r) {
            return sbPatch('reports', 'id=eq.' + r.id, { status: 'released', released_at: now, released_by: releasedBy });
          });
          Promise.all(promises).then(function () {
            closeModal();
            toast(data.length + ' referti rilasciati ai pazienti', 'success');
            // P1-7 FIX: Throttled email notifications — batch of 5 with 1s delay
            processBatch(data, 5, function (r) { return notifyRelease(r.id); }, 1000);
            loadSignRelease();
          }).catch(function () { toast('Errore nel rilascio', 'error'); });
        });
      }, 50);
    });
  }

  // ── ALL REPORTS (Admin) ──────────────────────────

  // Cache ostetrica user IDs so we don't re-fetch every reload
  var _osteIdsCache = null;
  var _osteIdsFetching = null;

  function fetchOstetricaIds() {
    if (_osteIdsCache) return Promise.resolve(_osteIdsCache);
    if (_osteIdsFetching) return _osteIdsFetching;
    _osteIdsFetching = sbGet('users', 'select=id&role=eq.ostetrica&is_active=eq.true&limit=200')
      .then(function (users) {
        _osteIdsCache = users.map(function (u) { return u.id; });
        _osteIdsFetching = null;
        return _osteIdsCache;
      })
      .catch(function () { _osteIdsFetching = null; return []; });
    return _osteIdsFetching;
  }

  // Cache lab_technician user IDs (same pattern)
  var _labIdsCache = null;
  var _labIdsFetching = null;

  function fetchLabTechIds() {
    if (_labIdsCache) return Promise.resolve(_labIdsCache);
    if (_labIdsFetching) return _labIdsFetching;
    _labIdsFetching = sbGet('users', 'select=id&role=eq.lab_technician&is_active=eq.true&limit=200')
      .then(function (users) {
        _labIdsCache = users.map(function (u) { return u.id; });
        _labIdsFetching = null;
        return _labIdsCache;
      })
      .catch(function () { _labIdsFetching = null; return []; });
    return _labIdsFetching;
  }

  function loadAllReports() {
    var filter = $('filterAllStatus').value;
    var search = $('searchAllReports').value.trim();

    // Show/hide toggles based on role
    var role = state.profile ? state.profile.role : null;
    var isOsteRole = role === 'ostetrica';
    var isLabRole = role === 'lab_technician';
    var isAdmin = role === 'admin' || role === 'super_admin';

    // Ostetrica toggle: visible for ostetrica + admin
    var showOsteToggle = isOsteRole || isAdmin;
    var osteToggle = $('osteFilter');
    if (osteToggle && role && !showOsteToggle) {
      osteToggle.style.display = 'none';
    }

    // Lab toggle: visible for lab_technician + admin
    var showLabToggle = isLabRole || isAdmin;
    var labToggle = $('labFilter');
    if (labToggle && role && !showLabToggle) {
      labToggle.style.display = 'none';
    }

    // Default: ON for own role (filter active), OFF for admin (see all)
    var osteFilterOn = showOsteToggle && $('filterOstetriche') && $('filterOstetriche').checked;
    var labFilterOn = showLabToggle && $('filterLabTech') && $('filterLabTech').checked;

    // Step 1: Resolve user IDs for active filters (uploaded_by)
    var osteIdLookup = osteFilterOn ? fetchOstetricaIds() : Promise.resolve(null);
    var labIdLookup = labFilterOn ? fetchLabTechIds() : Promise.resolve(null);

    Promise.all([osteIdLookup, labIdLookup]).then(function (idResults) {
      var osteIds = idResults[0];
      var labIds = idResults[1];

      // Merge IDs from both active filters
      var allFilterIds = [];
      if (osteIds && osteIds.length > 0) allFilterIds = allFilterIds.concat(osteIds);
      if (labIds && labIds.length > 0) allFilterIds = allFilterIds.concat(labIds);

      // Build query params for /api/admin/reports (uses service key, bypasses RLS)
      var params = '?per_page=100';
      if (filter) params += '&status=' + encodeURIComponent(filter);
      if (search) params += '&search=' + encodeURIComponent(search);
      // For uploaded_by filter, send comma-separated IDs
      if (allFilterIds.length > 0) {
        // The server-side endpoint supports a single uploaded_by; for multiple IDs
        // we pass comma-separated and let the first one take effect,
        // OR we use the same PostgREST-style in filter for backward compat
        params += '&uploaded_by=' + allFilterIds.join(',');
      }

      fetch('/api/admin/reports' + params, {
        headers: { 'Authorization': 'Bearer ' + state.token }
      }).then(function (r) { return r.json(); }).then(function (resp) {
        if (resp.success) {
          renderAllReports(resp.data || []);
          // Update stat cards from server-provided counts
          if (resp.counts) {
            $('statPending').textContent = resp.counts.pending || 0;
            $('statValidated').textContent = resp.counts.validated || 0;
            $('statReleased').textContent = resp.counts.released || 0;
            $('statTotal').textContent = resp.counts.total || 0;
          }
        } else {
          renderAllReports([]);
        }
      }).catch(function () {
        renderAllReports([]);
      });
    });

    if (!$('filterAllStatus')._bound) {
      $('filterAllStatus').addEventListener('change', loadAllReports);
      $('searchAllReports').addEventListener('input', debounce(loadAllReports, 400));
      // Bind ostetrica toggle + set default based on role
      if ($('filterOstetriche')) {
        if (isAdmin && !isOsteRole) {
          $('filterOstetriche').checked = false;
        }
        $('filterOstetriche').addEventListener('change', loadAllReports);
      }
      // Bind lab tech toggle + set default based on role
      if ($('filterLabTech')) {
        if (isAdmin && !isLabRole) {
          $('filterLabTech').checked = false;
        }
        $('filterLabTech').addEventListener('change', loadAllReports);
      }
      $('filterAllStatus')._bound = true;
    }
  }

  function renderAllReports(data) {
    var body = $('allReportsBody');
    if (!data || !Array.isArray(data) || data.length === 0) {
      body.innerHTML = '<tr class="table-empty"><td colspan="8"><div class="empty-state"><p>Nessun referto</p></div></td></tr>';
      return;
    }
    var isAdmin = state.profile && (state.profile.role === 'admin' || state.profile.role === 'super_admin');
    var isOstetrica = state.profile && state.profile.role === 'ostetrica';
    var isPhysician = state.profile && state.profile.role === 'physician';
    var isLabTech = state.profile && state.profile.role === 'lab_technician';
    var isStaff = isAdmin || isOstetrica || isPhysician || isLabTech;
    body.innerHTML = data.map(function (r) {
      var pName = r.patient ? (r.patient.first_name + ' ' + r.patient.last_name) : (r.patient_fiscal_code || '--');
      var flags = '';
      if (r.is_urgent) flags += '<span class="badge badge-urgent">U</span> ';
      if (r.has_abnormal_values) flags += '<span class="badge badge-abnormal">A</span> ';

      // Patient tracking badges (all staff) — P0-2: XSS fix with esc() on all title attributes
      if (r.status === 'released' && isStaff) {
        if (r.patient_notified) flags += '<span class="badge" style="background:#3b82f6;color:#fff;font-size:0.7rem" title="Notificato al paziente ' + esc(r.patient_notified_at ? fmtDateTime(r.patient_notified_at) : '') + '">&#9993;</span> ';
        if (r.patient_viewed) flags += '<span class="badge" style="background:#22c55e;color:#fff;font-size:0.7rem" title="Letto dal paziente ' + esc(r.patient_viewed_at ? fmtDateTime(r.patient_viewed_at) : '') + '">&#10003; Letto</span> ';
        else if (r.patient_notified) flags += '<span class="badge" style="background:#f59e0b;color:#fff;font-size:0.7rem" title="Non ancora letto dal paziente">&#9888; Non letto</span> ';
        if (r.patient_downloaded) flags += '<span class="badge" style="background:#8b5cf6;color:#fff;font-size:0.7rem" title="Scaricato ' + esc(String(r.download_count || 0)) + ' volte">&#8615; ' + esc(String(r.download_count || 0)) + '</span> ';
        // Reminder badge: WhatsApp reminder status for released reports
        if (r.reminder_sent) {
          flags += '<span class="badge" style="background:#0ea5e9;color:#fff;font-size:0.7rem" title="Promemoria WhatsApp inviato ' + esc(r.reminder_sent_at ? fmtDateTime(r.reminder_sent_at) : '') + '">&#128276; Promemoria</span> ';
        } else if (r.patient_notified && !r.patient_viewed) {
          flags += '<span class="badge" style="background:#94a3b8;color:#fff;font-size:0.7rem" title="Promemoria WhatsApp non ancora inviato (parte automaticamente dopo 24h se il referto non viene letto, ore 09-19)">&#128276; No promemoria</span> ';
        }
      }

      var canFastTrack = (isAdmin || isOstetrica || isPhysician) && !r.has_abnormal_values;
      var actions = '<button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Dettagli</button>';
      if (isAdmin) {
        if (r.status === 'pending') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._validateReport(\'' + r.id + '\')">Valida</button>';
          if (canFastTrack) actions += ' <button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackReport(\'' + r.id + '\')">Fast-Track</button>';
        } else if (r.status === 'validated') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._signReport(\'' + r.id + '\')">Firma</button>';
        } else if (r.status === 'signed') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._releaseReport(\'' + r.id + '\')">Rilascia</button>';
        } else if (r.status === 'released') {
          actions += ' <button class="btn btn-sm" style="background:#22c55e;color:#fff;border:0" onclick="window._downloadReport(\'' + r.id + '\')">Scarica</button>';
        }
      }
      if (isOstetrica) {
        if (r.status === 'pending') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._validateReport(\'' + r.id + '\')">Valida</button>';
          if (canFastTrack) actions += ' <button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackReport(\'' + r.id + '\')">Fast-Track</button>';
        } else if (r.status === 'validated') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._signReport(\'' + r.id + '\')">Firma</button>';
        } else if (r.status === 'signed') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._releaseReport(\'' + r.id + '\')">Rilascia</button>';
        }
        if (r.status === 'released') {
          actions += ' <button class="btn btn-sm" style="background:#22c55e;color:#fff;border:0" onclick="window._downloadReport(\'' + r.id + '\')">Scarica</button>';
        }
      }
      if (isPhysician) {
        if (r.status === 'pending' && canFastTrack) {
          actions += ' <button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackReport(\'' + r.id + '\')">Fast-Track</button>';
        }
        if (r.status === 'validated') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._signReport(\'' + r.id + '\')">Firma</button>';
        }
        if (r.status === 'signed') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._releaseReport(\'' + r.id + '\')">Rilascia</button>';
        }
        if (r.status === 'released') {
          actions += ' <button class="btn btn-sm" style="background:#22c55e;color:#fff;border:0" onclick="window._downloadReport(\'' + r.id + '\')">Scarica</button>';
        }
      }

      // Delete button — admin/super_admin can delete ANY status (backend
      // enforces the same rule); other staff roles only pending reports
      if (isAdmin || (r.status === 'pending' && isStaff)) {
        actions += ' <button class="btn btn-sm btn-delete-report" style="background:#ef4444;color:#fff;border:0" onclick="window._deleteReport(\'' + r.id + '\')">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>Elimina</button>';
      }

      return '<tr>' +
        '<td><strong>' + esc(r.report_number || '--') + '</strong></td>' +
        '<td>' + esc(pName) + '</td>' +
        '<td>' + esc(r.report_type || '--') + '</td>' +
        '<td>' + fmtDate(r.sample_date) + '</td>' +
        '<td><span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '<td>' + (flags || '--') + '</td>' +
        '<td>' + timeAgo(r.updated_at || r.created_at) + '</td>' +
        '<td>' + actions + '</td></tr>';
    }).join('');
  }

  // ── USERS (Admin) ────────────────────────────────
  function loadUsers() {
    var filter = $('filterUserRole').value;
    var search = $('searchUsers').value.trim();

    // Use /api/users endpoint (service_role key, bypasses RLS)
    var params = '?per_page=100';
    if (filter) params += '&role=' + filter;
    if (search) params += '&search=' + encodeURIComponent(search);

    fetch('/api/users' + params, {
      headers: { 'Authorization': 'Bearer ' + state.token }
    }).then(function (r) { return r.json(); }).then(function (resp) {
      var data = resp.success ? resp.data : [];
      var body = $('usersBody');
      if (!data || !Array.isArray(data) || data.length === 0) {
        body.innerHTML = '<tr class="table-empty"><td colspan="8"><div class="empty-state"><p>Nessun utente trovato</p></div></td></tr>';
        return;
      }
      body.innerHTML = data.map(function (u) {
        var roleBadge = u.role === 'admin' || u.role === 'super_admin' ? 'signed'
          : u.role === 'physician' ? 'validated'
          : u.role === 'lab_technician' ? 'pending'
          : u.role === 'ostetrica' ? 'validated'
          : 'released';
        return '<tr>' +
          '<td><strong>' + esc(u.first_name + ' ' + u.last_name) + '</strong></td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td><code style="font-size:0.78rem">' + esc(u.fiscal_code || '--') + '</code></td>' +
          '<td><span class="badge badge-' + roleBadge + '">' + roleLabel(u.role, u.email) + '</span></td>' +
          '<td><span class="badge ' + (u.is_active ? 'badge-active' : 'badge-inactive') + '">' + (u.is_active ? 'Attivo' : 'Inattivo') + '</span></td>' +
          '<td>' + (u.totp_enabled ? '<span style="color:#22c55e">&#10003;</span>' : '<span style="color:var(--text-muted)">&#8212;</span>') + '</td>' +
          '<td>' + fmtDate(u.created_at) + '</td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="window._editUser(\'' + u.id + '\')">Modifica</button></td></tr>';
      }).join('');
    });

    if (!$('filterUserRole')._bound) {
      $('filterUserRole').addEventListener('change', loadUsers);
      $('searchUsers').addEventListener('input', debounce(loadUsers, 400));
      $('inviteUserBtn').addEventListener('click', function () {
        $('inviteOverlay').hidden = false;
        $('inviteForm').reset();
        $('inviteMessage').textContent = '';
        $('invPassword').value = genPassword(16);
        // Ostetrica / lab_technician can only create patients — lock role dropdown
        if (state.profile && (state.profile.role === 'ostetrica' || state.profile.role === 'lab_technician')) {
          $('invRole').value = 'patient';
          $('invRole').disabled = true;
        } else {
          $('invRole').disabled = false;
        }
        togglePatientFields();
      });
      $('filterUserRole')._bound = true;
    }
  }

  // ── INVITE USER ──────────────────────────────────
  function togglePatientFields() {
    var isPatient = $('invRole').value === 'patient';
    $('invPatientFields').hidden = !isPatient;
    // Codice Fiscale: obbligatorio per pazienti, facoltativo per staff
    $('invFiscalLabel').textContent = isPatient ? 'Codice Fiscale *' : 'Codice Fiscale';
    if (isPatient) {
      $('invFiscal').setAttribute('required', 'required');
    } else {
      $('invFiscal').removeAttribute('required');
    }
  }

  function initInviteUser() {
    $('inviteClose').addEventListener('click', function () { $('inviteOverlay').hidden = true; state._inviteFromUpload = false; state._inviteFromBulk = false; $('invRole').disabled = false; });
    $('inviteCancelBtn').addEventListener('click', function () { $('inviteOverlay').hidden = true; state._inviteFromUpload = false; state._inviteFromBulk = false; $('invRole').disabled = false; });
    $('inviteOverlay').addEventListener('click', function (e) {
      if (e.target === $('inviteOverlay')) $('inviteOverlay').hidden = true;
    });
    $('genPassword').addEventListener('click', function () {
      $('invPassword').value = genPassword(16);
    });
    // Toggle patient-specific fields when role changes
    $('invRole').addEventListener('change', togglePatientFields);

    $('inviteSubmitBtn').addEventListener('click', function () {
      var email = $('invEmail').value.trim();
      var firstName = $('invFirstName').value.trim();
      var lastName = $('invLastName').value.trim();
      var fiscalCode = $('invFiscal').value.trim().toUpperCase();
      var role = $('invRole').value;
      var password = $('invPassword').value;

      if (!email || !firstName || !lastName) {
        showMsg('inviteMessage', 'Compila tutti i campi obbligatori', 'error');
        return;
      }

      // Codice fiscale obbligatorio per paziente
      if (role === 'patient' && !fiscalCode) {
        showMsg('inviteMessage', 'Codice Fiscale obbligatorio per i pazienti', 'error');
        return;
      }

      // Cellulare obbligatorio per paziente (notifiche WhatsApp)
      function isValidMobile(p) {
        var c = p.replace(/[\s\-\.\(\)]/g, '');
        if (c.indexOf('00') === 0) c = '+' + c.slice(2);
        if (c.charAt(0) === '+') {
          if (/^\+39\d{9,10}$/.test(c)) return c.indexOf('+393') === 0;
          return /^\+\d{10,15}$/.test(c);
        }
        if (/^39\d{9,10}$/.test(c)) return c.indexOf('393') === 0;
        return /^3\d{9}$/.test(c);
      }
      if (role === 'patient') {
        var invPhoneVal = $('invPhone') ? $('invPhone').value.trim() : '';
        if (!invPhoneVal) {
          showMsg('inviteMessage', 'Cellulare obbligatorio per i pazienti (notifiche WhatsApp)', 'error');
          return;
        }
        if (!isValidMobile(invPhoneVal)) {
          showMsg('inviteMessage', 'Numero mobile non valido (es. 347 1234567). I numeri fissi non ricevono WhatsApp.', 'error');
          return;
        }
      }

      // Validate CF format (16 chars alphanumeric)
      if (fiscalCode && !/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(fiscalCode)) {
        showMsg('inviteMessage', 'Formato Codice Fiscale non valido', 'error');
        return;
      }

      // Password validation
      if (!password || password.length < 12) {
        showMsg('inviteMessage', 'La password deve avere almeno 12 caratteri', 'error');
        return;
      }

      $('inviteSubmitBtn').disabled = true;
      showMsg('inviteMessage', 'Creazione utente...', '');

      // Build request body
      var reqBody = {
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role,
        password: password,
        send_invite: true
      };
      if (fiscalCode) reqBody.fiscal_code = fiscalCode;

      // Extra patient fields (optional)
      if (role === 'patient') {
        var phone = $('invPhone') ? $('invPhone').value.trim() : '';
        var dob = $('invDob') ? $('invDob').value : '';
        var gender = $('invGender') ? $('invGender').value : '';
        if (phone) reqBody.phone = phone;
        if (dob) reqBody.date_of_birth = dob;
        if (gender) reqBody.gender = gender;
      }

      // Use /api/users endpoint which handles Auth + profile + welcome email
      fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.token
        },
        body: JSON.stringify(reqBody)
      }).then(function (r) { return r.json(); })
      .then(function (data) {
        $('inviteSubmitBtn').disabled = false;
        if (data.success) {
          var msg = role === 'patient'
            ? 'Paziente creato! Le credenziali sono state inviate a ' + esc(email)
            : 'Utente creato! Un\u0027email di invito \u00e8 stata inviata a ' + esc(email);
          toast('Utente ' + esc(firstName) + ' ' + esc(lastName) + ' creato', 'success');

          // If invited from upload page, close modal and re-search the CF
          if (state._inviteFromUpload && role === 'patient') {
            state._inviteFromUpload = false;
            $('inviteOverlay').hidden = true;
            $('invRole').disabled = false;
            // Re-search the CF to find the just-created patient
            var fc = state._inviteFromUploadFC || '';
            if (fc) {
              $('uploadFiscal').value = fc;
              // Small delay to let DB propagate
              setTimeout(function () { lookupPatient(); }, 600);
            }
            toast('Paziente registrato — puoi caricare il referto', 'success');
          } else if (state._inviteFromAI && role === 'patient') {
            state._inviteFromAI = false;
            $('inviteOverlay').hidden = true;
            $('invRole').disabled = false;
            // Re-search the CF to find the just-created patient in AI page
            var fcAI = state._inviteFromAIFC || '';
            if (fcAI) {
              $('aiFiscal').value = fcAI;
              setTimeout(function () { aiLookupPatient(); }, 600);
            }
            toast('Paziente registrato — dati importati nel modulo AI', 'success');
          } else if (state._inviteFromBulk && role === 'patient') {
            state._inviteFromBulk = false;
            $('inviteOverlay').hidden = true;
            $('invRole').disabled = false;
            var bIdx = state._inviteFromBulkIdx;
            if (bIdx !== undefined && bulkFiles[bIdx]) {
              // Re-lookup to update the entry
              setTimeout(function () {
                var fc = bulkFiles[bIdx].cf;
                if (fc) {
                  fetch('/api/admin/users/batch-lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
                    body: JSON.stringify({ fiscal_codes: [fc] })
                  }).then(function (r) { return r.json(); }).then(function (res) {
                    if (res.success && res.results && res.results[fc]) {
                      bulkFiles[bIdx].lookupResult = res.results[fc];
                    }
                    bulkRenderPreview();
                  });
                }
              }, 600);
            }
            toast('Paziente registrato — tabella aggiornata', 'success');
          } else {
            showMsg('inviteMessage', msg, 'success');
            loadUsers();
          }
        } else {
          var errMsg = data.error || data.message || 'Errore nella creazione';
          showMsg('inviteMessage', errMsg, 'error');
          toast('Errore: ' + errMsg, 'error');
        }
      }).catch(function (err) {
        $('inviteSubmitBtn').disabled = false;
        var errMsg = (err && err.message) || 'Errore nella creazione';
        showMsg('inviteMessage', errMsg, 'error');
        toast('Errore: ' + errMsg, 'error');
      });
    });
  }

  // ── PASSWORD CHANGE ──────────────────────────────
  // P0-5 FIX: Require current password verification before allowing change
  function initPasswordChange() {
    $('pwChangeClose').addEventListener('click', function () { $('pwChangeOverlay').hidden = true; });
    $('pwChangeCancelBtn').addEventListener('click', function () { $('pwChangeOverlay').hidden = true; });
    $('pwChangeOverlay').addEventListener('click', function (e) {
      if (e.target === $('pwChangeOverlay')) $('pwChangeOverlay').hidden = true;
    });
    $('pwChangeSubmitBtn').addEventListener('click', function () {
      var currentPw = $('pwCurrent') ? $('pwCurrent').value : '';
      var newPw = $('pwNew').value;
      var confirm = $('pwConfirm').value;

      // P0-5: Verify current password is provided
      if (!currentPw) {
        showMsg('pwChangeMessage', 'Inserisci la password attuale', 'error');
        return;
      }
      if (newPw.length < 12) {
        showMsg('pwChangeMessage', 'La nuova password deve avere almeno 12 caratteri', 'error');
        return;
      }
      if (!/[A-Z]/.test(newPw) || !/[a-z]/.test(newPw) || !/[0-9]/.test(newPw) || !/[^A-Za-z0-9]/.test(newPw)) {
        showMsg('pwChangeMessage', 'La password deve contenere maiuscole, minuscole, numeri e caratteri speciali', 'error');
        return;
      }
      if (newPw !== confirm) {
        showMsg('pwChangeMessage', 'Le password non corrispondono', 'error');
        return;
      }
      if (newPw === currentPw) {
        showMsg('pwChangeMessage', 'La nuova password deve essere diversa da quella attuale', 'error');
        return;
      }

      $('pwChangeSubmitBtn').disabled = true;
      showMsg('pwChangeMessage', 'Verifica in corso...', '');

      // P0-5: First verify current password by attempting a sign-in
      var userEmail = state.user ? state.user.email : (state.profile ? state.profile.email : null);
      if (!userEmail) {
        showMsg('pwChangeMessage', 'Errore: email utente non disponibile', 'error');
        $('pwChangeSubmitBtn').disabled = false;
        return;
      }

      fetch(SB_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
        body: JSON.stringify({ email: userEmail, password: currentPw })
      }).then(function (r) {
        if (!r.ok) throw new Error('Password attuale non corretta');
        return r.json();
      }).then(function () {
        // Current password verified — now update to new password
        return sbAuthUpdateUser({ password: newPw });
      }).then(function () {
        $('pwChangeSubmitBtn').disabled = false;
        $('pwChangeOverlay').hidden = true;
        toast('Password aggiornata con successo', 'success');
        if ($('pwChangeForm')) $('pwChangeForm').reset();
        showMsg('pwChangeMessage', '', '');
      }).catch(function (err) {
        $('pwChangeSubmitBtn').disabled = false;
        var errMsg = (err && err.message) || (err && err.msg) || 'Errore nella verifica';
        if (errMsg.includes('Invalid login') || errMsg.includes('invalid_credentials') || errMsg.includes('non corretta')) {
          showMsg('pwChangeMessage', 'La password attuale non è corretta', 'error');
        } else {
          showMsg('pwChangeMessage', errMsg, 'error');
        }
      });
    });
  }

  // ── AUDIT LOG (Admin) ────────────────────────────
  var auditPage = 0;
  function loadAuditLog() {
    var action = $('filterAuditAction').value;
    var risk = $('filterAuditRisk').value;
    var date = $('filterAuditDate').value;
    var limit = 25;
    var offset = auditPage * limit;

    var q = 'select=*&order=created_at.desc&limit=' + limit + '&offset=' + offset;
    if (action) q += '&action=eq.' + action;
    if (risk) q += '&risk_level=eq.' + risk;
    if (date) q += '&created_at=gte.' + date + 'T00:00:00&created_at=lt.' + date + 'T23:59:59';

    sbGet('audit_log', q).then(function (data) {
      var body = $('auditBody');
      if (!data || !Array.isArray(data) || data.length === 0) {
        body.innerHTML = '<tr class="table-empty"><td colspan="7"><div class="empty-state"><p>Nessuna attività registrata</p></div></td></tr>';
        return;
      }
      body.innerHTML = data.map(function (a) {
        var riskClass = a.risk_level === 'high' || a.risk_level === 'critical' ? 'badge-urgent'
          : a.risk_level === 'medium' ? 'badge-abnormal'
          : 'badge-archived';
        return '<tr>' +
          '<td style="white-space:nowrap">' + fmtDateTime(a.created_at) + '</td>' +
          '<td>' + esc(a.user_role || '--') + '</td>' +
          '<td><code style="font-size:0.78rem">' + esc(a.action) + '</code></td>' +
          '<td>' + esc((a.target_type || '') + (a.target_id ? ':' + a.target_id.substring(0, 8) : '')) + '</td>' +
          '<td><code style="font-size:0.75rem">' + esc(a.ip_address || '--') + '</code></td>' +
          '<td><span class="badge ' + riskClass + '">' + esc(a.risk_level || 'low') + '</span></td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="window._viewAuditDetail(\'' + a.id + '\')">Dettagli</button></td></tr>';
      }).join('');

      $('auditPageInfo').textContent = 'Pagina ' + (auditPage + 1);
      $('auditPrev').disabled = auditPage === 0;
      $('auditNext').disabled = data.length < limit;
    });

    if (!$('filterAuditAction')._bound) {
      $('filterAuditAction').addEventListener('change', function () { auditPage = 0; loadAuditLog(); });
      $('filterAuditRisk').addEventListener('change', function () { auditPage = 0; loadAuditLog(); });
      $('filterAuditDate').addEventListener('change', function () { auditPage = 0; loadAuditLog(); });
      $('auditPrev').addEventListener('click', function () { if (auditPage > 0) { auditPage--; loadAuditLog(); } });
      $('auditNext').addEventListener('click', function () { auditPage++; loadAuditLog(); });
      $('filterAuditAction')._bound = true;
    }
  }

  // ── Safe Download (patient alert for abnormal/notes) ──
  window._safeDownload = function (reportId) {
    // Only patients get the alert gate; staff downloads directly
    if (!state.profile || state.profile.role !== 'patient') {
      window._downloadReport(reportId);
      return;
    }

    // Try cached data first, then fetch
    var r = (state._reportsCache && state._reportsCache[reportId]) ? state._reportsCache[reportId] : null;

    function showAlertOrDownload(report) {
      if (!report) {
        window._downloadReport(reportId);
        return;
      }

      var hasAbnormal = !!report.has_abnormal_values;
      var hasNotes = !!(report.physician_notes && report.physician_notes.trim());
      if (!hasAbnormal && !hasNotes) {
        // No alert needed — download directly
        window._downloadReport(reportId);
        return;
      }

      // Build alert content
      var alertHtml = '<div style="text-align:left">';

      if (hasAbnormal) {
        alertHtml += '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-bottom:16px">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<strong style="color:#dc2626;font-size:1.05rem">Attenzione \u2014 Valori Anomali</strong>' +
          '</div>' +
          '<p style="margin:0;color:#991b1b;line-height:1.5">Questo referto contiene valori fuori dai range di riferimento. ' +
          'Si consiglia di <strong>consultare il proprio medico curante</strong> per una valutazione approfondita.</p>' +
          '</div>';
      }

      if (hasNotes) {
        alertHtml += '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:16px">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
          '<strong style="color:#d97706;font-size:1.05rem">Nota del Medico</strong>' +
          '</div>' +
          '<p style="margin:0;color:#92400e;line-height:1.6;white-space:pre-wrap">' + esc(report.physician_notes) + '</p>' +
          '</div>';
      }

      alertHtml += '<p style="color:#6b7280;font-size:0.85rem;margin:12px 0 0;line-height:1.4">' +
        'Confermando di aver letto le informazioni sopra riportate, il download del referto verr\u00e0 avviato.</p>';
      alertHtml += '</div>';

      var footer = '<button class="btn btn-outline" onclick="window._closeModal()">Chiudi</button>' +
        '<button class="btn btn-primary" onclick="window._closeModal();window._downloadReport(\'' + reportId + '\')">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ' +
        'Ho letto, procedi al download</button>';

      openModal('Avviso Importante \u2014 ' + esc(report.report_number || ''), alertHtml, footer);
    }

    if (r) {
      showAlertOrDownload(r);
    } else {
      // Fetch report data if not cached
      sbGet('reports', 'id=eq.' + reportId + '&select=id,report_number,has_abnormal_values,physician_notes').then(function (data) {
        showAlertOrDownload(data && data[0] ? data[0] : null);
      }).catch(function () {
        window._downloadReport(reportId);
      });
    }
  };

  // ── Global Actions (exposed to onclick) ──────────
  window._downloadReport = function (reportId) {
    toast('Preparazione download...', 'info');
    // Track that patient viewed/downloaded the report
    if (state.profile && state.profile.role === 'patient') {
      markReportViewed(reportId);
    }
    sbGet('report_files', 'report_id=eq.' + reportId + '&is_primary=eq.true&select=storage_path,original_name').then(function (files) {
      if (!files || files.length === 0) { toast('File non trovato', 'error'); return; }
      var path = files[0].storage_path;
      fetch(SB_URL + '/storage/v1/object/sign/referti/' + path, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + state.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 300 })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data.signedURL) {
          var url = SB_URL + '/storage/v1' + data.signedURL;
          var fileName = files[0].original_name || 'referto.pdf';

          // Mobile-friendly download: use window.open as primary, fallback to anchor
          var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            // On mobile, window.open works more reliably than a.click()
            var win = window.open(url, '_blank');
            if (!win) {
              // Pop-up blocked: fallback to location change
              window.location.href = url;
            }
          } else {
            // Desktop: use anchor with download attribute for proper filename
            var a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { a.remove(); }, 1000);
          }

          toast('Download avviato: ' + fileName, 'success');

          // Update download counter and refresh UI
          function refreshAfterDownload() {
            // Reload current page data to show updated download count
            setTimeout(function () {
              loadPageData(state.currentPage);
              loadDashboardBadges(state.profile ? state.profile.role : 'patient');
            }, 600);
          }

          // P0-1 FIX: Atomic download counter via RPC (no race condition)
          sbRpc('increment_download_count', { p_report_id: reportId })
            .then(function (result) {
              refreshAfterDownload();
            })
            .catch(function (rpcErr) {
              console.warn('[Download] RPC not available, using fallback:', rpcErr);
              // Fallback if RPC not deployed yet: read current count, then increment
              sbGet('reports', 'id=eq.' + reportId + '&select=download_count')
                .then(function (rows) {
                  var current = (rows && rows[0] && rows[0].download_count) ? rows[0].download_count : 0;
                  return sbPatch('reports', 'id=eq.' + reportId, {
                    patient_downloaded: true,
                    patient_downloaded_at: new Date().toISOString(),
                    download_count: current + 1
                  });
                })
                .then(function (patchResult) {
                  refreshAfterDownload();
                })
                .catch(function (fallbackErr) {
                  console.error('[Download] Fallback failed:', fallbackErr);
                  // Still refresh the UI even if DB update failed
                  refreshAfterDownload();
                });
            });
        } else {
          toast('Errore nella generazione del link', 'error');
        }
      });
    }).catch(function () { toast('Errore nel download', 'error'); });
  };

  window._validateReport = function (id) {
    openModal('Conferma Validazione',
      '<p>Confermi la validazione tecnica di questo referto?</p><p style="font-size:0.85rem;color:var(--text-secondary)">Il referto verrà inoltrato al medico per la firma.</p>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button><button class="btn btn-primary" onclick="window._doValidate(\'' + id + '\')">Conferma Validazione</button>');
  };
  window._doValidate = function (id) {
    sbPatch('reports', 'id=eq.' + id, {
      status: 'validated',
      validated_at: new Date().toISOString(),
      validated_by: state.profile ? state.profile.id : null
    }, {requireMatch: true}).then(function () {
      closeModal();
      toast('Referto validato', 'success');
      if (state.currentPage === 'all-reports') loadAllReports();
      else loadQueue();
      loadDashboardBadges(state.profile ? state.profile.role : 'patient');
    }).catch(function () { toast('Errore', 'error'); });
  };

  window._signReport = function (id) {
    openModal('Firma Medica',
      '<p>Stai per apporre la firma medica digitale a questo referto.</p>' +
      '<div class="form-group" style="margin-top:1rem"><label for="signNotes">Note del medico (opzionale)</label>' +
      '<textarea id="signNotes" class="form-input" rows="3" style="padding-left:0.85rem" placeholder="Inserisci eventuali note..."></textarea></div>' +
      '<p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.5rem">Questa azione è irreversibile.</p>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button><button class="btn btn-primary" onclick="window._doSign(\'' + id + '\')">Firma Referto</button>');
  };
  window._doSign = function (id) {
    var notes = $('signNotes') ? $('signNotes').value.trim() : null;
    sbPatch('reports', 'id=eq.' + id, {
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by: state.profile ? state.profile.id : null,
      physician_notes: notes || null
    }, {requireMatch: true}).then(function () {
      closeModal();
      toast('Referto firmato', 'success');
      if (state.currentPage === 'all-reports') loadAllReports();
      else loadSignRelease();
      loadDashboardBadges(state.profile ? state.profile.role : 'patient');
    }).catch(function () { toast('Errore', 'error'); });
  };

  window._releaseReport = function (id) {
    // Phase D: channel preview — show which notification channels will be used
    openModal('Rilascio al Paziente',
      '<p>Il referto verrà reso disponibile al paziente per il download.</p>' +
      '<div id="releaseChannels_' + id + '" style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-secondary)">Verifica contatti paziente\u2026</div>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button><button class="btn btn-primary" id="releaseBtn_' + id + '" onclick="window._doRelease(\'' + id + '\')">Rilascia al Paziente</button>');
    // Fetch patient contacts to render the channel preview
    sbGet('reports', 'id=eq.' + id + '&select=patient:patient_id(email,phone)').then(function (rows) {
      var box = $('releaseChannels_' + id);
      if (!box) return;
      var p = (rows && rows[0] && rows[0].patient) || {};
      var emailLine = p.email
        ? '\ud83d\udce7 Email: <strong style="color:var(--text-primary)">\u2705 ' + esc(p.email) + '</strong>'
        : '\ud83d\udce7 Email: <strong style="color:#f59e0b">\u26a0\ufe0f nessuna email registrata</strong>';
      var phoneMasked = p.phone ? ('***' + String(p.phone).slice(-4)) : null;
      var waLine = p.phone
        ? '\ud83d\udcf1 WhatsApp: <strong style="color:var(--text-primary)">\u2705 ' + esc(phoneMasked) + '</strong>'
        : '\ud83d\udcf1 WhatsApp: <strong style="color:#f59e0b">\u26a0\ufe0f nessun numero registrato</strong>';
      box.innerHTML = 'Il paziente riceverà una notifica su questi canali:<br>' +
        '<div style="margin-top:0.4rem;line-height:1.8">' + emailLine + '<br>' + waLine + '</div>' +
        (!p.phone ? '<div style="margin-top:0.4rem;color:#f59e0b">Il messaggio WhatsApp non potrà essere inviato. Aggiungi un numero di cellulare al paziente per abilitarlo.</div>' : '');
    }).catch(function () {
      var box = $('releaseChannels_' + id);
      if (box) box.innerHTML = 'Il paziente riceverà una notifica via email e WhatsApp (se il numero è registrato).';
    });
  };
  window._doRelease = function (id) {
    // P1-6: Disable button immediately to prevent double-click
    var btn = $('releaseBtn_' + id);
    if (btn) { btn.disabled = true; btn.textContent = 'Rilascio in corso...'; }
    sbPatch('reports', 'id=eq.' + id, {
      status: 'released',
      released_at: new Date().toISOString(),
      released_by: state.profile ? state.profile.id : null
    }, {requireMatch: true}).then(function () {
      closeModal();
      toast('Referto rilasciato al paziente', 'success');
      // Send email notification to patient
      notifyRelease(id);
      if (state.currentPage === 'all-reports') loadAllReports();
      else loadSignRelease();
      loadDashboardBadges(state.profile ? state.profile.role : 'patient');
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Rilascia al Paziente'; }
      toast('Errore', 'error');
    });
  };

  window._previewReport = function (id) {
    // Track that patient viewed the report
    if (state.profile && state.profile.role === 'patient') {
      markReportViewed(id);
    }
    sbGet('reports', 'id=eq.' + id + '&select=*,patient:patient_id(first_name,last_name,email,fiscal_code)').then(function (data) {
      if (!data || data.length === 0) return;
      var r = data[0];
      // Cache for alert-before-download
      if (!state._reportsCache) state._reportsCache = {};
      state._reportsCache[r.id] = r;
      var p = r.patient || {};
      var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:0.88rem">' +
        '<div><strong>N. Referto</strong><br>' + esc(r.report_number || '--') + '</div>' +
        '<div><strong>Stato</strong><br><span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></div>' +
        '<div><strong>Paziente</strong><br>' + esc((p.first_name || '') + ' ' + (p.last_name || '')) + '</div>' +
        '<div><strong>Codice Fiscale</strong><br><code>' + esc(r.patient_fiscal_code || '--') + '</code></div>' +
        '<div><strong>Tipo Esame</strong><br>' + esc(r.report_type || '--') + '</div>' +
        '<div><strong>Categoria</strong><br>' + esc(r.category || '--') + '</div>' +
        '<div><strong>Data Prelievo</strong><br>' + fmtDate(r.sample_date) + '</div>' +
        '<div><strong>Creato il</strong><br>' + fmtDateTime(r.created_at) + '</div>' +
        (r.validated_at ? '<div><strong>Validato il</strong><br>' + fmtDateTime(r.validated_at) + '</div>' : '') +
        (r.signed_at ? '<div><strong>Firmato il</strong><br>' + fmtDateTime(r.signed_at) + '</div>' : '') +
        (r.released_at ? '<div><strong>Rilasciato il</strong><br>' + fmtDateTime(r.released_at) + '</div>' : '') +
        (r.physician_notes ? '<div style="grid-column:1/-1"><strong>Note Medico</strong><br>' + esc(r.physician_notes) + '</div>' : '') +
        (r.is_urgent ? '<div><span class="badge badge-urgent">Urgente</span></div>' : '') +
        (r.has_abnormal_values ? '<div><span class="badge badge-abnormal">Valori Anomali</span></div>' : '') +
        (r.patient_viewed ? '<div><strong>Visualizzato dal paziente</strong><br>' + fmtDateTime(r.patient_viewed_at) + '</div>' : '') +
        (r.download_count > 0 ? '<div><strong>Download</strong><br>' + r.download_count + ' volte</div>' : '') +
        '</div>';

      var footer = '<button class="btn btn-outline" onclick="window._closeModal()">Chiudi</button>';
      if (r.status === 'released') {
        // Patients use _safeDownload (alert gate); staff uses _downloadReport directly
        var dlFn = (state.profile && state.profile.role === 'patient') ? '_safeDownload' : '_downloadReport';
        footer += '<button class="btn btn-primary btn-sm" onclick="window._closeModal();window.' + dlFn + '(\'' + r.id + '\')">Scarica PDF</button>';
      }

      openModal('Dettagli Referto — ' + (r.report_number || ''), html, footer);
    });
  };

  window._editUser = function (id) {
    sbGet('users', 'id=eq.' + id + '&select=*').then(function (data) {
      if (!data || data.length === 0) return;
      var u = data[0];
      var html = '<form id="editUserForm"><div class="form-grid">' +
        '<div class="form-group"><label>Nome</label><input class="form-input" id="editUserFirstName" value="' + esc(u.first_name || '') + '"></div>' +
        '<div class="form-group"><label>Cognome</label><input class="form-input" id="editUserLastName" value="' + esc(u.last_name || '') + '"></div>' +
        '<div class="form-group"><label>Email</label><input class="form-input" id="editUserEmail" type="email" value="' + esc(u.email || '') + '"></div>' +
        '<div class="form-group"><label>Codice Fiscale</label><input class="form-input" id="editUserCf" value="' + esc(u.fiscal_code || '') + '" maxlength="16" style="text-transform:uppercase"></div>' +
        '<div class="form-group"><label>Data di nascita</label><input class="form-input" id="editUserDob" type="date" value="' + esc(u.date_of_birth || '') + '"></div>' +
        '<div class="form-group"><label>Telefono</label><input class="form-input" id="editUserPhone" value="' + esc(u.phone || '') + '"></div>' +
        '<div class="form-group"><label>Genere</label><select class="form-input" id="editUserGender">' +
        '<option value="">—</option><option value="F"' + (u.gender === 'F' ? ' selected' : '') + '>Femmina</option><option value="M"' + (u.gender === 'M' ? ' selected' : '') + '>Maschio</option><option value="ALTRO"' + (u.gender === 'ALTRO' ? ' selected' : '') + '>Altro</option></select></div>' +
        '<div class="form-group"><label>Ruolo</label><select class="form-input" id="editUserRole">' +
        Object.keys(ROLE_LABELS).map(function (k) { return '<option value="' + k + '"' + (k === u.role ? ' selected' : '') + '>' + ROLE_LABELS[k] + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-group"><label class="checkbox-label"><input type="checkbox" id="editUserActive"' + (u.is_active ? ' checked' : '') + '><span class="checkmark"></span> Utente Attivo</label></div>' +
        '</div>' +
        '<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted)">' +
        'Registrato: ' + fmtDate(u.created_at) + ' | Ultimo login: ' + fmtDateTime(u.last_login_at) + ' | Login: ' + (u.login_count || 0) + ' volte' +
        '</div></form>';
      openModal('Modifica Utente — ' + u.first_name + ' ' + u.last_name, html,
        '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button>' +
        '<button class="btn btn-danger btn-sm" onclick="window._deactivateUser(\'' + u.id + '\')" style="margin-right:auto">Disattiva</button>' +
        '<button class="btn btn-primary" onclick="window._saveUser(\'' + u.id + '\')">Salva</button>');
    });
  };
  window._saveUser = function (id) {
    var patch = {
      first_name: ($('editUserFirstName').value || '').trim(),
      last_name: ($('editUserLastName').value || '').trim(),
      email: ($('editUserEmail').value || '').trim(),
      fiscal_code: ($('editUserCf').value || '').trim().toUpperCase(),
      date_of_birth: $('editUserDob').value || null,
      phone: ($('editUserPhone').value || '').trim() || null,
      gender: $('editUserGender').value || null,
      role: $('editUserRole').value,
      is_active: $('editUserActive').checked
    };
    if (!patch.first_name || !patch.last_name) {
      toast('Nome e cognome sono obbligatori', 'warning');
      return;
    }
    sbPatch('users', 'id=eq.' + id, patch).then(function () {
      closeModal();
      toast('Utente aggiornato', 'success');
      loadUsers();
    }).catch(function () { toast('Errore nel salvataggio', 'error'); });
  };
  window._deactivateUser = function (id) {
    sbPatch('users', 'id=eq.' + id, { is_active: false }).then(function () {
      closeModal();
      toast('Utente disattivato', 'warning');
      loadUsers();
    }).catch(function () { toast('Errore', 'error'); });
  };

  window._viewAuditDetail = function (id) {
    sbGet('audit_log', 'id=eq.' + id + '&select=*').then(function (data) {
      if (!data || data.length === 0) return;
      var a = data[0];
      var html = '<div style="font-size:0.85rem;margin-bottom:1rem">' +
        '<p><strong>Azione:</strong> ' + esc(a.action) + '</p>' +
        '<p><strong>Utente:</strong> ' + esc(a.user_role || '--') + ' (ID: ' + esc((a.user_id || '--').substring(0, 8)) + '...)</p>' +
        '<p><strong>Data:</strong> ' + fmtDateTime(a.created_at) + '</p>' +
        '<p><strong>IP:</strong> ' + esc(a.ip_address || '--') + '</p>' +
        '<p><strong>User Agent:</strong> ' + esc((a.user_agent || '--').substring(0, 100)) + '</p>' +
        '</div>' +
        '<pre style="background:var(--bg-input);padding:1rem;border-radius:var(--radius-sm);font-size:0.78rem;overflow-x:auto;max-height:250px">' +
        esc(JSON.stringify(a.details || {}, null, 2)) + '</pre>';
      openModal('Dettaglio Audit #' + a.id, html, '<button class="btn btn-outline" onclick="window._closeModal()">Chiudi</button>');
    });
  };

  // ── Fast-track: validate+sign+release in one go (Admin) ──
  window._fastTrackReport = function (id) {
    openModal('Fast-Track Referto',
      '<p>Vuoi processare questo referto attraverso tutto il flusso?</p>' +
      '<p style="font-size:0.85rem;color:var(--text-secondary)">Il referto verrà <strong>validato</strong>, <strong>firmato</strong> e <strong>rilasciato al paziente</strong> in un unico passaggio.</p>' +
      '<div class="form-group" style="margin-top:1rem"><label for="fastNotes">Note del medico (opzionale)</label>' +
      '<textarea id="fastNotes" class="form-input" rows="2" style="padding-left:0.85rem" placeholder="Inserisci eventuali note..."></textarea></div>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button>' +
      '<button class="btn btn-primary" id="confirmFastTrack">Conferma Fast-Track</button>');
    setTimeout(function () {
      var btn = $('confirmFastTrack');
      if (btn) btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.textContent = 'Elaborazione...';
        var now = new Date().toISOString();
        var userId = state.profile ? state.profile.id : null;
        var notes = $('fastNotes') ? $('fastNotes').value.trim() : null;
        // Step 1: Validate
        sbPatch('reports', 'id=eq.' + id, {
          status: 'validated', validated_at: now, validated_by: userId
        }, {requireMatch: true}).then(function () {
          // Step 2: Sign
          return sbPatch('reports', 'id=eq.' + id, {
            status: 'signed', signed_at: now, signed_by: userId, physician_notes: notes || null
          }, {requireMatch: true});
        }).then(function () {
          // Step 3: Release
          return sbPatch('reports', 'id=eq.' + id, {
            status: 'released', released_at: now, released_by: userId
          }, {requireMatch: true});
        }).then(function () {
          closeModal();
          toast('Referto validato, firmato e rilasciato al paziente!', 'success');
          // Send email notification to patient
          notifyRelease(id);
          loadAllReports();
          loadDashboardBadges(state.profile.role);
        }).catch(function (err) {
          closeModal();
          toast('Errore: ' + (err.message || 'riprova'), 'error');
        });
      });
    }, 50);
  };

  // ── Fast-track Sign: sign+release in one go (for already-validated reports) ──
  window._fastTrackSign = function (id) {
    openModal('Firma & Rilascia Rapido',
      '<p>Vuoi <strong>firmare</strong> e <strong>rilasciare</strong> questo referto in un unico passaggio?</p>' +
      '<div class="form-group" style="margin-top:1rem"><label for="fastSignNotes">Note del medico (opzionale)</label>' +
      '<textarea id="fastSignNotes" class="form-input" rows="2" style="padding-left:0.85rem" placeholder="Inserisci eventuali note..."></textarea></div>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button>' +
      '<button class="btn btn-primary" id="confirmFastSign">Firma & Rilascia</button>');
    setTimeout(function () {
      var btn = $('confirmFastSign');
      if (btn) btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.textContent = 'Elaborazione...';
        var now = new Date().toISOString();
        var userId = state.profile ? state.profile.id : null;
        var notes = $('fastSignNotes') ? $('fastSignNotes').value.trim() : null;
        // Step 1: Sign
        sbPatch('reports', 'id=eq.' + id, {
          status: 'signed', signed_at: now, signed_by: userId, physician_notes: notes || null
        }, {requireMatch: true}).then(function () {
          // Step 2: Release
          return sbPatch('reports', 'id=eq.' + id, {
            status: 'released', released_at: now, released_by: userId
          }, {requireMatch: true});
        }).then(function () {
          closeModal();
          toast('Referto firmato e rilasciato al paziente!', 'success');
          notifyRelease(id);
          if (state.currentPage === 'sign-release') loadSignRelease();
          else loadAllReports();
          loadDashboardBadges(state.profile.role);
        }).catch(function (err) {
          closeModal();
          toast('Errore: ' + (err.message || 'riprova'), 'error');
        });
      });
    }, 50);
  };

  window._closeModal = closeModal;

  // ── Delete Report (ostetrica or admin) ──────────
  window._deleteReport = function (id) {
    openModal('Conferma Eliminazione',
      '<p style="color:#ef4444;font-weight:600">Sei sicuro di voler eliminare questo referto?</p>' +
      '<p style="font-size:0.85rem;color:var(--text-secondary)">Il referto e i file associati verranno eliminati. Questa azione non è reversibile.</p>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button>' +
      '<button class="btn" style="background:#ef4444;color:#fff;border:0" id="confirmDelete_' + id + '" onclick="window._doDelete(\'' + id + '\')">Elimina Referto</button>');
  };
  window._doDelete = function (id) {
    var btn = $('confirmDelete_' + id);
    if (btn) { btn.disabled = true; btn.textContent = 'Eliminazione...'; }
    fetch('/api/reports/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + state.token }
    }).then(function (r) { return r.json(); }).then(function (resp) {
      closeModal();
      if (resp.success) {
        toast('Referto eliminato con successo', 'success');
        loadPageData(state.currentPage);
      } else {
        toast(resp.error || 'Errore nella cancellazione', 'error');
      }
    }).catch(function () {
      closeModal();
      toast('Errore nella cancellazione', 'error');
    });
  };

  // ── Modal ────────────────────────────────────────
  function initModal() {
    $('modalClose').addEventListener('click', closeModal);
    $('modalOverlay').addEventListener('click', function (e) {
      if (e.target === $('modalOverlay')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
        $('inviteOverlay').hidden = true;
        $('pwChangeOverlay').hidden = true;
      }
    });
  }
  function openModal(title, body, footer) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = body;
    $('modalFooter').innerHTML = footer || '';
    $('modalOverlay').hidden = false;
  }
  function closeModal() {
    $('modalOverlay').hidden = true;
  }

  // ── Notifications ────────────────────────────────
  function initNotifications() {
    $('notifBtn').addEventListener('click', function () {
      var panel = $('notifPanel');
      panel.hidden = !panel.hidden;
      if (!panel.hidden) loadNotifications();
    });
    $('markAllRead').addEventListener('click', function () {
      if (state.profile) {
        sbPatch('notifications', 'user_id=eq.' + state.profile.id + '&status=eq.delivered', { status: 'read', read_at: new Date().toISOString() })
          .then(function () {
            loadNotifications();
            toast('Tutte le notifiche segnate come lette', 'success');
          });
      }
    });
    document.addEventListener('click', function (e) {
      if (!$('notifPanel').contains(e.target) && e.target !== $('notifBtn') && !$('notifBtn').contains(e.target)) {
        $('notifPanel').hidden = true;
      }
    });
  }

  function loadNotifications() {
    if (!state.profile) return;
    sbGet('notifications', 'user_id=eq.' + state.profile.id + '&select=*&order=created_at.desc&limit=20').then(function (data) {
      var list = $('notifList');
      if (!data || !Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<div class="notif-empty">Nessuna notifica</div>';
        $('notifDot').hidden = true;
        return;
      }
      var unread = data.filter(function (n) { return n.status !== 'read'; }).length;
      $('notifDot').hidden = unread === 0;

      list.innerHTML = data.map(function (n) {
        return '<div class="notif-item' + (n.status !== 'read' ? ' unread' : '') + '"' +
          (n.report_id ? ' onclick="window._previewReport(\'' + n.report_id + '\')"' : '') + '>' +
          '<div class="notif-item-title">' + esc(n.subject || 'Notifica') + '</div>' +
          '<div class="notif-item-body">' + esc(n.body || '') + '</div>' +
          '<div class="notif-item-time">' + timeAgo(n.created_at) + '</div></div>';
      }).join('');
    });
  }

  // ── Toast ────────────────────────────────────────
  function toast(msg, type) {
    var container = $('toastContainer');
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');

    var icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    el.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<span class="toast-text">' + esc(msg) + '</span>' +
      '<button class="toast-close" aria-label="Chiudi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    el.querySelector('.toast-close').addEventListener('click', function () { el.remove(); });
    container.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(function () { el.remove(); }, 300);
      }
    }, 5000);
  }

  // ── Utilities ────────────────────────────────────
  function showMsg(id, text, type) {
    var el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'form-message ' + (type || '');
  }

  function updateBadge(id, count) {
    var el = $(id);
    if (!el) return;
    el.textContent = count;
    el.hidden = count === 0;
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  // ── AI REPORT GENERATION ─────────────────────────────────────────────────
  var _aiInitialized = false;
  var _aiTimerInterval = null;

  function initAIReport() {
    if (_aiInitialized) return;
    _aiInitialized = true;

    // Set default date to today
    var today = new Date().toISOString().split('T')[0];
    if ($('aiDataEsame')) $('aiDataEsame').value = today;

    // CF Lookup button
    $('aiLookupBtn').addEventListener('click', aiLookupPatient);
    // Allow Enter key on CF field
    $('aiFiscal').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); aiLookupPatient(); }
    });
    // Register patient button (opens invite modal with pre-filled GIPO data)
    $('aiRegisterPatientBtn').addEventListener('click', function () {
      var fc = $('aiFiscal').value.trim().toUpperCase();
      $('inviteOverlay').hidden = false;
      $('inviteForm').reset();
      $('inviteMessage').textContent = '';
      $('invPassword').value = genPassword(16);
      $('invRole').value = 'patient';
      $('invRole').disabled = true;
      $('invFiscal').value = fc;
      togglePatientFields();
      // Pre-fill with GIPO data if available
      if (state._aiGipoData) {
        var g = state._aiGipoData;
        if (g.first_name) $('invFirstName').value = g.first_name;
        if (g.last_name) $('invLastName').value = g.last_name;
        if (g.email) $('invEmail').value = g.email;
        if (g.phone && $('invPhone')) $('invPhone').value = g.phone;
        if (g.date_of_birth && $('invDob')) $('invDob').value = g.date_of_birth;
        if (g.gender && $('invGender')) $('invGender').value = g.gender;
      }
      // Flag so after creation we re-search the CF in AI page
      state._inviteFromAI = true;
      state._inviteFromAIFC = fc;
    });

    // MOC PDF upload zone
    initAiMocUpload();

    // Generate button
    $('aiGenerateBtn').addEventListener('click', aiGenerateReport);

    // Clear button
    $('aiClearBtn').addEventListener('click', function () {
      ['aiSpecialty','aiPatNome','aiPatCognome','aiPatDob','aiPatAltezza','aiPatPeso',
       'aiIndicazione','aiTecnica','aiValori','aiNoteTecniche','aiStorico',
       'aiValidatore','aiMedico','aiNoteAnamnesi'].forEach(function (id) {
        var el = $(id);
        if (el) el.value = '';
      });
      $('aiPatSesso').value = 'F';
      $('aiPatMenopausa').value = 'SCONOSCIUTO';
      $('aiFratture').checked = false;
      $('aiPatologie').value = '';
      $('aiTerapie').value = '';
      $('aiFattoriRischio').value = '';
      $('aiDataEsame').value = today;
      // Also clear CF lookup state
      if ($('aiFiscal')) $('aiFiscal').value = '';
      if ($('aiPatientFound')) $('aiPatientFound').hidden = true;
      if ($('aiFiscal-error')) { $('aiFiscal-error').textContent = ''; $('aiFiscal-error').style.color = ''; }
      if ($('aiRegisterPatientBtn')) $('aiRegisterPatientBtn').hidden = true;
      state._aiGipoData = null;
      state._aiPatientId = null;
      // Clear MOC upload
      state._aiMocFile = null;
      state._aiMocData = null;
      if ($('aiMocFileInfo')) $('aiMocFileInfo').hidden = true;
      if ($('aiMocDropContent')) $('aiMocDropContent').style.display = '';
      if ($('aiMocVerifyAlert')) $('aiMocVerifyAlert').hidden = true;
      if ($('aiMocError')) $('aiMocError').textContent = '';
      toast('Campi puliti', 'info');
    });

    // New generation button
    $('aiNewBtn').addEventListener('click', function () {
      $('aiResult').hidden = true;
      $('aiStep1').hidden = false;
      // Reset edit mode
      if ($('aiReportEdit')) {
        $('aiReportEdit').style.display = 'none';
        $('aiReportText').style.display = '';
        if ($('aiEditHint')) $('aiEditHint').style.display = 'none';
        if ($('aiDraftBadge')) $('aiDraftBadge').textContent = 'DRAFT — DA VALIDARE';
      }
      state._aiEditMode = false;
    });

    // Edit toggle button
    if ($('aiEditToggleBtn')) {
      $('aiEditToggleBtn').addEventListener('click', function () {
        var editArea = $('aiReportEdit');
        var viewArea = $('aiReportText');
        var hint = $('aiEditHint');
        var badge = $('aiDraftBadge');

        if (!state._aiEditMode) {
          // Switch to edit mode
          // Get plain text from the raw AI response (not the HTML-formatted version)
          var rawText = state._aiLastResult ? (state._aiLastResult.report_text || state._aiLastResult.raw_response || '') : viewArea.innerText;
          // Remove JSON block if present
          rawText = rawText.replace(/```json[\s\S]*?```/g, '').trim();
          editArea.value = rawText;
          editArea.style.display = '';
          viewArea.style.display = 'none';
          if (hint) hint.style.display = '';
          if (badge) { badge.textContent = 'IN MODIFICA'; badge.style.background = '#dbeafe'; badge.style.color = '#1d4ed8'; }
          this.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.3rem"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Anteprima';
          state._aiEditMode = true;
          editArea.focus();
        } else {
          // Switch back to view mode — use edited text
          var editedText = editArea.value;
          // Store edited text for PDF generation and finalization
          state._aiEditedText = editedText;
          // Re-render with formatting
          var formatted = editedText;
          formatted = formatted.replace(/^### (\d+)\. (.+)$/gm, '<h4 style="color:var(--primary);margin:1.2rem 0 0.5rem;font-size:1rem">$1. $2</h4>');
          formatted = formatted.replace(/^### (.+)$/gm, '<h4 style="color:var(--primary);margin:1.2rem 0 0.5rem;font-size:1rem">$1</h4>');
          formatted = formatted.replace(/^## (.+)$/gm, '<h3 style="margin:1rem 0 0.5rem">$1</h3>');
          formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          formatted = formatted.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-color);margin:1rem 0">');
          viewArea.innerHTML = formatted;
          editArea.style.display = 'none';
          viewArea.style.display = '';
          if (hint) hint.style.display = 'none';
          if (badge) { badge.textContent = 'MODIFICATO'; badge.style.background = '#dcfce7'; badge.style.color = '#166534'; }
          this.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.3rem"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifica';
          state._aiEditMode = false;
          toast('Modifiche salvate. Usa "Stampa PDF" o "Valida e Rilascia" per procedere.', 'info');
        }
      });
    }

    // Print PDF button
    if ($('aiPrintPdfBtn')) {
      $('aiPrintPdfBtn').addEventListener('click', function () {
        aiPrintReportPdf();
      });
    }

    // Copy button
    $('aiCopyBtn').addEventListener('click', function () {
      var text = state._aiEditedText || (state._aiEditMode ? $('aiReportEdit').value : $('aiReportText').innerText);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          toast('Referto copiato negli appunti', 'success');
        });
      } else {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast('Referto copiato negli appunti', 'success');
      }
    });

    // JSON toggle
    $('aiJsonBtn').addEventListener('click', function () {
      var viewer = $('aiJsonViewer');
      viewer.hidden = !viewer.hidden;
      this.textContent = viewer.hidden ? 'Vedi JSON Strutturato' : 'Nascondi JSON';
    });
  }

  /* ── AI CF Lookup (mirrors Upload page lookupPatient/lookupGipoPatient) ── */
  function aiLookupPatient() {
    var fc = $('aiFiscal').value.trim().toUpperCase();
    $('aiFiscal').value = fc;
    if (fc.length !== 16) {
      $('aiFiscal-error').textContent = 'Il codice fiscale deve essere di 16 caratteri';
      $('aiFiscal-error').style.color = '';
      $('aiPatientFound').hidden = true;
      $('aiRegisterPatientBtn').hidden = true;
      return;
    }
    $('aiFiscal-error').textContent = '';
    $('aiFiscal-error').style.color = '';
    $('aiPatientFound').hidden = true;
    $('aiRegisterPatientBtn').hidden = true;
    state._aiGipoData = null;
    state._aiPatientId = null;

    // Step 1: search local users table
    fetch('/api/admin/users/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ fiscal_code: fc })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.success && res.data) {
        // Found in users DB — auto-fill patient fields
        var p = res.data;
        state._aiPatientId = p.id;
        $('aiPatientFoundName').textContent = p.first_name + ' ' + p.last_name + (p.email ? ' (' + p.email + ')' : '');
        $('aiPatientFound').hidden = false;
        // Auto-fill form fields
        if (p.first_name) $('aiPatNome').value = p.first_name;
        if (p.last_name) $('aiPatCognome').value = p.last_name;
        if (p.date_of_birth) $('aiPatDob').value = p.date_of_birth;
        if (p.gender) $('aiPatSesso').value = p.gender;
        toast('Paziente trovato nel sistema', 'success');
      } else {
        // Step 2: not in users — try GIPO
        aiLookupGipoPatient(fc);
      }
    }).catch(function () {
      $('aiFiscal-error').textContent = 'Errore nella ricerca';
      $('aiFiscal-error').style.color = '';
    });
  }

  function aiLookupGipoPatient(fc) {
    fetch('/api/admin/gipo/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ fiscal_code: fc })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.success && res.data) {
        // Found in GIPO — auto-fill patient fields + offer registration
        var g = res.data;
        state._aiGipoData = g;
        var infoText = 'Trovato in GIPO: ' + esc(g.first_name) + ' ' + esc(g.last_name);
        if (g.email) infoText += ' (' + esc(g.email) + ')';
        $('aiFiscal-error').textContent = infoText;
        $('aiFiscal-error').style.color = '#00704A';
        $('aiRegisterPatientBtn').hidden = false;
        $('aiRegisterPatientBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Registra Paziente';
        // Auto-fill form fields from GIPO data
        if (g.first_name) $('aiPatNome').value = g.first_name;
        if (g.last_name) $('aiPatCognome').value = g.last_name;
        if (g.date_of_birth) $('aiPatDob').value = g.date_of_birth;
        if (g.gender) $('aiPatSesso').value = g.gender;
        toast('Paziente trovato in GIPO — dati importati', 'success');
        // Cross-verify with MOC PDF if loaded
        if (state._aiMocData) aiVerifyPatientCrossCheck();
      } else {
        // Not found anywhere
        state._aiGipoData = null;
        $('aiFiscal-error').textContent = 'Paziente non trovato. Compilare i dati manualmente.';
        $('aiFiscal-error').style.color = '';
        $('aiRegisterPatientBtn').hidden = true;
      }
    }).catch(function () {
      state._aiGipoData = null;
      $('aiFiscal-error').textContent = 'Errore nella ricerca GIPO';
      $('aiFiscal-error').style.color = '';
    });
  }

  /* ── MOC-DXA PDF Upload & Parsing (client-side with pdf.js) ── */

  function initAiMocUpload() {
    var dropZone = $('aiMocDropZone');
    var fileInput = $('aiMocFileInput');
    var browseBtn = $('aiMocBrowseBtn');
    var removeBtn = $('aiMocRemoveFile');
    if (!dropZone || !fileInput) return;

    browseBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) aiHandleMocFile(fileInput.files[0]);
    });
    removeBtn.addEventListener('click', function () {
      state._aiMocFile = null;
      state._aiMocData = null;
      fileInput.value = '';
      $('aiMocFileInfo').hidden = true;
      $('aiMocDropContent').style.display = '';
      $('aiMocVerifyAlert').hidden = true;
      $('aiMocError').textContent = '';
    });

    // Drag & drop
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0]) aiHandleMocFile(files[0]);
    });
  }

  function aiHandleMocFile(file) {
    if (!file || file.type !== 'application/pdf') {
      $('aiMocError').textContent = 'Solo file PDF accettati';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      $('aiMocError').textContent = 'File troppo grande (max 5 MB)';
      return;
    }
    $('aiMocError').textContent = '';
    state._aiMocFile = file;

    // Show file info
    $('aiMocFileName').textContent = file.name;
    $('aiMocFileSize').textContent = fmtSize(file.size);
    $('aiMocFileInfo').hidden = false;
    $('aiMocDropContent').style.display = 'none';

    // Parse PDF
    toast('Analisi PDF MOC in corso...', 'info');
    var reader = new FileReader();
    reader.onload = function (e) {
      var typedArray = new Uint8Array(e.target.result);
      extractMocPdfText(typedArray).then(function (fullText) {
        var parsed = parseMocEconetText(fullText);
        if (!parsed) {
          $('aiMocError').textContent = 'Formato PDF non riconosciuto. Assicurarsi che sia un referto ECONET.';
          toast('Errore: formato PDF non riconosciuto', 'error');
          return;
        }
        state._aiMocData = parsed;
        aiAutoFillFromMoc(parsed);
        aiVerifyPatientCrossCheck();
        toast('Dati MOC estratti e compilati automaticamente', 'success');
      }).catch(function (err) {
        console.error('MOC PDF parse error:', err);
        $('aiMocError').textContent = 'Errore nella lettura del PDF: ' + (err.message || err);
        toast('Errore lettura PDF', 'error');
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function extractMocPdfText(typedArray) {
    if (!window.pdfjsLib) return Promise.reject(new Error('pdf.js non caricato'));
    return window.pdfjsLib.getDocument({ data: typedArray }).promise.then(function (pdf) {
      var pages = [];
      var chain = Promise.resolve('');
      // Extract text from all pages (but skip body composition)
      for (var i = 1; i <= pdf.numPages; i++) {
        (function (pageNum) {
          chain = chain.then(function (accumulated) {
            return pdf.getPage(pageNum).then(function (page) {
              return page.getTextContent().then(function (tc) {
                var pageText = tc.items.map(function (item) { return item.str; }).join(' ');
                return accumulated + '\n=== PAGE ' + pageNum + ' ===\n' + pageText;
              });
            });
          });
        })(i);
      }
      return chain;
    });
  }

  /**
   * Parse ECONET MOC-DXA PDF text into structured data.
   * Expects: patient header, Colonna AP table, Femore table, Body Composition (skipped).
   */
  function parseMocEconetText(text) {
    if (!text || text.indexOf('BIOCLINIC') === -1) return null;

    var data = { paziente: {}, colonna_ap: {}, femore: {}, dosimetria: {} };

    // ─── Patient data ───
    var m;
    m = text.match(/Cognome\s+e\s+Nome[\.\s]+([\w\s]+?)(?:\s{2,}|Data di nascita)/i);
    if (m) {
      var parts = m[1].trim().split(/\s+/);
      if (parts.length >= 2) {
        data.paziente.cognome = parts[0];
        data.paziente.nome = parts.slice(1).join(' ');
      }
    }

    m = text.match(/Data\s+di\s+nascita[\.\s]+([\d]{2})-([\d]{2})-([\d]{4})\s*\(([\d.]+)\)/i);
    if (m) {
      data.paziente.data_nascita = m[3] + '-' + m[2] + '-' + m[1]; // YYYY-MM-DD
      data.paziente.eta = parseFloat(m[4]);
    }

    m = text.match(/Sesso[\.\s]+(Femmina|Maschio|Female|Male)/i);
    if (m) data.paziente.sesso = (m[1].charAt(0) === 'F' || m[1].charAt(0) === 'f') ? 'F' : 'M';

    m = text.match(/Altezza[\.\s]+([\d.]+)\s*cm/i);
    if (m) data.paziente.altezza_cm = parseFloat(m[1]);

    m = text.match(/Peso[\.\s]+([\d.]+)\s*kg/i);
    if (m) data.paziente.peso_kg = parseFloat(m[1]);

    m = text.match(/Menopausa[\.\s]+(Si|No|Yes|Sì)/i);
    if (m) data.paziente.menopausa = (m[1] === 'No') ? 'PREMENOPAUSA' : 'POSTMENOPAUSA';

    m = text.match(/Fratture\s+da\s+fragilit[àa][\.\s]+(Si|No|Yes|Sì)/i);
    if (m) data.paziente.fratture_fragilita = (m[1] !== 'No');

    m = text.match(/Etnia[\.\s]+([A-Z]+)/i);
    if (m) data.paziente.etnia = m[1];

    m = text.match(/Medico[\.\s]+(Dott\.?(?:ssa)?\.?\s+[^\n]+?)(?:\s{2,}|Etnia)/i);
    if (m) data.paziente.medico = m[1].trim();

    m = text.match(/ID\s+Paziente[\.\s]+(\d+)/i);
    if (m) data.paziente.id_densitometro = m[1];

    // ─── Exam date ───
    m = text.match(/Data\s+di\s+stampa\s*:\s*([\d]{4}-[\d]{2}-[\d]{2})/i);
    if (m) data.data_esame = m[1];

    // ─── Colonna AP (Spine) ───
    // Find the first Colonna AP section - parse the table rows
    // Format: Region BMD T-Score Z-Score BMC Area
    // BMD pattern: must be decimal like 0.685 or 1.281 (not chart axis like 20, 30)
    // T/Z score: can be negative, like -2.2 or 0.8
    var bmdPat = '(\\d\\.\\d{2,3})';
    var scorePat = '([-]?\\d+\\.\\d+)';
    var numPat = '(\\d+\\.\\d+)';

    var spineRegions = ['L1', 'L2', 'L3', 'L4', 'L1-L2', 'L1-L3', 'L1-L4', 'L2-L3', 'L2-L4', 'L3-L4'];
    spineRegions.forEach(function (region) {
      var safeRegion = region.replace('-', '[-\\s]');
      var rx = new RegExp(
        '(?:^|[\\s])' + safeRegion + '\\s+' + bmdPat + '\\s+' + scorePat + '\\s+' + scorePat + '\\s+' + numPat + '\\s+' + numPat,
        'm'
      );
      var match = text.match(rx);
      if (match) {
        data.colonna_ap[region] = {
          bmd: parseFloat(match[1]),
          t_score: parseFloat(match[2]),
          z_score: parseFloat(match[3]),
          bmc: parseFloat(match[4]),
          area: parseFloat(match[5])
        };
      }
    });

    // ─── Femore (Hip) ───
    var hipRegions = ['Collo', 'Triangolo di Ward', 'Trocantere', 'Totale'];
    hipRegions.forEach(function (region) {
      var safeRegion = region.replace(/\s+/g, '\\s+');
      var rx = new RegExp(
        safeRegion + '\\s+' + bmdPat + '\\s+' + scorePat + '\\s+' + scorePat + '\\s+' + numPat + '\\s+' + numPat,
        'm'
      );
      var match = text.match(rx);
      if (match) {
        var key = region.toLowerCase().replace(/\s+di\s+/g, '_').replace(/\s+/g, '_');
        data.femore[key] = {
          bmd: parseFloat(match[1]),
          t_score: parseFloat(match[2]),
          z_score: parseFloat(match[3]),
          bmc: parseFloat(match[4]),
          area: parseFloat(match[5])
        };
      }
    });
    // Asse row has " - " for T/Z scores — parse separately
    var asseRx = /Asse\s+(\d\.\d{2,3})\s+[-]\s+[-]\s+(\d+\.\d+)\s+(\d+\.\d+)/m;
    var asseMatch = text.match(asseRx);
    if (asseMatch) {
      data.femore.asse = {
        bmd: parseFloat(asseMatch[1]),
        t_score: null,
        z_score: null,
        bmc: parseFloat(asseMatch[2]),
        area: parseFloat(asseMatch[3])
      };
    }

    // ─── Dosimetry ───
    m = text.match(/ESD\s+([\d.]+)\s*μGy/i);
    if (m) data.dosimetria.esd_ugy = parseFloat(m[1]);
    m = text.match(/DAP\s+([\d.]+)\s*cGy/i);
    if (m) data.dosimetria.dap_cgy_cm2 = parseFloat(m[1]);
    m = text.match(/Tensione\s*\(kV\)\s+([\d.]+)/i);
    if (m) data.dosimetria.tensione_kv = parseFloat(m[1]);
    m = text.match(/Corrente\s*\(mA\)\s+([\d.]+)/i);
    if (m) data.dosimetria.corrente_ma = parseFloat(m[1]);
    m = text.match(/Tempo\s+di\s+scansione\s+([\d:]+)/i);
    if (m) data.dosimetria.tempo_scansione = m[1];

    // ─── BMI (from body composition page, just the number) ───
    m = text.match(/Total\s+Body\s+BMI\s*:\s*([\d.]+)/i);
    if (m) data.paziente.bmi = parseFloat(m[1]);

    // Validate: must have at least spine OR femur data
    var hasSpine = Object.keys(data.colonna_ap).length > 0;
    var hasFemur = Object.keys(data.femore).length > 0;
    if (!hasSpine && !hasFemur) return null;

    return data;
  }

  /**
   * Auto-fill the AI report form fields from parsed MOC data.
   */
  function aiAutoFillFromMoc(d) {
    if (!d) return;

    // Specialty
    $('aiSpecialty').value = 'MOC_DXA';

    // Patient data
    if (d.paziente.nome) $('aiPatNome').value = d.paziente.nome;
    if (d.paziente.cognome) $('aiPatCognome').value = d.paziente.cognome;
    if (d.paziente.data_nascita) $('aiPatDob').value = d.paziente.data_nascita;
    if (d.paziente.sesso) $('aiPatSesso').value = d.paziente.sesso;
    if (d.paziente.altezza_cm) $('aiPatAltezza').value = d.paziente.altezza_cm;
    if (d.paziente.peso_kg) $('aiPatPeso').value = d.paziente.peso_kg;
    if (d.paziente.menopausa) $('aiPatMenopausa').value = d.paziente.menopausa;
    if (d.paziente.fratture_fragilita) $('aiFratture').checked = true;
    else $('aiFratture').checked = false;

    // Exam data
    if (d.data_esame) $('aiDataEsame').value = d.data_esame;
    if (d.paziente.medico) $('aiMedico').value = d.paziente.medico;

    // Technique
    $('aiTecnica').value = 'DXA ECONET InusD — Colonna AP + Femore destro';

    // Build structured values JSON (only densitometric data, no body composition)
    var valori = {};
    if (d.colonna_ap && Object.keys(d.colonna_ap).length > 0) {
      valori.colonna_ap = {};
      Object.keys(d.colonna_ap).forEach(function (k) {
        var v = d.colonna_ap[k];
        valori.colonna_ap[k] = { bmd: v.bmd, t_score: v.t_score, z_score: v.z_score };
      });
    }
    if (d.femore && Object.keys(d.femore).length > 0) {
      valori.femore_destro = {};
      Object.keys(d.femore).forEach(function (k) {
        var v = d.femore[k];
        valori.femore_destro[k] = { bmd: v.bmd, t_score: v.t_score, z_score: v.z_score };
      });
    }
    if (d.paziente.bmi) valori.bmi = d.paziente.bmi;
    if (d.paziente.etnia) valori.popolazione_riferimento = d.paziente.etnia;

    $('aiValori').value = JSON.stringify(valori, null, 2);

    // Dosimetry in technical notes
    if (d.dosimetria && Object.keys(d.dosimetria).length > 0) {
      var notes = [];
      if (d.dosimetria.esd_ugy) notes.push('ESD: ' + d.dosimetria.esd_ugy + ' μGy');
      if (d.dosimetria.dap_cgy_cm2) notes.push('DAP: ' + d.dosimetria.dap_cgy_cm2 + ' cGy·cm²');
      if (d.dosimetria.tensione_kv) notes.push('Tensione: ' + d.dosimetria.tensione_kv + ' kV');
      if (d.dosimetria.corrente_ma) notes.push('Corrente: ' + d.dosimetria.corrente_ma + ' mA');
      if (d.dosimetria.tempo_scansione) notes.push('Tempo scansione: ' + d.dosimetria.tempo_scansione);
      $('aiNoteTecniche').value = notes.join(' | ');
    }

    // Clinical indication
    if (!$('aiIndicazione').value) {
      $('aiIndicazione').value = 'Valutazione densità minerale ossea';
    }
  }

  /**
   * Cross-verify: compare patient data from PDF with CF lookup data.
   * Shows green check if matching, yellow warning if mismatch.
   */
  function aiVerifyPatientCrossCheck() {
    var alert = $('aiMocVerifyAlert');
    var icon = $('aiMocVerifyIcon');
    var text = $('aiMocVerifyText');
    if (!alert) return;

    var mocData = state._aiMocData;
    // Check if we have CF lookup data (from DB or GIPO)
    var cfName = $('aiPatNome').value.trim();
    var cfSurname = $('aiPatCognome').value.trim();
    var cfDob = $('aiPatDob').value;

    // If no CF lookup was done yet, just show info
    if (!state._aiPatientId && !state._aiGipoData) {
      // No CF lookup done - remind user to verify
      if (mocData && mocData.paziente.nome) {
        alert.hidden = false;
        alert.style.background = '#eff6ff';
        alert.style.border = '1px solid #93c5fd';
        alert.style.color = '#1e40af';
        icon.setAttribute('stroke', '#3b82f6');
        text.innerHTML = '<strong>Dati estratti dal PDF:</strong> ' +
          esc(mocData.paziente.cognome || '') + ' ' + esc(mocData.paziente.nome || '') +
          (mocData.paziente.data_nascita ? ' — nato/a ' + mocData.paziente.data_nascita : '') +
          '<br><em>Inserire il Codice Fiscale e cliccare "Cerca" per la verifica incrociata.</em>';
      }
      return;
    }

    // We have both PDF and CF data — cross-check
    if (!mocData || !mocData.paziente) return;

    var pdfNome = (mocData.paziente.nome || '').toUpperCase().trim();
    var pdfCognome = (mocData.paziente.cognome || '').toUpperCase().trim();
    var pdfDob = mocData.paziente.data_nascita || '';

    var dbNome = cfName.toUpperCase().trim();
    var dbCognome = cfSurname.toUpperCase().trim();
    var dbDob = cfDob;

    var mismatches = [];
    if (dbCognome && pdfCognome && dbCognome !== pdfCognome) {
      mismatches.push('Cognome: DB="' + dbCognome + '" / PDF="' + pdfCognome + '"');
    }
    if (dbNome && pdfNome && dbNome !== pdfNome) {
      mismatches.push('Nome: DB="' + dbNome + '" / PDF="' + pdfNome + '"');
    }
    if (dbDob && pdfDob && dbDob !== pdfDob) {
      mismatches.push('Data nascita: DB="' + dbDob + '" / PDF="' + pdfDob + '"');
    }

    alert.hidden = false;
    if (mismatches.length === 0) {
      // Match
      alert.style.background = '#f0fdf4';
      alert.style.border = '1px solid #86efac';
      alert.style.color = '#166534';
      icon.setAttribute('stroke', '#22c55e');
      icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
      text.innerHTML = '<strong>Verifica incrociata OK</strong> — I dati paziente del PDF corrispondono all\'anagrafica.';
    } else {
      // Mismatch!
      alert.style.background = '#fef3c7';
      alert.style.border = '1px solid #fbbf24';
      alert.style.color = '#92400e';
      icon.setAttribute('stroke', '#f59e0b');
      icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
      text.innerHTML = '<strong>ATTENZIONE — Discrepanza dati paziente!</strong><br>' +
        mismatches.map(function (m) { return '• ' + esc(m); }).join('<br>') +
        '<br><em>Verificare manualmente prima di generare il referto.</em>';
      toast('Attenzione: discrepanza dati paziente PDF vs anagrafica', 'warning');
    }
  }

  function aiGenerateReport() {
    // Validate required fields
    var specialty = $('aiSpecialty').value;
    if (!specialty) {
      toast('Seleziona una specialità', 'warning');
      $('aiSpecialty').focus();
      return;
    }

    var valori = $('aiValori').value.trim();
    if (!valori) {
      toast('Inserisci i valori dell\'esame', 'warning');
      $('aiValori').focus();
      return;
    }

    // Parse values — try JSON first, fall back to text
    var valoriStrutturati;
    try {
      valoriStrutturati = JSON.parse(valori);
    } catch (e) {
      // Treat as free text — wrap in object
      valoriStrutturati = { testo_libero: valori };
    }

    // Parse multi-line text fields
    function parseLines(id) {
      var val = $(id).value.trim();
      if (!val) return [];
      return val.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    }

    // Build input JSON
    var inputData = {
      paziente: {
        nome: $('aiPatNome').value.trim() || undefined,
        cognome: $('aiPatCognome').value.trim() || undefined,
        data_nascita: $('aiPatDob').value || undefined,
        sesso: $('aiPatSesso').value,
        altezza_cm: $('aiPatAltezza').value ? Number($('aiPatAltezza').value) : undefined,
        peso_kg: $('aiPatPeso').value ? Number($('aiPatPeso').value) : undefined,
        stato_menopausale: $('aiPatMenopausa').value
      },
      anamnesi: {
        fratture_fragilita: $('aiFratture').checked,
        patologie_note: parseLines('aiPatologie'),
        terapie_in_corso: parseLines('aiTerapie'),
        fattori_rischio: parseLines('aiFattoriRischio'),
        note_libere: $('aiNoteAnamnesi').value.trim() || undefined
      },
      esame_attuale: {
        specialita: specialty,
        data_esame: $('aiDataEsame').value || undefined,
        struttura: 'Bio-Clinic S.r.l. — Sassari',
        medico_esecutore: $('aiMedico').value.trim() || undefined,
        indicazione_clinica: $('aiIndicazione').value.trim() || undefined,
        tecnica: $('aiTecnica').value.trim() || undefined,
        valori_strutturati: valoriStrutturati,
        note_tecniche: $('aiNoteTecniche').value.trim() || undefined
      },
      workflow: {
        id_referto_temp: 'REF-AI-' + Date.now(),
        stato_corrente: 'DRAFT_DA_VALIDARE',
        medico_validatore_atteso: $('aiValidatore').value.trim() || undefined
      }
    };

    // Parse storico if provided
    var storicoText = $('aiStorico').value.trim();
    if (storicoText) {
      try {
        inputData.storico_referti = JSON.parse(storicoText);
      } catch (e) {
        inputData.storico_referti = [{ testo: storicoText }];
      }
    }

    // Show loading
    $('aiStep1').hidden = true;
    $('aiResult').hidden = true;
    $('aiLoading').hidden = false;

    var startTime = Date.now();
    if (_aiTimerInterval) clearInterval(_aiTimerInterval);
    $('aiTimer').textContent = '0s';
    _aiTimerInterval = setInterval(function () {
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      $('aiTimer').textContent = elapsed + 's';
    }, 1000);

    // Call API
    var token = state.token;
    fetch('/api/ai/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(inputData)
    })
    .then(function (resp) {
      // Guard: if response is not JSON, handle gracefully
      var ct = resp.headers.get('content-type') || '';
      if (!resp.ok && !ct.includes('application/json')) {
        throw new Error('Errore server (' + resp.status + '). Riprovare.');
      }
      return resp.text().then(function (text) {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('[AI] Response parse error. Status:', resp.status, 'Body:', text.substring(0, 500));
          throw new Error('Risposta non valida dal server (status ' + resp.status + '). Riprovare tra qualche istante.');
        }
      });
    })
    .then(function (result) {
      clearInterval(_aiTimerInterval);
      $('aiLoading').hidden = true;

      if (!result.success) {
        $('aiStep1').hidden = false;
        toast(result.error || 'Errore nella generazione', 'error');
        return;
      }

      // Display results
      displayAIResult(result.data);
    })
    .catch(function (err) {
      clearInterval(_aiTimerInterval);
      $('aiLoading').hidden = true;
      $('aiStep1').hidden = false;
      toast('Errore: ' + (err.message || err), 'error');
    });
  }

  function displayAIResult(data) {
    // Report text — format markdown-like headers
    var text = data.report_text || data.raw_response || 'Nessun testo generato';
    // Convert markdown headers to styled HTML
    text = text.replace(/^### (\d+)\. (.+)$/gm, '<h4 style="color:var(--primary);margin:1.2rem 0 0.5rem;font-size:1rem">$1. $2</h4>');
    text = text.replace(/^### (.+)$/gm, '<h4 style="color:var(--primary);margin:1.2rem 0 0.5rem;font-size:1rem">$1</h4>');
    text = text.replace(/^## (.+)$/gm, '<h3 style="margin:1rem 0 0.5rem">$1</h3>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-color);margin:1rem 0">');
    // Format tables
    text = text.replace(/\|(.+)\|/g, function (match) {
      var cells = match.split('|').filter(Boolean).map(function (c) { return c.trim(); });
      if (cells.every(function (c) { return /^[-:]+$/.test(c); })) return ''; // skip separator rows
      return '<tr>' + cells.map(function (c) { return '<td style="padding:0.3rem 0.6rem;border:1px solid var(--border-color)">' + c + '</td>'; }).join('') + '</tr>';
    });
    // Wrap consecutive <tr> in table
    text = text.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;margin:0.5rem 0;font-size:0.85rem">$1</table></div>');

    $('aiReportText').innerHTML = text;

    // Alerts
    var alertsHtml = '';
    if (data.report_json) {
      var rj = data.report_json;
      if (rj.alert_rosso) {
        alertsHtml += '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:0.75rem 1rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.5rem">' +
          '<span style="font-size:1.3rem">&#9888;</span>' +
          '<strong style="color:#dc2626">ALERT ROSSO — Richiede valutazione specialistica tempestiva</strong></div>';
      }
      if (rj.richiede_consulto_specialistico) {
        alertsHtml += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:0.75rem 1rem;margin-bottom:0.5rem">' +
          '<strong style="color:#d97706">Consulto specialistico raccomandato</strong></div>';
      }
      alertsHtml += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:0.75rem 1rem;margin-bottom:0.5rem">' +
        '<strong style="color:#2563eb">Stato: ' + (rj.stato || 'DRAFT_DA_VALIDARE') + '</strong>' +
        ' &mdash; Fascia: ' + (rj.fascia_refertazione || 'N/D') +
        ' &mdash; Specialità: ' + (rj.specialita || 'N/D') + '</div>';
    }
    $('aiAlerts').innerHTML = alertsHtml;

    // Criticità
    if (data.report_json && data.report_json.criticita && data.report_json.criticita.length > 0) {
      var critHtml = data.report_json.criticita.map(function (c) {
        var color = c.gravita === 'ALTA' ? '#dc2626' : (c.gravita === 'MEDIA' ? '#d97706' : '#059669');
        var bgColor = c.gravita === 'ALTA' ? '#fef2f2' : (c.gravita === 'MEDIA' ? '#fffbeb' : '#ecfdf5');
        return '<div style="background:' + bgColor + ';border-left:4px solid ' + color + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:0 8px 8px 0">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">' +
          '<strong style="color:' + color + '">' + esc(c.tipo) + '</strong>' +
          '<span class="badge" style="background:' + color + ';color:#fff;font-size:0.7rem">' + esc(c.gravita) + '</span></div>' +
          '<p style="margin:0.3rem 0;font-size:0.9rem">' + esc(c.descrizione) + '</p>' +
          '<p style="margin:0;font-size:0.82rem;color:var(--text-secondary)"><em>Azione: ' + esc(c.azione_consigliata) + '</em></p></div>';
      }).join('');
      $('aiCriticita').innerHTML = critHtml;
      $('aiCriticitaCard').hidden = false;
    } else {
      $('aiCriticitaCard').hidden = true;
    }

    // Metadata
    if (data.metadata) {
      var m = data.metadata;
      $('aiMetadata').innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.5rem">' +
        '<div><strong>Modello:</strong> ' + esc(m.model || '--') + '</div>' +
        '<div><strong>Token input:</strong> ' + (m.input_tokens || 0).toLocaleString() + '</div>' +
        '<div><strong>Token output:</strong> ' + (m.output_tokens || 0).toLocaleString() + '</div>' +
        '<div><strong>Tempo:</strong> ' + ((m.elapsed_ms || 0) / 1000).toFixed(1) + 's</div>' +
        '<div><strong>Prompt:</strong> ' + esc(m.prompt_version || 'v1.0') + '</div>' +
        '<div><strong>Stop reason:</strong> ' + esc(m.stop_reason || '--') + '</div></div>';
    }

    // JSON viewer
    if (data.report_json) {
      $('aiJsonContent').textContent = JSON.stringify(data.report_json, null, 2);
    } else {
      $('aiJsonContent').textContent = '// JSON non disponibile — verifica la risposta AI';
    }
    $('aiJsonViewer').hidden = true;

    // Show result
    $('aiResult').hidden = false;

    // Store last AI result for finalize — reset edit state
    state._aiLastResult = data;
    state._aiEditedText = null;
    state._aiEditMode = false;
    // Reset edit UI
    if ($('aiReportEdit')) $('aiReportEdit').style.display = 'none';
    if ($('aiReportText')) $('aiReportText').style.display = '';
    if ($('aiEditHint')) $('aiEditHint').style.display = 'none';
    if ($('aiDraftBadge')) { $('aiDraftBadge').textContent = 'DRAFT — DA VALIDARE'; $('aiDraftBadge').style.background = ''; $('aiDraftBadge').style.color = ''; }
    if ($('aiEditToggleBtn')) $('aiEditToggleBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.3rem"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifica';
    // Reset finalize button
    if ($('aiFinalizeBtn')) { $('aiFinalizeBtn').textContent = ''; $('aiFinalizeBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.4rem"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Valida e Rilascia al Paziente'; $('aiFinalizeBtn').style.background = '#00704A'; }
    if ($('aiFinalizeProgress')) $('aiFinalizeProgress').hidden = true;
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * PDF GENERATION — pdf-lib + jsPDF
   * ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Print/Download the report as PDF (independent from finalization).
   * Uses the edited text if available, otherwise the original AI text.
   * Includes MOC PDF pages at the beginning if available.
   */
  function aiPrintReportPdf() {
    // Get the current report text (edited takes priority)
    var reportText = getEditedReportText();
    if (!reportText || reportText.length < 20) {
      toast('Nessun testo del referto disponibile per la stampa', 'warning');
      return;
    }

    var patientName = (($('aiPatNome').value || '') + ' ' + ($('aiPatCognome').value || '')).trim();
    var patientCf = ($('aiFiscal') && $('aiFiscal').value.trim().toUpperCase()) || '';
    var patientDob = $('aiPatDob').value || '';
    var examDate = $('aiDataEsame').value || new Date().toISOString().slice(0, 10);
    var doctorName = $('aiMedico').value.trim() || $('aiValidatore').value.trim() || '';

    toast('Generazione PDF in corso...', 'info');

    generateFullReportPdf({
      reportText: reportText,
      patientName: patientName,
      patientDob: patientDob,
      patientCf: patientCf,
      examDate: examDate,
      doctorName: doctorName,
      mocFile: state._aiMocFile || null
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var filename = 'Referto_MOC_DXA' + (patientCf ? '_' + patientCf : '') + '_' + examDate + '.pdf';

      // Open in new tab for print
      var newTab = window.open(url, '_blank');
      if (newTab) {
        setTimeout(function () {
          try { newTab.print(); } catch (e) { /* user prints manually */ }
        }, 1500);
        toast('PDF aperto in nuova scheda — pronto per la stampa', 'success');
      } else {
        // Popup blocked — download
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('PDF scaricato: ' + filename, 'success');
      }
      setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
    }).catch(function (err) {
      toast('Errore generazione PDF: ' + err.message, 'error');
      console.error('[PDF]', err);
    });
  }

  /**
   * Get the current report text — prioritizes edited text.
   */
  function getEditedReportText() {
    if (state._aiEditedText) return state._aiEditedText;
    if (state._aiEditMode && $('aiReportEdit')) return $('aiReportEdit').value;
    if (state._aiLastResult) return state._aiLastResult.report_text || state._aiLastResult.raw_response || '';
    return $('aiReportText') ? $('aiReportText').innerText : '';
  }

  // Logo bytes cache
  var _logoPngBytes = null;
  var _logoFetched = false;

  function fetchLogoPng() {
    if (_logoFetched) return Promise.resolve(_logoPngBytes);
    return fetch('/images/logo-bioclinic-referto.png')
      .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
      .then(function (buf) { _logoPngBytes = buf; _logoFetched = true; return buf; })
      .catch(function () { _logoFetched = true; return null; });
  }

  /**
   * Generate the full report PDF using pdf-lib.
   * Structure:
   *   1. MOC PDF original pages (if available)
   *   2. Report cover page (logo, patient info)
   *   3. Report body pages (AI text, formatted)
   *   4. Signature page
   *
   * Returns: Promise<Blob>
   */
  function generateFullReportPdf(opts) {
    var PDFLib = window.PDFLib;
    if (!PDFLib) {
      return Promise.reject(new Error('pdf-lib non caricato. Ricaricare la pagina.'));
    }

    var PDFDocument = PDFLib.PDFDocument;
    var rgb = PDFLib.rgb;
    var StandardFonts = PDFLib.StandardFonts;

    return fetchLogoPng().then(function (logoBytes) {
      return PDFDocument.create().then(function (pdfDoc) {

        // ── Colors (matching logo: gray tones + green accent) ──────────
        var GRAY_DARK = rgb(0.27, 0.27, 0.27);     // #454545 — body text
        var GRAY_MED = rgb(0.45, 0.45, 0.45);      // #737373 — secondary
        var GRAY_LIGHT = rgb(0.62, 0.62, 0.62);    // #9e9e9e — footer
        var GREEN_ACCENT = rgb(0.22, 0.55, 0.22);  // #388E3C — green leaf
        var LINE_COLOR = rgb(0.78, 0.78, 0.78);    // #c7c7c7 — separator

        // ── Fonts ─────────────────────────────────────────────────────
        return Promise.all([
          pdfDoc.embedFont(StandardFonts.Helvetica),
          pdfDoc.embedFont(StandardFonts.HelveticaBold)
        ]).then(function (fonts) {
          var fontRegular = fonts[0];
          var fontBold = fonts[1];

          // ── STEP 1: Embed MOC PDF pages at beginning ────────────────
          var embedMocPromise;
          if (opts.mocFile) {
            embedMocPromise = opts.mocFile.arrayBuffer().then(function (mocBuffer) {
              return PDFDocument.load(new Uint8Array(mocBuffer), { ignoreEncryption: true }).then(function (mocDoc) {
                var pageCount = mocDoc.getPageCount();
                return pdfDoc.copyPages(mocDoc, Array.from({length: pageCount}, function(_, i) { return i; })).then(function (copiedPages) {
                  copiedPages.forEach(function (p) { pdfDoc.addPage(p); });
                  return pageCount;
                });
              });
            }).catch(function (err) {
              console.warn('[PDF] Could not embed MOC pages:', err.message);
              return 0;
            });
          } else {
            embedMocPromise = Promise.resolve(0);
          }

          return embedMocPromise.then(function (mocPageCount) {

            // ── Page dimensions ────────────────────────────────────────
            var W = 595.28; // A4 width in points
            var H = 841.89; // A4 height in points
            var ML = 56;    // margin left (20mm)
            var MR = 56;    // margin right
            var MT = 45;    // margin top
            var MB = 50;    // margin bottom
            var CW = W - ML - MR; // content width

            // ── Helper: sanitize text for WinAnsi encoding ────────
            // pdf-lib standard fonts (Helvetica) only support WinAnsi.
            // Greek letters, math symbols etc. must be replaced.
            function sanitizeWinAnsi(text) {
              if (!text) return '';
              return text
                .replace(/\u03bc/g, 'u')      // mu -> u (micro)
                .replace(/\u03b1/g, 'alfa')    // alpha
                .replace(/\u03b2/g, 'beta')    // beta
                .replace(/\u03b3/g, 'gamma')   // gamma
                .replace(/\u03b4/g, 'delta')   // delta
                .replace(/\u03c3/g, 'sigma')   // sigma
                .replace(/\u03c1/g, 'rho')     // rho
                .replace(/\u0394/g, 'Delta')   // Delta
                .replace(/\u2265/g, '>=')      // >=
                .replace(/\u2264/g, '<=')      // <=
                .replace(/\u2192/g, '->')      // ->
                .replace(/\u2190/g, '<-')      // <-
                .replace(/\u2248/g, '~')       // approx
                .replace(/\u2260/g, '!=')      // not equal
                .replace(/\u221e/g, 'inf')     // infinity
                .replace(/\u2013/g, '-')       // en dash
                .replace(/\u2014/g, '--')      // em dash
                .replace(/\u2018/g, "'")       // left single quote
                .replace(/\u2019/g, "'")       // right single quote
                .replace(/\u201c/g, '"')       // left double quote
                .replace(/\u201d/g, '"')       // right double quote
                .replace(/\u2022/g, '-')       // bullet
                .replace(/\u2026/g, '...')     // ellipsis
                .replace(/[^\x00-\xFF]/g, ''); // strip remaining non-Latin1
            }

            // ── Helper: add footer to a page ──────────────────────────
            function drawFooter(page, pageNum) {
              var footerY = 30;
              page.drawLine({ start: { x: ML, y: footerY + 8 }, end: { x: W - MR, y: footerY + 8 }, thickness: 0.5, color: LINE_COLOR });
              page.drawText('Bio-Clinic S.r.l. — Via Renzo Mossa 23, 07100 Sassari — referti.bio-clinic.it', {
                x: ML, y: footerY, size: 7, font: fontRegular, color: GRAY_LIGHT
              });
              page.drawText('Pag. ' + pageNum, {
                x: W - MR - 25, y: footerY, size: 7, font: fontRegular, color: GRAY_LIGHT
              });
            }

            // ── Helper: draw logo on a page ───────────────────────────
            var logoImage = null;
            var embedLogoPromise;
            if (logoBytes) {
              embedLogoPromise = pdfDoc.embedPng(logoBytes).then(function (img) { logoImage = img; });
            } else {
              embedLogoPromise = Promise.resolve();
            }

            return embedLogoPromise.then(function () {

              // ═══════════════════════════════════════════════════════════
              // PAGE: Report cover / header
              // ═══════════════════════════════════════════════════════════
              var page = pdfDoc.addPage([W, H]);
              var y = H - MT;
              var currentPageNum = mocPageCount + 1;

              // Logo
              if (logoImage) {
                var logoW = 180;
                var logoH = logoW * (logoImage.height / logoImage.width);
                page.drawImage(logoImage, { x: ML, y: y - logoH, width: logoW, height: logoH });
                y -= logoH + 12;
              } else {
                page.drawText('bioclinic', { x: ML, y: y - 20, size: 22, font: fontBold, color: GRAY_DARK });
                y -= 32;
              }

              // Clinic address
              page.drawText('Via Renzo Mossa 23, 07100 Sassari — Tel. 079 956 1332 — gestione@bio-clinic.it', {
                x: ML, y: y, size: 8, font: fontRegular, color: GRAY_MED
              });
              y -= 16;

              // Green separator line
              page.drawLine({ start: { x: ML, y: y }, end: { x: W - MR, y: y }, thickness: 1.5, color: GREEN_ACCENT });
              y -= 25;

              // Title
              page.drawText('REFERTO DENSITOMETRIA OSSEA (MOC-DXA)', {
                x: ML, y: y, size: 13, font: fontBold, color: GRAY_DARK
              });
              y -= 25;

              // Patient info box
              var infoLines = [];
              if (opts.patientName) infoLines.push(['Paziente:', opts.patientName]);
              if (opts.patientCf) infoLines.push(['Codice Fiscale:', opts.patientCf]);
              if (opts.patientDob) infoLines.push(['Data di nascita:', opts.patientDob]);
              if (opts.examDate) infoLines.push(['Data esame:', opts.examDate]);

              infoLines.forEach(function (pair) {
                page.drawText(pair[0], { x: ML, y: y, size: 9.5, font: fontBold, color: GRAY_DARK });
                page.drawText(pair[1], { x: ML + 100, y: y, size: 9.5, font: fontRegular, color: GRAY_DARK });
                y -= 16;
              });

              y -= 10;
              page.drawLine({ start: { x: ML, y: y }, end: { x: W - MR, y: y }, thickness: 0.5, color: LINE_COLOR });
              y -= 20;

              // ═══════════════════════════════════════════════════════════
              // REPORT BODY TEXT
              // ═══════════════════════════════════════════════════════════
              var plainText = opts.reportText || '';
              plainText = plainText.replace(/```json[\s\S]*?```/g, '');
              plainText = plainText.replace(/```[\s\S]*?```/g, '');
              plainText = sanitizeWinAnsi(plainText);

              var textLines = plainText.split('\n');
              var fontSize = 9;
              var lineHeight = 14;
              var headerSize = 10.5;

              for (var i = 0; i < textLines.length; i++) {
                var rawLine = textLines[i];

                // Check if we need a new page
                if (y < MB + 20) {
                  drawFooter(page, currentPageNum);
                  page = pdfDoc.addPage([W, H]);
                  currentPageNum++;
                  y = H - MT;
                }

                // Detect headers
                var isHeader = /^#{2,3}\s/.test(rawLine) || /^\d+\.\s+[A-Z]/.test(rawLine);
                var cleanLine = rawLine.replace(/^#{2,3}\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^---$/, '');

                if (rawLine.trim() === '---') {
                  // Separator
                  y -= 5;
                  page.drawLine({ start: { x: ML, y: y }, end: { x: W - MR, y: y }, thickness: 0.5, color: LINE_COLOR });
                  y -= 10;
                  continue;
                }

                if (!cleanLine.trim()) {
                  y -= lineHeight * 0.6;
                  continue;
                }

                var currentFont = isHeader ? fontBold : fontRegular;
                var currentSize = isHeader ? headerSize : fontSize;
                var currentColor = isHeader ? GRAY_DARK : GRAY_DARK;

                if (isHeader) y -= 4; // extra space before header

                // Word wrap
                var words = cleanLine.split(' ');
                var wrappedLines = [];
                var currentLine = '';
                for (var w = 0; w < words.length; w++) {
                  var testLine = currentLine ? currentLine + ' ' + words[w] : words[w];
                  var testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
                  if (testWidth > CW && currentLine) {
                    wrappedLines.push(currentLine);
                    currentLine = words[w];
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) wrappedLines.push(currentLine);

                for (var wl = 0; wl < wrappedLines.length; wl++) {
                  if (y < MB + 20) {
                    drawFooter(page, currentPageNum);
                    page = pdfDoc.addPage([W, H]);
                    currentPageNum++;
                    y = H - MT;
                  }
                  page.drawText(wrappedLines[wl], {
                    x: ML, y: y, size: currentSize, font: currentFont, color: currentColor
                  });
                  y -= lineHeight;
                }

                if (isHeader) y -= 2; // extra space after header
              }

              // ═══════════════════════════════════════════════════════════
              // SIGNATURE SECTION
              // ═══════════════════════════════════════════════════════════
              if (y < MB + 80) {
                drawFooter(page, currentPageNum);
                page = pdfDoc.addPage([W, H]);
                currentPageNum++;
                y = H - MT;
              }

              y -= 30;

              // Date
              var today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
              page.drawText('Sassari, ' + today, {
                x: ML, y: y, size: 9.5, font: fontRegular, color: GRAY_DARK
              });
              y -= 30;

              // Doctor signature
              var sigX = W - MR - 170;
              page.drawText('Il Medico Refertante', {
                x: sigX, y: y, size: 9.5, font: fontBold, color: GRAY_DARK
              });
              y -= 16;
              page.drawText(opts.doctorName || 'Dott./Dott.ssa', {
                x: sigX, y: y, size: 9.5, font: fontRegular, color: GRAY_DARK
              });
              y -= 20;
              page.drawLine({ start: { x: sigX, y: y }, end: { x: sigX + 150, y: y }, thickness: 0.5, color: GRAY_MED });
              y -= 10;
              page.drawText('(firma digitale / autografa)', {
                x: sigX, y: y, size: 7.5, font: fontRegular, color: GRAY_LIGHT
              });

              // Footer on last page
              drawFooter(page, currentPageNum);

              // ═══════════════════════════════════════════════════════════
              // SAVE
              // ═══════════════════════════════════════════════════════════
              return pdfDoc.save();
            });
          });
        });
      });
    }).then(function (pdfBytes) {
      return new Blob([pdfBytes], { type: 'application/pdf' });
    });
  }

  /**
   * Generate report PDF blob for upload (used by finalize workflow).
   * Same as generateFullReportPdf but without MOC pages (those are uploaded separately).
   */
  function generateReportPdfForUpload(opts) {
    return generateFullReportPdf({
      reportText: opts.reportText,
      patientName: opts.patientName,
      patientDob: opts.patientDob,
      patientCf: opts.patientCf,
      examDate: opts.examDate,
      doctorName: opts.doctorName,
      mocFile: null // MOC uploaded separately in finalize
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * FINALIZE REPORT WORKFLOW
   * ══════════════════════════════════════════════════════════════════════════ */

  function initFinalizeButton() {
    var btn = $('aiFinalizeBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      // Confirm before proceeding
      if (!confirm('Stai per:\n1. Generare il PDF del referto\n2. Caricare il PDF MOC originale e il referto\n3. Validare, firmare e rilasciare al paziente\n4. Inviare notifica email\n\nConfermi?')) {
        return;
      }
      startFinalizeWorkflow();
    });
  }

  function startFinalizeWorkflow() {
    var progressEl = $('aiFinalizeProgress');
    var stepsEl = $('aiFinalizeSteps');
    var barEl = $('aiFinalizeBar');
    var btn = $('aiFinalizeBtn');

    if (!progressEl || !stepsEl || !barEl) return;

    // Disable button
    btn.disabled = true;
    btn.style.opacity = '0.6';
    progressEl.hidden = false;
    stepsEl.innerHTML = '';
    barEl.style.width = '0%';

    function addStep(text, status) {
      var icon = status === 'ok' ? '&#10003;' : (status === 'error' ? '&#10007;' : '&#9679;');
      var color = status === 'ok' ? '#22c55e' : (status === 'error' ? '#dc2626' : '#f59e0b');
      stepsEl.innerHTML += '<div style="display:flex;align-items:center;gap:0.5rem">' +
        '<span style="color:' + color + ';font-weight:bold">' + icon + '</span> ' + text + '</div>';
    }

    function setProgress(pct) {
      barEl.style.width = pct + '%';
    }

    // ── Gather data ─────────────────────────────────────────────────────
    var fiscalCode = ($('aiFiscal') && $('aiFiscal').value.trim().toUpperCase()) || '';
    var patientName = (($('aiPatNome').value || '') + ' ' + ($('aiPatCognome').value || '')).trim();
    var patientDob = $('aiPatDob').value || '';
    var examDate = $('aiDataEsame').value || new Date().toISOString().slice(0, 10);
    var doctorName = $('aiMedico').value.trim() || $('aiValidatore').value.trim() || '';
    var patientGender = $('aiPatSesso').value || '';

    if (!fiscalCode || fiscalCode.length !== 16) {
      addStep('Codice Fiscale mancante o non valido', 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
      toast('Inserire il Codice Fiscale del paziente prima di finalizzare', 'error');
      return;
    }

    if (!patientName || patientName.length < 3) {
      addStep('Nome/cognome paziente mancante', 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
      toast('Inserire nome e cognome del paziente', 'error');
      return;
    }

    if (!state._aiLastResult) {
      addStep('Nessun referto AI generato', 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
      toast('Generare il referto AI prima di finalizzare', 'error');
      return;
    }

    addStep('Preparazione dati...', 'ok');
    setProgress(10);

    // ── Step 1: Generate PDF report ──────────────────────────────────────
    addStep('Generazione PDF referto...', 'pending');
    setProgress(20);

    var reportText = getEditedReportText();

    generateReportPdfForUpload({
      reportText: reportText,
      patientName: patientName,
      patientDob: patientDob,
      patientCf: fiscalCode,
      examDate: examDate,
      doctorName: doctorName
    }).then(function (reportBlob) {

      // Update step to OK
      var stepDivs = stepsEl.querySelectorAll('div');
      if (stepDivs.length >= 2) {
        stepDivs[stepDivs.length - 1].querySelector('span').innerHTML = '&#10003;';
        stepDivs[stepDivs.length - 1].querySelector('span').style.color = '#22c55e';
      }
      setProgress(40);

      // ── Step 2: Prepare FormData and call finalize API ──────────────
      addStep('Caricamento file e finalizzazione...', 'pending');
      setProgress(50);

      var formData = new FormData();
      formData.append('report_pdf', reportBlob, 'referto_moc_dxa.pdf');

      // Add original MOC PDF if available
      if (state._aiMocFile) {
        formData.append('moc_pdf', state._aiMocFile, state._aiMocFile.name || 'moc_originale.pdf');
      }

      // Patient data
      formData.append('patient_data', JSON.stringify({
        fiscal_code: fiscalCode,
        first_name: $('aiPatNome').value.trim(),
        last_name: $('aiPatCognome').value.trim(),
        date_of_birth: patientDob || undefined,
        gender: patientGender || undefined
      }));

      // Report data
      var hasAbnormal = !!(state._aiLastResult.report_json && state._aiLastResult.report_json.alert_rosso);
      formData.append('report_data', JSON.stringify({
        report_type: 'MOC-DXA Densitometria Ossea',
        category: 'densitometria',
        sample_date: examDate,
        doctor_name: doctorName,
        is_urgent: false,
        has_abnormal_values: hasAbnormal
      }));

      return fetch('/api/ai/finalize-report', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + state.token
        },
        body: formData
      })
      .then(function (resp) {
        return resp.text().then(function (text) {
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('[Finalize] Response parse error. Status:', resp.status, 'Body:', text.substring(0, 500));
            throw new Error('Risposta non valida dal server (status ' + resp.status + '). Dettaglio: ' + text.substring(0, 200));
          }
        });
      })
      .then(function (result) {
        // Update step
        var lastStep = stepsEl.querySelectorAll('div');
        if (lastStep.length >= 3) {
          lastStep[lastStep.length - 1].querySelector('span').innerHTML = '&#10003;';
          lastStep[lastStep.length - 1].querySelector('span').style.color = '#22c55e';
        }
        setProgress(80);

        if (!result.success) {
          addStep('Errore: ' + (result.error || 'Errore sconosciuto'), 'error');
          btn.disabled = false;
          btn.style.opacity = '1';
          toast('Errore nella finalizzazione: ' + (result.error || ''), 'error');
          return;
        }

        // Success!
        setProgress(100);
        addStep('Referto creato: ' + result.data.report_number, 'ok');
        addStep('Stato: RILASCIATO al paziente', 'ok');
        if (result.data.email_sent) {
          addStep('Email notifica inviata', 'ok');
        } else {
          addStep('Email: non inviata (verificare configurazione)', 'pending');
        }

        // Show steps detail
        if (result.data.steps) {
          var detail = result.data.steps.map(function (s) {
            return s.replace(/_/g, ' ');
          }).join(' \u2192 ');
          addStep('Pipeline: ' + detail, 'ok');
        }

        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = 'Completato \u2713';
        btn.style.background = '#22c55e';

        toast('Referto ' + result.data.report_number + ' rilasciato con successo al paziente ' + (result.data.patient_name || ''), 'success');
      });
    }).catch(function (err) {
      addStep('Errore: ' + (err.message || err), 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
      toast('Errore durante la finalizzazione: ' + (err.message || ''), 'error');
    });
  }

  // Wire finalize button after AI report section is ready
  initFinalizeButton();

})();
