# CGE v4.0 PRE-PUBLICATION AUDIT REPORT

**Audit Date:** 2026-02-17
**Container:** GTM-PWZWX5RS
**GA4 Property:** G-9EXCL016VJ
**CGE Version:** CGE_v4.0 (cge-tracking.js v4.0.1)
**Auditor:** Automated Static Analysis + Source Code Verification
**Scope:** 364 production pages (site/, excluding /backups/, /components/, /docs/)

---

## PHASE 1 -- FRONTEND INTEGRITY

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 1.1 | `BCG.version === "CGE_v4.0"` | Line 77: `BCG.version = 'CGE_v4.0';` | **PASS** |
| 1.2 | `BCG._normalizePhoneE164("345 123 4567")` returns `"+393451234567"` | Line 271-282: strips non-digits -> `"3451234567"` (10 digits, no leading `39` or `0`) -> returns `"+39" + "3451234567"` = `"+393451234567"` | **PASS** |
| 1.3 | After form submit, `dataLayer` contains `bc_user_email_hash` | Line 518-523: email field -> `BCG.sha256()` -> pushed as `bc_user_email_hash` via `bc_enhanced_conversion` event (line 541-547) | **PASS** |
| 1.4 | After form submit, `dataLayer` contains `bc_user_phone_hash` | Line 524-532: phone field -> `BCG._normalizePhoneE164()` -> `BCG.sha256()` -> pushed as `bc_user_phone_hash` via `bc_enhanced_conversion` event | **PASS** |
| 1.5 | No clear-text email in dataLayer | `bc_form_submit` (line 538) uses only `eventParams` (form_id, lead_type, location) -- no email/phone. `bc_enhanced_conversion` (line 541-547) pushes only SHA-256 hashes. Comment on line 537: "No PII hashes in bc_form_submit (GDPR-safe)" | **PASS** |
| 1.6 | No `enhanced_conversion_data` object in dataLayer | Search of entire cge-tracking.js: zero occurrences of `enhanced_conversion_data`. Enhanced data uses `bc_user_email_hash` / `bc_user_phone_hash` keys only | **PASS** |
| 1.7 | `bc_page_context` fires exactly once per page load | `pushInitialDataLayer()` (line 1043-1066) is called once from `BCG.init()` (line 1076). `BCG.init()` runs once via DOMContentLoaded or immediate call (lines 1116-1120). No other code path pushes `bc_page_context` | **PASS** |
| 1.8 | `bc_page_context` contains all required fields | Lines 1049-1065: pushes `bc_page_type`, `bc_specialty`, `bc_service_name`, `bc_physician_name`, `bc_price_range`, `bc_content_group`, `bc_funnel_stage`, `bc_user_id`, `bc_session_id`, `bc_page_path`, `bc_page_number`, `bc_referrer`, `bc_device_type`, `bc_version`, `bc_gclid` | **PASS** |

**Phase 1 Verdict: PASS (8/8)**

---

## PHASE 2 -- GTM FIRING INTEGRITY

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 2.1 | Exactly one `generate_lead` tag | `tag_GA4_generate_lead` (tagId 309, eventName `generate_lead`). No other tag fires `generate_lead` | **PASS** |
| 2.2 | `generate_lead` fires on trigger 210 (`trg_bc_lead_generated`) | firingTriggerId: `["210"]` -- fires only when `bc_lead_generated` custom event is pushed | **PASS** |
| 2.3 | `generate_lead` includes `event_id` | Parameter `event_id` = `{{jsm_generate_lead_event_id}}` (variableId 132) which returns `bc_lead_id` or timestamp-based fallback | **PASS** |
| 2.4 | `generate_lead` value is numeric | `value` = `{{dlv_generate_lead_value}}` which reads `value` from dataLayer (pushed as integer from `_LEAD_VALUES` / `_SERVICE_VALUES` tables: 70-400). Default: `"100"` | **PASS** |
| 2.5 | `generate_lead` currency is EUR | Hard-coded `currency` = `"EUR"` in tag parameters | **PASS** |
| 2.6 | `generate_lead` includes `send_to` | `send_to` = `"G-9EXCL016VJ"` | **PASS** |
| 2.7 | Exactly one `purchase` tag | `tag_GA4_purchase` (tagId 311, eventName `purchase`). No other tag fires `purchase` | **PASS** |
| 2.8 | `purchase` fires on trigger 212 (`trg_bc_booking_confirmed`) | firingTriggerId: `["212"]` -- fires only when `bc_booking_confirmed` custom event is pushed | **PASS** |
| 2.9 | `purchase` includes `event_id` | Parameter `event_id` = `{{jsm_purchase_event_id}}` (variableId 133) which returns `bc_transaction_id` or `"purchase_" + timestamp` fallback | **PASS** |
| 2.10 | `purchase` includes `transaction_id` | Parameter `transaction_id` = `{{dlv_bc_transaction_id}}` | **PASS** |
| 2.11 | `purchase` value is numeric | `value` = `{{dlv_bc_revenue}}` which reads `bc_revenue` from dataLayer (set in `fireBookingConfirmed` line 803 via `_getEstimatedLeadValue` which returns numeric). Default: `"0"` | **PASS** |
| 2.12 | `purchase` currency is EUR | Hard-coded `currency` = `"EUR"` in tag parameters | **PASS** |
| 2.13 | No duplicate conversion tags | `generate_lead` fires only on trigger 210. `purchase` fires only on trigger 212. `bc_lead_generated` tag (308) fires on 210 but is a *separate BI event* (eventName `bc_lead_generated`), not a duplicate `generate_lead`. `bc_booking_confirmed` tag (310) fires on 212 but is a separate BI event. No tag duplication | **PASS** |
| 2.14 | All conversion tags use `oncePerEvent` firing | Tags 308, 309, 310, 311 all have `tagFiringOption: "oncePerEvent"` | **PASS** |
| 2.15 | Lead-level dedup in JS | `BCG._isLeadDuplicate()` (lines 330-335) prevents same `leadId` from firing twice | **PASS** |
| 2.16 | Transaction-level dedup in JS | `BCG._isTransactionDuplicate()` (lines 341-356) uses both memory + `sessionStorage` to block duplicate `transaction_id` | **PASS** |
| 2.17 | `bc_form_submit` does NOT fire `generate_lead` | `bc_form_submit` triggers tag 305 (eventName `bc_form_submit`). Trigger 206 does not fire any generate_lead tag. `generate_lead` only fires on trigger 210 (`bc_lead_generated`) | **PASS** |

**Phase 2 Verdict: PASS (17/17)**

---

## PHASE 3 -- GA4 ECOMMERCE INTEGRITY

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 3.1 | `generate_lead` appears in GA4 | Fires via `gaawe` tag type with measurementId referencing `tag_GA4_Configuration` (G-9EXCL016VJ) | **PASS** |
| 3.2 | `purchase` appears in GA4 | Fires via `gaawe` tag type with measurementId referencing `tag_GA4_Configuration` (G-9EXCL016VJ) | **PASS** |
| 3.3 | `purchase` includes `items[]` | Parameter `items` = `{{jsm_purchase_items}}` (variableId 134) | **PASS** |
| 3.4 | `items[0].price` equals the value | `jsm_purchase_items` JS: `price: parseFloat(price) || 0` where `price` = `{{dlv_bc_revenue}}` -- same variable used for `value` in purchase tag | **PASS** |
| 3.5 | `items[0].quantity === 1` | `jsm_purchase_items` JS: `quantity: 1` (hard-coded) | **PASS** |
| 3.6 | `items[0].item_name` populated | `jsm_purchase_items` JS: uses `{{dlv_bc_service_name}}` or defaults to `'Prestazione Medica'` | **PASS** |
| 3.7 | `items[0].item_category` populated | `jsm_purchase_items` JS: uses `{{dlv_bc_service_category}}` or defaults to `'Medical'` | **PASS** |
| 3.8 | `event_id` present on `generate_lead` | `{{jsm_generate_lead_event_id}}` | **PASS** |
| 3.9 | `event_id` present on `purchase` | `{{jsm_purchase_event_id}}` | **PASS** |
| 3.10 | No duplicate events within 5s (JS-level) | Lead dedup via `BCG._firedLeads` in-memory map. Transaction dedup via `BCG._firedTransactions` + `sessionStorage`. Both prevent re-fire of same ID regardless of timing | **PASS** |
| 3.11 | `generate_lead` event_id is deterministic (uses lead_id) | `jsm_generate_lead_event_id`: returns `bc_lead_id` if available, ensuring GA4 dedup on re-fire | **PASS** |
| 3.12 | `purchase` event_id is deterministic (uses transaction_id) | `jsm_purchase_event_id`: returns `bc_transaction_id` if available | **PASS** |

**Phase 3 Verdict: PASS (12/12)**

---

## PHASE 4 -- CONSENT INTEGRITY

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 4.1 | Consent Mode v2 fires before GTM | `index.html` lines 4-27: consent `default` script precedes GTM snippet (lines 30-34) | **PASS** |
| 4.2 | Default consent: all storage denied | `ad_storage: denied`, `ad_user_data: denied`, `ad_personalization: denied`, `analytics_storage: denied`, `personalization_storage: denied` (line 8-16 of index.html). Only `functionality_storage: granted`, `security_storage: granted` | **PASS** |
| 4.3 | `wait_for_update: 500` set | Line 17 of index.html: `'wait_for_update': 500` | **PASS** |
| 4.4 | `gcs=G100` before consent (expected behavior) | With all storage denied, GA4 collect requests will show `gcs=G100` (analytics denied, ad denied). Consent default denies both `analytics_storage` and `ad_storage` | **PASS** |
| 4.5 | `gcs=G111` after consent grant (expected behavior) | `BCG.updateConsent()` (line 839-888) calls `gtag('consent', 'update', consentMap)` which grants analytics + ad storage -> `gcs=G111` | **PASS** |
| 4.6 | No conversion fires before consent update | GA4 Configuration tag (300) has `consentSettings.consentStatus: "needed"` requiring `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`. Enhanced Conversions tag (313) requires `ad_storage` + `ad_user_data`. All conversion events flow through GA4 config which is consent-gated | **PASS** |
| 4.7 | `ads_data_redaction` set | Line 26 of index.html: `gtag('set', 'ads_data_redaction', true)` | **PASS** |
| 4.8 | `url_passthrough` set | Line 27 of index.html: `gtag('set', 'url_passthrough', true)` | **PASS** |
| 4.9 | Region-specific consent default | Lines 18-24: secondary consent default for regions `['IT', 'EU']` with all denied | **PASS** |
| 4.10 | GTM container consent default tag | `tag_Consent_Default` (tagId 299) on `trg_Consent_Initialization` (triggerId 213), `waitForUpdate: 500`, all storage denied except `security_storage: granted` | **PASS** |
| 4.11 | Enhanced Conversions consent-gated | Tag 313 has `consentSettings` requiring `ad_storage` + `ad_user_data` = granted | **PASS** |
| 4.12 | user_id only sent with analytics consent | `BCG.getUserId()` (line 189-209): uses `localStorage` only when `analytics_storage === 'granted'`; otherwise returns session-scoped anonymous ID | **PASS** |
| 4.13 | Consent revocation cleans user_id | `_handleConsentRevocation()` (line 211-214) removes `bc_user_id` from localStorage | **PASS** |

**Phase 4 Verdict: PASS (13/13)**

---

## PHASE 5 -- GCLID PROPAGATION

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 5.1 | `?gclid=test123` creates `_bc_gclid` cookie | `captureGclid()` (line 112-139): reads `gclid` from URL params, calls `_setCookie('_bc_gclid', gclid, 90)` | **PASS** |
| 5.2 | Cookie is first-party, 90-day expiry, SameSite=Lax, Secure | `_setCookie()` (line 90-98): `'; path=/; SameSite=Lax; Secure'`, days=90 | **PASS** |
| 5.3 | `bc_gclid` pushed to dataLayer | Lines 131-135: `window.dataLayer.push({ bc_gclid: BCG._gclid })` | **PASS** |
| 5.4 | Returning visitor reads GCLID from cookie | Lines 126-128: if no URL param, reads from cookie via `BCG._getCookie()` | **PASS** |
| 5.5 | `generate_lead` includes `bc_gclid` | Tag 309 parameter: `bc_gclid` = `{{dlv_bc_gclid}}` | **PASS** |
| 5.6 | `purchase` includes `bc_gclid` | Tag 311 parameter: `bc_gclid` = `{{dlv_bc_gclid}}` | **PASS** |
| 5.7 | `bc_lead_generated` includes `bc_gclid` | Tag 308 parameter: `bc_gclid` = `{{dlv_bc_gclid}}` | **PASS** |
| 5.8 | `bc_booking_confirmed` includes `bc_gclid` | Tag 310 parameter: `bc_gclid` = `{{dlv_bc_gclid}}` | **PASS** |
| 5.9 | JS-level: bc_lead_generated push includes bc_gclid | Phone (line 392), WhatsApp (line 433), Form API success (line 975): all include `bc_gclid: BCG.getGclid()` | **PASS** |
| 5.10 | GCLID injected into form hidden fields | `injectGclidIntoForms()` (lines 146-163): creates hidden input `name="gclid"` in all forms | **PASS** |
| 5.11 | Dynamic forms observed for GCLID injection | `_observeForms()` (lines 166-177): `MutationObserver` watches for new `<form>` elements | **PASS** |
| 5.12 | `bc_page_context` includes `bc_gclid` | Line 1064: `bc_gclid: BCG.getGclid()` | **PASS** |
| 5.13 | `sendEvent()` base params include `bc_gclid` | Line 305: `bc_gclid: BCG.getGclid()` in every bc_ event | **PASS** |

**Phase 5 Verdict: PASS (13/13)**

---

## CROSS-SITE COVERAGE ASSESSMENT

| Metric | Value |
|--------|-------|
| Total production HTML pages | 364 |
| Pages with `bcDataLayer` + `cge-tracking.js` | 265 (72.8%) |
| Pages missing tracking | 99 (27.2%) |
| Backup pages (excluded) | 630 |

### Missing-page analysis:

The 99 pages without `bcDataLayer` / `cge-tracking.js` include:

- **404.html** (1 page) -- acceptable, error page
- **Specialty index pages** (e.g., `/cardiologia/index.html`, `/dermatologia/index.html`) -- **RISK: these are high-traffic entry pages**
- **Service detail pages** (e.g., `/cardiologia/checkup-cardiovascolare/index.html`, `/cardiologia/ecocardiogramma/index.html`) -- **RISK: these are conversion-intent pages**
- **Key structural pages** (`/chi-siamo/index.html`, `/contatti/index.html`, `/convenzioni/index.html`, `/cookie/index.html`)

**Impact:** Conversions from the 99 untracked pages will have `bc_page_type: 'unknown'`, `bc_specialty: 'none'`, `bc_funnel_stage: 'unknown'`. Phone/WhatsApp clicks will still fire (event listeners are global) but with zero context. Form submissions on these pages will lack specialty/service attribution.

**Severity: NON-BLOCKING for CGE logic correctness; BLOCKING for data completeness.**

> The CGE JavaScript itself is robust and handles missing `bcDataLayer` gracefully (defaults to `'unknown'`/`'none'`). The tracking script is loaded on all 265 equipped pages. The 99 pages still load GTM + Consent Mode v2 (verified in samples) but lack the inline `bcDataLayer` and `cge-tracking.js` reference.

---

## DUPLICATION RISK ASSESSMENT

| Risk Vector | Mitigation | Status |
|-------------|-----------|--------|
| Double `generate_lead` (same session) | `BCG._isLeadDuplicate()` in-memory map | MITIGATED |
| Double `purchase` (same session) | `BCG._isTransactionDuplicate()` memory + sessionStorage | MITIGATED |
| Double `purchase` (page refresh) | sessionStorage persistence of `bc_fired_txns` | MITIGATED |
| `bc_form_submit` triggering `generate_lead` | Architecturally separated: form_submit = intent (trigger 206), lead_generated = conversion (trigger 210). Code comment: "NOT a conversion" | MITIGATED |
| GTM tag double-fire | All tags use `oncePerEvent` firing option | MITIGATED |
| GA4 server-side dedup | `event_id` present on both generate_lead and purchase (deterministic from lead_id/transaction_id) | MITIGATED |
| Both `bc_lead_generated` + `generate_lead` fire on same trigger | **BY DESIGN**: tag 308 (bc_lead_generated) and tag 309 (generate_lead) both fire on trigger 210. These are distinct events (internal BI + GA4 standard). NOT a duplicate -- they serve different purposes | ACCEPTABLE |
| Both `bc_booking_confirmed` + `purchase` fire on same trigger | **BY DESIGN**: tag 310 (bc_booking_confirmed) and tag 311 (purchase) both fire on trigger 212. Same rationale | ACCEPTABLE |

**Duplicate Risk Level: LOW**

All duplicate vectors have active mitigation. The dual-fire pattern (bc_ event + GA4 standard event on the same trigger) is intentional architecture, not accidental duplication.

---

## SUMMARY SCORECARD

| Phase | Domain | Checks | Passed | Failed | Verdict |
|-------|--------|--------|--------|--------|---------|
| 1 | Frontend Integrity | 8 | 8 | 0 | **PASS** |
| 2 | GTM Firing Integrity | 17 | 17 | 0 | **PASS** |
| 3 | GA4 Ecommerce Integrity | 12 | 12 | 0 | **PASS** |
| 4 | Consent Integrity | 13 | 13 | 0 | **PASS** |
| 5 | GCLID Propagation | 13 | 13 | 0 | **PASS** |
| -- | **TOTAL** | **63** | **63** | **0** | **ALL PASS** |

**Duplicate Risk Level:** LOW
**Data Consistency Score:** 94/100

> Score deduction: -6 points for 99/364 pages (27.2%) missing `bcDataLayer` + `cge-tracking.js`, causing degraded attribution on those pages. Core tracking logic scores 100/100.

---

## FINAL VERDICT

# GO

All five audit phases pass with zero failures across 63 verification checks. The CGE v4.0 codebase, GTM container (CGE_v4.0.0_enterprise_conversion_ready), and consent implementation are production-ready.

**Condition:** The 99 pages missing `bcDataLayer` / `cge-tracking.js` should be addressed within the first 48 hours post-publish (see monitoring checklist item 7). This is a **data-completeness issue**, not a code-correctness issue -- tracking on the 265 equipped pages is fully functional and safe to publish.

---

## 48-HOUR POST-PUBLISH MONITORING CHECKLIST

### Hour 0-2: Immediate Verification
- [ ] **GA4 Realtime report**: Confirm `bc_page_context` events arriving with `bc_version = CGE_v4.0`
- [ ] **GTM Preview mode**: Verify `generate_lead` fires on phone click / form submit (one tag only)
- [ ] **GTM Preview mode**: Verify `purchase` fires on `BCG.fireBookingConfirmed()` test call (one tag only)
- [ ] **Console check**: No JavaScript errors from `cge-tracking.js` on homepage, 3 specialty pages, 3 service pages
- [ ] **Network tab**: Confirm `collect?v=2` requests show `gcs=G100` before consent, `gcs=G111` after accept-all

### Hour 2-6: Consent + GCLID
- [ ] **Iubenda banner**: Verify consent banner appears on first visit; accepting all triggers `bc_consent_update`
- [ ] **GCLID test**: Visit `https://bio-clinic.it/?gclid=qa_test_20260217` and verify:
  - `_bc_gclid` cookie set to `qa_test_20260217`
  - `bc_gclid` appears in `bc_page_context` event in GA4
  - Phone click `generate_lead` includes `bc_gclid = qa_test_20260217`
- [ ] **Enhanced Conversions**: Submit test form with known email/phone. Verify `bc_enhanced_conversion` event fires with SHA-256 hashes (no cleartext)

### Hour 6-12: Conversion Validation
- [ ] **GA4 DebugView**: Trigger `generate_lead` and confirm `currency=EUR`, `value` is numeric, `event_id` present
- [ ] **GA4 DebugView**: Trigger `purchase` via test booking and confirm `items[]` array present with `price` = `value`, `quantity = 1`
- [ ] **Deduplication**: Rapid double-click on phone number -- verify only ONE `generate_lead` in DebugView
- [ ] **GA4 Conversions report**: Mark `generate_lead` and `purchase` as conversions if not already

### Hour 12-24: Data Quality
- [ ] **GA4 Events report**: Check event counts -- `bc_page_context` count should approximate page_view count
- [ ] **GA4 Custom dimensions**: Verify `bc_specialty`, `bc_service_name`, `bc_funnel_stage` are populating
- [ ] **No PII leaks**: Search GA4 user explorer for any cleartext email patterns -- must find zero
- [ ] **Error monitoring**: Check for `bc_form_error` events -- investigate any spikes

### Hour 24-48: Coverage + Stability
- [ ] **Deploy tracking to 99 missing pages**: Add `bcDataLayer` + `<script src="/js/cge-tracking.js?v=CGE_v4_20260217" defer></script>` to all remaining production pages
- [ ] **Cross-page validation**: Spot-check 5 specialty pages and 5 service pages for correct `bcDataLayer` values
- [ ] **Revenue sanity**: Compare `generate_lead` value totals against expected lead volume * average estimated value
- [ ] **Session stitching**: Verify `bc_user_id` persists across page navigations when analytics consent is granted
- [ ] **Mobile QA**: Test phone click, WhatsApp click, and form submit on iOS Safari and Android Chrome

### Ongoing (Week 1)
- [ ] **Google Ads linking**: Verify enhanced conversions are matching in Google Ads (may take 24-72h)
- [ ] **Looker Studio dashboards**: Confirm bc_ custom dimensions are populating in all reports
- [ ] **Alert setup**: Configure GA4 custom alerts for `generate_lead` count drop > 50% day-over-day

---

*Report generated: 2026-02-17 | CGE v4.0.1 Compliance Patch | Bio-Clinic Digital Architecture*
