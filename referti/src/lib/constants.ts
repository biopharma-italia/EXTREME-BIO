/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Constants
 * ============================================================================
 */

export const APP_NAME = 'Bio-Clinic Referti';
export const APP_URL = 'https://referti.bio-clinic.it';
export const MAIN_SITE_URL = 'https://bio-clinic.it';
export const SUPPORT_EMAIL = 'gestione@bio-clinic.it';
export const SUPPORT_PHONE = '+39 079 956 1332';

// Routes
export const ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  dashboard: '/dashboard',
  reports: '/dashboard/referti',
  reportDetail: (id: string) => `/dashboard/referto/${id}`,
  profile: '/dashboard/profilo',
  notifications: '/dashboard/notifiche',
  privacy: '/dashboard/privacy',
  lab: '/lab',
  labUpload: '/lab/carica',
  labQueue: '/lab/coda',
  labPatients: '/lab/pazienti',
  labBulkRelease: '/lab/rilascio-multiplo',
  admin: '/admin',
  adminUsers: '/admin/utenti',
  adminAuditLog: '/admin/audit-log',
  adminGdpr: '/admin/gdpr',
  adminSettings: '/admin/impostazioni',
} as const;

// Report categories
export const REPORT_CATEGORIES = [
  { value: 'ematologia', label: 'Ematologia' },
  { value: 'microbiologia', label: 'Microbiologia' },
  { value: 'biochimica', label: 'Biochimica' },
  { value: 'immunologia', label: 'Immunologia' },
  { value: 'endocrinologia', label: 'Endocrinologia' },
  { value: 'allergologia', label: 'Allergologia' },
  { value: 'genetica', label: 'Genetica' },
  { value: 'tossicologia', label: 'Tossicologia' },
  { value: 'profilo', label: 'Profilo Completo' },
  { value: 'altro', label: 'Altro' },
] as const;

// Sample types
export const SAMPLE_TYPES = [
  { value: 'sangue', label: 'Sangue' },
  { value: 'urine', label: 'Urine' },
  { value: 'tampone', label: 'Tampone' },
  { value: 'feci', label: 'Feci' },
  { value: 'liquido', label: 'Liquido biologico' },
  { value: 'altro', label: 'Altro' },
] as const;

// File limits
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['application/pdf'] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Password policy
export const PASSWORD_MIN_LENGTH = 12;

// 2FA
export const BACKUP_CODES_COUNT = 10;
export const TOTP_ISSUER = 'Bio-Clinic Referti';
