/**
 * Bio-Clinic Admin Panel — Main Application
 * ===========================================
 * SPA with Supabase Auth + REST API integration.
 * Includes full Demo Mode with real project data.
 *
 * @version 2.0.0
 * @date 2026-02-28
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: 'https://mdxqgzkxrcrotxxbhoai.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFnemt4cmNyb3R4eGJob2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODYxMzIsImV4cCI6MjA4NzU2MjEzMn0.HHExeiCGqnx4di_u9gghUnTfgQVAIjKuN6kt_vLFddA',
  API_BASE: '/api/admin',
};

// Entity configurations for CRUD modules
const ENTITIES = {
  specialties: {
    label: 'Specialita',
    demoKey: 'specialties',
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'name', label: 'Nome' },
      { key: 'icon', label: 'Icona', width: '60px' },
      { key: 'menu_order', label: 'Ordine', width: '70px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'name_extended', label: 'Nome Esteso', type: 'text' },
      { key: 'slug', label: 'Slug URL', type: 'text', required: true },
      { key: 'icon', label: 'Icona', type: 'text' },
      { key: 'color_primary', label: 'Colore Primario', type: 'color' },
      { key: 'description_short', label: 'Descrizione Breve', type: 'textarea' },
      { key: 'menu_order', label: 'Ordine Menu', type: 'number' },
      { key: 'show_in_menu', label: 'Mostra nel Menu', type: 'checkbox' },
      { key: 'show_in_homepage', label: 'Mostra in Homepage', type: 'checkbox' },
      { key: 'featured', label: 'In Evidenza', type: 'checkbox' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  physicians: {
    label: 'Medici',
    demoKey: 'physicians',
    columns: [
      { key: 'display_name', label: 'Nome Completo' },
      { key: 'specialty_id', label: 'Specialita', width: '130px' },
      { key: 'job_title', label: 'Ruolo' },
      { key: 'booking_enabled', label: 'Prenotabile', width: '90px' },
      { key: 'priority_order', label: 'Priorita', width: '70px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'title', label: 'Titolo', type: 'select', options: ['Prof.', 'Dott.', 'Dott.ssa'], required: true },
      { key: 'first_name', label: 'Nome', type: 'text', required: true },
      { key: 'last_name', label: 'Cognome', type: 'text', required: true },
      { key: 'specialty_id', label: 'Specialita Principale', type: 'text', required: true },
      { key: 'specialties_secondary', label: 'Specialita Secondarie', type: 'tags', placeholder: 'es. endocrinologia, ecografia' },
      { key: 'job_title', label: 'Ruolo / Qualifica', type: 'text' },
      { key: 'role_badges', label: 'Badge Ruolo', type: 'tags', placeholder: 'es. Responsabile, Referente' },
      { key: 'is_director', label: 'Direttore Sanitario', type: 'checkbox' },
      { key: 'bio_short', label: 'Bio Breve', type: 'textarea' },
      { key: 'photo_url', label: 'Foto Profilo', type: 'photo' },
      { key: 'booking_enabled', label: 'Prenotazione Abilitata', type: 'checkbox' },
      { key: 'show_in_equipe', label: 'Mostra in Equipe', type: 'checkbox' },
      { key: 'show_in_specialty', label: 'Mostra in Specialita', type: 'checkbox' },
      { key: 'miodottore_url', label: 'URL MioDottore', type: 'url' },
      { key: 'miodottore_id', label: 'ID MioDottore', type: 'text' },
      { key: 'priority_order', label: 'Ordine Priorita', type: 'number' },
      { key: 'featured_on_homepage', label: 'In Homepage', type: 'checkbox' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  procedures: {
    label: 'Prestazioni',
    demoKey: 'procedures',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'specialty_id', label: 'Specialita', width: '130px' },
      { key: 'category', label: 'Categoria', width: '110px' },
      { key: 'duration_minutes', label: 'Durata', width: '70px' },
      { key: 'price', label: 'Prezzo', width: '80px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'name_extended', label: 'Nome Esteso', type: 'text' },
      { key: 'slug', label: 'Slug URL', type: 'text', required: true },
      { key: 'specialty_id', label: 'Specialita', type: 'text', required: true },
      { key: 'category', label: 'Categoria', type: 'select', options: ['visita', 'diagnostica', 'esame', 'trattamento', 'intervento', 'terapia'], required: true },
      { key: 'page_type', label: 'Tipo Pagina', type: 'select', options: ['A', 'B', 'C', 'D'] },
      { key: 'description_short', label: 'Descrizione', type: 'textarea' },
      { key: 'duration_minutes', label: 'Durata (min)', type: 'number' },
      { key: 'preparation_required', label: 'Preparazione Richiesta', type: 'checkbox' },
      { key: 'fasting_required', label: 'Digiuno Richiesto', type: 'checkbox' },
      { key: 'show_price', label: 'Mostra Prezzo', type: 'checkbox' },
      { key: 'price', label: 'Prezzo (EUR)', type: 'number', step: '0.01' },
      { key: 'price_note', label: 'Note Prezzo', type: 'text' },
      { key: 'booking_priority', label: 'Priorita Prenotazione', type: 'number' },
      { key: 'page_url', label: 'URL Pagina', type: 'url' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  'lab-tests': {
    label: 'Esami Laboratorio',
    demoKey: 'lab_tests',
    apiTable: 'lab-tests',
    columns: [
      { key: 'name', label: 'Nome Esame' },
      { key: 'code', label: 'Codice', width: '90px' },
      { key: 'category', label: 'Categoria', width: '130px' },
      { key: 'price', label: 'Prezzo', width: '80px' },
      { key: 'turnaround_time', label: 'Referto', width: '80px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'name', label: 'Nome Esame', type: 'text', required: true },
      { key: 'code', label: 'Codice Nomenclatore', type: 'text' },
      { key: 'category', label: 'Categoria', type: 'text', required: true },
      { key: 'subcategory', label: 'Sotto-categoria', type: 'text' },
      { key: 'sample_type', label: 'Tipo Campione', type: 'text' },
      { key: 'fasting_required', label: 'Digiuno Richiesto', type: 'checkbox' },
      { key: 'turnaround_time', label: 'Tempo Referto', type: 'text' },
      { key: 'price', label: 'Prezzo (EUR)', type: 'number', step: '0.01' },
      { key: 'price_urgent', label: 'Prezzo Urgente', type: 'number', step: '0.01' },
      { key: 'description_short', label: 'Descrizione', type: 'textarea' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  packs: {
    label: 'Pack / Check-up',
    demoKey: 'packs',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'type', label: 'Tipo', width: '110px' },
      { key: 'exams_count', label: 'Esami', width: '70px' },
      { key: 'price_total', label: 'Prezzo', width: '80px' },
      { key: 'savings_pct', label: 'Sconto', width: '70px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'slug', label: 'Slug URL', type: 'text', required: true },
      { key: 'type', label: 'Tipo', type: 'select', options: ['checkup', 'screening', 'pack_lab', 'pack_specialist'] },
      { key: 'description_short', label: 'Descrizione', type: 'textarea' },
      { key: 'target_audience', label: 'Target', type: 'text' },
      { key: 'price_total', label: 'Prezzo Totale', type: 'number', step: '0.01' },
      { key: 'savings_pct', label: 'Sconto %', type: 'number' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  pathways: {
    label: 'Percorsi Clinici',
    demoKey: 'pathways',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'type', label: 'Tipo', width: '130px' },
      { key: 'duration', label: 'Durata', width: '80px' },
      { key: 'is_flagship', label: 'Flagship', width: '80px' },
      { key: 'price_total', label: 'Prezzo', width: '80px' },
      { key: 'status', label: 'Stato', width: '90px' },
    ],
    fields: [
      { key: 'id', label: 'ID (slug)', type: 'text', required: true },
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'slug', label: 'Slug URL', type: 'text', required: true },
      { key: 'type', label: 'Tipo', type: 'select', options: ['clinical_pathway', 'program', 'checkup_pathway'] },
      { key: 'description_short', label: 'Descrizione', type: 'textarea' },
      { key: 'target_audience', label: 'Target Paziente', type: 'text' },
      { key: 'duration', label: 'Durata', type: 'text' },
      { key: 'expected_outcome', label: 'Risultato Atteso', type: 'text' },
      { key: 'is_flagship', label: 'Flagship', type: 'checkbox' },
      { key: 'price_total', label: 'Prezzo Totale', type: 'number', step: '0.01' },
      { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive', 'hidden'] },
    ],
  },
  contacts: {
    label: 'Contatti / Lead',
    demoKey: 'contacts',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'phone', label: 'Telefono', width: '130px' },
      { key: 'service', label: 'Servizio', width: '130px' },
      { key: 'status', label: 'Stato', width: '110px' },
      { key: 'created_at', label: 'Data', width: '130px' },
    ],
    fields: [
      { key: 'status', label: 'Stato', type: 'select', options: ['new', 'contacted', 'scheduled', 'completed', 'lost', 'spam'] },
      { key: 'notes', label: 'Note', type: 'textarea' },
      { key: 'follow_up_date', label: 'Follow-up', type: 'date' },
    ],
    readOnly: true,
  },
};


// ============================================================================
// STATE
// ============================================================================

let supabaseClient = null;
let currentUser = null;
let currentToken = null;
let currentSection = 'dashboard';
let currentEntity = null;
let entityData = [];
let pagination = { page: 1, limit: 20, total: 0 };
let isDemoMode = false;

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Try to initialize Supabase (may fail if CDN blocked)
  try {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn('Supabase init failed:', e.message);
  }

  // Check existing session
  if (supabaseClient) {
    checkSession();
  }

  // Event listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('demo-btn').addEventListener('click', enterDemoMode);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

  const exitDemoBtn = document.getElementById('exit-demo-btn');
  if (exitDemoBtn) exitDemoBtn.addEventListener('click', handleLogout);

  // Nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.section);
    });
  });

  // Modal
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-save-btn').addEventListener('click', handleModalSave);
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

  // Entity toolbar
  document.getElementById('entity-search').addEventListener('input', debounce(handleEntitySearch, 400));
  document.getElementById('entity-status-filter').addEventListener('change', handleEntityFilter);
  document.getElementById('entity-add-btn').addEventListener('click', handleEntityAdd);
  document.getElementById('entity-export-btn').addEventListener('click', handleEntityExport);
  document.getElementById('page-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('page-next').addEventListener('click', () => changePage(1));

  // Hash navigation
  window.addEventListener('hashchange', () => {
    const section = window.location.hash.slice(1) || 'dashboard';
    navigateTo(section);
  });
});

// ============================================================================
// AUTH
// ============================================================================

async function checkSession() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentToken = session.access_token;
      currentUser = session.user;
      showApp();
      loadDashboard();
    }
  } catch (e) {
    console.warn('Session check failed:', e.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  const errorText = document.getElementById('login-error-text');

  btn.disabled = true;
  btn.textContent = 'Accesso in corso...';
  errorEl.hidden = true;

  try {
    if (!supabaseClient) throw new Error('Supabase non disponibile. Usa la Modalita Demo.');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentToken = data.session.access_token;
    currentUser = data.user;
    isDemoMode = false;
    showApp();
    loadDashboard();
    toast('Benvenuto!', 'success');
  } catch (err) {
    let msg = 'Credenziali non valide o account non autorizzato.';
    if (err.message && err.message.includes('Demo')) {
      msg = err.message;
    } else if (err.message && err.message.includes('Invalid login')) {
      msg = 'Email o password non corretti. Controlla le credenziali.';
    } else if (err.message && err.message.includes('fetch')) {
      msg = 'Impossibile connettersi al server. Prova la Modalita Demo.';
    }
    errorText.textContent = msg;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Accedi';
  }
}

function enterDemoMode() {
  isDemoMode = true;
  currentUser = { email: 'demo@bio-clinic.it' };
  currentToken = 'demo-token';
  showApp();
  loadDashboard();
  toast('Modalita Demo attivata — dati di sola lettura', 'warning');
}

async function handleLogout() {
  if (!isDemoMode && supabaseClient) {
    try { await supabaseClient.auth.signOut(); } catch (e) { /* ignore */ }
  }
  currentToken = null;
  currentUser = null;
  isDemoMode = false;

  // Completely hide app, show login
  document.getElementById('app').style.display = 'none';
  document.getElementById('demo-banner').style.display = 'none';
  document.getElementById('login-screen').style.display = '';
  document.getElementById('login-error').hidden = true;
  window.location.hash = '';
}

function showApp() {
  // Hide login, show app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = '';

  // Show demo banner if in demo mode
  document.getElementById('demo-banner').style.display = isDemoMode ? '' : 'none';

  // User info
  document.getElementById('user-email').textContent = currentUser?.email || '—';
  document.getElementById('user-role').textContent = isDemoMode ? 'Demo' : 'Admin';

  // Navigate to hash if present
  const section = window.location.hash.slice(1) || 'dashboard';
  navigateTo(section);
}

// ============================================================================
// DEMO MODE — data access layer
// ============================================================================

function getDemoData(entityKey) {
  if (typeof DEMO_DATA === 'undefined') return [];
  return DEMO_DATA[entityKey] || [];
}

function getDemoStats() {
  if (typeof DEMO_DATA === 'undefined') return {};
  return DEMO_DATA.stats || {};
}

// Client-side search and filter for demo mode
function filterDemoData(data, search, status) {
  let filtered = [...data];

  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r => {
      return Object.values(r).some(v =>
        v && String(v).toLowerCase().includes(q)
      );
    });
  }

  return filtered;
}

// ============================================================================
// API — with demo fallback
// ============================================================================

async function apiRequest(endpoint, options = {}) {
  if (isDemoMode) {
    return demoApiRequest(endpoint, options);
  }

  const { method = 'GET', body } = options;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`,
  };

  const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}

// Simulate API responses from demo data
function demoApiRequest(endpoint, options = {}) {
  const { method = 'GET' } = options;

  // Dashboard
  if (endpoint === '/dashboard') {
    const stats = getDemoStats();
    const contacts = getDemoData('contacts');
    return {
      stats,
      recent_contacts: contacts.slice(0, 8),
      upcoming_bookings: [
        { patient_name: 'Maria Rossi', service_name: 'Visita Ginecologica', booking_date: '2026-03-01', booking_time: '09:30' },
        { patient_name: 'Luca Melis', service_name: 'ECG', booking_date: '2026-03-01', booking_time: '10:00' },
        { patient_name: 'Sara Deiana', service_name: 'Ecografia Tiroide', booking_date: '2026-03-01', booking_time: '11:15' },
        { patient_name: 'Marco Pili', service_name: 'Check-up Base', booking_date: '2026-03-02', booking_time: '08:30' },
      ],
    };
  }

  // Settings
  if (endpoint.startsWith('/settings')) {
    return {
      settings: {
        generale: [
          { key: 'site_name', value: 'Bio-Clinic Sassari', description: 'Nome del sito' },
          { key: 'support_phone', value: '+39 079 956 1332', description: 'Telefono assistenza' },
          { key: 'support_email', value: 'info@bio-clinic.it', description: 'Email assistenza' },
        ],
        prenotazioni: [
          { key: 'booking_enabled', value: true, description: 'Prenotazioni abilitate' },
          { key: 'booking_advance_days', value: 60, description: 'Giorni prenotazione anticipata' },
        ],
      }
    };
  }

  // Audit
  if (endpoint.startsWith('/audit')) {
    return {
      data: [
        { created_at: '2026-02-28T14:30:00Z', user_email: 'admin@bio-clinic.it', action: 'UPDATE', entity_type: 'physicians', entity_id: 'salvatore-dessole' },
        { created_at: '2026-02-28T12:15:00Z', user_email: 'admin@bio-clinic.it', action: 'UPDATE', entity_type: 'lab_tests', entity_id: 'emocromo-completo' },
        { created_at: '2026-02-27T16:45:00Z', user_email: 'admin@bio-clinic.it', action: 'CREATE', entity_type: 'contacts', entity_id: 'demo-5' },
      ]
    };
  }

  // Entity CRUD (GET with pagination, search, filter)
  const entityMatch = endpoint.match(/^\/([a-z-]+)/);
  if (entityMatch) {
    const table = entityMatch[1];
    const entityConfig = Object.values(ENTITIES).find(e => (e.apiTable || '') === table || e.demoKey === table.replace(/-/g, '_'));
    const entityEntry = Object.entries(ENTITIES).find(([k]) => k === table || (ENTITIES[k].apiTable || k) === table);

    let demoKey = table.replace(/-/g, '_');
    if (entityEntry) demoKey = entityEntry[1].demoKey || demoKey;

    let data = getDemoData(demoKey);

    // Parse query params
    const urlParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');
    const search = urlParams.get('search') || '';
    const status = urlParams.get('status') || '';
    const page = parseInt(urlParams.get('page') || '1');
    const limit = parseInt(urlParams.get('limit') || '20');

    // Filter
    const filtered = filterDemoData(data, search, status);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    if (method !== 'GET') {
      toast('Modalita Demo: le modifiche non vengono salvate', 'warning');
      return { success: true, demo: true };
    }

    return {
      data: paged,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      }
    };
  }

  return { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 1 } };
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateTo(section) {
  currentSection = section;

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });

  // Hide all sections
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));

  // Show correct section
  const entityTypes = Object.keys(ENTITIES);
  const isEntity = entityTypes.includes(section);

  if (section === 'dashboard') {
    document.getElementById('section-dashboard').classList.add('active');
    document.getElementById('page-title').textContent = 'Dashboard';
    loadDashboard();
  } else if (section === 'settings') {
    document.getElementById('section-settings').classList.add('active');
    document.getElementById('page-title').textContent = 'Impostazioni';
    loadSettings();
  } else if (section === 'users') {
    document.getElementById('section-users').classList.add('active');
    document.getElementById('page-title').textContent = 'Utenti Admin';
    loadUsers();
  } else if (section === 'bookings') {
    document.getElementById('section-bookings').classList.add('active');
    document.getElementById('page-title').textContent = 'Prenotazioni';
    loadBookings();
  } else if (section === 'audit') {
    document.getElementById('section-audit').classList.add('active');
    document.getElementById('page-title').textContent = 'Audit Log';
    loadAuditLog();
  } else if (isEntity) {
    currentEntity = section;
    const config = ENTITIES[section];
    document.getElementById('section-entity').classList.add('active');
    document.getElementById('page-title').textContent = config.label;

    // Show/hide add button (hidden in read-only or demo mode)
    const addBtn = document.getElementById('entity-add-btn');
    addBtn.style.display = (config.readOnly || isDemoMode) ? 'none' : 'inline-flex';

    pagination = { page: 1, limit: 20, total: 0 };
    document.getElementById('entity-search').value = '';
    document.getElementById('entity-status-filter').value = '';
    loadEntityList();
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function loadDashboard() {
  try {
    const data = await apiRequest('/dashboard');
    const s = data.stats || {};

    document.getElementById('stat-specialties').textContent = s.active_specialties || 0;
    document.getElementById('stat-physicians').textContent = s.active_physicians || 0;
    document.getElementById('stat-procedures').textContent = s.active_procedures || 0;
    document.getElementById('stat-lab-tests').textContent = s.active_lab_tests ? s.active_lab_tests.toLocaleString('it-IT') : '0';
    document.getElementById('stat-packs').textContent = s.active_packs || 0;
    document.getElementById('stat-pathways').textContent = s.active_pathways || 0;
    document.getElementById('stat-contacts').textContent = s.new_contacts || 0;
    document.getElementById('stat-contacts-7d').textContent = s.contacts_last_7d || 0;

    // Sidebar counts
    document.getElementById('count-specialties').textContent = s.active_specialties || 0;
    document.getElementById('count-physicians').textContent = s.active_physicians || 0;
    document.getElementById('count-procedures').textContent = s.active_procedures || 0;
    document.getElementById('count-lab-tests').textContent = s.active_lab_tests ? s.active_lab_tests.toLocaleString('it-IT') : '0';
    document.getElementById('count-packs').textContent = s.active_packs || 0;
    document.getElementById('count-pathways').textContent = s.active_pathways || 0;
    document.getElementById('count-contacts').textContent = s.new_contacts || '0';

    // Recent contacts
    const contactsList = document.getElementById('recent-contacts-list');
    contactsList.innerHTML = (data.recent_contacts || []).slice(0, 8).map(c =>
      `<div class="list-compact-item">
        <span><strong>${esc(c.name)}</strong> — ${esc(c.service || 'Generico')}</span>
        <span class="status-badge status-${c.status}">${c.status}</span>
      </div>`
    ).join('') || '<p class="text-muted">Nessun contatto recente</p>';

    // Upcoming bookings
    const bookingsList = document.getElementById('upcoming-bookings-list');
    bookingsList.innerHTML = (data.upcoming_bookings || []).slice(0, 8).map(b =>
      `<div class="list-compact-item">
        <span><strong>${esc(b.patient_name)}</strong> — ${esc(b.service_name || '')}</span>
        <span>${b.booking_date} ${b.booking_time || ''}</span>
      </div>`
    ).join('') || '<p class="text-muted">Nessuna prenotazione</p>';

    const modeLabel = isDemoMode ? 'Demo' : 'Live';
    document.getElementById('last-sync').textContent = `${modeLabel} — ${new Date().toLocaleTimeString('it-IT')}`;
  } catch (err) {
    console.error('Dashboard load error:', err);
    document.getElementById('last-sync').textContent = 'Errore caricamento dashboard';
  }
}

// ============================================================================
// ENTITY LIST
// ============================================================================

async function loadEntityList() {
  const config = ENTITIES[currentEntity];
  if (!config) return;

  const apiTable = config.apiTable || currentEntity;
  const search = document.getElementById('entity-search').value;
  const status = document.getElementById('entity-status-filter').value;

  // Build table header
  const thead = document.getElementById('entity-thead');
  thead.innerHTML = `<tr>${config.columns.map(c =>
    `<th style="${c.width ? 'width:' + c.width : ''}">${c.label}</th>`
  ).join('')}<th style="width:100px">Azioni</th></tr>`;

  // Loading
  const tbody = document.getElementById('entity-tbody');
  tbody.innerHTML = '<tr><td colspan="99" class="text-muted" style="text-align:center;padding:32px">Caricamento...</td></tr>';

  try {
    let params = `?page=${pagination.page}&limit=${pagination.limit}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (status) params += `&status=${status}`;

    const result = await apiRequest(`/${apiTable}${params}`);
    entityData = result.data || [];
    const pag = result.pagination || {};
    pagination.total = pag.total || entityData.length;

    renderEntityTable(config, entityData);
    updatePagination(pag);
  } catch (err) {
    console.error(`Entity load error (${currentEntity}):`, err);
    tbody.innerHTML = `<tr><td colspan="99" class="text-muted" style="text-align:center;padding:32px">
      Errore caricamento dati. <br><small>${esc(err.message)}</small></td></tr>`;
  }
}

function renderEntityTable(config, data) {
  const tbody = document.getElementById('entity-tbody');

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="99" class="text-muted" style="text-align:center;padding:32px">Nessun risultato</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(row => {
    const cells = config.columns.map(col => {
      let val = row[col.key];

      // Format special values
      if (col.key === 'status') {
        const cls = `status-${val || 'active'}`;
        return `<td><span class="status-badge ${cls}">${val || 'active'}</span></td>`;
      }
      if (col.key === 'price' || col.key === 'price_total') {
        return `<td>${val != null ? '\u20AC ' + parseFloat(val).toFixed(2) : '—'}</td>`;
      }
      if (col.key === 'booking_enabled' || col.key === 'is_flagship' || col.key === 'fasting_required') {
        return `<td>${val ? '\u2705' : '—'}</td>`;
      }
      if (col.key === 'created_at' || col.key === 'updated_at') {
        return `<td>${val ? new Date(val).toLocaleDateString('it-IT') : '—'}</td>`;
      }
      if (col.key === 'savings_pct' || col.key === 'discount_pct') {
        return `<td>${val ? val + '%' : '—'}</td>`;
      }
      if (col.key === 'duration_minutes') {
        return `<td>${val ? val + ' min' : '—'}</td>`;
      }

      return `<td title="${esc(String(val || ''))}">${esc(String(val || '—'))}</td>`;
    }).join('');

    const readOnly = config.readOnly || isDemoMode;
    const actions = `<td class="actions-cell">
      <button class="btn btn-sm btn-outline" onclick="editEntity('${esc(row.id)}')" title="Visualizza/Modifica">\u270F\uFE0F</button>
      ${!readOnly ? `<button class="btn btn-sm btn-outline" onclick="deleteEntity('${esc(row.id)}')" title="Disattiva">\uD83D\uDDD1\uFE0F</button>` : ''}
    </td>`;

    return `<tr>${cells}${actions}</tr>`;
  }).join('');
}

// ============================================================================
// ENTITY CRUD ACTIONS
// ============================================================================

function handleEntitySearch() {
  pagination.page = 1;
  loadEntityList();
}

function handleEntityFilter() {
  pagination.page = 1;
  loadEntityList();
}

function handleEntityAdd() {
  if (isDemoMode) {
    toast('Modalita Demo: creazione non disponibile', 'warning');
    return;
  }
  const config = ENTITIES[currentEntity];
  if (!config || config.readOnly) return;
  openModal('Nuovo ' + config.label, config.fields, {});
}

window.editEntity = function(id) {
  const config = ENTITIES[currentEntity];
  const record = entityData.find(r => r.id === id);
  if (!record || !config) return;

  const title = isDemoMode
    ? 'Dettaglio ' + config.label
    : 'Modifica ' + config.label;
  openModal(title, config.fields, record);
};

window.deleteEntity = async function(id) {
  if (isDemoMode) {
    toast('Modalita Demo: eliminazione non disponibile', 'warning');
    return;
  }
  if (!confirm(`Disattivare questo elemento? (ID: ${id})`)) return;

  try {
    const apiTable = ENTITIES[currentEntity]?.apiTable || currentEntity;
    await apiRequest(`/${apiTable}?id=${id}`, { method: 'DELETE' });
    toast('Elemento disattivato', 'success');
    loadEntityList();
  } catch (err) {
    toast('Errore: ' + err.message, 'error');
  }
};

// ============================================================================
// MODAL (Edit/Create Form)
// ============================================================================

let modalRecord = null;
let modalIsNew = false;

function openModal(title, fields, record) {
  modalRecord = record;
  modalIsNew = !record.id;

  document.getElementById('modal-title').textContent = title;
  const form = document.getElementById('edit-form');

  // In demo mode, show all fields from the record (including those not in config)
  const displayFields = isDemoMode ? buildDemoFields(record, fields) : fields;

  form.innerHTML = displayFields.map(f => {
    const val = record[f.key] ?? '';
    const req = f.required ? 'required' : '';
    const id = `field-${f.key}`;
    const readOnly = isDemoMode ? 'readonly disabled' : '';

    if (f.type === 'textarea') {
      return `<div class="form-group">
        <label for="${id}">${f.label}</label>
        <textarea id="${id}" name="${f.key}" rows="3" ${req} ${readOnly}>${esc(String(val))}</textarea>
      </div>`;
    }
    if (f.type === 'select' && !isDemoMode) {
      const opts = (f.options || []).map(o =>
        `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
      ).join('');
      return `<div class="form-group">
        <label for="${id}">${f.label}</label>
        <select id="${id}" name="${f.key}" ${req}>${opts}</select>
      </div>`;
    }
    if (f.type === 'checkbox') {
      return `<div class="form-group" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="${id}" name="${f.key}" ${val ? 'checked' : ''} ${readOnly}>
        <label for="${id}" style="margin:0">${f.label}</label>
      </div>`;
    }
    // Photo field with preview and upload/remove
    if (f.type === 'photo') {
      const photoUrl = val || '';
      const hasPhoto = !!photoUrl;
      return `<div class="form-group">
        <label>${f.label}</label>
        <div class="photo-manager" id="photo-manager-${f.key}">
          <div class="photo-preview" style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
            <div class="photo-thumb" style="width:80px;height:80px;border-radius:50%;overflow:hidden;background:var(--gray-200);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid var(--gray-300)">
              ${hasPhoto
                ? `<img src="${esc(photoUrl)}" alt="Foto" style="width:100%;height:100%;object-fit:cover" id="photo-img-${f.key}">`
                : `<span style="font-size:32px;color:var(--gray-400)" id="photo-placeholder-${f.key}">&#128100;</span>`}
            </div>
            <div style="flex:1">
              <input type="url" id="${id}" name="${f.key}" value="${esc(String(photoUrl))}" placeholder="URL immagine (https://...)" ${readOnly}
                style="width:100%;margin-bottom:6px">
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${!isDemoMode ? `
                  <label class="btn btn-sm btn-outline" style="cursor:pointer;margin:0;font-size:11px">
                    <input type="file" accept="image/*" id="photo-upload-${f.key}" style="display:none" onchange="handlePhotoUpload(this, '${f.key}')">
                    &#128247; Carica Foto
                  </label>
                  ${hasPhoto ? `<button type="button" class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);font-size:11px" onclick="removePhoto('${f.key}')">&#128465; Rimuovi</button>` : ''}
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }
    // Tags field (arrays like specialties_secondary, role_badges)
    if (f.type === 'tags') {
      const tagsArray = Array.isArray(val) ? val : (val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : []);
      const tagsHtml = tagsArray.map(t =>
        `<span class="tag-item" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:var(--primary-light);color:var(--primary-dark);border-radius:12px;font-size:12px;font-weight:500">
          ${esc(t)}
          ${!isDemoMode ? `<button type="button" class="tag-remove" onclick="removeTag(this,'${f.key}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--danger);padding:0 2px;line-height:1">&times;</button>` : ''}
        </span>`
      ).join('');
      return `<div class="form-group">
        <label for="${id}">${f.label}</label>
        <div class="tags-container" id="tags-${f.key}" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${tagsHtml}</div>
        <div style="display:flex;gap:6px">
          <input type="text" id="${id}" placeholder="${f.placeholder || 'Aggiungi...' }" ${readOnly} style="flex:1"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('${f.key}')}">
          ${!isDemoMode ? `<button type="button" class="btn btn-sm btn-outline" onclick="addTag('${f.key}')">+ Aggiungi</button>` : ''}
        </div>
        <input type="hidden" name="${f.key}" id="tags-hidden-${f.key}" value="${esc(JSON.stringify(tagsArray))}">
      </div>`;
    }

    const inputType = f.type || 'text';
    const step = f.step ? `step="${f.step}"` : '';
    const displayVal = (f.type === 'select' && isDemoMode) ? val : val;
    return `<div class="form-group">
      <label for="${id}">${f.label}</label>
      <input type="${inputType === 'select' ? 'text' : inputType}" id="${id}" name="${f.key}" value="${esc(String(displayVal))}" ${req} ${step} ${readOnly}>
    </div>`;
  }).join('');

  // Disable ID field on edit
  if (!modalIsNew && !isDemoMode) {
    const idField = form.querySelector('[name="id"]');
    if (idField) idField.disabled = true;
  }

  // Hide save button in demo mode
  document.getElementById('modal-save-btn').style.display = isDemoMode ? 'none' : '';
  document.getElementById('modal-cancel-btn').textContent = isDemoMode ? 'Chiudi' : 'Annulla';

  document.getElementById('edit-modal').hidden = false;
}

// Build a comprehensive field list for demo view
function buildDemoFields(record, configFields) {
  const configKeys = new Set(configFields.map(f => f.key));
  const allFields = [...configFields];

  // Add additional record keys not in config
  for (const [key, val] of Object.entries(record)) {
    if (!configKeys.has(key) && key !== 'created_at' && key !== 'updated_at' && val != null && val !== '') {
      const type = typeof val === 'boolean' ? 'checkbox'
        : typeof val === 'number' ? 'number'
        : 'text';
      allFields.push({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        type: String(val).length > 100 ? 'textarea' : type,
      });
    }
  }

  return allFields;
}

function closeModal() {
  document.getElementById('edit-modal').hidden = true;
  modalRecord = null;
}

async function handleModalSave() {
  if (isDemoMode) {
    toast('Modalita Demo: salvataggio non disponibile', 'warning');
    return;
  }

  const form = document.getElementById('edit-form');
  const config = ENTITIES[currentEntity];
  const apiTable = config?.apiTable || currentEntity;

  // Collect form data
  const formData = {};
  config.fields.forEach(f => {
    const el = form.querySelector(`[name="${f.key}"]`);
    if (!el || el.disabled) return;

    if (f.type === 'checkbox') {
      formData[f.key] = el.checked;
    } else if (f.type === 'number') {
      formData[f.key] = el.value ? parseFloat(el.value) : null;
    } else if (f.type === 'tags') {
      // Parse JSON from hidden input
      try {
        formData[f.key] = JSON.parse(el.value || '[]');
      } catch { formData[f.key] = []; }
    } else if (f.type === 'photo') {
      formData[f.key] = el.value || null;
    } else {
      formData[f.key] = el.value || null;
    }
  });

  try {
    if (modalIsNew) {
      await apiRequest(`/${apiTable}`, { method: 'POST', body: formData });
      toast('Creato con successo', 'success');
    } else {
      formData.id = modalRecord.id;
      await apiRequest(`/${apiTable}`, { method: 'PATCH', body: formData });
      toast('Aggiornato con successo', 'success');
    }
    closeModal();
    loadEntityList();
  } catch (err) {
    toast('Errore: ' + err.message, 'error');
  }
}

// ============================================================================
// EXPORT CSV
// ============================================================================

function handleEntityExport() {
  if (!entityData || entityData.length === 0) {
    toast('Nessun dato da esportare', 'info');
    return;
  }

  const config = ENTITIES[currentEntity];
  const headers = config.columns.map(c => c.label);
  const rows = entityData.map(row =>
    config.columns.map(c => {
      const val = row[c.key];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '');
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bio-clinic-${currentEntity}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV esportato', 'success');
}

// ============================================================================
// PAGINATION
// ============================================================================

function updatePagination(pag) {
  const totalPages = pag.total_pages || Math.ceil(pagination.total / pagination.limit) || 1;
  const page = pagination.page;

  document.getElementById('page-info').textContent = `Pagina ${page} di ${totalPages} (${pagination.total} totali)`;
  document.getElementById('page-prev').disabled = page <= 1;
  document.getElementById('page-next').disabled = page >= totalPages;
}

function changePage(delta) {
  pagination.page += delta;
  loadEntityList();
}

// ============================================================================
// SETTINGS, BOOKINGS & AUDIT
// ============================================================================

async function loadBookings() {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;

  if (isDemoMode) {
    const demoBookings = [
      { patient_name: 'Maria Rossi', service_name: 'Analisi del Sangue', booking_date: '2026-03-01', booking_time: '08:30', status: 'confirmed', source: 'website' },
      { patient_name: 'Luca Melis', service_name: 'Profilo Tiroide', booking_date: '2026-03-01', booking_time: '09:00', status: 'confirmed', source: 'phone' },
      { patient_name: 'Sara Deiana', service_name: 'Check-up Base', booking_date: '2026-03-01', booking_time: '09:30', status: 'pending', source: 'website' },
      { patient_name: 'Marco Pili', service_name: 'Emocromo Completo', booking_date: '2026-03-02', booking_time: '08:00', status: 'confirmed', source: 'website' },
      { patient_name: 'Anna Cossu', service_name: 'Profilo Lipidico', booking_date: '2026-03-02', booking_time: '08:30', status: 'pending', source: 'whatsapp' },
      { patient_name: 'Paolo Ferraro', service_name: 'Check-up Tiroide', booking_date: '2026-03-03', booking_time: '09:00', status: 'confirmed', source: 'website' },
    ];
    tbody.innerHTML = demoBookings.map(b =>
      `<tr>
        <td><strong>${esc(b.patient_name)}</strong></td>
        <td>${esc(b.service_name)}</td>
        <td>${b.booking_date}</td>
        <td>${b.booking_time}</td>
        <td><span class="status-badge status-${b.status}">${b.status}</span></td>
        <td>${esc(b.source)}</td>
      </tr>`
    ).join('');
    return;
  }

  try {
    const data = await apiRequest('/bookings?limit=50');
    tbody.innerHTML = (data.data || []).map(b =>
      `<tr>
        <td><strong>${esc(b.patient_name || '')}</strong></td>
        <td>${esc(b.service_name || '')}</td>
        <td>${b.booking_date || ''}</td>
        <td>${b.booking_time || ''}</td>
        <td><span class="status-badge status-${b.status || 'pending'}">${b.status || 'pending'}</span></td>
        <td>${esc(b.source || '')}</td>
      </tr>`
    ).join('') || '<tr><td colspan="6" class="text-muted" style="text-align:center">Nessuna prenotazione</td></tr>';
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center">Prenotazioni non disponibili</td></tr>';
  }
}

// ============================================================================
// SETTINGS (M10) — Full editable grouped settings
// ============================================================================

const SETTINGS_SCHEMA = {
  generale: {
    label: 'Generale',
    fields: [
      { key: 'site_name', label: 'Nome Sito', desc: 'Nome visualizzato nel sito e meta tag', type: 'text', default: 'Bio-Clinic Sassari' },
      { key: 'site_tagline', label: 'Tagline', desc: 'Sottotitolo del sito', type: 'text', default: 'Centro Medico Polispecialistico' },
      { key: 'site_description', label: 'Descrizione Sito', desc: 'Meta description globale', type: 'textarea', default: 'Bio-Clinic Sassari - Centro medico polispecialistico e laboratorio analisi a Sassari.' },
      { key: 'logo_url', label: 'URL Logo', desc: 'Percorso relativo del logo', type: 'text', default: '/images/logo-bioclinic.png' },
      { key: 'favicon_url', label: 'URL Favicon', desc: 'Percorso relativo favicon', type: 'text', default: '/images/logo-bioclinic.png' },
      { key: 'primary_color', label: 'Colore Primario', desc: 'Colore brand principale (hex)', type: 'color', default: '#1a7a4c' },
      { key: 'maintenance_mode', label: 'Modalita Manutenzione', desc: 'Attiva per mostrare pagina di manutenzione', type: 'toggle', default: false },
    ],
  },
  orari: {
    label: 'Orari & Apertura',
    fields: [
      { key: 'opening_weekdays', label: 'Lun-Ven', desc: 'Orario feriale', type: 'text', default: '07:30 - 19:30' },
      { key: 'opening_saturday', label: 'Sabato', desc: 'Orario sabato', type: 'text', default: '07:30 - 13:00' },
      { key: 'opening_sunday', label: 'Domenica', desc: 'Orario domenica', type: 'text', default: 'Chiuso' },
      { key: 'lab_weekdays', label: 'Laboratorio Lun-Ven', desc: 'Orari prelievi e consegna campioni', type: 'text', default: '07:30 - 10:00 (prelievi), 07:30 - 17:00 (ritiro referti)' },
      { key: 'lab_saturday', label: 'Laboratorio Sabato', desc: 'Orario sabato laboratorio', type: 'text', default: '07:30 - 10:00' },
      { key: 'holiday_notice', label: 'Avviso Festivita', desc: 'Messaggio visualizzato per chiusure straordinarie', type: 'textarea', default: '' },
    ],
  },
  contatti: {
    label: 'Contatti & Social',
    fields: [
      { key: 'phone_primary', label: 'Telefono Principale', desc: 'Numero centralino', type: 'tel', default: '+39 079 956 1332' },
      { key: 'phone_lab', label: 'Telefono Laboratorio', desc: 'Numero diretto laboratorio', type: 'tel', default: '+39 079 956 1332' },
      { key: 'email_info', label: 'Email Info', desc: 'Indirizzo email generico', type: 'email', default: 'info@bio-clinic.it' },
      { key: 'email_lab', label: 'Email Laboratorio', desc: 'Email laboratorio/referti', type: 'email', default: 'referti@bio-clinic.it' },
      { key: 'address', label: 'Indirizzo', desc: 'Indirizzo completo della sede', type: 'text', default: 'Via Tempio, 26/28 - 07100 Sassari (SS)' },
      { key: 'maps_url', label: 'URL Google Maps', desc: 'Link alla mappa', type: 'url', default: 'https://maps.app.goo.gl/bioclinic' },
      { key: 'facebook_url', label: 'Facebook', desc: 'URL pagina Facebook', type: 'url', default: '' },
      { key: 'instagram_url', label: 'Instagram', desc: 'URL profilo Instagram', type: 'url', default: '' },
      { key: 'linkedin_url', label: 'LinkedIn', desc: 'URL pagina LinkedIn', type: 'url', default: '' },
      { key: 'whatsapp_number', label: 'WhatsApp', desc: 'Numero WhatsApp (con prefisso internazionale)', type: 'tel', default: '' },
    ],
  },
  seo: {
    label: 'SEO & Metadata',
    fields: [
      { key: 'seo_title_suffix', label: 'Suffisso Titolo', desc: 'Aggiunto a tutti i title tag', type: 'text', default: '| Bio-Clinic Sassari' },
      { key: 'schema_org_type', label: 'Schema.org Type', desc: 'Tipo organizzazione per JSON-LD', type: 'select', options: ['MedicalClinic', 'Hospital', 'MedicalBusiness', 'Physician'], default: 'MedicalClinic' },
      { key: 'schema_org_name', label: 'Schema.org Name', desc: 'Nome organizzazione in JSON-LD', type: 'text', default: 'Bio-Clinic Sassari' },
      { key: 'ga4_measurement_id', label: 'GA4 Measurement ID', desc: 'Google Analytics 4 ID (G-XXXXXXXX)', type: 'text', default: '' },
      { key: 'gtm_container_id', label: 'GTM Container ID', desc: 'Google Tag Manager ID (GTM-XXXXXXX)', type: 'text', default: '' },
      { key: 'robots_global', label: 'Robots Meta', desc: 'Tag robots globale', type: 'select', options: ['index, follow', 'noindex, nofollow', 'noindex, follow'], default: 'index, follow' },
      { key: 'canonical_base', label: 'Canonical Base URL', desc: 'Dominio base per URL canonici', type: 'url', default: 'https://bio-clinic.it' },
      { key: 'og_image', label: 'Open Graph Image', desc: 'Immagine default per condivisioni social', type: 'text', default: '/images/og-bioclinic.jpg' },
    ],
  },
  prenotazioni: {
    label: 'Prenotazioni',
    fields: [
      { key: 'booking_enabled', label: 'Prenotazioni Online', desc: 'Abilita sistema prenotazioni', type: 'toggle', default: true },
      { key: 'booking_advance_days', label: 'Anticipo Massimo', desc: 'Quanti giorni prima si puo prenotare', type: 'number', default: 60 },
      { key: 'booking_min_notice_hours', label: 'Preavviso Minimo', desc: 'Ore minime prima dell\'appuntamento', type: 'number', default: 24 },
      { key: 'booking_slot_duration', label: 'Durata Slot (min)', desc: 'Durata di ogni slot prenotazione', type: 'number', default: 15 },
      { key: 'booking_confirmation_email', label: 'Email Conferma', desc: 'Abilita email conferma automatica', type: 'toggle', default: true },
      { key: 'booking_cancellation_hours', label: 'Limite Cancellazione', desc: 'Ore limite per cancellazione gratuita', type: 'number', default: 24 },
    ],
  },
  notifiche: {
    label: 'Notifiche',
    fields: [
      { key: 'notify_new_contact', label: 'Nuovi Contatti', desc: 'Notifica email per nuovi lead', type: 'toggle', default: true },
      { key: 'notify_new_booking', label: 'Nuove Prenotazioni', desc: 'Notifica email per nuove prenotazioni', type: 'toggle', default: true },
      { key: 'notify_email_recipients', label: 'Destinatari', desc: 'Email notifiche (separati da virgola)', type: 'text', default: 'admin@bio-clinic.it' },
      { key: 'notify_daily_report', label: 'Report Giornaliero', desc: 'Invia riepilogo giornaliero alle 08:00', type: 'toggle', default: false },
      { key: 'notify_anomaly_alert', label: 'Alert Anomalie', desc: 'Notifica per problemi dati (prezzi a 0, medici senza specialita)', type: 'toggle', default: true },
    ],
  },
};

let settingsData = {};
let settingsOriginal = {};
let settingsDirty = false;
let activeSettingsTab = 'generale';

async function loadSettings() {
  const area = document.getElementById('settings-form-area');

  // Setup tab listeners
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeSettingsTab = tab.dataset.tab;
      renderSettingsPanel();
    });
  });

  // Setup save buttons
  document.getElementById('settings-save-btn')?.addEventListener('click', saveSettings);
  document.getElementById('settings-dirty-save')?.addEventListener('click', saveSettings);
  document.getElementById('settings-reset-btn')?.addEventListener('click', resetSettings);

  try {
    const data = await apiRequest('/settings');
    const serverSettings = data.settings || {};

    // Merge server settings with schema defaults
    settingsData = {};
    for (const [cat, schema] of Object.entries(SETTINGS_SCHEMA)) {
      for (const field of schema.fields) {
        // Check server data
        let serverVal = undefined;
        if (serverSettings[cat]) {
          const serverField = (Array.isArray(serverSettings[cat]) ? serverSettings[cat] : []).find(s => s.key === field.key);
          if (serverField) serverVal = serverField.value;
        }
        settingsData[field.key] = serverVal !== undefined ? serverVal : field.default;
      }
    }

    settingsOriginal = JSON.parse(JSON.stringify(settingsData));
    settingsDirty = false;
    renderSettingsPanel();
  } catch (err) {
    // Use defaults on error
    settingsData = {};
    for (const [, schema] of Object.entries(SETTINGS_SCHEMA)) {
      for (const field of schema.fields) {
        settingsData[field.key] = field.default;
      }
    }
    settingsOriginal = JSON.parse(JSON.stringify(settingsData));
    renderSettingsPanel();
  }
}

function renderSettingsPanel() {
  const area = document.getElementById('settings-form-area');
  const schema = SETTINGS_SCHEMA[activeSettingsTab];
  if (!schema) { area.innerHTML = '<p class="text-muted">Sezione non trovata</p>'; return; }

  const readOnly = isDemoMode;

  let html = `<div class="settings-panel active">`;
  html += `<div class="settings-group">`;
  html += `<div class="settings-group-title">${esc(schema.label)}</div>`;

  for (const field of schema.fields) {
    const val = settingsData[field.key] ?? field.default;
    const disabled = readOnly ? 'disabled' : '';

    html += `<div class="setting-row">`;
    html += `<div class="setting-label">${esc(field.label)}<small>${esc(field.desc || '')}</small></div>`;
    html += `<div class="setting-value">`;

    if (field.type === 'toggle') {
      const checked = val ? 'checked' : '';
      html += `<label class="toggle-switch">
        <input type="checkbox" data-setting="${field.key}" ${checked} ${disabled}>
        <span class="toggle-slider"></span>
      </label>`;
    } else if (field.type === 'textarea') {
      html += `<textarea data-setting="${field.key}" rows="2" ${disabled}>${esc(String(val || ''))}</textarea>`;
    } else if (field.type === 'select') {
      html += `<select data-setting="${field.key}" ${disabled}>`;
      for (const opt of (field.options || [])) {
        html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
      }
      html += `</select>`;
    } else if (field.type === 'color') {
      html += `<div style="display:flex;gap:8px;align-items:center">
        <input type="color" data-setting="${field.key}" value="${esc(String(val || '#000000'))}" ${disabled} style="width:48px;height:36px;border:1px solid var(--gray-300);border-radius:var(--radius);padding:2px;cursor:pointer">
        <input type="text" data-setting="${field.key}-text" value="${esc(String(val || ''))}" ${disabled} style="width:120px" placeholder="#hex">
      </div>`;
    } else {
      const inputType = field.type || 'text';
      html += `<input type="${inputType}" data-setting="${field.key}" value="${esc(String(val || ''))}" ${disabled}>`;
    }

    html += `</div></div>`;
  }

  html += `</div></div>`;
  area.innerHTML = html;

  // Add change listeners
  area.querySelectorAll('[data-setting]').forEach(el => {
    el.addEventListener('input', () => markSettingsDirty(el));
    el.addEventListener('change', () => markSettingsDirty(el));
  });
}

function markSettingsDirty(el) {
  const key = el.dataset.setting;
  if (!key || key.endsWith('-text')) return;

  if (el.type === 'checkbox') {
    settingsData[key] = el.checked;
  } else if (el.type === 'number') {
    settingsData[key] = el.value ? parseFloat(el.value) : null;
  } else {
    settingsData[key] = el.value;
  }

  // Sync color picker with text input
  if (el.type === 'color') {
    const textInput = document.querySelector(`[data-setting="${key}-text"]`);
    if (textInput) textInput.value = el.value;
  }

  settingsDirty = JSON.stringify(settingsData) !== JSON.stringify(settingsOriginal);
  document.getElementById('settings-dirty-bar').style.display = settingsDirty ? '' : 'none';
}

async function saveSettings() {
  if (isDemoMode) {
    toast('Modalita Demo: salvataggio non disponibile', 'warning');
    return;
  }

  const btn = document.getElementById('settings-save-btn');
  btn.disabled = true;
  btn.textContent = 'Salvataggio...';

  try {
    await apiRequest('/settings', {
      method: 'PUT',
      body: { settings: settingsData },
    });
    settingsOriginal = JSON.parse(JSON.stringify(settingsData));
    settingsDirty = false;
    document.getElementById('settings-dirty-bar').style.display = 'none';
    toast('Impostazioni salvate', 'success');
  } catch (err) {
    toast('Errore: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salva Impostazioni';
  }
}

function resetSettings() {
  settingsData = JSON.parse(JSON.stringify(settingsOriginal));
  settingsDirty = false;
  document.getElementById('settings-dirty-bar').style.display = 'none';
  renderSettingsPanel();
  toast('Impostazioni ripristinate', 'info');
}

// ============================================================================
// ADMIN USERS (M13)
// ============================================================================

const DEMO_USERS = [
  { id: '1', email: 'admin@bio-clinic.it', name: 'Amministratore', role: 'super_admin', status: 'active', last_login: '2026-02-28T14:30:00Z', created_at: '2026-01-01T00:00:00Z' },
  { id: '2', email: 'segreteria@bio-clinic.it', name: 'Segreteria', role: 'admin', status: 'active', last_login: '2026-02-28T11:00:00Z', created_at: '2026-01-15T00:00:00Z' },
  { id: '3', email: 'laboratorio@bio-clinic.it', name: 'Laboratorio', role: 'editor', status: 'active', last_login: '2026-02-27T16:45:00Z', created_at: '2026-02-01T00:00:00Z' },
  { id: '4', email: 'marketing@bio-clinic.it', name: 'Marketing', role: 'editor', status: 'active', last_login: '2026-02-25T09:20:00Z', created_at: '2026-02-10T00:00:00Z' },
  { id: '5', email: 'viewer@bio-clinic.it', name: 'Consulente Esterno', role: 'viewer', status: 'inactive', last_login: '2026-01-30T14:00:00Z', created_at: '2026-01-20T00:00:00Z' },
];

const ROLE_LABELS = {
  super_admin: { label: 'Super Admin', color: 'var(--danger)' },
  admin: { label: 'Admin', color: 'var(--primary)' },
  editor: { label: 'Editor', color: 'var(--info)' },
  viewer: { label: 'Viewer', color: 'var(--gray-600)' },
};

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');

  // Search and filter listeners
  document.getElementById('users-search')?.addEventListener('input', debounce(() => renderUsers(), 300));
  document.getElementById('users-role-filter')?.addEventListener('change', () => renderUsers());
  document.getElementById('users-invite-btn')?.addEventListener('click', openInviteModal);

  let users;
  if (isDemoMode) {
    users = DEMO_USERS;
  } else {
    try {
      const data = await apiRequest('/users');
      users = data.data || [];
    } catch {
      users = [];
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center">Gestione utenti non disponibile (DB non connesso)</td></tr>';
      return;
    }
  }

  window._adminUsers = users;
  renderUsers();
}

function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  let users = window._adminUsers || [];

  const search = (document.getElementById('users-search')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('users-role-filter')?.value || '';

  if (search) {
    users = users.filter(u => u.email.toLowerCase().includes(search) || (u.name || '').toLowerCase().includes(search));
  }
  if (roleFilter) {
    users = users.filter(u => u.role === roleFilter);
  }

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:32px">Nessun utente trovato</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => {
    const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: 'var(--gray-600)' };
    const statusBadge = u.status === 'active'
      ? '<span class="status-badge status-active">Attivo</span>'
      : '<span class="status-badge status-inactive">Inattivo</span>';
    const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString('it-IT') : 'Mai';

    return `<tr>
      <td><strong>${esc(u.email)}</strong></td>
      <td>${esc(u.name || '\u2014')}</td>
      <td><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${roleInfo.color};color:#fff">${roleInfo.label}</span></td>
      <td>${statusBadge}</td>
      <td style="font-size:12px">${lastLogin}</td>
      <td class="actions-cell">
        <button class="btn btn-sm btn-outline" onclick="editUser('${esc(u.id)}')" title="Modifica">\u270F\uFE0F</button>
        ${u.role !== 'super_admin' ? `<button class="btn btn-sm btn-outline" onclick="toggleUser('${esc(u.id)}')" title="${u.status === 'active' ? 'Disattiva' : 'Attiva'}">${u.status === 'active' ? '\u26D4' : '\u2705'}</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

window.editUser = function(id) {
  const user = (window._adminUsers || []).find(u => u.id === id);
  if (!user) return;

  const title = isDemoMode ? 'Dettaglio Utente' : 'Modifica Utente';
  const readOnly = isDemoMode;

  const fields = [
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'name', label: 'Nome', type: 'text' },
    { key: 'role', label: 'Ruolo', type: 'select', options: ['super_admin', 'admin', 'editor', 'viewer'] },
    { key: 'status', label: 'Stato', type: 'select', options: ['active', 'inactive'] },
  ];

  openModal(title, fields, user);
};

window.toggleUser = async function(id) {
  if (isDemoMode) {
    toast('Modalita Demo: modifica non disponibile', 'warning');
    return;
  }
  const user = (window._adminUsers || []).find(u => u.id === id);
  if (!user) return;

  const newStatus = user.status === 'active' ? 'inactive' : 'active';
  if (!confirm(`${newStatus === 'inactive' ? 'Disattivare' : 'Riattivare'} l\'utente ${user.email}?`)) return;

  try {
    await apiRequest('/users', { method: 'PATCH', body: { id, status: newStatus } });
    user.status = newStatus;
    renderUsers();
    toast(`Utente ${newStatus === 'active' ? 'attivato' : 'disattivato'}`, 'success');
  } catch (err) {
    toast('Errore: ' + err.message, 'error');
  }
};

function openInviteModal() {
  if (isDemoMode) {
    toast('Modalita Demo: inviti non disponibili', 'warning');
    return;
  }

  const fields = [
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'name', label: 'Nome', type: 'text' },
    { key: 'role', label: 'Ruolo', type: 'select', options: ['admin', 'editor', 'viewer'] },
  ];

  openModal('Invita Nuovo Utente', fields, {});
}

async function loadAuditLog() {
  const tbody = document.getElementById('audit-tbody');
  try {
    const data = await apiRequest('/audit?limit=50');
    tbody.innerHTML = (data.data || []).map(a =>
      `<tr>
        <td>${new Date(a.created_at).toLocaleString('it-IT')}</td>
        <td>${esc(a.user_email)}</td>
        <td>${esc(a.action)}</td>
        <td>${esc(a.entity_type)}</td>
        <td>${esc(a.entity_id || '—')}</td>
      </tr>`
    ).join('') || '<tr><td colspan="5" class="text-muted">Nessun log</td></tr>';
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Audit log non disponibile</td></tr>';
  }
}

// ============================================================================
// PHOTO & TAGS MANAGEMENT
// ============================================================================

/**
 * Handle photo file upload — converts to base64 data URL or uploads to external service.
 * For now, uses URL input. Future: integrate with Supabase Storage / Cloudflare R2.
 */
window.handlePhotoUpload = function(input, fieldKey) {
  const file = input.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    toast('Seleziona un file immagine valido (JPG, PNG, WebP)', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Immagine troppo grande. Massimo 5MB.', 'error');
    return;
  }

  // Read as data URL for preview; set the URL field
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;

    // Update preview
    const thumb = document.querySelector(`#photo-manager-${fieldKey} .photo-thumb`);
    if (thumb) {
      thumb.innerHTML = `<img src="${dataUrl}" alt="Foto" style="width:100%;height:100%;object-fit:cover" id="photo-img-${fieldKey}">`;
    }

    // For now, set as data URL; in production, upload to storage and get permanent URL
    const urlField = document.querySelector(`[name="${fieldKey}"]`);
    if (urlField) {
      // Generate a clean URL path based on the physician ID
      const physicianId = document.querySelector('[name="id"]')?.value || 'unknown';
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const suggestedPath = `/images/equipe/${physicianId}.${ext}`;

      // Prompt user for the URL or use suggested path
      const url = prompt(
        `Inserisci l'URL della foto caricata:\n\n` +
        `Percorso suggerito: ${suggestedPath}\n\n` +
        `Opzioni:\n` +
        `1. Carica l'immagine nel CMS/CDN e incolla l'URL\n` +
        `2. Usa il percorso locale suggerito (assicurati che il file sia in /site${suggestedPath})`,
        suggestedPath
      );

      if (url) {
        urlField.value = url;
        toast('URL foto impostato: ' + url, 'success');
      }
    }
  };
  reader.readAsDataURL(file);
};

/**
 * Remove photo URL and clear preview
 */
window.removePhoto = function(fieldKey) {
  if (!confirm('Rimuovere la foto profilo?')) return;

  const urlField = document.querySelector(`[name="${fieldKey}"]`);
  if (urlField) urlField.value = '';

  const thumb = document.querySelector(`#photo-manager-${fieldKey} .photo-thumb`);
  if (thumb) {
    thumb.innerHTML = `<span style="font-size:32px;color:var(--gray-400)" id="photo-placeholder-${fieldKey}">&#128100;</span>`;
  }

  toast('Foto rimossa', 'success');
};

/**
 * Add a tag to a tags field
 */
window.addTag = function(fieldKey) {
  const input = document.getElementById(`field-${fieldKey}`);
  if (!input) return;

  const value = input.value.trim();
  if (!value) return;

  const hiddenInput = document.getElementById(`tags-hidden-${fieldKey}`);
  const container = document.getElementById(`tags-${fieldKey}`);
  if (!hiddenInput || !container) return;

  let tags;
  try { tags = JSON.parse(hiddenInput.value || '[]'); } catch { tags = []; }

  // Avoid duplicates
  if (tags.includes(value)) {
    toast('Tag gia presente', 'warning');
    return;
  }

  tags.push(value);
  hiddenInput.value = JSON.stringify(tags);

  // Add visual tag
  const span = document.createElement('span');
  span.className = 'tag-item';
  span.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:var(--primary-light);color:var(--primary-dark);border-radius:12px;font-size:12px;font-weight:500';
  span.innerHTML = `${esc(value)}<button type="button" class="tag-remove" onclick="removeTag(this,'${fieldKey}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--danger);padding:0 2px;line-height:1">&times;</button>`;
  container.appendChild(span);

  input.value = '';
  input.focus();
};

/**
 * Remove a tag from a tags field
 */
window.removeTag = function(btn, fieldKey) {
  const tagSpan = btn.closest('.tag-item');
  if (!tagSpan) return;

  const tagText = tagSpan.textContent.replace('×', '').trim();
  const hiddenInput = document.getElementById(`tags-hidden-${fieldKey}`);
  if (hiddenInput) {
    let tags;
    try { tags = JSON.parse(hiddenInput.value || '[]'); } catch { tags = []; }
    tags = tags.filter(t => t !== tagText);
    hiddenInput.value = JSON.stringify(tags);
  }

  tagSpan.remove();
};

// ============================================================================
// UTILITIES
// ============================================================================

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
