/**
 * Notifications Engine — /api/notifications
 *
 * POST /api/notifications/send — Send notification (email via Resend)
 * GET  /api/notifications      — List sent notifications for company
 *
 * Notification types:
 *   - visit_convocation: convocazione visita medica
 *   - training_expiry: scadenza formazione
 *   - fitness_expiry: scadenza giudizio idoneità
 *   - document_expiry: scadenza documento aziendale
 *   - custom: messaggio libero
 *
 * Roles: super_admin, medico_competente, segreteria_mdl
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SB_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  APP_URL: string;
}

const ALLOWED_ROLES = ['super_admin', 'medico_competente', 'segreteria_mdl'];

// ─── GET — List notifications ────────────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const companyId = url.searchParams.get('company_id');
  const workerId = url.searchParams.get('worker_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

  let query = supabaseAdmin
    .from('mdl_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) query = query.eq('company_id', companyId);
  if (workerId) query = query.eq('worker_id', workerId);

  // Non-admin users see only their company
  if (ctx.user.role !== 'super_admin' && ctx.user.company_id) {
    query = query.eq('company_id', ctx.user.company_id);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
};

// ─── POST — Send notification ────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const env = context.env;
  const { supabaseAdmin } = ctx;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  const { type, worker_id, company_id, subject, message, recipients } = body;

  // Validate
  const validTypes = ['visit_convocation', 'training_expiry', 'fitness_expiry', 'document_expiry', 'custom'];
  if (!type || !validTypes.includes(type)) {
    return Response.json({ success: false, error: `Tipo non valido. Ammessi: ${validTypes.join(', ')}` }, { status: 400 });
  }

  if (!subject?.trim()) {
    return Response.json({ success: false, error: 'Oggetto obbligatorio' }, { status: 400 });
  }

  // Determine recipients
  let emailRecipients: string[] = [];

  if (recipients && Array.isArray(recipients)) {
    // Custom recipients list
    emailRecipients = recipients.filter((e: string) => e && e.includes('@'));
  } else if (worker_id) {
    // Get worker email + company DL email
    const { data: worker } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, first_name, last_name, email, company_id')
      .eq('id', worker_id)
      .single();

    if (!worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    if (worker.email) emailRecipients.push(worker.email);

    // Also get DL/RSPP email for convocations
    if (type === 'visit_convocation') {
      const { data: contacts } = await supabaseAdmin
        .from('mdl_safety_contacts')
        .select('email, role')
        .eq('company_id', worker.company_id)
        .in('role', ['datore_lavoro', 'rspp'])
        .eq('is_active', true);

      if (contacts) {
        for (const c of contacts) {
          if (c.email && !emailRecipients.includes(c.email)) {
            emailRecipients.push(c.email);
          }
        }
      }
    }
  }

  if (emailRecipients.length === 0) {
    return Response.json({ success: false, error: 'Nessun destinatario email trovato' }, { status: 400 });
  }

  // Build email HTML
  const htmlBody = buildEmailHtml(type, subject.trim(), message || '', env.APP_URL);

  // Send via Resend
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    // Save notification as queued if no API key
    const { data: notif } = await supabaseAdmin.from('mdl_notifications').insert({
      user_id: ctx.user.id,
      company_id: company_id || null,
      worker_id: worker_id || null,
      type,
      channel: 'email',
      subject: subject.trim(),
      body: message || '',
      recipients: emailRecipients,
      status: 'queued',
    }).select().single();

    return Response.json({ success: true, data: notif, warning: 'Email non inviata: RESEND_API_KEY non configurata' }, { status: 201 });
  }

  let sendStatus: 'sent' | 'failed' = 'sent';
  let sendError: string | null = null;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'Bio-Clinic MDL <mdl@bio-clinic.it>',
        to: emailRecipients,
        subject: subject.trim(),
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      sendStatus = 'failed';
      sendError = `Resend ${resendRes.status}: ${errBody}`;
    }
  } catch (e: any) {
    sendStatus = 'failed';
    sendError = e.message;
  }

  // Record notification
  const { data: notif } = await supabaseAdmin.from('mdl_notifications').insert({
    user_id: ctx.user.id,
    company_id: company_id || null,
    worker_id: worker_id || null,
    type,
    channel: 'email',
    subject: subject.trim(),
    body: message || '',
    recipients: emailRecipients,
    status: sendStatus,
    error_message: sendError,
    sent_at: sendStatus === 'sent' ? new Date().toISOString() : null,
  }).select().single();

  if (sendStatus === 'failed') {
    return Response.json({ success: false, error: sendError, data: notif }, { status: 502 });
  }

  return Response.json({ success: true, data: notif }, { status: 201 });
};

// ─── Email Template Builder ──────────────────────────────────────────────────
function buildEmailHtml(type: string, subject: string, message: string, appUrl: string): string {
  const typeLabels: Record<string, string> = {
    visit_convocation: '📋 Convocazione Visita Medica',
    training_expiry: '📚 Scadenza Formazione',
    fitness_expiry: '⚕️ Scadenza Giudizio Idoneità',
    document_expiry: '📄 Scadenza Documento',
    custom: '📩 Comunicazione',
  };

  const typeLabel = typeLabels[type] || 'Comunicazione';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f5f5f5">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#1a73e8;padding:20px 24px;color:#fff">
      <h2 style="margin:0;font-size:18px">${typeLabel}</h2>
    </div>
    <div style="padding:24px">
      <h3 style="margin:0 0 16px;color:#333">${subject}</h3>
      <div style="color:#555;line-height:1.6;white-space:pre-wrap">${message || ''}</div>
      ${appUrl ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eee"><a href="${appUrl}" style="color:#1a73e8;text-decoration:none">Accedi alla piattaforma MDL →</a></p>` : ''}
    </div>
    <div style="padding:16px 24px;background:#f9f9f9;color:#999;font-size:12px">
      Bio-Clinic MDL — Medicina del Lavoro<br>
      Questa email è stata inviata automaticamente. Non rispondere a questo indirizzo.
    </div>
  </div>
</body>
</html>`;
}
