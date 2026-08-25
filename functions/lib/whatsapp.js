/**
 * ============================================================================
 * BIO-CLINIC.IT — WhatsApp Integration (WASenderAPI)
 * ============================================================================
 * Port JS della libreria referti/src/lib/whatsapp.ts per le Pages Functions
 * del sito principale. Usata da /api/booking/confirm per inviare la conferma
 * di prenotazione laboratorio via WhatsApp.
 *
 * Env richiesti (secrets progetto CF Pages "bio-clinic"):
 *   WASENDER_API_KEY   — Bearer token WASenderAPI (sessione 111713)
 *   WASENDER_BASE_URL  — opzionale, default https://wasenderapi.com/api
 *
 * @version 1.0.0 — 2026-08-19
 */

const DEFAULT_BASE_URL = 'https://wasenderapi.com/api';

/**
 * Normalizza un numero italiano in formato E.164 (+39XXXXXXXXXX).
 * Ritorna null se non parsabile.
 */
export function formatPhoneE164(phone) {
  if (!phone) return null;

  let cleaned = String(phone).replace(/[\s\-\.\(\)]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (cleaned.startsWith('+')) {
    if (/^\+39\d{9,10}$/.test(cleaned)) return cleaned;
    if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;
    return null;
  }

  if (cleaned.startsWith('39') && /^39\d{9,10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // Mobile italiano: 3XX XXXXXXX
  if (/^3\d{9}$/.test(cleaned)) return '+39' + cleaned;

  // Fisso italiano: 0XXXXXXXXX
  if (/^0\d{8,10}$/.test(cleaned)) return '+39' + cleaned;

  return null;
}

/**
 * Template — Conferma prenotazione laboratorio.
 */
export function messageBookingConfirmed(params) {
  const lines = [
    `Gentile ${params.patientName},`,
    `la sua prenotazione presso Bio-Clinic Sassari \u00e8 confermata \u2705`,
    '',
    `\ud83d\udccb ${params.serviceName}`,
    `\ud83d\udcc5 ${params.dateFormatted}`,
    `\ud83d\udd52 ore ${params.time}`,
    `\ud83d\udd16 Codice: ${params.bookingId}`,
  ];

  if (params.prepInstructions) {
    lines.push('', `\u26a0\ufe0f Preparazione: ${params.prepInstructions}`);
  }

  lines.push(
    '',
    '\ud83d\udccd Via Renzo Mossa 23, Sassari',
    'Per modifiche o disdette: 079 956 1332',
    '',
    'Bio-Clinic Sassari'
  );

  return lines.join('\n');
}

/**
 * Invia un messaggio WhatsApp via WASenderAPI.
 * Ritorna { success, provider_id?, error?, skipped?, skip_reason? }.
 * Non lancia mai eccezioni.
 */
export async function sendWhatsApp(env, phone, message) {
  if (!env.WASENDER_API_KEY) {
    return { success: false, skipped: true, skip_reason: 'WASENDER_API_KEY not configured' };
  }

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
      body: JSON.stringify({ to: formattedPhone, text: message }),
    });

    if (response.ok) {
      const data = await response.json();
      const payload = data.data || data;
      return {
        success: true,
        provider_id: payload.msgId || payload.messageId || payload.id || undefined
      };
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return { success: false, error: `Rate limited (retry after ${retryAfter || 'unknown'}s)` };
    }

    let errorMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorMsg = errBody.message || errBody.error || errorMsg;
    } catch { /* ignore */ }

    return { success: false, error: errorMsg };
  } catch (err) {
    return { success: false, error: (err && err.message) || 'Network error' };
  }
}
