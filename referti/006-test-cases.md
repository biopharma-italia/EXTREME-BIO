# ============================================================================
# REFERTI.BIO-CLINIC.IT — Test Cases
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# Framework: Vitest (unit/integration) + Playwright (e2e)
# ============================================================================


# ═══════════════════════════════════════════════════════════════════════════
# UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════

## U1: Validators (tests/unit/validators.test.ts)

- U1.1: validateFiscalCode() accepts valid CF "RSSMRA85M01H501Z"
- U1.2: validateFiscalCode() rejects lowercase "rssmra85m01h501z" → false
- U1.3: validateFiscalCode() rejects short string "RSSMRA" → false
- U1.4: validateFiscalCode() accepts null/empty (optional field) → true
- U1.5: validatePhone() accepts "+393401234567" (E.164)
- U1.6: validatePhone() accepts "3401234567" (local)
- U1.7: validatePhone() rejects "abc" → false
- U1.8: validateEmail() accepts "user@domain.it"
- U1.9: validateEmail() rejects "user@" → false
- U1.10: validatePassword() requires 12+ chars, 1 upper, 1 lower, 1 digit, 1 special
- U1.11: validatePassword() rejects "short1A!" (< 12 chars)
- U1.12: validatePassword() rejects "alllowercasenodigit!" (no upper, no digit)
- U1.13: sanitizeInput() strips <script>alert(1)</script> → "alert(1)"
- U1.14: sanitizeInput() preserves "Mario O'Brien" → "Mario O'Brien"
- U1.15: sanitizeInput() truncates at max length
- U1.16: validateReportNumber() accepts "REF-2026-000142"
- U1.17: validateReportNumber() rejects "REF-2026-42" (no padding)

## U2: Encryption (tests/unit/encryption.test.ts)

- U2.1: encryptFile() returns ciphertext different from plaintext
- U2.2: decryptFile(encryptFile(data)) returns original data
- U2.3: decryptFile() with wrong key throws error
- U2.4: decryptFile() with tampered ciphertext throws auth tag error
- U2.5: deriveKey(masterKey, salt) produces consistent key for same inputs
- U2.6: deriveKey(masterKey, salt1) ≠ deriveKey(masterKey, salt2)
- U2.7: computeChecksum(file) returns correct SHA-256 hex
- U2.8: encryptTotpSecret() / decryptTotpSecret() round-trip works

## U3: Formatters (tests/unit/formatters.test.ts)

- U3.1: formatDate("2026-02-24") → "24 febbraio 2026" (it-IT locale)
- U3.2: formatFileSize(245760) → "240 KB"
- U3.3: formatFileSize(1048576) → "1 MB"
- U3.4: formatReportStatus("released") → "Disponibile"
- U3.5: formatReportStatus("pending") → "In lavorazione"
- U3.6: formatPhoneNumber("+393401234567") → "+39 340 123 4567"

## U4: Auth Helpers (tests/unit/auth.test.ts)

- U4.1: generateTempToken() creates JWT with scope='2fa_pending', exp=5min
- U4.2: validateTempToken() with valid token returns decoded payload
- U4.3: validateTempToken() with expired token throws TokenExpiredError
- U4.4: validateTempToken() with wrong scope throws InvalidScopeError
- U4.5: hashBackupCode() returns bcrypt hash
- U4.6: verifyBackupCode(code, hash) returns true for correct code
- U4.7: generateBackupCodes() returns exactly 10 codes
- U4.8: generateBackupCodes() codes match pattern /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
- U4.9: verifyTotp(secret, code) accepts current time step
- U4.10: verifyTotp(secret, code) accepts ±1 time step (30s window)
- U4.11: verifyTotp(secret, code) rejects code from 2 steps ago


# ═══════════════════════════════════════════════════════════════════════════
# INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

## I1: Auth Flow (tests/integration/auth-flow.test.ts)

- I1.1: Register patient → receive confirmation → verify email → login successfully
- I1.2: Register with existing email → 409 Conflict
- I1.3: Register with invalid fiscal code → 400 with validation error
- I1.4: Register without required consents (health_data_processing) → 400
- I1.5: Login with correct credentials → 200 with session tokens
- I1.6: Login with wrong password → 401
- I1.7: Login 5 times with wrong password → account locked (423)
- I1.8: Login with locked account → 423 with locked_until timestamp
- I1.9: Wait for lockout expiry → login succeeds
- I1.10: Refresh token → new access_token returned
- I1.11: Use expired access_token → 401
- I1.12: Logout → refresh token invalidated
- I1.13: Use revoked refresh token → 401
- I1.14: Forgot password → email sent (verify in Resend logs)
- I1.15: Reset password with valid token → 200, old password no longer works
- I1.16: Reset password with expired token → 400
- I1.17: Reset password with used token → 400

## I2: 2FA Flow (tests/integration/2fa-flow.test.ts)

- I2.1: Setup 2FA → returns secret + QR URI + 10 backup codes
- I2.2: Verify setup with correct TOTP code → 2FA enabled
- I2.3: Verify setup with wrong code → 401, 2FA NOT enabled
- I2.4: Login with 2FA → requires temp_token + code
- I2.5: Verify 2FA with correct code → full session
- I2.6: Verify 2FA with wrong code → 401
- I2.7: Verify 2FA with backup code → succeeds, remaining count decremented
- I2.8: Use all backup codes → last code works, then all exhausted
- I2.9: Disable 2FA with code + password → 200, 2FA disabled
- I2.10: Disable 2FA with wrong password → 401

## I3: Report Lifecycle (tests/integration/report-lifecycle.test.ts)

- I3.1: Lab creates report for existing patient → 201, status='pending'
- I3.2: Lab creates report for non-existent patient → 404
- I3.3: Lab uploads PDF file → 201, file encrypted in storage
- I3.4: Lab uploads non-PDF file → 400 (invalid MIME type)
- I3.5: Lab uploads file > 10MB → 400 (file too large)
- I3.6: Lab validates report (pending → validated) → 200
- I3.7: Lab tries to sign report → 403 (only physician can sign)
- I3.8: Physician signs report (validated → signed) → 200
- I3.9: Lab releases report (signed → released) → 200, notification queued
- I3.10: Patient queries reports → sees released report
- I3.11: Patient downloads PDF → decrypted file, checksum matches
- I3.12: Download event logged in audit_log
- I3.13: Report download_count incremented
- I3.14: Admin revokes report with reason → status='revoked'
- I3.15: Patient no longer sees revoked report
- I3.16: Invalid status transition (pending → released) → 400

## I4: RBAC (tests/integration/rbac.test.ts)

- I4.1: Patient cannot POST /api/reports → 403
- I4.2: Patient cannot GET other patient's reports → empty list (RLS)
- I4.3: Patient cannot download other patient's files → 403
- I4.4: Lab technician can see all reports → 200
- I4.5: Lab technician cannot access /api/admin/dashboard → 403
- I4.6: Lab technician cannot manage users → 403
- I4.7: Physician can sign reports → 200
- I4.8: Physician cannot upload reports → 403
- I4.9: Admin can access all endpoints → 200
- I4.10: Admin can create staff users → 201
- I4.11: Deactivated user cannot login → 401
- I4.12: Unauthenticated request to protected endpoint → 401

## I5: Notifications (tests/integration/notification.test.ts)

- I5.1: Release report → email notification queued
- I5.2: Release report with SMS consent → SMS notification queued
- I5.3: Release report without SMS consent → no SMS queued
- I5.4: Patient marks notification as read → read_at set
- I5.5: Patient marks all as read → all updated
- I5.6: Failed notification → retry scheduled (exponential backoff)
- I5.7: 3 failed retries → status='failed', admin alerted
- I5.8: Realtime WebSocket push received on release

## I6: GDPR (tests/integration/gdpr.test.ts)

- I6.1: Patient views consents → all current consents listed
- I6.2: Patient revokes email_notifications consent → updated
- I6.3: Patient submits access request → 201, deadline = +30 days
- I6.4: Patient requests data export → ZIP with personal data + reports
- I6.5: Patient submits erasure request → pending, admin notified
- I6.6: Admin processes erasure → profile anonymized, reports retained (legal)
- I6.7: Consent re-verification on policy version change


# ═══════════════════════════════════════════════════════════════════════════
# SECURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

## S1: Brute Force (tests/security/auth-bruteforce.test.ts)

- S1.1: 5 failed logins in 1 min → 429 rate limited
- S1.2: 5 failed logins → account locked for 15 min
- S1.3: Login from locked account → 423 (not 401, prevent timing attack)
- S1.4: Rate limit on password reset (5 req/min per email)
- S1.5: Rate limit on 2FA verification (5 req/min)

## S2: RLS Bypass (tests/security/rls-bypass.test.ts)

- S2.1: Patient A queries reports → only sees own reports
- S2.2: Patient A manually crafts query for Patient B's report_id → 403
- S2.3: Patient downloads file with Patient B's storage_path → 403
- S2.4: Patient accesses reports with status='pending' (not yet released) → empty
- S2.5: Deactivated lab technician cannot access reports → 401
- S2.6: Direct Supabase REST call with patient token → RLS blocks other patients' data

## S3: Injection (tests/security/injection.test.ts)

- S3.1: SQL injection in fiscal_code field: "'; DROP TABLE users;--" → sanitized
- S3.2: XSS in name field: "<script>alert(1)</script>" → stripped
- S3.3: Path traversal in file download: "../../etc/passwd" → 400
- S3.4: XXE in uploaded file → rejected (not XML)
- S3.5: Oversized JSON body (>1MB) → 413
- S3.6: Malformed UUID in path → 400

## S4: Token Security (tests/security/token-theft.test.ts)

- S4.1: Expired JWT → 401 (not just invalid signature)
- S4.2: JWT with modified payload (role escalation) → signature invalid → 401
- S4.3: Refresh token reuse after rotation → all sessions revoked (token theft detection)
- S4.4: temp_token used after full auth → rejected (scope mismatch)
- S4.5: JWT without required claims → 401
- S4.6: Cross-origin request without valid CORS → blocked

## S5: File Access (tests/security/file-access.test.ts)

- S5.1: Unauthenticated file download → 401
- S5.2: Patient downloads own released report → 200 + valid PDF
- S5.3: Patient downloads own pending report → 403
- S5.4: Patient downloads other patient's report → 403
- S5.5: Direct Supabase Storage URL (without signed URL) → 403
- S5.6: Expired signed URL → 403
- S5.7: Upload non-PDF (renamed .exe to .pdf) → rejected (magic bytes check)
- S5.8: Upload PDF > 10MB → 400


# ═══════════════════════════════════════════════════════════════════════════
# E2E TESTS (Playwright)
# ═══════════════════════════════════════════════════════════════════════════

## E2E1: Patient Journey (tests/e2e/patient-journey.test.ts)

- E2E1.1: Navigate to https://referti.bio-clinic.it → login page
- E2E1.2: Click "Registrati" → registration form
- E2E1.3: Fill form with valid data → submit → success message
- E2E1.4: Check email inbox → click verification link
- E2E1.5: Login with credentials → dashboard
- E2E1.6: Dashboard shows 0 reports, welcome message
- E2E1.7: (Pre-populate: lab creates and releases a report)
- E2E1.8: Dashboard shows 1 new report with badge
- E2E1.9: Click report → detail page with metadata
- E2E1.10: Click "Scarica PDF" → PDF downloaded, valid content
- E2E1.11: Notification bell shows 0 unread after viewing
- E2E1.12: Navigate to profile → update phone number → saved
- E2E1.13: Enable 2FA → scan QR → enter code → 2FA active
- E2E1.14: Logout → login again → 2FA prompt → enter code → dashboard
- E2E1.15: Navigate to privacy → see consents → revoke marketing
- E2E1.16: Logout → session cleared

## E2E2: Lab Workflow (tests/e2e/lab-workflow.test.ts)

- E2E2.1: Login as lab technician → lab dashboard
- E2E2.2: Dashboard shows pending reports count
- E2E2.3: Click "Carica Referto" → upload form
- E2E2.4: Search patient by fiscal code → found
- E2E2.5: Fill report metadata + upload PDF → success
- E2E2.6: New report appears in queue as "pending"
- E2E2.7: Click report → validate → status changes to "validated"
- E2E2.8: (Physician logs in → signs report)
- E2E2.9: Report status = "signed" → lab clicks "Rilascia"
- E2E2.10: Confirm channels (email) → released
- E2E2.11: Bulk select 3 reports → "Rilascio Multiplo" → all released
- E2E2.12: Audit log shows all actions with timestamps


# ═══════════════════════════════════════════════════════════════════════════
# TEST INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════════════════
#
# Unit/Integration:
#   - Framework: Vitest
#   - Mocking: vitest mocks for Supabase client
#   - Database: Supabase local (docker) with test migrations
#   - Coverage target: >80% lines, >90% for auth/encryption modules
#
# Security:
#   - Framework: Vitest + custom HTTP client
#   - Run against staging environment
#   - Part of CI/CD pipeline (must pass before deploy)
#
# E2E:
#   - Framework: Playwright
#   - Browsers: Chromium, Firefox, Safari (WebKit)
#   - Run against staging deployment
#   - Screenshot on failure
#   - Video recording for failed tests
#
# CI/CD Integration:
#   - Unit + Integration: run on every PR
#   - Security: run on every PR + nightly
#   - E2E: run on merge to develop (staging deploy)
#   - All must pass before production deploy
