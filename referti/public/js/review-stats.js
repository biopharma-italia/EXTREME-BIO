/**
 * REVIEW-STATS.JS — Pannello "Recensioni Google"
 * Tracking in tempo reale: richieste inviate, click sul link, coda invii.
 * Fonte: GET /api/admin/review-stats (admin JWT).
 * @version 1.1.0  @date 2026-08-31 (baseline + conteggio attuale aggiornabile + delta campagna)
 */
(function () {
  'use strict';

  var AUTO_REFRESH_MS = 60000; // 1 min — "tempo reale"
  var state = { initialized: false, loading: false, timer: null };

  function $(id) { return document.getElementById(id); }

  function getToken() {
    try {
      var raw = localStorage.getItem('sb-session');
      if (raw) {
        var s = JSON.parse(raw);
        if (s.expires_at && s.expires_at < Math.floor(Date.now() / 1000)) return null;
        return s.access_token || null;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function kpiCard(label, value, sub, cls) {
    return '<div class="ds-kpi ' + (cls || '') + '">' +
      '<div class="ds-kpi-value">' + esc(value) + '</div>' +
      '<div class="ds-kpi-label">' + esc(label) + '</div>' +
      (sub ? '<div class="ds-kpi-sub">' + esc(sub) + '</div>' : '') +
      '</div>';
  }

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Europe/Rome',
      });
    } catch (e) { return iso; }
  }

  function render(data) {
    var el = $('rsContent');
    if (!el) return;

    var req = data.requests || {};
    var clk = data.clicks || {};
    var q = data.queue || {};
    var gbp = data.gbp_baseline || {};

    var html = '';

    // ── KPI row ──
    html += '<div class="ds-kpi-row">';
    html += kpiCard('Richieste oggi', (req.today || {}).sent || 0,
      ((req.today || {}).failed || 0) > 0 ? ((req.today || {}).failed + ' fallite') : 'tutte inviate ✓',
      ((req.today || {}).failed || 0) > 0 ? 'ds-warn' : 'ds-good');
    html += kpiCard('Click oggi', clk.today || 0, 'sul link recensione', (clk.today || 0) > 0 ? 'ds-good' : '');
    html += kpiCard('CTR 30 giorni', data.ctr_30d_pct || 'n/a',
      (clk.last_30d || 0) + ' click su ' + ((req.last_30d || {}).sent || 0) + ' richieste', '');
    html += kpiCard('In coda', q.ready_next_run || 0,
      'pronti al prossimo run (max ' + (q.max_per_run || 5) + ' per run, ogni 15 min — max 40/ora)' +
      ((q.waiting_window || 0) > 0 ? ' — ' + q.waiting_window + ' in attesa finestra' : ''), '');
    html += '</div>';

    // ── Riepilogo periodi ──
    html += '<div class="ds-section"><h3>📊 Richieste &amp; Click</h3>' +
      '<table class="ds-table"><thead><tr><th>Periodo</th><th>Richieste inviate</th><th>Fallite</th><th>Click sul link</th></tr></thead><tbody>' +
      '<tr><td>Oggi</td><td class="ds-num">' + esc((req.today || {}).sent || 0) + '</td><td class="ds-num">' + esc((req.today || {}).failed || 0) + '</td><td class="ds-num">' + esc(clk.today || 0) + '</td></tr>' +
      '<tr><td>Ultimi 7 giorni</td><td class="ds-num">' + esc((req.last_7d || {}).sent || 0) + '</td><td class="ds-num">' + esc((req.last_7d || {}).failed || 0) + '</td><td class="ds-num">' + esc(clk.last_7d || 0) + '</td></tr>' +
      '<tr><td>Ultimi 30 giorni</td><td class="ds-num">' + esc((req.last_30d || {}).sent || 0) + '</td><td class="ds-num">' + esc((req.last_30d || {}).failed || 0) + '</td><td class="ds-num">' + esc(clk.last_30d || 0) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="ds-stat-line" style="margin-top:8px">Link tracciato: <a href="' + esc(data.review_link) + '" target="_blank" rel="noopener">' + esc(data.review_link) + '</a></div>' +
      '</div>';

    // ── Ultimi click ──
    var recent = clk.recent || [];
    var rows = recent.map(function (c) {
      return '<tr><td>' + esc(fmtTime(c.at)) + '</td>' +
        '<td>' + (c.mobile ? '📱' : '💻') + ' ' + esc(c.device) + '</td></tr>';
    }).join('');
    html += '<div class="ds-section"><h3>🖱️ Ultimi click sul link (max 25)</h3>' +
      (recent.length
        ? '<table class="ds-table"><thead><tr><th>Quando</th><th>Dispositivo</th></tr></thead><tbody>' + rows + '</tbody></table>'
        : '<div class="ds-muted" style="padding:8px 0">Nessun click registrato negli ultimi 30 giorni.</div>') +
      '<div class="ds-stat-line" style="margin-top:6px;color:var(--text-muted);font-size:0.8rem">I click sono anonimi (nessun dato paziente). I click da 💻 desktop possono essere test interni.' +
      ((clk.bot_previews_30d || 0) > 0 ? ' Esclusi ' + esc(clk.bot_previews_30d) + ' accessi automatici (anteprime WhatsApp/bot) negli ultimi 30gg.' : '') + '</div>' +
      '</div>';

    // ── Profilo GBP: baseline + attuale + delta campagna ──
    var gbpCur = data.gbp_current || gbp;
    var delta = (typeof data.gbp_campaign_delta === 'number') ? data.gbp_campaign_delta : null;
    var deltaHtml = '';
    if (delta !== null) {
      var deltaCls = delta > 0 ? 'color:#22c55e;font-weight:700' : 'color:var(--text-muted)';
      deltaHtml = '<div class="ds-stat-line">Recensioni ottenute dalla campagna: <span style="' + deltaCls + '">' +
        (delta > 0 ? '+' : '') + esc(delta) + '</span></div>';
    }
    html += '<div class="ds-section"><h3>⭐ Profilo Google Business</h3>' +
      '<div class="ds-stat-line">Attuale (al ' + esc(gbpCur.noted_at || '--') + '): <strong>' + esc(gbpCur.stars || '--') + '★</strong> — <strong>' + esc(gbpCur.reviews || '--') + ' recensioni</strong></div>' +
      '<div class="ds-stat-line" style="color:var(--text-muted)">Baseline campagna (al ' + esc(gbp.noted_at || '--') + '): ' + esc(gbp.stars || '--') + '★ — ' + esc(gbp.reviews || '--') + ' recensioni</div>' +
      deltaHtml +
      '<div class="ds-stat-line" style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<input type="number" id="rsGbpReviews" min="0" step="1" placeholder="N. recensioni su Google oggi" ' +
          'style="width:220px;padding:6px 10px;border:1px solid var(--border,#334);border-radius:6px;background:transparent;color:inherit">' +
        '<button type="button" id="rsGbpSave" class="btn btn-sm" style="padding:6px 14px;border-radius:6px;cursor:pointer">Aggiorna conteggio</button>' +
        '<span id="rsGbpMsg" style="font-size:0.85rem"></span>' +
      '</div>' +
      '<div class="ds-stat-line" style="color:var(--text-muted);font-size:0.85rem">Inserisci il numero attuale di recensioni visibile sul profilo Google per aggiornare il confronto con la baseline.</div>' +
      '</div>';

    html += '<div class="ds-footer">Aggiornato: ' + esc(new Date(data.generated_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })) +
      ' — auto-refresh ogni 60 secondi</div>';

    el.innerHTML = html;
    bindGbpForm();
  }

  function bindGbpForm() {
    var btn = $('rsGbpSave');
    var input = $('rsGbpReviews');
    var msg = $('rsGbpMsg');
    if (!btn || !input) return;

    function submit() {
      var n = parseInt(input.value, 10);
      if (isNaN(n) || n < 0) {
        if (msg) { msg.textContent = 'Inserisci un numero valido'; msg.style.color = '#f59e0b'; }
        return;
      }
      btn.disabled = true;
      if (msg) { msg.textContent = 'Salvataggio\u2026'; msg.style.color = 'var(--text-muted)'; }

      var headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      var t = getToken();
      if (t) headers['Authorization'] = 'Bearer ' + t;

      fetch('/api/admin/review-stats', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ reviews: n }),
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.success) throw new Error(d.error || 'HTTP ' + r.status); return d; }); })
        .then(function () {
          if (msg) { msg.textContent = 'Aggiornato \u2713'; msg.style.color = '#22c55e'; }
          load();
        })
        .catch(function (e) {
          if (msg) { msg.textContent = 'Errore: ' + e.message; msg.style.color = '#ef4444'; }
        })
        .finally(function () { btn.disabled = false; });
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
  }

  function renderError(msg) {
    var el = $('rsContent');
    if (!el) return;
    el.innerHTML = '<div class="ds-error">⚠️ Errore caricamento statistiche recensioni: ' + esc(msg) +
      ' <button class="btn btn-primary btn-sm" id="rsRetryBtn">Riprova</button></div>';
    var btn = $('rsRetryBtn');
    if (btn) btn.addEventListener('click', load);
  }

  function load() {
    if (state.loading) return;
    state.loading = true;
    var el = $('rsContent');
    if (el && !el.innerHTML.trim()) {
      el.innerHTML = '<div class="ds-loading">Caricamento statistiche recensioni…</div>';
    }
    var headers = { 'Accept': 'application/json' };
    var t = getToken();
    if (t) headers['Authorization'] = 'Bearer ' + t;

    fetch('/api/admin/review-stats', { headers: headers })
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

    var refreshBtn = $('rsRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', load);

    load();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () {
      var page = $('page-review-stats');
      if (page && !page.hidden) load();
    }, AUTO_REFRESH_MS);
  }

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#review-stats') initPanel();
  });
  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#review-stats') initPanel();
  });
})();
