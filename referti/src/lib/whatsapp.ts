/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — WhatsApp Integration Module (WASenderAPI)
 * ============================================================================
 * Shared module for sending WhatsApp messages via WASenderAPI.
 * Used by notify-release, release, bulk-release, and cron/send-reminders.
 *
 * NOTE ON TIME WINDOWS:
 * - Release notifications (report released → email + WhatsApp) are sent
 *   IMMEDIATELY, 24/7, with NO time restriction.
 * - The 09:00–19:00 Europe/Rome window (isWithinReminderHours) applies
 *   ONLY to the 24h cron reminders.
 *
 * @version 1.1.0 — 2026-08-18 — Hour window scoped to reminders only
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppEnv {
  WASENDER_API_KEY?: string;
  WASENDER_SESSION_ID?: string;
  WASENDER_BASE_URL?: string;
}

export interface WhatsAppResult {
  success: boolean;
  provider_id?: string;
  error?: string;
  skipped?: boolean;
  skip_reason?: string;
}

export interface WhatsAppMessageParams {
  phone: string;
  firstName: string;
  lastName: string;
  reportNumber: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://wasenderapi.com/api';
const CLINIC_NAME = 'Bio-Clinic Sassari';
const PORTAL_URL = 'referti.bio-clinic.it';

// ── Phone Formatting ────────────────────────────────────────────────────────

/**
 * Normalizes an Italian phone number to E.164 format (+39XXXXXXXXXX).
 * Handles common formats:
 *   - 333 1234567 → +393331234567
 *   - +39 333 1234567 → +393331234567
 *   - 0039 333 1234567 → +393331234567
 *   - 393331234567 → +393331234567
 *   - +393331234567 → +393331234567
 *
 * Returns null if the number cannot be parsed.
 */
export function formatPhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all whitespace, dashes, dots, parentheses
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

  // Remove leading "00" international prefix
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // If starts with +, validate
  if (cleaned.startsWith('+')) {
    // Must be +39 followed by 9-10 digits for Italian numbers
    if (/^\+39\d{9,10}$/.test(cleaned)) {
      return cleaned;
    }
    // Other international numbers — return as-is if looks valid
    if (/^\+\d{10,15}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  // If starts with 39 and is 11-12 digits total, add +
  if (cleaned.startsWith('39') && /^39\d{9,10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // Italian mobile: starts with 3 and is 10 digits (3XX XXXXXXX)
  if (/^3\d{9}$/.test(cleaned)) {
    return '+39' + cleaned;
  }

  // Italian landline: starts with 0 and is 9-11 digits
  if (/^0\d{8,10}$/.test(cleaned)) {
    return '+39' + cleaned;
  }

  return null;
}

// ── Message Templates ───────────────────────────────────────────────────────

/**
 * Template A — Notifica rilascio referto (approvato dall'utente)
 */
export function messageReportReleased(params: WhatsAppMessageParams): string {
  return (
    `Gentile ${params.firstName} ${params.lastName},\n` +
    `il suo referto n. ${params.reportNumber} è ora disponibile.\n\n` +
    `Può consultarlo e scaricarlo accedendo a:\n` +
    `👉 ${PORTAL_URL}\n\n` +
    `${CLINIC_NAME}`
  );
}

/**
 * Template reminder — Promemoria dopo 24h se non scaricato
 */
export function messageReportReminder(params: WhatsAppMessageParams): string {
  return (
    `Gentile ${params.firstName} ${params.lastName},\n` +
    `le ricordiamo che il suo referto n. ${params.reportNumber} è disponibile per il download.\n\n` +
    `👉 ${PORTAL_URL}\n\n` +
    `${CLINIC_NAME}`
  );
}

// ── Send Function ───────────────────────────────────────────────────────────

/**
 * Sends a WhatsApp text message via WASenderAPI.
 * Returns a result object — never throws (graceful degradation).
 *
 * @param env - Environment variables containing WASENDER_* keys
 * @param phone - Patient phone number (will be normalized to E.164)
 * @param message - Text message to send
 */
export async function sendWhatsApp(
  env: WhatsAppEnv,
  phone: string | null | undefined,
  message: string
): Promise<WhatsAppResult> {
  // Guard: check configuration
  if (!env.WASENDER_API_KEY) {
    return { success: false, skipped: true, skip_reason: 'WASENDER_API_KEY not configured' };
  }

  // Guard: normalize phone number
  const formattedPhone = formatPhoneE164(phone);
  if (!formattedPhone) {
    return { success: false, skipped: true, skip_reason: 'Invalid or missing phone number' };
  }

  const baseUrl = env.WASENDER_BASE_URL || DEFAULT_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WASENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        text: message,
      }),
    });

    if (response.ok) {
      const data = await response.json() as { success?: boolean; messageId?: string; id?: string };
      return {
        success: true,
        provider_id: data.messageId || data.id || undefined,
      };
    }

    // Handle rate limit
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return {
        success: false,
        error: `Rate limited (retry after ${retryAfter || 'unknown'}s)`,
      };
    }

    // Handle other errors
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json() as { message?: string; error?: string };
      errorMsg = errBody.message || errBody.error || errorMsg;
    } catch { /* ignore parse error */ }

    return { success: false, error: errorMsg };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// ── Time Check ──────────────────────────────────────────────────────────────

/**
 * Check if current time in Italy (Europe/Rome) is within reminder hours (09:00–19:00).
 *
 * ⚠️ IMPORTANT — SCOPE OF THIS CHECK:
 * This time window applies ONLY to scheduled REMINDERS (cron/send-reminders).
 * Release notifications (email + WhatsApp sent when a report is released)
 * are ALWAYS sent immediately, at any hour of the day — even late at night.
 * Do NOT use this function to gate release notifications.
 */
export function isWithinReminderHours(): boolean {
  const now = new Date();
  // Get current hour in Europe/Rome timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(formatter.format(now), 10);
  return hour >= 9 && hour < 19;
}

/**
 * Check if a report is eligible for a 24h reminder:
 * - Released more than 24h ago
 * - Not downloaded by patient
 * - Not already reminded via WhatsApp
 */
export function isReminderEligible(
  releasedAt: string | null,
  patientDownloaded: boolean,
  hoursThreshold: number = 24
): boolean {
  if (!releasedAt) return false;
  if (patientDownloaded) return false;

  const releaseTime = new Date(releasedAt).getTime();
  const now = Date.now();
  const hoursSinceRelease = (now - releaseTime) / (1000 * 60 * 60);

  return hoursSinceRelease >= hoursThreshold;
}
