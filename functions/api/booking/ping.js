/**
 * Health check endpoint for booking API
 * Route: GET /api/booking/ping
 */
export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    ok: true,
    service: 'bio-clinic-booking-api',
    version: '2.1.0',
    storage: {
      d1: !!env.BOOKING_DB,
      kv: !!env.BOOKING_KV,
      mode: env.BOOKING_DB ? 'd1+kv' : env.BOOKING_KV ? 'kv' : 'demo'
    },
    ts: Date.now()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
