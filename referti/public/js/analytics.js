/**
 * ANALYTICS.JS — Bio-Clinic Enterprise BI Dashboard v2
 * Complete rewrite: TAT engine, drill-downs, AI insights, forecast
 * @version 2.1.0  @date 2026-08-09
 */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────
  var SB_URL = 'https://mdxqgzkxrcrotxxbhoai.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFnemt4cmNyb3R4eGJob2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODYxMzIsImV4cCI6MjA4NzU2MjEzMn0.HHExeiCGqnx4di_u9gghUnTfgQVAIjKuN6kt_vLFddA';
  var SLA_HOURS = 72; // 3 days in hours
  var AUTO_REFRESH_MS = 300000; // 5 min

  var TYPE_LABELS = {
    emocromo: 'Emocromo', profilo_lipidico: 'Profilo Lipidico', profilo_tiroideo: 'Profilo Tiroideo',
    glicemia: 'Glicemia', esame_urine: 'Esame Urine', profilo_epatico: 'Profilo Epatico',
    profilo_renale: 'Profilo Renale', markers_tumorali: 'Markers Tumorali', coagulazione: 'Coagulazione',
    sierologia: 'Sierologia', microbiologia: 'Microbiologia', genetica: 'Genetica',
    pap_test: 'PAP Test', hpv_dna_test: 'HPV DNA Test', isteroscopia: 'Isteroscopia',
    cariotipo_sangue: 'Cariotipo', cariotipo_coppia: 'Cariotipo Coppia', tunel_test: 'Tunel Test',
    fish_advance_sperm: 'FISH Sperm', pannello_trombofilia: 'Pannello Trombofilia',
    endobiome: 'ENDOBIOME', oncoadvance_brca: 'ONCOADVANCE BRCA',
    hiv_dna_quantitativo: 'HIV DNA Quant.', hcv_quantitativo: 'HCV Quant.',
    hcv_tipizzazione: 'HCV Tipizz.', hbv_quantitativo: 'HBV Quant.', altro: 'Altro'
  };

  var CHART_COLORS = [
    '#7CBA3D', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#0ea5e9',
    '#d946ef', '#22c55e', '#eab308', '#64748b'
  ];

  // ── State ──────────────────────────────────────
  var anState = {
    rawReports: [],
    rawCompReports: [],
    reports: [],
    compReports: [],
    users: [],
    charts: {},
    activeTab: 'overview',
    granularity: 'month',
    autoRefreshTimer: null,
    initialized: false
  };

  // ── DOM helpers ────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  // ── Auth ────────────────────────────────────────
  function getToken() {
    try {
      var raw = localStorage.getItem('sb-session');
      if (raw) { var s = JSON.parse(raw); return s.access_token || null; }
    } catch (e) {}
    return null;
  }

  function sbHeaders() {
    var h = { 'apikey': SB_KEY, 'Content-Type': 'application/json' };
    var t = getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  // ── Supabase paginated fetch ───────────────────
  function sbGetAll(table, query) {
    var allRows = [];
    var pageSize = 1000;
    function fetchPage(offset) {
      var q = query || '';
      q += (q ? '&' : '') + 'limit=' + pageSize + '&offset=' + offset;
      return fetch(SB_URL + '/rest/v1/' + table + '?' + q, {
        headers: Object.assign({}, sbHeaders(), { 'Prefer': 'count=exact' })
      }).then(function (r) {
        if (!r.ok) {
          console.error('[Analytics] API error', r.status, table, q);
          return r.text().then(function(t) { throw new Error('API ' + r.status + ': ' + t); });
        }
        var total = 0;
        var cr = r.headers.get('content-range');
        if (cr) { var m = cr.match(/\/(\d+)/); if (m) total = parseInt(m[1], 10); }
        return r.json().then(function (rows) { return { rows: rows, total: total }; });
      }).then(function (res) {
        allRows = allRows.concat(res.rows);
        if (allRows.length < res.total) return fetchPage(allRows.length);
        return allRows;
      });
    }
    return fetchPage(0);
  }

  function sbGetUsers() {
    return sbGetAll('users', 'select=id,first_name,last_name,email,role,created_at,fiscal_code,gender,date_of_birth');
  }

  // ══════════════════════════════════════════════
  //  UTILITY FUNCTIONS
  // ══════════════════════════════════════════════

  function minutesDiff(d1, d2) {
    if (!d1 || !d2) return null;
    return (new Date(d2).getTime() - new Date(d1).getTime()) / 60000;
  }

  function hoursDiff(d1, d2) {
    if (!d1 || !d2) return null;
    return (new Date(d2).getTime() - new Date(d1).getTime()) / 3600000;
  }

  function fmtDuration(minutes) {
    if (minutes == null || isNaN(minutes)) return '-';
    var abs = Math.abs(minutes);
    if (abs < 60) return Math.round(abs) + 'm';
    if (abs < 1440) {
      var h = Math.floor(abs / 60);
      var m = Math.round(abs % 60);
      return h + 'h' + (m > 0 ? ' ' + m + 'm' : '');
    }
    var d = (abs / 1440).toFixed(1);
    return d + 'gg';
  }

  function percentile(arr, p) {
    if (!arr.length) return 0;
    var sorted = arr.slice().sort(function (a, b) { return a - b; });
    var idx = (p / 100) * (sorted.length - 1);
    var lo = Math.floor(idx);
    var hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }

  function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  }

  function fmtDelta(current, previous) {
    if (!previous || previous === 0) return { text: 'N/A', cls: 'neutral' };
    var pct = ((current - previous) / previous * 100).toFixed(1);
    var sign = pct > 0 ? '+' : '';
    return { text: sign + pct + '%', cls: pct > 0 ? 'positive' : (pct < 0 ? 'negative' : 'neutral') };
  }

  function fmtDeltaInv(current, previous) {
    // Inverted: lower is better (e.g. TAT)
    if (!previous || previous === 0) return { text: 'N/A', cls: 'neutral' };
    var pct = ((current - previous) / previous * 100).toFixed(1);
    var sign = pct > 0 ? '+' : '';
    return { text: sign + pct + '%', cls: pct < 0 ? 'positive' : (pct > 0 ? 'negative' : 'neutral') };
  }

  function groupBy(arr, keyFn) {
    var map = {};
    arr.forEach(function (item) {
      var k = keyFn(item);
      if (!map[k]) map[k] = [];
      map[k].push(item);
    });
    return map;
  }

  function countUnique(arr, field) {
    var set = {};
    arr.forEach(function (r) { if (r[field]) set[r[field]] = true; });
    return Object.keys(set).length;
  }

  function safeText(el, val) { if (el) el.textContent = val; }

  // ── Date utilities ─────────────────────────────
  function getPeriodRange(period) {
    var now = new Date();
    var from, to = new Date(now);
    to.setHours(23, 59, 59, 999);
    switch (period) {
      case 'month': from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case '3months': from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
      case 'year': from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      case 'all': from = new Date(2020, 0, 1); break;
      case 'custom':
        var df = $('anDateFrom') && $('anDateFrom').value;
        var dt = $('anDateTo') && $('anDateTo').value;
        from = df ? new Date(df) : new Date(2020, 0, 1);
        to = dt ? new Date(dt + 'T23:59:59') : new Date();
        break;
      default: from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    from.setHours(0, 0, 0, 0);
    return { from: from, to: to };
  }

  function getComparisonRange(mainFrom, mainTo, mode) {
    var diff = mainTo.getTime() - mainFrom.getTime();
    if (mode === 'yoy') {
      return {
        from: new Date(mainFrom.getFullYear() - 1, mainFrom.getMonth(), mainFrom.getDate()),
        to: new Date(mainTo.getFullYear() - 1, mainTo.getMonth(), mainTo.getDate())
      };
    }
    return { from: new Date(mainFrom.getTime() - diff), to: new Date(mainFrom.getTime() - 1) };
  }

  var MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  var DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  function monthKey(d) {
    var dt = new Date(d);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }
  function weekKey(d) {
    var dt = new Date(d);
    var oneJan = new Date(dt.getFullYear(), 0, 1);
    return dt.getFullYear() + '-W' + String(Math.ceil(((dt - oneJan) / 86400000 + oneJan.getDay() + 1) / 7)).padStart(2, '0');
  }
  function dayKey(d) { return new Date(d).toISOString().slice(0, 10); }

  function buildTimeSeries(reports, granularity, field) {
    field = field || 'created_at';
    var keyFn = granularity === 'day' ? dayKey : (granularity === 'week' ? weekKey : monthKey);
    var labelFn;
    if (granularity === 'day') {
      labelFn = function (k) {
        var parts = k.split('-');
        return parseInt(parts[2]) + ' ' + MONTH_NAMES[parseInt(parts[1]) - 1];
      };
    } else if (granularity === 'week') {
      labelFn = function (k) { return k; };
    } else {
      labelFn = function (k) {
        var parts = k.split('-');
        return MONTH_NAMES[parseInt(parts[1], 10) - 1] + ' ' + parts[0].slice(2);
      };
    }
    var byKey = groupBy(reports, function (r) { return keyFn(r[field] || r.created_at); });
    var keys = Object.keys(byKey).sort();
    return {
      labels: keys.map(labelFn),
      values: keys.map(function (k) { return byKey[k].length; }),
      keys: keys,
      groups: byKey
    };
  }

  // ── Linear regression ──────────────────────────
  function linearRegression(xs, ys) {
    var n = xs.length;
    if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
    var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (var i = 0; i < n; i++) {
      sumX += xs[i]; sumY += ys[i];
      sumXY += xs[i] * ys[i]; sumX2 += xs[i] * xs[i];
    }
    var denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n };
    var slope = (n * sumXY - sumX * sumY) / denom;
    var intercept = (sumY - slope * sumX) / n;
    return { slope: slope, intercept: intercept };
  }

  // ══════════════════════════════════════════════
  //  DATA LOADING & FILTERING
  // ══════════════════════════════════════════════

  function loadAnalyticsData() {
    var loadingEl = $('anLoading');
    if (loadingEl) loadingEl.hidden = false;

    var period = $('anPeriod') ? $('anPeriod').value : 'year';
    var range = getPeriodRange(period);
    var compMode = $('anCompare') ? $('anCompare').value : 'prev';
    var compRange = compMode !== 'none' ? getComparisonRange(range.from, range.to, compMode) : null;

    // Update date range display
    updateDateRangeDisplay(range);

    var fields = 'id,status,report_type,category,report_number,sample_date,created_at,updated_at,' +
      'validated_at,validated_by,signed_at,signed_by,released_at,released_by,uploaded_by,' +
      'is_urgent,has_abnormal_values,patient_viewed,patient_viewed_at,' +
      'patient_downloaded,download_count,patient_id,patient_fiscal_code,' +
      'patient_notified,patient_notified_at';

    var mainQ = 'select=' + fields + '&order=created_at.asc';
    if (period !== 'all') {
      mainQ += '&created_at=gte.' + range.from.toISOString() + '&created_at=lte.' + range.to.toISOString();
    }

    var promises = [sbGetAll('reports', mainQ), sbGetUsers()];
    if (compRange) {
      var compQ = 'select=' + fields + '&order=created_at.asc' +
        '&created_at=gte.' + compRange.from.toISOString() + '&created_at=lte.' + compRange.to.toISOString();
      promises.push(sbGetAll('reports', compQ));
    }

    return Promise.all(promises).then(function (results) {
      anState.rawReports = results[0] || [];
      anState.users = results[1] || [];
      anState.rawCompReports = results[2] || [];
      anState.compReports = anState.rawCompReports.slice();
      console.log('[Analytics v2] Loaded:', anState.rawReports.length, 'reports,', anState.users.length, 'users,', anState.compReports.length, 'comp');

      applyFilters();
      populateFilterDropdowns();
      renderActiveTab();

      // Update toolbar
      var now = new Date();
      safeText($('anLastUpdate'), 'Ultimo aggiornamento: ' + now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));

      if (loadingEl) loadingEl.hidden = true;
    }).catch(function (err) {
      console.error('[Analytics v2] Load error:', err);
      if (loadingEl) loadingEl.hidden = true;
    });
  }

  function applyFilters() {
    var rpts = anState.rawReports.slice();
    var comp = anState.rawCompReports.slice();

    var typeFilter = $('anTypeFilter') ? $('anTypeFilter').value : '';
    var catFilter = $('anCategoryFilter') ? $('anCategoryFilter').value : '';
    var opFilter = $('anOperatorFilter') ? $('anOperatorFilter').value : '';
    var urgFilter = $('anUrgencyFilter') ? $('anUrgencyFilter').value : '';

    function filterSet(arr) {
      if (typeFilter) arr = arr.filter(function (r) { return r.report_type === typeFilter; });
      if (catFilter) arr = arr.filter(function (r) { return r.category === catFilter; });
      if (opFilter) arr = arr.filter(function (r) {
        return r.uploaded_by === opFilter || r.validated_by === opFilter || r.released_by === opFilter;
      });
      if (urgFilter === 'urgent') arr = arr.filter(function (r) { return r.is_urgent; });
      if (urgFilter === 'normal') arr = arr.filter(function (r) { return !r.is_urgent; });
      return arr;
    }

    anState.reports = filterSet(rpts);
    anState.compReports = filterSet(comp);
  }

  function populateFilterDropdowns() {
    var rpts = anState.rawReports;

    // Type dropdown
    var typeSelect = $('anTypeFilter');
    if (typeSelect) {
      var currentType = typeSelect.value;
      var types = {};
      rpts.forEach(function (r) { if (r.report_type) types[r.report_type] = true; });
      var opts = '<option value="">Tutti</option>';
      Object.keys(types).sort().forEach(function (t) {
        opts += '<option value="' + t + '"' + (t === currentType ? ' selected' : '') + '>' + (TYPE_LABELS[t] || t) + '</option>';
      });
      typeSelect.innerHTML = opts;
    }

    // Category dropdown
    var catSelect = $('anCategoryFilter');
    if (catSelect) {
      var currentCat = catSelect.value;
      var cats = {};
      rpts.forEach(function (r) { if (r.category) cats[r.category] = true; });
      var catOpts = '<option value="">Tutte</option>';
      Object.keys(cats).sort().forEach(function (c) {
        var label = c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ');
        catOpts += '<option value="' + c + '"' + (c === currentCat ? ' selected' : '') + '>' + label + '</option>';
      });
      catSelect.innerHTML = catOpts;
    }

    // Operator dropdown
    var opSelect = $('anOperatorFilter');
    if (opSelect) {
      var currentOp = opSelect.value;
      var ops = {};
      rpts.forEach(function (r) {
        [r.uploaded_by, r.validated_by, r.released_by].forEach(function (uid) { if (uid) ops[uid] = true; });
      });
      var userMap = {};
      anState.users.forEach(function (u) { userMap[u.id] = u; });
      var opOpts = '<option value="">Tutti</option>';
      Object.keys(ops).sort().forEach(function (uid) {
        var u = userMap[uid];
        var label = u ? (u.first_name + ' ' + u.last_name).trim() : uid.substring(0, 8);
        opOpts += '<option value="' + uid + '"' + (uid === currentOp ? ' selected' : '') + '>' + label + '</option>';
      });
      opSelect.innerHTML = opOpts;
    }
  }

  function updateDateRangeDisplay(range) {
    var el = $('anDateRangeDisplay');
    if (!el) return;
    var opts = { day: '2-digit', month: 'short', year: 'numeric' };
    el.textContent = range.from.toLocaleDateString('it-IT', opts) + ' — ' + range.to.toLocaleDateString('it-IT', opts);
  }

  // ══════════════════════════════════════════════
  //  CHART.JS HELPERS
  // ══════════════════════════════════════════════

  function destroyChart(key) {
    if (anState.charts[key]) {
      try { anState.charts[key].destroy(); } catch (e) {}
      delete anState.charts[key];
    }
  }
  function destroyAllCharts() {
    Object.keys(anState.charts).forEach(function (key) {
      try { anState.charts[key].destroy(); } catch (e) {}
    });
    anState.charts = {};
  }

  function chartOptions(yLabel, showLegend, aspectRatio) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: aspectRatio || 2,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: showLegend !== false, labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10 }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { font: { size: 10 } }, title: { display: !!yLabel, text: yLabel || '', font: { size: 11 } } }
      }
    };
  }

  // ── Tab rendering dispatcher ───────────────────
  function renderActiveTab() {
    destroyAllCharts();
    switch (anState.activeTab) {
      case 'overview': renderOverview(); break;
      case 'volumi': renderVolumi(); break;
      case 'performance': renderPerformance(); break;
      case 'pazienti': renderPazienti(); break;
      case 'qualita': renderQualita(); break;
      case 'economics': /* placeholder, nothing to render */ break;
    }
  }

  // ── KPI delta helpers ──────────────────────────
  function setKpiDelta(id, current, previous) {
    var el = $(id);
    if (!el) return;
    var d = fmtDelta(current, previous);
    el.textContent = d.text;
    el.className = 'an-kpi-delta ' + d.cls;
  }
  function setKpiDeltaInv(id, current, previous) {
    var el = $(id);
    if (!el) return;
    var d = fmtDeltaInv(current, previous);
    el.textContent = d.text;
    el.className = 'an-kpi-delta ' + d.cls;
  }


  // ══════════════════════════════════════════════
  //  TAB 1: OVERVIEW
  // ══════════════════════════════════════════════
  function renderOverview() {
    var rpts = anState.reports;
    var comp = anState.compReports;

    // ── Compute TAT arrays (in minutes) ────────
    var releasedRpts = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var tatMinutes = releasedRpts.map(function (r) { return minutesDiff(r.created_at, r.released_at); }).filter(function (v) { return v != null && v >= 0; });

    var compReleased = comp.filter(function (r) { return r.released_at && r.created_at; });
    var compTat = compReleased.map(function (r) { return minutesDiff(r.created_at, r.released_at); }).filter(function (v) { return v != null && v >= 0; });

    // ── Row 1: 6 Strategic KPIs ────────────────
    var total = rpts.length;
    var queue = rpts.filter(function (r) { return r.status !== 'released' && r.status !== 'revoked'; }).length;
    var patients = countUnique(rpts, 'patient_id');
    var tatMean = mean(tatMinutes);
    var tatMedian = percentile(tatMinutes, 50);
    var tatP90 = percentile(tatMinutes, 90);
    var abnormal = rpts.filter(function (r) { return r.has_abnormal_values; }).length;
    var urgent = rpts.filter(function (r) { return r.is_urgent; }).length;

    safeText($('anKpiTotal'), total.toLocaleString('it-IT'));
    safeText($('anKpiTotalSub'), rpts.filter(function (r) { return r.status === 'released'; }).length + ' rilasciati');
    safeText($('anKpiQueue'), queue.toLocaleString('it-IT'));
    var queueSub = $('anKpiQueueSub');
    if (queueSub) {
      var pending = rpts.filter(function(r){return r.status==='pending';}).length;
      var validated = rpts.filter(function(r){return r.status==='validated';}).length;
      var signed = rpts.filter(function(r){return r.status==='signed';}).length;
      queueSub.textContent = pending + ' pending · ' + validated + ' validati · ' + signed + ' firmati';
    }
    safeText($('anKpiPatients'), patients.toLocaleString('it-IT'));
    var rptsPerPat = patients > 0 ? (total / patients).toFixed(1) : '0';
    safeText($('anKpiPatientsSub'), rptsPerPat + ' ref/paziente');

    safeText($('anKpiTat'), fmtDuration(tatMean));
    safeText($('anKpiTatSub'), 'mediano ' + fmtDuration(tatMedian) + ' · P90 ' + fmtDuration(tatP90));

    var abnPct = total > 0 ? ((abnormal / total) * 100).toFixed(1) : '0.0';
    safeText($('anKpiAbnormal'), abnormal + ' · ' + abnPct + '%');
    safeText($('anKpiAbnormalSub'), 'su ' + total + ' referti');

    var urgPct = total > 0 ? ((urgent / total) * 100).toFixed(1) : '0.0';
    safeText($('anKpiUrgent'), urgent + ' · ' + urgPct + '%');
    safeText($('anKpiUrgentSub'), 'su ' + total + ' referti');

    // Deltas vs comparison
    if (comp.length > 0) {
      setKpiDelta('anKpiTotalDelta', total, comp.length);
      var compQueue = comp.filter(function (r) { return r.status !== 'released' && r.status !== 'revoked'; }).length;
      setKpiDelta('anKpiQueueDelta', queue, compQueue);
      setKpiDelta('anKpiPatientsDelta', patients, countUnique(comp, 'patient_id'));
      setKpiDeltaInv('anKpiTatDelta', tatMean, mean(compTat));
      setKpiDelta('anKpiAbnormalDelta', abnormal, comp.filter(function (r) { return r.has_abnormal_values; }).length);
      setKpiDelta('anKpiUrgentDelta', urgent, comp.filter(function (r) { return r.is_urgent; }).length);
    }

    // Warn/danger thresholds on cards
    var abnCard = $('anKpiAbnormal') && $('anKpiAbnormal').closest('.an-kpi-card');
    if (abnCard) abnCard.className = 'an-kpi-card' + (parseFloat(abnPct) > 10 ? ' an-kpi-danger' : parseFloat(abnPct) > 5 ? ' an-kpi-warn' : '');
    var urgCard = $('anKpiUrgent') && $('anKpiUrgent').closest('.an-kpi-card');
    if (urgCard) urgCard.className = 'an-kpi-card' + (parseFloat(urgPct) > 5 ? ' an-kpi-warn' : '');

    // ── Row 2: 6 Operational KPIs ──────────────
    var period = getPeriodRange($('anPeriod') ? $('anPeriod').value : 'year');
    var allPatients = anState.users.filter(function (u) { return u.role === 'patient'; });
    var newPats = allPatients.filter(function (u) {
      var d = new Date(u.created_at);
      return d >= period.from && d <= period.to;
    });
    safeText($('anKpiNewPat'), newPats.length.toLocaleString('it-IT'));

    // Recurring
    var patReportCount = {};
    rpts.forEach(function (r) { if (r.patient_id) patReportCount[r.patient_id] = (patReportCount[r.patient_id] || 0) + 1; });
    var recurring = Object.values(patReportCount).filter(function (c) { return c > 1; }).length;
    safeText($('anKpiRecur'), recurring.toLocaleString('it-IT'));

    if (comp.length > 0) {
      var compNewPats = allPatients.filter(function (u) {
        var compRange = getComparisonRange(period.from, period.to, $('anCompare') ? $('anCompare').value : 'prev');
        var d = new Date(u.created_at);
        return d >= compRange.from && d <= compRange.to;
      });
      setKpiDelta('anKpiNewPatDelta', newPats.length, compNewPats.length);
      var compPatCount = {};
      comp.forEach(function (r) { if (r.patient_id) compPatCount[r.patient_id] = (compPatCount[r.patient_id] || 0) + 1; });
      var compRecurring = Object.values(compPatCount).filter(function (c) { return c > 1; }).length;
      setKpiDelta('anKpiRecurDelta', recurring, compRecurring);
    }

    // TAT sample→release (from sample_date)
    var sampleRpts = releasedRpts.filter(function (r) { return r.sample_date; });
    var sampleTats = sampleRpts.map(function (r) { return minutesDiff(r.sample_date, r.released_at); }).filter(function (v) { return v != null && v >= 0; });
    safeText($('anKpiSampleTat'), fmtDuration(percentile(sampleTats, 50)));

    // TAT upload→validation
    var valRpts = rpts.filter(function (r) { return r.validated_at && r.created_at; });
    var valTats = valRpts.map(function (r) { return minutesDiff(r.created_at, r.validated_at); }).filter(function (v) { return v != null && v >= 0; });
    safeText($('anKpiValTat'), fmtDuration(percentile(valTats, 50)));

    // SLA breach
    var slaHours = SLA_HOURS;
    var withinSLA = releasedRpts.filter(function (r) { return hoursDiff(r.created_at, r.released_at) <= slaHours; });
    var slaBreach = releasedRpts.length - withinSLA.length;
    var slaBreachPct = releasedRpts.length > 0 ? ((slaBreach / releasedRpts.length) * 100).toFixed(1) : '0.0';
    safeText($('anKpiSla'), slaBreach + ' · ' + slaBreachPct + '%');
    safeText($('anKpiSlaSub'), 'target \u2264 ' + (slaHours / 24) + 'gg · ' + withinSLA.length + ' OK');

    if (comp.length > 0) {
      var compSLABreach = compReleased.length - compReleased.filter(function(r){return hoursDiff(r.created_at, r.released_at) <= slaHours;}).length;
      setKpiDeltaInv('anKpiSlaDelta', slaBreach, compSLABreach);
    }

    var slaCard = $('anKpiSla') && $('anKpiSla').closest('.an-kpi-card');
    if (slaCard) {
      slaCard.setAttribute('data-drill', 'sla_breach');
      slaCard.className = 'an-kpi-card' + (slaBreach > 0 ? ' an-kpi-warn' : '');
    }

    // Download rate
    var downloadable = rpts.filter(function (r) { return r.status === 'released'; });
    var downloaded = downloadable.filter(function (r) { return r.patient_downloaded; });
    var dlRate = downloadable.length > 0 ? ((downloaded.length / downloadable.length) * 100).toFixed(1) : '0.0';
    safeText($('anKpiDownload'), dlRate + '%');

    // ── Volume + Forecast chart ──────────────────
    renderVolumeChart(rpts, comp);

    // ── Top Esami horizontal bars ────────────────
    renderTopEsami(rpts);

    // ── TAT Distribution chart ───────────────────
    renderTatDistChart(tatMinutes);

    // ── Heatmap ──────────────────────────────────
    renderHeatmap(rpts);

    // ── AI Insights ──────────────────────────────
    generateInsights(rpts, comp, tatMinutes, compTat);
  }

  // ── Volume chart with dual curves + forecast ──
  function renderVolumeChart(rpts, comp) {
    destroyChart('volume');
    var g = anState.granularity;
    var series = buildTimeSeries(rpts, g);

    // Summary line
    var total = series.values.reduce(function (a, b) { return a + b; }, 0);
    var avg = series.values.length > 0 ? (total / series.values.length).toFixed(0) : '0';
    safeText($('anVolumeSummary'), 'Tot: ' + total + ' · Media/' + (g === 'day' ? 'giorno' : g === 'week' ? 'sett.' : 'mese') + ': ' + avg);

    var datasets = [{
      label: 'Periodo corrente',
      data: series.values,
      borderColor: '#7CBA3D',
      backgroundColor: 'rgba(124,186,61,0.12)',
      fill: true, tension: 0.35, borderWidth: 2.5,
      pointRadius: g === 'month' ? 4 : (g === 'week' ? 2 : 0),
      pointBackgroundColor: '#7CBA3D'
    }];

    // Comparison
    if (comp && comp.length > 0) {
      var compSeries = buildTimeSeries(comp, g);
      var compData = compSeries.values;
      while (compData.length < series.values.length) compData.push(0);
      compData = compData.slice(0, series.values.length);
      datasets.push({
        label: 'Periodo precedente',
        data: compData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.07)',
        fill: true, tension: 0.35, borderWidth: 1.5,
        borderDash: [5, 3], pointRadius: 0
      });
    }

    // Forecast (only for month granularity with 3+ points)
    if (g === 'month' && series.values.length >= 3) {
      var xs = series.values.map(function (_, i) { return i; });
      var reg = linearRegression(xs, series.values);
      var forecastCount = 3; // 3 months
      var forecastLabels = [];
      var lastKey = series.keys[series.keys.length - 1];
      var lastParts = lastKey.split('-');
      var lastYear = parseInt(lastParts[0]);
      var lastMonth = parseInt(lastParts[1]);

      var forecastData = series.values.map(function () { return null; });
      // Connect forecast to last real point
      forecastData[forecastData.length - 1] = series.values[series.values.length - 1];

      for (var fi = 1; fi <= forecastCount; fi++) {
        var fMonth = lastMonth + fi;
        var fYear = lastYear;
        while (fMonth > 12) { fMonth -= 12; fYear++; }
        forecastLabels.push(MONTH_NAMES[fMonth - 1] + ' ' + String(fYear).slice(2));
        var predicted = Math.max(0, Math.round(reg.intercept + reg.slope * (series.values.length - 1 + fi)));
        forecastData.push(predicted);
      }

      series.labels = series.labels.concat(forecastLabels);
      datasets[0].data = series.values.concat([null, null, null]);
      if (datasets[1]) {
        datasets[1].data = datasets[1].data.concat([null, null, null]);
      }

      datasets.push({
        label: 'Forecast',
        data: forecastData,
        borderColor: '#8b5cf6',
        borderDash: [8, 4],
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#8b5cf6',
        fill: false,
        tension: 0
      });
    }

    var canvas = $('anChartVolume');
    if (!canvas) return;
    anState.charts['volume'] = new Chart(canvas, {
      type: 'line',
      data: { labels: series.labels, datasets: datasets },
      options: chartOptions('Referti', true, 2.2)
    });
  }

  // ── Top Esami horizontal bars (pure HTML) ─────
  function renderTopEsami(rpts) {
    var list = $('anTopEsamiList');
    if (!list) return;
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var entries = Object.entries(byType).sort(function (a, b) { return b[1].length - a[1].length; }).slice(0, 10);
    if (!entries.length) { list.innerHTML = '<li style="padding:1rem;color:var(--text-muted);font-size:0.82rem">Nessun dato</li>'; return; }

    var maxVal = entries[0][1].length;
    var html = '';
    entries.forEach(function (e, i) {
      var pct = maxVal > 0 ? ((e[1].length / maxVal) * 100).toFixed(1) : 0;
      var color = CHART_COLORS[i % CHART_COLORS.length];
      html += '<li class="an-top-bar-item" data-type="' + e[0] + '">' +
        '<span class="an-top-bar-label">' + (TYPE_LABELS[e[0]] || e[0]) + '</span>' +
        '<span class="an-top-bar-track"><span class="an-top-bar-fill" style="width:' + pct + '%;background:' + color + '"></span></span>' +
        '<span class="an-top-bar-value">' + e[1].length + ' (' + ((e[1].length / rpts.length) * 100).toFixed(1) + '%)</span>' +
        '</li>';
    });
    list.innerHTML = html;

    // Click-to-filter
    list.querySelectorAll('.an-top-bar-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var type = this.dataset.type;
        var sel = $('anTypeFilter');
        if (sel) {
          sel.value = type;
          loadAnalyticsData();
        }
      });
    });
  }

  // ── TAT Distribution chart ────────────────────
  function renderTatDistChart(tatMinutes) {
    destroyChart('tatDist');
    var canvas = $('anChartTatDist');
    if (!canvas) return;

    // Buckets in hours: 0-6h, 6-12h, 12-24h, 24-48h, 48-72h, 72h+
    var buckets = [
      { label: '0-6h', min: 0, max: 360, color: '#22c55e' },
      { label: '6-12h', min: 360, max: 720, color: '#84cc16' },
      { label: '12-24h', min: 720, max: 1440, color: '#f59e0b' },
      { label: '1-2gg', min: 1440, max: 2880, color: '#f97316' },
      { label: '2-3gg', min: 2880, max: 4320, color: '#ef4444' },
      { label: '3gg+', min: 4320, max: Infinity, color: '#991b1b' }
    ];

    var counts = buckets.map(function (b) {
      return tatMinutes.filter(function (t) { return t >= b.min && t < b.max; }).length;
    });

    anState.charts['tatDist'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: buckets.map(function (b) { return b.label; }),
        datasets: [{
          data: counts,
          backgroundColor: buckets.map(function (b) { return b.color; }),
          borderRadius: 6,
          maxBarThickness: 50
        }]
      },
      options: Object.assign({}, chartOptions('Referti'), {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                var pct = tatMinutes.length > 0 ? ((c.raw / tatMinutes.length) * 100).toFixed(1) : 0;
                return c.raw + ' referti (' + pct + '%)';
              }
            }
          }
        }
      })
    });
  }

  // ── Heatmap (bubble chart) ────────────────────
  function renderHeatmap(rpts) {
    destroyChart('heatmap');
    var canvas = $('anChartHeatmap');
    if (!canvas) return;

    var grid = {};
    rpts.forEach(function (r) {
      var d = new Date(r.created_at);
      var key = d.getDay() + '-' + d.getHours();
      grid[key] = (grid[key] || 0) + 1;
    });

    var data = [];
    var maxCount = 1;
    for (var day = 0; day < 7; day++) {
      for (var hour = 0; hour < 24; hour++) {
        var count = grid[day + '-' + hour] || 0;
        if (count > maxCount) maxCount = count;
        if (count > 0) {
          data.push({ x: hour, y: day, r: Math.min(Math.sqrt(count) * 3, 20), _count: count });
        }
      }
    }

    anState.charts['heatmap'] = new Chart(canvas, {
      type: 'bubble',
      data: {
        datasets: [{
          data: data,
          backgroundColor: 'rgba(124,186,61,0.5)',
          borderColor: '#7CBA3D',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                var d = c.raw;
                return DAY_NAMES_SHORT[d.y] + ' ore ' + d.x + ':00 \u2014 ' + d._count + ' referti';
              }
            }
          }
        },
        scales: {
          x: {
            min: -0.5, max: 23.5,
            ticks: { callback: function (v) { return v + ':00'; }, stepSize: 3, font: { size: 10 } },
            title: { display: true, text: 'Ora', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            min: -0.5, max: 6.5,
            ticks: { callback: function (v) { return DAY_NAMES_SHORT[v] || ''; }, stepSize: 1, font: { size: 10 } },
            title: { display: true, text: 'Giorno', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      }
    });
  }

  // ── AI Insights Generator ─────────────────────
  function generateInsights(rpts, comp, tatMinutes, compTat) {
    var el = $('anAlertsList');
    if (!el) return;
    var insights = [];
    var total = rpts.length;

    // 1. Volume trend
    if (comp.length > 0) {
      var delta = total - comp.length;
      var pct = comp.length > 0 ? ((delta / comp.length) * 100).toFixed(1) : 0;
      if (Math.abs(pct) > 15) {
        insights.push({
          icon: delta > 0 ? '\uD83D\uDCC8' : '\uD83D\uDCC9',
          text: 'Volume ' + (delta > 0 ? 'in crescita' : 'in calo') + ' del <strong>' + Math.abs(pct) + '%</strong> rispetto al periodo precedente (' + Math.abs(delta) + ' referti ' + (delta > 0 ? 'in pi\u00F9' : 'in meno') + ').',
          tag: Math.abs(pct) > 30 ? 'warning' : 'info'
        });
      }
    }

    // 2. TAT analysis
    if (tatMinutes.length > 0) {
      var tatMed = percentile(tatMinutes, 50);
      var tatP90Val = percentile(tatMinutes, 90);
      if (tatP90Val > SLA_HOURS * 60) {
        insights.push({
          icon: '\u23F1\uFE0F',
          text: 'Il TAT al P90 (' + fmtDuration(tatP90Val) + ') <strong>supera lo SLA di ' + (SLA_HOURS/24) + ' giorni</strong>. Il 10% dei referti richiede intervento.',
          tag: 'critical'
        });
      } else if (tatP90Val > SLA_HOURS * 60 * 0.8) {
        insights.push({
          icon: '\u23F1\uFE0F',
          text: 'TAT P90 a ' + fmtDuration(tatP90Val) + ': vicino al limite SLA. Monitorare attentamente.',
          tag: 'warning'
        });
      }

      if (compTat.length > 0) {
        var compMed = percentile(compTat, 50);
        if (tatMed < compMed * 0.85) {
          insights.push({
            icon: '\u2705',
            text: 'TAT mediano migliorato: ' + fmtDuration(tatMed) + ' vs ' + fmtDuration(compMed) + ' del periodo precedente.',
            tag: 'success'
          });
        }
      }
    }

    // 3. Abnormal ratio
    var abnormal = rpts.filter(function (r) { return r.has_abnormal_values; }).length;
    var abnPct = total > 0 ? (abnormal / total * 100) : 0;
    if (abnPct > 10) {
      insights.push({
        icon: '\u26A0\uFE0F',
        text: 'Tasso anomalie al <strong>' + abnPct.toFixed(1) + '%</strong> \u2014 sopra la soglia di attenzione (10%). Verificare lotti reagenti.',
        tag: 'critical'
      });
    } else if (abnPct > 7) {
      insights.push({
        icon: '\uD83D\uDD0D',
        text: 'Tasso anomalie al ' + abnPct.toFixed(1) + '% \u2014 in area di osservazione.',
        tag: 'warning'
      });
    }

    // 4. Download engagement
    var released = rpts.filter(function(r){return r.status==='released';});
    var downloadedR = released.filter(function(r){return r.patient_downloaded;});
    var dlPct = released.length > 0 ? (downloadedR.length / released.length * 100) : 0;
    if (dlPct < 30 && released.length > 10) {
      insights.push({
        icon: '\uD83D\uDCE5',
        text: 'Solo il <strong>' + dlPct.toFixed(1) + '%</strong> dei referti viene scaricato dai pazienti. Valutare notifiche push/email.',
        tag: 'info'
      });
    }

    // 5. Type concentration
    var byType = groupBy(rpts, function(r){return r.report_type||'altro';});
    var topType = Object.entries(byType).sort(function(a,b){return b[1].length-a[1].length;})[0];
    if (topType && total > 0 && (topType[1].length / total) > 0.5) {
      insights.push({
        icon: '\uD83C\uDFAF',
        text: '<strong>' + (TYPE_LABELS[topType[0]]||topType[0]) + '</strong> rappresenta il ' + ((topType[1].length/total)*100).toFixed(1) + '% del volume totale. Alta concentrazione su singolo esame.',
        tag: 'info'
      });
    }

    // 6. Weekend activity
    var weekendRpts = rpts.filter(function(r){var d=new Date(r.created_at).getDay();return d===0||d===6;});
    if (weekendRpts.length > 0 && total > 0) {
      var wkPct = (weekendRpts.length / total * 100);
      if (wkPct > 5) {
        insights.push({
          icon: '\uD83D\uDCC5',
          text: weekendRpts.length + ' referti nel weekend (' + wkPct.toFixed(1) + '% del totale). Attivit\u00E0 fuori orario presente.',
          tag: 'info'
        });
      }
    }

    // 7. CRITICAL: Abnormal values NOT downloaded — with patient list
    var userMap = {};
    anState.users.forEach(function(u){ userMap[u.id] = u; });
    var abnNotDl = released.filter(function(r){ return r.has_abnormal_values && !r.patient_downloaded; });
    if (abnNotDl.length > 0) {
      // Build patient list (unique by patient_id)
      var abnPatMap = {};
      abnNotDl.forEach(function(r) {
        var pid = r.patient_id || 'unknown';
        if (!abnPatMap[pid]) {
          var u = userMap[pid];
          abnPatMap[pid] = {
            name: u ? (u.last_name + ' ' + u.first_name).trim() : (r.patient_fiscal_code || pid.substring(0,8)),
            reports: []
          };
        }
        abnPatMap[pid].reports.push(r);
      });
      var abnPatList = Object.values(abnPatMap).sort(function(a,b){ return b.reports.length - a.reports.length; });
      var patNames = abnPatList.map(function(p){
        var daysSince = p.reports.reduce(function(max, r){
          var days = r.released_at ? Math.floor((Date.now() - new Date(r.released_at).getTime()) / 86400000) : 0;
          return Math.max(max, days);
        }, 0);
        return '<strong>' + p.name + '</strong>' + (p.reports.length > 1 ? ' (' + p.reports.length + ' referti)' : '') + ' <span style="color:var(--text-muted);font-size:0.75rem">' + daysSince + 'gg fa</span>';
      });
      insights.push({
        icon: '\uD83D\uDEA8',
        text: '<strong>' + abnNotDl.length + ' referti con valori anomali</strong> non ancora scaricati da <strong>' + abnPatList.length + ' pazienti</strong>:<br>' +
          '<div style="margin-top:0.35rem;padding-left:0.5rem;border-left:2px solid #ef4444">' + patNames.join('<br>') + '</div>',
        tag: 'critical',
        drill: 'abnormal_not_downloaded'
      });
    }

    // 8. Urgent NOT downloaded — with patient list
    var urgNotDl = released.filter(function(r){ return r.is_urgent && !r.patient_downloaded; });
    if (urgNotDl.length > 0) {
      var urgPatMap = {};
      urgNotDl.forEach(function(r) {
        var pid = r.patient_id || 'unknown';
        if (!urgPatMap[pid]) {
          var u = userMap[pid];
          urgPatMap[pid] = {
            name: u ? (u.last_name + ' ' + u.first_name).trim() : (r.patient_fiscal_code || pid.substring(0,8)),
            reports: []
          };
        }
        urgPatMap[pid].reports.push(r);
      });
      var urgPatList = Object.values(urgPatMap).sort(function(a,b){ return b.reports.length - a.reports.length; });
      var urgNames = urgPatList.map(function(p){
        return '<strong>' + p.name + '</strong>' + (p.reports.length > 1 ? ' (' + p.reports.length + ' referti)' : '');
      });
      insights.push({
        icon: '\u26A1',
        text: '<strong>' + urgNotDl.length + ' referti urgenti</strong> non ancora scaricati da <strong>' + urgPatList.length + ' pazienti</strong>: ' + urgNames.join(', ') + '.',
        tag: 'critical',
        drill: 'urgent_not_downloaded'
      });
    }

    // 9. Reports not viewed at all
    var notViewed = released.filter(function(r){ return !r.patient_viewed; });
    if (notViewed.length > 10 && released.length > 0) {
      var nvPct = (notViewed.length / released.length * 100).toFixed(1);
      insights.push({
        icon: '\uD83D\uDC41\uFE0F',
        text: '<strong>' + notViewed.length + ' referti</strong> (' + nvPct + '%) non ancora visualizzati dal paziente nel portale.',
        tag: notViewed.length > released.length * 0.5 ? 'warning' : 'info',
        drill: 'not_viewed'
      });
    }

    // Render insights
    if (insights.length === 0) {
      insights.push({ icon: '\u2705', text: 'Nessuna anomalia rilevata. Operativit\u00E0 nella norma.', tag: 'success' });
    }

    el.innerHTML = insights.map(function (i) {
      return '<div class="an-alert-item' + (i.drill ? ' an-alert-clickable' : '') + '"' + (i.drill ? ' data-drill="' + i.drill + '"' : '') + '>' +
        '<span class="an-alert-icon">' + i.icon + '</span>' +
        '<span class="an-alert-text">' + i.text + ' <span class="an-alert-tag ' + i.tag + '">' + i.tag + '</span></span>' +
        '</div>';
    }).join('');

    // Bind click on clickable alerts → drill-down
    el.querySelectorAll('.an-alert-clickable[data-drill]').forEach(function(item) {
      item.addEventListener('click', function() {
        openDrillDown(this.dataset.drill);
      });
    });
  }


  // ══════════════════════════════════════════════
  //  TAB 2: VOLUMI
  // ══════════════════════════════════════════════
  function renderVolumi() {
    var rpts = anState.reports;
    var comp = anState.compReports;
    renderVolumeByType(rpts);
    renderVolumeByCategory(rpts);
    renderUploadVsRelease(rpts, comp);
    renderVolumiTable(rpts, comp);
  }

  function renderVolumeByType(rpts) {
    destroyChart('volumeByType');
    var series = buildTimeSeries(rpts, 'month');
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var types = Object.keys(byType).sort(function (a, b) { return byType[b].length - byType[a].length; });
    var top8 = types.slice(0, 8);
    var hasOther = types.length > 8;

    var datasets = top8.map(function (t, i) {
      var tSeries = buildTimeSeries(byType[t], 'month');
      var data = series.keys.map(function (k) {
        var idx = tSeries.keys.indexOf(k);
        return idx >= 0 ? tSeries.values[idx] : 0;
      });
      return {
        label: TYPE_LABELS[t] || t, data: data,
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderRadius: 3, maxBarThickness: 40
      };
    });

    if (hasOther) {
      var otherTypes = types.slice(8);
      var otherData = series.keys.map(function (k) {
        var count = 0;
        otherTypes.forEach(function (t) {
          var ts = buildTimeSeries(byType[t], 'month');
          var idx = ts.keys.indexOf(k);
          if (idx >= 0) count += ts.values[idx];
        });
        return count;
      });
      datasets.push({ label: 'Altri', data: otherData, backgroundColor: '#94a3b8', borderRadius: 3, maxBarThickness: 40 });
    }

    var canvas = $('anChartVolumeByType');
    if (!canvas) return;
    anState.charts['volumeByType'] = new Chart(canvas, {
      type: 'bar',
      data: { labels: series.labels, datasets: datasets },
      options: Object.assign({}, chartOptions('Referti', true), {
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }
      })
    });
  }

  function renderVolumeByCategory(rpts) {
    destroyChart('volumeByCategory');
    var byCat = groupBy(rpts, function (r) { return r.category || 'laboratorio'; });
    var entries = Object.entries(byCat).sort(function (a, b) { return b[1].length - a[1].length; });
    var labels = entries.map(function (e) { return e[0].charAt(0).toUpperCase() + e[0].slice(1).replace(/_/g, ' '); });
    var values = entries.map(function (e) { return e[1].length; });
    var colors = entries.map(function (_, i) { return CHART_COLORS[i % CHART_COLORS.length]; });

    var canvas = $('anChartVolumeByCategory');
    if (!canvas) return;
    anState.charts['volumeByCategory'] = new Chart(canvas, {
      type: 'pie',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }] },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 1.5,
        animation: { duration: 300 },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  function renderUploadVsRelease(rpts, comp) {
    destroyChart('uploadVsRelease');
    var series = buildTimeSeries(rpts, 'month');
    var relRpts = rpts.filter(function (r) { return r.released_at; });
    var relSeries = buildTimeSeries(relRpts, 'month', 'released_at');

    var relData = series.keys.map(function (k) {
      var idx = relSeries.keys.indexOf(k);
      return idx >= 0 ? relSeries.values[idx] : 0;
    });

    var canvas = $('anChartUploadVsRelease');
    if (!canvas) return;
    anState.charts['uploadVsRelease'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Caricamenti', data: series.values, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Rilasci', data: relData, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
      },
      options: chartOptions('Referti', true)
    });
  }

  function renderVolumiTable(rpts, comp) {
    var body = $('anTableVolumiBody');
    if (!body) return;
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var compByType = groupBy(comp, function (r) { return r.report_type || 'altro'; });
    var types = Object.keys(byType).sort(function (a, b) { return byType[b].length - byType[a].length; });

    var html = '';
    types.forEach(function (t) {
      var items = byType[t];
      var total = items.length;
      var released = items.filter(function (r) { return r.status === 'released'; }).length;
      var inProgress = total - released;
      var pct = total > 0 ? ((released / total) * 100).toFixed(1) : '0.0';

      // TAT for this type
      var relItems = items.filter(function(r){return r.released_at && r.created_at;});
      var tats = relItems.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});
      var avgTat = tats.length > 0 ? fmtDuration(mean(tats)) : '-';

      var compTotal = (compByType[t] || []).length;
      var delta = fmtDelta(total, compTotal);

      html += '<tr>' +
        '<td><strong>' + (TYPE_LABELS[t] || t) + '</strong></td>' +
        '<td>' + total + '</td>' +
        '<td>' + released + '</td>' +
        '<td>' + inProgress + '</td>' +
        '<td>' + avgTat + '</td>' +
        '<td><span class="badge ' + (parseFloat(pct) >= 90 ? 'badge-released' : 'badge-pending') + '">' + pct + '%</span></td>' +
        '<td><span class="an-kpi-delta ' + delta.cls + '" style="font-size:0.78rem">' + delta.text + '</span></td>' +
        '</tr>';
    });

    if (!html) html = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">Nessun dato</td></tr>';
    body.innerHTML = html;
  }

  // ══════════════════════════════════════════════
  //  TAB 3: PERFORMANCE
  // ══════════════════════════════════════════════
  function renderPerformance() {
    var rpts = anState.reports;
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var tatMins = released.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});

    // KPIs
    safeText($('anPerfTatMean'), fmtDuration(mean(tatMins)));
    safeText($('anPerfTatMedian'), fmtDuration(percentile(tatMins, 50)));
    safeText($('anPerfTatP90'), fmtDuration(percentile(tatMins, 90)));
    safeText($('anPerfTatMax'), fmtDuration(tatMins.length > 0 ? Math.max.apply(null, tatMins) : 0));

    var withinSLA = released.filter(function(r){return hoursDiff(r.created_at, r.released_at) <= SLA_HOURS;});
    var slaOkPct = released.length > 0 ? ((withinSLA.length / released.length) * 100).toFixed(1) : '0.0';
    safeText($('anPerfSlaOk'), slaOkPct + '%');
    safeText($('anPerfSlaBreach'), (released.length - withinSLA.length).toString());

    // P90 card coloring
    var p90Card = $('anPerfTatP90') && $('anPerfTatP90').closest('.an-kpi-card');
    if (p90Card) {
      var p90hours = percentile(tatMins, 90) / 60;
      p90Card.className = 'an-kpi-card' + (p90hours > SLA_HOURS ? ' an-kpi-danger' : p90hours > SLA_HOURS * 0.8 ? ' an-kpi-warn' : '');
    }

    renderPhaseTimeChart(rpts);
    renderTimeDistribution(released);
    renderOperatorRank(rpts);
  }

  function renderPhaseTimeChart(rpts) {
    destroyChart('phaseTime');
    var series = buildTimeSeries(rpts, 'month');
    var validated = rpts.filter(function (r) { return r.validated_at && r.created_at; });
    var released = rpts.filter(function (r) { return r.released_at && r.validated_at; });

    var valByMonth = {};
    validated.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!valByMonth[mk]) valByMonth[mk] = [];
      valByMonth[mk].push(minutesDiff(r.created_at, r.validated_at) / 60); // hours
    });

    var relByMonth = {};
    released.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!relByMonth[mk]) relByMonth[mk] = [];
      relByMonth[mk].push(minutesDiff(r.validated_at, r.released_at) / 60); // hours
    });

    var valData = series.keys.map(function (k) {
      var arr = valByMonth[k];
      return arr ? +(mean(arr)).toFixed(1) : 0;
    });
    var relData = series.keys.map(function (k) {
      var arr = relByMonth[k];
      return arr ? +(mean(arr)).toFixed(1) : 0;
    });

    var canvas = $('anChartPhaseTime');
    if (!canvas) return;
    anState.charts['phaseTime'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Upload \u2192 Validazione (ore)', data: valData, backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 30 },
          { label: 'Validazione \u2192 Rilascio (ore)', data: relData, backgroundColor: '#22c55e', borderRadius: 4, maxBarThickness: 30 }
        ]
      },
      options: Object.assign({}, chartOptions('Ore', true), {
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Ore' } } }
      })
    });
  }

  function renderTimeDistribution(released) {
    destroyChart('timeDistribution');
    var tatMins = released.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});

    var buckets = [
      { label: '<6h', max: 360, color: '#22c55e' },
      { label: '6-12h', max: 720, color: '#84cc16' },
      { label: '12-24h', max: 1440, color: '#f59e0b' },
      { label: '1-2gg', max: 2880, color: '#f97316' },
      { label: '2-3gg', max: 4320, color: '#ef4444' },
      { label: '>3gg', max: Infinity, color: '#991b1b' }
    ];
    var prev = 0;
    var counts = buckets.map(function (b) {
      var c = tatMins.filter(function (t) { return t >= prev && t < b.max; }).length;
      prev = b.max;
      return c;
    });

    var canvas = $('anChartTimeDistribution');
    if (!canvas) return;
    anState.charts['timeDistribution'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: buckets.map(function (b) { return b.label; }),
        datasets: [{ data: counts, backgroundColor: buckets.map(function(b){return b.color;}), borderRadius: 6, maxBarThickness: 50 }]
      },
      options: Object.assign({}, chartOptions('Referti'), { plugins: { legend: { display: false } } })
    });
  }

  function renderOperatorRank(rpts) {
    destroyChart('operatorRank');
    var userMap = {};
    anState.users.forEach(function (u) { userMap[u.id] = u; });

    var ops = {};
    rpts.forEach(function (r) {
      [r.uploaded_by, r.validated_by, r.released_by].forEach(function (uid) {
        if (uid) ops[uid] = (ops[uid] || 0) + 1;
      });
    });

    var entries = Object.entries(ops)
      .map(function (e) {
        var u = userMap[e[0]];
        return { name: u ? (u.first_name + ' ' + u.last_name).trim() : e[0].substring(0, 8), count: e[1] };
      })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 10);

    var canvas = $('anChartOperatorRank');
    if (!canvas) return;
    anState.charts['operatorRank'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return e.name; }),
        datasets: [{ label: 'Operazioni', data: entries.map(function (e) { return e.count; }), backgroundColor: '#7CBA3D', borderRadius: 6, maxBarThickness: 40 }]
      },
      options: Object.assign({}, chartOptions('Operazioni'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  // ══════════════════════════════════════════════
  //  TAB 4: PAZIENTI
  // ══════════════════════════════════════════════
  function renderPazienti() {
    var rpts = anState.reports;
    var allPatients = anState.users.filter(function (u) { return u.role === 'patient'; });
    var period = getPeriodRange($('anPeriod') ? $('anPeriod').value : 'year');

    // Total patients
    safeText($('anPatTotal'), allPatients.length.toLocaleString('it-IT'));

    // New patients in period
    var newPats = allPatients.filter(function (u) {
      var d = new Date(u.created_at);
      return d >= period.from && d <= period.to;
    });
    safeText($('anPatNew'), newPats.length.toLocaleString('it-IT'));

    // Comparison delta
    if (anState.compReports.length > 0) {
      var compRange = getComparisonRange(period.from, period.to, $('anCompare') ? $('anCompare').value : 'prev');
      var compNewPats = allPatients.filter(function(u){var d=new Date(u.created_at);return d>=compRange.from&&d<=compRange.to;});
      setKpiDelta('anPatNewDelta', newPats.length, compNewPats.length);
    }

    // Recurring
    var patReportCount = {};
    rpts.forEach(function (r) { if (r.patient_id) patReportCount[r.patient_id] = (patReportCount[r.patient_id] || 0) + 1; });
    var recurring = Object.values(patReportCount).filter(function (c) { return c > 1; }).length;
    var uniquePats = Object.keys(patReportCount).length;
    safeText($('anPatRecurring'), recurring.toLocaleString('it-IT'));
    safeText($('anPatRecurringSub'), uniquePats > 0 ? ((recurring/uniquePats)*100).toFixed(1) + '% dei pazienti attivi' : '');

    // Frequency
    var avgFreq = uniquePats > 0 ? (rpts.length / uniquePats).toFixed(1) : '0';
    safeText($('anPatFreq'), avgFreq);

    // Download rate
    var released = rpts.filter(function (r) { return r.status === 'released'; });
    var downloaded = released.filter(function (r) { return r.patient_downloaded; });
    var dlRate = released.length > 0 ? ((downloaded.length / released.length) * 100).toFixed(1) : '0.0';
    safeText($('anPatDownloadRate'), dlRate + '%');

    // Retention 90d: patients who had a report in first half of period AND also in second half
    var midPoint = new Date((period.from.getTime() + period.to.getTime()) / 2);
    var firstHalf = {};
    var secondHalf = {};
    rpts.forEach(function (r) {
      if (!r.patient_id) return;
      var d = new Date(r.created_at);
      if (d <= midPoint) firstHalf[r.patient_id] = true;
      else secondHalf[r.patient_id] = true;
    });
    var retained = Object.keys(firstHalf).filter(function(pid){return secondHalf[pid];}).length;
    var firstHalfCount = Object.keys(firstHalf).length;
    var retentionPct = firstHalfCount > 0 ? ((retained / firstHalfCount) * 100).toFixed(1) : '0.0';
    safeText($('anPatRetention'), retentionPct + '%');

    renderNewPatientsChart(rpts, period);
    renderAgeSexChart(allPatients);
    renderTopPatientsChart(rpts);
    renderViewVsDownload(rpts);
  }

  function renderNewPatientsChart(rpts, period) {
    destroyChart('newPatients');
    // Two datasets: new patients and recurring
    var allPatients = anState.users.filter(function(u){return u.role==='patient';});
    var newInRange = allPatients.filter(function(u){var d=new Date(u.created_at);return d>=period.from&&d<=period.to;});
    var newSet = {};
    newInRange.forEach(function(u){newSet[u.id]=true;});

    var series = buildTimeSeries(rpts, 'month');
    var newByMonth = {};
    var recurByMonth = {};
    rpts.forEach(function(r) {
      if (!r.patient_id) return;
      var mk = monthKey(r.created_at);
      if (newSet[r.patient_id]) {
        newByMonth[mk] = (newByMonth[mk]||0) + 1;
      } else {
        recurByMonth[mk] = (recurByMonth[mk]||0) + 1;
      }
    });

    var canvas = $('anChartNewPatients');
    if (!canvas) return;
    anState.charts['newPatients'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Nuovi pazienti', data: series.keys.map(function(k){return newByMonth[k]||0;}), backgroundColor: '#8b5cf6', borderRadius: 4, maxBarThickness: 30 },
          { label: 'Ricorrenti', data: series.keys.map(function(k){return recurByMonth[k]||0;}), backgroundColor: '#06b6d4', borderRadius: 4, maxBarThickness: 30 }
        ]
      },
      options: Object.assign({}, chartOptions('Referti', true), {
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }
      })
    });
  }

  function renderAgeSexChart(patients) {
    destroyChart('ageSex');
    // Age groups: <20, 20-29, 30-39, 40-49, 50-59, 60-69, 70+
    var buckets = ['<20', '20-29', '30-39', '40-49', '50-59', '60-69', '70+'];
    var now = new Date();
    var male = new Array(buckets.length).fill(0);
    var female = new Array(buckets.length).fill(0);
    var other = new Array(buckets.length).fill(0);

    patients.forEach(function (p) {
      if (!p.date_of_birth) return;
      var age = (now.getTime() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 3600000);
      var idx = age < 20 ? 0 : age < 30 ? 1 : age < 40 ? 2 : age < 50 ? 3 : age < 60 ? 4 : age < 70 ? 5 : 6;
      if (p.gender === 'M' || p.gender === 'male') male[idx]++;
      else if (p.gender === 'F' || p.gender === 'female') female[idx]++;
      else other[idx]++;
    });

    var canvas = $('anChartAgeSex');
    if (!canvas) return;

    var datasets = [
      { label: 'Donne', data: female, backgroundColor: '#ec4899', borderRadius: 4, maxBarThickness: 30 },
      { label: 'Uomini', data: male, backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 30 }
    ];
    if (other.some(function(v){return v>0;})) {
      datasets.push({ label: 'Altro', data: other, backgroundColor: '#94a3b8', borderRadius: 4, maxBarThickness: 30 });
    }

    anState.charts['ageSex'] = new Chart(canvas, {
      type: 'bar',
      data: { labels: buckets, datasets: datasets },
      options: chartOptions('Pazienti', true)
    });
  }

  function renderTopPatientsChart(rpts) {
    destroyChart('topPatients');
    var patCount = {};
    rpts.forEach(function (r) { if (r.patient_id) patCount[r.patient_id] = (patCount[r.patient_id] || 0) + 1; });
    var userMap = {};
    anState.users.forEach(function (u) { userMap[u.id] = u; });

    var entries = Object.entries(patCount)
      .map(function (e) {
        var u = userMap[e[0]];
        var label = u ? (u.last_name + ' ' + (u.first_name || '')[0] + '.').trim() : e[0].substring(0, 8);
        return { name: label, count: e[1] };
      })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 10);

    var canvas = $('anChartTopPatients');
    if (!canvas) return;
    anState.charts['topPatients'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return e.name; }),
        datasets: [{ label: 'N. Referti', data: entries.map(function (e) { return e.count; }), backgroundColor: '#06b6d4', borderRadius: 6, maxBarThickness: 40 }]
      },
      options: Object.assign({}, chartOptions('N. Referti'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function renderViewVsDownload(rpts) {
    destroyChart('viewVsDownload');
    var released = rpts.filter(function (r) { return r.status === 'released'; });
    var series = buildTimeSeries(released, 'month', 'released_at');

    var viewedByMonth = {};
    var downloadedByMonth = {};
    released.forEach(function (r) {
      var mk = monthKey(r.released_at || r.created_at);
      if (r.patient_viewed) viewedByMonth[mk] = (viewedByMonth[mk] || 0) + 1;
      if (r.patient_downloaded) downloadedByMonth[mk] = (downloadedByMonth[mk] || 0) + 1;
    });

    var canvas = $('anChartViewVsDownload');
    if (!canvas) return;
    anState.charts['viewVsDownload'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Visualizzati', data: series.keys.map(function(k){return viewedByMonth[k]||0;}), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Scaricati', data: series.keys.map(function(k){return downloadedByMonth[k]||0;}), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
      },
      options: chartOptions('Referti', true)
    });
  }

  // ══════════════════════════════════════════════
  //  TAB 5: QUALIT\u00C0
  // ══════════════════════════════════════════════
  function renderQualita() {
    var rpts = anState.reports;
    var comp = anState.compReports;
    var total = rpts.length;
    var abnormal = rpts.filter(function (r) { return r.has_abnormal_values; }).length;
    var urgent = rpts.filter(function (r) { return r.is_urgent; }).length;
    var revoked = rpts.filter(function (r) { return r.status === 'revoked'; }).length;

    var abnPct = total > 0 ? ((abnormal / total) * 100).toFixed(1) : '0.0';
    safeText($('anQualAbnormal'), abnormal + ' · ' + abnPct + '%');
    safeText($('anQualAbnSub'), 'su ' + total + ' referti');

    var urgPct = total > 0 ? ((urgent / total) * 100).toFixed(1) : '0.0';
    safeText($('anQualUrgent'), urgent + ' · ' + urgPct + '%');
    safeText($('anQualUrgSub'), 'su ' + total + ' referti');

    // SLA
    var released = rpts.filter(function(r){return r.released_at && r.created_at;});
    var withinSLA = released.filter(function(r){return hoursDiff(r.created_at, r.released_at) <= SLA_HOURS;});
    var slaPct = released.length > 0 ? ((withinSLA.length / released.length) * 100).toFixed(1) : '0.0';
    safeText($('anQualSLA'), slaPct + '%');

    safeText($('anQualRevoked'), revoked.toLocaleString('it-IT'));

    // TAT P90 for abnormal and urgent subsets
    var abnRpts = rpts.filter(function(r){return r.has_abnormal_values && r.released_at && r.created_at;});
    var abnTats = abnRpts.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});
    safeText($('anQualTatAbn'), fmtDuration(percentile(abnTats, 90)));

    var urgRpts = rpts.filter(function(r){return r.is_urgent && r.released_at && r.created_at;});
    var urgTats = urgRpts.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});
    safeText($('anQualTatUrg'), fmtDuration(percentile(urgTats, 90)));

    // Deltas
    if (comp.length > 0) {
      setKpiDelta('anQualAbnDelta', abnormal, comp.filter(function(r){return r.has_abnormal_values;}).length);
      setKpiDelta('anQualUrgDelta', urgent, comp.filter(function(r){return r.is_urgent;}).length);
    }

    renderAnomalyTrend(rpts);
    renderUrgentByType(rpts);
    renderSLAMonitor(rpts);
  }

  function renderAnomalyTrend(rpts) {
    destroyChart('anomalyTrend');
    var series = buildTimeSeries(rpts, 'month');
    var abnRpts = rpts.filter(function (r) { return r.has_abnormal_values; });
    var abnSeries = buildTimeSeries(abnRpts, 'month');

    var totalByMonth = {};
    series.keys.forEach(function (k, i) { totalByMonth[k] = series.values[i]; });

    var pctData = series.keys.map(function (k) {
      var idx = abnSeries.keys.indexOf(k);
      var abn = idx >= 0 ? abnSeries.values[idx] : 0;
      var tot = totalByMonth[k] || 0;
      return tot > 0 ? +((abn / tot) * 100).toFixed(1) : 0;
    });

    var absData = series.keys.map(function (k) {
      var idx = abnSeries.keys.indexOf(k);
      return idx >= 0 ? abnSeries.values[idx] : 0;
    });

    var canvas = $('anChartAnomalyTrend');
    if (!canvas) return;
    anState.charts['anomalyTrend'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'N. Anomali', data: absData, backgroundColor: '#ef4444', borderRadius: 4, maxBarThickness: 30, yAxisID: 'y' },
          { label: '% Anomali', data: pctData, type: 'line', borderColor: '#f97316', borderWidth: 2, tension: 0.3, pointRadius: 3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 2, animation: { duration: 300 },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, position: 'left', title: { display: true, text: 'N. Anomali' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '%' }, ticks: { callback: function (v) { return v + '%'; } } }
        },
        plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  function renderUrgentByType(rpts) {
    destroyChart('urgentByType');
    var urgRpts = rpts.filter(function (r) { return r.is_urgent; });
    var byType = groupBy(urgRpts, function (r) { return r.report_type || 'altro'; });
    var entries = Object.entries(byType).sort(function (a, b) { return b[1].length - a[1].length; }).slice(0, 10);

    var canvas = $('anChartUrgentByType');
    if (!canvas) return;
    anState.charts['urgentByType'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return TYPE_LABELS[e[0]] || e[0]; }),
        datasets: [{ label: 'Urgenze', data: entries.map(function (e) { return e[1].length; }), backgroundColor: '#f59e0b', borderRadius: 6, maxBarThickness: 40 }]
      },
      options: Object.assign({}, chartOptions('Urgenze'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function renderSLAMonitor(rpts) {
    destroyChart('slaMonitor');
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var series = buildTimeSeries(released, 'month');

    var avgByMonth = {};
    released.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!avgByMonth[mk]) avgByMonth[mk] = [];
      avgByMonth[mk].push(hoursDiff(r.created_at, r.released_at));
    });

    var avgData = series.keys.map(function (k) {
      var arr = avgByMonth[k];
      return arr ? +(mean(arr)).toFixed(1) : 0;
    });

    var slaLine = series.keys.map(function () { return SLA_HOURS; });
    var barColors = avgData.map(function (v) { return v <= SLA_HOURS ? '#22c55e' : '#ef4444'; });

    var canvas = $('anChartSLAMonitor');
    if (!canvas) return;
    anState.charts['slaMonitor'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Media ore rilascio', data: avgData, backgroundColor: barColors, borderRadius: 6, maxBarThickness: 40 },
          { label: 'SLA Target (' + SLA_HOURS + 'h)', data: slaLine, type: 'line', borderColor: '#ef4444', borderWidth: 2, borderDash: [6, 3], pointRadius: 0, fill: false }
        ]
      },
      options: chartOptions('Ore', true)
    });
  }


  // ══════════════════════════════════════════════
  //  DRILL-DOWN MODAL
  // ══════════════════════════════════════════════
  function openDrillDown(type) {
    var container = $('anDrillContainer');
    if (!container) return;
    var rpts = anState.reports;
    var title = '';
    var rows = [];
    var userMap = {};
    anState.users.forEach(function(u){ userMap[u.id] = u; });

    function userName(uid) {
      var u = userMap[uid];
      return u ? (u.first_name + ' ' + u.last_name).trim() : (uid ? uid.substring(0,8) : '-');
    }

    switch (type) {
      case 'total':
        title = 'Tutti i Referti (' + rpts.length + ')';
        rows = rpts;
        break;
      case 'queue':
        rows = rpts.filter(function(r){return r.status!=='released'&&r.status!=='revoked';});
        title = 'Referti In Coda (' + rows.length + ')';
        break;
      case 'patients':
        title = 'Pazienti Unici';
        var patMap = {};
        rpts.forEach(function(r){
          if (r.patient_id && !patMap[r.patient_id]) {
            var u = userMap[r.patient_id];
            patMap[r.patient_id] = {
              name: u ? (u.last_name + ' ' + u.first_name).trim() : r.patient_fiscal_code || r.patient_id.substring(0,8),
              count: 0
            };
          }
          if (r.patient_id) patMap[r.patient_id].count++;
        });
        var patEntries = Object.values(patMap).sort(function(a,b){return b.count-a.count;});
        container.innerHTML = buildDrillModal(title, '<table class="an-drill-table"><thead><tr><th>Paziente</th><th>N. Referti</th></tr></thead><tbody>' +
          patEntries.map(function(p){return '<tr><td>'+p.name+'</td><td>'+p.count+'</td></tr>';}).join('') + '</tbody></table>');
        bindDrillClose(container);
        return;
      case 'abnormal':
        rows = rpts.filter(function(r){return r.has_abnormal_values;});
        title = 'Referti con Valori Anomali (' + rows.length + ')';
        break;
      case 'urgent':
        rows = rpts.filter(function(r){return r.is_urgent;});
        title = 'Referti Urgenti (' + rows.length + ')';
        break;
      case 'sla_breach':
        rows = rpts.filter(function(r){return r.released_at && r.created_at && hoursDiff(r.created_at, r.released_at) > SLA_HOURS;});
        title = 'Referti Oltre SLA (' + rows.length + ')';
        break;
      case 'abnormal_not_downloaded':
        rows = rpts.filter(function(r){return r.status==='released' && r.has_abnormal_values && !r.patient_downloaded;});
        title = 'Valori Anomali NON Scaricati (' + rows.length + ')';
        break;
      case 'urgent_not_downloaded':
        rows = rpts.filter(function(r){return r.status==='released' && r.is_urgent && !r.patient_downloaded;});
        title = 'Urgenti NON Scaricati (' + rows.length + ')';
        break;
      case 'not_viewed':
        rows = rpts.filter(function(r){return r.status==='released' && !r.patient_viewed;});
        title = 'Referti NON Visualizzati (' + rows.length + ')';
        break;
      default:
        return;
    }

    // Date formatter helper
    function fmtDate(d) {
      if (!d) return '-';
      try { return new Date(d).toLocaleDateString('it-IT', {day:'2-digit',month:'2-digit',year:'numeric'}); }
      catch(e) { return d.substring(0,10); }
    }

    // Standard report table — enhanced columns for specific drill types
    var isActionable = (type === 'abnormal_not_downloaded' || type === 'urgent_not_downloaded' || type === 'not_viewed');
    var tableHtml = '<table class="an-drill-table"><thead><tr>' +
      '<th>N. Referto</th><th>Tipo</th>' +
      (isActionable ? '<th>Paziente</th><th>CF</th><th>Rilasciato</th><th>Giorni</th><th>Visualizzato</th><th>Scaricato</th>' :
       '<th>Categoria</th><th>Stato</th><th>Creato</th><th>TAT</th><th>Paziente</th>') +
      '</tr></thead><tbody>';
    rows.slice(0, 200).forEach(function(r) {
      if (isActionable) {
        var u = r.patient_id ? userMap[r.patient_id] : null;
        var patName = u ? (u.last_name + ' ' + u.first_name).trim() : (r.patient_fiscal_code || '-');
        var relDate = fmtDate(r.released_at);
        var daysSince = r.released_at ? Math.floor((Date.now() - new Date(r.released_at).getTime()) / 86400000) : '-';
        var daysClass = daysSince !== '-' && daysSince > 7 ? ' style="color:#ef4444;font-weight:700"' : (daysSince > 3 ? ' style="color:#f59e0b;font-weight:600"' : '');
        tableHtml += '<tr>' +
          '<td>' + (r.report_number || '-') + '</td>' +
          '<td>' + (TYPE_LABELS[r.report_type] || r.report_type || '-') + '</td>' +
          '<td><strong>' + patName + '</strong></td>' +
          '<td style="font-size:0.75rem;font-family:monospace">' + (r.patient_fiscal_code || '-') + '</td>' +
          '<td>' + relDate + '</td>' +
          '<td' + daysClass + '>' + daysSince + '</td>' +
          '<td>' + (r.patient_viewed ? '&#10003;' : '<span style="color:#ef4444">&#10007;</span>') + '</td>' +
          '<td>' + (r.patient_downloaded ? '&#10003;' : '<span style="color:#ef4444">&#10007;</span>') + '</td>' +
          '</tr>';
      } else {
        var tat = r.released_at && r.created_at ? fmtDuration(minutesDiff(r.created_at, r.released_at)) : '-';
        var patName2 = '-';
        if (r.patient_id) { var u2 = userMap[r.patient_id]; patName2 = u2 ? (u2.last_name + ' ' + (u2.first_name||'')[0] + '.').trim() : (r.patient_fiscal_code || '-'); }
        tableHtml += '<tr>' +
          '<td>' + (r.report_number || '-') + '</td>' +
          '<td>' + (TYPE_LABELS[r.report_type] || r.report_type || '-') + '</td>' +
          '<td>' + (r.category || '-') + '</td>' +
          '<td><span class="badge badge-' + r.status + '">' + r.status + '</span></td>' +
          '<td>' + fmtDate(r.created_at) + '</td>' +
          '<td>' + tat + '</td>' +
          '<td>' + patName2 + '</td>' +
          '</tr>';
      }
    });
    if (rows.length > 200) tableHtml += '<tr><td colspan="' + (isActionable ? 8 : 7) + '" style="text-align:center;color:var(--text-muted);font-style:italic">Mostrati 200 di ' + rows.length + '</td></tr>';
    tableHtml += '</tbody></table>';

    container.innerHTML = buildDrillModal(title, tableHtml);
    bindDrillClose(container);
  }

  function buildDrillModal(title, bodyHtml) {
    return '<div class="an-drill-overlay">' +
      '<div class="an-drill-modal">' +
      '<div class="an-drill-header"><h3>' + title + '</h3><button class="an-drill-close">&times;</button></div>' +
      '<div class="an-drill-body">' + bodyHtml + '</div>' +
      '</div></div>';
  }

  function bindDrillClose(container) {
    var overlay = container.querySelector('.an-drill-overlay');
    var closeBtn = container.querySelector('.an-drill-close');
    if (closeBtn) closeBtn.addEventListener('click', function(){ container.innerHTML = ''; });
    if (overlay) overlay.addEventListener('click', function(e){
      if (e.target === overlay) container.innerHTML = '';
    });
  }

  // ══════════════════════════════════════════════
  //  EXPORTS
  // ══════════════════════════════════════════════
  function exportPDF() {
    if (!window.html2canvas || !window.jspdf) { alert('Librerie di esportazione non caricate.'); return; }
    var target = document.querySelector('.an-panel.active');
    if (!target) return;

    var btn = $('anExportPdf');
    if (btn) { btn.disabled = true; btn.textContent = 'Generazione PDF...'; }

    html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function (canvas) {
      var imgData = canvas.toDataURL('image/png');
      var pdf = new jspdf.jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm', format: 'a4'
      });
      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 10;
      var imgW = pageW - margin * 2;
      var imgH = (canvas.height * imgW) / canvas.width;

      pdf.setFontSize(16);
      pdf.setTextColor(0, 112, 74);
      pdf.text('Bio-Clinic Analytics BI \u2014 ' + anState.activeTab.toUpperCase(), margin, margin + 5);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text('Generato il ' + new Date().toLocaleDateString('it-IT') + ' alle ' + new Date().toLocaleTimeString('it-IT'), margin, margin + 11);

      var yOff = margin + 16;
      if (imgH + yOff > pageH) {
        var remaining = imgH;
        var sourceY = 0;
        while (remaining > 0) {
          var sliceH = Math.min(remaining, pageH - yOff);
          var sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = (sliceH / imgH) * canvas.height;
          var ctx2 = sliceCanvas.getContext('2d');
          ctx2.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, yOff, imgW, sliceH);
          remaining -= sliceH;
          sourceY += sliceCanvas.height;
          if (remaining > 0) { pdf.addPage(); yOff = margin; }
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, yOff, imgW, imgH);
      }

      pdf.save('BioClinic_Analytics_' + anState.activeTab + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'PDF'; }
    });
  }

  function exportExcel() {
    if (!window.XLSX) { alert('Libreria SheetJS non caricata.'); return; }
    var wb = XLSX.utils.book_new();
    var rpts = anState.reports;

    // Sheet 1: All reports
    var rows = rpts.map(function (r) {
      var tat = r.released_at && r.created_at ? +(minutesDiff(r.created_at, r.released_at) / 60).toFixed(1) : '';
      return {
        'N. Referto': r.report_number, 'Tipo': TYPE_LABELS[r.report_type] || r.report_type,
        'Categoria': r.category, 'Stato': r.status,
        'Data Prelievo': r.sample_date, 'Creato': r.created_at ? r.created_at.substring(0, 10) : '',
        'Validato': r.validated_at ? r.validated_at.substring(0, 10) : '',
        'Rilasciato': r.released_at ? r.released_at.substring(0, 10) : '',
        'TAT (ore)': tat,
        'Urgente': r.is_urgent ? 'Si' : 'No',
        'Valori Anomali': r.has_abnormal_values ? 'Si' : 'No',
        'Visualizzato': r.patient_viewed ? 'Si' : 'No',
        'Scaricato': r.patient_downloaded ? 'Si' : 'No',
        'N. Download': r.download_count || 0,
        'CF Paziente': r.patient_fiscal_code || ''
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Referti');

    // Sheet 2: Volume per tipo with TAT
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var typeRows = Object.entries(byType)
      .sort(function (a, b) { return b[1].length - a[1].length; })
      .map(function (e) {
        var items = e[1];
        var relItems = items.filter(function(r){return r.released_at&&r.created_at;});
        var tats = relItems.map(function(r){return minutesDiff(r.created_at, r.released_at)/60;}).filter(function(v){return v!=null&&v>=0;});
        return {
          'Tipo': TYPE_LABELS[e[0]] || e[0], 'Totale': items.length,
          'Rilasciati': items.filter(function(r){return r.status==='released';}).length,
          'TAT Medio (ore)': tats.length > 0 ? +(mean(tats)).toFixed(1) : '',
          'TAT P90 (ore)': tats.length > 0 ? +(percentile(tats,90)).toFixed(1) : '',
          'Urgenti': items.filter(function(r){return r.is_urgent;}).length,
          'Anomali': items.filter(function(r){return r.has_abnormal_values;}).length
        };
      });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeRows), 'Volume per Tipo');

    // Sheet 3: KPI summary
    var released = rpts.filter(function(r){return r.released_at&&r.created_at;});
    var allTat = released.map(function(r){return minutesDiff(r.created_at, r.released_at);}).filter(function(v){return v!=null&&v>=0;});
    var withinSLA = released.filter(function(r){return hoursDiff(r.created_at, r.released_at) <= SLA_HOURS;});
    var kpiRows = [
      { 'KPI': 'Referti Totali', 'Valore': rpts.length },
      { 'KPI': 'Pazienti Unici', 'Valore': countUnique(rpts, 'patient_id') },
      { 'KPI': 'TAT Medio (ore)', 'Valore': allTat.length > 0 ? +(mean(allTat)/60).toFixed(1) : 0 },
      { 'KPI': 'TAT Mediano (ore)', 'Valore': allTat.length > 0 ? +(percentile(allTat,50)/60).toFixed(1) : 0 },
      { 'KPI': 'TAT P90 (ore)', 'Valore': allTat.length > 0 ? +(percentile(allTat,90)/60).toFixed(1) : 0 },
      { 'KPI': '% Valori Anomali', 'Valore': rpts.length > 0 ? ((rpts.filter(function(r){return r.has_abnormal_values;}).length/rpts.length)*100).toFixed(1) + '%' : '0%' },
      { 'KPI': '% Urgenze', 'Valore': rpts.length > 0 ? ((rpts.filter(function(r){return r.is_urgent;}).length/rpts.length)*100).toFixed(1) + '%' : '0%' },
      { 'KPI': 'SLA Rispettato (\u2264' + SLA_HOURS + 'h)', 'Valore': released.length > 0 ? ((withinSLA.length/released.length)*100).toFixed(1) + '%' : '0%' }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'KPI');

    XLSX.writeFile(wb, 'BioClinic_Analytics_BI_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  }

  // ══════════════════════════════════════════════
  //  INIT & EVENT BINDING
  // ══════════════════════════════════════════════
  function initAnalytics() {
    if (anState.initialized) return;
    anState.initialized = true;

    // Tab switching
    $$('.an-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.an-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var tabName = this.dataset.tab;
        anState.activeTab = tabName;
        $$('.an-panel').forEach(function (p) { p.classList.remove('active'); p.hidden = true; });
        var panel = $('anPanel-' + tabName);
        if (panel) { panel.classList.add('active'); panel.hidden = false; }
        renderActiveTab();
      });
    });

    // Period change
    var periodEl = $('anPeriod');
    if (periodEl) {
      periodEl.addEventListener('change', function () {
        var customEl = $('anCustomRange');
        if (customEl) customEl.hidden = this.value !== 'custom';
      });
    }

    // Apply filters button
    var applyBtn = $('anApplyFilters');
    if (applyBtn) applyBtn.addEventListener('click', function () { loadAnalyticsData(); });

    // Exports
    var pdfBtn = $('anExportPdf');
    if (pdfBtn) pdfBtn.addEventListener('click', exportPDF);
    var xlBtn = $('anExportExcel');
    if (xlBtn) xlBtn.addEventListener('click', exportExcel);

    // Granularity toggle
    var granDiv = $('anGranularity');
    if (granDiv) {
      granDiv.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          granDiv.querySelectorAll('button').forEach(function(b){b.classList.remove('active');});
          this.classList.add('active');
          anState.granularity = this.dataset.g;
          // Re-render only volume chart area
          if (anState.activeTab === 'overview') {
            renderVolumeChart(anState.reports, anState.compReports);
          }
        });
      });
    }

    // Auto-refresh toggle
    var autoRefreshCb = $('anAutoRefresh');
    if (autoRefreshCb) {
      autoRefreshCb.addEventListener('change', function () {
        if (this.checked) {
          anState.autoRefreshTimer = setInterval(function () { loadAnalyticsData(); }, AUTO_REFRESH_MS);
        } else {
          if (anState.autoRefreshTimer) { clearInterval(anState.autoRefreshTimer); anState.autoRefreshTimer = null; }
        }
      });
    }

    // Drill-down click on KPI cards
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.an-kpi-card[data-drill]');
      if (card) {
        openDrillDown(card.dataset.drill);
      }
    });

    // Initial load
    loadAnalyticsData();
  }

  // ── Global integration ─────────────────────────
  window._initAnalytics = initAnalytics;

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#analytics') initAnalytics();
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#analytics') {
      setTimeout(initAnalytics, 500);
    }
  });

})();
