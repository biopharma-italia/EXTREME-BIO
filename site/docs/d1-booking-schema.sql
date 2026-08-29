-- ============================================================================
-- BIO-CLINIC LABORATORY BOOKING SYSTEM — D1 Database Schema
-- ============================================================================
--
-- Database: bio-clinic-booking (Cloudflare D1)
-- Version: 2.0.0
-- Date: 2026-02-17
--
-- Tables:
--   services          — Bookable laboratory services/exams
--   schedule_rules    — Weekly opening hours per department
--   schedule_overrides — Date-specific closures / modified hours
--   bookings          — Confirmed bookings
--   blocked_slots     — Manually blocked time slots
--
-- Future extensibility:
--   physicians        — Physician agendas (Phase 2)
--   departments       — Multi-department support
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ SERVICES — Bookable laboratory services                            │
-- └─────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS services (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  department        TEXT NOT NULL DEFAULT 'laboratorio',
  category          TEXT NOT NULL DEFAULT 'prelievo',
  duration_minutes  INTEGER NOT NULL DEFAULT 15,
  price_eur         REAL NOT NULL DEFAULT 0.0,
  requires_fasting  INTEGER NOT NULL DEFAULT 0,  -- 0=false, 1=true
  prep_instructions TEXT DEFAULT '',
  max_per_slot      INTEGER NOT NULL DEFAULT 3,
  sort_order        INTEGER NOT NULL DEFAULT 99,
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_department ON services(department, active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ SCHEDULE_RULES — Weekly opening hours                              │
-- └─────────────────────────────────────────────────────────────────────┘
-- day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday (JS Date.getUTCDay())
CREATE TABLE IF NOT EXISTS schedule_rules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  department    TEXT NOT NULL DEFAULT 'laboratorio',
  day_of_week   INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time    TEXT NOT NULL,  -- 'HH:MM' format
  end_time      TEXT NOT NULL,  -- 'HH:MM' format
  slot_interval INTEGER NOT NULL DEFAULT 15,  -- minutes
  is_active     INTEGER NOT NULL DEFAULT 1,
  valid_from    TEXT,  -- date range for seasonal schedules
  valid_until   TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  UNIQUE(department, day_of_week, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_schedule_department ON schedule_rules(department, is_active);

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ SCHEDULE_OVERRIDES — Date-specific closures / modified hours       │
-- └─────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  department      TEXT NOT NULL DEFAULT 'laboratorio',
  override_date   TEXT NOT NULL,  -- 'YYYY-MM-DD'
  is_closed       INTEGER NOT NULL DEFAULT 0,
  start_time      TEXT,  -- modified opening (NULL = use default)
  end_time        TEXT,  -- modified closing (NULL = use default)
  reason          TEXT DEFAULT '',
  created_at      TEXT DEFAULT (datetime('now')),
  UNIQUE(department, override_date)
);

CREATE INDEX IF NOT EXISTS idx_overrides_date ON schedule_overrides(department, override_date);

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ BOOKINGS — Confirmed laboratory bookings                           │
-- └─────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS bookings (
  id                    TEXT PRIMARY KEY,
  transaction_id        TEXT NOT NULL UNIQUE,
  service_id            TEXT NOT NULL,
  department            TEXT NOT NULL DEFAULT 'laboratorio',
  booking_date          TEXT NOT NULL,  -- 'YYYY-MM-DD'
  booking_time          TEXT NOT NULL,  -- 'HH:MM'
  duration_minutes      INTEGER NOT NULL DEFAULT 15,
  patient_name          TEXT NOT NULL,
  patient_phone         TEXT NOT NULL,
  patient_email         TEXT DEFAULT '',
  patient_fiscal_code   TEXT DEFAULT '',  -- Codice Fiscale (Italian tax ID)
  price_eur             REAL NOT NULL DEFAULT 0.0,
  currency              TEXT NOT NULL DEFAULT 'EUR',
  gclid                 TEXT DEFAULT '',  -- Google Click ID for attribution
  lead_source           TEXT DEFAULT 'website',
  source_page           TEXT DEFAULT '',
  utm_source            TEXT DEFAULT '',
  utm_medium            TEXT DEFAULT '',
  utm_campaign          TEXT DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK(status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes                 TEXT DEFAULT '',
  ip_country            TEXT DEFAULT '',
  ip_city               TEXT DEFAULT '',
  user_agent            TEXT DEFAULT '',
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now')),
  -- Phase 2: physician support
  physician_id          TEXT DEFAULT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id, booking_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_transaction ON bookings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gclid ON bookings(gclid) WHERE gclid != '';

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ BLOCKED_SLOTS — Manually blocked time slots                        │
-- └─────────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS blocked_slots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  department    TEXT NOT NULL DEFAULT 'laboratorio',
  blocked_date  TEXT NOT NULL,  -- 'YYYY-MM-DD'
  blocked_time  TEXT NOT NULL,  -- 'HH:MM'
  reason        TEXT DEFAULT '',
  created_at    TEXT DEFAULT (datetime('now')),
  UNIQUE(department, blocked_date, blocked_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_date ON blocked_slots(department, blocked_date);

-- ============================================================================
-- SEED DATA — Default schedule and initial services
-- ============================================================================

-- Default lab schedule: Mon-Fri 07:00-21:00, Sat 08:00-14:00
INSERT OR IGNORE INTO schedule_rules (department, day_of_week, start_time, end_time, slot_interval)
VALUES
  ('laboratorio', 1, '07:00', '21:00', 15),  -- Monday
  ('laboratorio', 2, '07:00', '21:00', 15),  -- Tuesday
  ('laboratorio', 3, '07:00', '21:00', 15),  -- Wednesday
  ('laboratorio', 4, '07:00', '21:00', 15),  -- Thursday
  ('laboratorio', 5, '07:00', '21:00', 15),  -- Friday
  ('laboratorio', 6, '08:00', '14:00', 15);  -- Saturday

-- Align pre-existing rows (INSERT OR IGNORE does not touch them): 2026-08-28
UPDATE schedule_rules SET end_time = '21:00'
  WHERE department = 'laboratorio' AND day_of_week IN (1,2,3,4,5) AND end_time = '20:00';
UPDATE schedule_rules SET end_time = '14:00'
  WHERE department = 'laboratorio' AND day_of_week = 6 AND end_time = '13:00';

-- Initial services
INSERT OR IGNORE INTO services (id, name, slug, department, category, duration_minutes, price_eur, requires_fasting, prep_instructions, max_per_slot, sort_order, active)
VALUES
  ('prelievo-standard', 'Prelievo Ematico Standard', 'prelievo-standard', 'laboratorio', 'prelievo', 15, 5.00, 1, 'Presentarsi a digiuno da almeno 8 ore. Bere solo acqua.', 3, 1, 1),
  ('prelievo-urgente', 'Prelievo Ematico Urgente', 'prelievo-urgente', 'laboratorio', 'prelievo', 15, 15.00, 1, 'Presentarsi a digiuno da almeno 8 ore. Bere solo acqua. Referto in giornata.', 3, 2, 1),
  ('urine-standard', 'Esame Urine Completo', 'urine-standard', 'laboratorio', 'urine', 10, 8.00, 0, 'Portare campione di urina del mattino (mitto intermedio) in contenitore sterile.', 3, 3, 1),
  ('emocromo-completo', 'Emocromo Completo con Formula', 'emocromo-completo', 'laboratorio', 'prelievo', 15, 8.00, 0, 'Non richiede digiuno. Comunicare eventuali terapie in corso.', 3, 4, 1),
  ('tampone-vaginale', 'Tampone Vaginale / Cervicale', 'tampone-vaginale', 'laboratorio', 'microbiologia', 20, 25.00, 0, 'Non effettuare lavande vaginali nelle 24h precedenti. Non usare ovuli o creme vaginali per 5 giorni prima.', 3, 10, 1),
  ('tampone-faringeo', 'Tampone Faringeo', 'tampone-faringeo', 'laboratorio', 'microbiologia', 10, 20.00, 1, 'Presentarsi a digiuno. Non usare collutorio. Non assumere antibiotici nelle 48h precedenti.', 3, 11, 1),
  ('test-hpv', 'HPV DNA Test', 'test-hpv', 'laboratorio', 'microbiologia', 20, 55.00, 0, 'Non durante mestruazioni. Astenersi da rapporti sessuali 48h prima.', 3, 12, 1),
  ('profilo-tiroide', 'Profilo Tiroideo Completo (TSH, FT3, FT4)', 'profilo-tiroide', 'laboratorio', 'profilo', 15, 35.00, 0, 'Non richiede digiuno. Comunicare eventuali farmaci tiroidei assunti.', 3, 20, 1),
  ('profilo-ormonale-donna', 'Profilo Ormonale Donna', 'profilo-ormonale-donna', 'laboratorio', 'profilo', 15, 65.00, 1, 'Digiuno da 8 ore. Eseguire al 3-5 giorno del ciclo, salvo diversa indicazione medica.', 3, 21, 1),
  ('marcatori-tumorali', 'Pannello Marcatori Tumorali', 'marcatori-tumorali', 'laboratorio', 'profilo', 15, 80.00, 1, 'Digiuno da 8 ore. Include: PSA, CEA, CA 19-9, CA 125, AFP.', 3, 22, 1),
  ('glicemia-curva', 'Curva Glicemica da Carico (OGTT)', 'glicemia-curva', 'laboratorio', 'profilo', 120, 25.00, 1, 'Digiuno da 10-12 ore. Il test richiede circa 2 ore con prelievi multipli. Non fumare durante il test.', 3, 23, 1),
  ('test-allergologico', 'Pannello Allergologico (IgE Specifiche)', 'test-allergologico', 'laboratorio', 'allergologia', 15, 45.00, 0, 'Non richiede digiuno. Comunicare antistaminici assunti (non sospendere senza indicazione medica).', 3, 30, 1);

-- ============================================================================
-- PHASE 2 PLACEHOLDER — Physicians table (future extensibility)
-- ============================================================================
-- Uncomment when physician agendas are needed:
--
-- CREATE TABLE IF NOT EXISTS physicians (
--   id              TEXT PRIMARY KEY,
--   name            TEXT NOT NULL,
--   slug            TEXT NOT NULL UNIQUE,
--   specialty       TEXT NOT NULL,
--   department      TEXT NOT NULL,
--   title           TEXT DEFAULT '',
--   bio             TEXT DEFAULT '',
--   photo_url       TEXT DEFAULT '',
--   active          INTEGER NOT NULL DEFAULT 1,
--   created_at      TEXT DEFAULT (datetime('now'))
-- );
--
-- CREATE TABLE IF NOT EXISTS physician_services (
--   physician_id    TEXT NOT NULL,
--   service_id      TEXT NOT NULL,
--   price_override  REAL,
--   PRIMARY KEY (physician_id, service_id),
--   FOREIGN KEY (physician_id) REFERENCES physicians(id),
--   FOREIGN KEY (service_id) REFERENCES services(id)
-- );
--
-- CREATE TABLE IF NOT EXISTS physician_schedule (
--   id              INTEGER PRIMARY KEY AUTOINCREMENT,
--   physician_id    TEXT NOT NULL,
--   day_of_week     INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
--   start_time      TEXT NOT NULL,
--   end_time        TEXT NOT NULL,
--   slot_interval   INTEGER NOT NULL DEFAULT 30,
--   is_active       INTEGER NOT NULL DEFAULT 1,
--   valid_from      TEXT,
--   valid_until     TEXT,
--   FOREIGN KEY (physician_id) REFERENCES physicians(id),
--   UNIQUE(physician_id, day_of_week, valid_from)
-- );
