/**
 * ANALYTICS.JS — Bio-Clinic Enterprise BI Dashboard
 * Chart.js powered analytics for super_admin role
 * @version 1.0.0  @date 2026-08-09
 */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────
  var SB_URL = 'https://mdxqgzkxrcrotxxbhoai.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFnemt4cmNyb3R4eGJob2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODYxMzIsImV4cCI6MjA4NzU2MjEzMn0.HHExeiCGqnx4di_u9gghUnTfgQVAIjKuN6kt_vLFddA';
  var SLA_DAYS = 3; // target days for release

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
    reports: [],
    compReports: [],
    users: [],
    charts: {},
    activeTab: 'overview',
    initialized: false
  };

  // ── Helpers ──────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

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

  function sbGetAll(table, query) {
    // Fetch ALL rows with pagination (PostgREST default limit is 1000)
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
        if (cr) {
          var m = cr.match(/\/(\d+)/);
          if (m) total = parseInt(m[1], 10);
        }
        return r.json().then(function (rows) {
          return { rows: rows, total: total };
        });
      }).then(function (res) {
        allRows = allRows.concat(res.rows);
        if (allRows.length < res.total) {
          return fetchPage(allRows.length);
        }
        return allRows;
      });
    }
    return fetchPage(0);
  }

  function sbGetUsers() {
    return sbGetAll('users', 'select=id,first_name,last_name,email,role,created_at,fiscal_code');
  }

  // ── Date utilities ──────────────────────────────
  function getPeriodRange(period) {
    var now = new Date();
    var from, to = new Date(now);
    to.setHours(23, 59, 59, 999);

    switch (period) {
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
        from = new Date(2020, 0, 1);
        break;
      case 'custom':
        var df = $('anDateFrom').value;
        var dt = $('anDateTo').value;
        from = df ? new Date(df) : new Date(2020, 0, 1);
        to = dt ? new Date(dt + 'T23:59:59') : new Date();
        break;
      default:
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
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
    // prev period
    return {
      from: new Date(mainFrom.getTime() - diff),
      to: new Date(mainFrom.getTime() - 1)
    };
  }

  function monthKey(d) {
    var dt = new Date(d);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function weekKey(d) {
    var dt = new Date(d);
    return dt.getDay(); // 0=Sun, 1=Mon, ...
  }

  function hourKey(d) {
    return new Date(d).getHours();
  }

  function daysDiff(d1, d2) {
    if (!d1 || !d2) return null;
    return (new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60 * 24);
  }

  function fmtDelta(current, previous) {
    if (!previous || previous === 0) return { text: 'N/A', cls: 'neutral' };
    var pct = ((current - previous) / previous * 100).toFixed(1);
    var sign = pct > 0 ? '+' : '';
    return {
      text: sign + pct + '%',
      cls: pct > 0 ? 'positive' : (pct < 0 ? 'negative' : 'neutral')
    };
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

  // ── Data Fetching ──────────────────────────────
  function loadAnalyticsData() {
    $('anLoading').hidden = false;

    var period = $('anPeriod').value;
    var range = getPeriodRange(period);
    var compMode = $('anCompare').value;
    var compRange = compMode !== 'none' ? getComparisonRange(range.from, range.to, compMode) : null;

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
      anState.reports = results[0] || [];
      anState.users = results[1] || [];
      anState.compReports = results[2] || [];
      console.log('[Analytics] Loaded:', anState.reports.length, 'reports,', anState.users.length, 'users,', anState.compReports.length, 'comparison');

      // Apply filters
      var typeFilter = $('anTypeFilter').value;
      var opFilter = $('anOperatorFilter').value;

      if (typeFilter) {
        anState.reports = anState.reports.filter(function (r) { return r.report_type === typeFilter; });
        anState.compReports = anState.compReports.filter(function (r) { return r.report_type === typeFilter; });
      }
      if (opFilter) {
        anState.reports = anState.reports.filter(function (r) {
          return r.uploaded_by === opFilter || r.validated_by === opFilter || r.released_by === opFilter;
        });
        anState.compReports = anState.compReports.filter(function (r) {
          return r.uploaded_by === opFilter || r.validated_by === opFilter || r.released_by === opFilter;
        });
      }

      populateFilterDropdowns();
      renderActiveTab();
      $('anLoading').hidden = true;
    }).catch(function (err) {
      console.error('[Analytics] Load error:', err);
      $('anLoading').hidden = true;
    });
  }

  function populateFilterDropdowns() {
    // Populate type dropdown
    var typeSelect = $('anTypeFilter');
    var currentType = typeSelect.value;
    var types = {};
    anState.reports.forEach(function (r) {
      if (r.report_type) types[r.report_type] = true;
    });
    var opts = '<option value="">Tutti</option>';
    Object.keys(types).sort().forEach(function (t) {
      opts += '<option value="' + t + '"' + (t === currentType ? ' selected' : '') + '>' +
        (TYPE_LABELS[t] || t) + '</option>';
    });
    typeSelect.innerHTML = opts;

    // Populate operator dropdown
    var opSelect = $('anOperatorFilter');
    var currentOp = opSelect.value;
    var ops = {};
    anState.reports.forEach(function (r) {
      [r.uploaded_by, r.validated_by, r.released_by].forEach(function (uid) {
        if (uid) ops[uid] = true;
      });
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

  // ── Tab Rendering ──────────────────────────────
  function renderActiveTab() {
    destroyAllCharts();
    switch (anState.activeTab) {
      case 'overview': renderOverview(); break;
      case 'volumi': renderVolumi(); break;
      case 'performance': renderPerformance(); break;
      case 'pazienti': renderPazienti(); break;
      case 'qualita': renderQualita(); break;
    }
  }

  // ── Destroy chart helpers ─────────────────────
  function destroyChart(key) {
    if (anState.charts[key]) {
      anState.charts[key].destroy();
      delete anState.charts[key];
    }
  }

  function destroyAllCharts() {
    Object.keys(anState.charts).forEach(function (key) {
      try { anState.charts[key].destroy(); } catch (e) {}
    });
    anState.charts = {};
  }

  // ── Sparkline helper ──────────────────────────
  function renderSparkline(canvasId, data, color) {
    destroyChart(canvasId);
    var ctx = $(canvasId);
    if (!ctx) return;
    anState.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(function (_, i) { return i; }),
        datasets: [{
          data: data,
          borderColor: color || '#7CBA3D',
          backgroundColor: (color || '#7CBA3D') + '20',
          fill: true,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 5,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderWidth: 1.5 } }
      }
    });
  }

  // ── KPI Delta render ──────────────────────────
  function setKpiDelta(id, current, previous) {
    var el = $(id);
    if (!el) return;
    var d = fmtDelta(current, previous);
    el.textContent = d.text;
    el.className = 'an-kpi-delta ' + d.cls;
  }

  // ── Monthly series builder ───────────────────
  function buildMonthlySeries(reports, field) {
    field = field || 'created_at';
    var byMonth = groupBy(reports, function (r) { return monthKey(r[field] || r.created_at); });
    var keys = Object.keys(byMonth).sort();
    return {
      labels: keys.map(function (k) {
        var parts = k.split('-');
        var months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        return months[parseInt(parts[1], 10) - 1] + ' ' + parts[0].slice(2);
      }),
      values: keys.map(function (k) { return byMonth[k].length; }),
      keys: keys
    };
  }

  // ══════════════════════════════════════════════
  //  TAB 1: OVERVIEW
  // ══════════════════════════════════════════════
  function renderOverview() {
    var rpts = anState.reports;
    var comp = anState.compReports;

    // KPI values
    var total = rpts.length;
    var released = rpts.filter(function (r) { return r.status === 'released'; }).length;
    var patients = countUnique(rpts, 'patient_id');
    var abnormal = rpts.filter(function (r) { return r.has_abnormal_values; }).length;
    var urgent = rpts.filter(function (r) { return r.is_urgent; }).length;

    // Avg time to release
    var releasedRpts = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var avgTime = 0;
    if (releasedRpts.length > 0) {
      var sum = releasedRpts.reduce(function (s, r) { return s + daysDiff(r.created_at, r.released_at); }, 0);
      avgTime = (sum / releasedRpts.length).toFixed(1);
    }

    $('anKpiTotal').textContent = total.toLocaleString('it-IT');
    $('anKpiReleased').textContent = released.toLocaleString('it-IT');
    $('anKpiPatients').textContent = patients.toLocaleString('it-IT');
    $('anKpiAvgTime').textContent = avgTime;
    $('anKpiAbnormal').textContent = abnormal.toLocaleString('it-IT');
    $('anKpiUrgent').textContent = urgent.toLocaleString('it-IT');

    // Comparison deltas
    if (comp.length > 0) {
      setKpiDelta('anKpiTotalDelta', total, comp.length);
      setKpiDelta('anKpiReleasedDelta', released, comp.filter(function (r) { return r.status === 'released'; }).length);
      setKpiDelta('anKpiPatientsDelta', patients, countUnique(comp, 'patient_id'));
      var compRel = comp.filter(function (r) { return r.released_at && r.created_at; });
      var compAvg = compRel.length > 0
        ? compRel.reduce(function (s, r) { return s + daysDiff(r.created_at, r.released_at); }, 0) / compRel.length
        : 0;
      setKpiDelta('anKpiAvgTimeDelta', parseFloat(avgTime), compAvg);
      setKpiDelta('anKpiAbnormalDelta', abnormal, comp.filter(function (r) { return r.has_abnormal_values; }).length);
      setKpiDelta('anKpiUrgentDelta', urgent, comp.filter(function (r) { return r.is_urgent; }).length);
    }

    // Sparklines
    var series = buildMonthlySeries(rpts);
    renderSparkline('anSparkTotal', series.values, '#7CBA3D');
    var relSeries = buildMonthlySeries(rpts.filter(function (r) { return r.status === 'released'; }));
    renderSparkline('anSparkReleased', relSeries.values, '#3b82f6');

    // Patients sparkline — unique patients per month
    var patByMonth = {};
    rpts.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!patByMonth[mk]) patByMonth[mk] = {};
      if (r.patient_id) patByMonth[mk][r.patient_id] = true;
    });
    var patSpark = series.keys.map(function (k) { return patByMonth[k] ? Object.keys(patByMonth[k]).length : 0; });
    renderSparkline('anSparkPatients', patSpark, '#8b5cf6');

    // Avg time sparkline
    var timeByMonth = {};
    releasedRpts.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!timeByMonth[mk]) timeByMonth[mk] = [];
      timeByMonth[mk].push(daysDiff(r.created_at, r.released_at));
    });
    var timeSpark = series.keys.map(function (k) {
      var arr = timeByMonth[k];
      if (!arr || arr.length === 0) return 0;
      return +(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1);
    });
    renderSparkline('anSparkAvgTime', timeSpark, '#f59e0b');

    var abnSeries = buildMonthlySeries(rpts.filter(function (r) { return r.has_abnormal_values; }));
    renderSparkline('anSparkAbnormal', abnSeries.values, '#ef4444');
    var urgSeries = buildMonthlySeries(rpts.filter(function (r) { return r.is_urgent; }));
    renderSparkline('anSparkUrgent', urgSeries.values, '#f97316');

    // Volume chart (area)
    renderVolumeChart(series, comp);

    // Type distribution pie
    renderTypePie(rpts);

    // Status funnel
    renderFunnelChart(rpts);

    // Heatmap
    renderHeatmap(rpts);
  }

  function renderVolumeChart(series, comp) {
    destroyChart('volume');
    var datasets = [{
      label: 'Periodo corrente',
      data: series.values,
      borderColor: '#7CBA3D',
      backgroundColor: 'rgba(124,186,61,0.15)',
      fill: true,
      tension: 0.3,
      borderWidth: 2
    }];

    if (comp && comp.length > 0) {
      var compSeries = buildMonthlySeries(comp);
      // Align comparison data to same number of points
      var compData = compSeries.values;
      while (compData.length < series.values.length) compData.push(0);
      compData = compData.slice(0, series.values.length);
      datasets.push({
        label: 'Periodo precedente',
        data: compData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 1.5,
        borderDash: [5, 3]
      });
    }

    anState.charts['volume'] = new Chart($('anChartVolume'), {
      type: 'line',
      data: { labels: series.labels, datasets: datasets },
      options: chartOptions('Referti', true)
    });
  }

  function renderTypePie(rpts) {
    destroyChart('typePie');
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var entries = Object.entries(byType).sort(function (a, b) { return b[1].length - a[1].length; });
    var labels = entries.map(function (e) { return TYPE_LABELS[e[0]] || e[0]; });
    var values = entries.map(function (e) { return e[1].length; });
    var colors = entries.map(function (_, i) { return CHART_COLORS[i % CHART_COLORS.length]; });

    anState.charts['typePie'] = new Chart($('anChartTypePie'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: 'var(--bg-card)' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        animation: { duration: 300 },
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (c) { return c.label + ': ' + c.raw + ' (' + ((c.raw / rpts.length) * 100).toFixed(1) + '%)'; } } }
        }
      }
    });
  }

  function renderFunnelChart(rpts) {
    destroyChart('funnel');
    var statuses = ['pending', 'validated', 'signed', 'released', 'archived', 'revoked'];
    var statusLabels = ['In Attesa', 'Validati', 'Firmati', 'Rilasciati', 'Archiviati', 'Revocati'];
    var statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#64748b', '#ef4444'];
    var counts = statuses.map(function (s) { return rpts.filter(function (r) { return r.status === s; }).length; });

    anState.charts['funnel'] = new Chart($('anChartFunnel'), {
      type: 'bar',
      data: {
        labels: statusLabels,
        datasets: [{
          data: counts,
          backgroundColor: statusColors,
          borderRadius: 6,
          maxBarThickness: 50
        }]
      },
      options: Object.assign({}, chartOptions('Referti'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function renderHeatmap(rpts) {
    destroyChart('heatmap');
    // Build a 7x24 matrix (day of week x hour)
    var dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    var matrix = [];
    rpts.forEach(function (r) {
      var d = new Date(r.created_at);
      matrix.push({ x: d.getHours(), y: d.getDay(), v: 1 });
    });

    // Aggregate
    var grid = {};
    matrix.forEach(function (p) {
      var key = p.y + '-' + p.x;
      grid[key] = (grid[key] || 0) + p.v;
    });

    // Build as bubble chart
    var data = [];
    for (var day = 0; day < 7; day++) {
      for (var hour = 0; hour < 24; hour++) {
        var count = grid[day + '-' + hour] || 0;
        if (count > 0) {
          data.push({ x: hour, y: day, r: Math.min(Math.sqrt(count) * 3, 20) });
        }
      }
    }

    anState.charts['heatmap'] = new Chart($('anChartHeatmap'), {
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
                var count = Math.round((d.r / 3) * (d.r / 3));
                return dayNames[d.y] + ' ore ' + d.x + ':00 — ' + count + ' referti';
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
            ticks: { callback: function (v) { return dayNames[v] || ''; }, stepSize: 1, font: { size: 10 } },
            title: { display: true, text: 'Giorno', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      }
    });
  }

  // ══════════════════════════════════════════════
  //  TAB 2: VOLUMI
  // ══════════════════════════════════════════════
  function renderVolumi() {
    var rpts = anState.reports;
    var comp = anState.compReports;

    // Stacked bar by type per month
    renderVolumeByType(rpts);
    renderVolumeByCategory(rpts);
    renderUploadVsRelease(rpts, comp);
    renderVolumiTable(rpts, comp);
  }

  function renderVolumeByType(rpts) {
    destroyChart('volumeByType');
    var series = buildMonthlySeries(rpts);
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var types = Object.keys(byType).sort(function (a, b) { return byType[b].length - byType[a].length; });
    var top8 = types.slice(0, 8);
    var hasOther = types.length > 8;

    var datasets = top8.map(function (t, i) {
      var tSeries = buildMonthlySeries(byType[t]);
      var data = series.keys.map(function (k) {
        var idx = tSeries.keys.indexOf(k);
        return idx >= 0 ? tSeries.values[idx] : 0;
      });
      return {
        label: TYPE_LABELS[t] || t,
        data: data,
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderRadius: 3,
        maxBarThickness: 40
      };
    });

    if (hasOther) {
      var otherTypes = types.slice(8);
      var otherData = series.keys.map(function (k) {
        var count = 0;
        otherTypes.forEach(function (t) {
          var tSeries = buildMonthlySeries(byType[t]);
          var idx = tSeries.keys.indexOf(k);
          if (idx >= 0) count += tSeries.values[idx];
        });
        return count;
      });
      datasets.push({
        label: 'Altri',
        data: otherData,
        backgroundColor: '#94a3b8',
        borderRadius: 3,
        maxBarThickness: 40
      });
    }

    anState.charts['volumeByType'] = new Chart($('anChartVolumeByType'), {
      type: 'bar',
      data: { labels: series.labels, datasets: datasets },
      options: Object.assign({}, chartOptions('Referti', true), {
        scales: Object.assign({}, chartOptions('Referti', true).scales, {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true }
        })
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

    anState.charts['volumeByCategory'] = new Chart($('anChartVolumeByCategory'), {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        animation: { duration: 300 },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  function renderUploadVsRelease(rpts, comp) {
    destroyChart('uploadVsRelease');
    var series = buildMonthlySeries(rpts);
    var relRpts = rpts.filter(function (r) { return r.released_at; });
    var relSeries = buildMonthlySeries(relRpts, 'released_at');

    var relData = series.keys.map(function (k) {
      var idx = relSeries.keys.indexOf(k);
      return idx >= 0 ? relSeries.values[idx] : 0;
    });

    var datasets = [
      {
        label: 'Caricamenti',
        data: series.values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'Rilasci',
        data: relData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }
    ];

    anState.charts['uploadVsRelease'] = new Chart($('anChartUploadVsRelease'), {
      type: 'line',
      data: { labels: series.labels, datasets: datasets },
      options: chartOptions('Referti', true)
    });
  }

  function renderVolumiTable(rpts, comp) {
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
      var compTotal = (compByType[t] || []).length;
      var delta = fmtDelta(total, compTotal);

      html += '<tr>' +
        '<td><strong>' + (TYPE_LABELS[t] || t) + '</strong></td>' +
        '<td>' + total + '</td>' +
        '<td>' + released + '</td>' +
        '<td>' + inProgress + '</td>' +
        '<td><span class="badge ' + (parseFloat(pct) >= 90 ? 'badge-released' : 'badge-pending') + '">' + pct + '%</span></td>' +
        '<td><span class="an-kpi-delta ' + delta.cls + '" style="font-size:0.78rem">' + delta.text + '</span></td>' +
        '</tr>';
    });

    if (!html) html = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Nessun dato</td></tr>';
    $('anTableVolumiBody').innerHTML = html;
  }

  // ══════════════════════════════════════════════
  //  TAB 3: PERFORMANCE
  // ══════════════════════════════════════════════
  function renderPerformance() {
    var rpts = anState.reports;
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var validated = rpts.filter(function (r) { return r.validated_at && r.created_at; });

    // KPI: Total time upload→release
    var avgTotal = 0, avgVal = 0, avgRel = 0;
    if (released.length > 0) {
      avgTotal = released.reduce(function (s, r) { return s + daysDiff(r.created_at, r.released_at); }, 0) / released.length;
    }
    if (validated.length > 0) {
      avgVal = validated.reduce(function (s, r) { return s + daysDiff(r.created_at, r.validated_at); }, 0) / validated.length;
    }
    var valAndRel = released.filter(function (r) { return r.validated_at; });
    if (valAndRel.length > 0) {
      avgRel = valAndRel.reduce(function (s, r) { return s + daysDiff(r.validated_at, r.released_at); }, 0) / valAndRel.length;
    }

    $('anPerfTotalTime').textContent = avgTotal.toFixed(1);
    $('anPerfValTime').textContent = avgVal.toFixed(1);
    $('anPerfRelTime').textContent = avgRel.toFixed(1);

    renderPhaseTimeChart(rpts);
    renderTimeDistribution(released);
    renderOperatorRank(rpts);
  }

  function renderPhaseTimeChart(rpts) {
    destroyChart('phaseTime');
    var series = buildMonthlySeries(rpts);
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var validated = rpts.filter(function (r) { return r.validated_at && r.created_at; });

    // Avg upload→validation per month
    var valByMonth = {};
    validated.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!valByMonth[mk]) valByMonth[mk] = [];
      valByMonth[mk].push(daysDiff(r.created_at, r.validated_at));
    });

    // Avg validation→release per month
    var relByMonth = {};
    released.filter(function (r) { return r.validated_at; }).forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!relByMonth[mk]) relByMonth[mk] = [];
      relByMonth[mk].push(daysDiff(r.validated_at, r.released_at));
    });

    var valData = series.keys.map(function (k) {
      var arr = valByMonth[k];
      return arr ? +(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1) : 0;
    });
    var relData = series.keys.map(function (k) {
      var arr = relByMonth[k];
      return arr ? +(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1) : 0;
    });

    anState.charts['phaseTime'] = new Chart($('anChartPhaseTime'), {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Upload → Validazione (gg)', data: valData, backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 30 },
          { label: 'Validazione → Rilascio (gg)', data: relData, backgroundColor: '#22c55e', borderRadius: 4, maxBarThickness: 30 }
        ]
      },
      options: Object.assign({}, chartOptions('Giorni', true), {
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Giorni' } } }
      })
    });
  }

  function renderTimeDistribution(released) {
    destroyChart('timeDistribution');
    var buckets = { '0-1gg': 0, '1-2gg': 0, '2-3gg': 0, '3-5gg': 0, '5-7gg': 0, '7-14gg': 0, '14+gg': 0 };
    released.forEach(function (r) {
      var d = daysDiff(r.created_at, r.released_at);
      if (d <= 1) buckets['0-1gg']++;
      else if (d <= 2) buckets['1-2gg']++;
      else if (d <= 3) buckets['2-3gg']++;
      else if (d <= 5) buckets['3-5gg']++;
      else if (d <= 7) buckets['5-7gg']++;
      else if (d <= 14) buckets['7-14gg']++;
      else buckets['14+gg']++;
    });

    var labels = Object.keys(buckets);
    var values = Object.values(buckets);
    var colors = labels.map(function (l) {
      if (l === '0-1gg' || l === '1-2gg' || l === '2-3gg') return '#22c55e';
      if (l === '3-5gg') return '#f59e0b';
      return '#ef4444';
    });

    anState.charts['timeDistribution'] = new Chart($('anChartTimeDistribution'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, maxBarThickness: 50 }]
      },
      options: Object.assign({}, chartOptions('Referti'), { plugins: { legend: { display: false } } })
    });
  }

  function renderOperatorRank(rpts) {
    destroyChart('operatorRank');
    var userMap = {};
    anState.users.forEach(function (u) { userMap[u.id] = u; });

    // Count uploads + validations + releases per operator
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

    anState.charts['operatorRank'] = new Chart($('anChartOperatorRank'), {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return e.name; }),
        datasets: [{
          label: 'Operazioni',
          data: entries.map(function (e) { return e.count; }),
          backgroundColor: '#7CBA3D',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: Object.assign({}, chartOptions('Operazioni'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  // ══════════════════════════════════════════════
  //  TAB 4: PAZIENTI
  // ══════════════════════════════════════════════
  function renderPazienti() {
    var rpts = anState.reports;
    var patients = anState.users.filter(function (u) { return u.role === 'patient'; });

    // KPIs
    $('anPatTotal').textContent = patients.length.toLocaleString('it-IT');

    // New patients in period
    var period = getPeriodRange($('anPeriod').value);
    var newPats = patients.filter(function (u) {
      var d = new Date(u.created_at);
      return d >= period.from && d <= period.to;
    });
    $('anPatNew').textContent = newPats.length.toLocaleString('it-IT');

    // Recurring (patients with >1 report)
    var patReportCount = {};
    rpts.forEach(function (r) {
      if (r.patient_id) patReportCount[r.patient_id] = (patReportCount[r.patient_id] || 0) + 1;
    });
    var recurring = Object.values(patReportCount).filter(function (c) { return c > 1; }).length;
    $('anPatRecurring').textContent = recurring.toLocaleString('it-IT');

    // Download rate
    var downloadable = rpts.filter(function (r) { return r.status === 'released'; });
    var downloaded = downloadable.filter(function (r) { return r.patient_downloaded; });
    var dlRate = downloadable.length > 0 ? ((downloaded.length / downloadable.length) * 100).toFixed(1) : '0.0';
    $('anPatDownloadRate').textContent = dlRate + '%';

    renderNewPatientsChart(patients, period);
    renderTopPatientsChart(rpts);
    renderViewVsDownload(rpts);
  }

  function renderNewPatientsChart(patients, period) {
    destroyChart('newPatients');
    var inRange = patients.filter(function (u) { return new Date(u.created_at) >= period.from && new Date(u.created_at) <= period.to; });
    var series = buildMonthlySeries(inRange.map(function (u) { return { created_at: u.created_at }; }));

    anState.charts['newPatients'] = new Chart($('anChartNewPatients'), {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [{
          label: 'Nuovi pazienti',
          data: series.values,
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: chartOptions('Pazienti', true)
    });
  }

  function renderTopPatientsChart(rpts) {
    destroyChart('topPatients');
    var patCount = {};
    var patNames = {};
    rpts.forEach(function (r) {
      if (r.patient_id) {
        patCount[r.patient_id] = (patCount[r.patient_id] || 0) + 1;
        if (r.patient_fiscal_code) patNames[r.patient_id] = r.patient_fiscal_code;
      }
    });

    // Resolve names from users
    var userMap = {};
    anState.users.forEach(function (u) { userMap[u.id] = u; });

    var entries = Object.entries(patCount)
      .map(function (e) {
        var u = userMap[e[0]];
        var label = u ? (u.last_name + ' ' + (u.first_name || '')[0] + '.').trim() : (patNames[e[0]] || e[0].substring(0, 8));
        return { name: label, count: e[1] };
      })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 10);

    anState.charts['topPatients'] = new Chart($('anChartTopPatients'), {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return e.name; }),
        datasets: [{
          label: 'N. Referti',
          data: entries.map(function (e) { return e.count; }),
          backgroundColor: '#06b6d4',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: Object.assign({}, chartOptions('N. Referti'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function renderViewVsDownload(rpts) {
    destroyChart('viewVsDownload');
    var released = rpts.filter(function (r) { return r.status === 'released'; });
    var series = buildMonthlySeries(released, 'released_at');

    var viewedByMonth = {};
    var downloadedByMonth = {};
    released.forEach(function (r) {
      var mk = monthKey(r.released_at || r.created_at);
      if (r.patient_viewed) viewedByMonth[mk] = (viewedByMonth[mk] || 0) + 1;
      if (r.patient_downloaded) downloadedByMonth[mk] = (downloadedByMonth[mk] || 0) + 1;
    });

    var viewData = series.keys.map(function (k) { return viewedByMonth[k] || 0; });
    var dlData = series.keys.map(function (k) { return downloadedByMonth[k] || 0; });

    anState.charts['viewVsDownload'] = new Chart($('anChartViewVsDownload'), {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Visualizzati', data: viewData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Scaricati', data: dlData, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
      },
      options: chartOptions('Referti', true)
    });
  }

  // ══════════════════════════════════════════════
  //  TAB 5: QUALITÀ
  // ══════════════════════════════════════════════
  function renderQualita() {
    var rpts = anState.reports;

    // KPIs
    var total = rpts.length;
    var abnormal = rpts.filter(function (r) { return r.has_abnormal_values; }).length;
    var urgent = rpts.filter(function (r) { return r.is_urgent; }).length;
    var revoked = rpts.filter(function (r) { return r.status === 'revoked'; }).length;

    $('anQualAbnormalPct').textContent = total > 0 ? ((abnormal / total) * 100).toFixed(1) + '%' : '0%';
    $('anQualUrgentPct').textContent = total > 0 ? ((urgent / total) * 100).toFixed(1) + '%' : '0%';
    $('anQualRevoked').textContent = revoked.toLocaleString('it-IT');

    // SLA: % released within SLA_DAYS
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var withinSLA = released.filter(function (r) { return daysDiff(r.created_at, r.released_at) <= SLA_DAYS; });
    var slaPct = released.length > 0 ? ((withinSLA.length / released.length) * 100).toFixed(1) : '0.0';
    $('anQualSLA').textContent = slaPct + '%';

    renderAnomalyTrend(rpts);
    renderUrgentByType(rpts);
    renderSLAMonitor(rpts);
  }

  function renderAnomalyTrend(rpts) {
    destroyChart('anomalyTrend');
    var series = buildMonthlySeries(rpts);
    var abnRpts = rpts.filter(function (r) { return r.has_abnormal_values; });
    var abnSeries = buildMonthlySeries(abnRpts);

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

    anState.charts['anomalyTrend'] = new Chart($('anChartAnomalyTrend'), {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'N. Anomali', data: absData, backgroundColor: '#ef4444', borderRadius: 4, maxBarThickness: 30, yAxisID: 'y' },
          { label: '% Anomali', data: pctData, type: 'line', borderColor: '#f97316', borderWidth: 2, tension: 0.3, pointRadius: 3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        animation: { duration: 300 },
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

    anState.charts['urgentByType'] = new Chart($('anChartUrgentByType'), {
      type: 'bar',
      data: {
        labels: entries.map(function (e) { return TYPE_LABELS[e[0]] || e[0]; }),
        datasets: [{
          label: 'Urgenze',
          data: entries.map(function (e) { return e[1].length; }),
          backgroundColor: '#f59e0b',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: Object.assign({}, chartOptions('Urgenze'), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function renderSLAMonitor(rpts) {
    destroyChart('slaMonitor');
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var series = buildMonthlySeries(released);

    var avgByMonth = {};
    released.forEach(function (r) {
      var mk = monthKey(r.created_at);
      if (!avgByMonth[mk]) avgByMonth[mk] = [];
      avgByMonth[mk].push(daysDiff(r.created_at, r.released_at));
    });

    var avgData = series.keys.map(function (k) {
      var arr = avgByMonth[k];
      return arr ? +(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1) : 0;
    });

    var slaLine = series.keys.map(function () { return SLA_DAYS; });

    var barColors = avgData.map(function (v) { return v <= SLA_DAYS ? '#22c55e' : '#ef4444'; });

    anState.charts['slaMonitor'] = new Chart($('anChartSLAMonitor'), {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          { label: 'Media giorni rilascio', data: avgData, backgroundColor: barColors, borderRadius: 6, maxBarThickness: 40 },
          { label: 'SLA Target (' + SLA_DAYS + 'gg)', data: slaLine, type: 'line', borderColor: '#ef4444', borderWidth: 2, borderDash: [6, 3], pointRadius: 0, fill: false }
        ]
      },
      options: chartOptions('Giorni', true)
    });
  }

  // ── Chart.js common options ────────────────────
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

  // ══════════════════════════════════════════════
  //  EXPORTS
  // ══════════════════════════════════════════════

  function exportPDF() {
    if (!window.html2canvas || !window.jspdf) {
      alert('Librerie di esportazione non caricate.');
      return;
    }
    var target = document.querySelector('.an-panel.active');
    if (!target) return;

    var btn = $('anExportPdf');
    btn.disabled = true;
    btn.textContent = 'Generazione PDF...';

    html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function (canvas) {
      var imgData = canvas.toDataURL('image/png');
      var pdf = new jspdf.jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 10;
      var imgW = pageW - margin * 2;
      var imgH = (canvas.height * imgW) / canvas.width;

      // Header
      pdf.setFontSize(16);
      pdf.setTextColor(0, 112, 74);
      pdf.text('Bio-Clinic Analytics — ' + anState.activeTab.toUpperCase(), margin, margin + 5);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text('Generato il ' + new Date().toLocaleDateString('it-IT') + ' alle ' + new Date().toLocaleTimeString('it-IT'), margin, margin + 11);

      var yOff = margin + 16;
      if (imgH + yOff > pageH) {
        // Multi-page
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
          if (remaining > 0) {
            pdf.addPage();
            yOff = margin;
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, yOff, imgW, imgH);
      }

      pdf.save('BioClinic_Analytics_' + anState.activeTab + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
    }).finally(function () {
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF';
    });
  }

  function exportExcel() {
    if (!window.XLSX) {
      alert('Libreria SheetJS non caricata.');
      return;
    }

    var wb = XLSX.utils.book_new();
    var rpts = anState.reports;

    // Sheet 1: Tutti i referti
    var rows = rpts.map(function (r) {
      return {
        'N. Referto': r.report_number,
        'Tipo': TYPE_LABELS[r.report_type] || r.report_type,
        'Categoria': r.category,
        'Stato': r.status,
        'Data Prelievo': r.sample_date,
        'Creato': r.created_at ? r.created_at.substring(0, 10) : '',
        'Validato': r.validated_at ? r.validated_at.substring(0, 10) : '',
        'Rilasciato': r.released_at ? r.released_at.substring(0, 10) : '',
        'Urgente': r.is_urgent ? 'Si' : 'No',
        'Valori Anomali': r.has_abnormal_values ? 'Si' : 'No',
        'Visualizzato': r.patient_viewed ? 'Si' : 'No',
        'Scaricato': r.patient_downloaded ? 'Si' : 'No',
        'N. Download': r.download_count || 0,
        'CF Paziente': r.patient_fiscal_code || ''
      };
    });
    var ws1 = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Referti');

    // Sheet 2: Volume per tipo
    var byType = groupBy(rpts, function (r) { return r.report_type || 'altro'; });
    var typeRows = Object.entries(byType)
      .sort(function (a, b) { return b[1].length - a[1].length; })
      .map(function (e) {
        var items = e[1];
        var released = items.filter(function (r) { return r.status === 'released'; }).length;
        return {
          'Tipo': TYPE_LABELS[e[0]] || e[0],
          'Totale': items.length,
          'Rilasciati': released,
          '% Rilascio': items.length > 0 ? ((released / items.length) * 100).toFixed(1) + '%' : '0%',
          'Urgenti': items.filter(function (r) { return r.is_urgent; }).length,
          'Anomali': items.filter(function (r) { return r.has_abnormal_values; }).length
        };
      });
    var ws2 = XLSX.utils.json_to_sheet(typeRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Volume per Tipo');

    // Sheet 3: Riepilogo KPI
    var released = rpts.filter(function (r) { return r.released_at && r.created_at; });
    var avgTime = released.length > 0
      ? (released.reduce(function (s, r) { return s + daysDiff(r.created_at, r.released_at); }, 0) / released.length).toFixed(1)
      : 0;
    var kpiRows = [
      { 'KPI': 'Referti Totali', 'Valore': rpts.length },
      { 'KPI': 'Rilasciati', 'Valore': rpts.filter(function (r) { return r.status === 'released'; }).length },
      { 'KPI': 'Pazienti Unici', 'Valore': countUnique(rpts, 'patient_id') },
      { 'KPI': 'Tempo Medio Rilascio (gg)', 'Valore': avgTime },
      { 'KPI': '% Valori Anomali', 'Valore': rpts.length > 0 ? ((rpts.filter(function (r) { return r.has_abnormal_values; }).length / rpts.length) * 100).toFixed(1) + '%' : '0%' },
      { 'KPI': '% Urgenze', 'Valore': rpts.length > 0 ? ((rpts.filter(function (r) { return r.is_urgent; }).length / rpts.length) * 100).toFixed(1) + '%' : '0%' },
      { 'KPI': 'SLA Rispettato (≤' + SLA_DAYS + 'gg)', 'Valore': released.length > 0 ? ((released.filter(function (r) { return daysDiff(r.created_at, r.released_at) <= SLA_DAYS; }).length / released.length) * 100).toFixed(1) + '%' : '0%' }
    ];
    var ws3 = XLSX.utils.json_to_sheet(kpiRows);
    XLSX.utils.book_append_sheet(wb, ws3, 'KPI');

    XLSX.writeFile(wb, 'BioClinic_Analytics_' + new Date().toISOString().slice(0, 10) + '.xlsx');
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

    // Period change → show/hide custom range
    $('anPeriod').addEventListener('change', function () {
      $('anCustomRange').hidden = this.value !== 'custom';
    });

    // Apply filters
    $('anApplyFilters').addEventListener('click', function () {
      loadAnalyticsData();
    });

    // Exports
    $('anExportPdf').addEventListener('click', exportPDF);
    $('anExportExcel').addEventListener('click', exportExcel);

    // Initial load
    loadAnalyticsData();
  }

  // ── Integration with dashboard.js navigation ──
  // The main dashboard.js calls loadPageData(page) on navigation.
  // We hook into it by listening for the analytics page becoming visible.
  // Also expose initAnalytics globally so dashboard.js can call it.
  window._initAnalytics = initAnalytics;

  // Auto-detect if analytics page becomes visible (hashchange)
  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#analytics') {
      initAnalytics();
    }
  });

  // Also check on DOMContentLoaded in case page loads with #analytics
  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#analytics') {
      // Wait for dashboard.js to finish init
      setTimeout(initAnalytics, 500);
    }
  });

})();
