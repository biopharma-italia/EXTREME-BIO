-- ============================================================================
-- Migration 011: Security Audit Fixes
-- ============================================================================
-- - Add backup_codes_hashes column to totp_secrets (hashed backup codes)
-- - Add indexes on notifications(status) and notifications(user_id)
-- - Add index on audit_log(user_id, created_at) for GDPR data export
--
-- @date 2026-05-11

-- ── backup_codes_hashes column ──────────────────────────────────────────────
-- Stores SHA-256 hashes of backup codes (replaces plaintext backup_codes).
-- The old backup_codes column is kept for backwards compatibility but will
-- be deprecated once all existing backup codes are migrated.

ALTER TABLE totp_secrets
  ADD COLUMN IF NOT EXISTS backup_codes_hashes text[] DEFAULT '{}';

COMMENT ON COLUMN totp_secrets.backup_codes_hashes IS
  'SHA-256 hashes of one-time backup codes. Replaces plaintext backup_codes.';

-- ── Notification indexes ────────────────────────────────────────────────────
-- Speeds up queries that filter by status (e.g., queued, sent, failed)
-- and queries that look up notifications per user.

CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON notifications (status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON notifications (user_id, status);

-- ── Audit log index for GDPR exports ────────────────────────────────────────
-- The data-export endpoint queries audit_log by user_id ordered by created_at.

CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON audit_log (user_id, created_at DESC);
