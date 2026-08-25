/**
 * DELIVERY-STATS.JS — Pannello "Consegna & WhatsApp"
 * Statistiche consegna referti + notifiche/reminder WhatsApp.
 * Fonte: GET /api/admin/delivery-stats (staff JWT).
 * @version 1.0.0  @date 2026-08-25
 */
(function () {
  'use strict';

  var AUTO_REFRESH_MS = 300000; // 5 min
  var state = { initialized: false, loading: false, timer: null };

  function $(id) { return document.getElementById(id); }

  function getToken() {
    try {
      var raw = localStorage.getItem('bc_session');
      if (raw) { var s = JSON.parse(raw); return s.access_token || null; }
    } catch (e) { /* ignore */ }
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pctClass(pctStr, goodHigh, warnAt, badAt) {
    var v = parseFloat(pctStr);
    if (isNaN(v)) return '';
    if (goodHigh) {
      if (v >= warnAt) return 'ds-good';
      if (v >= badAt) return 'ds-warn';
      return 'ds-bad';
    } else {
      if (v <= warnAt) return 'ds-good';
      if (v <= badAt) return 'ds-warn';
      return 'ds-bad';
    }
  }

  function kpiCard(label, value, sub, cls) {
    return '<div class="ds-kpi ' + (cls || '') + '">' +
      '<div class="ds-kpi-value">' + esc(value) + '</div>' +
      '<div class="ds-kpi-label">' + esc(label) + '</div>' +
      (sub ? '<div class="ds-kpi-sub">' + esc(sub) + '</div>' : '') +
      '</div>';
  }

  function renderDeliveryTable(delivery) {
    var periods = [
      ['last_7d', 'Ultimi 7 giorni'],
      ['last_30d', 'Ultimi 30 giorni'],
      ['last_90d', 'Ultimi 90 giorni'],
    ];
    var rows = periods.map(function (p) {
      var d = delivery[p[0]] || {};
      var neverCls = pctClass(d.never_opened_pct, false, 25, 35);
      return '<tr>' +
        '<td>' + p[1] + '</td>' +
        '<td class="ds-num">' + esc(d.released) + '</td>' +
        '<td class="ds-num">' + esc(d.downloaded) + ' <span class="ds-pct">(' + esc(d.downloaded_pct) + ')</span></td>' +
        '<td class="ds-num">' + esc(d.viewed_or_downloaded_pct) + '</td>' +
        '<td class="ds-num ' + neverCls + '">' + esc(d.never_opened) + ' <span class="ds-pct">(' + esc(d.never_opened_pct) + ')</span></td>' +
        '</tr>';
    }).join('');
    return '<table class="ds-table">' +
      '<thead><tr><th>Periodo</th><th>Rilasciati</th><th>Scaricati</th><th>Aperti (visto o scaricato)</th><th>Mai aperti</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';
  }

  function renderReasons(reasons) {
    var keys = Object.keys(reasons || {});
    if (!keys.length) return '<span class="ds-muted">nessuno</span>';
    return keys.map(function (k) {
      return '<div class="ds-reason"><span class="ds-reason-count">' + esc(reasons[k]) + '×</span> ' + esc(k) + '</div>';
    }).join('');
  }

  function render(data) {
    var el = $('dsContent');
    if (!el) return;

    var d7 = (data.delivery || {}).last_7d || {};
    var wa = (data.release_notifications_90d || {}).whatsapp || {};
    var em = (data.release_notifications_90d || {}).email || {};
    var rem = data.reminders_90d || {};
    var conv = rem.post_reminder_conversion || {};

    var waTotal = (wa.sent || 0) + (wa.failed || 0);
    var waFailPct = waTotal > 0 ? ((wa.failed / waTotal) * 100).toFixed(1) + '%' : 'n/a';

    var html = '';

    // ── KPI row ──
    html += '<div class="ds-kpi-row">';
    html += kpiCard('Scaricati (7gg)', d7.downloaded_pct || 'n/a', (d7.downloaded || 0) + ' su ' + (d7.released || 0) + ' referti',
      pctClass(d7.downloaded_pct, true, 70, 55));
    html += kpiCard('Mai aperti (7gg)', d7.never_opened_pct || 'n/a', (d7.never_opened || 0) + ' referti',
      pctClass(d7.never_opened_pct, false, 25, 35));
    html += kpiCard('WhatsApp falliti (90gg)', wa.failed != null ? wa.failed : 'n/a', waFailPct + ' del totale — recuperati con retry: ' + (wa.recovered_by_retry || 0),
      (wa.failed || 0) === 0 ? 'ds-good' : ((wa.failed || 0) > 20 ? 'ds-bad' : 'ds-warn'));
    html += kpiCard('Conversione reminder', conv.conversion_pct || 'n/a', (conv.downloaded_after_reminder || 0) + ' scaricati dopo il promemoria su ' + (conv.analyzed || 0),
      pctClass(conv.conversion_pct, true, 15, 8));
    html += '</div>';

    // ── Delivery table ──
    html += '<div class="ds-section"><h3>📥 Consegna referti rilasciati</h3>' + renderDeliveryTable(data.delivery || {}) + '</div>';

    // ── Notifications ──
    html += '<div class="ds-grid2">';
    html += '<div class="ds-section"><h3>📱 Notifiche rilascio WhatsApp (90gg)</h3>' +
      '<div class="ds-stat-line">Inviate: <strong>' + esc(wa.sent || 0) + '</strong></div>' +
      '<div class="ds-stat-line">Recuperate dal retry automatico: <strong>' + esc(wa.recovered_by_retry || 0) + '</strong></div>' +
      '<div class="ds-stat-line">Ancora fallite: <strong class="' + ((wa.failed || 0) > 0 ? 'ds-bad' : 'ds-good') + '">' + esc(wa.failed || 0) + '</strong>' +
      ' (ultimi 7gg: ' + esc(wa.failed_last_7d || 0) + ', retry esauriti: ' + esc(wa.retry_exhausted || 0) + ')</div>' +
      '<div class="ds-reasons"><div class="ds-reasons-title">Motivi fallimento:</div>' + renderReasons(wa.failure_reasons) + '</div>' +
      '</div>';
    html += '<div class="ds-section"><h3>📧 Notifiche rilascio Email (90gg)</h3>' +
      '<div class="ds-stat-line">Inviate: <strong>' + esc(em.sent || 0) + '</strong></div>' +
      '<div class="ds-stat-line">Fallite: <strong class="' + ((em.failed || 0) > 0 ? 'ds-warn' : 'ds-good') + '">' + esc(em.failed || 0) + '</strong></div>' +
      '</div>';
    html += '</div>';

    // ── Reminders ──
    html += '<div class="ds-section"><h3>🔔 Promemoria WhatsApp 24h (90gg)</h3>' +
      '<div class="ds-stat-line">Inviati: <strong>' + esc(rem.sent || 0) + '</strong> — Falliti: <strong>' + esc(rem.failed || 0) + '</strong></div>' +
      '<div class="ds-stat-line">Dopo il promemoria: <strong class="ds-good">' + esc(conv.downloaded_after_reminder || 0) + ' scaricati</strong>, ' +
      esc(conv.viewed_after_reminder || 0) + ' visti, <strong class="' + ((conv.still_never_opened || 0) > 0 ? 'ds-warn' : 'ds-good') + '">' +
      esc(conv.still_never_opened || 0) + ' ancora mai aperti</strong></div>' +
      '</div>';

    html += '<div class="ds-footer">Aggiornato: ' + esc(new Date(data.generated_at).toLocaleString('it-IT')) +
      ' — finestra 90 giorni — auto-refresh ogni 5 minuti</div>';

    el.innerHTML = html;
  }

  function renderError(msg) {
    var el = $('dsContent');
    if (!el) return;
    el.innerHTML = '<div class="ds-error">⚠️ Errore caricamento statistiche: ' + esc(msg) +
      ' <button class="btn btn-primary btn-sm" id="dsRetryBtn">Riprova</button></div>';
    var btn = $('dsRetryBtn');
    if (btn) btn.addEventListener('click', load);
  }

  function load() {
    if (state.loading) return;
    state.loading = true;
    var el = $('dsContent');
    if (el && !el.innerHTML.trim()) {
      el.innerHTML = '<div class="ds-loading">Caricamento statistiche consegna…</div>';
    }
    var headers = { 'Accept': 'application/json' };
    var t = getToken();
    if (t) headers['Authorization'] = 'Bearer ' + t;

    fetch('/api/admin/delivery-stats', { headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.success) throw new Error(data.error || 'risposta non valida');
        render(data);
      })
      .catch(function (e) { renderError(e.message); })
      .finally(function () { state.loading = false; });
  }

  function initPanel() {
    if (state.initialized) {
      load();
      return;
    }
    state.initialized = true;

    var refreshBtn = $('dsRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', load);

    load();

    // Auto-refresh solo quando il pannello è visibile
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () {
      var page = $('page-delivery-stats');
      if (page && !page.hidden) load();
    }, AUTO_REFRESH_MS);
  }

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#delivery-stats') initPanel();
  });
  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#delivery-stats') initPanel();
  });
})();
