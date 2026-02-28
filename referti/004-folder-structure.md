# ============================================================================
# REFERTI.BIO-CLINIC.IT — Project Folder Structure
# ============================================================================
# Version: 1.0.0 | Date: 2026-02-24
# ============================================================================
#
# referti.bio-clinic.it/
# ├── .github/
# │   └── workflows/
# │       ├── deploy-production.yml    # Deploy to CF Pages on push to main
# │       ├── deploy-staging.yml       # Deploy to staging on push to develop
# │       └── test.yml                 # Run tests on PR
# │
# ├── public/                          # Static assets (served by CF Pages)
# │   ├── favicon.ico
# │   ├── images/
# │   │   ├── logo-bioclinic.svg
# │   │   ├── logo-bioclinic-white.svg
# │   │   └── og-referti.png
# │   └── robots.txt
# │
# ├── src/                             # Application source code
# │   ├── app/                         # Page components (Astro/Svelte)
# │   │   ├── layout/
# │   │   │   ├── BaseLayout.astro     # HTML shell, meta, fonts
# │   │   │   ├── AuthLayout.astro     # Login/register pages layout
# │   │   │   └── DashboardLayout.astro # Authenticated dashboard layout
# │   │   │
# │   │   ├── pages/                   # Route-based pages
# │   │   │   ├── index.astro          # Landing → redirect to /login or /dashboard
# │   │   │   ├── login.astro          # Login page
# │   │   │   ├── register.astro       # Patient self-registration
# │   │   │   ├── forgot-password.astro
# │   │   │   ├── reset-password.astro
# │   │   │   ├── verify-email.astro
# │   │   │   │
# │   │   │   ├── dashboard/           # Patient dashboard
# │   │   │   │   ├── index.astro      # Overview: recent reports, notifications
# │   │   │   │   ├── referti.astro    # Reports list with filters
# │   │   │   │   ├── referto/
# │   │   │   │   │   └── [id].astro   # Single report detail + download
# │   │   │   │   ├── profilo.astro    # User profile + 2FA settings
# │   │   │   │   ├── notifiche.astro  # Notifications center
# │   │   │   │   └── privacy.astro    # GDPR consents + data requests
# │   │   │   │
# │   │   │   ├── lab/                 # Lab technician panel
# │   │   │   │   ├── index.astro      # Lab dashboard: queue, stats
# │   │   │   │   ├── carica.astro     # Upload new report + assign patient
# │   │   │   │   ├── coda.astro       # Reports queue (pending/validate/sign)
# │   │   │   │   ├── pazienti.astro   # Patient lookup by fiscal code
# │   │   │   │   └── rilascio-multiplo.astro  # Bulk release
# │   │   │   │
# │   │   │   └── admin/               # Admin panel
# │   │   │       ├── index.astro      # Admin dashboard: stats, alerts
# │   │   │       ├── utenti.astro     # User management
# │   │   │       ├── audit-log.astro  # Audit log viewer
# │   │   │       ├── gdpr.astro       # GDPR requests queue
# │   │   │       └── impostazioni.astro # System settings
# │   │   │
# │   │   └── components/              # Reusable UI components
# │   │       ├── auth/
# │   │       │   ├── LoginForm.svelte
# │   │       │   ├── RegisterForm.svelte
# │   │       │   ├── TwoFactorInput.svelte
# │   │       │   └── PasswordStrength.svelte
# │   │       │
# │   │       ├── dashboard/
# │   │       │   ├── ReportCard.svelte
# │   │       │   ├── ReportList.svelte
# │   │       │   ├── ReportDetail.svelte
# │   │       │   ├── ReportFilters.svelte
# │   │       │   ├── NotificationBell.svelte
# │   │       │   ├── NotificationList.svelte
# │   │       │   └── StatsCards.svelte
# │   │       │
# │   │       ├── lab/
# │   │       │   ├── UploadForm.svelte
# │   │       │   ├── PatientLookup.svelte
# │   │       │   ├── ReportQueue.svelte
# │   │       │   ├── BulkReleaseTable.svelte
# │   │       │   └── ReportStatusBadge.svelte
# │   │       │
# │   │       ├── admin/
# │   │       │   ├── UserTable.svelte
# │   │       │   ├── AuditLogTable.svelte
# │   │       │   ├── GdprRequestCard.svelte
# │   │       │   └── SystemStats.svelte
# │   │       │
# │   │       └── ui/                  # Base UI primitives
# │   │           ├── Button.svelte
# │   │           ├── Input.svelte
# │   │           ├── Select.svelte
# │   │           ├── Modal.svelte
# │   │           ├── Toast.svelte
# │   │           ├── Badge.svelte
# │   │           ├── Spinner.svelte
# │   │           ├── Pagination.svelte
# │   │           ├── DataTable.svelte
# │   │           ├── EmptyState.svelte
# │   │           └── FileDropzone.svelte
# │   │
# │   ├── lib/                         # Shared libraries
# │   │   ├── supabase.ts              # Supabase client initialization
# │   │   ├── auth.ts                  # Auth helpers (login, register, 2FA)
# │   │   ├── api.ts                   # API client wrapper with auth headers
# │   │   ├── encryption.ts            # Client-side encryption utils
# │   │   ├── validators.ts            # Input validation (fiscal code, phone, etc.)
# │   │   ├── formatters.ts            # Date, currency, file size formatters
# │   │   ├── constants.ts             # App constants, routes, config
# │   │   └── types.ts                 # TypeScript type definitions
# │   │
# │   ├── stores/                      # Svelte stores (state management)
# │   │   ├── auth.ts                  # Auth state: user, session, isLoggedIn
# │   │   ├── reports.ts               # Reports list, filters, pagination
# │   │   ├── notifications.ts         # Notifications state, unread count
# │   │   └── ui.ts                    # UI state: sidebar, modals, toasts
# │   │
# │   └── styles/                      # CSS
# │       ├── global.css               # CSS variables from bio-clinic design system
# │       ├── auth.css                 # Auth pages styles
# │       ├── dashboard.css            # Dashboard layout styles
# │       └── components.css           # Component-specific styles
# │
# ├── functions/                       # Cloudflare Pages Functions (API proxy)
# │   └── api/
# │       ├── _middleware.ts           # Global middleware: requestId, cors, rateLimit
# │       ├── auth/
# │       │   ├── register.ts         # POST /api/auth/register
# │       │   ├── login.ts            # POST /api/auth/login
# │       │   ├── verify-2fa.ts       # POST /api/auth/verify-2fa
# │       │   ├── refresh.ts          # POST /api/auth/refresh
# │       │   ├── logout.ts           # POST /api/auth/logout
# │       │   ├── forgot-password.ts  # POST /api/auth/forgot-password
# │       │   ├── reset-password.ts   # POST /api/auth/reset-password
# │       │   └── 2fa/
# │       │       ├── setup.ts        # POST /api/auth/2fa/setup
# │       │       ├── verify-setup.ts # POST /api/auth/2fa/verify-setup
# │       │       └── disable.ts      # DELETE /api/auth/2fa
# │       │
# │       ├── reports/
# │       │   ├── index.ts            # GET (list) + POST (create)
# │       │   ├── [id].ts             # GET (detail) + PATCH (update)
# │       │   ├── [id]/
# │       │   │   ├── release.ts      # POST /api/reports/:id/release
# │       │   │   ├── revoke.ts       # POST /api/reports/:id/revoke
# │       │   │   └── files/
# │       │   │       ├── index.ts    # POST (upload file)
# │       │   │       └── [fileId]/
# │       │   │           ├── download.ts  # GET (download)
# │       │   │           └── preview.ts   # GET (signed URL)
# │       │
# │       ├── users/
# │       │   ├── me.ts               # GET + PATCH /api/users/me
# │       │   ├── index.ts            # GET (list, admin) + POST (create, admin)
# │       │   └── [id].ts             # PATCH /api/users/:id (admin)
# │       │
# │       ├── notifications/
# │       │   ├── index.ts            # GET /api/notifications
# │       │   ├── [id]/
# │       │   │   └── read.ts         # PATCH /api/notifications/:id/read
# │       │   └── read-all.ts         # PATCH /api/notifications/read-all
# │       │
# │       ├── admin/
# │       │   ├── dashboard.ts        # GET /api/admin/dashboard
# │       │   ├── reports/
# │       │   │   ├── queue.ts        # GET /api/admin/reports/queue
# │       │   │   └── bulk-release.ts # POST /api/admin/reports/bulk-release
# │       │   └── users/
# │       │       └── lookup.ts       # POST /api/admin/users/lookup-by-fiscal-code
# │       │
# │       ├── audit-log/
# │       │   └── index.ts            # GET /api/audit-log (admin)
# │       │
# │       └── gdpr/
# │           ├── consents.ts         # GET + POST /api/gdpr/consents
# │           ├── data-request.ts     # POST /api/gdpr/data-request
# │           └── data-export.ts      # GET /api/gdpr/data-export
# │
# ├── supabase/                        # Supabase project config
# │   ├── migrations/
# │   │   ├── 001_initial_schema.sql   # Tables, types, indexes
# │   │   ├── 002_rls_policies.sql     # Row Level Security
# │   │   ├── 003_triggers.sql         # Audit triggers, auto-updated_at
# │   │   ├── 004_views.sql            # Convenience views
# │   │   └── 005_seed.sql             # Initial admin user, test data
# │   ├── functions/                   # Supabase Edge Functions (optional)
# │   │   └── notify-report-ready/
# │   │       └── index.ts            # Webhook: report released → send notifications
# │   ├── config.toml                 # Supabase project config
# │   └── storage/
# │       └── referti.sql              # Storage bucket + policies
# │
# ├── tests/                           # Test suites
# │   ├── unit/
# │   │   ├── validators.test.ts       # Input validation tests
# │   │   ├── encryption.test.ts       # Encryption/decryption tests
# │   │   ├── formatters.test.ts       # Formatter tests
# │   │   └── auth.test.ts             # Auth flow tests
# │   │
# │   ├── integration/
# │   │   ├── auth-flow.test.ts        # Full auth flow: register → login → 2FA → logout
# │   │   ├── report-lifecycle.test.ts # Report: create → validate → sign → release → download
# │   │   ├── rbac.test.ts             # Role-based access control tests
# │   │   ├── notification.test.ts     # Notification delivery tests
# │   │   └── gdpr.test.ts             # GDPR flow tests
# │   │
# │   ├── security/
# │   │   ├── auth-bruteforce.test.ts  # Account lockout after N failures
# │   │   ├── rls-bypass.test.ts       # Attempt RLS bypass (patient sees other's reports)
# │   │   ├── injection.test.ts        # SQL/XSS injection attempts
# │   │   ├── token-theft.test.ts      # Session fixation, token reuse
# │   │   └── file-access.test.ts      # Unauthorized file download attempts
# │   │
# │   └── e2e/
# │       ├── patient-journey.test.ts  # Register → login → view report → download
# │       └── lab-workflow.test.ts     # Upload → validate → sign → release → notify
# │
# ├── docs/                            # Documentation
# │   ├── architecture.md              # C4 diagrams, ER diagram
# │   ├── api-reference.md             # Full API documentation
# │   ├── security-policy.md           # Security policy document
# │   ├── gdpr-compliance.md           # GDPR compliance documentation
# │   ├── deployment-guide.md          # Deployment instructions
# │   └── runbook.md                   # Operations runbook
# │
# ├── scripts/                         # Utility scripts
# │   ├── setup-supabase.sh            # Initialize Supabase project
# │   ├── seed-test-data.ts            # Generate test reports/users
# │   ├── rotate-encryption-key.ts     # Master key rotation script
# │   └── gdpr-cleanup.ts              # Scheduled GDPR data cleanup
# │
# ├── .env.example                     # Environment variables template
# ├── .env.local                       # Local development (gitignored)
# ├── .gitignore
# ├── astro.config.mjs                 # Astro framework config
# ├── svelte.config.js                 # Svelte config
# ├── tailwind.config.mjs              # Tailwind CSS config (optional)
# ├── tsconfig.json                    # TypeScript config
# ├── package.json
# ├── wrangler.toml                    # Cloudflare Pages config
# └── README.md
