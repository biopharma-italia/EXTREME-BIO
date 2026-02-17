/**
 * ============================================================================
 * BIO-CLINIC LABORATORY BOOKING API — Slot Availability
 * ============================================================================
 *
 * Route: GET /api/booking/slots?date=YYYY-MM-DD&service_id=prelievo-standard
 *
 * Returns available time slots for a given date + service.
 * Computes capacity dynamically: schedule_rules - existing bookings - overrides.
 *
 * When D1 is not bound, returns deterministic mock slots based on day-of-week
 * schedule rules (Mon-Fri 07:00-20:00, Sat 08:00-13:00).
 *
 * @version 2.0.0
 * @date 2026-02-17
 */

import { FALLBACK_SERVICES } from './_services-data.js';

// Default lab schedule (matches D1 seed data)
const DEFAULT_SCHEDULE = {
  1: { start: '07:00', end: '20:00', interval: 15 }, // Mon
  2: { start: '07:00', end: '20:00', interval: 15 }, // Tue
  3: { start: '07:00', end: '20:00', interval: 15 }, // Wed
  4: { start: '07:00', end: '20:00', interval: 15 }, // Thu
  5: { start: '07:00', end: '20:00', interval: 15 }, // Fri
  6: { start: '08:00', end: '13:00', interval: 15 }, // Sat
  // 0: Sunday = closed
};

function generateTimeSlots(startTime, endTime, intervalMin) {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += intervalMin;
  }
  return slots;
}

function validateDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  return d;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || 'https://bio-clinic.it',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date');
  const serviceId = url.searchParams.get('service_id');

  const headers = {
    ...corsHeaders(env),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  // Validate inputs
  if (!dateStr || !serviceId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Parametri mancanti: date e service_id sono obbligatori.'
    }), { status: 400, headers });
  }

  const requestedDate = validateDate(dateStr);
  if (!requestedDate) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Formato data non valido. Usare YYYY-MM-DD.'
    }), { status: 400, headers });
  }

  // Don't allow dates in the past
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const today = new Date(todayStr + 'T00:00:00Z');
  if (requestedDate < today) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Non \u00e8 possibile prenotare per date passate.'
    }), { status: 400, headers });
  }

  // Don't allow dates more than 60 days out
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  if (requestedDate > maxDate) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Prenotazioni disponibili fino a 60 giorni in anticipo.'
    }), { status: 400, headers });
  }

  const dayOfWeek = requestedDate.getUTCDay(); // 0=Sun

  try {
    // Resolve service (D1 or fallback)
    let service;
    if (env.BOOKING_DB) {
      try {
        service = await env.BOOKING_DB.prepare(
          `SELECT * FROM services WHERE id = ? AND active = 1`
        ).bind(serviceId).first();
      } catch (e) {
        console.error('[BookingAPI] D1 service lookup failed:', e.message);
      }
    }
    if (!service) {
      service = FALLBACK_SERVICES.find(s => s.id === serviceId && s.active !== false);
    }
    if (!service) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Servizio non trovato.'
      }), { status: 404, headers });
    }

    const maxPerSlot = service.max_per_slot || 3;

    // Get schedule for this day
    let schedule = null;
    if (env.BOOKING_DB) {
      try {
        const rule = await env.BOOKING_DB.prepare(
          `SELECT start_time, end_time, slot_interval
           FROM schedule_rules
           WHERE department = 'laboratorio' AND day_of_week = ? AND is_active = 1
           AND (valid_from IS NULL OR valid_from <= ?)
           AND (valid_until IS NULL OR valid_until >= ?)
           LIMIT 1`
        ).bind(dayOfWeek, dateStr, dateStr).first();

        if (rule) {
          schedule = { start: rule.start_time, end: rule.end_time, interval: rule.slot_interval };
        }

        // Check date override (closures, modified hours)
        const override = await env.BOOKING_DB.prepare(
          `SELECT is_closed, start_time, end_time FROM schedule_overrides
           WHERE department = 'laboratorio' AND override_date = ?
           LIMIT 1`
        ).bind(dateStr).first();

        if (override) {
          if (override.is_closed) {
            return new Response(JSON.stringify({
              success: true,
              date: dateStr,
              service_id: serviceId,
              slots: [],
              message: 'Laboratorio chiuso in questa data.'
            }), { status: 200, headers });
          }
          if (override.start_time && override.end_time) {
            schedule = { ...schedule, start: override.start_time, end: override.end_time };
          }
        }
      } catch (e) {
        console.error('[BookingAPI] D1 schedule query failed:', e.message);
      }
    }

    // Fallback schedule
    if (!schedule) {
      schedule = DEFAULT_SCHEDULE[dayOfWeek] || null;
    }

    // No schedule for this day (e.g., Sunday)
    if (!schedule) {
      return new Response(JSON.stringify({
        success: true,
        date: dateStr,
        service_id: serviceId,
        service_name: service.name,
        slots: [],
        message: dayOfWeek === 0
          ? 'Laboratorio chiuso la domenica.'
          : 'Nessun orario disponibile per questa data.'
      }), { status: 200, headers });
    }

    // Generate all time slots
    const allSlots = generateTimeSlots(schedule.start, schedule.end, schedule.interval);

    // Count existing bookings per slot (D1 or KV)
    let bookingCounts = {};
    if (env.BOOKING_DB) {
      try {
        const bookings = await env.BOOKING_DB.prepare(
          `SELECT booking_time, COUNT(*) as cnt
           FROM bookings
           WHERE booking_date = ? AND service_id = ? AND status IN ('confirmed', 'completed')
           GROUP BY booking_time`
        ).bind(dateStr, serviceId).all();
        for (const row of bookings.results) {
          bookingCounts[row.booking_time] = row.cnt;
        }

        // Check blocked slots
        const blocked = await env.BOOKING_DB.prepare(
          `SELECT blocked_time FROM blocked_slots
           WHERE department = 'laboratorio' AND blocked_date = ?`
        ).bind(dateStr).all();
        for (const row of blocked.results) {
          bookingCounts[row.blocked_time] = maxPerSlot; // fully blocked
        }
      } catch (e) {
        console.error('[BookingAPI] D1 booking count failed:', e.message);
      }
    } else if (env.BOOKING_KV) {
      // KV-based slot counting: read individual slot counters
      // Each key: slot_count:{date}:{time}:{serviceId} = count
      for (const time of allSlots) {
        const key = `slot_count:${dateStr}:${time}:${serviceId}`;
        const count = parseInt(await env.BOOKING_KV.get(key)) || 0;
        if (count > 0) {
          bookingCounts[time] = count;
        }
      }
    }

    // Filter same-day: hide past slots (with 30 min buffer)
    const isToday = dateStr === todayStr;
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;

    // Build available slots
    const slots = allSlots
      .filter(time => {
        if (isToday) {
          const [h, m] = time.split(':').map(Number);
          if (h * 60 + m <= currentMinutes) return false;
        }
        return true;
      })
      .map(time => {
        const booked = bookingCounts[time] || 0;
        const available = Math.max(0, maxPerSlot - booked);
        return {
          time,
          available,
          total: maxPerSlot,
          status: available > 0 ? 'available' : 'full'
        };
      });

    return new Response(JSON.stringify({
      success: true,
      date: dateStr,
      service_id: serviceId,
      service_name: service.name,
      department: 'laboratorio',
      schedule: { open: schedule.start, close: schedule.end },
      slots,
      available_count: slots.filter(s => s.status === 'available').length,
      total_count: slots.length
    }), { status: 200, headers });

  } catch (err) {
    console.error('[BookingAPI] Slots error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Errore nel caricamento degli slot. Riprovare.'
    }), { status: 500, headers });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(context.env),
      'Access-Control-Max-Age': '86400',
    }
  });
}
