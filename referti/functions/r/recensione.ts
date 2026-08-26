/**
 * GET /r/recensione — tracked redirect to the Google review form.
 *
 * Why: WhatsApp review-request messages used to link g.page/bioclinic-sassari
 * (a Business Profile short name that was never registered → fell back to a
 * generic Google search). This endpoint:
 *   1. logs the click in audit_log (details.type = 'review_link_click')
 *   2. 302-redirects to the canonical write-review URL with the Place ID
 *      (works regardless of short-name registration)
 *
 * The destination can be changed here at any time without touching the
 * WhatsApp message template.
 *
 * Public route by design (no auth: patients click from WhatsApp).
 * No PII is logged: only timestamp, user-agent, referer.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Bio Clinic, Via Renzo Mossa 23, 07100 Sassari — verified Place ID
const PLACE_ID = 'ChIJ65ZKjVtj3BIRfTU2bXMebmw';
const DESTINATION = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Fire-and-forget click log — must never delay or break the redirect
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    const log = fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: null,
        user_role: null,
        action: 'notification_send',
        target_type: 'review_link',
        target_id: null,
        ip_address: request.headers.get('CF-Connecting-IP') || null,
        user_agent: (request.headers.get('User-Agent') || '').slice(0, 500),
        request_id: crypto.randomUUID(),
        details: {
          type: 'review_link_click',
          referer: request.headers.get('Referer') || null,
          destination: DESTINATION,
        },
        risk_level: 'low',
      }),
    }).catch(() => { /* never block the redirect */ });
    context.waitUntil(log);
  }

  return Response.redirect(DESTINATION, 302);
};
