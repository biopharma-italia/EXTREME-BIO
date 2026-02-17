# Bio-Clinic Laboratory Booking System — Architecture Document

**Version:** 1.0.0  
**Date:** 2026-02-17  
**Author:** Bio-Clinic Digital Architecture  
**Status:** PRODUCTION-READY (Phase 1 — Laboratory)

---

## 1. Architecture Diagram

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                    CLOUDFLARE EDGE                       │
                    │                                                          │
  ┌──────────┐     │   ┌─────────────┐     ┌──────────────────┐              │
  │  Browser  │────▶│   │  CF Pages   │     │  Pages Functions  │              │
  │           │     │   │  (Static)   │     │  (Workers)        │              │
  │ ┌───────┐ │     │   │             │     │                   │              │
  │ │Booking│ │     │   │ /prenota/   │     │ /api/booking/     │              │
  │ │  UI   │─┼─────┼──▶│ index.html  │     │  ├── services.js  │              │
  │ └───┬───┘ │     │   │             │     │  ├── slots.js     │              │
  │     │     │     │   └─────────────┘     │  └── confirm.js   │              │
  │ ┌───▼───┐ │     │                       │         │         │              │
  │ │  CGE  │ │     │                       └────┬────┘         │              │
  │ │v3.0   │ │     │                            │              │              │
  │ └───┬───┘ │     │                     ┌──────▼──────┐       │              │
  │     │     │     │                     │  Cloudflare  │       │              │
  │ ┌───▼───┐ │     │                     │     D1       │       │              │
  │ │  GTM  │ │     │                     │  (SQLite)    │       │              │
  │ │Trigger│ │     │                     │              │       │              │
  │ │ #212  │ │     │                     │ ┌──────────┐ │       │              │
  │ └───┬───┘ │     │                     │ │ services │ │   ┌───┴────┐        │
  │     │     │     │                     │ │ bookings │ │   │   KV   │        │
  │ ┌───▼───┐ │     │                     │ │ schedule │ │   │(cache/ │        │
  │ │  GA4  │ │     │                     │ │ overrides│ │   │ rate   │        │
  │ │purchase│ │     │                     │ └──────────┘ │   │ limit) │        │
  │ └───────┘ │     │                     └──────────────┘   └────────┘        │
  └──────────┘     │                                                          │
                    └──────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────────┐
                    │            DOWNSTREAM SYSTEMS               │
                    │                                              │
                    │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
                    │  │  Resend  │  │ Google   │  │  CRM      │ │
                    │  │  (Email) │  │ Ads GCLID│  │  (future) │ │
                    │  │          │  │  Upload  │  │           │ │
                    │  └──────────┘  └──────────┘  └───────────┘ │
                    └──────────────────────────────────────────────┘
```

---

## 2. Database Schema (Cloudflare D1)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `services` | Bookable lab tests/profiles | id, name, price_eur, duration_minutes, max_per_slot |
| `schedule_rules` | Weekly recurring hours | day_of_week, start_time, end_time, slot_interval |
| `schedule_overrides` | Date-specific closures/changes | override_date, is_closed, start_time, end_time |
| `bookings` | Confirmed appointments | transaction_id (UNIQUE), service_id, booking_date, booking_time, patient_*, gclid |
| `blocked_slots` | Manually blocked times | blocked_date, blocked_time, reason |

### Entity-Relationship

```
services ──────────── 1:N ──────────── bookings
    │                                      │
    │                                      │
schedule_rules ──── generates ──── available slots
    │                                      │
schedule_overrides ── modifies ──── slot grid
    │                                      │
blocked_slots ────── removes ────── specific slots
```

### Key Design Decisions

- **D1 over KV**: Relational queries needed (slot availability = COUNT bookings WHERE date+time). KV only used for rate limiting and caching.
- **max_per_slot**: Enables concurrent bookings per time window (e.g., 3 patients at 08:00 for blood draws).
- **transaction_id UNIQUE**: Prevents GA4 purchase double-counting at the database level.
- **department column**: Future-proofs for physician agenda expansion without schema changes.
- **Soft status**: `confirmed` -> `completed` / `cancelled` / `no_show` lifecycle.

---

## 3. API Endpoints

### `GET /api/booking/services`

Returns active bookable services for the laboratory.

```json
{
  "success": true,
  "department": "laboratorio",
  "services": [
    {
      "id": "prelievo-standard",
      "name": "Prelievo Ematico Standard",
      "slug": "prelievo-standard",
      "category": "prelievo",
      "duration_minutes": 15,
      "price_eur": 5.00,
      "requires_fasting": true,
      "prep_instructions": "Presentarsi a digiuno da almeno 8 ore.",
      "max_per_slot": 3
    }
  ],
  "count": 10
}
```

### `GET /api/booking/slots?date=YYYY-MM-DD&service_id=xxx`

Returns available time slots with real-time capacity.

```json
{
  "success": true,
  "date": "2026-02-20",
  "service_id": "prelievo-standard",
  "service_name": "Prelievo Ematico Standard",
  "schedule": { "open": "07:00", "close": "20:00" },
  "slots": [
    { "time": "07:00", "available": 3, "total": 3, "status": "available" },
    { "time": "07:15", "available": 0, "total": 3, "status": "full" }
  ],
  "available_count": 51,
  "total_count": 52
}
```

### `POST /api/booking/confirm`

Creates a booking and returns structured data for GTM/GA4.

**Request:**
```json
{
  "service_id": "prelievo-standard",
  "date": "2026-02-20",
  "time": "08:00",
  "patient_name": "Mario Rossi",
  "patient_phone": "+39 079 270480",
  "patient_email": "mario@example.com",
  "gclid": "CjwKCAiA...",
  "lead_source": "website",
  "source_page": "/laboratorio/prenota/"
}
```

**Response (201):**
```json
{
  "success": true,
  "booking": {
    "id": "bc_book_m1abc_x2y3z4",
    "transaction_id": "bc_txn_m1abc_x2y3z4",
    "service_name": "Prelievo Ematico Standard",
    "date": "2026-02-20",
    "time": "08:00",
    "price": 5.00,
    "currency": "EUR",
    "status": "confirmed",
    "prep_instructions": "Presentarsi a digiuno da almeno 8 ore."
  },
  "tracking": {
    "event": "bc_booking_confirmed",
    "transaction_id": "bc_txn_m1abc_x2y3z4",
    "bc_lead_id": "bc_book_m1abc_x2y3z4",
    "bc_service_name": "Prelievo Ematico Standard",
    "bc_specialty": "laboratorio",
    "bc_revenue": 5.00,
    "bc_gclid": "CjwKCAiA...",
    "currency": "EUR",
    "value": 5.00
  }
}
```

---

## 4. Booking Flow Logic

```
Step 1: SELECT SERVICE
  │   User picks from service grid
  │   Track: bc_prenota_click (intent)
  │
Step 2: SELECT DATE + TIME
  │   Calendar renders Mon-Sat (no Sun)
  │   On date click: GET /api/booking/slots
  │   Slots show real-time capacity
  │
Step 3: PATIENT DATA
  │   Name + Phone (required)
  │   Email + Codice Fiscale (optional)
  │   Privacy consent (required)
  │   GCLID auto-injected from CGE cookie
  │   Track: bc_form_submit (intent, NOT conversion)
  │
Step 4: CONFIRMATION
      POST /api/booking/confirm
      │
      ├── Server validates + stores in D1
      ├── Returns transaction_id + booking details
      │
      └── Frontend fires:
            BCG.fireBookingConfirmed({
              transaction_id: booking.transaction_id,
              lead_id: booking.id,
              revenue: booking.price,
              specialty: 'laboratorio',
              service_name: booking.service_name
            });
            │
            └── CGE pushes to dataLayer:
                  {
                    event: 'bc_booking_confirmed',
                    bc_transaction_id: '...',   // GTM trigger 212
                    bc_revenue: 5.00,
                    bc_gclid: 'CjwKCAiA...'
                  }
                  │
                  └── GTM fires:
                      ├── tag_GA4_bc_booking_confirmed (internal BI)
                      └── tag_GA4_purchase (GA4 conversion)
                            currency: EUR
                            value: {{dlv_bc_revenue}}
                            transaction_id: {{dlv_bc_transaction_id}} // dedup
```

---

## 5. GTM Integration Strategy

### Conversion Flow (no changes needed to GTM container)

The booking system is fully compatible with CGE v3.0 + GTM container `CGE_v3.0.1_production`:

| Step | Event | Type | GTM Tag | GA4 Conversion? |
|------|-------|------|---------|-----------------|
| Service selected | `bc_prenota_click` | Micro | tag_GA4_bc_prenota_click | No |
| Form submitted | `bc_form_submit` | Micro | tag_GA4_bc_form_submit | No |
| Booking confirmed | `bc_booking_confirmed` | Revenue | tag_GA4_bc_booking_confirmed + tag_GA4_purchase | **YES** |

### dataLayer Contract

On successful booking, the frontend calls `BCG.fireBookingConfirmed()` which pushes:

```javascript
// Pushed by CGE v3.0 (cge-tracking.js)
window.dataLayer.push({
  event: 'bc_booking_confirmed',       // triggers GTM trigger 212
  bc_lead_id: 'bc_book_m1abc_x2y3z4',
  bc_specialty: 'laboratorio',
  bc_service_name: 'Prelievo Ematico Standard',
  bc_physician_name: 'none',
  bc_revenue: 5.00,                     // dynamic from API
  bc_transaction_id: 'bc_txn_m1abc_x2y3z4', // unique, dedup
  bc_gclid: 'CjwKCAiA...'              // from first-party cookie
});
```

GTM trigger 212 fires both:
- `tag_GA4_bc_booking_confirmed` (internal event with all bc_* params)
- `tag_GA4_purchase` (GA4 standard event: `{currency: 'EUR', value: 5.00, transaction_id: 'bc_txn_...'}`)

### GCLID Closed-Loop

```
Google Ads click → URL ?gclid=CjwKCAiA...
  → CGE captures → _bc_gclid cookie (90 days, Secure, SameSite=Lax)
  → Booking form: hidden field #hidden_gclid auto-populated
  → POST /api/booking/confirm: gclid field in payload
  → D1 bookings table: gclid column stored
  → GA4 purchase event: bc_gclid parameter
  → Offline upload: booking_id + gclid → Google Ads Conversion API
```

---

## 6. Security Architecture

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| Rate Limiting | 5 bookings/IP/hour | KV counter with TTL (confirm.js) |
| Input Validation | Server-side sanitize + regex | All fields validated, max lengths enforced |
| SQL Injection | D1 prepared statements | All queries use `.bind()` parameterization |
| XSS | HTML entity escaping | `sanitize()` strips `<>`, CSP headers |
| Double-booking | Slot capacity check | COUNT query before INSERT (atomic in D1) |
| Purchase Dedup | UNIQUE transaction_id | D1 UNIQUE constraint + CGE client-side dedup |
| CORS | Origin whitelist | `Access-Control-Allow-Origin: https://bio-clinic.it` |
| PII Protection | No clear PII in tracking | Only hashed data in enhanced conversions |
| Date Bounds | Past/future limits | No past dates, max 60 days forward |

---

## 7. Future Extensibility Plan

### Phase 2: Physician Agendas

The schema already supports physician-specific booking via the `department` column:

```sql
-- Add physician column to services
ALTER TABLE services ADD COLUMN physician_id TEXT DEFAULT NULL;

-- Add physician-specific schedule rules
INSERT INTO schedule_rules (department, day_of_week, start_time, end_time, slot_interval)
VALUES ('cardiologia', 1, '09:00', '13:00', 30);  -- Dr. X, Mon 30-min slots

-- Query: available cardiologia slots for Dr. X
SELECT ... FROM services
WHERE department = 'cardiologia' AND physician_id = 'dr-x'
```

### Phase 3: Multi-Service Booking

```
services table: add combo_ids (JSON array)
booking_items table: many-to-many booking <-> services
Pricing: sum of individual services or combo discount
```

### Phase 4: Patient Portal

```
patients table: user account with auth
booking_history: linked to patient_id
Referti download: D1 + R2 storage
```

### API Extension Points

| Future Endpoint | Purpose |
|----------------|---------|
| `GET /api/booking/departments` | List all bookable departments |
| `GET /api/booking/physicians?dept=cardiologia` | Physicians per department |
| `PATCH /api/booking/:id/cancel` | Patient self-cancel |
| `GET /api/booking/:id/status` | Check booking status |
| `POST /api/booking/admin/override` | Admin: block dates |

---

## 8. Cloudflare Bindings Required

Add to `wrangler.toml` (or Cloudflare Pages dashboard):

```toml
[[d1_databases]]
binding = "BOOKING_DB"
database_name = "bio_clinic_booking"
database_id = "<from 'wrangler d1 create bio_clinic_booking'>"

[[kv_namespaces]]
binding = "BOOKING_KV"
id = "<from 'wrangler kv:namespace create BOOKING_KV'>"

[vars]
ALLOWED_ORIGINS = "https://bio-clinic.it"
CONTACT_EMAIL = "info@bio-clinic.it"
```

### Setup Commands

```bash
# Create D1 database
wrangler d1 create bio_clinic_booking

# Apply schema
wrangler d1 execute bio_clinic_booking --file=site/data/d1-schema.sql

# Seed services
# (done via API or manual SQL insert from lab-booking-services.json)

# Create KV namespace
wrangler kv:namespace create BOOKING_KV
```

---

## 9. Files Delivered

| File | Purpose |
|------|---------|
| `site/data/d1-schema.sql` | D1 database migration (5 tables + indexes + seed data) |
| `site/data/lab-booking-services.json` | 10 bookable lab services with pricing |
| `site/functions/api/booking/services.js` | GET — list active services |
| `site/functions/api/booking/slots.js` | GET — available slots by date+service |
| `site/functions/api/booking/confirm.js` | POST — create booking, return GTM tracking data |
| `site/laboratorio/prenota/index.html` | Full booking UI (4-step wizard, responsive) |
| `site/docs/BOOKING-SYSTEM-ARCHITECTURE.md` | This document |

---

**STATUS: PRODUCTION-READY (Phase 1)**

The system runs 100% on Cloudflare (Pages + Functions + D1 + KV), requires zero external SaaS, 
and integrates natively with the existing CGE v3.0 tracking pipeline and GTM container v3.0.1.
