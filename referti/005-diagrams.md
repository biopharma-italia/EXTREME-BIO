# ============================================================================
# REFERTI.BIO-CLINIC.IT — Architecture Diagrams (Text-Based)
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# ============================================================================


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 1: C4 Context Diagram
# ═══════════════════════════════════════════════════════════════════════════
#
#   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
#   │    Paziente      │      │  Laboratorista   │      │     Admin       │
#   │   (Browser)      │      │   (Browser)      │      │   (Browser)     │
#   └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
#            │                        │                         │
#            │   HTTPS                │   HTTPS                 │   HTTPS
#            ▼                        ▼                         ▼
#   ┌──────────────────────────────────────────────────────────────────────┐
#   │                                                                      │
#   │                   referti.bio-clinic.it                              │
#   │              (Enterprise Report Portal)                              │
#   │                                                                      │
#   │   ┌──────────────────────┐    ┌──────────────────────────────────┐  │
#   │   │  Cloudflare Pages    │    │       Supabase                   │  │
#   │   │  ├─ Static Frontend  │    │  ├─ Auth (bcrypt, JWT, 2FA)     │  │
#   │   │  └─ API Functions    │───▶│  ├─ PostgreSQL (RLS)            │  │
#   │   │     (Workers)        │    │  ├─ Storage (encrypted PDFs)    │  │
#   │   └──────────────────────┘    │  ├─ Realtime (WebSocket)        │  │
#   │                               │  └─ Edge Functions              │  │
#   │                               └──────────────────────────────────┘  │
#   └──────────────────┬──────────────────────────┬───────────────────────┘
#                      │                          │
#              ┌───────▼───────┐          ┌───────▼───────┐
#              │   Resend API  │          │  bio-clinic.it│
#              │  (Email)      │          │  (Main site)  │
#              └───────────────┘          │  D1 Bookings  │
#                                         └───────────────┘
#
#   ┌───────────────┐
#   │  Twilio/SMS   │  (Optional Phase 2)
#   └───────────────┘


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 2: C4 Container Diagram
# ═══════════════════════════════════════════════════════════════════════════
#
#   ┌──────────────────────── Cloudflare Edge ────────────────────────────┐
#   │                                                                     │
#   │  ┌───────────────────────────────────────────────────────────────┐  │
#   │  │                 Cloudflare Pages                               │  │
#   │  │                                                               │  │
#   │  │  ┌─────────────────┐     ┌──────────────────────────────┐    │  │
#   │  │  │  Static Assets  │     │   Pages Functions (Workers)   │    │  │
#   │  │  │  ─────────────  │     │   ───────────────────────────│    │  │
#   │  │  │  Astro SSG HTML │     │   /api/auth/*    → Supabase  │    │  │
#   │  │  │  Svelte SPA     │────▶│   /api/reports/* → Supabase  │    │  │
#   │  │  │  CSS/JS bundles │     │   /api/admin/*   → Supabase  │    │  │
#   │  │  │  Images         │     │   /api/gdpr/*    → Supabase  │    │  │
#   │  │  └─────────────────┘     │                              │    │  │
#   │  │                          │   Middleware:                 │    │  │
#   │  │                          │   ├─ CORS                    │    │  │
#   │  │                          │   ├─ Rate limiting           │    │  │
#   │  │                          │   ├─ JWT validation          │    │  │
#   │  │                          │   ├─ RBAC                    │    │  │
#   │  │                          │   ├─ Input sanitization      │    │  │
#   │  │                          │   └─ Audit logging           │    │  │
#   │  │                          └──────────────┬───────────────┘    │  │
#   │  └─────────────────────────────────────────┼────────────────────┘  │
#   └─────────────────────────────────────────────┼───────────────────────┘
#                                                 │
#                                    HTTPS (service role key)
#                                                 │
#   ┌─────────────────────────────────────────────▼───────────────────────┐
#   │                        Supabase Cloud (EU Region)                   │
#   │                                                                     │
#   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
#   │  │   Auth       │  │  PostgreSQL  │  │     Storage              │  │
#   │  │  ──────────  │  │  ──────────  │  │  ────────────────────    │  │
#   │  │  bcrypt      │  │  users       │  │  Bucket: "referti"      │  │
#   │  │  JWT RS256   │  │  reports     │  │  AES-256-GCM encrypted  │  │
#   │  │  Email verif │  │  report_files│  │  Private (no public)    │  │
#   │  │  MFA/TOTP    │  │  notificatns │  │  Signed URLs for        │  │
#   │  │  Password    │  │  audit_log   │  │  download (5min TTL)    │  │
#   │  │  recovery    │  │  gdpr_*      │  │                         │  │
#   │  │              │  │  totp_secrets│  │  Path structure:         │  │
#   │  │              │  │  ──────────  │  │  /{patient_id}/          │  │
#   │  │              │  │  RLS enabled │  │    /{report_id}/         │  │
#   │  │              │  │  Partitioned │  │      /{filename}.pdf.enc │  │
#   │  │              │  │  (audit_log) │  │                         │  │
#   │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
#   │                                                                     │
#   │  ┌──────────────┐  ┌──────────────┐                                │
#   │  │  Realtime    │  │ Edge Funcs   │                                │
#   │  │  ──────────  │  │ ──────────── │                                │
#   │  │  WebSocket   │  │ notify-      │                                │
#   │  │  channels:   │  │ report-ready │                                │
#   │  │  notifs:{uid}│  │ (webhook)    │                                │
#   │  └──────────────┘  └──────────────┘                                │
#   └─────────────────────────────────────────────────────────────────────┘


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 3: Entity-Relationship (ER) Diagram
# ═══════════════════════════════════════════════════════════════════════════
#
#   ┌──────────────────┐         ┌──────────────────────────┐
#   │  auth.users       │         │        users              │
#   │  (Supabase)       │ 1───1  │  ───────────────────────  │
#   │  id (UUID)        │────────▶│  id (PK, UUID)           │
#   │  email            │         │  auth_id (FK → auth.users)│
#   │  encrypted_pass   │         │  email, phone, fiscal_code│
#   │  ...              │         │  first_name, last_name    │
#   └──────────────────┘         │  role (ENUM)              │
#                                 │  totp_enabled             │
#                                 │  is_active                │
#                                 │  ...                      │
#                                 └──────────┬───────────────┘
#                                            │
#                     ┌──────────────────────┼──────────────────────┐
#                     │ 1                    │ 1                    │ 1
#                     ▼ N                    ▼ N                    ▼ N
#   ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
#   │     reports           │  │   notifications      │  │  gdpr_consents  │
#   │  ──────────────────── │  │  ────────────────── │  │  ─────────────  │
#   │  id (PK, UUID)       │  │  id (PK, UUID)       │  │  id (PK, UUID)  │
#   │  report_number       │  │  user_id (FK)         │  │  user_id (FK)   │
#   │  patient_id (FK)     │  │  channel (ENUM)       │  │  consent_type   │
#   │  report_type         │  │  subject, body        │  │  given          │
#   │  category            │  │  report_id (FK)       │  │  version        │
#   │  sample_date         │  │  status (ENUM)        │  │  ...            │
#   │  status (ENUM)       │  │  provider_id          │  └─────────────────┘
#   │  uploaded_by (FK)    │  │  sent_at, read_at     │
#   │  validated_by (FK)   │  │  retry_count          │
#   │  signed_by (FK)      │  │  ...                  │
#   │  released_by (FK)    │  └──────────────────────┘
#   │  is_urgent           │
#   │  has_abnormal_values │
#   │  ...                 │
#   └──────────┬───────────┘
#              │ 1
#              ▼ N
#   ┌──────────────────────┐
#   │    report_files       │
#   │  ──────────────────── │
#   │  id (PK, UUID)       │     ┌──────────────────────┐
#   │  report_id (FK)      │     │     audit_log         │
#   │  storage_path        │     │  ────────────────────  │
#   │  original_name       │     │  id (BIGSERIAL)       │
#   │  mime_type           │     │  user_id (FK)         │
#   │  file_size_bytes     │     │  action (ENUM)        │
#   │  checksum_sha256     │     │  target_type/id       │
#   │  is_encrypted        │     │  ip_address           │
#   │  encryption_key_id   │     │  details (JSONB)      │
#   │  encryption_iv       │     │  risk_level           │
#   │  ...                 │     │  created_at           │
#   └──────────────────────┘     │  ──────────────────── │
#                                │  PARTITIONED monthly  │
#                                │  IMMUTABLE (no U/D)   │
#                                └──────────────────────┘
#
#   Additional tables (not shown for clarity):
#   - user_sessions (FK → users)
#   - totp_secrets (FK → users, 1:1)
#   - password_reset_tokens (FK → users)
#   - gdpr_data_requests (FK → users)


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 4: Report Lifecycle Sequence
# ═══════════════════════════════════════════════════════════════════════════
#
#   Lab Tech              System              Physician           Patient
#   ────────              ──────              ─────────           ────────
#      │                     │                    │                   │
#      │  POST /api/reports  │                    │                   │
#      │────────────────────▶│                    │                   │
#      │                     │ status='pending'   │                   │
#      │                     │ audit_log: create  │                   │
#      │  201 Created        │                    │                   │
#      │◀────────────────────│                    │                   │
#      │                     │                    │                   │
#      │  POST /reports/:id/ │                    │                   │
#      │       files (PDF)   │                    │                   │
#      │────────────────────▶│                    │                   │
#      │                     │ encrypt(AES-256)   │                   │
#      │                     │ upload to Storage  │                   │
#      │                     │ checksum verified  │                   │
#      │  201 File uploaded  │                    │                   │
#      │◀────────────────────│                    │                   │
#      │                     │                    │                   │
#      │  PATCH /reports/:id │                    │                   │
#      │  status='validated' │                    │                   │
#      │────────────────────▶│                    │                   │
#      │                     │ audit: validate    │                   │
#      │                     │                    │                   │
#      │                     │  Notification:     │                   │
#      │                     │  "Report ready     │                   │
#      │                     │   for signing"     │                   │
#      │                     │───────────────────▶│                   │
#      │                     │                    │                   │
#      │                     │  PATCH /reports/:id│                   │
#      │                     │  status='signed'   │                   │
#      │                     │◀───────────────────│                   │
#      │                     │  audit: sign       │                   │
#      │                     │                    │                   │
#      │  POST /reports/:id/ │                    │                   │
#      │       release       │                    │                   │
#      │────────────────────▶│                    │                   │
#      │                     │ status='released'  │                   │
#      │                     │ audit: release     │                   │
#      │                     │                    │                   │
#      │                     │  Email: "Referto   │                   │
#      │                     │   disponibile"     │                   │
#      │                     │────────────────────┼──────────────────▶│
#      │                     │                    │                   │
#      │                     │  Realtime WS push  │                   │
#      │                     │────────────────────┼──────────────────▶│
#      │                     │                    │                   │
#      │                     │                    │  GET /api/reports │
#      │                     │                    │◀──────────────────│
#      │                     │  [list with new]   │                   │
#      │                     │───────────────────▶│──────────────────▶│
#      │                     │                    │                   │
#      │                     │                    │  GET /reports/:id │
#      │                     │                    │  /files/:fid/     │
#      │                     │                    │  download         │
#      │                     │◀───────────────────┼──────────────────│
#      │                     │  decrypt(AES-256)  │                   │
#      │                     │  serve PDF         │                   │
#      │                     │  audit: download   │                   │
#      │                     │  download_count++  │                   │
#      │                     │───────────────────▶│──────────────────▶│
#      │                     │                    │                   │


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 5: Authentication & 2FA Sequence
# ═══════════════════════════════════════════════════════════════════════════
#
#   Client                  CF Worker            Supabase Auth         DB
#   ──────                  ─────────            ─────────────         ──
#      │                        │                     │                 │
#      │  POST /api/auth/login  │                     │                 │
#      │  {email, password}     │                     │                 │
#      │───────────────────────▶│                     │                 │
#      │                        │  signInWithPassword  │                 │
#      │                        │────────────────────▶│                 │
#      │                        │  {session, user}    │                 │
#      │                        │◀────────────────────│                 │
#      │                        │                     │                 │
#      │                        │  Check totp_enabled │                 │
#      │                        │─────────────────────┼────────────────▶│
#      │                        │  {totp_enabled: T}  │                 │
#      │                        │◀────────────────────┼─────────────────│
#      │                        │                     │                 │
#      │                        │  Issue temp_token   │                 │
#      │                        │  (JWT, 5min, scope: │                 │
#      │                        │   '2fa_pending')    │                 │
#      │  {requires_2fa: true,  │                     │                 │
#      │   temp_token: "..."}   │                     │                 │
#      │◀───────────────────────│                     │                 │
#      │                        │                     │                 │
#      │  ┌─────────────────┐   │                     │                 │
#      │  │ User opens      │   │                     │                 │
#      │  │ Authenticator   │   │                     │                 │
#      │  │ app, reads code │   │                     │                 │
#      │  └─────────────────┘   │                     │                 │
#      │                        │                     │                 │
#      │  POST /api/auth/       │                     │                 │
#      │  verify-2fa            │                     │                 │
#      │  {code: "482910"}      │                     │                 │
#      │───────────────────────▶│                     │                 │
#      │                        │  Validate temp_token│                 │
#      │                        │  (scope=2fa_pending)│                 │
#      │                        │                     │                 │
#      │                        │  Get encrypted_secret                │
#      │                        │─────────────────────┼────────────────▶│
#      │                        │  Decrypt with       │                 │
#      │                        │  MASTER_KEY         │                 │
#      │                        │  Verify TOTP code   │                 │
#      │                        │  (±1 time step)     │                 │
#      │                        │                     │                 │
#      │                        │  Audit: totp_verify │                 │
#      │                        │─────────────────────┼────────────────▶│
#      │                        │                     │                 │
#      │  {session: {           │                     │                 │
#      │    access_token,       │                     │                 │
#      │    refresh_token}}     │                     │                 │
#      │  + Set-Cookie: HttpOnly│                     │                 │
#      │◀───────────────────────│                     │                 │
#      │                        │                     │                 │


# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 6: File Encryption Flow
# ═══════════════════════════════════════════════════════════════════════════
#
#   Upload (Lab Technician):
#   ─────────────────────────
#
#   [PDF File] → SHA-256 checksum → HKDF(master_key, salt=file_id) → key
#                                                                      │
#                                   ┌──────────────────────────────────┘
#                                   ▼
#                           AES-256-GCM encrypt
#                           ├─ IV: 12 random bytes
#                           ├─ AAD: report_id + patient_id
#                           └─ Output: ciphertext + auth_tag (16 bytes)
#                                   │
#                                   ▼
#                     ┌─────────────────────────┐
#                     │  Supabase Storage        │
#                     │  /{patient_id}/          │
#                     │    /{report_id}/         │
#                     │      /file.pdf.enc       │
#                     └─────────────────────────┘
#                     + DB record: checksum, iv,
#                       encryption_key_id
#
#
#   Download (Patient/Staff):
#   ──────────────────────────
#
#   Auth check → RLS check → Fetch ciphertext from Storage
#                                   │
#                                   ▼
#                           HKDF(master_key, salt=file_id) → key
#                           AES-256-GCM decrypt
#                           ├─ IV: from report_files.encryption_iv
#                           ├─ AAD: report_id + patient_id
#                           └─ Verify auth_tag
#                                   │
#                                   ▼
#                           Verify SHA-256 checksum
#                                   │
#                                   ▼
#                           Stream PDF to client
#                           + Audit log: report_download
