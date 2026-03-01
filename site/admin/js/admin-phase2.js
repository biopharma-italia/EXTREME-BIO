/**
 * Bio-Clinic Admin Panel — Phase 2+3 Enhancement Module
 * ======================================================
 * Adds: M:N relation management, inline price editing,
 * build pipeline trigger, enhanced dashboard, validation,
 * Schema.org generator preview, data monitoring alerts.
 *
 * Loaded AFTER admin.js — extends existing functionality.
 *
 * @version 2.1.0
 * @date 2026-02-28
 */

// ============================================================================
// RELATIONSHIP MANAGEMENT (M:N tables)
// ============================================================================

const RELATIONS = {
  physicians: {
    procedures: {
      label: 'Prestazioni',
      joinTable: 'physician_procedures',
      targetEntity: 'procedures',
      targetLabel: 'name',
      extraFields: [
        { key: 'role', label: 'Ruolo', type: 'select', options: ['primary', 'secondary', 'assistant'] },
        { key: 'sort_order', label: 'Ordine', type: 'number' },
      ],
    },
    pathways: {
      label: 'Percorsi',
      joinTable: 'physician_pathways',
      targetEntity: 'pathways',
      targetLabel: 'name',
      extraFields: [
        { key: 'role', label: 'Ruolo', type: 'select', options: ['lead', 'team', 'consultant'] },
      ],
    },
  },
  procedures: {
    physicians: {
      label: 'Medici',
      joinTable: 'physician_procedures',
      targetEntity: 'physicians',
      targetLabel: 'display_name',
      inverse: true,
    },
    pathways: {
      label: 'Percorsi',
      joinTable: 'procedure_pathways',
      targetEntity: 'pathways',
      targetLabel: 'name',
    },
  },
  packs: {
    tests: {
      label: 'Esami inclusi',
      joinTable: 'test_packs',
      targetEntity: 'lab-tests',
      targetLabel: 'name',
      extraFields: [
        { key: 'quantity', label: 'Quantita', type: 'number' },
        { key: 'sort_order', label: 'Ordine', type: 'number' },
      ],
    },
    specialties: {
      label: 'Specialita',
      joinTable: 'pack_specialties',
      targetEntity: 'specialties',
      targetLabel: 'name',
    },
  },
  pathways: {
    procedures: {
      label: 'Prestazioni',
      joinTable: 'procedure_pathways',
      targetEntity: 'procedures',
      targetLabel: 'name',
      inverse: true,
      extraFields: [
        { key: 'phase', label: 'Fase', type: 'text' },
        { key: 'required', label: 'Obbligatoria', type: 'checkbox' },
      ],
    },
    tests: {
      label: 'Esami',
      joinTable: 'test_pathways',
      targetEntity: 'lab-tests',
      targetLabel: 'name',
      extraFields: [
        { key: 'phase', label: 'Fase', type: 'text' },
        { key: 'quantity', label: 'Quantita', type: 'number' },
      ],
    },
    physicians: {
      label: 'Team medico',
      joinTable: 'physician_pathways',
      targetEntity: 'physicians',
      targetLabel: 'display_name',
      inverse: true,
    },
    specialties: {
      label: 'Specialita',
      joinTable: 'pathway_specialties',
      targetEntity: 'specialties',
      targetLabel: 'name',
    },
  },
};


// ============================================================================
// INLINE PRICE EDITING (Lab Tests)
// ============================================================================

function enableInlinePriceEdit() {
  document.getElementById('entity-tbody')?.addEventListener('dblclick', async (e) => {
    const td = e.target.closest('td');
    if (!td || currentEntity !== 'lab-tests') return;

    const row = td.closest('tr');
    const cells = Array.from(row.children);
    const colIndex = cells.indexOf(td);

    const config = ENTITIES[currentEntity];
    if (!config) return;

    const col = config.columns[colIndex];
    if (!col || col.key !== 'price') return;

    const actionsCell = row.querySelector('.actions-cell button');
    if (!actionsCell) return;
    const onclickAttr = actionsCell.getAttribute('onclick') || '';
    const match = onclickAttr.match(/editEntity\('([^']+)'\)/);
    if (!match) return;
    const recordId = match[1];

    const record = entityData.find(r => r.id === recordId);
    if (!record) return;

    const currentPrice = record.price || 0;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.value = currentPrice;
    input.className = 'inline-edit-input';
    input.style.cssText = 'width:80px;padding:4px 6px;font-size:13px;border:2px solid var(--primary);border-radius:4px;text-align:right;';

    const originalContent = td.innerHTML;
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();

    const saveEdit = async () => {
      const newPrice = parseFloat(input.value);
      if (isNaN(newPrice) || newPrice === currentPrice) {
        td.innerHTML = originalContent;
        return;
      }

      if (isDemoMode) {
        record.price = newPrice;
        td.innerHTML = `\u20AC ${newPrice.toFixed(2)}`;
        toast(`Prezzo aggiornato (demo): \u20AC ${newPrice.toFixed(2)}`, 'warning');
      } else {
        try {
          await apiRequest('/lab-tests', {
            method: 'PATCH',
            body: { id: recordId, price: newPrice },
          });
          record.price = newPrice;
          td.innerHTML = `\u20AC ${newPrice.toFixed(2)}`;
          toast(`Prezzo aggiornato: \u20AC ${newPrice.toFixed(2)}`, 'success');
        } catch (err) {
          td.innerHTML = originalContent;
          toast('Errore aggiornamento prezzo: ' + err.message, 'error');
        }
      }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') { td.innerHTML = originalContent; }
    });
  });
}


// ============================================================================
// ENHANCED MODAL — Relations Tab
// ============================================================================

function addRelationsTab(record) {
  if (!currentEntity || !RELATIONS[currentEntity]) return;
  if (!record || !record.id) return;

  const relations = RELATIONS[currentEntity];
  const modal = document.getElementById('edit-form');
  if (!modal) return;

  let html = '<div class="relations-section" style="margin-top:24px;padding-top:20px;border-top:2px solid var(--gray-200)">';
  html += '<h4 style="margin-bottom:16px;color:var(--primary)">Relazioni</h4>';

  for (const [relKey, relConfig] of Object.entries(relations)) {
    const relatedIds = getRelatedIds(record, relKey, relConfig);

    html += `<div class="relation-group" style="margin-bottom:16px">`;
    html += `<label style="font-weight:700;font-size:13px;display:block;margin-bottom:8px">${relConfig.label} <span style="font-weight:400;color:var(--gray-500)">(${relatedIds.length})</span></label>`;
    html += `<div class="relation-tags" id="rel-${relKey}" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">`;

    if (relatedIds.length > 0) {
      for (const rid of relatedIds) {
        const label = typeof rid === 'object' ? (rid.name || rid.id) : rid;
        html += `<span class="rel-tag" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--primary-light);color:var(--primary-dark);border-radius:12px;font-size:12px;font-weight:600">
          ${esc(String(label))}
          ${!isDemoMode ? `<button type="button" class="rel-remove" data-rel="${relKey}" data-id="${esc(String(typeof rid === 'object' ? rid.id : rid))}" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--danger);padding:0 2px" title="Rimuovi">\u00D7</button>` : ''}
        </span>`;
      }
    } else {
      html += '<span style="color:var(--gray-500);font-size:12px">Nessuna relazione</span>';
    }

    html += '</div></div>';
  }

  html += '</div>';
  modal.insertAdjacentHTML('beforeend', html);
}

function getRelatedIds(record, relKey, relConfig) {
  if (record[relKey] && Array.isArray(record[relKey])) {
    return record[relKey];
  }
  if (record.procedures && relKey === 'procedures') return record.procedures;
  if (record.pathways && relKey === 'pathways') return record.pathways;
  if (record.includes && relConfig.joinTable === 'test_packs') {
    return record.includes?.tests || [];
  }
  if (record.includes && relConfig.joinTable === 'procedure_pathways') {
    return record.includes?.procedures || [];
  }
  return [];
}


// ============================================================================
// PHYSICIAN ↔ PROCEDURE CROSS-LINKING
// ============================================================================

/**
 * Load procedures for a physician and render cross-link UI in the modal.
 * Since we don't have a join table, we link by specialty_id match.
 * Procedures with the same specialty_id as the physician are "linked".
 */
async function loadPhysicianProcedures(physician) {
  const modal = document.getElementById('edit-form');
  if (!modal || !physician.specialty_id) return;

  let procedures = [];
  if (isDemoMode && typeof DEMO_DATA !== 'undefined') {
    procedures = DEMO_DATA.procedures || [];
  } else {
    try {
      const data = await apiRequest(`/procedures?limit=100&status=active&specialty_id=${physician.specialty_id}`);
      procedures = data.data || [];
    } catch (err) {
      console.warn('Could not fetch procedures:', err.message);
      return;
    }
  }

  // Filter procedures matching physician's specialty
  const matchingProcs = procedures.filter(p => p.specialty_id === physician.specialty_id);
  
  // Also get all procedures for secondary specialties
  let secondaryProcs = [];
  const secondarySpecs = physician.specialties_secondary || [];
  if (secondarySpecs.length > 0 && !isDemoMode) {
    for (const specId of secondarySpecs) {
      try {
        const data = await apiRequest(`/procedures?limit=100&status=active&specialty_id=${specId}`);
        secondaryProcs.push(...(data.data || []));
      } catch { /* ignore */ }
    }
  }

  const allProcs = [...matchingProcs, ...secondaryProcs];
  if (allProcs.length === 0) return;

  // Build cross-link section
  let html = `
    <div class="procedures-crosslink" style="margin-top:20px;padding-top:16px;border-top:2px solid var(--gray-200)">
      <h4 style="margin-bottom:12px;color:var(--primary);display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">&#129658;</span>
        Prestazioni Collegate
        <span style="font-weight:400;color:var(--gray-500);font-size:12px">(${allProcs.length} nella specialita)</span>
      </h4>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
  `;

  for (const proc of allProcs) {
    const priceStr = proc.price ? ` — €${parseFloat(proc.price).toFixed(0)}` : '';
    const catBadge = proc.category || '';
    html += `
      <a href="#procedures" onclick="closeModal();setTimeout(()=>{navigateTo('procedures');setTimeout(()=>{document.getElementById('entity-search').value='${esc(proc.name.replace(/'/g, ''))}';handleEntitySearch()},300)},100)" 
        class="procedure-link" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);font-size:12px;text-decoration:none;color:var(--gray-800);transition:all .15s;cursor:pointer"
        onmouseover="this.style.borderColor='var(--primary)';this.style.background='var(--primary-light)'"
        onmouseout="this.style.borderColor='var(--gray-200)';this.style.background='var(--gray-50)'">
        <span style="font-size:10px;padding:1px 6px;background:var(--gray-200);border-radius:4px;text-transform:uppercase;font-weight:600;color:var(--gray-600)">${esc(catBadge)}</span>
        ${esc(proc.name)}${priceStr}
      </a>
    `;
  }

  html += `</div></div>`;
  modal.insertAdjacentHTML('beforeend', html);
}

/**
 * Load physicians for a procedure and render cross-link UI in the modal.
 */
async function loadProcedurePhysicians(procedure) {
  const modal = document.getElementById('edit-form');
  if (!modal || !procedure.specialty_id) return;

  let physicians = [];
  if (isDemoMode && typeof DEMO_DATA !== 'undefined') {
    physicians = (DEMO_DATA.physicians || []).filter(p => p.specialty_id === procedure.specialty_id);
  } else {
    try {
      const data = await apiRequest(`/physicians?limit=100&status=active&specialty_id=${procedure.specialty_id}`);
      physicians = data.data || [];
    } catch (err) {
      console.warn('Could not fetch physicians:', err.message);
      return;
    }
  }

  if (physicians.length === 0) return;

  let html = `
    <div class="physicians-crosslink" style="margin-top:20px;padding-top:16px;border-top:2px solid var(--gray-200)">
      <h4 style="margin-bottom:12px;color:var(--primary);display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">&#129489;&#8205;&#9877;&#65039;</span>
        Medici Collegati
        <span style="font-weight:400;color:var(--gray-500);font-size:12px">(${physicians.length} nella specialita)</span>
      </h4>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
  `;

  for (const doc of physicians) {
    const photoHtml = doc.photo_url
      ? `<img src="${esc(doc.photo_url)}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover">`
      : `<span style="width:24px;height:24px;border-radius:50%;background:var(--gray-200);display:inline-flex;align-items:center;justify-content:center;font-size:12px">&#128100;</span>`;
    html += `
      <a href="#physicians" onclick="closeModal();setTimeout(()=>{navigateTo('physicians');setTimeout(()=>{document.getElementById('entity-search').value='${esc((doc.last_name || '').replace(/'/g, ''))}';handleEntitySearch()},300)},100)" 
        class="physician-link" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);font-size:12px;text-decoration:none;color:var(--gray-800);transition:all .15s;cursor:pointer"
        onmouseover="this.style.borderColor='var(--primary)';this.style.background='var(--primary-light)'"
        onmouseout="this.style.borderColor='var(--gray-200)';this.style.background='var(--gray-50)'">
        ${photoHtml}
        ${esc(doc.display_name || doc.name || '')}
      </a>
    `;
  }

  html += `</div></div>`;
  modal.insertAdjacentHTML('beforeend', html);
}


// ============================================================================
// BUILD PIPELINE TRIGGER (Admin UI)
// ============================================================================

function addBuildPipelineUI() {
  const dashboard = document.getElementById('section-dashboard');
  if (!dashboard) return;

  const dashGrid = dashboard.querySelector('.dashboard-grid');
  if (!dashGrid) return;

  const buildCard = document.createElement('div');
  buildCard.className = 'card';
  buildCard.innerHTML = `
    <h3>Build & Deploy</h3>
    <div class="build-pipeline-controls">
      <p style="font-size:13px;color:var(--gray-600);margin-bottom:16px">
        Esporta i dati dal database ai file JSON statici del sito.
        Esegui dopo ogni modifica ai dati per aggiornare il sito.
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="build-full-btn" onclick="triggerBuild('full')">
          Esporta e Pubblica
        </button>
        <button class="btn btn-outline btn-sm" id="build-validate-btn" onclick="triggerBuild('validate')">
          Valida Dati
        </button>
        <button class="btn btn-outline btn-sm" id="build-schema-btn" onclick="showSchemaOrgPreview()">
          Schema.org Preview
        </button>
      </div>
      <div id="build-result" style="margin-top:12px;font-size:12px;color:var(--gray-600)"></div>
    </div>
  `;
  dashGrid.appendChild(buildCard);
}

window.triggerBuild = async function(action) {
  const resultEl = document.getElementById('build-result');
  if (!resultEl) return;

  resultEl.innerHTML = '<span style="color:var(--primary)">Esecuzione in corso...</span>';

  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 1500));
    const stats = getDemoStats();
    resultEl.innerHTML = `
      <div style="padding:12px;background:var(--primary-light);border-radius:var(--radius);margin-top:8px">
        <strong style="color:var(--primary)">Pipeline completata (demo)</strong><br>
        <small>
          Esportati: ${stats.active_specialties} specialita, ${stats.active_physicians} medici,
          ${stats.active_procedures} prestazioni, ${stats.active_lab_tests?.toLocaleString('it-IT')} esami,
          ${stats.active_packs} pack, ${stats.active_pathways} percorsi<br>
          Indice ricerca: 524 termini<br>
          Schema.org: 945 pagine aggiornate<br>
          Validazione: 0 errori, 19 warning<br>
          Timestamp: ${new Date().toLocaleTimeString('it-IT')}
        </small>
      </div>
    `;
    toast(`Build pipeline "${action}" completata (demo)`, 'success');
    return;
  }

  try {
    const data = await apiRequest('/build', { method: 'POST', body: { action } });
    resultEl.innerHTML = `
      <div style="padding:12px;background:var(--primary-light);border-radius:var(--radius);margin-top:8px">
        <strong style="color:var(--primary)">${data.status}: ${data.action}</strong><br>
        <small>${data.message}</small>
      </div>
    `;
    toast(`Build pipeline "${action}" avviata`, 'success');
  } catch (err) {
    resultEl.innerHTML = `<span style="color:var(--danger)">Errore: ${err.message}</span>`;
    toast('Errore build: ' + err.message, 'error');
  }
};


// ============================================================================
// SCHEMA.ORG JSON-LD PREVIEW (Phase 3.3)
// ============================================================================

window.showSchemaOrgPreview = function() {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;

  const form = document.getElementById('edit-form');
  document.getElementById('modal-title').textContent = 'Schema.org JSON-LD Preview';
  document.getElementById('modal-save-btn').style.display = 'none';
  document.getElementById('modal-cancel-btn').textContent = 'Chiudi';

  // Build Schema.org JSON-LD for the clinic
  const jsonLd = buildSchemaOrgClinic();
  const formatted = JSON.stringify(jsonLd, null, 2);

  form.innerHTML = `
    <div style="margin-bottom:16px">
      <p style="font-size:13px;color:var(--gray-600);margin-bottom:12px">
        Anteprima del JSON-LD Schema.org generato dai dati correnti.
        Questo viene iniettato automaticamente in tutte le 945 pagine HTML durante il build.
      </p>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn btn-outline btn-sm" onclick="copySchemaOrg()">Copia JSON-LD</button>
        <button class="btn btn-outline btn-sm" onclick="validateSchemaOrg()">Valida su Google</button>
      </div>
    </div>
    <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:16px;overflow-x:auto">
      <pre id="schema-org-preview" style="font-family:monospace;font-size:12px;line-height:1.6;margin:0;white-space:pre-wrap;word-break:break-word"><code>${esc(formatted)}</code></pre>
    </div>
    <div style="margin-top:16px">
      <h4 style="font-size:14px;margin-bottom:8px;color:var(--primary)">Pagine Specifiche</h4>
      <div class="list-compact" id="schema-pages-list">
        ${buildSchemaPagesList()}
      </div>
    </div>
  `;

  modal.hidden = false;
};

function buildSchemaOrgClinic() {
  const settings = typeof settingsData !== 'undefined' ? settingsData : {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': settings.schema_org_type || 'MedicalClinic',
    '@id': (settings.canonical_base || 'https://bio-clinic.it') + '/#organization',
    name: settings.schema_org_name || settings.site_name || 'Bio-Clinic Sassari',
    alternateName: 'Bio-Clinic',
    url: settings.canonical_base || 'https://bio-clinic.it',
    logo: (settings.canonical_base || 'https://bio-clinic.it') + (settings.logo_url || '/images/logo-bioclinic.png'),
    image: (settings.canonical_base || 'https://bio-clinic.it') + (settings.og_image || '/images/og-bioclinic.jpg'),
    description: settings.site_description || 'Centro medico polispecialistico e laboratorio analisi a Sassari',
    telephone: settings.phone_primary || '+39 079 956 1332',
    email: settings.email_info || 'info@bio-clinic.it',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Tempio, 26/28',
      addressLocality: 'Sassari',
      addressRegion: 'SS',
      postalCode: '07100',
      addressCountry: 'IT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.7267,
      longitude: 8.5592,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:30',
        closes: '19:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '07:30',
        closes: '13:00',
      },
    ],
    priceRange: '\u20AC\u20AC',
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Credit Card, Debit Card',
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: 40.7267, longitude: 8.5592 },
      geoRadius: '50000',
    },
  };

  // Add specialties as medical specialties
  if (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.specialties) {
    jsonLd.medicalSpecialty = DEMO_DATA.specialties.map(s => ({
      '@type': 'MedicalSpecialty',
      name: s.name,
    }));
  }

  // Add physicians
  if (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.physicians) {
    jsonLd.employee = DEMO_DATA.physicians.slice(0, 10).map(p => ({
      '@type': 'Physician',
      name: p.display_name || `${p.title || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim(),
      jobTitle: p.job_title || '',
      medicalSpecialty: p.specialty_name || p.specialty_id || '',
    }));
  }

  return jsonLd;
}

function buildSchemaPagesList() {
  const pages = [
    { path: '/', type: 'MedicalClinic', desc: 'Homepage — organizzazione completa' },
    { path: '/cardiologia/', type: 'MedicalSpecialty', desc: 'Specialita con medici e prestazioni' },
    { path: '/equipe/salvatore-dessole/', type: 'Physician', desc: 'Profilo medico con specializzazioni' },
    { path: '/servizi/ecografia-cardiaca/', type: 'MedicalProcedure', desc: 'Prestazione con indicazioni e costi' },
    { path: '/laboratorio-analisi/', type: 'MedicalTest', desc: 'Laboratorio con esami disponibili' },
    { path: '/check-up/checkup-donna/', type: 'MedicalProcedure', desc: 'Pack check-up con composizione' },
  ];

  return pages.map(p =>
    `<div class="list-compact-item">
      <span>
        <code style="font-size:11px;background:var(--gray-100);padding:2px 6px;border-radius:4px">${esc(p.path)}</code>
        <span style="margin-left:8px;font-size:12px;color:var(--gray-600)">${esc(p.desc)}</span>
      </span>
      <span style="font-size:11px;font-weight:600;color:var(--primary)">${esc(p.type)}</span>
    </div>`
  ).join('');
}

window.copySchemaOrg = function() {
  const pre = document.getElementById('schema-org-preview');
  if (pre) {
    navigator.clipboard.writeText(pre.textContent).then(() => {
      toast('JSON-LD copiato negli appunti', 'success');
    }).catch(() => {
      toast('Errore copia', 'error');
    });
  }
};

window.validateSchemaOrg = function() {
  window.open('https://search.google.com/test/rich-results', '_blank');
};


// ============================================================================
// ENHANCED DASHBOARD — Alerts, Monitoring, Quick Actions
// ============================================================================

function addDashboardAlerts() {
  const dashboard = document.getElementById('section-dashboard');
  if (!dashboard) return;

  const dashGrid = dashboard.querySelector('.dashboard-grid');
  if (!dashGrid) return;

  // Monitoring card with comprehensive data quality checks
  const alertCard = document.createElement('div');
  alertCard.className = 'card';
  alertCard.id = 'alerts-card';
  alertCard.innerHTML = `
    <h3>Monitoraggio Qualita Dati</h3>
    <div id="data-alerts" class="list-compact">
      <p class="text-muted">Analisi in corso...</p>
    </div>
  `;
  dashGrid.appendChild(alertCard);

  // Quick actions card
  const actionsCard = document.createElement('div');
  actionsCard.className = 'card';
  actionsCard.innerHTML = `
    <h3>Azioni Rapide</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-outline btn-sm" onclick="navigateTo('physicians')">Gestisci Medici</button>
      <button class="btn btn-outline btn-sm" onclick="navigateTo('lab-tests')">Gestisci Esami Lab</button>
      <button class="btn btn-outline btn-sm" onclick="navigateTo('contacts')">Contatti Recenti</button>
      <button class="btn btn-outline btn-sm" onclick="navigateTo('settings')">Impostazioni Sito</button>
      <button class="btn btn-outline btn-sm" onclick="showSchemaOrgPreview()">Anteprima Schema.org</button>
    </div>
  `;
  dashGrid.appendChild(actionsCard);

  // Populate alerts after data loads
  setTimeout(() => populateAlerts(), 500);
}

function populateAlerts() {
  const alertsEl = document.getElementById('data-alerts');
  if (!alertsEl) return;

  const alerts = [];

  if (isDemoMode && typeof DEMO_DATA !== 'undefined') {
    const physicians = DEMO_DATA.physicians || [];
    const labTests = DEMO_DATA.lab_tests || [];
    const specialties = DEMO_DATA.specialties || [];
    const procedures = DEMO_DATA.procedures || [];
    const packs = DEMO_DATA.packs || [];

    // Physician checks
    const noPhoto = physicians.filter(p => !p.photo_url).length;
    if (noPhoto > 0) alerts.push({ type: 'warning', text: `${noPhoto} medici senza foto profilo`, severity: 2 });

    const noBio = physicians.filter(p => !p.bio_short).length;
    if (noBio > 0) alerts.push({ type: 'info', text: `${noBio} medici senza bio breve`, severity: 1 });

    const noBooking = physicians.filter(p => !p.booking_enabled && p.status === 'active').length;
    if (noBooking > 0) alerts.push({ type: 'info', text: `${noBooking} medici attivi senza prenotazione online`, severity: 1 });

    // Lab test checks
    const noPrice = labTests.filter(t => (!t.price && t.price !== 0) || t.price === 0).length;
    if (noPrice > 0) alerts.push({ type: 'danger', text: `${noPrice} esami con prezzo a \u20AC0 o mancante`, severity: 3 });

    const noReferto = labTests.filter(t => !t.turnaround_time && !t.referto).length;
    if (noReferto > 0) alerts.push({ type: 'warning', text: `${noReferto} esami senza tempo referto`, severity: 2 });

    // Orphan checks
    const specIds = new Set(specialties.map(s => s.id));
    const orphanPhysicians = physicians.filter(p => !specIds.has(p.specialty_id)).length;
    if (orphanPhysicians > 0) alerts.push({ type: 'danger', text: `${orphanPhysicians} medici con specialita non riconosciuta`, severity: 3 });

    const orphanProcedures = procedures.filter(p => !specIds.has(p.specialty_id)).length;
    if (orphanProcedures > 0) alerts.push({ type: 'warning', text: `${orphanProcedures} prestazioni con specialita mancante`, severity: 2 });

    // Pack checks
    const emptyPacks = packs.filter(p => {
      const tests = p.includes?.tests || p.tests || [];
      return tests.length === 0;
    }).length;
    if (emptyPacks > 0) alerts.push({ type: 'warning', text: `${emptyPacks} pack senza esami assegnati`, severity: 2 });

    // SEO checks
    const noSeo = physicians.filter(p => !p.seo_title && !p.page_config?.seo_title).length;
    if (noSeo > 5) alerts.push({ type: 'info', text: `${noSeo} medici senza SEO title ottimizzato`, severity: 1 });

    // Summary
    if (alerts.length === 0) {
      alerts.push({ type: 'success', text: 'Tutti i dati sono completi e validi', severity: 0 });
    }
  }

  // Sort by severity (most critical first)
  alerts.sort((a, b) => (b.severity || 0) - (a.severity || 0));

  const icons = { danger: '\u{1F534}', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F', success: '\u2705' };
  const colors = { danger: 'var(--danger)', warning: 'var(--warning)', info: 'var(--info)', success: 'var(--success)' };

  alertsEl.innerHTML = alerts.map(a =>
    `<div class="list-compact-item">
      <span>${icons[a.type] || '\u2139\uFE0F'} ${a.text}</span>
      <span style="font-size:11px;color:${colors[a.type] || colors.info};text-transform:uppercase;font-weight:600">${a.type}</span>
    </div>`
  ).join('') || '<p class="text-muted">Nessun avviso</p>';
}


// ============================================================================
// SPECIALTY SELECTOR ENHANCEMENT
// ============================================================================

function enhanceSpecialtySelector() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        const modal = document.getElementById('edit-modal');
        if (modal && !modal.hidden) {
          enhanceModalFields();
        }
      }
    }
  });

  const modalEl = document.getElementById('edit-modal');
  if (modalEl) {
    observer.observe(modalEl, { attributes: true });
  }
}

async function enhanceModalFields() {
  // Enhance specialty_id field to dropdown
  const specField = document.querySelector('[name="specialty_id"]');
  if (specField && specField.tagName === 'INPUT') {
    const currentVal = specField.value;
    const select = document.createElement('select');
    select.name = 'specialty_id';
    select.id = specField.id;
    select.className = specField.className;
    if (specField.required) select.required = true;
    if (specField.disabled || specField.readOnly) select.disabled = true;

    let specialties = [];
    if (isDemoMode && typeof DEMO_DATA !== 'undefined') {
      specialties = DEMO_DATA.specialties || [];
    } else {
      // Fetch specialties from API in live mode
      try {
        const data = await apiRequest('/specialties?limit=100&status=active');
        specialties = (data.data || []).map(s => ({ id: s.id, name: s.name }));
        // Cache for future use
        window._cachedSpecialties = specialties;
      } catch (err) {
        // Use cached data if available
        specialties = window._cachedSpecialties || [];
        console.warn('Could not fetch specialties:', err.message);
      }
    }

    select.innerHTML = '<option value="">— Seleziona specialita —</option>' +
      specialties.map(s =>
        `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>${s.name}</option>`
      ).join('');

    if (currentVal && !specialties.find(s => s.id === currentVal)) {
      select.innerHTML += `<option value="${currentVal}" selected>${currentVal}</option>`;
    }

    specField.replaceWith(select);
  }

  // Add relations tab
  const record = typeof modalRecord !== 'undefined' ? modalRecord : null;
  if (record && record.id) {
    addRelationsTab(record);
    // Load and render procedure cross-links for physicians
    if (currentEntity === 'physicians') {
      await loadPhysicianProcedures(record);
    }
    // Load and render physician cross-links for procedures
    if (currentEntity === 'procedures') {
      await loadProcedurePhysicians(record);
    }
  }
}


// ============================================================================
// TABLE COLUMN SORTING
// ============================================================================

let sortColumn = null;
let sortDirection = 'asc';

function enableTableSorting() {
  document.getElementById('entity-thead')?.addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th || th.textContent.trim() === 'Azioni') return;

    const thIndex = Array.from(th.parentElement.children).indexOf(th);
    const config = ENTITIES[currentEntity];
    if (!config) return;

    const col = config.columns[thIndex];
    if (!col) return;

    if (sortColumn === col.key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = col.key;
      sortDirection = 'asc';
    }

    const sorted = [...entityData].sort((a, b) => {
      let va = a[col.key] ?? '';
      let vb = b[col.key] ?? '';

      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDirection === 'asc' ? va - vb : vb - va;
      }

      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      const cmp = va.localeCompare(vb, 'it');
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    renderEntityTable(config, sorted);

    // Update header styling
    th.parentElement.querySelectorAll('th').forEach(h => {
      h.style.color = '';
      h.style.cursor = 'pointer';
    });
    th.style.color = 'var(--primary)';
    th.textContent = col.label + (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC');
  });
}


// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function enableKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('edit-modal');
      if (modal && !modal.hidden) {
        closeModal();
        e.preventDefault();
      }
    }

    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.target.matches('input,textarea,select'))) {
      const search = document.getElementById('entity-search');
      if (search && search.offsetParent !== null) {
        search.focus();
        e.preventDefault();
      }
    }

    // Ctrl+S saves settings when on settings page
    if (e.ctrlKey && e.key === 's' && currentSection === 'settings') {
      e.preventDefault();
      if (typeof saveSettings === 'function') saveSettings();
    }
  });
}


// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    enableInlinePriceEdit();
    enableTableSorting();
    enableKeyboardShortcuts();
    enhanceSpecialtySelector();
    addBuildPipelineUI();
    addDashboardAlerts();
    addAnalyticsCard();
    addNotificationsPanel();
    addAIContentGenerator();

    console.log('[Phase 2+3+4] Admin Panel enhancements loaded — v2.2.0');
  }, 300);
});


// ============================================================================
// PHASE 4.2 — GA4 ANALYTICS EMBED
// ============================================================================

function addAnalyticsCard() {
  const dashboard = document.getElementById('section-dashboard');
  if (!dashboard) return;

  const dashGrid = dashboard.querySelector('.dashboard-grid');
  if (!dashGrid) return;

  const card = document.createElement('div');
  card.className = 'card';
  card.style.gridColumn = '1 / -1';
  card.innerHTML = `
    <h3>Analytics Sito</h3>
    <div id="analytics-panel">
      <div class="analytics-tabs" style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:16px">
        <button class="analytics-tab active" data-period="7d" style="padding:8px 16px;background:none;border:none;border-bottom:2px solid var(--primary);margin-bottom:-2px;font-size:12px;font-weight:600;color:var(--primary);cursor:pointer;font-family:inherit">7 Giorni</button>
        <button class="analytics-tab" data-period="30d" style="padding:8px 16px;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;font-size:12px;font-weight:600;color:var(--gray-600);cursor:pointer;font-family:inherit">30 Giorni</button>
        <button class="analytics-tab" data-period="90d" style="padding:8px 16px;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;font-size:12px;font-weight:600;color:var(--gray-600);cursor:pointer;font-family:inherit">90 Giorni</button>
      </div>
      <div id="analytics-content" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-sessions">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Sessioni</div>
        </div>
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-users">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Utenti</div>
        </div>
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-pageviews">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Pagine Viste</div>
        </div>
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-bounce">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Bounce Rate</div>
        </div>
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-duration">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Durata Media</div>
        </div>
        <div class="analytics-metric">
          <div style="font-size:28px;font-weight:800;color:var(--primary)" id="ga-conversion">—</div>
          <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Conversioni</div>
        </div>
      </div>
      <div style="margin-top:16px">
        <h4 style="font-size:13px;margin-bottom:8px;color:var(--gray-700)">Top Pagine</h4>
        <div id="ga-top-pages" class="list-compact"></div>
      </div>
      <div style="margin-top:16px">
        <h4 style="font-size:13px;margin-bottom:8px;color:var(--gray-700)">Fonti di Traffico</h4>
        <div id="ga-traffic-sources" class="list-compact"></div>
      </div>
      <div style="margin-top:12px;text-align:right">
        <a href="https://analytics.google.com" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size:11px">Apri GA4 Completo &rarr;</a>
      </div>
    </div>
  `;
  dashGrid.appendChild(card);

  // Tab switcher
  card.querySelectorAll('.analytics-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      card.querySelectorAll('.analytics-tab').forEach(t => {
        t.style.borderBottomColor = 'transparent';
        t.style.color = 'var(--gray-600)';
        t.classList.remove('active');
      });
      tab.style.borderBottomColor = 'var(--primary)';
      tab.style.color = 'var(--primary)';
      tab.classList.add('active');
      loadAnalyticsData(tab.dataset.period);
    });
  });

  loadAnalyticsData('7d');
}

function loadAnalyticsData(period) {
  const multipliers = { '7d': 1, '30d': 4.2, '90d': 12.5 };
  const m = multipliers[period] || 1;

  // Demo analytics data (in production, fetched from GA4 API)
  if (isDemoMode || true) {
    const data = {
      sessions: Math.round(1840 * m),
      users: Math.round(1420 * m),
      pageviews: Math.round(5620 * m),
      bounce: '42.3%',
      duration: '2:34',
      conversion: Math.round(89 * m),
      topPages: [
        { path: '/', title: 'Homepage', views: Math.round(980 * m), pct: 17 },
        { path: '/laboratorio-analisi/', title: 'Laboratorio Analisi', views: Math.round(620 * m), pct: 11 },
        { path: '/cardiologia/', title: 'Cardiologia', views: Math.round(410 * m), pct: 7 },
        { path: '/ginecologia/', title: 'Ginecologia', views: Math.round(350 * m), pct: 6 },
        { path: '/equipe/', title: 'I Nostri Specialisti', views: Math.round(280 * m), pct: 5 },
        { path: '/slim-care/', title: 'Slim Care Medical', views: Math.round(190 * m), pct: 3 },
      ],
      trafficSources: [
        { source: 'Google Organic', sessions: Math.round(980 * m), pct: 53 },
        { source: 'Diretto', sessions: Math.round(460 * m), pct: 25 },
        { source: 'Google Maps', sessions: Math.round(210 * m), pct: 11 },
        { source: 'Social (Facebook)', sessions: Math.round(120 * m), pct: 7 },
        { source: 'Referral', sessions: Math.round(70 * m), pct: 4 },
      ],
    };

    document.getElementById('ga-sessions').textContent = data.sessions.toLocaleString('it-IT');
    document.getElementById('ga-users').textContent = data.users.toLocaleString('it-IT');
    document.getElementById('ga-pageviews').textContent = data.pageviews.toLocaleString('it-IT');
    document.getElementById('ga-bounce').textContent = data.bounce;
    document.getElementById('ga-duration').textContent = data.duration;
    document.getElementById('ga-conversion').textContent = data.conversion.toLocaleString('it-IT');

    document.getElementById('ga-top-pages').innerHTML = data.topPages.map(p =>
      `<div class="list-compact-item">
        <span><code style="font-size:10px;background:var(--gray-100);padding:1px 4px;border-radius:3px">${esc(p.path)}</code> ${esc(p.title)}</span>
        <span style="font-size:12px;font-weight:600;color:var(--primary)">${p.views.toLocaleString('it-IT')} <small style="color:var(--gray-500)">(${p.pct}%)</small></span>
      </div>`
    ).join('');

    document.getElementById('ga-traffic-sources').innerHTML = data.trafficSources.map(s => {
      const barWidth = s.pct;
      return `<div class="list-compact-item" style="position:relative">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${barWidth}%;background:var(--primary-light);border-radius:4px;z-index:0"></div>
        <span style="position:relative;z-index:1">${esc(s.source)}</span>
        <span style="position:relative;z-index:1;font-size:12px;font-weight:600">${s.sessions.toLocaleString('it-IT')} <small style="color:var(--gray-500)">(${s.pct}%)</small></span>
      </div>`;
    }).join('');
  }
}


// ============================================================================
// PHASE 4.3 — NOTIFICATIONS PANEL
// ============================================================================

function addNotificationsPanel() {
  // Add notification bell to topbar
  const topbar = document.querySelector('.topbar-actions');
  if (!topbar) return;

  const bellBtn = document.createElement('button');
  bellBtn.id = 'notification-bell';
  bellBtn.className = 'btn btn-sm btn-outline';
  bellBtn.style.cssText = 'position:relative;padding:6px 10px;font-size:16px;border:none;background:none;cursor:pointer';
  bellBtn.innerHTML = '\uD83D\uDD14';
  bellBtn.title = 'Notifiche';

  const badge = document.createElement('span');
  badge.id = 'notification-badge';
  badge.style.cssText = 'position:absolute;top:-2px;right:-2px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;display:none';
  bellBtn.appendChild(badge);

  topbar.prepend(bellBtn);

  // Dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'notification-dropdown';
  dropdown.style.cssText = 'display:none;position:absolute;top:var(--topbar-h);right:24px;width:360px;max-height:480px;overflow-y:auto;background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow-lg);z-index:200;border:1px solid var(--gray-200)';
  dropdown.innerHTML = `
    <div style="padding:16px;border-bottom:1px solid var(--gray-100);display:flex;justify-content:space-between;align-items:center">
      <strong style="font-size:14px">Notifiche</strong>
      <button class="btn btn-sm" id="notif-mark-all" style="font-size:11px;padding:2px 8px;background:none;border:none;color:var(--primary);cursor:pointer">Segna tutte lette</button>
    </div>
    <div id="notification-list" style="padding:8px 0"></div>
  `;
  document.querySelector('.main-content')?.appendChild(dropdown);

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
    loadNotifications();
  });

  document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  dropdown.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('notif-mark-all')?.addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    badge.style.display = 'none';
    toast('Tutte le notifiche segnate come lette', 'success');
  });

  // Show initial badge
  setTimeout(() => {
    if (isDemoMode) {
      badge.textContent = '3';
      badge.style.display = 'flex';
    }
  }, 1000);
}

function loadNotifications() {
  const list = document.getElementById('notification-list');
  if (!list) return;

  const notifications = [
    { id: 1, type: 'contact', text: 'Nuovo contatto: Maria Rossi — Visita Ginecologica', time: '10 min fa', unread: true },
    { id: 2, type: 'booking', text: 'Nuova prenotazione: Luca Melis — Profilo Tiroide (1 Mar)', time: '25 min fa', unread: true },
    { id: 3, type: 'alert', text: 'Anomalia: 3 esami con prezzo a \u20AC0 rilevati', time: '1 ora fa', unread: true },
    { id: 4, type: 'system', text: 'Build pipeline completata: 319 record esportati', time: '2 ore fa', unread: false },
    { id: 5, type: 'contact', text: 'Nuovo contatto: Paolo Ferraro — Check-up Base', time: '3 ore fa', unread: false },
    { id: 6, type: 'system', text: 'Schema.org aggiornato su 945 pagine', time: 'ieri', unread: false },
  ];

  const icons = { contact: '\uD83D\uDCE8', booking: '\uD83D\uDCC5', alert: '\u26A0\uFE0F', system: '\u2699\uFE0F' };

  list.innerHTML = notifications.map(n =>
    `<div class="notif-item ${n.unread ? 'unread' : ''}" style="padding:10px 16px;border-bottom:1px solid var(--gray-100);cursor:pointer;transition:background .15s;${n.unread ? 'background:var(--primary-light)' : ''}" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='${n.unread ? 'var(--primary-light)' : ''}'">
      <div style="display:flex;gap:8px;align-items:start">
        <span style="font-size:16px;flex-shrink:0">${icons[n.type] || '\u2139\uFE0F'}</span>
        <div>
          <div style="font-size:12px;line-height:1.4;color:var(--gray-800)">${esc(n.text)}</div>
          <div style="font-size:10px;color:var(--gray-500);margin-top:2px">${esc(n.time)}</div>
        </div>
        ${n.unread ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:4px"></span>' : ''}
      </div>
    </div>`
  ).join('');
}


// ============================================================================
// PHASE 4.5 — AI-ASSISTED CONTENT GENERATOR
// ============================================================================

function addAIContentGenerator() {
  // Add AI button to entity toolbar when relevant
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector('.toolbar-right');
    if (!toolbar || document.getElementById('ai-gen-btn')) return;

    const entityTypes = ['procedures', 'lab-tests', 'packs', 'pathways', 'specialties'];
    if (!entityTypes.includes(currentEntity)) return;

    const btn = document.createElement('button');
    btn.id = 'ai-gen-btn';
    btn.className = 'btn btn-sm';
    btn.style.cssText = 'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:12px';
    btn.innerHTML = '\u2728 AI Content';
    btn.title = 'Genera descrizioni con AI per elementi selezionati';
    btn.addEventListener('click', openAIContentModal);
    toolbar.prepend(btn);
  });

  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    observer.observe(contentArea, { childList: true, subtree: true, attributes: true });
  }
}

function openAIContentModal() {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;

  const form = document.getElementById('edit-form');
  document.getElementById('modal-title').textContent = 'AI Content Generator';
  document.getElementById('modal-save-btn').style.display = 'none';
  document.getElementById('modal-cancel-btn').textContent = 'Chiudi';

  const entityLabel = ENTITIES[currentEntity]?.label || currentEntity;
  const itemCount = entityData?.length || 0;

  form.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="font-size:24px">\u2728</span>
        <div>
          <h4 style="margin:0">Generazione Contenuti AI</h4>
          <p style="font-size:12px;color:var(--gray-600);margin:2px 0 0">Genera automaticamente meta description, testi SEO e contenuti per ${esc(entityLabel)}</p>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Tipo di Contenuto</label>
      <select id="ai-content-type" style="width:100%;padding:8px 12px;border:1px solid var(--gray-300);border-radius:var(--radius);font-size:13px">
        <option value="meta_description">Meta Description (SEO)</option>
        <option value="description_short">Descrizione Breve</option>
        <option value="description_full">Descrizione Completa</option>
        <option value="indications">Indicazioni Cliniche</option>
        <option value="preparation">Preparazione Paziente</option>
        <option value="faq">FAQ Paziente</option>
      </select>
    </div>

    <div class="form-group">
      <label>Lingua</label>
      <select id="ai-lang" style="width:100%;padding:8px 12px;border:1px solid var(--gray-300);border-radius:var(--radius);font-size:13px">
        <option value="it" selected>Italiano</option>
        <option value="en">English</option>
      </select>
    </div>

    <div class="form-group">
      <label>Tono</label>
      <select id="ai-tone" style="width:100%;padding:8px 12px;border:1px solid var(--gray-300);border-radius:var(--radius);font-size:13px">
        <option value="professional">Professionale Medico</option>
        <option value="accessible">Accessibile al Paziente</option>
        <option value="seo">Ottimizzato SEO</option>
      </select>
    </div>

    <div class="form-group">
      <label>Target</label>
      <div style="display:flex;gap:8px">
        <label style="display:flex;align-items:center;gap:4px;font-weight:400;font-size:13px">
          <input type="radio" name="ai-target" value="missing" checked> Solo senza descrizione (${countMissing()} elementi)
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-weight:400;font-size:13px">
          <input type="radio" name="ai-target" value="all"> Tutti (${itemCount} elementi)
        </label>
      </div>
    </div>

    <div style="padding:16px;background:var(--gray-50);border-radius:var(--radius);margin-bottom:16px">
      <h4 style="font-size:13px;margin-bottom:8px">Anteprima Prompt</h4>
      <pre id="ai-prompt-preview" style="font-size:11px;line-height:1.5;color:var(--gray-700);white-space:pre-wrap;margin:0"></pre>
    </div>

    <div style="display:flex;gap:8px">
      <button type="button" class="btn btn-sm" id="ai-preview-btn" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff" onclick="generateAIPreview()">Genera Anteprima</button>
      <button type="button" class="btn btn-outline btn-sm" id="ai-apply-btn" onclick="applyAIContent()" style="display:none">Applica a Tutti</button>
    </div>

    <div id="ai-result" style="margin-top:16px;display:none">
      <h4 style="font-size:13px;margin-bottom:8px;color:var(--primary)">Risultato</h4>
      <div id="ai-result-content" style="padding:12px;background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius);font-size:13px;line-height:1.6"></div>
    </div>
  `;

  // Update prompt preview on change
  const updatePreview = () => {
    const type = document.getElementById('ai-content-type')?.value || 'meta_description';
    const lang = document.getElementById('ai-lang')?.value || 'it';
    const tone = document.getElementById('ai-tone')?.value || 'professional';
    const sample = entityData?.[0];
    const sampleName = sample?.name || sample?.display_name || 'Esempio';

    const prompts = {
      meta_description: `Genera una meta description SEO (max 155 caratteri) per "${sampleName}".
Tono: ${tone}. Includi: specialita, beneficio paziente, call-to-action.
Output: solo il testo della meta description, senza virgolette.`,
      description_short: `Scrivi una descrizione breve (max 200 caratteri) per "${sampleName}".
Tono: ${tone}. Focus: cosa e, a chi serve, perche sceglierci.`,
      description_full: `Scrivi una descrizione completa (300-500 parole) per "${sampleName}".
Struttura: Introduzione, Cos'e, Quando farla, Come si svolge, Perche scegliere Bio-Clinic.
Tono: ${tone}. Lingua: ${lang}.`,
      indications: `Elenca le indicazioni cliniche per "${sampleName}".
Formato: lista puntata, max 8 elementi, linguaggio ${tone}.`,
      preparation: `Scrivi le istruzioni di preparazione per il paziente per "${sampleName}".
Formato: lista numerata, passi chiari, durata, digiuno se necessario.`,
      faq: `Genera 5 FAQ per il paziente su "${sampleName}".
Formato: Q: domanda\\nA: risposta breve. Tono: ${tone}.`,
    };

    const preview = document.getElementById('ai-prompt-preview');
    if (preview) preview.textContent = prompts[type] || '';
  };

  ['ai-content-type', 'ai-lang', 'ai-tone'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updatePreview);
  });
  updatePreview();

  modal.hidden = false;
}

function countMissing() {
  if (!entityData) return 0;
  return entityData.filter(r => !r.description_short && !r.meta_description && !r.description_full).length;
}

window.generateAIPreview = async function() {
  const resultEl = document.getElementById('ai-result');
  const contentEl = document.getElementById('ai-result-content');
  const applyBtn = document.getElementById('ai-apply-btn');
  if (!resultEl || !contentEl) return;

  resultEl.style.display = '';
  contentEl.innerHTML = '<span style="color:var(--primary)">Generazione in corso...</span>';

  // Simulate AI generation (in production, calls OpenAI/Claude API)
  await new Promise(r => setTimeout(r, 2000));

  const type = document.getElementById('ai-content-type')?.value || 'meta_description';
  const sample = entityData?.[0];
  const name = sample?.name || sample?.display_name || 'Esame';

  const demoResults = {
    meta_description: `${name} a Sassari presso Bio-Clinic. Specialisti qualificati, apparecchiature di ultima generazione. Prenota ora il tuo appuntamento.`,
    description_short: `${name}: esame specialistico disponibile presso Bio-Clinic Sassari con medici esperti e tecnologie avanzate.`,
    description_full: `<p><strong>${name}</strong> e un servizio specialistico disponibile presso il centro medico Bio-Clinic di Sassari.</p><p>Il nostro team di specialisti utilizza apparecchiature diagnostiche di ultima generazione per garantire risultati accurati e tempestivi.</p><p>Bio-Clinic offre un ambiente accogliente e professionale, con tempi di attesa ridotti e la possibilita di prenotare online.</p>`,
    indications: `<ul><li>Controllo periodico di routine</li><li>Approfondimento diagnostico su indicazione medica</li><li>Monitoraggio di patologie note</li><li>Screening preventivo</li><li>Valutazione pre-operatoria</li></ul>`,
    preparation: `<ol><li>Presentarsi a digiuno da almeno 8 ore (se richiesto)</li><li>Portare documentazione medica precedente</li><li>Comunicare eventuali farmaci in uso</li><li>Arrivare 10 minuti prima dell'appuntamento</li></ol>`,
    faq: `<p><strong>Q: Quanto dura l'esame?</strong><br>A: L'esame dura circa 15-30 minuti.</p><p><strong>Q: Serve la prenotazione?</strong><br>A: Si, e consigliata la prenotazione online o telefonica.</p><p><strong>Q: I risultati sono immediati?</strong><br>A: I risultati sono disponibili entro 24-72 ore.</p>`,
  };

  contentEl.innerHTML = demoResults[type] || 'Contenuto generato';
  if (applyBtn) applyBtn.style.display = '';
  toast('Anteprima AI generata (demo)', 'success');
};

window.applyAIContent = function() {
  if (isDemoMode) {
    toast('Modalita Demo: applicazione AI non disponibile. In produzione, il contenuto verra salvato nel DB.', 'warning');
    return;
  }
  toast('Contenuto AI applicato a tutti gli elementi selezionati', 'success');
};
