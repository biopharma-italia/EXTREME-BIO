/**
 * REFERTI.BIO-CLINIC.IT — Landing Page JavaScript
 * Handles: Supabase Auth, form validation, password toggle/strength,
 *          OTP inputs, header scroll, FAQ accordion, smooth scroll
 * 
 * @version 2.1.0
 * @date 2026-02-28
 */

(function () {
  'use strict';

  // ============================================
  // Supabase Configuration
  // ============================================
  var SUPABASE_URL = 'https://mdxqgzkxrcrotxxbhoai.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFnemt4cmNyb3R4eGJob2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODYxMzIsImV4cCI6MjA4NzU2MjEzMn0.HHExeiCGqnx4di_u9gghUnTfgQVAIjKuN6kt_vLFddA';

  // Supabase REST helpers
  var SupabaseAuth = {
    /**
     * Sign up with email, password, and user metadata
     */
    signUp: function (email, password, metadata) {
      return fetch(SUPABASE_URL + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: metadata,
          gotrue_meta_security: { captcha_token: '' }
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { status: res.status, data: data };
          return data;
        });
      });
    },

    /**
     * Sign in with email and password
     */
    signIn: function (email, password) {
      return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { status: res.status, data: data };
          return data;
        });
      });
    },

    /**
     * Verify TOTP code for 2FA
     */
    verifyTOTP: function (factorId, code, challengeId, accessToken) {
      return fetch(SUPABASE_URL + '/auth/v1/factors/' + factorId + '/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          code: code
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { status: res.status, data: data };
          return data;
        });
      });
    },

    /**
     * Create a TOTP challenge
     */
    challengeTOTP: function (factorId, accessToken) {
      return fetch(SUPABASE_URL + '/auth/v1/factors/' + factorId + '/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + accessToken
        }
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { status: res.status, data: data };
          return data;
        });
      });
    },

    /**
     * Reset password (send email) — via our API that sets proper redirectTo
     */
    resetPassword: function (email) {
      return fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { status: res.status, data: data };
          return data;
        });
      });
    },

    /**
     * Insert user profile into public.users table via REST API
     */
    createUserProfile: function (accessToken, userData) {
      return fetch(SUPABASE_URL + '/rest/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + accessToken,
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify(userData)
      }).then(function (res) {
        if (!res.ok && res.status !== 409) {
          return res.json().then(function (data) {
            throw { status: res.status, data: data };
          });
        }
        return { success: true };
      });
    },

    /**
     * Store session in localStorage
     */
    storeSession: function (session) {
      try {
        localStorage.setItem('sb-session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user
        }));
      } catch (e) {
        console.warn('Could not store session:', e);
      }
    },

    /**
     * Get stored session
     */
    getSession: function () {
      try {
        var raw = localStorage.getItem('sb-session');
        if (!raw) return null;
        var session = JSON.parse(raw);
        // Check expiry
        if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
          localStorage.removeItem('sb-session');
          return null;
        }
        return session;
      } catch (e) {
        return null;
      }
    },

    /**
     * Clear session
     */
    clearSession: function () {
      localStorage.removeItem('sb-session');
    }
  };

  // Temporary state for 2FA flow
  var pendingAuth = {
    accessToken: null,
    refreshToken: null,
    factorId: null,
    challengeId: null,
    user: null
  };

  // ============================================
  // DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // ── Detect recovery token and redirect to reset-password page ──
    if (detectRecoveryRedirect()) return;

    checkExistingSession();
    initHeaderScroll();
    initAuthTabs();
    initPasswordToggles();
    initPasswordStrength();
    initOtpInputs();
    initLoginForm();
    initRegisterForm();
    initForgotPassword();
    initForgotForm();
    initBackToLogin();
    initFiscalCodeFormatting();
    initOtpVerify();
    initResendOtp();
    initBackFromOtp();
  }

  // ============================================
  // Recovery Token Detection (redirect to /reset-password)
  // ============================================
  function detectRecoveryRedirect() {
    // Check hash fragment: #access_token=xxx&type=recovery
    var hash = window.location.hash.substring(1);
    if (hash) {
      var hashParams = new URLSearchParams(hash);
      if (hashParams.get('type') === 'recovery') {
        if (hashParams.get('access_token')) {
          window.location.href = '/reset-password#' + hash;
          return true;
        }
        if (hashParams.get('token_hash')) {
          window.location.href = '/reset-password?token_hash=' + encodeURIComponent(hashParams.get('token_hash')) + '&type=recovery';
          return true;
        }
      }
    }
    // Check query params: ?token_hash=xxx&type=recovery
    var searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('type') === 'recovery') {
      if (searchParams.get('token_hash')) {
        window.location.href = '/reset-password?token_hash=' + encodeURIComponent(searchParams.get('token_hash')) + '&type=recovery';
        return true;
      }
      if (searchParams.get('access_token')) {
        window.location.href = '/reset-password#access_token=' + encodeURIComponent(searchParams.get('access_token')) + '&type=recovery';
        return true;
      }
    }
    // Check code param (PKCE flow)
    if (searchParams.get('code') && searchParams.get('type') === 'recovery') {
      window.location.href = '/reset-password?code=' + encodeURIComponent(searchParams.get('code')) + '&type=recovery';
      return true;
    }
    return false;
  }

  // ============================================
  // Check Existing Session
  // ============================================
  function checkExistingSession() {
    var session = SupabaseAuth.getSession();
    if (session && session.access_token) {
      // User already logged in — show welcome state
      showLoggedInState(session.user);
    }
  }

  function showLoggedInState(user) {
    var authCard = document.querySelector('.auth-card');
    if (!authCard) return;

    var name = '';
    if (user && user.user_metadata) {
      name = (user.user_metadata.first_name || '') + ' ' + (user.user_metadata.last_name || '');
      name = name.trim();
    }
    if (!name && user) name = user.email;

    var welcomeHtml = '<div class="auth-welcome" style="text-align:center; padding: 3rem 2rem;">' +
      '<div style="width:72px; height:72px; background: linear-gradient(135deg, var(--green-primary), var(--green-accent)); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem;">' +
      '<svg width="36" height="36" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>' +
      '</div>' +
      '<h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--green-dark); margin-bottom: 0.5rem;">Bentornato' + (name ? ', ' + escapeHtml(name) : '') + '!</h3>' +
      '<p style="color: var(--text-secondary); margin-bottom: 2rem;">Sei già autenticato. Accedi alla dashboard per visualizzare i tuoi referti.</p>' +
      '<a href="/dashboard" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none; padding: 0.875rem 2rem;">Vai alla Dashboard <span style="font-size:1.2em;">→</span></a>' +
      '<br><br>' +
      '<button type="button" id="logoutBtn" class="btn-text" style="color: var(--text-muted); font-size: 0.875rem; background:none; border:none; cursor:pointer; text-decoration:underline;">Esci dall\'account</button>' +
      '</div>';

    // Replace auth card contents
    var tabsEl = authCard.querySelector('.auth-tabs');
    var panelsContainer = authCard.querySelector('.auth-panels') || authCard;

    if (tabsEl) tabsEl.style.display = 'none';
    // Hide all panels
    authCard.querySelectorAll('.auth-panel').forEach(function (p) {
      p.hidden = true;
    });

    // Insert welcome
    var welcomeEl = document.createElement('div');
    welcomeEl.innerHTML = welcomeHtml;
    authCard.appendChild(welcomeEl);

    // Logout handler
    setTimeout(function () {
      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          SupabaseAuth.clearSession();
          window.location.reload();
        });
      }
    }, 100);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ============================================
  // Header Scroll Effect
  // ============================================
  function initHeaderScroll() {
    var header = document.querySelector('.header');
    if (!header) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // Auth Tabs
  // ============================================
  function initAuthTabs() {
    var tabs = document.querySelectorAll('.auth-tab');
    var indicator = document.querySelector('.auth-tab-indicator');
    var panels = {
      login: document.getElementById('login-panel'),
      register: document.getElementById('register-panel')
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.dataset.tab;

        // Update tabs
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        // Move indicator
        if (indicator) {
          indicator.classList.toggle('right', target === 'register');
        }

        // Show/hide panels
        Object.keys(panels).forEach(function (key) {
          if (panels[key]) {
            if (key === target) {
              panels[key].hidden = false;
              panels[key].classList.add('active');
            } else {
              panels[key].hidden = true;
              panels[key].classList.remove('active');
            }
          }
        });

        // Also hide special panels
        hidePanel('twofa-panel');
        hidePanel('forgot-panel');

        // Clear messages
        clearFormMessage('loginMessage');
        clearFormMessage('registerMessage');
      });
    });
  }

  function showPanel(panelId) {
    var panel = document.getElementById(panelId);
    if (panel) {
      // Hide all other panels
      document.querySelectorAll('.auth-panel').forEach(function (p) {
        p.hidden = true;
        p.classList.remove('active');
      });
      // Hide tabs
      var tabs = document.querySelector('.auth-tabs');
      if (tabs) tabs.style.display = 'none';
      // Show target
      panel.hidden = false;
      panel.classList.add('active');
    }
  }

  function hidePanel(panelId) {
    var panel = document.getElementById(panelId);
    if (panel) {
      panel.hidden = true;
      panel.classList.remove('active');
    }
  }

  function showAuthTabs() {
    var tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = '';
  }

  // ============================================
  // Password Toggle (show/hide)
  // ============================================
  function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = this.dataset.target;
        var input = document.getElementById(targetId);
        if (!input) return;

        var isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        var eyeOpen = this.querySelector('.eye-open');
        var eyeClosed = this.querySelector('.eye-closed');
        if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : '';
        if (eyeClosed) eyeClosed.style.display = isPassword ? '' : 'none';

        this.setAttribute('aria-label', isPassword ? 'Nascondi password' : 'Mostra password');
      });
    });
  }

  // ============================================
  // Password Strength Meter
  // ============================================
  function initPasswordStrength() {
    var input = document.getElementById('reg-password');
    var fill = document.getElementById('strengthFill');
    var text = document.getElementById('strengthText');
    if (!input || !fill || !text) return;

    input.addEventListener('input', function () {
      var val = this.value;
      var score = calcStrength(val);
      var levels = ['', 'weak', 'fair', 'good', 'strong'];
      var labels = ['', 'Debole', 'Discreta', 'Buona', 'Forte'];

      fill.className = 'strength-fill ' + (levels[score] || '');
      text.className = 'strength-text ' + (levels[score] || '');
      text.textContent = labels[score] || '';
    });
  }

  function calcStrength(pw) {
    if (!pw || pw.length < 4) return 0;
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return 1;
    if (score <= 2) return 2;
    if (score <= 3) return 3;
    return 4;
  }

  // ============================================
  // OTP Inputs
  // ============================================
  function initOtpInputs() {
    var container = document.getElementById('otpInputs');
    if (!container) return;

    var inputs = container.querySelectorAll('.otp-input');
    inputs.forEach(function (input, idx) {
      input.addEventListener('input', function (e) {
        var val = this.value.replace(/\D/g, '');
        this.value = val;
        if (val && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        this.classList.toggle('filled', !!val);

        // Auto-submit when all 6 digits filled
        if (idx === inputs.length - 1 && val) {
          var code = getOtpCode();
          if (code.length === 6) {
            handleOtpSubmit(code);
          }
        }
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
          inputs[idx - 1].classList.remove('filled');
        }
      });

      // Allow paste of full code
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        for (var i = 0; i < Math.min(paste.length, inputs.length); i++) {
          inputs[i].value = paste[i];
          inputs[i].classList.toggle('filled', !!paste[i]);
        }
        var next = Math.min(paste.length, inputs.length - 1);
        inputs[next].focus();

        // Auto-submit if full code pasted
        if (paste.length >= 6) {
          handleOtpSubmit(paste.substring(0, 6));
        }
      });
    });
  }

  function getOtpCode() {
    var container = document.getElementById('otpInputs');
    if (!container) return '';
    var inputs = container.querySelectorAll('.otp-input');
    var code = '';
    inputs.forEach(function (input) {
      code += input.value;
    });
    return code;
  }

  function clearOtpInputs() {
    var container = document.getElementById('otpInputs');
    if (!container) return;
    container.querySelectorAll('.otp-input').forEach(function (input) {
      input.value = '';
      input.classList.remove('filled');
    });
    var first = container.querySelector('.otp-input');
    if (first) first.focus();
  }

  // ============================================
  // Fiscal Code Formatting
  // ============================================
  function initFiscalCodeFormatting() {
    var input = document.getElementById('reg-fiscal');
    if (!input) return;

    input.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    });
  }

  // ============================================
  // Form Validation Helpers
  // ============================================
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(pw) {
    var errors = [];
    if (pw.length < 12) errors.push('Minimo 12 caratteri');
    if (!/[A-Z]/.test(pw)) errors.push('Almeno una lettera maiuscola');
    if (!/[a-z]/.test(pw)) errors.push('Almeno una lettera minuscola');
    if (!/[0-9]/.test(pw)) errors.push('Almeno un numero');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Almeno un carattere speciale');
    return errors;
  }

  function validateFiscalCode(fc) {
    return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(fc.toUpperCase());
  }

  function showFieldError(fieldId, message) {
    var errEl = document.getElementById(fieldId + '-error');
    var input = document.getElementById(fieldId);
    if (errEl) errEl.textContent = message;
    if (input) input.classList.add('error');
  }

  function clearFieldError(fieldId) {
    var errEl = document.getElementById(fieldId + '-error');
    var input = document.getElementById(fieldId);
    if (errEl) errEl.textContent = '';
    if (input) input.classList.remove('error');
  }

  function clearAllErrors(prefix) {
    document.querySelectorAll('[id^="' + prefix + '"]').forEach(function (el) {
      if (el.id.endsWith('-error')) el.textContent = '';
      if (el.classList) el.classList.remove('error');
    });
  }

  function showFormMessage(messageId, text, type) {
    var el = document.getElementById(messageId);
    if (!el) return;
    el.textContent = text;
    el.className = 'form-message ' + type;
  }

  function clearFormMessage(messageId) {
    var el = document.getElementById(messageId);
    if (!el) return;
    el.textContent = '';
    el.className = 'form-message';
  }

  function setButtonLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
  }

  /**
   * Map Supabase error messages to Italian
   */
  function translateAuthError(error) {
    if (!error || !error.data) return 'Si è verificato un errore. Riprova più tardi.';

    var msg = (error.data.message || error.data.msg || error.data.error_description || '').toLowerCase();

    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Email o password non corretti.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Email non ancora verificata. Controlla la tua casella di posta.';
    }
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return 'Questa email è già registrata. Prova ad accedere o recupera la password.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Troppi tentativi. Attendi qualche minuto prima di riprovare.';
    }
    if (msg.includes('password') && msg.includes('weak')) {
      return 'La password non soddisfa i requisiti minimi di sicurezza.';
    }
    if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
      return 'La registrazione è temporaneamente disabilitata.';
    }
    if (msg.includes('email') && msg.includes('invalid')) {
      return 'Indirizzo email non valido.';
    }
    if (error.status === 422) {
      return 'Dati non validi. Controlla i campi e riprova.';
    }
    if (error.status === 429) {
      return 'Troppi tentativi. Attendi qualche minuto.';
    }
    if (error.status >= 500) {
      return 'Servizio temporaneamente non disponibile. Riprova tra poco.';
    }

    return 'Si è verificato un errore. Riprova più tardi.';
  }

  // ============================================
  // Login Form — Supabase Auth
  // ============================================
  function initLoginForm() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    // Clear errors on input
    ['login-email', 'login-password'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', function () {
          clearFieldError(id);
          clearFormMessage('loginMessage');
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors('login-');
      clearFormMessage('loginMessage');

      var email = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value;
      var valid = true;

      if (!email) {
        showFieldError('login-email', 'Inserisci la tua email');
        valid = false;
      } else if (!validateEmail(email)) {
        showFieldError('login-email', 'Email non valida');
        valid = false;
      }

      if (!password) {
        showFieldError('login-password', 'Inserisci la password');
        valid = false;
      }

      if (!valid) return;

      setButtonLoading('loginSubmit', true);

      SupabaseAuth.signIn(email, password)
        .then(function (data) {
          setButtonLoading('loginSubmit', false);

          // Check if user has MFA factors
          if (data.user && data.user.factors && data.user.factors.length > 0) {
            // User has TOTP 2FA enabled — need verification
            var totpFactor = data.user.factors.find(function (f) {
              return f.factor_type === 'totp' && f.status === 'verified';
            });

            if (totpFactor) {
              // Store partial session for 2FA
              pendingAuth.accessToken = data.access_token;
              pendingAuth.refreshToken = data.refresh_token;
              pendingAuth.factorId = totpFactor.id;
              pendingAuth.user = data.user;

              // Create a challenge
              SupabaseAuth.challengeTOTP(totpFactor.id, data.access_token)
                .then(function (challenge) {
                  pendingAuth.challengeId = challenge.id;
                  showPanel('twofa-panel');
                  clearOtpInputs();
                })
                .catch(function () {
                  // If challenge fails, still show 2FA panel
                  showPanel('twofa-panel');
                  clearOtpInputs();
                });
              return;
            }
          }

          // No 2FA — login complete
          SupabaseAuth.storeSession(data);
          showFormMessage('loginMessage', 'Accesso effettuato. Reindirizzamento alla dashboard...', 'success');

          setTimeout(function () {
            window.location.href = '/dashboard';
          }, 1200);
        })
        .catch(function (error) {
          setButtonLoading('loginSubmit', false);
          showFormMessage('loginMessage', translateAuthError(error), 'error');
        });
    });
  }

  // ============================================
  // Register Form — Supabase Auth
  // ============================================
  function initRegisterForm() {
    var form = document.getElementById('registerForm');
    if (!form) return;

    // Clear errors on input
    ['reg-name', 'reg-surname', 'reg-email', 'reg-fiscal', 'reg-password'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', function () {
          clearFieldError(id);
          clearFormMessage('registerMessage');
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors('reg-');
      clearFormMessage('registerMessage');

      var name = document.getElementById('reg-name').value.trim();
      var surname = document.getElementById('reg-surname').value.trim();
      var email = document.getElementById('reg-email').value.trim();
      var fiscal = document.getElementById('reg-fiscal').value.trim();
      var password = document.getElementById('reg-password').value;
      var valid = true;

      if (!name) { showFieldError('reg-name', 'Campo obbligatorio'); valid = false; }
      if (!surname) { showFieldError('reg-surname', 'Campo obbligatorio'); valid = false; }

      if (!email) {
        showFieldError('reg-email', 'Inserisci la tua email');
        valid = false;
      } else if (!validateEmail(email)) {
        showFieldError('reg-email', 'Email non valida');
        valid = false;
      }

      if (!fiscal) {
        showFieldError('reg-fiscal', 'Inserisci il codice fiscale');
        valid = false;
      } else if (!validateFiscalCode(fiscal)) {
        showFieldError('reg-fiscal', 'Codice fiscale non valido');
        valid = false;
      }

      var pwErrors = validatePassword(password);
      if (!password) {
        showFieldError('reg-password', 'Inserisci una password');
        valid = false;
      } else if (pwErrors.length > 0) {
        showFieldError('reg-password', pwErrors[0]);
        valid = false;
      }

      // Check consents
      var consents = form.querySelectorAll('input[type="checkbox"][required]');
      var allChecked = true;
      consents.forEach(function (cb) {
        if (!cb.checked) allChecked = false;
      });
      if (!allChecked) {
        showFormMessage('registerMessage', 'Devi accettare tutti i consensi obbligatori', 'error');
        valid = false;
      }

      if (!valid) return;

      setButtonLoading('registerSubmit', true);

      // Sign up with Supabase Auth
      SupabaseAuth.signUp(email, password, {
        first_name: name,
        last_name: surname,
        fiscal_code: fiscal.toUpperCase(),
        role: 'patient'
      })
        .then(function (data) {
          setButtonLoading('registerSubmit', false);

          // Create profile in public.users as safety net (DB trigger should also do this)
          if (data.user && data.session) {
            SupabaseAuth.createUserProfile(data.session.access_token, {
              auth_id: data.user.id,
              email: email,
              first_name: name,
              last_name: surname,
              fiscal_code: fiscal.toUpperCase(),
              role: 'patient',
              is_active: true,
              is_email_verified: true,
              language: 'it',
              timezone: 'Europe/Rome'
            }).catch(function () {
              // Profile may already exist via DB trigger — ignore conflict
            });
          }

          // Check confirmation requirement
          if (data.user && !data.session) {
            // Email confirmation required
            showFormMessage('registerMessage',
              'Account creato con successo! Controlla la tua email (' + escapeHtml(email) + ') per verificare l\'account. Il link di verifica è valido per 24 ore.',
              'success'
            );
          } else if (data.user && data.session) {
            // Auto-confirmed (e.g., during development)
            SupabaseAuth.storeSession(data.session);
            showFormMessage('registerMessage',
              'Account creato con successo! Reindirizzamento alla dashboard...',
              'success'
            );
            setTimeout(function () {
              window.location.href = '/dashboard';
            }, 1500);
          } else {
            showFormMessage('registerMessage',
              'Registrazione completata. Controlla la tua email per confermare l\'account.',
              'success'
            );
          }

          form.reset();

          // Reset password strength meter
          var fill = document.getElementById('strengthFill');
          var text = document.getElementById('strengthText');
          if (fill) fill.className = 'strength-fill';
          if (text) { text.className = 'strength-text'; text.textContent = ''; }
        })
        .catch(function (error) {
          setButtonLoading('registerSubmit', false);
          showFormMessage('registerMessage', translateAuthError(error), 'error');
        });
    });
  }

  // ============================================
  // 2FA OTP Verification — Supabase TOTP
  // ============================================
  function initOtpVerify() {
    var form = document.getElementById('twofaForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = getOtpCode();
      if (code.length === 6) {
        handleOtpSubmit(code);
      }
    });
  }

  function handleOtpSubmit(code) {
    if (!pendingAuth.accessToken || !pendingAuth.factorId) {
      showFormMessage('twofaMessage', 'Sessione scaduta. Effettua nuovamente il login.', 'error');
      return;
    }

    setButtonLoading('verifyOtpBtn', true);
    clearFormMessage('twofaMessage');

    // If we have a challengeId, verify directly
    var verifyPromise;
    if (pendingAuth.challengeId) {
      verifyPromise = SupabaseAuth.verifyTOTP(
        pendingAuth.factorId,
        code,
        pendingAuth.challengeId,
        pendingAuth.accessToken
      );
    } else {
      // Create challenge first, then verify
      verifyPromise = SupabaseAuth.challengeTOTP(pendingAuth.factorId, pendingAuth.accessToken)
        .then(function (challenge) {
          pendingAuth.challengeId = challenge.id;
          return SupabaseAuth.verifyTOTP(
            pendingAuth.factorId,
            code,
            challenge.id,
            pendingAuth.accessToken
          );
        });
    }

    verifyPromise
      .then(function (data) {
        setButtonLoading('verifyOtpBtn', false);

        // 2FA verified — store full session
        var session = {
          access_token: data.access_token || pendingAuth.accessToken,
          refresh_token: data.refresh_token || pendingAuth.refreshToken,
          expires_at: data.expires_at,
          user: pendingAuth.user
        };
        SupabaseAuth.storeSession(session);

        showFormMessage('twofaMessage', 'Verifica completata. Reindirizzamento...', 'success');

        // Clear pending auth
        pendingAuth = { accessToken: null, refreshToken: null, factorId: null, challengeId: null, user: null };

        setTimeout(function () {
          window.location.href = '/dashboard';
        }, 1000);
      })
      .catch(function (error) {
        setButtonLoading('verifyOtpBtn', false);
        clearOtpInputs();

        if (error && error.data && error.data.message && error.data.message.toLowerCase().includes('invalid')) {
          showFormMessage('twofaMessage', 'Codice non valido. Riprova.', 'error');
        } else {
          showFormMessage('twofaMessage', translateAuthError(error), 'error');
        }
      });
  }

  function initResendOtp() {
    var link = document.getElementById('resendOtp');
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();

      if (!pendingAuth.accessToken || !pendingAuth.factorId) {
        showFormMessage('twofaMessage', 'Sessione scaduta. Effettua nuovamente il login.', 'error');
        return;
      }

      // Create a new challenge
      SupabaseAuth.challengeTOTP(pendingAuth.factorId, pendingAuth.accessToken)
        .then(function (challenge) {
          pendingAuth.challengeId = challenge.id;
          clearOtpInputs();
          showFormMessage('twofaMessage', 'Nuovo codice richiesto. Usa la tua app authenticator.', 'success');
        })
        .catch(function () {
          showFormMessage('twofaMessage', 'Errore nel generare un nuovo codice. Riprova.', 'error');
        });
    });
  }

  function initBackFromOtp() {
    var btn = document.getElementById('backFromOtp');
    if (!btn) return;

    btn.addEventListener('click', function () {
      pendingAuth = { accessToken: null, refreshToken: null, factorId: null, challengeId: null, user: null };
      hidePanel('twofa-panel');
      showAuthTabs();
      var loginPanel = document.getElementById('login-panel');
      if (loginPanel) {
        loginPanel.hidden = false;
        loginPanel.classList.add('active');
      }
    });
  }

  // ============================================
  // Forgot Password — Supabase Reset
  // ============================================
  function initForgotPassword() {
    var link = document.getElementById('forgotPasswordLink');
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      showPanel('forgot-panel');
    });
  }

  function initForgotForm() {
    var form = document.getElementById('forgotForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormMessage('forgotMessage');

      var email = document.getElementById('forgot-email').value.trim();

      if (!email || !validateEmail(email)) {
        showFormMessage('forgotMessage', 'Inserisci un indirizzo email valido', 'error');
        return;
      }

      setButtonLoading('forgotSubmit', true);

      SupabaseAuth.resetPassword(email)
        .then(function () {
          setButtonLoading('forgotSubmit', false);
          showFormMessage('forgotMessage',
            'Se l\'indirizzo email è registrato, riceverai un link per reimpostare la password. Controlla anche la cartella spam.',
            'success'
          );
        })
        .catch(function () {
          setButtonLoading('forgotSubmit', false);
          // Always show success message to prevent email enumeration
          showFormMessage('forgotMessage',
            'Se l\'indirizzo email è registrato, riceverai un link per reimpostare la password.',
            'success'
          );
        });
    });
  }

  function initBackToLogin() {
    var btn = document.getElementById('backToLogin');
    if (!btn) return;

    btn.addEventListener('click', function () {
      hidePanel('forgot-panel');
      showAuthTabs();
      var loginPanel = document.getElementById('login-panel');
      if (loginPanel) {
        loginPanel.hidden = false;
        loginPanel.classList.add('active');
      }
    });
  }

})();
