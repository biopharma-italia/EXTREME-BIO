# ============================================================================
# REFERTI.BIO-CLINIC.IT — CI/CD Pipeline & Migration Plan
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# ============================================================================


# ═══════════════════════════════════════════════════════════════════════════
# 1. CI/CD PIPELINE
# ═══════════════════════════════════════════════════════════════════════════

## 1.1 Environments

# Environment   | Branch    | URL                                    | Supabase
# --------------|-----------|----------------------------------------|---------
# Development   | feature/* | localhost:4321                          | Local (Docker)
# Staging       | develop   | referti-staging.bio-clinic.pages.dev    | Staging project
# Production    | main      | referti.bio-clinic.it                  | Production project

## 1.2 GitHub Actions Workflows

### Workflow 1: test.yml (on every PR)
# Trigger: pull_request to develop or main
# Steps:
#   1. Checkout code
#   2. Setup Node.js 20
#   3. Install dependencies (npm ci)
#   4. TypeScript type check (npx tsc --noEmit)
#   5. Lint (eslint)
#   6. Unit tests (vitest run --coverage)
#   7. Integration tests (vitest run tests/integration/)
#   8. Security tests (vitest run tests/security/)
#   9. Upload coverage report
#   10. Comment on PR with test results

### Workflow 2: deploy-staging.yml (on push to develop)
# Trigger: push to develop
# Steps:
#   1. Run all tests (reuse test.yml)
#   2. Build Astro (npm run build)
#   3. Deploy to Cloudflare Pages (branch: develop)
#   4. Run Supabase migrations on staging
#   5. Run E2E tests against staging URL
#   6. Notify Slack/Discord with deploy status

### Workflow 3: deploy-production.yml (on push to main)
# Trigger: push to main (after PR merge from develop)
# Steps:
#   1. Run all tests
#   2. Build Astro (npm run build)
#   3. Run Supabase migrations on production (with backup first)
#   4. Deploy to Cloudflare Pages (branch: main)
#   5. Smoke test: curl health endpoints
#   6. Purge Cloudflare cache
#   7. Run E2E tests against production
#   8. If E2E fails: auto-rollback (redeploy previous version)
#   9. Tag release (semantic versioning)
#   10. Generate changelog
#   11. Notify team

## 1.3 Required GitHub Secrets

# CLOUDFLARE_API_TOKEN       — Cloudflare API token
# CLOUDFLARE_ACCOUNT_ID      — Cloudflare account
# SUPABASE_PROJECT_REF       — Supabase project reference
# SUPABASE_DB_PASSWORD        — Database password (for migrations)
# SUPABASE_SERVICE_KEY         — Service role key (server-side)
# SUPABASE_ACCESS_TOKEN        — Supabase CLI access token
# RESEND_API_KEY               — Email API key
# MASTER_ENCRYPTION_KEY        — AES-256 master key
# SLACK_WEBHOOK_URL            — Deployment notifications (optional)


# ═══════════════════════════════════════════════════════════════════════════
# 2. MIGRATION PLAN (from current bio-clinic.it to referti.bio-clinic.it)
# ═══════════════════════════════════════════════════════════════════════════

## Phase 0: Infrastructure Setup (Day 1-2)
#
# □ Create Supabase project (EU region: Frankfurt)
# □ Configure Supabase Auth:
#     - Email provider enabled
#     - JWT expiry: 3600s
#     - Email templates (Italian): confirm, reset, invite
#     - Site URL: https://referti.bio-clinic.it
#     - Redirect URLs: https://referti.bio-clinic.it/*, http://localhost:*
# □ Run database migrations (001-005)
# □ Create Storage bucket "referti" (private)
# □ Apply Storage policies
# □ Configure Cloudflare DNS:
#     - CNAME referti.bio-clinic.it → referti-bioclinic.pages.dev
#     - SSL: Full (Strict)
# □ Create Cloudflare Pages project "referti-bioclinic"
# □ Set environment variables in CF Pages dashboard
# □ Set environment variables in Supabase dashboard
# □ Generate MASTER_ENCRYPTION_KEY (openssl rand -hex 32)
# □ Create first super_admin user via Supabase Auth + SQL

## Phase 1: Core Development (Day 3-14)
#
# Sprint 1 (Day 3-7): Auth + Patient Module
# □ Scaffold Astro project with Svelte
# □ Implement auth pages (login, register, forgot/reset password)
# □ Implement CF Pages Functions middleware stack
# □ Implement patient dashboard (reports list, detail, download)
# □ Implement notification system (email via Resend)
# □ Unit + integration tests for auth and reports

# Sprint 2 (Day 8-14): Lab + Admin Module
# □ Implement lab panel (upload, validate, queue)
# □ Implement report file encryption/decryption
# □ Implement admin panel (users, audit log, dashboard)
# □ Implement 2FA (TOTP setup, verification)
# □ Implement GDPR module (consents, data requests, export)
# □ Integration + security tests

## Phase 2: Testing & Hardening (Day 15-21)
#
# □ Full security test suite pass
# □ E2E test suite (Playwright) on staging
# □ Performance testing (load test with k6)
# □ Accessibility audit (WCAG 2.1 AA)
# □ Penetration testing (manual + automated)
# □ GDPR compliance review
# □ Fix all critical/high findings
# □ Deploy to staging for stakeholder review

## Phase 3: Beta & Launch (Day 22-30)
#
# □ Beta testing with 5-10 real patients (invite-only)
# □ Staff training: lab technicians, admin
# □ Documentation finalization
# □ Production deployment
# □ DNS cutover: referti.bio-clinic.it → production
# □ Monitor for 72 hours (error rates, performance)
# □ Post-launch retrospective

## Phase 4: Integration with bio-clinic.it (Day 31-35)
#
# □ Add "I Miei Referti" link in bio-clinic.it header/footer
# □ Booking confirmation email: include link to referti portal
# □ Cross-reference booking_id in reports
# □ Shared design tokens (CSS variables from style.css)
# □ SSO consideration: if patient is on bio-clinic.it → auto-redirect to referti

## Phase 5: SlimCare/BioPredictive Integration (Future)
#
# □ Extend reports schema for SlimCare-specific data
# □ Create "percorso" view: patient sees all reports grouped by pathway
# □ BioPredictive Care: add AI-generated insights panel
# □ Shared patient ID between booking system and referti portal
# □ API bridge: CF Worker on bio-clinic.it calls Supabase on referti


# ═══════════════════════════════════════════════════════════════════════════
# 3. ROLLBACK STRATEGY
# ═══════════════════════════════════════════════════════════════════════════

## Frontend Rollback
# - Cloudflare Pages maintains all deployment history
# - Rollback: CF Dashboard → Deployments → select previous → "Rollback to this deploy"
# - Or: git revert + push to main → auto-deploy
# - Time: < 2 minutes

## Database Rollback
# - Supabase maintains point-in-time recovery (PITR)
# - For migration rollback: write DOWN migrations for each UP migration
# - For data corruption: restore from PITR (RPO: ~5 minutes)
# - Critical: ALWAYS backup before migration (pg_dump via Supabase CLI)

## Encryption Key Rollback
# - Keep previous key version in Supabase Vault for 30 days
# - If new key causes issues: revert ENCRYPTION_KEY_VERSION env var
# - Re-encryption job is idempotent: can re-run with old key


# ═══════════════════════════════════════════════════════════════════════════
# 4. MONITORING & OBSERVABILITY
# ═══════════════════════════════════════════════════════════════════════════

## Metrics to Monitor
# - Auth: login success/failure rate, 2FA adoption rate
# - Reports: upload/release latency, queue depth
# - Notifications: delivery rate, bounce rate
# - Storage: total size, daily growth
# - API: response time (p50, p95, p99), error rate
# - Security: failed login rate, rate limit hits, audit log anomalies

## Tools
# - Cloudflare Analytics (Pages + Workers)
# - Supabase Dashboard (DB metrics, Auth logs, Storage usage)
# - Custom admin dashboard (/admin → real-time stats)
# - Sentry or LogTail for error tracking (optional)
# - Uptime monitoring: Cloudflare Health Checks or UptimeRobot

## Alerts
# - Error rate > 5% → Slack notification
# - Failed logins > 20/hour from same IP → email to admin
# - Report queue > 50 pending → email to lab manager
# - Storage > 80% of Supabase plan limit → email to admin
# - GDPR request approaching deadline (< 5 days) → email to admin


# ═══════════════════════════════════════════════════════════════════════════
# 5. IMPROVEMENT SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════════════

## Short-term (v1.1):
# - Add WhatsApp Business API notifications
# - Add SMS notifications via Twilio
# - Implement password breach check (HIBP k-Anonymity)
# - Add report search full-text (PostgreSQL tsvector)
# - Mobile-responsive push notifications (web push API)

## Medium-term (v1.5):
# - Implement FIDO2/WebAuthn as 2FA alternative (passwordless)
# - Add multi-language support (it, en, de for tourist patients)
# - Implement report annotations (patient notes on their reports)
# - Add appointment<->report automatic linking via booking_id
# - Create PDF viewer in-browser (no download required)
# - Implement batch upload (CSV + ZIP of PDFs)

## Long-term (v2.0):
# - HL7 FHIR integration (health data interoperability standard)
# - Integration with Fascicolo Sanitario Elettronico (FSE) regionale
# - BioPredictive Care: AI-driven anomaly detection in lab values
# - Patient health timeline visualization
# - API for third-party LIS (Laboratory Information System) integration
# - Native mobile app (React Native or Flutter)
# - Telemedicine integration: physician video call to discuss results
