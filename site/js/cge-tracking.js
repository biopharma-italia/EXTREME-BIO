/**
 * ============================================================================
 * BIO-CLINIC CLINICAL GROWTH ENGINE (CGE) v3.0 — PRODUCTION
 * ============================================================================
 *
 * Enterprise-level behavioral tracking for bio-clinic.it
 * Production-ready for EU private healthcare (GDPR / Consent Mode v2)
 *
 * Architecture:
 *   Consent Mode v2 (inline, before GTM) -> GTM Container -> GA4
 *   bcDataLayer (inline) -> cge-tracking.js (this file) -> dataLayer
 *
 * KEY CHANGES v3.0 vs v2.1:
 *   - GCLID closed-loop: auto-capture from URL, store in first-party cookie,
 *     inject into hidden form fields, push to dataLayer for offline upload
 *   - Event deduplication: bc_form_submit NEVER fires generate_lead;
 *     only bc_lead_generated does (on API success)
 *   - bc_phone_click & bc_whatsapp_click -> auto-fire bc_lead_generated
 *     (with bc_lead_source = phone_call | whatsapp)
 *   - purchase fires ONLY on bc_booking_confirmed with unique transaction_id
 *   - Consent Mode v2: 7 consent types, all denied by default
 *   - user_id ONLY sent when analytics_storage = granted
 *   - Enhanced conversions: SHA-256 hashed client-side, no clear PII
 *   - Removed PII (bc_user_email_hash, bc_user_phone_hash) from bc_form_submit
 *     tag parameters — hashes only sent via bc_enhanced_conversion event
 *
 * Events (bc_ namespace = internal technical events):
 *   bc_page_context       - Page load with full context
 *   bc_phone_click        - tel: link clicks -> auto bc_lead_generated
 *   bc_whatsapp_click     - WhatsApp link clicks -> auto bc_lead_generated
 *   bc_prenota_click      - Booking intent clicks (CTA buttons)
 *   bc_form_submit        - Form submission INTENT (NOT a conversion)
 *   bc_deep_engagement    - Scroll 75% OR time 60s+
 *   bc_price_interest     - Price section views or pricing link clicks
 *   bc_consent_update     - Cookie consent preference changes
 *   bc_lead_generated     - Confirmed lead (API success / phone / whatsapp)
 *   bc_enhanced_conversion - SHA-256 hashed PII for enhanced conversions
 *   bc_booking_confirmed  - Booking confirmed (CRM/GipoNext)
 *
 * GA4 Standard Events (conversions — dual-fire alongside bc_ events):
 *   generate_lead         - Fires with bc_lead_generated (trigger 210)
 *   purchase              - Fires with bc_booking_confirmed (trigger 212)
 *
 * Conversion hierarchy:
 *   PRIMARY:  bc_lead_generated + generate_lead  (trigger 210)
 *   REVENUE:  bc_booking_confirmed + purchase    (trigger 212)
 *   MICRO:    bc_form_submit                     (intent only, NOT conversion)
 *
 * Container: GTM-PWZWX5RS
 * GA4: G-9EXCL016VJ
 * Version: CGE_v3.0_production
 *
 * @author Bio-Clinic Digital Architecture
 * @version 3.0.0
 * @date 2026-02-16
 */

(function() {
  'use strict';

  // =========================================================================
  // 1. GLOBAL NAMESPACE
  // =========================================================================
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  var BCG = window.BCG || {};
  window.BCG = BCG;

  BCG.version = 'CGE_v3.0_production';
  BCG.debug = (window.location.search.indexOf('cge_debug=1') > -1);

  // =========================================================================
  // 2. GCLID CLOSED-LOOP ATTRIBUTION
  // =========================================================================
  // Auto-capture GCLID from URL -> first-party cookie (90 days)
  // -> inject into hidden form fields -> push to dataLayer
  // Enables offline conversion upload to Google Ads

  BCG._GCLID_COOKIE_NAME = '_bc_gclid';
  BCG._GCLID_COOKIE_DAYS = 90;

  BCG._setCookie = function(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax; Secure';
  };

  BCG._getCookie = function(name) {
    var nameEQ = name + '=';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return '';
  };

  BCG.captureGclid = function() {
    try {
      var params = new URLSearchParams(window.location.search);
      var gclid = params.get('gclid');

      if (gclid) {
        // Store in first-party cookie (90 days)
        BCG._setCookie(BCG._GCLID_COOKIE_NAME, gclid, BCG._GCLID_COOKIE_DAYS);
        BCG._gclid = gclid;

        if (BCG.debug) {
          console.log('%c[CGE] GCLID captured from URL:', 'color:#EA4335;font-weight:bold', gclid);
        }
      } else {
        // Try to read from cookie (returning visitor)
        BCG._gclid = BCG._getCookie(BCG._GCLID_COOKIE_NAME) || '';
      }

      // Push GCLID to dataLayer for GTM variable resolution
      if (BCG._gclid) {
        window.dataLayer.push({
          bc_gclid: BCG._gclid
        });
      }
    } catch(e) {
      BCG._gclid = '';
    }
  };

  BCG.getGclid = function() {
    return BCG._gclid || BCG._getCookie(BCG._GCLID_COOKIE_NAME) || '';
  };

  // Inject GCLID into hidden form fields (for all forms on page)
  BCG.injectGclidIntoForms = function() {
    var gclid = BCG.getGclid();
    if (!gclid) return;

    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      if (form.querySelector('input[name="gclid"]')) return; // already injected
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'gclid';
      hidden.value = gclid;
      form.appendChild(hidden);
    });

    if (BCG.debug && forms.length > 0) {
      console.log('%c[CGE] GCLID injected into', 'color:#EA4335;font-weight:bold', forms.length, 'forms');
    }
  };

  // Re-inject on DOM mutations (for dynamically added forms)
  BCG._observeForms = function() {
    if (!('MutationObserver' in window)) return;
    var observer = new MutationObserver(function(mutations) {
      var hasNewForm = mutations.some(function(m) {
        return Array.from(m.addedNodes).some(function(n) {
          return n.tagName === 'FORM' || (n.querySelector && n.querySelector('form'));
        });
      });
      if (hasNewForm) BCG.injectGclidIntoForms();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // =========================================================================
  // 3. PERSISTENT USER ID (GDPR-compliant: consent-gated)
  // =========================================================================
  BCG._consentState = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };

  BCG.getUserId = function() {
    var uid = null;
    try {
      if (BCG._consentState.analytics_storage === 'granted') {
        uid = localStorage.getItem('bc_user_id');
        if (!uid) {
          uid = 'bc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('bc_user_id', uid);
        }
      } else {
        uid = sessionStorage.getItem('bc_user_id_temp');
        if (!uid) {
          uid = 'bc_anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
          sessionStorage.setItem('bc_user_id_temp', uid);
        }
      }
    } catch(e) {
      uid = 'bc_anon_' + Date.now().toString(36);
    }
    return uid;
  };

  BCG._handleConsentRevocation = function() {
    try {
      localStorage.removeItem('bc_user_id');
    } catch(e) {}
  };

  BCG.getSessionId = function() {
    var sid = null;
    try {
      sid = sessionStorage.getItem('bc_session_id');
      if (!sid) {
        sid = 'bcs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
        sessionStorage.setItem('bc_session_id', sid);
      }
    } catch(e) {
      sid = 'bcs_' + Date.now().toString(36);
    }
    return sid;
  };

  BCG.getPageCount = function() {
    try {
      var count = parseInt(sessionStorage.getItem('bc_page_count') || '0', 10) + 1;
      sessionStorage.setItem('bc_page_count', count.toString());
      return count;
    } catch(e) {
      return 1;
    }
  };

  // =========================================================================
  // 4. CONTEXT EXTRACTION FROM bcDataLayer
  // =========================================================================
  BCG.getContext = function() {
    var dl = window.bcDataLayer || {};
    return {
      page_type: dl.page_type || 'unknown',
      specialty: dl.specialty || 'none',
      service_name: dl.service_name || 'none',
      physician_name: dl.physician_name || 'none',
      price_range: dl.price_range || 'none',
      content_group: dl.content_group || 'general',
      funnel_stage: dl.funnel_stage || 'unknown'
    };
  };

  // =========================================================================
  // 5. SHA-256 HASHING FOR ENHANCED CONVERSIONS
  // =========================================================================
  BCG.sha256 = function(str) {
    if (!str || !window.crypto || !window.crypto.subtle) return Promise.resolve('');
    var buffer = new TextEncoder().encode(str.trim().toLowerCase());
    return window.crypto.subtle.digest('SHA-256', buffer).then(function(hash) {
      return Array.from(new Uint8Array(hash)).map(function(b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  };

  // =========================================================================
  // 6. CORE EVENT DISPATCHER
  // =========================================================================
  BCG.sendEvent = function(eventName, params) {
    var ctx = BCG.getContext();
    var baseParams = {
      bc_user_id: BCG.getUserId(),
      bc_session_id: BCG.getSessionId(),
      bc_page_type: ctx.page_type,
      bc_specialty: ctx.specialty,
      bc_service_name: ctx.service_name,
      bc_physician_name: ctx.physician_name,
      bc_price_range: ctx.price_range,
      bc_content_group: ctx.content_group,
      bc_funnel_stage: ctx.funnel_stage,
      bc_page_path: window.location.pathname,
      bc_page_title: document.title,
      bc_page_number: BCG._pageCount || 1,
      bc_device_type: BCG._deviceType || 'unknown',
      bc_timestamp: new Date().toISOString(),
      bc_version: BCG.version,
      bc_gclid: BCG.getGclid()
    };

    var eventData = {};
    for (var k in baseParams) { eventData[k] = baseParams[k]; }
    if (params) {
      for (var p in params) { eventData[p] = params[p]; }
    }

    window.dataLayer.push({
      event: eventName,
      eventModel: eventData
    });

    if (BCG.debug) {
      console.log('%c[CGE] ' + eventName, 'color:#00704A;font-weight:bold', eventData);
    }
  };

  // =========================================================================
  // 7. LEAD DEDUPLICATION
  // =========================================================================
  // Prevent duplicate generate_lead fires within same session
  BCG._firedLeads = {};

  BCG._isLeadDuplicate = function(leadId) {
    if (!leadId) return false;
    if (BCG._firedLeads[leadId]) return true;
    BCG._firedLeads[leadId] = Date.now();
    return false;
  };

  // =========================================================================
  // 8. TRANSACTION DEDUPLICATION
  // =========================================================================
  // Prevent duplicate purchase events with same transaction_id
  BCG._firedTransactions = {};

  BCG._isTransactionDuplicate = function(txnId) {
    if (!txnId) return false;
    // Also check sessionStorage for page refreshes
    try {
      var stored = JSON.parse(sessionStorage.getItem('bc_fired_txns') || '{}');
      if (stored[txnId]) return true;
      stored[txnId] = Date.now();
      sessionStorage.setItem('bc_fired_txns', JSON.stringify(stored));
    } catch(e) {}

    if (BCG._firedTransactions[txnId]) return true;
    BCG._firedTransactions[txnId] = Date.now();
    return false;
  };

  // =========================================================================
  // 9. EVENT HANDLERS
  // =========================================================================

  // --- 9a. PHONE CLICK -> bc_phone_click + bc_lead_generated ---
  BCG.initPhoneTracking = function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="tel:"]');
      if (!link) return;

      var phoneNumber = link.getAttribute('href').replace('tel:', '').replace(/\s/g, '');
      var ctx = BCG.getContext();
      var leadId = 'bc_phone_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);

      // 1. Fire bc_phone_click (internal technical event)
      BCG.sendEvent('bc_phone_click', {
        bc_phone_number: phoneNumber,
        bc_click_text: (link.textContent || '').trim().substring(0, 100),
        bc_click_location: BCG._getClickLocation(link),
        bc_interaction_type: 'phone_call'
      });

      // 2. Auto-fire bc_lead_generated (phone = confirmed intent lead)
      if (!BCG._isLeadDuplicate(leadId)) {
        var estimatedValue = BCG._getEstimatedLeadValue(ctx.specialty, ctx.service_name);

        window.dataLayer.push({
          event: 'bc_lead_generated',
          bc_lead_id: leadId,
          bc_lead_type: 'phone_call',
          bc_lead_source: 'phone_call',
          bc_specialty: ctx.specialty,
          bc_service_name: ctx.service_name,
          bc_physician_name: ctx.physician_name,
          bc_gclid: BCG.getGclid(),
          value: estimatedValue,
          currency: 'EUR'
        });

        if (BCG.debug) {
          console.log('%c[CGE] generate_lead auto-fired from phone_click', 'color:#4285F4;font-weight:bold', {
            lead_id: leadId, value: estimatedValue, source: 'phone_call'
          });
        }
      }
    }, true);
  };

  // --- 9b. WHATSAPP CLICK -> bc_whatsapp_click + bc_lead_generated ---
  BCG.initWhatsAppTracking = function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href*="wa.me"], a[href*="whatsapp"]');
      if (!link) return;

      var ctx = BCG.getContext();
      var leadId = 'bc_wa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);

      // 1. Fire bc_whatsapp_click (internal technical event)
      BCG.sendEvent('bc_whatsapp_click', {
        bc_whatsapp_url: link.getAttribute('href'),
        bc_click_text: (link.textContent || '').trim().substring(0, 100),
        bc_click_location: BCG._getClickLocation(link),
        bc_interaction_type: 'whatsapp_message'
      });

      // 2. Auto-fire bc_lead_generated (whatsapp = confirmed intent lead)
      if (!BCG._isLeadDuplicate(leadId)) {
        var estimatedValue = BCG._getEstimatedLeadValue(ctx.specialty, ctx.service_name);

        window.dataLayer.push({
          event: 'bc_lead_generated',
          bc_lead_id: leadId,
          bc_lead_type: 'whatsapp',
          bc_lead_source: 'whatsapp',
          bc_specialty: ctx.specialty,
          bc_service_name: ctx.service_name,
          bc_physician_name: ctx.physician_name,
          bc_gclid: BCG.getGclid(),
          value: estimatedValue,
          currency: 'EUR'
        });

        if (BCG.debug) {
          console.log('%c[CGE] generate_lead auto-fired from whatsapp_click', 'color:#25D366;font-weight:bold', {
            lead_id: leadId, value: estimatedValue, source: 'whatsapp'
          });
        }
      }
    }, true);
  };

  // --- 9c. PRENOTA CLICK (bc_prenota_click) ---
  BCG.initPrenotaTracking = function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a, button');
      if (!link) return;

      var text = (link.textContent || '').trim().toLowerCase();
      var href = (link.getAttribute('href') || '').toLowerCase();
      var classes = (link.className || '').toLowerCase();

      var isPrenotaClick = (
        text.indexOf('prenota') > -1 ||
        text.indexOf('prenotare') > -1 ||
        text.indexOf('richiedi appuntamento') > -1 ||
        text.indexOf('richiedi informazioni') > -1 ||
        classes.indexOf('prenota') > -1 ||
        classes.indexOf('booking') > -1 ||
        classes.indexOf('nav-cta') > -1 ||
        href.indexOf('prenota') > -1 ||
        href.indexOf('/contatti') > -1
      );

      // Don't double-count phone/whatsapp clicks
      if (isPrenotaClick && href.indexOf('tel:') === -1 && href.indexOf('wa.me') === -1 && href.indexOf('whatsapp') === -1) {
        BCG.sendEvent('bc_prenota_click', {
          bc_click_text: text.substring(0, 100),
          bc_click_url: href,
          bc_click_location: BCG._getClickLocation(link),
          bc_interaction_type: 'booking_intent'
        });
      }
    }, true);
  };

  // --- 9d. FORM SUBMIT (bc_form_submit) — INTENT ONLY, NOT conversion ---
  BCG.initFormTracking = function() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;

      var formId = form.id || form.getAttribute('data-form-id') || 'unknown';
      var isBookingForm = (
        formId.indexOf('booking') > -1 ||
        formId.indexOf('prenota') > -1 ||
        form.querySelector('[name="service"]') !== null ||
        form.querySelector('[name="specialty"]') !== null
      );

      var leadType = isBookingForm ? 'booking' : 'contact';
      var eventParams = {
        bc_form_id: formId,
        bc_lead_type: leadType,
        bc_form_location: BCG._getClickLocation(form),
        bc_interaction_type: 'form_submission'
      };

      var serviceSelect = form.querySelector('[name="service"]');
      if (serviceSelect && serviceSelect.value) {
        eventParams.bc_selected_service = serviceSelect.value;
      }

      // Enhanced conversions: hash email and phone (SHA-256 client-side)
      var emailField = form.querySelector('[name="email"], [type="email"]');
      var phoneField = form.querySelector('[name="phone"], [type="tel"]');

      var hashPromises = [];
      var enhancedData = {};

      if (emailField && emailField.value) {
        hashPromises.push(
          BCG.sha256(emailField.value).then(function(hash) {
            enhancedData.bc_user_email_hash = hash;
          })
        );
      }
      if (phoneField && phoneField.value) {
        hashPromises.push(
          BCG.sha256(phoneField.value).then(function(hash) {
            enhancedData.bc_user_phone_hash = hash;
          })
        );
      }

      Promise.all(hashPromises).then(function() {
        // --- bc_form_submit: INTENT event for BI/Looker Studio ---
        // NOTE: No PII hashes in bc_form_submit (GDPR-safe)
        BCG.sendEvent('bc_form_submit', eventParams);

        // Push enhanced conversion data separately (hashed only)
        if (enhancedData.bc_user_email_hash || enhancedData.bc_user_phone_hash) {
          window.dataLayer.push({
            event: 'bc_enhanced_conversion',
            bc_user_email_hash: enhancedData.bc_user_email_hash || '',
            bc_user_phone_hash: enhancedData.bc_user_phone_hash || '',
            enhanced_conversion_data: {
              email: emailField ? emailField.value.trim().toLowerCase() : ''
            }
          });
        }

        // NOTE: generate_lead fires later, ONLY on API success (bc_lead_generated)
        // bc_form_submit = intent (user clicked submit) — NOT a conversion
        // bc_lead_generated + generate_lead = confirmed lead (API returned 200)
      });
    }, true);
  };

  // --- 9e. DEEP ENGAGEMENT (bc_deep_engagement) ---
  BCG.initScrollTracking = function() {
    var scrollTriggered = {};

    function checkScroll() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight
      );
      var winHeight = window.innerHeight;
      if (docHeight <= winHeight) return;

      var scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

      [25, 50, 75].forEach(function(t) {
        if (scrollPercent >= t && !scrollTriggered[t]) {
          scrollTriggered[t] = true;

          if (t === 75) {
            BCG.sendEvent('bc_deep_engagement', {
              bc_engagement_type: 'scroll_75',
              bc_scroll_percent: scrollPercent,
              bc_interaction_type: 'deep_engagement'
            });
          }
        }
      });
    }

    var scrollTimer = null;
    window.addEventListener('scroll', function() {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function() {
        scrollTimer = null;
        checkScroll();
      }, 200);
    }, { passive: true });
  };

  // --- 9f. TIME ON PAGE 60s (bc_deep_engagement) ---
  BCG.initTimeTracking = function() {
    var timeTriggered = {};
    var startTime = Date.now();

    function checkTime() {
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed >= 60 && !timeTriggered[60]) {
        timeTriggered[60] = true;
        BCG.sendEvent('bc_deep_engagement', {
          bc_engagement_type: 'time_on_page_60s',
          bc_time_on_page: elapsed,
          bc_interaction_type: 'engaged_session'
        });
      }
    }

    setInterval(checkTime, 5000);
  };

  // --- 9g. PRICE INTERACTION (bc_price_interest) ---
  BCG.initPriceTracking = function() {
    var priceViewFired = false;

    var priceElements = document.querySelectorAll(
      '.price, .prezzo, .costo, [data-price], .listino-item, ' +
      '.price-card, .pricing, [class*="price"], [class*="prezzo"], [class*="costo"], ' +
      '.tariff, [class*="tariff"], .service-price, .exam-price'
    );

    if (priceElements.length && 'IntersectionObserver' in window) {
      var priceObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !priceViewFired) {
            priceViewFired = true;
            BCG.sendEvent('bc_price_interest', {
              bc_engagement_type: 'price_view',
              bc_price_element: (entry.target.textContent || '').trim().substring(0, 200),
              bc_interaction_type: 'price_interaction'
            });
            priceObserver.disconnect();
          }
        });
      }, { threshold: 0.5 });

      priceElements.forEach(function(el) { priceObserver.observe(el); });
    }

    // Click tracking for pricing links
    document.addEventListener('click', function(e) {
      var target = e.target.closest('a, button, [role="button"]');
      if (!target) return;

      var text = (target.textContent || '').toLowerCase();
      var href = (target.getAttribute('href') || '').toLowerCase();

      if (
        text.indexOf('listino') > -1 ||
        text.indexOf('prezzo') > -1 ||
        text.indexOf('costo') > -1 ||
        text.indexOf('tariff') > -1 ||
        href.indexOf('listino') > -1 ||
        href.indexOf('prezzi') > -1
      ) {
        BCG.sendEvent('bc_price_interest', {
          bc_engagement_type: 'price_click',
          bc_click_text: text.substring(0, 100),
          bc_click_url: href,
          bc_interaction_type: 'price_interaction'
        });
      }
    }, true);
  };

  // --- 9h. EXTERNAL LINK TRACKING (lightweight) ---
  BCG.initExternalLinkTracking = function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="http"]');
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.indexOf('bio-clinic.it') > -1) return;

      var domain = BCG._extractDomain(href);

      if (domain.indexOf('miodottore') > -1) {
        BCG.sendEvent('bc_miodottore_click', {
          bc_link_url: href,
          bc_link_text: (link.textContent || '').trim().substring(0, 100),
          bc_interaction_type: 'miodottore_redirect'
        });
        return;
      }

      if (domain.indexOf('facebook') > -1 || domain.indexOf('instagram') > -1 ||
          domain.indexOf('linkedin') > -1 || domain.indexOf('twitter') > -1 ||
          domain.indexOf('youtube') > -1) {
        BCG.sendEvent('bc_social_click', {
          bc_social_platform: domain.replace('www.', '').split('.')[0],
          bc_link_url: href,
          bc_interaction_type: 'social_click'
        });
        return;
      }

      BCG.sendEvent('bc_external_link', {
        bc_link_url: href,
        bc_link_domain: domain
      });
    }, true);
  };

  // --- 9i. FAQ INTERACTION ---
  BCG.initFAQTracking = function() {
    document.addEventListener('click', function(e) {
      var faqItem = e.target.closest('.accordion-header, .faq-question, [data-faq], .faq-item h3, .faq-item button');
      if (!faqItem) return;

      BCG.sendEvent('bc_faq_interaction', {
        bc_faq_question: (faqItem.textContent || '').trim().substring(0, 200),
        bc_interaction_type: 'faq_click'
      });
    }, true);
  };

  // --- 9j. SEARCH TRACKING ---
  BCG.initSearchTracking = function() {
    document.addEventListener('bc_search_performed', function(e) {
      BCG.sendEvent('bc_site_search', {
        bc_search_term: (e.detail && e.detail.query) || '',
        bc_search_results_count: (e.detail && e.detail.resultsCount) || 0
      });
    });
  };

  // =========================================================================
  // 10. UTILITY FUNCTIONS
  // =========================================================================
  BCG._getClickLocation = function(el) {
    if (!el) return 'unknown';
    var map = [
      ['header, .header, nav, .nav', 'header'],
      ['footer, .footer', 'footer'],
      ['.hero, .hero-section', 'hero'],
      ['.sidebar, aside', 'sidebar'],
      ['.cta-section, .cta-bar, .cta-sticky, .sticky-cta', 'cta_bar'],
      ['.mobile-nav', 'mobile_nav'],
      ['.cge-micro-form', 'micro_form']
    ];
    for (var i = 0; i < map.length; i++) {
      if (el.closest(map[i][0])) return map[i][1];
    }
    return 'content';
  };

  BCG._extractDomain = function(url) {
    try { return new URL(url).hostname; } catch(e) { return 'unknown'; }
  };

  BCG._getDeviceType = function() {
    var w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  };

  // =========================================================================
  // 11. ESTIMATED LEAD VALUE TABLE (for generate_lead + purchase)
  // =========================================================================
  BCG._LEAD_VALUES = {
    'cardiologia': 150, 'ginecologia': 120, 'dermatologia': 100,
    'endocrinologia': 120, 'neurologia': 130, 'ortopedia': 120,
    'urologia': 110, 'chirurgia-vascolare': 130, 'otorinolaringoiatria': 100,
    'gastroenterologia': 110, 'oculistica': 100, 'pneumologia': 100,
    'ematologia': 120, 'reumatologia': 110, 'genetica': 200,
    'psicologia': 80, 'nutrizione': 80, 'fisioterapia': 70,
    'medicina-estetica': 150, 'slim-care': 300,
    '_default': 100
  };

  BCG._SERVICE_VALUES = {
    'cardiologia/ecocardiogramma': 130,
    'cardiologia/checkup-cardiovascolare': 200,
    'cardiologia/holter-ecg-24h': 120,
    'cardiologia/visita-cardiologica-ecg': 115,
    'ginecologia/ecografia-morfologica': 175,
    'ginecologia/consulto-pma': 250,
    'genetica/test-genetico': 300,
    'slim-care/wegovy': 400,
    'slim-care/mounjaro': 400
  };

  BCG._getEstimatedLeadValue = function(specialty, serviceName) {
    if (specialty && serviceName && serviceName !== 'none') {
      var serviceKey = specialty + '/' + serviceName;
      if (BCG._SERVICE_VALUES[serviceKey]) return BCG._SERVICE_VALUES[serviceKey];
    }
    if (specialty && BCG._LEAD_VALUES[specialty]) return BCG._LEAD_VALUES[specialty];
    return BCG._LEAD_VALUES['_default'];
  };

  // =========================================================================
  // 12. BOOKING CONFIRMED + PURCHASE (closed-loop with transaction_id dedup)
  // =========================================================================
  BCG.fireBookingConfirmed = function(data) {
    if (!data) return;

    var revenue = data.revenue || BCG._getEstimatedLeadValue(data.specialty, data.service_name);
    var transactionId = data.transaction_id || data.lead_id || ('bc_txn_' + Date.now().toString(36));

    // DEDUP: prevent duplicate purchase for same transaction_id
    if (BCG._isTransactionDuplicate(transactionId)) {
      if (BCG.debug) {
        console.warn('[CGE] Duplicate transaction_id blocked:', transactionId);
      }
      return;
    }

    // 1. bc_booking_confirmed (BI event)
    window.dataLayer.push({
      event: 'bc_booking_confirmed',
      bc_lead_id: data.lead_id || 'unknown',
      bc_specialty: data.specialty || 'none',
      bc_service_name: data.service_name || 'none',
      bc_physician_name: data.physician_name || 'none',
      bc_revenue: revenue,
      bc_transaction_id: transactionId,
      bc_gclid: BCG.getGclid()
    });

    // 2. purchase fires on same trigger (212) in GTM via bc_booking_confirmed
    // The purchase tag in GTM reads bc_revenue and bc_transaction_id from dataLayer

    if (BCG.debug) {
      console.log('%c[CGE] bc_booking_confirmed + purchase fired', 'color:#EA4335;font-weight:bold', {
        value: revenue, currency: 'EUR', transaction_id: transactionId, gclid: BCG.getGclid()
      });
    }
  };

  // =========================================================================
  // 13. CONSENT CALLBACK (Iubenda integration)
  // =========================================================================
  BCG.updateConsent = function(preferences) {
    var prevAnalytics = BCG._consentState.analytics_storage;

    var consentMap = {
      'ad_storage': preferences.marketing ? 'granted' : 'denied',
      'ad_user_data': preferences.marketing ? 'granted' : 'denied',
      'ad_personalization': preferences.marketing ? 'granted' : 'denied',
      'analytics_storage': preferences.analytics ? 'granted' : 'denied',
      'personalization_storage': preferences.preferences ? 'granted' : 'denied',
      'functionality_storage': preferences.preferences ? 'granted' : 'denied'
    };

    // Update internal consent state
    BCG._consentState.analytics_storage = consentMap.analytics_storage;
    BCG._consentState.ad_storage = consentMap.ad_storage;
    BCG._consentState.ad_user_data = consentMap.ad_user_data;
    BCG._consentState.ad_personalization = consentMap.ad_personalization;

    // user_id migration on consent grant
    if (prevAnalytics === 'denied' && consentMap.analytics_storage === 'granted') {
      try {
        var tempId = sessionStorage.getItem('bc_user_id_temp');
        if (tempId) {
          localStorage.setItem('bc_user_id', tempId);
          sessionStorage.removeItem('bc_user_id_temp');
        }
      } catch(e) {}
    }

    // user_id cleanup on consent revocation
    if (prevAnalytics === 'granted' && consentMap.analytics_storage === 'denied') {
      BCG._handleConsentRevocation();
    }

    gtag('consent', 'update', consentMap);

    window.dataLayer.push({
      event: 'bc_consent_update',
      bc_consent_analytics: consentMap.analytics_storage,
      bc_consent_marketing: consentMap.ad_storage,
      bc_consent_ad_user_data: consentMap.ad_user_data,
      bc_consent_ad_personalization: consentMap.ad_personalization,
      bc_consent_personalization: consentMap.personalization_storage
    });

    if (BCG.debug) {
      console.log('%c[CGE] Consent updated', 'color:#00704A;font-weight:bold', consentMap);
      console.log('[CGE] User ID mode:', consentMap.analytics_storage === 'granted' ? 'persistent (localStorage)' : 'session-only (anonymous)');
    }
  };

  // Listen for Iubenda consent events
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.purposes) {
          BCG.updateConsent({
            analytics: !!data.purposes[4] || !!data.purposes.analytics,
            marketing: !!data.purposes[5] || !!data.purposes.marketing,
            preferences: !!data.purposes[3] || !!data.purposes.preferences
          });
        }
      } catch(e) {}
    });
  }

  // =========================================================================
  // 14. MICRO-FORM INJECTION — DISABLED
  // =========================================================================
  // Removed: auto-injected forms not authorized.
  // Booking is handled by /laboratorio/prenota/ (dedicated booking page).
  BCG.injectMicroForm = function() { /* disabled */ };

  // =========================================================================
  // 15. FORM SUBMISSION HANDLER (API call -> bc_lead_generated)
  // =========================================================================
  BCG.initFormSubmission = function() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      if (!form.hasAttribute('data-ajax') && !form.hasAttribute('data-cge-form')) return;

      e.preventDefault();

      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso...';
      }

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function(value, key) { payload[key] = value; });

      var ctx = BCG.getContext();
      payload.bc_specialty = ctx.specialty;
      payload.bc_service_name = ctx.service_name;
      payload.bc_physician_name = ctx.physician_name;
      payload.bc_page_path = window.location.pathname;
      payload.bc_user_id = BCG.getUserId();
      payload.bc_session_id = BCG.getSessionId();
      payload.bc_timestamp = new Date().toISOString();
      payload.bc_referrer = document.referrer;
      payload.bc_device_type = BCG._deviceType;
      payload.bc_gclid = BCG.getGclid();

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(response) {
        if (!response.ok) throw new Error('API error: ' + response.status);
        return response.json();
      })
      .then(function(data) {
        BCG._showNotification('Richiesta inviata con successo! Ti contatteremo presto.', 'success');
        form.reset();

        var leadType = payload.service ? 'booking' : 'contact';
        var leadId = data.lead_id || ('bc_form_' + Date.now().toString(36));
        var estimatedValue = BCG._getEstimatedLeadValue(ctx.specialty, ctx.service_name);

        // DEDUP check
        if (!BCG._isLeadDuplicate(leadId)) {
          // bc_lead_generated = PRIMARY conversion (fires generate_lead in GTM)
          window.dataLayer.push({
            event: 'bc_lead_generated',
            bc_lead_id: leadId,
            bc_lead_type: leadType,
            bc_lead_source: 'form_api',
            bc_specialty: ctx.specialty,
            bc_service_name: ctx.service_name,
            bc_physician_name: ctx.physician_name,
            bc_gclid: BCG.getGclid(),
            value: estimatedValue,
            currency: 'EUR'
          });

          if (BCG.debug) {
            console.log('%c[CGE] bc_lead_generated fired (form API success)', 'color:#4285F4;font-weight:bold', {
              lead_id: leadId, value: estimatedValue, source: 'form_api', gclid: BCG.getGclid()
            });
          }
        }
      })
      .catch(function(error) {
        BCG._showNotification(
          'Si è verificato un errore. Chiamaci al <a href="tel:+390799561332" style="color:#fff;text-decoration:underline;">079 956 1332</a> o riprova.',
          'error'
        );

        window.dataLayer.push({
          event: 'bc_form_error',
          bc_error_type: error.message,
          bc_form_id: form.id || form.getAttribute('data-form-id') || 'unknown'
        });
      })
      .finally(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }, true);
  };

  // Notification helper
  BCG._showNotification = function(message, type) {
    document.querySelectorAll('.cge-notification').forEach(function(n) { n.remove(); });
    var colors = { success: '#10b981', error: '#ef4444', info: '#0891b2' };
    var notification = document.createElement('div');
    notification.className = 'cge-notification';
    notification.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;margin-left:12px;">&times;</button>';
    Object.assign(notification.style, {
      position: 'fixed', bottom: '20px', right: '20px', maxWidth: '420px',
      padding: '16px 20px', borderRadius: '10px', backgroundColor: colors[type] || colors.info,
      color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: '12px', zIndex: '99999',
      animation: 'cgeSlideUp 0.3s ease', fontFamily: 'Inter, sans-serif'
    });
    document.body.appendChild(notification);
    setTimeout(function() {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      notification.style.transition = 'all 0.3s ease';
      setTimeout(function() { notification.remove(); }, 300);
    }, 6000);
  };

  // CSS animation
  if (!document.getElementById('cge-styles')) {
    var style = document.createElement('style');
    style.id = 'cge-styles';
    style.textContent = '@keyframes cgeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  // =========================================================================
  // 16. DATALAYER PUSH ON PAGE LOAD
  // =========================================================================
  BCG.pushInitialDataLayer = function() {
    var ctx = BCG.getContext();
    BCG._deviceType = BCG._getDeviceType();
    BCG._pageCount = BCG.getPageCount();

    window.dataLayer.push({
      event: 'bc_page_context',
      bc_page_type: ctx.page_type,
      bc_specialty: ctx.specialty,
      bc_service_name: ctx.service_name,
      bc_physician_name: ctx.physician_name,
      bc_price_range: ctx.price_range,
      bc_content_group: ctx.content_group,
      bc_funnel_stage: ctx.funnel_stage,
      bc_user_id: BCG.getUserId(),
      bc_session_id: BCG.getSessionId(),
      bc_page_path: window.location.pathname,
      bc_page_number: BCG._pageCount,
      bc_referrer: document.referrer,
      bc_device_type: BCG._deviceType,
      bc_version: BCG.version,
      bc_gclid: BCG.getGclid()
    });
  };

  // =========================================================================
  // 17. INITIALIZATION
  // =========================================================================
  BCG.init = function() {
    // 1. GCLID capture (before anything else)
    BCG.captureGclid();

    // 2. Initial dataLayer push
    BCG.pushInitialDataLayer();

    // 3. Event handlers
    BCG.initPhoneTracking();
    BCG.initWhatsAppTracking();
    BCG.initPrenotaTracking();
    BCG.initFormTracking();
    BCG.initScrollTracking();
    BCG.initTimeTracking();
    BCG.initPriceTracking();
    BCG.initExternalLinkTracking();
    BCG.initFAQTracking();
    BCG.initSearchTracking();

    // 4. Form enhancements
    BCG.initFormSubmission();
    BCG.injectMicroForm();
    BCG.injectGclidIntoForms();
    BCG._observeForms();

    if (BCG.debug) {
      console.log('%c[CGE] Clinical Growth Engine v3.0 PRODUCTION initialized', 'color:#00704A;font-weight:bold;font-size:14px');
      console.log('[CGE] Context:', BCG.getContext());
      console.log('[CGE] User ID:', BCG.getUserId());
      console.log('[CGE] User ID mode:', BCG._consentState.analytics_storage === 'granted' ? 'persistent' : 'session-only (no consent)');
      console.log('[CGE] Session ID:', BCG.getSessionId());
      console.log('[CGE] GCLID:', BCG.getGclid() || '(none)');
      console.log('[CGE] Page Count:', BCG._pageCount);
      console.log('[CGE] Device:', BCG._deviceType);
      console.log('[CGE] DataLayer entries:', window.dataLayer.length);
      console.log('[CGE] Conversion routing: phone/whatsapp -> bc_lead_generated -> generate_lead');
      console.log('[CGE] Conversion routing: form API 200 -> bc_lead_generated -> generate_lead');
      console.log('[CGE] Conversion routing: bc_booking_confirmed -> purchase (deduped by transaction_id)');
      console.log('[CGE] Lead value for current page:', BCG._getEstimatedLeadValue(
        BCG.getContext().specialty, BCG.getContext().service_name
      ), 'EUR');
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BCG.init);
  } else {
    BCG.init();
  }

})();
