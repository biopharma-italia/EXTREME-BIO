-- ============================================================================
-- 004: MDL Audit Actions Fix
-- Aggiunge i valori enum usati dal codice ma mancanti in mdl_audit_action.
-- Senza questi, gli INSERT di audit per upload/download/aggiornamento visita
-- fallivano silenziosamente (vincolo enum) → tracciamento accessi clinici
-- non registrato (criticità GDPR art. 9/32).
--
-- NOTA: ALTER TYPE ... ADD VALUE non può essere eseguito dentro una
-- transazione esplicita; eseguire ogni statement singolarmente.
-- ============================================================================

ALTER TYPE mdl_audit_action ADD VALUE IF NOT EXISTS 'file_upload';
ALTER TYPE mdl_audit_action ADD VALUE IF NOT EXISTS 'file_download';
ALTER TYPE mdl_audit_action ADD VALUE IF NOT EXISTS 'visit_update';
