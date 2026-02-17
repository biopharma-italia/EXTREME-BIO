# Clinical Growth Engine (CGE) v2.1 - Implementation Guide

## Bio-Clinic Sassari | bio-clinic.it

**Container:** GTM-PWZWX5RS  
**GA4 Property:** G-9EXCL016VJ  
**Version:** CGE_v2.1_foundation  
**Date:** 2026-02-16  

---

## Architecture Overview

```
                    BROWSER
                       |
    [1] Consent Mode v2 (inline, BEFORE GTM)
                       |
    [2] GTM Container (GTM-PWZWX5RS)
                       |
    [3] bcDataLayer (inline, page-specific context)
                       |
    [4] cge-tracking.js (event handlers, form submission)
                       |
              +---------+---------+
              |                   |
    [5] dataLayer.push()    [6] /api/contact
         (GTM events)        (CF Workers)
              |                   |
    [7a] GA4 (bc_ events)  [8] Email + KV
    [7b] GA4 (generate_lead, purchase)  <- Google Ads Smart Bidding
              |
    [9] Looker Studio Dashboard
              |
    [10] Google Ads (offline conversion import via CSV)
```

---

## Coverage Status

| Component | Coverage | Pages |
|---|---|---|
| GTM Snippet | 100% | 264/264 |
| GTM noscript | 100% | 264/264 |
| Consent Mode v2 | 100% | 264/264 |
| bcDataLayer | 100% | 264/264 |
| cge-tracking.js | 100% | 264/264 |
| Iubenda Cookie Consent | 100% | 264/264 |
| Redirect pages (excluded) | N/A | 56 |

---

## Event Naming Convention

All events use the `bc_` prefix (Bio-Clinic):

| Event | Description | Funnel Stage |
|---|---|---|
| `bc_page_context` | Page load with full context | awareness |
| `bc_deep_engagement` | Scroll 75% OR time 60s | engagement |
| `bc_price_interest` | Price section view/click | consideration |
| `bc_prenota_click` | Booking intent CTA click | intent |
| `bc_phone_click` | Phone link click | conversion |
| `bc_whatsapp_click` | WhatsApp link click | conversion |
| `bc_form_submit` | Form submission | conversion |
| `bc_lead_generated` | Successful API submission (PRIMARY conversion) | conversion |
| `bc_booking_confirmed` | Booking confirmation (GipoNext/CSV) | retention |
| `generate_lead` | Google Ads standard event (with bc_lead_generated) | conversion |
| `purchase` | Google Ads standard event (with bc_booking_confirmed) | retention |

### Additional Events
| Event | Description |
|---|---|
| `bc_scroll_milestone` | 25%, 50%, 75% scroll |
| `bc_time_milestone` | 30s, 60s, 120s, 300s |
| `bc_external_link` | Outbound link clicks |
| `bc_miodottore_click` | MioDottore profile clicks |
| `bc_social_click` | Social media clicks |
| `bc_faq_interaction` | FAQ accordion clicks |
| `bc_site_search` | On-site search |
| `bc_consent_update` | Cookie consent changes |
| `bc_form_error` | Form API errors |
| `bc_enhanced_conversion` | Enhanced conversion data |
| `bc_map_interaction` | Google Maps interactions |

### Dual-Fire Architecture (bc_ + Google Standard)

| bc_ Event (BI/Looker) | Google Ads Event | Purpose |
|---|---|---|
| `bc_form_submit` | *(none - intent only)* | Micro-conversion for funnel diagnostics |
| `bc_lead_generated` | `generate_lead` | PRIMARY conversion, enables tCPA bidding |
| `bc_booking_confirmed` | `purchase` | Revenue event, enables tROAS bidding |

---

## Conversion Hierarchy

| Level | Event | GA4 Setting | Google Ads |
|---|---|---|---|
| **Primary** | `bc_lead_generated` | Mark as Key Event | Import as conversion |
| **Primary** | `generate_lead` | Mark as Key Event | Smart Bidding tCPA |
| **Secondary** | `bc_phone_click` | Mark as Key Event | Import as conversion |
| **Secondary** | `bc_whatsapp_click` | Mark as Key Event | Import as conversion |
| **Micro** | `bc_form_submit` | Do NOT mark | Funnel diagnostics only |
| **Micro** | `bc_prenota_click` | Do NOT mark | Funnel diagnostics only |
| **Revenue** | `bc_booking_confirmed` | Mark as Key Event | Offline import |
| **Revenue** | `purchase` | Mark as Key Event | Smart Bidding tROAS |

> **IMPORTANT:** `bc_form_submit` is INTENT (user clicked submit). `bc_lead_generated` is CONFIRMED (API returned success). Only the latter should be a primary conversion.

---

## Funnel Tracking

```
page_view (bc_page_context)
    |
deep_engagement (bc_deep_engagement: scroll_75 OR time_60s)
    |
price_interest (bc_price_interest: price_view OR price_click)
    |
prenota_click (bc_prenota_click: booking intent CTA)
    |
    +-- form_submit (bc_form_submit) ---> lead_generated (bc_lead_generated + generate_lead)
    |
    +-- phone_click (bc_phone_click) ---> offline tracking
    |
    +-- whatsapp_click (bc_whatsapp_click) ---> offline tracking
    |
booking_confirmed (bc_booking_confirmed + purchase) [GipoNext API or CSV import]
```

---

## DataLayer Context (per page)

Every page pushes a `bcDataLayer` object:

```javascript
window.bcDataLayer = {
  "page_type": "service",          // home|hub|service|equipe|equipe_detail|pricing|conversion|legal|info|standalone
  "specialty": "cardiologia",      // specialty slug or "none"
  "service_name": "ecocardiogramma", // service slug or "none"
  "physician_name": "tonino-bullitta", // physician slug or "none"
  "price_range": "100-150",        // price range or "none"
  "content_group": "cardiologia_servizi", // content group for GA4
  "funnel_stage": "consideration"  // awareness|consideration|conversion|none
};
```

---

## GDPR Consent Mode v2 & User ID

### Default State (inline, BEFORE GTM)
```javascript
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'granted',
  'personalization_storage': 'denied',
  'security_storage': 'granted',
  'wait_for_update': 500
});
```

### After User Consent (via Iubenda)
```javascript
gtag('consent', 'update', {
  'ad_storage': 'granted',      // if marketing accepted
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
  'analytics_storage': 'granted' // if analytics accepted
});
```

### User ID Consent Gating (REFINEMENT 2)

| Consent State | User ID Behavior |
|---|---|
| `analytics_storage: denied` | Session-only anonymous ID (`sessionStorage`) - NOT persisted |
| `analytics_storage: granted` | Persistent user_id (`localStorage`) - survives sessions |
| Consent revoked | `localStorage` user_id is **immediately deleted** |

**Privacy Policy Requirement:** The persistent `bc_user_id` identifier MUST be disclosed in the privacy policy under Art. 13 GDPR. Add a section titled "Identificatori analitici" to https://bio-clinic.it/privacy/ with text:

> *"Utilizziamo un identificatore tecnico anonimo (bc_user_id) memorizzato nel browser per collegare le sessioni di navigazione ai fini dell'analisi statistica aggregata. Questo identificatore viene creato solo dopo che l'utente ha espresso il consenso all'archiviazione analitica (analytics_storage). In caso di revoca del consenso, l'identificatore viene eliminato immediatamente. L'identificatore non contiene dati personali direttamente identificativi."*

### Important GDPR Notes
- Consent defaults fire BEFORE GTM loads (inline in `<head>`)
- GA4 uses **cookieless pings** when consent is denied (behavioral modeling)
- `ads_data_redaction = true` strips ad click IDs when consent denied
- `url_passthrough = true` passes campaign info via URL decorators
- Iubenda cookie banner is loaded on ALL 264 pages
- **3313232 and 85172996 must be replaced** with actual values from Iubenda dashboard
- **Privacy policy must include** the "Identificatori analitici" section (see User ID Consent Gating above)

---

## GTM Container Configuration

### File Location
`/site/docs/gtm-container-CGE_v1_foundation.json` (version CGE_v2.1_foundation)

### Import Instructions
1. Go to GTM > Admin > Import Container
2. Select the JSON file
3. Choose Workspace: Default
4. Merge option: **Overwrite** (if clean) or **Merge** (if existing tags)
5. Review variables, triggers, tags
6. Create version named `CGE_v2.1_foundation`
7. **Test with GTM Preview Mode first**
8. Publish to Live when validated

### Variables (25 total)
All use `v` type (Data Layer Variable) with `eventModel.bc_*` path:

| Variable Name | DataLayer Path | Default |
|---|---|---|
| dlv_bc_page_type | eventModel.bc_page_type | unknown |
| dlv_bc_specialty | eventModel.bc_specialty | none |
| dlv_bc_service_name | eventModel.bc_service_name | none |
| dlv_bc_physician_name | eventModel.bc_physician_name | none |
| dlv_bc_price_range | eventModel.bc_price_range | none |
| dlv_bc_funnel_stage | eventModel.bc_funnel_stage | unknown |
| dlv_bc_content_group | eventModel.bc_content_group | general |
| dlv_bc_user_id | eventModel.bc_user_id | (empty) |
| dlv_bc_session_id | eventModel.bc_session_id | (empty) |
| dlv_bc_lead_type | eventModel.bc_lead_type | contact |
| dlv_bc_phone_number | eventModel.bc_phone_number | (empty) |
| dlv_bc_click_text | eventModel.bc_click_text | (empty) |
| dlv_bc_click_location | eventModel.bc_click_location | unknown |
| dlv_bc_form_id | eventModel.bc_form_id | unknown |
| dlv_bc_engagement_type | eventModel.bc_engagement_type | (empty) |
| dlv_bc_device_type | eventModel.bc_device_type | unknown |
| dlv_bc_user_email_hash | eventModel.bc_user_email_hash | (empty) |
| dlv_bc_user_phone_hash | eventModel.bc_user_phone_hash | (empty) |
| dlv_bc_selected_service | eventModel.bc_selected_service | (empty) |
| dlv_bc_version | eventModel.bc_version | CGE_v2.1 |
| dlv_bc_lead_id | bc_lead_id | (empty) |
| dlv_bc_revenue | bc_revenue | 0 |
| dlv_bc_transaction_id | bc_transaction_id | (empty) |
| dlv_generate_lead_value | value | 100 |
| dlv_purchase_transaction_id | transaction_id | (empty) |

### Triggers (16 total)
| Trigger | Type | Event |
|---|---|---|
| trg_All_Pages | Page View | All Pages |
| trg_DOM_Ready | DOM Ready | All Pages |
| trg_bc_page_context | Custom Event | bc_page_context |
| trg_bc_phone_click | Custom Event | bc_phone_click |
| trg_bc_whatsapp_click | Custom Event | bc_whatsapp_click |
| trg_bc_prenota_click | Custom Event | bc_prenota_click |
| trg_bc_form_submit | Custom Event | bc_form_submit |
| trg_bc_deep_engagement | Custom Event | bc_deep_engagement |
| trg_bc_price_interest | Custom Event | bc_price_interest |
| trg_bc_consent_update | Custom Event | bc_consent_update |
| trg_bc_lead_generated | Custom Event | bc_lead_generated |
| trg_bc_enhanced_conversion | Custom Event | bc_enhanced_conversion |
| trg_generate_lead | Custom Event | generate_lead |
| trg_purchase | Custom Event | purchase |
| trg_bc_booking_confirmed | Custom Event | bc_booking_confirmed |

### Tags (12 total)
| Tag | Type | Trigger | Purpose |
|---|---|---|---|
| tag_GA4_Configuration | GA4 Config | All Pages | GA4 base config with user_id + content_group |
| tag_GA4_bc_phone_click | GA4 Event | bc_phone_click | Phone clicks with full context |
| tag_GA4_bc_whatsapp_click | GA4 Event | bc_whatsapp_click | WhatsApp clicks |
| tag_GA4_bc_prenota_click | GA4 Event | bc_prenota_click | Booking intent clicks |
| tag_GA4_bc_form_submit | GA4 Event | bc_form_submit | Form submissions (micro-conversion, intent only) |
| tag_GA4_bc_deep_engagement | GA4 Event | bc_deep_engagement | Quality engagement signals |
| tag_GA4_bc_price_interest | GA4 Event | bc_price_interest | Price interest signals |
| tag_GA4_bc_lead_generated | GA4 Event | bc_lead_generated | **PRIMARY conversion** - confirmed lead |
| tag_GA4_generate_lead | GA4 Event | generate_lead | Google Ads standard event for Smart Bidding tCPA |
| tag_GA4_purchase | GA4 Event | purchase | Google Ads standard event for Smart Bidding tROAS |
| tag_GA4_bc_booking_confirmed | GA4 Event | bc_booking_confirmed | Booking confirmation (revenue closed-loop) |

---

## Cloudflare Workers API

### /api/contact (POST)

**File:** `/site/functions/api/contact.js`

**Request:**
```json
{
  "name": "Mario Rossi",
  "phone": "+39 079 123 4567",
  "email": "mario@example.com",
  "message": "Vorrei prenotare...",
  "service": "ecocardiogramma",
  "specialty": "cardiologia",
  "physician": "tonino-bullitta",
  "source_page": "/cardiologia/ecocardiogramma/",
  "bc_user_id": "bc_xxx",
  "bc_session_id": "bcs_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "lead_id": "bc_lead_xxx_yyy",
  "message": "Richiesta ricevuta."
}
```

**Required Environment Variables (CF Pages Dashboard):**
| Variable | Description |
|---|---|
| CONTACT_EMAIL | Destination email (info@bio-clinic.it) |
| EMAIL_API_KEY | Resend.com API key |
| ALLOWED_ORIGINS | https://bio-clinic.it |

**KV Namespace:** Create `LEADS_KV` and bind in CF Pages settings.

### /api/collect (POST) - Server-Side Tagging

**File:** `/site/functions/api/collect.js`

Phase 2 server-side tagging proxy. Enriches events with geo data, strips PII, forwards to GA4 Measurement Protocol.

**Required:**
| Variable | Description |
|---|---|
| GA4_MEASUREMENT_ID | G-9EXCL016VJ |
| GA4_API_SECRET | From GA4 Admin > Data Streams > Measurement Protocol |

---

## Looker Studio Dashboard KPIs

### Recommended Reports

1. **Conversion Funnel by Specialty**
   - Dimensions: bc_specialty, bc_funnel_stage
   - Metrics: event_count, conversion_rate
   - Visualization: Funnel chart

2. **Lead Attribution by Physician**
   - Dimensions: bc_physician_name
   - Metrics: bc_form_submit count, bc_phone_click count
   - Visualization: Stacked bar

3. **Revenue per Keyword** (requires Google Ads link)
   - Dimensions: session_source, session_medium, landing_page
   - Metrics: conversions, cost, revenue (offline import)
   - Visualization: Table with conditional formatting

4. **Engagement Quality by Page Type**
   - Dimensions: bc_page_type, bc_content_group
   - Metrics: bc_deep_engagement rate, avg_session_duration
   - Visualization: Heatmap

5. **Device & Location Performance**
   - Dimensions: bc_device_type, geo_city
   - Metrics: sessions, conversion_rate
   - Visualization: Geographic map + pie chart

6. **Real-Time Lead Monitor**
   - Dimensions: timestamp, specialty, lead_type
   - Data source: KV store or BigQuery export
   - Visualization: Timeline

### GA4 Custom Dimensions to Register
Go to GA4 > Admin > Custom Definitions > Custom Dimensions:

| Dimension Name | Scope | Event Parameter |
|---|---|---|
| Page Type | Event | bc_page_type |
| Specialty | Event | bc_specialty |
| Service Name | Event | bc_service_name |
| Physician Name | Event | bc_physician_name |
| Price Range | Event | bc_price_range |
| Content Group | Event | bc_content_group |
| Funnel Stage | Event | bc_funnel_stage |
| Lead Type | Event | bc_lead_type |
| Click Location | Event | bc_click_location |
| Engagement Type | Event | bc_engagement_type |
| Device Type | Event | bc_device_type |
| Form ID | Event | bc_form_id |

### GA4 Conversions to Mark
Go to GA4 > Admin > Events > Mark as Conversion:

| Event | Type | Priority | Notes |
|---|---|---|---|
| bc_lead_generated | Key Event | **Critical** | Primary conversion: confirmed lead from API |
| generate_lead | Key Event | **Critical** | Google Ads Smart Bidding (tCPA) |
| bc_phone_click | Key Event | High | Phone call intent |
| bc_whatsapp_click | Key Event | Medium | WhatsApp message intent |
| bc_booking_confirmed | Key Event | High | Revenue event (future: GipoNext) |
| purchase | Key Event | High | Google Ads Smart Bidding (tROAS) |
| bc_form_submit | **Do NOT mark** | - | Micro-conversion only (intent, not confirmed) |
| bc_prenota_click | **Do NOT mark** | - | Micro-conversion only (click, not submission) |

---

## 90-Day Roadmap

### Phase 1: Days 1-14 (DONE)
- [x] GTM on 100% pages (264/264)
- [x] Consent Mode v2 on 100% pages (264/264, BEFORE GTM)
- [x] bcDataLayer on 100% pages (264/264)
- [x] cge-tracking.js on 100% pages (264/264)
- [x] Iubenda cookie consent on 100% pages (264/264)
- [x] GTM container JSON with all variables/triggers/tags
- [x] Contact form API (/api/contact)
- [x] Server-side tagging proxy spec (/api/collect)
- [x] **generate_lead + purchase** Google Ads events (v2.1)
- [x] **Consent-gated user_id** - localStorage only with analytics consent (v2.1)
- [x] **bc_lead_generated as PRIMARY conversion** - bc_form_submit demoted to micro (v2.1)
- [x] **Lead value estimation table** by specialty/service (v2.1)
- [x] **BCG.fireBookingConfirmed()** function for GipoNext integration (v2.1)
- [ ] **TODO:** Replace 3313232 with actual ID
- [ ] **TODO:** Import GTM container JSON and test in Preview
- [ ] **TODO:** Register GA4 custom dimensions
- [ ] **TODO:** Mark conversion events in GA4 (see Conversion Hierarchy above)
- [ ] **TODO:** Set CF Pages environment variables
- [ ] **TODO:** Create CF KV namespace (LEADS_KV)
- [ ] **TODO:** Add "Identificatori analitici" section to privacy policy

### Phase 2: Days 15-30 (accelerated from 45)
- [ ] Activate server-side tagging (/api/collect) — **30-day deadline**
- [ ] Set up Resend.com for email notifications
- [ ] Configure GA4 Enhanced Conversions
- [ ] Build Looker Studio dashboard
- [ ] Create GA4 audiences by specialty
- [ ] Set up Slack/Telegram lead notifications
- [ ] Add call tracking integration (Voxloud/Wildix)

### Phase 3: Days 31-90
- [ ] **GipoNext booking confirmed integration** (~2,600 bookings/month)
  - Option A: Direct API webhook -> BCG.fireBookingConfirmed()
  - Option B: Monthly CSV export, SHA-256 email hash match, Google Ads offline import
- [ ] Multi-step booking widget
- [ ] Email automation (confirmation, reminder, follow-up)
- [ ] Offline conversion import (Google Ads)
- [ ] A/B testing framework
- [ ] CRM integration (Brevo/HubSpot)
- [ ] Revenue attribution dashboard

---

## Debug Mode

Add `?cge_debug=1` to any page URL to enable console logging:

```
https://bio-clinic.it/cardiologia/?cge_debug=1
```

This will show:
- All CGE events in console with green styling
- Context object for the page
- User ID and Session ID
- Page count in session
- Device type detection

---

## File Inventory

| File | Location | Purpose |
|---|---|---|
| cge-tracking.js | /site/js/cge-tracking.js | Core tracking engine |
| contact.js | /site/functions/api/contact.js | Contact form API |
| collect.js | /site/functions/api/collect.js | SST proxy |
| GTM JSON | /site/docs/gtm-container-CGE_v1_foundation.json | GTM import |
| DataLayer Map | /datalayer-map.json | Page context mapping |
| Consent Deploy | /cge-consent-deploy.py | Consent Mode injector |
| CGE Deploy | /cge-deploy.py | Full deployment script |
| This Doc | /site/docs/CGE-IMPLEMENTATION-GUIDE.md | Documentation |

---

## Technical Validation Answers

1. **DataLayer scalability:** The bcDataLayer is a flat object per page (7 keys), injected inline. It does not grow - each page has a fixed context. The cge-tracking.js reads it once on init. No performance concern even at 1000+ pages.

2. **Event naming correctness:** All events use `bc_` prefix per GA4 best practices (namespace avoids collision with built-in events). Parameter names also use `bc_` prefix. No reserved GA4 names are used.

3. **Additional parameters suggested:**
   - `bc_page_number` (session page depth) - **IMPLEMENTED**
   - `bc_referrer_type` (organic/direct/social/paid) - consider for Phase 2
   - `bc_time_to_first_interaction` - consider for Phase 2

4. **Server-side tagging now vs later:** The spec is ready (`/api/collect`). Deploy in Phase 2 after validating client-side events are correct. Server-side adds geo-enrichment and PII stripping but client-side must be stable first.

5. **booking_confirmed mapping:** Implemented as `BCG.fireBookingConfirmed(data)`. Call it from GipoNext webhook or manual trigger. It fires both `bc_booking_confirmed` (BI) and `purchase` (Google Ads ROAS). For CSV import fallback: export monthly from GipoNext, SHA-256 hash email, match against `bc_lead_generated` enhanced conversion data, import as offline conversions.

6. **Persistent user_id:** **CONSENT-GATED** (v2.1). Only stored in `localStorage` when `analytics_storage === 'granted'`. When consent is denied, a session-only anonymous ID is used. When consent is revoked, the persistent ID is immediately deleted. **Must be disclosed in privacy policy.**

---

## Lead Value Estimation

cge-tracking.js includes a specialty-level and service-level value table used for `generate_lead` and `purchase` events:

| Specialty | Default Value (EUR) | Notable Service Overrides |
|---|---|---|
| cardiologia | 150 | ecocardiogramma 130, checkup-cardiovascolare 200 |
| ginecologia | 120 | ecografia-morfologica 175, consulto-pma 250 |
| genetica | 200 | test-genetico 300 |
| slim-care | 300 | wegovy 400, mounjaro 400 |
| dermatologia | 100 | - |
| All others | 100 | - |

> **Update quarterly** based on actual revenue data from GipoNext to improve Smart Bidding accuracy.

---

## Booking Confirmed Integration (GipoNext/MioDottore)

### Option A: Direct API
```javascript
// Called from GipoNext webhook or admin panel
BCG.fireBookingConfirmed({
  lead_id: 'bc_lead_xxx',
  specialty: 'cardiologia',
  service_name: 'ecocardiogramma',
  physician_name: 'tonino-bullitta',
  revenue: 130.00,
  transaction_id: 'GIPO_12345'
});
// -> fires bc_booking_confirmed (BI) + purchase (Google Ads)
```

### Option B: Monthly CSV Import
1. Export completed bookings from GipoNext (patient email, service, date, revenue)
2. SHA-256 hash each email address
3. Match against `bc_lead_generated` events using `bc_user_email_hash`
4. Format as Google Ads offline conversion file
5. Upload to Google Ads > Tools > Conversions > Uploads
