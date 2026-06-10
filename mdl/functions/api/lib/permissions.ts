/**
 * MDL Bio-Clinic — Centralised RBAC Permission Module
 * ════════════════════════════════════════════════════════════════════════════
 * Single source of truth for role definitions, permission checks,
 * and data-sanitisation helpers.
 *
 * Conforme a:
 *   • D.Lgs. 81/2008 art. 25 (separazione dati clinici)
 *   • GDPR art. 9 (trattamento dati sanitari)
 *
 * Macro-categorie:
 *   CLINICAL  → super_admin, medico_competente, medico_collaboratore
 *   ADMIN     → super_admin, segreteria_mdl
 *   COMPANY   → datore_lavoro, rspp
 *   WORKER    → lavoratore
 */

// ═══════════════════════════════════════════════════════════════════════════
//  ROLE GROUPS
// ═══════════════════════════════════════════════════════════════════════════

/** Roles that can view and write ALL clinical / health data. */
export const CLINICAL_ROLES = [
  'super_admin',
  'medico_competente',
  'medico_collaboratore',
] as const;

/** Physician roles (MC) — can issue fitness judgments, write clinical fields. */
export const MC_ROLES = CLINICAL_ROLES;

/** Administrative roles — can manage scheduling, documents, companies. */
export const ADMIN_ROLES = [
  'super_admin',
  'medico_competente',
  'medico_collaboratore',
  'segreteria_mdl',
] as const;

/** Company-side roles — see only their own company, no clinical data. */
export const COMPANY_ROLES = [
  'datore_lavoro',
  'rspp',
] as const;

/** All roles that may read general platform data (excluding lavoratore). */
export const ALL_INTERNAL_ROLES = [
  ...ADMIN_ROLES,
  ...COMPANY_ROLES,
] as const;

// ═══════════════════════════════════════════════════════════════════════════
//  PERMISSION CHECKS
// ═══════════════════════════════════════════════════════════════════════════

type Role = string;

/** Can the role view clinical / health data (anamnesis, exams, referti, clinical notes)? */
export function canViewClinicalData(role: Role): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Can the role view sensitive worker flags (is_pregnant, is_disabled, is_minor)? */
export function canViewSensitiveWorkerData(role: Role): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Can the role write clinical fields on a visit (anamnesis, exam results, conclusions)? */
export function canWriteClinicalData(role: Role): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Can the role manage scheduling (create/modify appointments)? */
export function canManageAppointments(role: Role): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Can the role create/update companies and workers? */
export function canWriteCompany(role: Role): boolean {
  return ['super_admin', 'medico_competente', 'segreteria_mdl'].includes(role);
}

/** Can the role upload clinical files (referti)? */
export function canUploadClinicalFiles(role: Role): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Can the role download clinical files (referti, visit_exams attachments)? */
export function canDownloadClinicalFiles(role: Role): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Can the role view audit logs? */
export function canViewAuditLog(role: Role): boolean {
  return ['super_admin', 'medico_competente'].includes(role);
}

/** Is the role a company-side role (scoped to their own company)? */
export function isCompanyRole(role: Role): boolean {
  return (COMPANY_ROLES as readonly string[]).includes(role);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DATA SANITISATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Worker fields considered sensitive / clinical.
 * Must NOT be exposed to COMPANY_ROLES or segreteria_mdl.
 */
const SENSITIVE_WORKER_FIELDS = [
  'is_pregnant',
  'is_disabled',
  'is_minor',
  'notes',            // may contain clinical notes
] as const;

/**
 * Worker fields that are safe for company-side roles (DL / RSPP).
 * Used as explicit select list when querying for company roles.
 */
export const WORKER_SAFE_SELECT = [
  'id', 'company_id', 'site_id', 'fiscal_code',
  'first_name', 'last_name', 'date_of_birth', 'place_of_birth', 'gender',
  'address_street', 'address_city', 'address_province', 'address_zip',
  'phone', 'email', 'language',
  'hire_date', 'contract_type', 'qualification', 'department', 'work_schedule',
  'is_night_worker', 'is_active', 'created_at', 'updated_at',
].join(', ');

/**
 * Strip sensitive fields from a worker object (in-place).
 * Returns the same object with sensitive keys set to undefined.
 */
export function stripSensitiveWorkerFields(worker: any): any {
  if (!worker) return worker;
  for (const field of SENSITIVE_WORKER_FIELDS) {
    delete worker[field];
  }
  return worker;
}

/**
 * Visit fields that are clinical.
 * Must be nulled for non-clinical roles.
 */
const CLINICAL_VISIT_FIELDS = [
  'anamnesis_family',
  'anamnesis_physiological',
  'anamnesis_pathological_remote',
  'anamnesis_pathological_recent',
  'anamnesis_occupational',
  'physical_examination',
  'conclusions',
  'height_cm',
  'weight_kg',
  'bmi',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'visual_acuity_right',
  'visual_acuity_left',
] as const;

/**
 * Visit fields safe for non-clinical roles (DL / RSPP / segreteria).
 * Used as explicit select list.
 */
export const VISIT_SAFE_SELECT =
  'id, worker_id, company_id, visit_type, protocol_id, scheduled_date, scheduled_time, actual_date, status, physician_id, location, duration_minutes, created_at, updated_at';

/**
 * Strip clinical data from a visit object (in-place).
 * Nulls all clinical fields so they appear as "not set".
 */
export function stripClinicalVisitFields(visit: any): any {
  if (!visit) return visit;
  for (const field of CLINICAL_VISIT_FIELDS) {
    visit[field] = null;
  }
  // Also strip notes — may contain clinical observations
  visit.notes = null;
  return visit;
}

/**
 * Strip clinical motivation from a fitness judgment.
 * DL/RSPP/segreteria may see judgment_type, prescriptions, limitations
 * (per D.Lgs. 81/2008 art. 41 co. 6-bis) but NOT clinical_motivation.
 */
export function stripFitnessJudgmentClinicalFields(judgment: any): any {
  if (!judgment) return judgment;
  const { clinical_motivation, ...safe } = judgment;
  return safe;
}

/**
 * File download categories allowed for non-clinical roles.
 * DL/RSPP/segreteria can only download:
 *   - idoneita (fitness certificates — the legal output)
 *   - company_docs (DVR, Nomina MC, Visura, etc.)
 */
export const NON_CLINICAL_DOWNLOAD_CATEGORIES = ['idoneita', 'company_docs'];

/**
 * File upload categories allowed for segreteria.
 * Segreteria can upload company_docs and idoneita (administrative docs),
 * but NOT referti (clinical results).
 */
export const SEGRETERIA_UPLOAD_CATEGORIES = ['idoneita', 'company_docs'];

/**
 * Visit statuses that segreteria can set.
 * Segreteria handles scheduling, NOT clinical completion.
 */
export const SEGRETERIA_ALLOWED_STATUSES = [
  'programmata',
  'confermata',
  'annullata',
];

/**
 * Visit fields that segreteria can update.
 * NO clinical fields, NO 'completata' status, NO 'notes' (may be clinical).
 */
export const SEGRETERIA_VISIT_WRITE_FIELDS = [
  'scheduled_date',
  'scheduled_time',
  'location',
  'duration_minutes',
  'status',
];

/**
 * Worker fields that segreteria can update.
 * Excludes is_pregnant, is_disabled, is_minor (clinical/sensitive).
 */
export const SEGRETERIA_WORKER_WRITE_FIELDS = [
  'first_name', 'last_name', 'fiscal_code', 'date_of_birth', 'place_of_birth',
  'gender', 'address_street', 'address_city', 'address_province', 'address_zip',
  'phone', 'email', 'language', 'hire_date', 'contract_type', 'qualification',
  'department', 'work_schedule', 'is_night_worker', 'is_active',
];

/**
 * Worker fields that clinical roles (MC) can update — includes sensitive flags.
 */
export const CLINICAL_WORKER_WRITE_FIELDS = [
  ...SEGRETERIA_WORKER_WRITE_FIELDS,
  'is_pregnant', 'is_minor', 'is_disabled', 'notes',
];
