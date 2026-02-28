# BIO-CLINIC — GUIDA AL DEPLOY IN PRODUZIONE

> **Data**: 2026-02-28 | **PR**: #39 | **Branch**: `genspark_ai_developer`

---

## PREREQUISITI

1. Accesso admin a **Cloudflare Dashboard** (account Bio-Clinic)
2. Accesso admin a **Supabase** (progetto `mdxqgzkxrcrotxxbhoai`)
3. Accesso a **GitHub** (repo `biopharma-italia/EXTREME-BIO`)

---

## STEP 1 — Merge Pull Request #39

```bash
# Su GitHub: https://github.com/biopharma-italia/EXTREME-BIO/pull/39
# Cliccare "Merge pull request" → "Confirm merge"
# Oppure via CLI:
gh pr merge 39 --squash --delete-branch
```

---

## STEP 2 — Configurare Variabili Ambiente su Cloudflare

Nella Cloudflare Dashboard → Pages → bio-clinic → Settings → Environment Variables:

| Variabile | Valore | Note |
|-----------|--------|------|
| `SUPABASE_URL` | `https://mdxqgzkxrcrotxxbhoai.supabase.co` | Già noto |
| `SUPABASE_ANON_KEY` | `eyJ...` | Da Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Da Supabase → Settings → API (service_role) |
| `EMAIL_API_KEY` | `re_...` | Da Resend.com (per email conferma booking) |
| `CONTACT_EMAIL` | `gestione@bio-clinic.it` | Già in wrangler.toml |
| `ALLOWED_ORIGINS` | `https://bio-clinic.it,https://bio-clinic.pages.dev` | Già in wrangler.toml |

**Bindings D1 e KV** (dovrebbero essere già configurati):
- `BOOKING_DB` → D1 Database `bio-clinic-booking` (`2774d698-2d22-41bd-aa69-5b07de04d749`)
- `BOOKING_KV` → KV Namespace (`f7eaf83738ea465baf6f043f9b94641a`)

---

## STEP 3 — Eseguire Migrazioni SQL su Supabase

Aprire Supabase Dashboard → SQL Editor ed eseguire **in ordine**:

### 3a. Schema (tabelle, indici, trigger)
```sql
-- Copia/incolla il contenuto di: admin/supabase/migrations/001_admin_schema.sql
-- Contiene: specialties, physicians, procedures, lab_tests, packs, pathways, etc.
```

### 3b. Row Level Security (RLS)
```sql
-- Copia/incolla il contenuto di: admin/supabase/migrations/002_admin_rls.sql
-- Contiene: policies per admin, lab_technician, physician, patient
```

### 3c. Seed Data (dati iniziali)
```sql
-- Copia/incolla il contenuto di: admin/supabase/migrations/003_seed_data.sql
-- Contiene: 11 specialità, 50 medici, 38 prestazioni, 1136 esami lab, 12 pack, 12 percorsi
```

### Verifica post-migrazione:
```sql
SELECT 'specialties' as table_name, count(*) FROM specialties
UNION ALL SELECT 'physicians', count(*) FROM physicians
UNION ALL SELECT 'procedures', count(*) FROM procedures
UNION ALL SELECT 'lab_tests', count(*) FROM lab_tests
UNION ALL SELECT 'packs', count(*) FROM packs
UNION ALL SELECT 'pathways', count(*) FROM pathways;
```

---

## STEP 4 — Configurare Admin Auth

L'admin panel attualmente usa **demo-data** per autenticazione. Per attivare l'auth reale:

1. Creare un utente admin in Supabase Auth
2. Aggiungere il record nella tabella `admin_users`:
   ```sql
   INSERT INTO admin_users (id, email, role, display_name, status)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'admin@bio-clinic.it'),
     'admin@bio-clinic.it',
     'super_admin',
     'Amministratore',
     'active'
   );
   ```
3. Aggiornare `site/admin/js/admin.js` per rimuovere il bypass demo login

---

## STEP 5 — Verificare Deploy

Dopo il merge, Cloudflare Pages effettua il deploy automatico. Verificare:

- [ ] **Homepage**: https://bio-clinic.it → carica correttamente
- [ ] **Sitemap**: https://bio-clinic.it/sitemap.xml → 209+ URL
- [ ] **Robots**: https://bio-clinic.it/robots.txt → contiene `Disallow: /admin/`
- [ ] **Admin**: https://bio-clinic.it/admin/ → UI carica
- [ ] **Redirect**: https://bio-clinic.it/cardiologia → redirect 301 a /cardiologia/
- [ ] **Articoli**: https://bio-clinic.it/salute/acne-adulti/ → pagina carica
- [ ] **Booking API**: https://bio-clinic.it/api/booking/services → risponde JSON
- [ ] **Contact API**: https://bio-clinic.it/api/contact → accetta POST
- [ ] **Schema.org**: Test con https://validator.schema.org

---

## STEP 6 — Post-Deploy Monitoring

1. Verificare su **Google Search Console** che il sitemap sia accettato
2. Monitorare **Core Web Vitals** su PageSpeed Insights
3. Controllare **Cloudflare Analytics** per errori 4xx/5xx
4. Verificare **Supabase** → Logs per eventuali errori API

---

## ARCHITETTURA DEPLOY

```
GitHub (main) → Cloudflare Pages (auto-deploy)
                  ├── Static: site/* → bio-clinic.it
                  ├── Functions: functions/* → bio-clinic.it/api/*
                  ├── D1: bio-clinic-booking → booking data
                  ├── KV: BOOKING_KV → rate limiting
                  └── ENV: Supabase + Resend keys
                  
Supabase (PostgreSQL)
  ├── referti tables (existing)
  ├── admin tables (new - from migrations)
  └── Auth (admin users)
```
