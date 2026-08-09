-- ============================================================================
-- 017: Security Advisor Fixes
-- Date: 2026-08-09
-- Risolve: 69 errori Security Advisor Supabase
--   - 3 SECURITY DEFINER views (v_pip_riepilogo_accessi, v_pip_access_anomalies, v_worker_exam_history)
--   - 61+ tabelle pip_events_* senza RLS
--   - Tabelle applicative senza RLS (password_reset_tokens, user_sessions, pip_*, ecc.)
--
-- ISTRUZIONI: Copiare TUTTO e incollare nel SQL Editor di Supabase Dashboard
-- https://supabase.com/dashboard/project/mdxqgzkxrcrotxxbhoai/sql/new
-- Poi cliccare "Run" (o Ctrl+Enter)
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- SEZIONE 1: Fix SECURITY DEFINER views → SECURITY INVOKER
-- ═══════════════════════════════════════════════════════════════════════════

-- Fix TUTTE le viste public con security_definer in un colpo solo
DO $$
DECLARE
  v RECORD;
BEGIN
  FOR v IN
    SELECT c.relname AS viewname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND EXISTS (
        SELECT 1 FROM pg_options_to_table(c.reloptions)
        WHERE option_name = 'security_invoker' AND option_value = 'false'
      )
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v.viewname);
    RAISE NOTICE 'SECURITY INVOKER set on view: %', v.viewname;
  END LOOP;

  -- Anche le viste senza l'opzione esplicita ma create con CREATE VIEW ... WITH (security_barrier)
  -- o che sono SECURITY DEFINER per default (pre-PG15)
  FOR v IN
    SELECT viewname FROM pg_views WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v.viewname);
    EXCEPTION WHEN OTHERS THEN
      -- Ignora errori (es. vista di sistema)
      NULL;
    END;
  END LOOP;
  RAISE NOTICE 'All public views set to SECURITY INVOKER';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEZIONE 2: Enable RLS su TUTTE le tabelle public senza RLS
-- Include: pip_events_*, pip_*, crm_*, mdl_*, lab_*, e qualsiasi altra
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl RECORD;
  cnt INTEGER := 0;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND NOT rowsecurity
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    cnt := cnt + 1;
    RAISE NOTICE 'RLS enabled on: %', tbl.tablename;
  END LOOP;
  RAISE NOTICE 'Total tables fixed: %', cnt;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEZIONE 3: RLS policies per tabelle applicative sensibili
-- ═══════════════════════════════════════════════════════════════════════════

-- 3a. password_reset_tokens — nessun accesso diretto
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='password_reset_tokens' AND policyname='deny_all_password_reset_tokens') THEN
      EXECUTE 'CREATE POLICY deny_all_password_reset_tokens ON password_reset_tokens FOR ALL USING (false)';
      RAISE NOTICE 'Policy created: deny_all on password_reset_tokens';
    END IF;
  END IF;
END $$;

-- 3b. user_sessions — solo le proprie sessioni
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_sessions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_sessions' AND policyname='user_sessions_own_read') THEN
      EXECUTE 'CREATE POLICY user_sessions_own_read ON user_sessions FOR SELECT USING (user_id = current_user_id())';
      RAISE NOTICE 'Policy created: own_read on user_sessions';
    END IF;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEZIONE 4: Audit finale — verifica
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabelle ancora senza RLS (dovrebbe essere vuoto)
SELECT tablename AS "TABELLE ANCORA SENZA RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity
ORDER BY tablename;
