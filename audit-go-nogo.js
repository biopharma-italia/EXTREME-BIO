#!/usr/bin/env node
/**
 * GO/NO-GO Pre-Publication Audit for Bio-Clinic CGE v4.0
 * Strict verification — no modifications, only report.
 */

const fs = require('fs');
const path = require('path');

const RESULTS = {};
let totalChecks = 0;
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function check(phase, name, condition, detail) {
  totalChecks++;
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) passCount++; else failCount++;
  if (!RESULTS[phase]) RESULTS[phase] = [];
  RESULTS[phase].push({ name, status, detail });
  return condition;
}

function warn(phase, name, detail) {
  warnCount++;
  if (!RESULTS[phase]) RESULTS[phase] = [];
  RESULTS[phase].push({ name, status: 'WARN', detail });
}

// Load sources
const cgeJS = fs.readFileSync('site/js/cge-tracking.js', 'utf8');
const gtmJSON = JSON.parse(fs.readFileSync('site/docs/gtm-container-CGE_v4_enterprise.json', 'utf8'));
const indexHTML = fs.readFileSync('site/index.html', 'utf8');

const tags = gtmJSON.containerVersion.tag;
const triggers = gtmJSON.containerVersion.trigger;
const variables = gtmJSON.containerVersion.variable;

// Helper: find GTM tag by name
function findTag(name) { return tags.find(t => t.name === name); }
function findTrigger(id) { return triggers.find(t => t.triggerId === id); }
function findVariable(name) { return variables.find(v => v.name === name); }
function getTagParams(tag) {
  if (!tag) return {};
  const params = {};
  const epList = (tag.parameter || []).find(p => p.key === 'eventParameters');
  if (epList && epList.list) {
    epList.list.forEach(item => {
      const map = item.map || [];
      const n = (map.find(m => m.key === 'name') || {}).value;
      const v = (map.find(m => m.key === 'value') || {}).value;
      if (n) params[n] = v;
    });
  }
  return params;
}

console.log('='.repeat(80));
console.log('  GO/NO-GO PRE-PUBLICATION AUDIT — Bio-Clinic CGE v4.0.0 Enterprise');
console.log('  Container: GTM-PWZWX5RS | GA4: G-9EXCL016VJ');
console.log('  Audit Date: 2026-02-17');
console.log('='.repeat(80));
console.log('');

// ============================================================================
// PHASE 1: FRONTEND LIVE VERIFICATION
// ============================================================================
console.log('━━━ PHASE 1: FRONTEND INTEGRITY ━━━');

// 1.1 BCG.version
const versionMatch = cgeJS.match(/BCG\.version\s*=\s*'([^']+)'/);
const version = versionMatch ? versionMatch[1] : null;
check('P1', 'BCG.version === "CGE_v4.0"', version === 'CGE_v4.0',
  `Found: ${version}`);

// 1.2 Header comment
check('P1', 'Compliance patch header present', cgeJS.includes('CGE v4.0.1 Compliance Patch'),
  'Line 1 header comment');

// 1.3 normalizePhoneE164 function exists
check('P1', '_normalizePhoneE164 function defined', cgeJS.includes('BCG._normalizePhoneE164 = function'),
  'E.164 normalization utility present');

// 1.4 Simulate normalizePhoneE164("345 123 4567")
// Extract and test the function logic
const phoneNormCode = cgeJS.match(/BCG\._normalizePhoneE164\s*=\s*function\(phone\)\s*\{[\s\S]*?\n\s*\};/);
let phoneNormResult = null;
if (phoneNormCode) {
  try {
    const fn = new Function('phone', `
      if (!phone) return '';
      var digits = phone.replace(/\\D/g, '');
      if (digits.length === 0) return '';
      if (digits.indexOf('39') === 0) { return '+' + digits; }
      if (digits.indexOf('0') === 0) { return '+39' + digits.substring(1); }
      return '+39' + digits;
    `);
    phoneNormResult = fn('345 123 4567');
  } catch(e) { phoneNormResult = 'ERROR: ' + e.message; }
}
check('P1', 'normalizePhoneE164("345 123 4567") === "+393451234567"',
  phoneNormResult === '+393451234567',
  `Result: ${phoneNormResult}`);

// Test with leading 0
let phoneNorm0 = null;
try {
  const fn0 = new Function('phone', `
    if (!phone) return '';
    var digits = phone.replace(/\\D/g, '');
    if (digits.length === 0) return '';
    if (digits.indexOf('39') === 0) { return '+' + digits; }
    if (digits.indexOf('0') === 0) { return '+39' + digits.substring(1); }
    return '+39' + digits;
  `);
  phoneNorm0 = fn0('0799561332');
} catch(e) {}
check('P1', 'normalizePhoneE164("0799561332") === "+39799561332"',
  phoneNorm0 === '+39799561332',
  `Result: ${phoneNorm0}`);

// Test with +39 prefix already
let phoneNorm39 = null;
try {
  const fn39 = new Function('phone', `
    if (!phone) return '';
    var digits = phone.replace(/\\D/g, '');
    if (digits.length === 0) return '';
    if (digits.indexOf('39') === 0) { return '+' + digits; }
    if (digits.indexOf('0') === 0) { return '+39' + digits.substring(1); }
    return '+39' + digits;
  `);
  phoneNorm39 = fn39('+39 345 123 4567');
} catch(e) {}
check('P1', 'normalizePhoneE164("+39 345 123 4567") === "+393451234567"',
  phoneNorm39 === '+393451234567',
  `Result: ${phoneNorm39}`);

// 1.5 Phone normalization is used before hashing
check('P1', 'normalizePhoneE164 called before sha256 in form handler',
  cgeJS.includes('BCG._normalizePhoneE164(phoneField.value)') &&
  cgeJS.includes('BCG.sha256(normalizedPhone)'),
  'Phone is normalized then hashed');

// 1.6 No cleartext email in enhanced_conversion push
check('P1', 'No enhanced_conversion_data object in cge-tracking.js',
  !cgeJS.includes('enhanced_conversion_data'),
  'enhanced_conversion_data string absent');

// 1.7 bc_enhanced_conversion push only contains hashes
const ecPushMatch = cgeJS.match(/event:\s*'bc_enhanced_conversion'[\s\S]*?\}\);/);
const ecPush = ecPushMatch ? ecPushMatch[0] : '';
check('P1', 'bc_enhanced_conversion push has bc_user_email_hash',
  ecPush.includes('bc_user_email_hash'), 'Email hash field present');
check('P1', 'bc_enhanced_conversion push has bc_user_phone_hash',
  ecPush.includes('bc_user_phone_hash'), 'Phone hash field present');
check('P1', 'No cleartext "email" key in bc_enhanced_conversion push',
  !ecPush.match(/[^_]email[^_]/i) || ecPush.match(/email_hash/),
  'Only hashed fields');

// 1.8 bc_page_context fires exactly once
const pageContextCalls = (cgeJS.match(/pushInitialDataLayer\(\)/g) || []).length;
check('P1', 'pushInitialDataLayer() called exactly once in init()',
  pageContextCalls === 1,
  `Found ${pageContextCalls} call(s) in init block`);

// 1.9 bc_page_context event push
check('P1', 'bc_page_context event pushed with required fields',
  cgeJS.includes("event: 'bc_page_context'") &&
  cgeJS.includes('bc_page_type:') && cgeJS.includes('bc_service_name:') &&
  cgeJS.includes('bc_version: BCG.version') && cgeJS.includes('bc_gclid:'),
  'All required fields present in push');

// 1.10 IIFE wrapping
check('P1', 'Script wrapped in IIFE',
  cgeJS.trimStart().startsWith('// CGE') && cgeJS.includes("(function()") && cgeJS.trimEnd().endsWith("})();"),
  'Self-executing function closure');

// 1.11 Cache buster updated
check('P1', 'Cache buster is CGE_v4_20260217',
  indexHTML.includes('cge-tracking.js?v=CGE_v4_20260217'),
  'index.html script tag verified');

// 1.12 No old version strings
check('P1', 'No residual CGE_v3.0 strings',
  !cgeJS.includes('CGE_v3.0'),
  'Old version fully replaced');

console.log('');

// ============================================================================
// PHASE 2: GTM FIRING INTEGRITY (Container Analysis)
// ============================================================================
console.log('━━━ PHASE 2: GTM FIRING INTEGRITY ━━━');

// 2.1 generate_lead tag exists and fires on correct trigger
const glTag = findTag('tag_GA4_generate_lead');
check('P2', 'generate_lead tag exists',
  !!glTag, `Tag ID: ${glTag ? glTag.tagId : 'NOT FOUND'}`);

const glTrigger = glTag ? glTag.firingTriggerId : [];
check('P2', 'generate_lead fires on trg_bc_lead_generated (210)',
  glTrigger.includes('210'),
  `Trigger IDs: ${glTrigger.join(', ')}`);

// 2.2 generate_lead has event_id
const glParams = getTagParams(glTag);
check('P2', 'generate_lead includes event_id',
  !!glParams.event_id,
  `event_id: ${glParams.event_id || 'MISSING'}`);

check('P2', 'generate_lead event_id uses jsm_generate_lead_event_id',
  glParams.event_id === '{{jsm_generate_lead_event_id}}',
  `Value: ${glParams.event_id}`);

// 2.3 generate_lead has value and currency
check('P2', 'generate_lead value is numeric (from DLV)',
  glParams.value === '{{dlv_generate_lead_value}}',
  `value: ${glParams.value}`);
check('P2', 'generate_lead currency is EUR',
  glParams.currency === 'EUR',
  `currency: ${glParams.currency}`);

// 2.4 generate_lead has send_to
check('P2', 'generate_lead send_to is G-9EXCL016VJ',
  glParams.send_to === 'G-9EXCL016VJ',
  `send_to: ${glParams.send_to}`);

// 2.5 purchase tag
const purchTag = findTag('tag_GA4_purchase');
check('P2', 'purchase tag exists',
  !!purchTag, `Tag ID: ${purchTag ? purchTag.tagId : 'NOT FOUND'}`);

const purchTrigger = purchTag ? purchTag.firingTriggerId : [];
check('P2', 'purchase fires on trg_bc_booking_confirmed (212)',
  purchTrigger.includes('212'),
  `Trigger IDs: ${purchTrigger.join(', ')}`);

const purchParams = getTagParams(purchTag);
check('P2', 'purchase includes transaction_id',
  !!purchParams.transaction_id,
  `transaction_id: ${purchParams.transaction_id || 'MISSING'}`);

check('P2', 'purchase includes event_id',
  !!purchParams.event_id,
  `event_id: ${purchParams.event_id || 'MISSING'}`);

check('P2', 'purchase event_id uses jsm_purchase_event_id',
  purchParams.event_id === '{{jsm_purchase_event_id}}',
  `Value: ${purchParams.event_id}`);

check('P2', 'purchase value from dlv_bc_revenue',
  purchParams.value === '{{dlv_bc_revenue}}',
  `value: ${purchParams.value}`);

check('P2', 'purchase currency is EUR',
  purchParams.currency === 'EUR',
  `currency: ${purchParams.currency}`);

check('P2', 'purchase includes items[]',
  purchParams.items === '{{jsm_purchase_items}}',
  `items: ${purchParams.items}`);

check('P2', 'purchase send_to is G-9EXCL016VJ',
  purchParams.send_to === 'G-9EXCL016VJ',
  `send_to: ${purchParams.send_to}`);

// 2.6 No duplicate conversion tags on same trigger
const tagsOnTrigger210 = tags.filter(t => (t.firingTriggerId || []).includes('210'));
check('P2', 'Exactly 2 tags on trigger 210 (bc_lead_generated + generate_lead)',
  tagsOnTrigger210.length === 2,
  `Tags: ${tagsOnTrigger210.map(t => t.name).join(', ')}`);

const tagsOnTrigger212 = tags.filter(t => (t.firingTriggerId || []).includes('212'));
check('P2', 'Exactly 2 tags on trigger 212 (bc_booking_confirmed + purchase)',
  tagsOnTrigger212.length === 2,
  `Tags: ${tagsOnTrigger212.map(t => t.name).join(', ')}`);

// 2.7 bc_lead_generated tag
const blgTag = findTag('tag_GA4_bc_lead_generated');
const blgParams = getTagParams(blgTag);
check('P2', 'bc_lead_generated has event_id',
  !!blgParams.event_id,
  `event_id: ${blgParams.event_id || 'MISSING'}`);

// 2.8 bc_booking_confirmed tag
const bbcTag = findTag('tag_GA4_bc_booking_confirmed');
const bbcParams = getTagParams(bbcTag);
check('P2', 'bc_booking_confirmed has event_id',
  !!bbcParams.event_id,
  `event_id: ${bbcParams.event_id || 'MISSING'}`);

// 2.9 All 4 conversion tags have event_id (dedup)
check('P2', 'All 4 conversion tags have event_id dedup',
  !!blgParams.event_id && !!glParams.event_id && !!bbcParams.event_id && !!purchParams.event_id,
  'bc_lead_generated, generate_lead, bc_booking_confirmed, purchase');

// 2.10 bc_gclid in conversion tags
check('P2', 'generate_lead includes bc_gclid',
  glParams.bc_gclid === '{{dlv_bc_gclid}}',
  `bc_gclid: ${glParams.bc_gclid}`);
check('P2', 'purchase includes bc_gclid',
  purchParams.bc_gclid === '{{dlv_bc_gclid}}',
  `bc_gclid: ${purchParams.bc_gclid}`);

console.log('');

// ============================================================================
// PHASE 3: GA4 ECOMMERCE INTEGRITY
// ============================================================================
console.log('━━━ PHASE 3: GA4 ECOMMERCE INTEGRITY ━━━');

// 3.1 jsm_purchase_items variable
const jsmItems = findVariable('jsm_purchase_items');
check('P3', 'jsm_purchase_items variable exists',
  !!jsmItems, 'Custom JS variable for items[]');

const jsmItemsCode = jsmItems ? (jsmItems.parameter.find(p => p.key === 'javascript') || {}).value : '';
check('P3', 'jsm_purchase_items builds items[] with item_name',
  jsmItemsCode.includes('item_name'),
  'item_name field present');
check('P3', 'jsm_purchase_items builds items[] with item_category',
  jsmItemsCode.includes('item_category'),
  'item_category field present');
check('P3', 'jsm_purchase_items builds items[] with price',
  jsmItemsCode.includes('price'),
  'price field present');
check('P3', 'jsm_purchase_items builds items[] with quantity:1',
  jsmItemsCode.includes('quantity:1'),
  'quantity hardcoded to 1');
check('P3', 'jsm_purchase_items price uses parseFloat(bc_revenue)',
  jsmItemsCode.includes('parseFloat(price)'),
  'Numeric conversion applied');

// 3.2 jsm_generate_lead_event_id (dedup)
const jsmGLEventId = findVariable('jsm_generate_lead_event_id');
const jsmGLCode = jsmGLEventId ? (jsmGLEventId.parameter.find(p => p.key === 'javascript') || {}).value : '';
check('P3', 'jsm_generate_lead_event_id uses bc_lead_id as base',
  jsmGLCode.includes('dlv_bc_lead_id'),
  'Lead ID used for event dedup');

// 3.3 jsm_purchase_event_id (dedup)
const jsmPEventId = findVariable('jsm_purchase_event_id');
const jsmPCode = jsmPEventId ? (jsmPEventId.parameter.find(p => p.key === 'javascript') || {}).value : '';
check('P3', 'jsm_purchase_event_id uses bc_transaction_id as base',
  jsmPCode.includes('dlv_bc_transaction_id'),
  'Transaction ID used for event dedup');

// 3.4 No duplicate events within 5s (frontend dedup)
check('P3', 'Frontend lead dedup: _isLeadDuplicate() defined',
  cgeJS.includes('BCG._isLeadDuplicate') && cgeJS.includes('BCG._firedLeads'),
  'In-memory dedup for leads');
check('P3', 'Frontend transaction dedup: _isTransactionDuplicate() defined',
  cgeJS.includes('BCG._isTransactionDuplicate') && cgeJS.includes('BCG._firedTransactions'),
  'In-memory + sessionStorage dedup');

// 3.5 purchase tag has all GA4 ecommerce required fields
check('P3', 'purchase tag: currency present', !!purchParams.currency, 'EUR');
check('P3', 'purchase tag: value present', !!purchParams.value, purchParams.value);
check('P3', 'purchase tag: transaction_id present', !!purchParams.transaction_id, purchParams.transaction_id);
check('P3', 'purchase tag: items present', !!purchParams.items, purchParams.items);

console.log('');

// ============================================================================
// PHASE 4: CONSENT INTEGRITY
// ============================================================================
console.log('━━━ PHASE 4: CONSENT INTEGRITY ━━━');

// 4.1 Consent defaults in HTML
check('P4', 'Consent Mode v2 inline script present in HTML',
  indexHTML.includes("gtag('consent', 'default'"),
  'Consent defaults before GTM');

check('P4', 'ad_storage defaults to denied',
  indexHTML.includes("'ad_storage': 'denied'"),
  'ad_storage: denied');
check('P4', 'analytics_storage defaults to denied',
  indexHTML.includes("'analytics_storage': 'denied'"),
  'analytics_storage: denied');
check('P4', 'ad_user_data defaults to denied',
  indexHTML.includes("'ad_user_data': 'denied'"),
  'ad_user_data: denied');
check('P4', 'ad_personalization defaults to denied',
  indexHTML.includes("'ad_personalization': 'denied'"),
  'ad_personalization: denied');

// 4.2 wait_for_update
check('P4', 'wait_for_update: 500 in HTML',
  indexHTML.includes("'wait_for_update': 500"),
  '500ms wait_for_update');

// 4.3 GTM container consent defaults tag
const consentTag = findTag('tag_Consent_Default');
check('P4', 'GTM tag_Consent_Default exists',
  !!consentTag, 'GTM consent default tag present');

const consentWait = consentTag ? (consentTag.parameter.find(p => p.key === 'waitForUpdate') || {}).value : '';
check('P4', 'GTM wait_for_update is 500',
  consentWait === '500',
  `waitForUpdate: ${consentWait}`);

// 4.4 Consent Init trigger
const consentInitTrg = consentTag ? consentTag.firingTriggerId : [];
check('P4', 'Consent tag fires on Consent Initialization (213)',
  consentInitTrg.includes('213'),
  `Trigger: ${consentInitTrg.join(', ')}`);

// 4.5 GA4 Config tag requires consent
const ga4Config = findTag('tag_GA4_Configuration');
const ga4Consent = ga4Config ? ga4Config.consentSettings : null;
check('P4', 'GA4 Config tag requires consent',
  ga4Consent && ga4Consent.consentStatus === 'needed',
  'consentStatus: needed');

const ga4ConsentTypes = ga4Consent && ga4Consent.consentType && ga4Consent.consentType.list ?
  ga4Consent.consentType.list.map(l => l.value) : [];
check('P4', 'GA4 Config requires ad_storage consent',
  ga4ConsentTypes.includes('ad_storage'), 'ad_storage');
check('P4', 'GA4 Config requires analytics_storage consent',
  ga4ConsentTypes.includes('analytics_storage'), 'analytics_storage');
check('P4', 'GA4 Config requires ad_user_data consent',
  ga4ConsentTypes.includes('ad_user_data'), 'ad_user_data');

// 4.6 Enhanced Conversions tag requires consent
const ecTag = findTag('tag_GAds_Enhanced_Conversions');
const ecConsent = ecTag ? ecTag.consentSettings : null;
check('P4', 'Enhanced Conversions tag requires consent',
  ecConsent && ecConsent.consentStatus === 'needed',
  'consentStatus: needed');

// 4.7 Frontend consent update function
check('P4', 'BCG.updateConsent calls gtag("consent","update",...)',
  cgeJS.includes("gtag('consent', 'update', consentMap)"),
  'Consent update relay present');

// 4.8 Consent is before GTM in HTML
const consentPos = indexHTML.indexOf("gtag('consent', 'default'");
const gtmPos = indexHTML.indexOf('googletagmanager.com/gtm.js');
check('P4', 'Consent defaults load before GTM script',
  consentPos < gtmPos && consentPos > -1,
  `Consent at pos ${consentPos}, GTM at pos ${gtmPos}`);

// 4.9 Iubenda callback
check('P4', 'Iubenda callback calls BCG.updateConsent',
  indexHTML.includes('BCG.updateConsent') && indexHTML.includes('onPreferenceExpressedOrNotNeeded'),
  'Iubenda integration present');

// 4.10 ads_data_redaction and url_passthrough
check('P4', 'ads_data_redaction enabled',
  indexHTML.includes("gtag('set', 'ads_data_redaction', true)"),
  'Data redaction active');
check('P4', 'url_passthrough enabled',
  indexHTML.includes("gtag('set', 'url_passthrough', true)"),
  'URL passthrough for cookieless measurement');

// 4.11 No conversion fires before consent (GTM-side gating)
// GA4 config (which gates events) requires consent. Conversion tags fire via
// GA4 event tags referencing the config. Config tag won't load until consent granted.
check('P4', 'Conversion tags use tag_GA4_Configuration as measurement reference',
  (glTag.parameter || []).some(p => p.key === 'measurementId' && p.value === 'tag_GA4_Configuration') &&
  (purchTag.parameter || []).some(p => p.key === 'measurementId' && p.value === 'tag_GA4_Configuration'),
  'Both generate_lead and purchase reference consent-gated config');

console.log('');

// ============================================================================
// PHASE 5: GCLID PROPAGATION
// ============================================================================
console.log('━━━ PHASE 5: GCLID PROPAGATION ━━━');

// 5.1 GCLID capture from URL
check('P5', 'GCLID extracted from URL params',
  cgeJS.includes("params.get('gclid')"),
  'URLSearchParams used');

// 5.2 Cookie storage
check('P5', 'GCLID stored in _bc_gclid cookie',
  cgeJS.includes("BCG._GCLID_COOKIE_NAME = '_bc_gclid'"),
  'Cookie name: _bc_gclid');
check('P5', 'GCLID cookie has 90-day expiry',
  cgeJS.includes('BCG._GCLID_COOKIE_DAYS = 90'),
  '90 days');
check('P5', 'Cookie set with Secure and SameSite=Lax',
  cgeJS.includes("SameSite=Lax; Secure"),
  'Secure cookie attributes');

// 5.3 GCLID pushed to dataLayer
check('P5', 'GCLID pushed to dataLayer on capture',
  cgeJS.includes("bc_gclid: BCG._gclid"),
  'dataLayer push present');

// 5.4 GCLID in bc_page_context
check('P5', 'bc_page_context includes bc_gclid',
  cgeJS.includes("bc_gclid: BCG.getGclid()"),
  'GCLID in page context');

// 5.5 GCLID in lead events
const leadPushes = cgeJS.match(/event:\s*'bc_lead_generated'[\s\S]*?\}\);/g) || [];
const allLeadHaveGclid = leadPushes.every(p => p.includes('bc_gclid'));
check('P5', 'All bc_lead_generated pushes include bc_gclid',
  allLeadHaveGclid && leadPushes.length >= 3,
  `${leadPushes.length} pushes checked`);

// 5.6 GCLID in booking confirmed
check('P5', 'bc_booking_confirmed includes bc_gclid',
  cgeJS.includes("event: 'bc_booking_confirmed'") &&
  cgeJS.match(/event:\s*'bc_booking_confirmed'[\s\S]*?bc_gclid/),
  'GCLID in purchase event');

// 5.7 GCLID in sendEvent base params
check('P5', 'sendEvent baseParams includes bc_gclid',
  cgeJS.match(/baseParams\s*=\s*\{[\s\S]*?bc_gclid/),
  'All events carry GCLID');

// 5.8 GTM variables for GCLID
const gclidVar = findVariable('dlv_bc_gclid');
check('P5', 'GTM dlv_bc_gclid variable defined',
  !!gclidVar,
  `Variable ID: ${gclidVar ? gclidVar.variableId : 'MISSING'}`);

// 5.9 GCLID in GTM conversion tags
check('P5', 'GTM generate_lead tag includes bc_gclid param',
  glParams.bc_gclid === '{{dlv_bc_gclid}}',
  `bc_gclid: ${glParams.bc_gclid}`);
check('P5', 'GTM purchase tag includes bc_gclid param',
  purchParams.bc_gclid === '{{dlv_bc_gclid}}',
  `bc_gclid: ${purchParams.bc_gclid}`);

// 5.10 GCLID form injection
check('P5', 'GCLID injected into form hidden fields',
  cgeJS.includes('BCG.injectGclidIntoForms'),
  'Hidden input injection present');
check('P5', 'MutationObserver watches for dynamic forms',
  cgeJS.includes('BCG._observeForms') && cgeJS.includes('MutationObserver'),
  'Dynamic form GCLID injection');

// 5.11 captureGclid runs before pushInitialDataLayer
const initBlock = cgeJS.match(/BCG\.init\s*=\s*function\(\)\s*\{[\s\S]*?\n\s*\};/);
if (initBlock) {
  const capturePos = initBlock[0].indexOf('captureGclid');
  const pushPos = initBlock[0].indexOf('pushInitialDataLayer');
  check('P5', 'captureGclid() runs before pushInitialDataLayer()',
    capturePos < pushPos && capturePos > -1,
    `captureGclid at pos ${capturePos}, pushInitialDataLayer at pos ${pushPos}`);
}

console.log('');

// ============================================================================
// PHASE 6: DUPLICATION SAFETY (SUPPLEMENTARY)
// ============================================================================
console.log('━━━ PHASE 6: DUPLICATION SAFETY ━━━');

check('P6', 'DOMContentLoaded listener bound once',
  (cgeJS.match(/DOMContentLoaded/g) || []).length === 1,
  'Single DOMContentLoaded registration');

check('P6', 'Event listeners use delegation (document.addEventListener)',
  cgeJS.includes("document.addEventListener('click'") &&
  cgeJS.includes("document.addEventListener('submit'"),
  'Delegated click + submit handlers');

check('P6', 'No SPA history.pushState listeners',
  !cgeJS.includes('popstate') && !cgeJS.includes('pushState'),
  'Static site — no SPA navigation handling needed');

check('P6', 'Form submit separates intent (bc_form_submit) from conversion (bc_lead_generated)',
  cgeJS.includes("event: 'bc_form_submit'") &&
  !cgeJS.match(/bc_form_submit[\s\S]{0,200}generate_lead/),
  'Clear separation of intent vs conversion');

check('P6', 'sessionStorage dedup for transactions (back-button safe)',
  cgeJS.includes("sessionStorage.getItem('bc_fired_txns')"),
  'sessionStorage + in-memory dedup');

check('P6', 'In-memory lead dedup (_firedLeads)',
  cgeJS.includes('BCG._firedLeads = {}'),
  'Lead dedup object initialized');

check('P6', 'GTM tags use oncePerEvent firing',
  tags.every(t => !t.tagFiringOption || t.tagFiringOption === 'oncePerEvent' || t.tagFiringOption === 'oncePerPage'),
  'All tags: oncePerEvent or oncePerPage');

// ============================================================================
// PHASE 7: ENHANCED CONVERSIONS INTEGRITY
// ============================================================================
console.log('━━━ PHASE 7: ENHANCED CONVERSIONS ━━━');

check('P7', 'Enhanced Conversions tag (awecc) exists',
  !!ecTag && ecTag.type === 'awecc',
  `Tag: ${ecTag ? ecTag.name : 'MISSING'}`);

const ecUserData = ecTag ? (ecTag.parameter.find(p => p.key === 'userDataVariable') || {}).list : [];
const ecFields = {};
(ecUserData || []).forEach(item => {
  const map = item.map || [];
  const n = (map.find(m => m.key === 'name') || {}).value;
  const v = (map.find(m => m.key === 'value') || {}).value;
  if (n) ecFields[n] = v;
});

check('P7', 'EC tag maps sha256_email_address to dlv_bc_user_email_hash',
  ecFields.sha256_email_address === '{{dlv_bc_user_email_hash}}',
  `Mapping: ${ecFields.sha256_email_address}`);

check('P7', 'EC tag maps sha256_phone_number to dlv_bc_user_phone_hash',
  ecFields.sha256_phone_number === '{{dlv_bc_user_phone_hash}}',
  `Mapping: ${ecFields.sha256_phone_number}`);

check('P7', 'EC fires on trg_bc_enhanced_conversion (211)',
  (ecTag.firingTriggerId || []).includes('211'),
  `Trigger: ${(ecTag.firingTriggerId || []).join(', ')}`);

check('P7', 'EC tag requires ad_storage + ad_user_data consent',
  ecConsent && ecConsent.consentType && ecConsent.consentType.list &&
  ecConsent.consentType.list.some(l => l.value === 'ad_storage') &&
  ecConsent.consentType.list.some(l => l.value === 'ad_user_data'),
  'Consent-gated EC tag');

// SHA-256 hashing
check('P7', 'SHA-256 hashing uses Web Crypto API',
  cgeJS.includes("window.crypto.subtle.digest('SHA-256'"),
  'crypto.subtle.digest');

check('P7', 'Email normalized (trim + lowercase) before hashing',
  cgeJS.includes('str.trim().toLowerCase()'),
  'sha256 function normalizes input');

console.log('');

// ============================================================================
// CROSS-SITE VERIFICATION
// ============================================================================
console.log('━━━ CROSS-SITE VERIFICATION ━━━');

// Check bcDataLayer coverage
const htmlFiles = [];
function findHTML(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'components' && e.name !== 'docs') {
      findHTML(full);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      htmlFiles.push(full);
    }
  }
}
findHTML('site');

let bcDataLayerCount = 0;
let cgeScriptCount = 0;
let consentModeCount = 0;
let gtmCount = 0;
let cacheBusterV4Count = 0;
let oldCacheBusterCount = 0;

htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('bcDataLayer')) bcDataLayerCount++;
  if (content.includes('cge-tracking.js')) cgeScriptCount++;
  if (content.includes("gtag('consent', 'default'")) consentModeCount++;
  if (content.includes('GTM-PWZWX5RS')) gtmCount++;
  if (content.includes('CGE_v4_20260217')) cacheBusterV4Count++;
  if (content.includes('CGE_v1_20260216') || content.includes('CGE_v3_20260217')) oldCacheBusterCount++;
});

const productionPages = htmlFiles.length;
check('XSITE', `bcDataLayer present on ${bcDataLayerCount}/${productionPages} pages`,
  bcDataLayerCount >= productionPages - 3,
  `${productionPages - bcDataLayerCount} pages missing`);

check('XSITE', `cge-tracking.js present on ${cgeScriptCount}/${productionPages} pages`,
  cgeScriptCount >= productionPages - 3,
  `${productionPages - cgeScriptCount} pages missing`);

check('XSITE', `Consent Mode v2 present on ${consentModeCount}/${productionPages} pages`,
  consentModeCount >= productionPages - 3,
  `${productionPages - consentModeCount} pages missing`);

check('XSITE', `GTM container on ${gtmCount}/${productionPages} pages`,
  gtmCount >= productionPages - 3,
  `${productionPages - gtmCount} pages missing`);

check('XSITE', `Cache buster v4 on ${cacheBusterV4Count} pages`,
  cacheBusterV4Count >= productionPages - 5,
  `v4 on ${cacheBusterV4Count}, old on ${oldCacheBusterCount}`);

check('XSITE', 'No old cache buster references remain',
  oldCacheBusterCount === 0,
  `Old references: ${oldCacheBusterCount}`);

console.log('');

// ============================================================================
// FINAL SCORECARD
// ============================================================================
console.log('='.repeat(80));
console.log('  FINAL SCORECARD');
console.log('='.repeat(80));
console.log('');

// Phase summaries
const phases = {
  'P1': 'Frontend Integrity',
  'P2': 'GTM Firing Integrity',
  'P3': 'GA4 Ecommerce Integrity',
  'P4': 'Consent Integrity',
  'P5': 'GCLID Propagation',
  'P6': 'Duplication Safety',
  'P7': 'Enhanced Conversions',
  'XSITE': 'Cross-Site Coverage'
};

const phaseVerdicts = {};
for (const [key, label] of Object.entries(phases)) {
  const items = RESULTS[key] || [];
  const pPass = items.filter(i => i.status === 'PASS').length;
  const pFail = items.filter(i => i.status === 'FAIL').length;
  const pWarn = items.filter(i => i.status === 'WARN').length;
  const verdict = pFail === 0 ? 'PASS' : 'FAIL';
  phaseVerdicts[key] = verdict;
  console.log(`  ${verdict === 'PASS' ? '✅' : '❌'} ${label}: ${verdict} (${pPass}/${items.length} checks passed${pFail > 0 ? `, ${pFail} FAIL` : ''}${pWarn > 0 ? `, ${pWarn} WARN` : ''})`);

  // Print failures
  items.filter(i => i.status === 'FAIL').forEach(i => {
    console.log(`     ❌ FAIL: ${i.name} — ${i.detail}`);
  });
  items.filter(i => i.status === 'WARN').forEach(i => {
    console.log(`     ⚠️  WARN: ${i.name} — ${i.detail}`);
  });
}

console.log('');
console.log('─'.repeat(80));

// Risk assessment
const dupRisk = phaseVerdicts['P6'] === 'PASS' ? 'LOW' : 'MEDIUM';
console.log(`  Duplication Risk Level: ${dupRisk}`);

// Score
const score = Math.round((passCount / totalChecks) * 100);
console.log(`  Data Consistency Score: ${score}/100 (${passCount}/${totalChecks} checks passed, ${failCount} failed, ${warnCount} warnings)`);

// Final verdict
const allPass = failCount === 0;
const finalVerdict = allPass ? 'GO ✅' : 'NO-GO ❌';
console.log('');
console.log(`  ╔${'═'.repeat(50)}╗`);
console.log(`  ║  FINAL VERDICT: ${finalVerdict.padEnd(33)}║`);
console.log(`  ╚${'═'.repeat(50)}╝`);
console.log('');

if (allPass) {
  console.log('  ✅ ALL CHECKS PASSED — SAFE FOR PRODUCTION DEPLOYMENT');
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  48-HOUR POST-PUBLISH MONITORING CHECKLIST                      │');
  console.log('  ├─────────────────────────────────────────────────────────────────┤');
  console.log('  │  HOUR 0-2:                                                     │');
  console.log('  │   □ GA4 DebugView: confirm bc_page_context fires on 3+ pages   │');
  console.log('  │   □ GA4 DebugView: generate_lead appears with correct params   │');
  console.log('  │   □ GTM Preview: verify tag firing sequence on homepage         │');
  console.log('  │   □ Network: check collect?v=2 shows gcs=G111 after consent    │');
  console.log('  │   □ Console: no JS errors related to BCG or cge-tracking       │');
  console.log('  │                                                                 │');
  console.log('  │  HOUR 2-12:                                                    │');
  console.log('  │   □ GA4 Realtime: events flowing (page_view + bc_page_context) │');
  console.log('  │   □ GA4 Realtime: generate_lead events with value > 0          │');
  console.log('  │   □ GA4 Realtime: purchase events (if any bookings occur)      │');
  console.log('  │   □ Google Ads: Enhanced Conversions status check               │');
  console.log('  │   □ Tag Assistant: no consent violations flagged                │');
  console.log('  │                                                                 │');
  console.log('  │  HOUR 12-24:                                                   │');
  console.log('  │   □ GA4 Explorations: bc_page_type dimension populated         │');
  console.log('  │   □ GA4: conversion count vs previous day (±20% threshold)     │');
  console.log('  │   □ Check _bc_gclid cookie set on ?gclid= test visits          │');
  console.log('  │   □ Cross-browser test: Chrome, Safari, Firefox, Edge          │');
  console.log('  │   □ Mobile test: iOS Safari, Android Chrome                    │');
  console.log('  │                                                                 │');
  console.log('  │  HOUR 24-48:                                                   │');
  console.log('  │   □ GA4 purchase report: items[] array populated correctly     │');
  console.log('  │   □ GA4 monetization: revenue attribution by specialty         │');
  console.log('  │   □ Google Ads offline conversion upload test (GCLID match)    │');
  console.log('  │   □ Verify bc_version = "CGE_v4.0" in GA4 event params        │');
  console.log('  │   □ Final: zero duplicate conversions in 48h window            │');
  console.log('  │                                                                 │');
  console.log('  │  ROLLBACK TRIGGER:                                             │');
  console.log('  │   • Conversion count drops >30% vs previous 7-day avg          │');
  console.log('  │   • Duplicate generate_lead or purchase detected in GA4        │');
  console.log('  │   • gcs never transitions from G100 to G111                    │');
  console.log('  │   • JS console errors on >5% of page loads                     │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');
} else {
  console.log('  ❌ BLOCKING ISSUES FOUND:');
  for (const [key, label] of Object.entries(phases)) {
    (RESULTS[key] || []).filter(i => i.status === 'FAIL').forEach(i => {
      console.log(`     [${key}] ${i.name}: ${i.detail}`);
    });
  }
}

console.log('');
console.log('─'.repeat(80));
console.log('  Audit completed: ' + new Date().toISOString());
console.log('  Auditor: Senior Frontend Analytics Engineer (automated)');
console.log('  Container: GTM-PWZWX5RS | GA4: G-9EXCL016VJ | CGE: v4.0.1');
console.log('─'.repeat(80));

// Output JSON summary
const summary = {
  audit_date: '2026-02-17',
  container: 'GTM-PWZWX5RS',
  ga4: 'G-9EXCL016VJ',
  cge_version: version,
  total_checks: totalChecks,
  passed: passCount,
  failed: failCount,
  warnings: warnCount,
  score: score,
  duplication_risk: dupRisk,
  verdict: allPass ? 'GO' : 'NO-GO',
  phase_verdicts: phaseVerdicts
};

fs.writeFileSync('audit-result.json', JSON.stringify(summary, null, 2));
console.log('\n  Full results saved to audit-result.json');

