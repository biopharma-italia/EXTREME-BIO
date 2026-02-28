# ============================================================================
# REFERTI.BIO-CLINIC.IT — API Design Document
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# Architecture: Cloudflare Pages (frontend) + Supabase (backend)
# Base URL: https://referti.bio-clinic.it
# Supabase API: https://<project-ref>.supabase.co
# ============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION FLOW
# ─────────────────────────────────────────────────────────────────────────────
#
# 1. REGISTRATION (Patient self-service):
#    POST /auth/v1/signup → Supabase Auth
#    Body: { email, password, data: { first_name, last_name, fiscal_code, phone } }
#    → Supabase creates auth.user
#    → Database trigger creates users row with role='patient'
#    → Sends verification email
#
# 2. LOGIN:
#    POST /auth/v1/token?grant_type=password → Supabase Auth
#    Body: { email, password }
#    → Returns { access_token (JWT), refresh_token, user }
#    → If user has totp_enabled: returns { requires_2fa: true, temp_token }
#    → Client stores tokens in memory (NOT localStorage)
#    → HttpOnly cookie set via Cloudflare Worker proxy
#
# 3. 2FA VERIFICATION (if enabled):
#    POST /api/auth/verify-2fa
#    Headers: { Authorization: Bearer <temp_token> }
#    Body: { code: "123456" }
#    → Validates TOTP code
#    → Returns full session tokens
#
# 4. TOKEN REFRESH:
#    POST /auth/v1/token?grant_type=refresh_token
#    Body: { refresh_token }
#    → Returns new access_token + refresh_token
#
# 5. LOGOUT:
#    POST /auth/v1/logout
#    → Revokes refresh token
#    → Clears HttpOnly cookie
#    → Audit log entry
#
# ─────────────────────────────────────────────────────────────────────────────
# AUTHORIZATION MATRIX (RBAC)
# ─────────────────────────────────────────────────────────────────────────────
#
# Endpoint                    | patient | lab_tech | physician | admin | super_admin
# ----------------------------|---------|----------|-----------|-------|------------
# GET  /api/reports (own)     |   ✅    |    ✅    |    ✅     |  ✅   |    ✅
# GET  /api/reports (all)     |   ❌    |    ✅    |    ⚠️*    |  ✅   |    ✅
# POST /api/reports           |   ❌    |    ✅    |    ❌     |  ✅   |    ✅
# PATCH /api/reports/:id      |   ❌    |    ✅    |    ✅**   |  ✅   |    ✅
# GET  /api/reports/:id/file  |   ✅†   |    ✅    |    ✅     |  ✅   |    ✅
# POST /api/reports/:id/file  |   ❌    |    ✅    |    ❌     |  ✅   |    ✅
# GET  /api/users (own)       |   ✅    |    ✅    |    ✅     |  ✅   |    ✅
# GET  /api/users (all)       |   ❌    |    ❌    |    ❌     |  ✅   |    ✅
# POST /api/users             |   ❌    |    ❌    |    ❌     |  ✅   |    ✅
# PATCH /api/users/:id        |   ✅‡   |    ❌    |    ❌     |  ✅   |    ✅
# GET  /api/notifications     |   ✅    |    ✅    |    ✅     |  ✅   |    ✅
# GET  /api/audit-log         |   ❌    |    ❌    |    ❌     |  ✅   |    ✅
# POST /api/gdpr/request      |   ✅    |    ❌    |    ❌     |  ✅   |    ✅
# GET  /api/admin/dashboard   |   ❌    |    ✅    |    ❌     |  ✅   |    ✅
#
# * physician: only patients referred to them
# ** physician: can sign (status → 'signed')
# † patient: only own released/signed reports
# ‡ patient: only own profile (limited fields)
#
# ─────────────────────────────────────────────────────────────────────────────

---

# ═══════════════════════════════════════════════════════════════════════════
# GROUP 1: AUTHENTICATION & SESSION
# ═══════════════════════════════════════════════════════════════════════════

## POST /api/auth/register
# Patient self-registration
# Wraps Supabase Auth signup + creates users row
Request:
  Content-Type: application/json
  Body:
    {
      "email": "mario.rossi@email.it",
      "password": "Str0ngP@ss!2026",
      "first_name": "Mario",
      "last_name": "Rossi",
      "fiscal_code": "RSSMRA85M01H501Z",
      "phone": "+393401234567",
      "date_of_birth": "1985-08-01",
      "gender": "M",
      "consents": {
        "privacy_policy": true,
        "health_data_processing": true,
        "electronic_delivery": true,
        "email_notifications": true
      }
    }
  Validation:
    - email: required, valid format, unique
    - password: min 12 chars, 1 upper, 1 lower, 1 digit, 1 special
    - fiscal_code: valid Italian format (regex + checksum)
    - phone: E.164 format
    - consents.privacy_policy: must be true
    - consents.health_data_processing: must be true
Response 201:
    {
      "success": true,
      "user_id": "uuid",
      "message": "Registrazione completata. Controlla la tua email per verificare l'account."
    }
Response 400:
    { "success": false, "error": "validation_error", "details": [...] }
Response 409:
    { "success": false, "error": "user_exists", "message": "Email già registrata." }

---

## POST /api/auth/login
# Login with email/password
Request:
  Content-Type: application/json
  Body:
    {
      "email": "mario.rossi@email.it",
      "password": "Str0ngP@ss!2026"
    }
Response 200 (no 2FA):
    {
      "success": true,
      "session": {
        "access_token": "eyJ...",
        "refresh_token": "abc...",
        "expires_in": 3600,
        "token_type": "bearer"
      },
      "user": {
        "id": "uuid",
        "email": "mario.rossi@email.it",
        "first_name": "Mario",
        "last_name": "Rossi",
        "role": "patient",
        "totp_enabled": false
      }
    }
Response 200 (2FA required):
    {
      "success": true,
      "requires_2fa": true,
      "temp_token": "temp_...",
      "message": "Inserisci il codice dall'app di autenticazione."
    }
Response 401:
    { "success": false, "error": "invalid_credentials" }
Response 423:
    { "success": false, "error": "account_locked", "locked_until": "2026-02-24T15:30:00Z" }

---

## POST /api/auth/verify-2fa
# Verify TOTP code after login
Request:
  Headers: { Authorization: Bearer <temp_token> }
  Body:
    { "code": "123456" }
    OR
    { "backup_code": "ABCD-EFGH" }
Response 200:
    {
      "success": true,
      "session": {
        "access_token": "eyJ...",
        "refresh_token": "abc...",
        "expires_in": 3600
      }
    }
Response 401:
    { "success": false, "error": "invalid_code" }

---

## POST /api/auth/refresh
# Refresh access token
Request:
  Body: { "refresh_token": "abc..." }
Response 200:
    { "access_token": "eyJ...", "refresh_token": "new_abc...", "expires_in": 3600 }

---

## POST /api/auth/logout
# Invalidate session
Request:
  Headers: { Authorization: Bearer <access_token> }
Response 200:
    { "success": true }

---

## POST /api/auth/forgot-password
Request:
  Body: { "email": "mario.rossi@email.it" }
Response 200 (always, to prevent email enumeration):
    { "success": true, "message": "Se l'email è registrata, riceverai un link per reimpostare la password." }

---

## POST /api/auth/reset-password
Request:
  Body:
    {
      "token": "reset-token-from-email",
      "password": "NewStr0ngP@ss!2026"
    }
Response 200:
    { "success": true, "message": "Password aggiornata con successo." }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 2: 2FA MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

## POST /api/auth/2fa/setup
# Generate TOTP secret and QR code
Request:
  Headers: { Authorization: Bearer <access_token> }
Response 200:
    {
      "secret": "JBSWY3DPEHPK3PXP",
      "qr_code_url": "otpauth://totp/Bio-Clinic:mario.rossi@email.it?secret=JBSWY3DPEHPK3PXP&issuer=Bio-Clinic&algorithm=SHA1&digits=6&period=30",
      "backup_codes": [
        "ABCD-EFGH", "IJKL-MNOP", "QRST-UVWX",
        "1234-5678", "9012-3456", "7890-1234",
        "AABB-CCDD", "EEFF-GGHH", "IIJJ-KKLL", "MMNN-OOPP"
      ]
    }

---

## POST /api/auth/2fa/verify-setup
# Confirm 2FA setup with a valid code
Request:
  Headers: { Authorization: Bearer <access_token> }
  Body: { "code": "123456" }
Response 200:
    { "success": true, "message": "Autenticazione a due fattori attivata." }

---

## DELETE /api/auth/2fa
# Disable 2FA
Request:
  Headers: { Authorization: Bearer <access_token> }
  Body: { "code": "123456", "password": "current-password" }
Response 200:
    { "success": true, "message": "Autenticazione a due fattori disattivata." }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 3: REPORTS (Referti)
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/reports
# List reports (filtered by role: patient sees own, lab sees all)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Query params:
    ?status=released          # Filter by status
    &category=ematologia      # Filter by category
    &from=2026-01-01          # Sample date from
    &to=2026-02-24            # Sample date to
    &search=emocromo          # Full-text search on report_type
    &urgent=true              # Only urgent
    &abnormal=true            # Only with abnormal values
    &page=1                   # Pagination
    &per_page=20              # Items per page (max 100)
    &sort=sample_date         # Sort field
    &order=desc               # Sort order
Response 200:
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "report_number": "REF-2026-000142",
          "report_type": "Emocromo Completo",
          "category": "ematologia",
          "sample_date": "2026-02-20",
          "status": "released",
          "is_urgent": false,
          "has_abnormal_values": true,
          "released_at": "2026-02-21T14:30:00Z",
          "patient_viewed": false,
          "download_count": 0,
          "file": {
            "mime_type": "application/pdf",
            "file_size_bytes": 245760
          }
        }
      ],
      "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 47,
        "total_pages": 3
      }
    }

---

## GET /api/reports/:id
# Get single report details
Request:
  Headers: { Authorization: Bearer <access_token> }
Response 200:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "report_number": "REF-2026-000142",
        "report_type": "Emocromo Completo",
        "category": "ematologia",
        "department": "laboratorio",
        "sample_date": "2026-02-20",
        "sample_type": "sangue",
        "analysis_date": "2026-02-20",
        "status": "released",
        "is_urgent": false,
        "has_abnormal_values": true,
        "physician_notes": null,
        "patient": {
          "id": "uuid",
          "first_name": "Mario",
          "last_name": "Rossi",
          "fiscal_code": "RSSMRA85M01H501Z"
        },
        "workflow": {
          "uploaded_by": "Dott. Lab Tech",
          "uploaded_at": "2026-02-20T16:00:00Z",
          "validated_by": "Dott. Validatore",
          "validated_at": "2026-02-21T09:00:00Z",
          "signed_by": "Dott. Gianfranco Manchia",
          "signed_at": "2026-02-21T11:00:00Z",
          "released_at": "2026-02-21T14:30:00Z"
        },
        "files": [
          {
            "id": "uuid",
            "original_name": "referto_emocromo_20260220.pdf",
            "mime_type": "application/pdf",
            "file_size_bytes": 245760,
            "is_primary": true,
            "page_count": 2
          }
        ],
        "notifications": [
          {
            "channel": "email",
            "status": "delivered",
            "sent_at": "2026-02-21T14:31:00Z"
          }
        ]
      }
    }

---

## POST /api/reports
# Create new report (lab technician / admin only)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Content-Type: application/json
  Body:
    {
      "patient_id": "uuid",
      "patient_fiscal_code": "RSSMRA85M01H501Z",
      "report_type": "Emocromo Completo",
      "category": "ematologia",
      "sample_date": "2026-02-20",
      "sample_type": "sangue",
      "is_urgent": false,
      "has_abnormal_values": true,
      "booking_id": "bc_book_m1abc_12345678"
    }
Response 201:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "report_number": "REF-2026-000142",
        "status": "pending"
      }
    }

---

## PATCH /api/reports/:id
# Update report (status transitions, metadata)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Body:
    {
      "status": "validated",
      "has_abnormal_values": true,
      "physician_notes": "Valori leucocitari elevati, consigliato ripetere tra 2 settimane."
    }
  Allowed status transitions:
    pending → validated (lab_technician)
    validated → signed (physician)
    signed → released (lab_technician, admin)
    any → revoked (admin, with revocation_reason required)
Response 200:
    { "success": true, "data": { "id": "uuid", "status": "validated" } }

---

## POST /api/reports/:id/release
# Release report to patient (triggers notification)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Body:
    {
      "notify_channels": ["email", "sms"],
      "custom_message": "Il suo referto è pronto per il ritiro digitale."
    }
Response 200:
    {
      "success": true,
      "data": {
        "status": "released",
        "released_at": "2026-02-21T14:30:00Z",
        "notifications_queued": 2
      }
    }

---

## POST /api/reports/:id/revoke
# Revoke a report (error correction)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Body:
    {
      "reason": "Errore tecnico: campione contaminato. Nuovo prelievo necessario.",
      "replacement_report_id": "uuid-of-corrected-report"
    }
Response 200:
    { "success": true, "data": { "status": "revoked" } }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 4: FILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

## POST /api/reports/:id/files
# Upload PDF report file (lab technician / admin)
Request:
  Headers: { Authorization: Bearer <access_token> }
  Content-Type: multipart/form-data
  Body:
    file: <binary PDF>
    file_type: "report_pdf"  (or "supplement", "correction")
    is_primary: true
Response 201:
    {
      "success": true,
      "data": {
        "file_id": "uuid",
        "storage_path": "referti/patient-uuid/report-uuid/referto_emocromo_20260220.pdf",
        "file_size_bytes": 245760,
        "checksum_sha256": "a1b2c3...",
        "is_encrypted": true
      }
    }
  Notes:
    - Max file size: 10MB
    - Allowed MIME: application/pdf only
    - File is encrypted (AES-256-GCM) before storage
    - SHA-256 checksum computed and stored
    - Virus scan via ClamAV (if available) or Supabase hook

---

## GET /api/reports/:id/files/:file_id/download
# Download report file (patient: own released reports; staff: any)
Request:
  Headers: { Authorization: Bearer <access_token> }
Response 200:
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="REF-2026-000142_Emocromo_Completo.pdf"
    <binary PDF>
  Notes:
    - File is decrypted in-memory before serving
    - Download event logged in audit_log
    - reports.download_count incremented
    - reports.patient_downloaded = true, patient_downloaded_at set

---

## GET /api/reports/:id/files/:file_id/preview
# Generate preview URL (signed URL, expires in 5 min)
Request:
  Headers: { Authorization: Bearer <access_token> }
Response 200:
    {
      "success": true,
      "preview_url": "https://xxx.supabase.co/storage/v1/object/sign/referti/...",
      "expires_at": "2026-02-24T15:05:00Z"
    }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 5: USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/users/me
# Get current user profile
Response 200:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "email": "mario.rossi@email.it",
        "first_name": "Mario",
        "last_name": "Rossi",
        "fiscal_code": "RSSMRA85M01H501Z",
        "phone": "+393401234567",
        "date_of_birth": "1985-08-01",
        "gender": "M",
        "role": "patient",
        "totp_enabled": false,
        "preferred_notification_channel": "email",
        "is_email_verified": true,
        "is_phone_verified": false,
        "created_at": "2026-01-15T10:00:00Z",
        "last_login_at": "2026-02-24T08:30:00Z"
      }
    }

---

## PATCH /api/users/me
# Update own profile
Request:
  Body:
    {
      "phone": "+393409876543",
      "preferred_notification_channel": "sms"
    }
  Allowed fields (patient): phone, preferred_notification_channel, language
  Allowed fields (admin): all fields

---

## GET /api/users (admin only)
# List users with filtering
Query params:
  ?role=patient&search=rossi&page=1&per_page=50
Response 200:
    { "success": true, "data": [...], "pagination": {...} }

---

## POST /api/users (admin only)
# Create staff user (lab_technician, physician, admin)
Request:
  Body:
    {
      "email": "lab01@bio-clinic.it",
      "first_name": "Anna",
      "last_name": "Verdi",
      "role": "lab_technician",
      "send_invite": true
    }
Response 201:
    { "success": true, "data": { "id": "uuid", "invite_sent": true } }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 6: NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/notifications
# Get user's notifications
Query params:
  ?status=unread&page=1&per_page=20
Response 200:
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "channel": "in_app",
          "subject": "Nuovo referto disponibile",
          "body": "Il referto REF-2026-000142 (Emocromo Completo) è ora disponibile.",
          "report_id": "uuid",
          "action_url": "/referti/uuid",
          "status": "delivered",
          "read_at": null,
          "created_at": "2026-02-21T14:31:00Z"
        }
      ],
      "unread_count": 3
    }

---

## PATCH /api/notifications/:id/read
# Mark notification as read
Response 200:
    { "success": true }

---

## PATCH /api/notifications/read-all
# Mark all notifications as read
Response 200:
    { "success": true, "updated": 5 }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 7: AUDIT LOG (admin only)
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/audit-log
Query params:
  ?user_id=uuid
  &action=report_download
  &target_type=report
  &target_id=uuid
  &risk_level=high
  &from=2026-02-01
  &to=2026-02-24
  &page=1&per_page=50
Response 200:
    {
      "success": true,
      "data": [
        {
          "id": 12345,
          "user_id": "uuid",
          "user_role": "patient",
          "action": "report_download",
          "target_type": "report",
          "target_id": "uuid",
          "ip_address": "93.42.xxx.xxx",
          "details": { "report_number": "REF-2026-000142", "file_name": "referto.pdf" },
          "risk_level": "low",
          "created_at": "2026-02-21T15:00:00Z"
        }
      ],
      "pagination": {...}
    }


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 8: GDPR
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/gdpr/consents
# Get user's current consents
Response 200:
    {
      "data": [
        { "type": "privacy_policy", "version": "1.0", "given": true, "given_at": "..." },
        { "type": "health_data_processing", "version": "1.0", "given": true, "given_at": "..." },
        { "type": "email_notifications", "version": "1.0", "given": true, "given_at": "..." },
        { "type": "sms_notifications", "version": "1.0", "given": false }
      ]
    }

---

## POST /api/gdpr/consents
# Update consent
Request:
  Body: { "consent_type": "sms_notifications", "given": true }

---

## POST /api/gdpr/data-request
# Submit GDPR request (access, erasure, portability)
Request:
  Body:
    {
      "type": "access",
      "description": "Richiedo copia di tutti i miei dati personali e referti."
    }
Response 201:
    {
      "success": true,
      "request_id": "uuid",
      "deadline": "2026-03-26",
      "message": "La sua richiesta sarà elaborata entro 30 giorni."
    }

---

## GET /api/gdpr/data-export
# Download personal data export (JSON + PDFs archive)
# Requires recent authentication (< 5 min) or re-auth
Response 200:
    Content-Type: application/zip
    Content-Disposition: attachment; filename="bio-clinic-dati-personali-2026-02-24.zip"


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 9: ADMIN DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

## GET /api/admin/dashboard
# Aggregated stats for admin/lab dashboard
Response 200:
    {
      "success": true,
      "data": {
        "reports": {
          "total": 1247,
          "pending": 12,
          "validated": 5,
          "signed": 3,
          "released_today": 8,
          "urgent_pending": 2,
          "abnormal_pending": 4
        },
        "users": {
          "total_patients": 892,
          "active_last_30d": 234,
          "new_registrations_today": 3
        },
        "notifications": {
          "queued": 5,
          "failed": 1
        },
        "storage": {
          "total_files": 3210,
          "total_size_gb": 2.4
        }
      }
    }

---

## GET /api/admin/reports/queue
# Reports requiring action (pending validation, signing, release)
Response 200:
    {
      "data": [
        {
          "id": "uuid",
          "report_number": "REF-2026-000142",
          "report_type": "Emocromo Completo",
          "patient_name": "Mario Rossi",
          "status": "pending",
          "action_required": "Validazione richiesta",
          "is_urgent": true,
          "created_at": "2026-02-24T08:00:00Z",
          "age_hours": 4.5
        }
      ]
    }

---

## POST /api/admin/reports/bulk-release
# Release multiple reports at once
Request:
  Body:
    {
      "report_ids": ["uuid1", "uuid2", "uuid3"],
      "notify_channels": ["email"]
    }
Response 200:
    {
      "success": true,
      "released": 3,
      "notifications_queued": 3
    }

---

## POST /api/admin/users/:id/lookup-by-fiscal-code
# Find patient by Codice Fiscale (for report assignment)
Request:
  Body: { "fiscal_code": "RSSMRA85M01H501Z" }
Response 200:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "first_name": "Mario",
        "last_name": "Rossi",
        "fiscal_code": "RSSMRA85M01H501Z",
        "email": "mario.rossi@email.it",
        "reports_count": 15
      }
    }
Response 404:
    {
      "success": false,
      "error": "patient_not_found",
      "message": "Nessun paziente trovato. Vuoi creare un nuovo account?"
    }


# ═══════════════════════════════════════════════════════════════════════════
# ERROR FORMAT (standard across all endpoints)
# ═══════════════════════════════════════════════════════════════════════════
#
# All errors follow this format:
# {
#   "success": false,
#   "error": "error_code",            // Machine-readable
#   "message": "Human-readable message in Italian",
#   "details": [...],                  // Optional: validation errors
#   "request_id": "uuid"              // For support correlation
# }
#
# HTTP Status Codes:
#   200 - OK
#   201 - Created
#   400 - Bad Request (validation errors)
#   401 - Unauthorized (not logged in)
#   403 - Forbidden (insufficient permissions)
#   404 - Not Found
#   409 - Conflict (duplicate resource)
#   423 - Locked (account locked)
#   429 - Too Many Requests (rate limited)
#   500 - Internal Server Error
#
# Rate Limits:
#   Auth endpoints: 5 req/min per IP
#   API endpoints: 60 req/min per user
#   File upload: 10 req/min per user
#   File download: 30 req/min per user
