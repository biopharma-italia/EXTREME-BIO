/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — TypeScript Type Definitions
 * ============================================================================
 */

// ── User Types ──────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'lab_technician' | 'physician' | 'admin' | 'super_admin' | 'ostetrica';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  phone: string | null;
  fiscal_code: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'M' | 'F' | 'X' | null;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  totp_enabled: boolean;
  preferred_notification_channel: NotificationChannel;
  language: string;
  timezone: string;
  referring_physician_id: string | null;
  last_login_at: string | null;
  login_count: number;
  failed_login_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  fiscal_code: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'M' | 'F' | 'X' | null;
  role: UserRole;
  totp_enabled: boolean;
  preferred_notification_channel: NotificationChannel;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

// ── Report Types ────────────────────────────────────────────────────────────

export type ReportStatus = 'pending' | 'validated' | 'signed' | 'released' | 'archived' | 'revoked';

export interface Report {
  id: string;
  report_number: string;
  patient_id: string;
  patient_fiscal_code: string | null;
  report_type: string;
  category: string | null;
  department: string;
  sample_date: string;
  sample_type: string | null;
  analysis_date: string | null;
  status: ReportStatus;
  uploaded_by: string;
  validated_by: string | null;
  validated_at: string | null;
  signed_by: string | null;
  signed_at: string | null;
  released_by: string | null;
  released_at: string | null;
  booking_id: string | null;
  is_urgent: boolean;
  has_abnormal_values: boolean;
  physician_notes: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  replacement_report_id: string | null;
  patient_notified: boolean;
  patient_notified_at: string | null;
  patient_viewed: boolean;
  patient_viewed_at: string | null;
  patient_downloaded: boolean;
  patient_downloaded_at: string | null;
  download_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  retention_expires: string | null;
}

export interface ReportListItem {
  id: string;
  report_number: string;
  report_type: string;
  category: string | null;
  sample_date: string;
  status: ReportStatus;
  is_urgent: boolean;
  has_abnormal_values: boolean;
  released_at: string | null;
  patient_viewed: boolean;
  download_count: number;
  file?: {
    mime_type: string;
    file_size_bytes: number;
  };
}

export interface ReportDetail extends Report {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    fiscal_code: string | null;
  };
  workflow?: {
    uploaded_by: string;
    uploaded_at: string;
    validated_by: string | null;
    validated_at: string | null;
    signed_by: string | null;
    signed_at: string | null;
    released_at: string | null;
  };
  files?: ReportFile[];
  notifications?: NotificationSummary[];
}

// ── File Types ──────────────────────────────────────────────────────────────

export interface ReportFile {
  id: string;
  report_id: string;
  storage_path: string;
  storage_bucket: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  checksum_sha256: string;
  is_encrypted: boolean;
  encryption_key_id: string | null;
  encryption_iv: string | null;
  file_type: string;
  is_primary: boolean;
  page_count: number | null;
  uploaded_by: string;
  created_at: string;
  deleted_at: string | null;
}

// ── Notification Types ──────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
  body_html: string | null;
  report_id: string | null;
  action_url: string | null;
  status: NotificationStatus;
  provider: string | null;
  provider_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  created_at: string;
}

export interface NotificationSummary {
  channel: NotificationChannel;
  status: NotificationStatus;
  sent_at: string | null;
}

// ── Audit Types ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'login' | 'login_failed' | 'logout'
  | 'password_change' | 'password_reset_request' | 'password_reset_complete'
  | 'totp_enable' | 'totp_disable' | 'totp_verify'
  | 'profile_update'
  | 'report_create' | 'report_update' | 'report_validate' | 'report_sign'
  | 'report_release' | 'report_revoke' | 'report_view' | 'report_download'
  | 'file_upload' | 'file_delete'
  | 'notification_send'
  | 'user_create' | 'user_update' | 'user_deactivate' | 'user_delete'
  | 'gdpr_consent_given' | 'gdpr_consent_revoked'
  | 'gdpr_data_export' | 'gdpr_data_delete'
  | 'admin_action' | 'api_key_create' | 'api_key_revoke';

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  user_role: UserRole | null;
  action: AuditAction;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  details: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

// ── GDPR Types ──────────────────────────────────────────────────────────────

export type ConsentType =
  | 'privacy_policy'
  | 'health_data_processing'
  | 'electronic_delivery'
  | 'email_notifications'
  | 'sms_notifications'
  | 'marketing';

export interface GdprConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  version: string;
  given: boolean;
  given_at: string;
  revoked_at: string | null;
  created_at: string;
}

export type GdprRequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface GdprDataRequest {
  id: string;
  user_id: string;
  request_type: GdprRequestType;
  status: GdprRequestStatus;
  description: string | null;
  processed_by: string | null;
  processed_at: string | null;
  response_notes: string | null;
  deadline: string;
  created_at: string;
  updated_at: string;
}

// ── API Types ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface LoginResponse {
  success: boolean;
  requires_2fa?: boolean;
  temp_token?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  user?: UserProfile;
  message?: string;
}

export interface AdminDashboardStats {
  reports: {
    total: number;
    pending: number;
    validated: number;
    signed: number;
    released_today: number;
    urgent_pending: number;
    abnormal_pending: number;
  };
  users: {
    total_patients: number;
    active_last_30d: number;
    new_registrations_today: number;
  };
  notifications: {
    queued: number;
    failed: number;
  };
  storage: {
    total_files: number;
    total_size_gb: number;
  };
}

// ── Request Context (passed through middleware) ─────────────────────────────

export interface RequestContext {
  requestId: string;
  user: {
    id: string;
    auth_id: string;
    role: UserRole;
    email: string;
  } | null;
  ip: string;
  userAgent: string;
}
