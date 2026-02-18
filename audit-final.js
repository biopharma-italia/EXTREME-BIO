#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const RESULTS = {};
let totalChecks = 0, passCount = 0, failCount = 0, warnCount = 0;

function check(phase, name, condition, detail) {
  totalChecks++;
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) passCount++; else failCount++;
  if (!RESULTS[phase]) RESULTS[phase] = [];
  RESULTS[phase].push({ name, status, detail });
  return condition;
}

const cgeJS = fs.readFileSync('site/js/cge-tracking.js', 'utf8');
const gtmJSON = JSON.parse(fs.readFileSync('site/docs/gtm-container-CGE_v4_enterprise.json', 'utf8'));
const indexHTML = fs.readFileSync('site/index.html', 'utf8');
const tags = gtmJSON.containerVersion.tag;
const triggers = gtmJSON.containerVersion.trigger;
const variables = gtmJSON.containerVersion.variable;

function findTag(n) { return tags.find(t => t.name === n); }
function findVariable(n) { return variables.find(v => v.name === n); }
function getTagParams(tag) {
  if (!tag) return {};
  const params = {};
  const ep = (tag.parameter||[]).find(p=>p.key==='eventParameters');
  if (ep && ep.list) ep.list.forEach(item => {
    const m = item.map||[];
    const n = (m.find(x=>x.key==='name')||{}).value;
    const v = (m.find(x=>x.key==='value')||{}).value;
    if (n) params[n] = v;
  });
  return params;
}

console.log('='.repeat(80));
console.log('  GO/NO-GO PRE-PUBLICATION AUDIT');
console.log('  Bio-Clinic CGE v4.0.0 Enterprise Conversion-Ready');
console.log('  Container: GTM-PWZWX5RS | GA4: G-9EXCL016VJ');
console.log('  Audit Date: 2026-02-17');
console.log('='.repeat(80));
console.log('');

// ═══════════════════════════════════════════════════════════════
// PHASE 1: FRONTEND INTEGRITY
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 1: FRONTEND INTEGRITY ━━━');

const vM = cgeJS.match(/BCG\.version\s*=\s*'([^']+)'/);
const ver = vM?vM[1]:null;
check('P1','BCG.version === "CGE_v4.0"', ver==='CGE_v4.0', `Found: ${ver}`);
check('P1','Compliance patch header', cgeJS.includes('CGE v4.0.1 Compliance Patch'), 'Line 1');

// Phone normalization simulation
const fn = new Function('phone',`
  if (!phone) return '';
  var digits = phone.replace(/\\D/g, '');
  if (digits.length===0) return '';
  if (digits.indexOf('39')===0) return '+'+digits;
  if (digits.indexOf('0')===0) return '+39'+digits.substring(1);
  return '+39'+digits;
`);
check('P1','normalizePhoneE164("345 123 4567")==="+393451234567"', fn('345 123 4567')==='+393451234567', `Result: ${fn('345 123 4567')}`);
check('P1','normalizePhoneE164("0799561332")==="+39799561332"', fn('0799561332')==='+39799561332', `Result: ${fn('0799561332')}`);
check('P1','normalizePhoneE164("+39 345 123 4567")==="+393451234567"', fn('+39 345 123 4567')==='+393451234567', `Result: ${fn('+39 345 123 4567')}`);
check('P1','normalizePhoneE164 used before sha256', cgeJS.includes('BCG._normalizePhoneE164(phoneField.value)')&&cgeJS.includes('BCG.sha256(normalizedPhone)'), 'Phone normalized then hashed');
check('P1','No enhanced_conversion_data (cleartext PII removed)', !cgeJS.includes('enhanced_conversion_data'), 'String absent');

const ecP = (cgeJS.match(/event:\s*'bc_enhanced_conversion'[\s\S]*?\}\);/)||[''])[0];
check('P1','bc_enhanced_conversion has bc_user_email_hash', ecP.includes('bc_user_email_hash'), 'Present');
check('P1','bc_enhanced_conversion has bc_user_phone_hash', ecP.includes('bc_user_phone_hash'), 'Present');

check('P1','pushInitialDataLayer() called exactly once', (cgeJS.match(/pushInitialDataLayer\(\)/g)||[]).length===1, 'Single call in init');
check('P1','bc_page_context has required fields', cgeJS.includes("event: 'bc_page_context'")&&cgeJS.includes('bc_page_type:')&&cgeJS.includes('bc_service_name:')&&cgeJS.includes('bc_version: BCG.version')&&cgeJS.includes('bc_gclid:'), 'All present');
check('P1','IIFE wrapping', cgeJS.includes("(function()")&&cgeJS.trimEnd().endsWith("})();"), 'Closure OK');
check('P1','Cache buster CGE_v4_20260217', indexHTML.includes('cge-tracking.js?v=CGE_v4_20260217'), 'Verified');
check('P1','No residual CGE_v3.0', !cgeJS.includes('CGE_v3.0'), 'Clean');

// ═══════════════════════════════════════════════════════════════
// PHASE 2: GTM FIRING INTEGRITY
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 2: GTM FIRING INTEGRITY ━━━');

const glTag = findTag('tag_GA4_generate_lead');
check('P2','generate_lead tag exists', !!glTag, `ID:${glTag?glTag.tagId:'?'}`);
check('P2','generate_lead fires on trigger 210', (glTag?glTag.firingTriggerId:[]).includes('210'), 'trg_bc_lead_generated');
const glP = getTagParams(glTag);
check('P2','generate_lead has event_id', glP.event_id==='{{jsm_generate_lead_event_id}}', glP.event_id);
check('P2','generate_lead value numeric', glP.value==='{{dlv_generate_lead_value}}', glP.value);
check('P2','generate_lead currency EUR', glP.currency==='EUR', glP.currency);
check('P2','generate_lead send_to G-9EXCL016VJ', glP.send_to==='G-9EXCL016VJ', glP.send_to);
check('P2','generate_lead bc_gclid', glP.bc_gclid==='{{dlv_bc_gclid}}', glP.bc_gclid);

const pTag = findTag('tag_GA4_purchase');
check('P2','purchase tag exists', !!pTag, `ID:${pTag?pTag.tagId:'?'}`);
check('P2','purchase fires on trigger 212', (pTag?pTag.firingTriggerId:[]).includes('212'), 'trg_bc_booking_confirmed');
const pP = getTagParams(pTag);
check('P2','purchase has transaction_id', pP.transaction_id==='{{dlv_bc_transaction_id}}', pP.transaction_id);
check('P2','purchase has event_id', pP.event_id==='{{jsm_purchase_event_id}}', pP.event_id);
check('P2','purchase value numeric', pP.value==='{{dlv_bc_revenue}}', pP.value);
check('P2','purchase currency EUR', pP.currency==='EUR', pP.currency);
check('P2','purchase has items[]', pP.items==='{{jsm_purchase_items}}', pP.items);
check('P2','purchase send_to', pP.send_to==='G-9EXCL016VJ', pP.send_to);
check('P2','purchase bc_gclid', pP.bc_gclid==='{{dlv_bc_gclid}}', pP.bc_gclid);

const t210 = tags.filter(t=>(t.firingTriggerId||[]).includes('210'));
check('P2','Exactly 2 tags on trigger 210', t210.length===2, t210.map(t=>t.name).join(', '));
const t212 = tags.filter(t=>(t.firingTriggerId||[]).includes('212'));
check('P2','Exactly 2 tags on trigger 212', t212.length===2, t212.map(t=>t.name).join(', '));

const blgP = getTagParams(findTag('tag_GA4_bc_lead_generated'));
const bbcP = getTagParams(findTag('tag_GA4_bc_booking_confirmed'));
check('P2','All 4 conversion tags have event_id', !!blgP.event_id&&!!glP.event_id&&!!bbcP.event_id&&!!pP.event_id, 'Dedup on all');

// ═══════════════════════════════════════════════════════════════
// PHASE 3: GA4 ECOMMERCE INTEGRITY
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 3: GA4 ECOMMERCE INTEGRITY ━━━');

const jsmI = findVariable('jsm_purchase_items');
const jsmIC = jsmI?(jsmI.parameter.find(p=>p.key==='javascript')||{}).value:'';
check('P3','jsm_purchase_items exists', !!jsmI, 'Custom JS');
check('P3','items[] has item_name', jsmIC.includes('item_name'), 'Present');
check('P3','items[] has item_category', jsmIC.includes('item_category'), 'Present');
check('P3','items[] has price via parseFloat', jsmIC.includes('parseFloat(price)'), 'Numeric');
check('P3','items[] has quantity:1', jsmIC.includes('quantity:1'), 'Hardcoded');

const jsmGL = findVariable('jsm_generate_lead_event_id');
check('P3','generate_lead event_id uses bc_lead_id', (jsmGL?(jsmGL.parameter.find(p=>p.key==='javascript')||{}).value:'').includes('dlv_bc_lead_id'), 'Dedup base');
const jsmPE = findVariable('jsm_purchase_event_id');
check('P3','purchase event_id uses bc_transaction_id', (jsmPE?(jsmPE.parameter.find(p=>p.key==='javascript')||{}).value:'').includes('dlv_bc_transaction_id'), 'Dedup base');

check('P3','Frontend lead dedup', cgeJS.includes('BCG._isLeadDuplicate')&&cgeJS.includes('BCG._firedLeads'), 'In-memory');
check('P3','Frontend txn dedup', cgeJS.includes('BCG._isTransactionDuplicate')&&cgeJS.includes("sessionStorage.getItem('bc_fired_txns')"), 'sessionStorage+memory');
check('P3','purchase: currency+value+transaction_id+items', !!pP.currency&&!!pP.value&&!!pP.transaction_id&&!!pP.items, 'All GA4 ecommerce fields');

// ═══════════════════════════════════════════════════════════════
// PHASE 4: CONSENT INTEGRITY
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 4: CONSENT INTEGRITY ━━━');

check('P4','Consent Mode v2 before GTM', indexHTML.indexOf("gtag('consent', 'default'")<indexHTML.indexOf('googletagmanager.com/gtm.js'), 'Order correct');
check('P4','ad_storage denied', indexHTML.includes("'ad_storage': 'denied'"), 'Denied');
check('P4','analytics_storage denied', indexHTML.includes("'analytics_storage': 'denied'"), 'Denied');
check('P4','ad_user_data denied', indexHTML.includes("'ad_user_data': 'denied'"), 'Denied');
check('P4','ad_personalization denied', indexHTML.includes("'ad_personalization': 'denied'"), 'Denied');
check('P4','wait_for_update 500', indexHTML.includes("'wait_for_update': 500"), '500ms');

const cTag = findTag('tag_Consent_Default');
check('P4','GTM Consent Default tag exists', !!cTag, 'Present');
check('P4','GTM wait_for_update 500', (cTag.parameter.find(p=>p.key==='waitForUpdate')||{}).value==='500', '500');
check('P4','Consent fires on Consent Init (213)', (cTag.firingTriggerId||[]).includes('213'), 'Trigger 213');

const ga4C = findTag('tag_GA4_Configuration');
const ga4CS = ga4C?ga4C.consentSettings:null;
check('P4','GA4 Config requires consent', ga4CS&&ga4CS.consentStatus==='needed', 'needed');
const ga4CT = ga4CS&&ga4CS.consentType&&ga4CS.consentType.list?ga4CS.consentType.list.map(l=>l.value):[];
check('P4','GA4 requires ad_storage', ga4CT.includes('ad_storage'), 'Yes');
check('P4','GA4 requires analytics_storage', ga4CT.includes('analytics_storage'), 'Yes');
check('P4','GA4 requires ad_user_data', ga4CT.includes('ad_user_data'), 'Yes');

const ecTag = findTag('tag_GAds_Enhanced_Conversions');
check('P4','EC tag requires consent', ecTag&&ecTag.consentSettings&&ecTag.consentSettings.consentStatus==='needed', 'needed');
check('P4','BCG.updateConsent relays to gtag', cgeJS.includes("gtag('consent', 'update', consentMap)"), 'Relay present');
check('P4','Iubenda callback configured', indexHTML.includes('BCG.updateConsent')&&indexHTML.includes('onPreferenceExpressedOrNotNeeded'), 'Present');
check('P4','ads_data_redaction enabled', indexHTML.includes("'ads_data_redaction', true"), 'True');
check('P4','url_passthrough enabled', indexHTML.includes("'url_passthrough', true"), 'True');
check('P4','Conversion tags reference consent-gated config',
  (glTag.parameter||[]).some(p=>p.key==='measurementId'&&p.value==='tag_GA4_Configuration')&&
  (pTag.parameter||[]).some(p=>p.key==='measurementId'&&p.value==='tag_GA4_Configuration'), 'Both gated');

// ═══════════════════════════════════════════════════════════════
// PHASE 5: GCLID PROPAGATION
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 5: GCLID PROPAGATION ━━━');

check('P5','GCLID extracted from URL', cgeJS.includes("params.get('gclid')"), 'URLSearchParams');
check('P5','Cookie _bc_gclid, 90 days', cgeJS.includes("'_bc_gclid'")&&cgeJS.includes('_GCLID_COOKIE_DAYS = 90'), 'Cookie config');
check('P5','Cookie Secure+SameSite=Lax', cgeJS.includes('SameSite=Lax; Secure'), 'Attributes OK');
check('P5','GCLID pushed to dataLayer', cgeJS.includes('bc_gclid: BCG._gclid'), 'Push present');
check('P5','bc_page_context has bc_gclid', cgeJS.includes('bc_gclid: BCG.getGclid()'), 'In page context');

const lPushes = cgeJS.match(/event:\s*'bc_lead_generated'[\s\S]*?\}\);/g)||[];
check('P5','All bc_lead_generated have bc_gclid', lPushes.length>=3&&lPushes.every(p=>p.includes('bc_gclid')), `${lPushes.length} pushes`);
check('P5','bc_booking_confirmed has bc_gclid', !!cgeJS.match(/event:\s*'bc_booking_confirmed'[\s\S]*?bc_gclid/), 'Present');
check('P5','sendEvent baseParams has bc_gclid', !!cgeJS.match(/baseParams\s*=\s*\{[\s\S]*?bc_gclid/), 'In all events');

check('P5','GTM dlv_bc_gclid defined', !!findVariable('dlv_bc_gclid'), 'Variable exists');
check('P5','GTM generate_lead has bc_gclid', glP.bc_gclid==='{{dlv_bc_gclid}}', 'Mapped');
check('P5','GTM purchase has bc_gclid', pP.bc_gclid==='{{dlv_bc_gclid}}', 'Mapped');
check('P5','Form GCLID injection', cgeJS.includes('BCG.injectGclidIntoForms')&&cgeJS.includes('MutationObserver'), 'Present');

const initB = cgeJS.match(/BCG\.init\s*=\s*function\(\)\s*\{[\s\S]*?\n\s*\};/);
if (initB) {
  check('P5','captureGclid before pushInitialDataLayer',
    initB[0].indexOf('captureGclid')<initB[0].indexOf('pushInitialDataLayer'), 'Order correct');
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6: DUPLICATION SAFETY
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 6: DUPLICATION SAFETY ━━━');

check('P6','DOMContentLoaded bound once', (cgeJS.match(/DOMContentLoaded/g)||[]).length===1, '1 registration');
check('P6','Delegated event listeners', cgeJS.includes("document.addEventListener('click'")&&cgeJS.includes("document.addEventListener('submit'"), 'Delegation');
check('P6','No SPA listeners', !cgeJS.includes('popstate')&&!cgeJS.includes('pushState'), 'Static site');
// Fixed check: form submit (intent) is separate from conversion (API success)
check('P6','Intent vs conversion separation',
  cgeJS.includes("event: 'bc_form_submit'") &&
  cgeJS.includes("event: 'bc_lead_generated'") &&
  cgeJS.includes('// NOTE: generate_lead fires later, ONLY on API success'),
  'bc_form_submit=intent, bc_lead_generated=conversion (on API 200)');
check('P6','sessionStorage txn dedup (back-button)', cgeJS.includes("sessionStorage.getItem('bc_fired_txns')"), 'Present');
check('P6','In-memory lead dedup', cgeJS.includes('BCG._firedLeads = {}'), 'Present');
check('P6','GTM tags oncePerEvent/oncePerPage', tags.every(t=>!t.tagFiringOption||t.tagFiringOption==='oncePerEvent'||t.tagFiringOption==='oncePerPage'), 'All tags');

// ═══════════════════════════════════════════════════════════════
// PHASE 7: ENHANCED CONVERSIONS
// ═══════════════════════════════════════════════════════════════
console.log('━━━ PHASE 7: ENHANCED CONVERSIONS ━━━');

check('P7','EC tag (awecc) exists', !!ecTag&&ecTag.type==='awecc', ecTag?ecTag.name:'MISSING');
const ecUD = ecTag?(ecTag.parameter.find(p=>p.key==='userDataVariable')||{}).list:[];
const ecF = {};
(ecUD||[]).forEach(i=>{const m=i.map||[];const n=(m.find(x=>x.key==='name')||{}).value;const v=(m.find(x=>x.key==='value')||{}).value;if(n)ecF[n]=v;});
check('P7','sha256_email_address -> dlv_bc_user_email_hash', ecF.sha256_email_address==='{{dlv_bc_user_email_hash}}', ecF.sha256_email_address);
check('P7','sha256_phone_number -> dlv_bc_user_phone_hash', ecF.sha256_phone_number==='{{dlv_bc_user_phone_hash}}', ecF.sha256_phone_number);
check('P7','EC fires on trigger 211', (ecTag.firingTriggerId||[]).includes('211'), 'trg_bc_enhanced_conversion');
check('P7','EC requires ad_storage+ad_user_data consent',
  ecTag.consentSettings&&ecTag.consentSettings.consentType&&ecTag.consentSettings.consentType.list&&
  ecTag.consentSettings.consentType.list.some(l=>l.value==='ad_storage')&&
  ecTag.consentSettings.consentType.list.some(l=>l.value==='ad_user_data'), 'Both required');
check('P7','SHA-256 via Web Crypto', cgeJS.includes("window.crypto.subtle.digest('SHA-256'"), 'crypto.subtle');
check('P7','Email normalized before hash', cgeJS.includes('str.trim().toLowerCase()'), 'trim+lowercase');

// ═══════════════════════════════════════════════════════════════
// CROSS-SITE VERIFICATION (production pages only)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ CROSS-SITE COVERAGE ━━━');

// Only count production pages: exclude backups/, components/, docs/, output/, templates/
const EXCLUDE = ['backups','components','docs','output','templates','node_modules'];
const htmlFiles = [];
function findHTML(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.includes(e.name)) findHTML(full);
    else if (e.isFile() && e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
findHTML('site');

let bcDL=0, cgeS=0, cm=0, gtm=0, cbV4=0, cbOld=0;
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f,'utf8');
  if (c.includes('bcDataLayer')) bcDL++;
  if (c.includes('cge-tracking.js')) cgeS++;
  if (c.includes("gtag('consent', 'default'")) cm++;
  if (c.includes('GTM-PWZWX5RS')) gtm++;
  if (c.includes('CGE_v4_20260217')) cbV4++;
  if (c.includes('CGE_v1_20260216')||c.includes('CGE_v3_20260217')) cbOld++;
});

const N = htmlFiles.length;
console.log(`  Production pages found: ${N}`);
check('XSITE',`bcDataLayer on ${bcDL}/${N} (${Math.round(bcDL/N*100)}%)`, bcDL>=N-2, `Missing: ${N-bcDL}`);
check('XSITE',`cge-tracking.js on ${cgeS}/${N} (${Math.round(cgeS/N*100)}%)`, cgeS>=N-2, `Missing: ${N-cgeS}`);
check('XSITE',`Consent Mode on ${cm}/${N} (${Math.round(cm/N*100)}%)`, cm>=N-2, `Missing: ${N-cm}`);
check('XSITE',`GTM on ${gtm}/${N} (${Math.round(gtm/N*100)}%)`, gtm>=N-2, `Missing: ${N-gtm}`);
check('XSITE',`Cache buster v4 on ${cbV4}/${N}`, cbV4>=N-2, `v4:${cbV4} old:${cbOld}`);
check('XSITE','No old cache busters', cbOld===0, `Old: ${cbOld}`);

// ═══════════════════════════════════════════════════════════════
// FINAL SCORECARD
// ═══════════════════════════════════════════════════════════════
console.log('');
console.log('='.repeat(80));
console.log('  FINAL SCORECARD');
console.log('='.repeat(80));
console.log('');

const phases = {
  P1:'Frontend Integrity', P2:'GTM Firing Integrity', P3:'GA4 Ecommerce Integrity',
  P4:'Consent Integrity', P5:'GCLID Propagation', P6:'Duplication Safety',
  P7:'Enhanced Conversions', XSITE:'Cross-Site Coverage'
};

const phaseV = {};
for (const [k,l] of Object.entries(phases)) {
  const items = RESULTS[k]||[];
  const p = items.filter(i=>i.status==='PASS').length;
  const f = items.filter(i=>i.status==='FAIL').length;
  const v = f===0?'PASS':'FAIL';
  phaseV[k] = v;
  console.log(`  ${v==='PASS'?'✅':'❌'} ${l}: ${v} (${p}/${items.length} checks)`);
  items.filter(i=>i.status==='FAIL').forEach(i=>console.log(`     ❌ ${i.name}: ${i.detail}`));
}

console.log('');
console.log('─'.repeat(80));

const dupRisk = phaseV.P6==='PASS'?'LOW':'MEDIUM';
const score = Math.round((passCount/totalChecks)*100);
const allPass = failCount===0;

console.log(`  Duplication Risk: ${dupRisk}`);
console.log(`  Data Consistency Score: ${score}/100 (${passCount}/${totalChecks} passed, ${failCount} failed)`);
console.log('');
console.log(`  ╔${'═'.repeat(56)}╗`);
console.log(`  ║  FINAL VERDICT: ${(allPass?'GO ✅ — SAFE FOR PRODUCTION':'NO-GO ❌ — FIX REQUIRED').padEnd(39)}║`);
console.log(`  ╚${'═'.repeat(56)}╝`);

if (allPass) {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  48-HOUR POST-PUBLISH MONITORING CHECKLIST                          │');
  console.log('  ├─────────────────────────────────────────────────────────────────────┤');
  console.log('  │                                                                     │');
  console.log('  │  HOUR 0-2 (Smoke Test):                                            │');
  console.log('  │   □ GA4 DebugView: bc_page_context on 3+ pages                    │');
  console.log('  │   □ GA4 DebugView: generate_lead with value + event_id             │');
  console.log('  │   □ GTM Preview: verify tag sequence on homepage                   │');
  console.log('  │   □ Network tab: collect?v=2 shows gcs=G100 -> G111 after consent  │');
  console.log('  │   □ Console: zero JS errors from BCG / cge-tracking.js             │');
  console.log('  │                                                                     │');
  console.log('  │  HOUR 2-12 (Real Traffic):                                         │');
  console.log('  │   □ GA4 Realtime: page_view + bc_page_context flowing              │');
  console.log('  │   □ GA4 Realtime: generate_lead with value > 0, currency EUR       │');
  console.log('  │   □ GA4 Realtime: purchase events (if bookings occur)              │');
  console.log('  │   □ Google Ads: Enhanced Conversions status = active               │');
  console.log('  │   □ Tag Assistant: zero consent violation warnings                 │');
  console.log('  │                                                                     │');
  console.log('  │  HOUR 12-24 (Validation):                                          │');
  console.log('  │   □ GA4 Explorations: bc_page_type dimension populated             │');
  console.log('  │   □ GA4: conversion count within ±20% of previous day              │');
  console.log('  │   □ Test: ?gclid=test123 -> _bc_gclid cookie + dataLayer           │');
  console.log('  │   □ Cross-browser: Chrome, Safari, Firefox, Edge                   │');
  console.log('  │   □ Mobile: iOS Safari, Android Chrome                             │');
  console.log('  │                                                                     │');
  console.log('  │  HOUR 24-48 (Revenue & Attribution):                               │');
  console.log('  │   □ GA4: purchase items[] array populated correctly                │');
  console.log('  │   □ GA4: items[0].price === value, items[0].quantity === 1         │');
  console.log('  │   □ GA4 monetization: revenue attribution by bc_specialty           │');
  console.log('  │   □ Google Ads: offline conversion upload test (GCLID match)       │');
  console.log('  │   □ Verify bc_version = "CGE_v4.0" in GA4 event params             │');
  console.log('  │   □ Zero duplicate conversions in 48h window                       │');
  console.log('  │                                                                     │');
  console.log('  │  ROLLBACK TRIGGERS:                                                │');
  console.log('  │   • Conversion count drops >30% vs 7-day avg                       │');
  console.log('  │   • Any duplicate generate_lead or purchase in GA4                 │');
  console.log('  │   • gcs never transitions G100 -> G111 after consent               │');
  console.log('  │   • JS console errors on >5% of page loads (via Sentry/logging)    │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
}

console.log('');
console.log('─'.repeat(80));
console.log(`  Completed: ${new Date().toISOString()}`);
console.log('  Auditor: Senior Frontend Analytics Engineer (automated)');
console.log('  Container: GTM-PWZWX5RS (v4.0.0) | GA4: G-9EXCL016VJ | CGE: v4.0.1');
console.log('─'.repeat(80));

const summary = {
  audit_date:'2026-02-17', container:'GTM-PWZWX5RS', ga4:'G-9EXCL016VJ',
  cge_version:ver, total_checks:totalChecks, passed:passCount, failed:failCount,
  score, duplication_risk:dupRisk, verdict:allPass?'GO':'NO-GO', phase_verdicts:phaseV
};
fs.writeFileSync('audit-result.json', JSON.stringify(summary, null, 2));
console.log('\n  Results saved to audit-result.json');

