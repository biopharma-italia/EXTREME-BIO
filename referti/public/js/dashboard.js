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
    physician: 'Medico', admin: 'Amministratore', super_admin: 'Super Admin'
  };
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
  function sbPost(table, data) {
    return fetch(SB_URL + '/rest/v1/' + table, {
      method: 'POST', headers: Object.assign({}, sbHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    });
  }
  function sbPatch(table, query, data) {
    return fetch(SB_URL + '/rest/v1/' + table + '?' + query, {
      method: 'PATCH', headers: Object.assign({}, sbHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
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
      if (data.email_sent) {
        toast('Email inviata a ' + data.patient_email, 'success');
      } else if (data.success) {
        toast('Notifica in-app inviata (email non configurata)', 'info');
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
      case 'queue': loadQueue(); break;
      case 'sign-release': loadSignRelease(); break;
      case 'all-reports': loadAllReports(); break;
      case 'users': loadUsers(); break;
      case 'audit': loadAuditLog(); break;
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
      $('userRole').textContent = ROLE_LABELS[profile.role] || profile.role;
      // Avatar uses logo image — do not overwrite with initials
      updateSidebarForRole(profile.role);
      loadDashboardBadges(profile.role);
    }

    function applyFallback() {
      $('userName').textContent = name;
      $('userRole').textContent = ROLE_LABELS[meta.role || 'patient'] || 'Paziente';
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
    // Load badge counts for sidebar
    if (role === 'lab_technician' || role === 'admin' || role === 'super_admin') {
      sbGet('reports', 'status=eq.pending&select=id&limit=200').then(function (data) {
        updateBadge('badgePending', data ? data.length : 0);
      });
    }
    if (role === 'physician' || role === 'admin' || role === 'super_admin') {
      sbGet('reports', 'or=(status.eq.validated,status.eq.signed)&select=id&limit=200').then(function (data) {
        updateBadge('badgeSign', data ? data.length : 0);
      });
    }
    if (role === 'patient') {
      sbGet('reports', 'status=eq.released&patient_downloaded=eq.false&select=id&limit=50').then(function (data) {
        updateBadge('badgeNewReports', data ? data.length : 0);
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

      var available = 0, inProgress = 0, downloaded = 0;
      var rows = data.map(function (r) {
        if (r.status === 'released') available++;
        else inProgress++;
        if (r.download_count > 0) downloaded++;

        var urgentBadge = r.is_urgent ? ' <span class="badge badge-urgent" title="Urgente">!</span>' : '';
        var abnormalBadge = r.has_abnormal_values ? ' <span class="badge badge-abnormal" title="Valori anomali">A</span>' : '';
        var newBadge = (r.status === 'released' && !r.patient_viewed) ? ' <span class="badge" style="background:#ef4444;color:#fff;font-size:0.7rem;animation:pulse 2s infinite">NUOVO</span>' : '';

        // P1-8: Auto-mark viewed when patient loads report list
        if (r.status === 'released' && !r.patient_viewed && state.profile && state.profile.role === 'patient') {
          // Don't auto-mark here; only on explicit detail/download
        }

        return '<tr>' +
          '<td><strong>' + esc(r.report_number || '--') + '</strong>' + urgentBadge + abnormalBadge + newBadge + '</td>' +
          '<td>' + esc(r.report_type || '--') + '</td>' +
          '<td>' + esc(r.category || '--') + '</td>' +
          '<td>' + fmtDate(r.sample_date) + '</td>' +
          '<td><span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></td>' +
          '<td>' + (r.status === 'released'
            ? '<button class="btn btn-primary btn-sm" onclick="window._downloadReport(\'' + r.id + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Scarica</button>'
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

  // ── UPLOAD REPORTS (Lab) ─────────────────────────
  var uploadFile = null;

  function initUploadPage() {
    var dropZone = $('dropZone');
    var fileInput = $('fileInput');

    if (!dropZone._bound) {
      $('browseBtn').addEventListener('click', function () { fileInput.click(); });

      fileInput.addEventListener('change', function () {
        if (this.files[0]) handleFile(this.files[0]);
      });

      ['dragenter', 'dragover'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
      });
      dropZone.addEventListener('drop', function (e) {
        var f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      });

      $('removeFile').addEventListener('click', function () {
        uploadFile = null;
        $('dropZoneFile').hidden = true;
        document.querySelector('.drop-zone-content').style.display = '';
        fileInput.value = '';
      });

      $('uploadFiscal').addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
      });

      $('lookupPatient').addEventListener('click', lookupPatient);
      $('uploadForm').addEventListener('submit', handleUpload);
      $('uploadSampleDate').valueAsDate = new Date();

      dropZone._bound = true;
    }

    loadRecentUploads();
  }

  function handleFile(file) {
    if (file.type !== 'application/pdf') {
      toast('Solo file PDF consentiti', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast('File troppo grande (max 25 MB)', 'error');
      return;
    }
    uploadFile = file;
    $('fileName').textContent = file.name;
    $('fileSize').textContent = fmtSize(file.size);
    $('dropZoneFile').hidden = false;
    document.querySelector('.drop-zone-content').style.display = 'none';
  }

  function lookupPatient() {
    var fc = $('uploadFiscal').value.trim().toUpperCase();
    if (fc.length !== 16) {
      $('uploadFiscal-error').textContent = 'Il codice fiscale deve essere di 16 caratteri';
      return;
    }
    $('uploadFiscal-error').textContent = '';
    $('patientFound').hidden = true;

    sbGet('users', 'fiscal_code=eq.' + encodeURIComponent(fc) + '&role=eq.patient&select=id,first_name,last_name,email').then(function (data) {
      if (data && data.length > 0) {
        var p = data[0];
        $('patientFoundName').textContent = p.first_name + ' ' + p.last_name + ' (' + p.email + ')';
        $('patientFound').hidden = false;
        $('patientFound').dataset.patientId = p.id;
      } else {
        $('uploadFiscal-error').textContent = 'Paziente non trovato nel sistema';
      }
    }).catch(function () {
      $('uploadFiscal-error').textContent = 'Errore nella ricerca';
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
    if (!uploadFile) {
      showMsg('uploadMessage', 'Seleziona un file PDF', 'error');
      return;
    }
    if (!$('uploadType').value) {
      showMsg('uploadMessage', 'Seleziona il tipo di esame', 'error');
      return;
    }

    $('uploadSubmit').disabled = true;
    $('uploadProgress').hidden = false;

    // Compute SHA-256 checksum first, then proceed with upload
    animateProgress(0, 15, 300);

    computeSHA256(uploadFile).then(function (checksum) {

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

    animateProgress(15, 35, 500);

    return sbPost('reports', reportData).then(function (reports) {
      if (!reports || reports.length === 0) throw new Error('Failed to create report');
      var report = Array.isArray(reports) ? reports[0] : reports;
      animateProgress(35, 60, 400);

      var path = patientId + '/' + report.id + '/' + uploadFile.name;
      return fetch(SB_URL + '/storage/v1/object/referti/' + path, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + state.token,
          'Content-Type': uploadFile.type,
          'x-upsert': 'true'
        },
        body: uploadFile
      }).then(function (r) {
        if (!r.ok) throw new Error('Upload storage failed: ' + r.status);
        animateProgress(60, 85, 300);
        return r.json().then(function () {
          return sbPost('report_files', {
            report_id: report.id,
            storage_path: path,
            storage_bucket: 'referti',
            original_name: uploadFile.name,
            mime_type: 'application/pdf',
            file_size_bytes: uploadFile.size,
            checksum_sha256: checksum,
            is_encrypted: false,
            is_primary: true,
            file_type: 'report_pdf',
            uploaded_by: state.profile ? state.profile.id : null
          });
        });
      }).then(function () {
        animateProgress(85, 100, 200);
        return report;
      });
    }).then(function (report) {
      setTimeout(function () {
        $('uploadSubmit').disabled = false;
        $('uploadProgress').hidden = true;
        $('progressFill').style.width = '0%';

        showMsg('uploadMessage', 'Referto ' + (report.report_number || '') + ' caricato con successo!', 'success');
        toast('Referto caricato: ' + (report.report_number || ''), 'success');

        $('uploadForm').reset();
        uploadFile = null;
        $('dropZoneFile').hidden = true;
        document.querySelector('.drop-zone-content').style.display = '';
        $('patientFound').hidden = true;
        $('uploadSampleDate').valueAsDate = new Date();

        loadRecentUploads();
      }, 300);
    });

    }).catch(function (err) {
      $('uploadSubmit').disabled = false;
      $('uploadProgress').hidden = true;
      $('progressFill').style.width = '0%';
      showMsg('uploadMessage', 'Errore durante il caricamento: ' + (err.message || 'riprova'), 'error');
      toast('Errore caricamento', 'error');
    });
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

  function loadRecentUploads() {
    var q = 'select=id,report_number,report_type,status,patient_fiscal_code,created_at&order=created_at.desc&limit=8';
    if (state.profile && (state.profile.role === 'lab_technician')) {
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
        return '<div class="upload-item">' +
          '<div class="upload-item-icon ' + iconClass + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>' +
          '<div class="upload-item-info"><span class="upload-item-name">' + esc(r.report_number || r.report_type) + '</span>' +
          '<span class="upload-item-meta">' + esc(r.report_type) + ' &middot; ' + timeAgo(r.created_at) + '</span></div>' +
          '<span class="badge badge-' + r.status + '">' + (STATUS_LABELS[r.status] || r.status) + '</span></div>';
      }).join('');
    });
  }

  // ── VALIDATION QUEUE (Lab) ───────────────────────
  function loadQueue() {
    var filter = $('filterQueueUrgent').value;
    var q = 'status=eq.pending&select=*,patient:patient_id(first_name,last_name)&order=is_urgent.desc,created_at.asc&limit=50';
    if (filter === 'urgent') q += '&is_urgent=eq.true';
    if (filter === 'abnormal') q += '&has_abnormal_values=eq.true';

    sbGet('reports', q).then(function (data) {
      renderQueue(data);
      updateBadge('badgePending', data ? data.length : 0);
    });

    if (!$('filterQueueUrgent')._bound) {
      $('filterQueueUrgent').addEventListener('change', loadQueue);
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
        '<td><button class="btn btn-primary btn-sm" onclick="window._validateReport(\'' + r.id + '\')">Valida</button> ' +
        '<button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Vedi</button></td></tr>';
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
      var count = data ? data.filter(function (r) { return r.status === 'validated' || r.status === 'signed'; }).length : 0;
      updateBadge('badgeSign', count);
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
  function loadAllReports() {
    var filter = $('filterAllStatus').value;
    var search = $('searchAllReports').value.trim();

    var q = 'select=*,patient:patient_id(first_name,last_name)&order=created_at.desc&limit=100';
    if (filter) q += '&status=eq.' + filter;
    if (search) q += '&or=(report_number.ilike.*' + encodeURIComponent(search) + '*,patient_fiscal_code.ilike.*' + encodeURIComponent(search) + '*)';

    sbGet('reports', q).then(function (data) {
      renderAllReports(data);
      if (data && Array.isArray(data)) {
        var counts = { pending: 0, validated: 0, signed: 0, released: 0, total: data.length };
        data.forEach(function (r) {
          if (r.status === 'pending') counts.pending++;
          if (r.status === 'validated') counts.validated++;
          if (r.status === 'signed') counts.signed++;
          if (r.status === 'released') counts.released++;
        });
        $('statPending').textContent = counts.pending;
        $('statValidated').textContent = counts.validated + (counts.signed ? '+' + counts.signed : '');
        $('statReleased').textContent = counts.released;
        $('statTotal').textContent = counts.total;
      }
    });

    if (!$('filterAllStatus')._bound) {
      $('filterAllStatus').addEventListener('change', loadAllReports);
      $('searchAllReports').addEventListener('input', debounce(loadAllReports, 400));
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
    body.innerHTML = data.map(function (r) {
      var pName = r.patient ? (r.patient.first_name + ' ' + r.patient.last_name) : (r.patient_fiscal_code || '--');
      var flags = '';
      if (r.is_urgent) flags += '<span class="badge badge-urgent">U</span> ';
      if (r.has_abnormal_values) flags += '<span class="badge badge-abnormal">A</span> ';

      // Patient tracking badges (admin view) — P0-2: XSS fix with esc() on all title attributes
      if (r.status === 'released' && isAdmin) {
        if (r.patient_notified) flags += '<span class="badge" style="background:#3b82f6;color:#fff;font-size:0.7rem" title="Notificato al paziente ' + esc(r.patient_notified_at ? fmtDateTime(r.patient_notified_at) : '') + '">&#9993;</span> ';
        if (r.patient_viewed) flags += '<span class="badge" style="background:#22c55e;color:#fff;font-size:0.7rem" title="Letto dal paziente ' + esc(r.patient_viewed_at ? fmtDateTime(r.patient_viewed_at) : '') + '">&#10003; Letto</span> ';
        else if (r.patient_notified) flags += '<span class="badge" style="background:#f59e0b;color:#fff;font-size:0.7rem" title="Non ancora letto dal paziente">&#9888; Non letto</span> ';
        if (r.patient_downloaded) flags += '<span class="badge" style="background:#8b5cf6;color:#fff;font-size:0.7rem" title="Scaricato ' + esc(String(r.download_count || 0)) + ' volte">&#8615; ' + esc(String(r.download_count || 0)) + '</span> ';
      }

      var actions = '<button class="btn btn-outline btn-sm" onclick="window._previewReport(\'' + r.id + '\')">Dettagli</button>';
      if (isAdmin) {
        if (r.status === 'pending') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._validateReport(\'' + r.id + '\')">Valida</button>';
          actions += ' <button class="btn btn-sm" style="background:#6366f1;color:#fff;border:0" onclick="window._fastTrackReport(\'' + r.id + '\')">Fast-Track</button>';
        } else if (r.status === 'validated') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._signReport(\'' + r.id + '\')">Firma</button>';
        } else if (r.status === 'signed') {
          actions += ' <button class="btn btn-primary btn-sm" onclick="window._releaseReport(\'' + r.id + '\')">Rilascia</button>';
        } else if (r.status === 'released') {
          actions += ' <button class="btn btn-sm" style="background:#22c55e;color:#fff;border:0" onclick="window._downloadReport(\'' + r.id + '\')">Scarica</button>';
        }
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

    var q = 'select=*&order=created_at.desc&limit=100';
    if (filter) q += '&role=eq.' + filter;
    if (search) q += '&or=(first_name.ilike.*' + encodeURIComponent(search) + '*,last_name.ilike.*' + encodeURIComponent(search) + '*,email.ilike.*' + encodeURIComponent(search) + '*,fiscal_code.ilike.*' + encodeURIComponent(search) + '*)';

    sbGet('users', q).then(function (data) {
      var body = $('usersBody');
      if (!data || !Array.isArray(data) || data.length === 0) {
        body.innerHTML = '<tr class="table-empty"><td colspan="8"><div class="empty-state"><p>Nessun utente trovato</p></div></td></tr>';
        return;
      }
      body.innerHTML = data.map(function (u) {
        var roleBadge = u.role === 'admin' || u.role === 'super_admin' ? 'signed'
          : u.role === 'physician' ? 'validated'
          : u.role === 'lab_technician' ? 'pending'
          : 'released';
        return '<tr>' +
          '<td><strong>' + esc(u.first_name + ' ' + u.last_name) + '</strong></td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td><code style="font-size:0.78rem">' + esc(u.fiscal_code || '--') + '</code></td>' +
          '<td><span class="badge badge-' + roleBadge + '">' + (ROLE_LABELS[u.role] || u.role) + '</span></td>' +
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
      });
      $('filterUserRole')._bound = true;
    }
  }

  // ── INVITE USER ──────────────────────────────────
  function initInviteUser() {
    $('inviteClose').addEventListener('click', function () { $('inviteOverlay').hidden = true; });
    $('inviteCancelBtn').addEventListener('click', function () { $('inviteOverlay').hidden = true; });
    $('inviteOverlay').addEventListener('click', function (e) {
      if (e.target === $('inviteOverlay')) $('inviteOverlay').hidden = true;
    });
    $('genPassword').addEventListener('click', function () {
      $('invPassword').value = genPassword(16);
    });
    $('inviteSubmitBtn').addEventListener('click', function () {
      var email = $('invEmail').value.trim();
      var firstName = $('invFirstName').value.trim();
      var lastName = $('invLastName').value.trim();
      var fiscalCode = $('invFiscal').value.trim().toUpperCase();
      var role = $('invRole').value;
      var password = $('invPassword').value;

      if (!email || !firstName || !lastName || !password) {
        showMsg('inviteMessage', 'Compila tutti i campi obbligatori', 'error');
        return;
      }
      if (password.length < 12) {
        showMsg('inviteMessage', 'La password deve avere almeno 12 caratteri', 'error');
        return;
      }

      $('inviteSubmitBtn').disabled = true;
      showMsg('inviteMessage', 'Creazione utente...', '');

      // 1. Create auth user
      sbAuthSignUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        fiscal_code: fiscalCode || null,
        role: role
      }).then(function (authData) {
        if (authData.error) throw new Error(authData.error.message || authData.error);
        // 2. Create public profile
        return sbPost('users', {
          auth_id: authData.id || (authData.user && authData.user.id),
          email: email,
          first_name: firstName,
          last_name: lastName,
          fiscal_code: fiscalCode || null,
          role: role,
          is_active: true,
          is_email_verified: false
        });
      }).then(function () {
        $('inviteSubmitBtn').disabled = false;
        showMsg('inviteMessage', 'Utente creato! Credenziali: ' + email + ' / ' + password, 'success');
        toast('Utente ' + firstName + ' ' + lastName + ' creato', 'success');
        loadUsers();
      }).catch(function (err) {
        $('inviteSubmitBtn').disabled = false;
        var errMsg = (err && err.message) || (err && err.msg) || 'Errore nella creazione';
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
              console.log('[Download] RPC increment_download_count OK:', result);
              refreshAfterDownload();
            })
            .catch(function (rpcErr) {
              console.warn('[Download] RPC not available, using fallback:', rpcErr);
              // Fallback if RPC not deployed yet: read current count, then increment
              sbGet('reports', 'id=eq.' + reportId + '&select=download_count')
                .then(function (rows) {
                  var current = (rows && rows[0] && rows[0].download_count) ? rows[0].download_count : 0;
                  console.log('[Download] Current count:', current, '-> incrementing to', current + 1);
                  return sbPatch('reports', 'id=eq.' + reportId, {
                    patient_downloaded: true,
                    patient_downloaded_at: new Date().toISOString(),
                    download_count: current + 1
                  });
                })
                .then(function (patchResult) {
                  console.log('[Download] Fallback patch OK:', patchResult);
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
    }).then(function () {
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
    }).then(function () {
      closeModal();
      toast('Referto firmato', 'success');
      if (state.currentPage === 'all-reports') loadAllReports();
      else loadSignRelease();
      loadDashboardBadges(state.profile ? state.profile.role : 'patient');
    }).catch(function () { toast('Errore', 'error'); });
  };

  window._releaseReport = function (id) {
    openModal('Rilascio al Paziente',
      '<p>Il referto verrà reso disponibile al paziente per il download.</p><p style="font-size:0.85rem;color:var(--text-secondary)">Il paziente riceverà una notifica via email.</p>',
      '<button class="btn btn-outline" onclick="window._closeModal()">Annulla</button><button class="btn btn-primary" id="releaseBtn_' + id + '" onclick="window._doRelease(\'' + id + '\')">Rilascia al Paziente</button>');
  };
  window._doRelease = function (id) {
    // P1-6: Disable button immediately to prevent double-click
    var btn = $('releaseBtn_' + id);
    if (btn) { btn.disabled = true; btn.textContent = 'Rilascio in corso...'; }
    sbPatch('reports', 'id=eq.' + id, {
      status: 'released',
      released_at: new Date().toISOString(),
      released_by: state.profile ? state.profile.id : null
    }).then(function () {
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
        footer += '<button class="btn btn-primary btn-sm" onclick="window._downloadReport(\'' + r.id + '\')">Scarica PDF</button>';
      }

      openModal('Dettagli Referto — ' + (r.report_number || ''), html, footer);
    });
  };

  window._editUser = function (id) {
    sbGet('users', 'id=eq.' + id + '&select=*').then(function (data) {
      if (!data || data.length === 0) return;
      var u = data[0];
      var html = '<form id="editUserForm"><div class="form-grid">' +
        '<div class="form-group"><label>Nome</label><input class="form-input" value="' + esc(u.first_name) + '" readonly></div>' +
        '<div class="form-group"><label>Cognome</label><input class="form-input" value="' + esc(u.last_name) + '" readonly></div>' +
        '<div class="form-group"><label>Email</label><input class="form-input" value="' + esc(u.email) + '" readonly></div>' +
        '<div class="form-group"><label>Codice Fiscale</label><input class="form-input" value="' + esc(u.fiscal_code || '--') + '" readonly></div>' +
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
    sbPatch('users', 'id=eq.' + id, {
      role: $('editUserRole').value,
      is_active: $('editUserActive').checked
    }).then(function () {
      closeModal();
      toast('Utente aggiornato', 'success');
      loadUsers();
    }).catch(function () { toast('Errore', 'error'); });
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
        }).then(function () {
          // Step 2: Sign
          return sbPatch('reports', 'id=eq.' + id, {
            status: 'signed', signed_at: now, signed_by: userId, physician_notes: notes || null
          });
        }).then(function () {
          // Step 3: Release
          return sbPatch('reports', 'id=eq.' + id, {
            status: 'released', released_at: now, released_by: userId
          });
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

  window._closeModal = closeModal;

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

})();
