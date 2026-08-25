/**
 * ============================================================================
 * BIO-CLINIC — WhatsApp Notification Diagnostics
 * ============================================================================
 * Route: GET /api/booking/wa-status
 *
 * Diagnostica lo stato del canale di conferma WhatsApp (WASenderAPI):
 *   1. Stato della sessione WhatsApp (connected / disconnected / need_scan...)
 *   2. Log di invio recenti da KV (wa_notify:{booking_id})
 *   3. Dettaglio per singola prenotazione: ?id=bc_book_...
 *
 * Privacy: i numeri di telefono sono mascherati (+39*******123).
 * Nessun dato paziente (nomi, email) viene esposto.
 *
 * @version 1.0.0 — 2026-08-25
 */

const DEFAULT_BASE_URL = 'https://wasenderapi.com/api';

function maskPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  if (s.length <= 4) return '****';
  return s.slice(0, 3) + '*'.repeat(Math.max(s.length - 6, 3)) + s.slice(-3);
}

async function getSessionStatus(env) {
  if (!env.WASENDER_API_KEY) {
    return { configured: false, status: 'not_configured' };
  }
  const baseUrl = env.WASENDER_BASE_URL || DEFAULT_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/status`, {
      headers: { 'Authorization': `Bearer ${env.WASENDER_API_KEY}` },
    });
    if (!res.ok) {
      return { configured: true, status: 'api_error', http_status: res.status };
    }
    const data = await res.json();
    // WASender risponde { status: "connected" | "disconnected" | "need_scan" | ... }
    return {
      configured: true,
      status: data.status || data.data?.status || 'unknown',
    };
  } catch (err) {
    return { configured: true, status: 'network_error', error: (err && err.message) || 'fetch failed' };
  }
}

async function checkOnWhatsApp(env, phoneE164) {
  if (!env.WASENDER_API_KEY || !phoneE164) return null;
  const baseUrl = env.WASENDER_BASE_URL || DEFAULT_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/on-whatsapp/${encodeURIComponent(phoneE164)}`, {
      headers: { 'Authorization': `Bearer ${env.WASENDER_API_KEY}` },
    });
    if (!res.ok) return { checked: false, http_status: res.status };
    const data = await res.json();
    const payload = data.data || data;
    return {
      checked: true,
      exists: payload.exists ?? payload.onWhatsApp ?? payload.on_whatsapp ?? null,
    };
  } catch (err) {
    return { checked: false, error: (err && err.message) || 'fetch failed' };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('id');
  const phoneQuery = url.searchParams.get('phone');

  const out = {
    ok: true,
    ts: new Date().toISOString(),
    wasender_session: await getSessionStatus(env),
    kv_bound: !!env.BOOKING_KV,
  };

  if (env.BOOKING_KV) {
    if (bookingId && /^bc_book_[a-z0-9_]+$/i.test(bookingId)) {
      // Dettaglio singola prenotazione
      const raw = await env.BOOKING_KV.get(`wa_notify:${bookingId}`);
      if (raw) {
        const log = JSON.parse(raw);
        out.notify_log = {
          booking_id: log.booking_id,
          phone_masked: maskPhone(log.phone),
          success: log.success,
          skipped: log.skipped,
          error: log.error,
          provider_id: log.provider_id,
          sent_at: log.sent_at,
        };
      } else {
        out.notify_log = null;
        out.notify_log_note = 'Nessun log wa_notify per questo ID: o la prenotazione non esiste, o WASENDER_API_KEY non era configurata al momento della prenotazione (invio mai tentato), o il log è scaduto (TTL 90gg).';
      }
    } else if (phoneQuery && /^\+?\d{8,15}$/.test(phoneQuery.replace(/\D/g, ''))) {
      // Ricerca invii per numero di telefono (match su cifre finali)
      const digits = phoneQuery.replace(/\D/g, '');
      const list = await env.BOOKING_KV.list({ prefix: 'wa_notify:', limit: 100 });
      const matches = [];
      for (const key of list.keys) {
        const raw = await env.BOOKING_KV.get(key.name);
        if (!raw) continue;
        try {
          const log = JSON.parse(raw);
          const logDigits = String(log.phone || '').replace(/\D/g, '');
          if (logDigits.endsWith(digits) || digits.endsWith(logDigits)) {
            matches.push({
              booking_id: log.booking_id,
              phone_masked: maskPhone(log.phone),
              success: log.success,
              skipped: log.skipped || false,
              error: log.error,
              provider_id: log.provider_id,
              sent_at: log.sent_at,
            });
          }
        } catch { /* ignore */ }
      }
      matches.sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)));
      out.phone_query_masked = maskPhone(digits);
      out.matches = matches;
      out.match_count = matches.length;
      // Verifica se il numero è registrato su WhatsApp
      const e164 = digits.startsWith('39') ? '+' + digits : '+39' + digits;
      out.on_whatsapp_check = await checkOnWhatsApp(env, e164);
    } else {
      // Statistiche aggregate (nessun dato personale esposto)
      const list = await env.BOOKING_KV.list({ prefix: 'wa_notify:', limit: 100 });
      const stats = { total: 0, sent: 0, skipped: 0, failed: 0, last_error: null, last_sent_at: null };
      for (const key of list.keys) {
        const raw = await env.BOOKING_KV.get(key.name);
        if (!raw) continue;
        try {
          const log = JSON.parse(raw);
          stats.total++;
          if (log.success) stats.sent++;
          else if (log.skipped) stats.skipped++;
          else stats.failed++;
          if (!log.success && log.error) stats.last_error = log.error;
          if (!stats.last_sent_at || String(log.sent_at) > stats.last_sent_at) {
            stats.last_sent_at = log.sent_at;
          }
        } catch { /* ignore */ }
      }
      out.notify_stats_90d = stats;
      out.hint = 'Per il dettaglio di una prenotazione: ?id=bc_book_xxx (il codice ricevuto alla conferma).';
    }
  }

  return new Response(JSON.stringify(out, null, 2), { status: 200, headers });
}
