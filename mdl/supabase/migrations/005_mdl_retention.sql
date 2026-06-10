-- ============================================================================
-- 005: MDL Data Retention
-- Politica di conservazione dati (confermata dal titolare):
--   • Audit log / notifiche ............... 48 mesi  (purge automatico)
--   • Cartella sanitaria + giudizi + referti .. 10 anni dalla cessazione
--   • Esposti a cancerogeni/mutageni/amianto ... 40 anni dalla cessazione
--
-- NB: i dati SANITARI non vengono mai cancellati automaticamente.
-- Questa migration:
--   1) crea mdl_retention_audit_cleanup() → purge automatico SOLO di
--      audit_log e notifiche oltre i 48 mesi;
--   2) crea la vista mdl_retention_review → elenca le cartelle eleggibili
--      alla cancellazione (10/40 anni), per revisione e cancellazione
--      MANUALE da parte del Medico Competente.
-- ============================================================================

-- ─── 1. Purge automatico audit/notifiche (48 mesi) ─────────────────────────
CREATE OR REPLACE FUNCTION mdl_retention_audit_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_deleted BIGINT;
  notif_deleted BIGINT;
  cutoff TIMESTAMPTZ := NOW() - INTERVAL '48 months';
BEGIN
  DELETE FROM mdl_audit_log WHERE created_at < cutoff;
  GET DIAGNOSTICS audit_deleted = ROW_COUNT;

  DELETE FROM mdl_notifications
   WHERE created_at < cutoff
     AND status IN ('sent', 'delivered', 'read', 'failed');
  GET DIAGNOSTICS notif_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'cutoff', cutoff,
    'audit_deleted', audit_deleted,
    'notifications_deleted', notif_deleted,
    'run_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION mdl_retention_audit_cleanup() IS
  'Purga audit_log e notifiche oltre 48 mesi. Da schedulare via pg_cron.';

-- Schedulazione settimanale (richiede estensione pg_cron, abilitabile dalla
-- dashboard Supabase → Database → Extensions). Decommentare dopo l''abilitazione:
--
-- SELECT cron.schedule(
--   'mdl-retention-audit-weekly',
--   '0 3 * * 1',                       -- ogni lunedì 03:00
--   $$SELECT mdl_retention_audit_cleanup();$$
-- );

-- ─── 2. Vista di revisione cartelle sanitarie (10 / 40 anni) ───────────────
-- Classe 40 anni se il lavoratore ha (o ha avuto) una mansione con fattori di
-- rischio cancerogeni/mutageni/amianto; altrimenti 10 anni.
CREATE OR REPLACE VIEW mdl_retention_review AS
WITH worker_risk AS (
  SELECT
    w.id AS worker_id,
    bool_or(
      jr.risk_factors && ARRAY['cancerogeno','cancerogeni','mutageno','mutageni','amianto']
    ) AS has_carcinogen_exposure
  FROM mdl_workers w
  LEFT JOIN mdl_worker_jobs wj ON wj.worker_id = w.id
  LEFT JOIN mdl_job_roles jr ON jr.id = wj.job_role_id
  GROUP BY w.id
)
SELECT
  w.id                                   AS worker_id,
  w.company_id,
  w.last_name,
  w.first_name,
  w.fiscal_code,
  w.termination_date,
  CASE WHEN wr.has_carcinogen_exposure THEN '40y' ELSE '10y' END AS retention_class,
  CASE
    WHEN w.termination_date IS NULL THEN NULL
    WHEN wr.has_carcinogen_exposure THEN w.termination_date + INTERVAL '40 years'
    ELSE w.termination_date + INTERVAL '10 years'
  END                                    AS retention_until,
  (
    w.termination_date IS NOT NULL
    AND NOW() > (
      w.termination_date
      + CASE WHEN wr.has_carcinogen_exposure THEN INTERVAL '40 years' ELSE INTERVAL '10 years' END
    )
  )                                      AS eligible_for_deletion
FROM mdl_workers w
JOIN worker_risk wr ON wr.worker_id = w.id
WHERE w.termination_date IS NOT NULL;

COMMENT ON VIEW mdl_retention_review IS
  'Cartelle sanitarie eleggibili a cancellazione (10/40 anni dalla cessazione). Sola revisione: la cancellazione è manuale e a cura del Medico Competente.';
