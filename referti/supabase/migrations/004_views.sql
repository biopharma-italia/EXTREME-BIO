-- ============================================================================
-- 004: Views — Dashboard convenience views
-- ============================================================================

CREATE VIEW v_patient_reports AS
SELECT r.id, r.report_number, r.report_type, r.category, r.sample_date,
  r.status, r.is_urgent, r.has_abnormal_values, r.released_at,
  r.patient_viewed, r.patient_downloaded, r.download_count,
  u.first_name || ' ' || u.last_name AS patient_name,
  u.fiscal_code AS patient_fiscal_code,
  rf.storage_path AS file_path, rf.file_size_bytes, rf.mime_type
FROM reports r
JOIN users u ON r.patient_id = u.id
LEFT JOIN report_files rf ON rf.report_id = r.id AND rf.is_primary = true
WHERE r.deleted_at IS NULL;

CREATE VIEW v_pending_actions AS
SELECT 'report' AS item_type, r.id AS item_id, r.report_number AS reference,
  r.status::TEXT AS current_status, r.created_at,
  u.first_name || ' ' || u.last_name AS patient_name,
  CASE r.status
    WHEN 'pending' THEN 'Validazione richiesta'
    WHEN 'validated' THEN 'Firma medico richiesta'
    WHEN 'signed' THEN 'Rilascio al paziente'
    ELSE 'Azione sconosciuta'
  END AS action_required
FROM reports r JOIN users u ON r.patient_id = u.id
WHERE r.status IN ('pending', 'validated', 'signed') AND r.deleted_at IS NULL
ORDER BY r.is_urgent DESC, r.created_at ASC;
