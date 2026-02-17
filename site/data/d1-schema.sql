-- ============================================================================
-- BIO-CLINIC LABORATORY BOOKING SYSTEM — D1 Schema
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-02-17
-- Database: bio_clinic_booking (Cloudflare D1)
--
-- Design principles:
--   1. Slot-based availability (not calendar events)
--   2. Service-agnostic: same schema supports lab + future physician agendas
--   3. Capacity-based: each slot has max_bookings (concurrent appointments)
--   4. Idempotent booking via unique transaction_id
--   5. Soft-delete for audit trail
-- ============================================================================

-- 1. SERVICES — Bookable services (lab tests, consultations, etc.)
CREATE TABLE IF NOT EXISTS services (
  id              TEXT PRIMARY KEY,              -- e.g. 'prelievo-standard'
  name            TEXT NOT NULL,                 -- display name
  slug            TEXT NOT NULL UNIQUE,          -- URL-safe slug
  category        TEXT NOT NULL DEFAULT 'lab',   -- 'lab', 'physician', 'imaging'
  department      TEXT NOT NULL DEFAULT 'laboratorio', -- future: 'cardiologia', etc.
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  price_eur       REAL NOT NULL DEFAULT 0.00,
  requires_fasting INTEGER NOT NULL DEFAULT 0,  -- boolean: 1=yes
  prep_instructions TEXT DEFAULT '',
  max_per_slot    INTEGER NOT NULL DEFAULT 3,    -- concurrent bookings per slot
  active          INTEGER NOT NULL DEFAULT 1,    -- soft toggle
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. SCHEDULE_RULES — Weekly recurring availability patterns
-- Defines when slots are generated (e.g., Mon-Fri 07:00-20:00)
CREATE TABLE IF NOT EXISTS schedule_rules (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  department      TEXT NOT NULL DEFAULT 'laboratorio',
  day_of_week     INTEGER NOT NULL,             -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time      TEXT NOT NULL,                -- HH:MM format, e.g. '07:00'
  end_time        TEXT NOT NULL,                -- HH:MM format, e.g. '20:00'
  slot_interval   INTEGER NOT NULL DEFAULT 15,  -- minutes between slot starts
  is_active       INTEGER NOT NULL DEFAULT 1,
  valid_from      TEXT DEFAULT NULL,            -- NULL = always valid
  valid_until     TEXT DEFAULT NULL,            -- NULL = no expiry
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. SCHEDULE_OVERRIDES — Date-specific overrides (closures, holidays, extended hours)
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  department      TEXT NOT NULL DEFAULT 'laboratorio',
  override_date   TEXT NOT NULL,                -- YYYY-MM-DD
  is_closed       INTEGER NOT NULL DEFAULT 0,   -- 1 = fully closed
  start_time      TEXT DEFAULT NULL,            -- override open time
  end_time        TEXT DEFAULT NULL,            -- override close time
  reason          TEXT DEFAULT '',               -- 'Festività', 'Manutenzione', etc.
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. BOOKINGS — Confirmed appointments
CREATE TABLE IF NOT EXISTS bookings (
  id              TEXT PRIMARY KEY,              -- bc_book_<timestamp>_<random>
  transaction_id  TEXT NOT NULL UNIQUE,          -- for GA4 purchase dedup
  service_id      TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT 'laboratorio',
  
  -- Slot details
  booking_date    TEXT NOT NULL,                 -- YYYY-MM-DD
  booking_time    TEXT NOT NULL,                 -- HH:MM
  duration_minutes INTEGER NOT NULL,
  
  -- Patient info (PII — encrypted at rest by D1)
  patient_name    TEXT NOT NULL,
  patient_phone   TEXT NOT NULL,
  patient_email   TEXT DEFAULT '',
  patient_fiscal_code TEXT DEFAULT '',           -- codice fiscale
  
  -- Pricing
  price_eur       REAL NOT NULL DEFAULT 0.00,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  
  -- Attribution
  gclid           TEXT DEFAULT '',
  lead_source     TEXT DEFAULT 'website',        -- 'website', 'phone', 'whatsapp'
  source_page     TEXT DEFAULT '',
  utm_source      TEXT DEFAULT '',
  utm_medium      TEXT DEFAULT '',
  utm_campaign    TEXT DEFAULT '',
  
  -- Status
  status          TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed', 'no_show'
  notes           TEXT DEFAULT '',
  
  -- Metadata
  ip_country      TEXT DEFAULT '',
  ip_city         TEXT DEFAULT '',
  user_agent      TEXT DEFAULT '',
  
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  cancelled_at    TEXT DEFAULT NULL,
  
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- 5. BLOCKED_SLOTS — Explicitly blocked slot+date combinations
CREATE TABLE IF NOT EXISTS blocked_slots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  department      TEXT NOT NULL DEFAULT 'laboratorio',
  blocked_date    TEXT NOT NULL,                 -- YYYY-MM-DD
  blocked_time    TEXT NOT NULL,                 -- HH:MM
  reason          TEXT DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- INDEXES for query performance
-- ============================================================================

-- Fast slot availability lookup
CREATE INDEX IF NOT EXISTS idx_bookings_date_time 
  ON bookings(booking_date, booking_time, service_id, status);

-- Fast daily booking count
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
  ON bookings(booking_date, status);

-- Transaction ID dedup (UNIQUE already creates index)
-- CREATE INDEX IF NOT EXISTS idx_bookings_transaction ON bookings(transaction_id);

-- Schedule rule lookup by day
CREATE INDEX IF NOT EXISTS idx_schedule_day 
  ON schedule_rules(department, day_of_week, is_active);

-- Override lookup by date
CREATE INDEX IF NOT EXISTS idx_overrides_date 
  ON schedule_overrides(department, override_date);

-- Blocked slot lookup
CREATE INDEX IF NOT EXISTS idx_blocked_date 
  ON blocked_slots(department, blocked_date);

-- Service active lookup
CREATE INDEX IF NOT EXISTS idx_services_active 
  ON services(department, active);

-- ============================================================================
-- SEED DATA: Laboratory schedule (Mon-Fri 07:00-20:00, Sat 08:00-13:00)
-- ============================================================================

INSERT OR IGNORE INTO schedule_rules (department, day_of_week, start_time, end_time, slot_interval)
VALUES
  ('laboratorio', 1, '07:00', '20:00', 15),  -- Monday
  ('laboratorio', 2, '07:00', '20:00', 15),  -- Tuesday
  ('laboratorio', 3, '07:00', '20:00', 15),  -- Wednesday
  ('laboratorio', 4, '07:00', '20:00', 15),  -- Thursday
  ('laboratorio', 5, '07:00', '20:00', 15),  -- Friday
  ('laboratorio', 6, '08:00', '13:00', 15);  -- Saturday
