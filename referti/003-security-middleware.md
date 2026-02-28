# ============================================================================
# REFERTI.BIO-CLINIC.IT — Security & Middleware Architecture
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# ============================================================================

# ═══════════════════════════════════════════════════════════════════════════
# 1. SECURITY LAYER OVERVIEW
# ═══════════════════════════════════════════════════════════════════════════
#
#              ┌──────────────────────────────────────────────────┐
#              │             Cloudflare Edge                       │
#              │  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
#              │  │ WAF     │→ │ DDoS     │→ │ Rate Limiting  │  │
#              │  │ Rules   │  │ Protect  │  │ (IP-based)     │  │
#              │  └─────────┘  └──────────┘  └────────────────┘  │
#              └───────────────────┬──────────────────────────────┘
#                                  │
#              ┌───────────────────▼──────────────────────────────┐
#              │         Cloudflare Pages Functions                │
#              │  ┌─────────────────────────────────────────────┐ │
#              │  │ Middleware Stack (per-request pipeline)      │ │
#              │  │                                             │ │
#              │  │  1. Request ID Generator                    │ │
#              │  │  2. CORS Validator                          │ │
#              │  │  3. Rate Limiter (user-based)               │ │
#              │  │  4. Auth Validator (JWT verification)       │ │
#              │  │  5. RBAC Enforcer                           │ │
#              │  │  6. Input Sanitizer                         │ │
#              │  │  7. Audit Logger                            │ │
#              │  │  8. Error Handler                           │ │
#              │  └─────────────────────────────────────────────┘ │
#              └───────────────────┬──────────────────────────────┘
#                                  │
#              ┌───────────────────▼──────────────────────────────┐
#              │              Supabase Backend                     │
#              │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
#              │  │ Auth     │  │ PostgreSQL│  │ Storage      │  │
#              │  │ (bcrypt, │  │ (RLS)     │  │ (encrypted)  │  │
#              │  │  JWT)    │  │           │  │              │  │
#              │  └──────────┘  └───────────┘  └──────────────┘  │
#              └──────────────────────────────────────────────────┘
#

# ═══════════════════════════════════════════════════════════════════════════
# 2. AUTHENTICATION SECURITY
# ═══════════════════════════════════════════════════════════════════════════

## 2.1 Password Policy
# - Minimum 12 characters
# - At least 1 uppercase, 1 lowercase, 1 digit, 1 special char
# - bcrypt with cost factor 10 (Supabase default)
# - Password history: last 5 passwords cannot be reused
# - Breached password check via HIBP API (k-Anonymity model)

## 2.2 Account Lockout
# - 5 failed login attempts → 15 min lockout
# - 10 failed attempts → 1 hour lockout
# - 20 failed attempts → account disabled (admin intervention required)
# - Failed attempts tracked in users.failed_login_count
# - Reset on successful login

## 2.3 Session Management
# - JWT access_token: 1 hour expiry, RS256 signed
# - Refresh token: 7 days expiry, single-use (rotation)
# - Session stored in HttpOnly, Secure, SameSite=Strict cookie
# - Max 5 concurrent sessions per user
# - Session revocation on password change
# - Idle timeout: 30 minutes (configurable)

## 2.4 Two-Factor Authentication (2FA/TOTP)
# - Standard: RFC 6238 (TOTP) with SHA-1, 6 digits, 30s period
# - Compatible: Google Authenticator, Authy, Microsoft Authenticator
# - Issuer: "Bio-Clinic Referti"
# - Backup codes: 10 codes, bcrypt-hashed, single-use
# - TOTP secret encrypted at rest (AES-256-GCM with master key)
# - 2FA mandatory for: lab_technician, physician, admin, super_admin
# - 2FA optional (recommended) for: patient

## 2.5 TOTP Implementation Details
#
# Setup flow:
#   1. User requests 2FA setup → generate 20-byte random secret
#   2. Encrypt secret with MASTER_ENCRYPTION_KEY (env var) using AES-256-GCM
#   3. Store encrypted_secret in totp_secrets table
#   4. Return secret + QR code URI to client
#   5. User scans QR, enters code → verify code against secret
#   6. If valid: set is_verified=true, users.totp_enabled=true
#   7. Generate 10 backup codes (16 chars each), hash with bcrypt, store
#
# Login flow with 2FA:
#   1. Email + password validated → Supabase returns temp session
#   2. API wraps Supabase session into temp_token (JWT, 5 min expiry, scope: '2fa_pending')
#   3. Client sends temp_token + TOTP code to /api/auth/verify-2fa
#   4. Server decrypts TOTP secret, validates code (±1 time step tolerance)
#   5. If valid: upgrade session to full access, audit log
#   6. If invalid: increment failed_login_count, return 401
#
# Backup code usage:
#   1. User sends backup_code instead of TOTP code
#   2. Server iterates stored hashed codes, bcrypt.compare()
#   3. If match: mark code as used, decrement backup_codes_remaining
#   4. If ≤ 2 codes remaining: warn user to regenerate


# ═══════════════════════════════════════════════════════════════════════════
# 3. ENCRYPTION
# ═══════════════════════════════════════════════════════════════════════════

## 3.1 Data at Rest

# A) PDF Report Encryption (Application-Level)
#    Algorithm: AES-256-GCM
#    Key management:
#      - Master key (MASTER_ENCRYPTION_KEY) stored in Supabase Vault or CF env secret
#      - Per-file encryption key derived via HKDF-SHA256(master_key, file_id_salt)
#      - IV: 12 bytes random, stored in report_files.encryption_iv
#      - Auth tag: 16 bytes, appended to ciphertext
#    Flow:
#      1. Lab uploads PDF
#      2. Server computes SHA-256 checksum of plaintext
#      3. Derives per-file key: HKDF(master_key, salt=file_id)
#      4. Encrypts: AES-256-GCM(key, iv, plaintext) → ciphertext + auth_tag
#      5. Uploads ciphertext to Supabase Storage
#      6. Stores: storage_path, checksum_sha256, encryption_key_id, encryption_iv
#
# B) Sensitive Database Fields
#    - physician_notes in reports: encrypted at application level
#    - totp_secrets.encrypted_secret: AES-256-GCM encrypted
#    - Not encrypted (RLS-protected instead): email, phone, fiscal_code
#      Reason: need to search/index these fields; RLS provides access control

## 3.2 Data in Transit
#    - TLS 1.3 enforced (Cloudflare Full Strict mode)
#    - HSTS: max-age=31536000; includeSubDomains; preload
#    - Certificate pinning not required (Cloudflare universal SSL)

## 3.3 Key Rotation
#    - Master key rotation: every 12 months
#    - On rotation: re-encrypt all files with new key (background job)
#    - Old key retained in vault for 30 days (decryption of in-flight data)
#    - JWT signing key: rotated via Supabase (auto-managed)


# ═══════════════════════════════════════════════════════════════════════════
# 4. MIDDLEWARE STACK (Cloudflare Workers / Edge Functions)
# ═══════════════════════════════════════════════════════════════════════════

## 4.1 Middleware Pipeline
#
# Every request passes through this ordered pipeline:
#
# ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
# │ requestId()  │ → │ cors()   │ → │ rateLimit│ → │ auth()   │
# └──────────────┘   └──────────┘   │   ()     │   └──────────┘
#                                    └──────────┘        │
#                                                        ▼
# ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
# │ errorHandle  │ ← │ audit()  │ ← │sanitize()│ ← │ rbac()   │
# │     ()       │   │          │   │          │   │          │
# └──────────────┘   └──────────┘   └──────────┘   └──────────┘

## 4.2 Middleware Specifications

### M1: Request ID Generator
# - Generates UUID v4 for every request
# - Set as X-Request-ID header in response
# - Passed to all downstream functions and audit log
# - Enables end-to-end request tracing

### M2: CORS Validator
# Allowed origins:
#   - https://referti.bio-clinic.it (production)
#   - https://referti-staging.bio-clinic.it (staging)
#   - http://localhost:3000 (development only, if NODE_ENV=development)
# Methods: GET, POST, PATCH, DELETE, OPTIONS
# Headers: Content-Type, Authorization, X-Request-ID
# Max-Age: 86400 (24h)
# Credentials: true (for cookie-based auth)

### M3: Rate Limiter
# Implementation: Supabase edge function + Redis (or KV counter)
# Tiers:
#   - Anonymous (auth endpoints): 5 req/min per IP
#   - Patient: 60 req/min per user
#   - Lab/Physician: 120 req/min per user
#   - Admin: 300 req/min per user
#   - File upload: 10 req/min per user (any role)
#   - File download: 30 req/min per user (any role)
# Headers returned: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
# Exceeding: 429 Too Many Requests

### M4: Auth Validator
# - Extracts JWT from: Authorization header OR HttpOnly cookie
# - Verifies JWT signature against Supabase JWKS
# - Checks expiration (exp claim)
# - Resolves auth.uid() → users.id, users.role
# - Checks users.is_active = true
# - Checks users.locked_until < NOW()
# - Attaches user context to request: { id, auth_id, role, email }
# - Public endpoints (login, register, forgot-password): skip auth

### M5: RBAC Enforcer
# - Maps request (method + path) → required role(s)
# - Uses permission matrix defined in API design
# - Returns 403 Forbidden if user lacks required role
# - Resource-level checks delegated to Supabase RLS

### M6: Input Sanitizer
# - Strips HTML tags from all string inputs
# - Validates against JSON schema (per endpoint)
# - Enforces max string lengths
# - Validates file MIME types (magic bytes, not just extension)
# - Checks for SQL injection patterns (defense in depth; Supabase uses parameterized queries)
# - Validates UUID format for all ID parameters
# - Validates date formats (ISO 8601)

### M7: Audit Logger
# - Logs every authenticated request to audit_log table
# - Captures: user_id, action, target, IP, user_agent, request_id, details
# - Async: uses waitUntil() / background task to not block response
# - High-risk actions (login_failed, report_download, user_delete) logged with risk_level

### M8: Error Handler
# - Catches unhandled exceptions
# - Returns standardized error response (never leaks stack traces)
# - Logs full error to audit_log with risk_level='critical'
# - Sentry/error reporting integration (optional)


# ═══════════════════════════════════════════════════════════════════════════
# 5. GDPR COMPLIANCE IMPLEMENTATION
# ═══════════════════════════════════════════════════════════════════════════

## 5.1 Lawful Basis for Processing
# - Dati comuni (email, phone, name): contratto (art. 6.1.b)
# - Dati sanitari (referti): consenso esplicito (art. 9.2.a)
# - Audit log: obbligo legale (art. 6.1.c) — conservazione documentale sanitaria

## 5.2 Consent Management
# Required consents (cannot use system without):
#   - privacy_policy: general privacy notice acceptance
#   - health_data_processing: explicit consent for health data (art. 9)
#   - electronic_delivery: consent to receive reports electronically
# Optional consents:
#   - email_notifications
#   - sms_notifications
#   - marketing
# Consent is versioned: when policy changes, user must re-consent
# Proof of consent stored: timestamp, IP, user-agent, exact text shown

## 5.3 Data Retention Policy
# - Active patient data: retained while account active + 10 years (medical records law)
# - Referti PDF: 10 years from sample_date (D.Lgs. 196/2003, art. 42)
# - Audit log: 10 years (regulatory requirement)
# - Account after deletion request: anonymized after 30 days, hard delete after 10 years
# - Session data: 7 days (JWT refresh expiry)
# - Password reset tokens: 1 hour expiry, cleaned daily
# - Notification records: 2 years

## 5.4 Right to Erasure (Art. 17) Implementation
# Note: medical records have legal retention requirements that may override erasure.
# Process:
#   1. Patient submits GDPR erasure request
#   2. System creates gdpr_data_requests entry (30-day deadline)
#   3. Admin reviews: distinguishes between:
#      a) Erasable data: profile details, preferences, notifications → anonymized
#      b) Non-erasable data: medical reports → retained per legal obligation, marked as "restricted"
#   4. Patient is informed of partial erasure with legal justification
#   5. Profile anonymized: email→deleted-{hash}@anonymized, name→"Utente Anonimo", phone→null

## 5.5 Data Portability (Art. 20)
# Export format: ZIP containing:
#   - personal_data.json (profile, consents, preferences)
#   - reports/ directory with all PDF reports
#   - notifications.json (notification history)
#   - audit_log.json (user's own audit entries)
# Triggered via /api/gdpr/data-export (requires fresh auth)


# ═══════════════════════════════════════════════════════════════════════════
# 6. HTTP SECURITY HEADERS (Cloudflare _headers file)
# ═══════════════════════════════════════════════════════════════════════════

# /*
#   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
#   X-Frame-Options: DENY
#   X-Content-Type-Options: nosniff
#   X-XSS-Protection: 0
#   Referrer-Policy: strict-origin-when-cross-origin
#   Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
#   Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://bio-clinic.it; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
#   Cross-Origin-Opener-Policy: same-origin
#   Cross-Origin-Resource-Policy: same-origin


# ═══════════════════════════════════════════════════════════════════════════
# 7. NOTIFICATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

## 7.1 Channels

# Email (Resend API — reused from bio-clinic.it):
#   - From: "Bio-Clinic Referti <referti@bio-clinic.it>"
#   - Templates: report_ready, report_revoked, account_welcome, password_reset, 2fa_enabled
#   - Transactional, DKIM-signed, SPF aligned

# SMS (Twilio or Amazon SNS):
#   - Sender: "Bio-Clinic" (alphanumeric sender ID for Italy)
#   - Template: "Bio-Clinic: il referto {report_type} del {date} è disponibile. Accedi: https://referti.bio-clinic.it"
#   - Max 160 chars, no sensitive data in SMS body

# WhatsApp Business API (optional, Phase 2):
#   - Template-based messages (pre-approved by Meta)
#   - Rich message with CTA button "Vedi Referto"

# In-App:
#   - Supabase Realtime channel: "notifications:{user_id}"
#   - WebSocket push for instant notification
#   - Stored in notifications table for persistence
#   - Badge count on dashboard

## 7.2 Notification Triggers
#
# Event                    | Email | SMS | In-App | WhatsApp
# -------------------------|-------|-----|--------|----------
# Report released          |  ✅   | ✅* |   ✅   |   ✅*
# Report revoked           |  ✅   | ❌  |   ✅   |   ❌
# Account created          |  ✅   | ❌  |   ❌   |   ❌
# Password reset           |  ✅   | ❌  |   ❌   |   ❌
# 2FA enabled              |  ✅   | ❌  |   ✅   |   ❌
# Abnormal values alert    |  ✅   | ✅  |   ✅   |   ✅*
# GDPR request processed   |  ✅   | ❌  |   ✅   |   ❌
# Account locked           |  ✅   | ❌  |   ❌   |   ❌
#
# * = only if user opted in (consent required)

## 7.3 Retry Logic
# - Max 3 retries per notification
# - Exponential backoff: 5 min, 30 min, 2 hours
# - After 3 failures: mark as 'failed', alert admin
# - Email bounces: auto-disable email notifications for user, alert admin


# ═══════════════════════════════════════════════════════════════════════════
# 8. ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════════════════

# Supabase
# SUPABASE_URL=https://<project-ref>.supabase.co
# SUPABASE_ANON_KEY=eyJ...              # Public anon key (RLS-protected)
# SUPABASE_SERVICE_KEY=eyJ...           # Service role key (server-side only, NEVER expose to client)

# Encryption
# MASTER_ENCRYPTION_KEY=<64-hex-chars>  # AES-256 master key for file encryption
# ENCRYPTION_KEY_VERSION=v1             # For key rotation tracking

# Email (Resend)
# RESEND_API_KEY=re_...
# EMAIL_FROM=Bio-Clinic Referti <referti@bio-clinic.it>
# CONTACT_EMAIL=gestione@bio-clinic.it

# SMS (Twilio)
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+39...

# Application
# APP_URL=https://referti.bio-clinic.it
# APP_ENV=production                    # production | staging | development
# ALLOWED_ORIGINS=https://referti.bio-clinic.it

# Cloudflare
# CLOUDFLARE_API_TOKEN=...              # For DNS/cache management
# CLOUDFLARE_ACCOUNT_ID=...
