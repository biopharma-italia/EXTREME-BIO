/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Input Validators
 * ============================================================================
 */

/**
 * Validate Italian Fiscal Code (Codice Fiscale).
 * Format: 6 letters + 2 digits + 1 letter + 2 digits + 1 letter + 3 digits + 1 letter
 */
export function validateFiscalCode(cf: string | null | undefined): boolean {
  if (!cf) return true; // Optional field
  const cleaned = cf.trim().toUpperCase();
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(cleaned);
}

/**
 * Validate phone number (E.164 or Italian local format).
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

/**
 * Validate + normalize a MOBILE phone number for WhatsApp delivery.
 * Uses the SAME normalization logic as the WhatsApp send path
 * (formatPhoneE164 in whatsapp.ts) so a number saved as valid here
 * is guaranteed to be sendable later.
 *
 * Returns the normalized E.164 string, or null if not a valid mobile.
 * Accepts Italian mobiles (+393...) and international mobiles (+XX...).
 * Rejects Italian landlines (+390...) — they can't receive WhatsApp.
 */
export function normalizeMobilePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);

  if (cleaned.startsWith('+')) {
    if (/^\+39\d{9,10}$/.test(cleaned)) {
      return cleaned.startsWith('+393') ? cleaned : null; // reject landline
    }
    if (/^\+\d{10,15}$/.test(cleaned)) return cleaned; // other international
    return null;
  }
  if (cleaned.startsWith('39') && /^39\d{9,10}$/.test(cleaned)) {
    const e164 = '+' + cleaned;
    return e164.startsWith('+393') ? e164 : null;
  }
  if (/^3\d{9}$/.test(cleaned)) return '+39' + cleaned; // Italian mobile
  return null; // landlines (0...) and everything else rejected
}

/**
 * Validate email address.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate password strength.
 * Requirements: min 12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('La password deve contenere almeno 12 caratteri.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate report number format: REF-YYYY-NNNNNN
 */
export function validateReportNumber(num: string): boolean {
  return /^REF-[0-9]{4}-[0-9]{6}$/.test(num);
}

/**
 * Validate date string (ISO 8601: YYYY-MM-DD).
 */
export function validateDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

/**
 * Validate UUID v4 format.
 */
export function validateUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Sanitize string input: strip HTML tags, trim, enforce max length.
 */
export function sanitizeInput(str: string | null | undefined, maxLength: number = 500): string {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .replace(/<[^>]*>/g, '')  // Strip HTML tags
    .replace(/[<>]/g, '')      // Extra safety
    .substring(0, maxLength);
}

/**
 * Validate MIME type by checking magic bytes (first few bytes of file).
 * Only allows PDF files.
 */
export function validatePdfMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 5));
  // PDF magic bytes: %PDF-
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D;
}

/**
 * Validate file size (max 10MB).
 */
export function validateFileSize(bytes: number, maxMB: number = 10): boolean {
  return bytes > 0 && bytes <= maxMB * 1024 * 1024;
}
