/**
 * ============================================================================
 * /api/reports/suspended — GET (list) + POST (park a PDF without anagrafica)
 * ============================================================================
 * "Referti Sospesi": PDF del bulk-upload il cui paziente non ha anagrafica
 * completa. Senza questa sezione i file restavano solo nel browser e si
 * perdevano chiudendo la pagina ("non so più quali pazienti mancano").
 *
 * Storage layout (bucket 'referti', nessuna nuova tabella richiesta):
 *   _sospesi/{id}/{filename}.pdf   — il PDF originale
 *   _sospesi/{id}/meta.json        — metadati (cf, nome da PDF, data, tipo, motivo)
 *
 * Flusso: bulk-upload salva qui i non-pronti → pagina "Sospesi" → completa
 * anagrafica (registra paziente) → resolve = crea report 'pending' + sposta
 * il file → entra nella normale coda validazione → firma → rilascio + invio.
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { sanitizeInput, validateFiscalCode, validateDate, validatePdfMagicBytes, validateFileSize } from '../../../src/lib/validators';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export interface SuspendedMeta {
  id: string;
  file_name: string;
  storage_path: string;
  cf: string | null;
  pdf_name: string | null;      // nome paziente estratto dal PDF
  pdf_date: string | null;      // data prelievo estratta (YYYY-MM-DD)
  pdf_type: string | null;      // tipo esame rilevato
  category: string;
  reason: string;               // cf_not_extracted | patient_not_found | create_error | manual
  file_size: number;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
}

const STAFF_ROLES = ['lab_technician', 'admin', 'super_admin', 'ostetrica'] as const;
const PREFIX = '_sospesi';

function db(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── GET /api/reports/suspended — lista sospesi ───────────────────────────────

export async function onRequestGet(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { ctx, env } = context.data;
  const authError = requireRole(ctx, ...STAFF_ROLES);
  if (authError) return authError;

  const client = db(env);
  const { data: folders, error: listErr } = await client.storage
    .from('referti')
    .list(PREFIX, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

  if (listErr) {
    console.error('[Suspended] List error:', listErr.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento dei sospesi.' }, 500);
  }

  const items: SuspendedMeta[] = [];
  for (const folder of folders || []) {
    // Folders have id === null in Supabase Storage list results
    if (folder.id !== null || !folder.name) continue;
    try {
      const { data: metaBlob, error: dlErr } = await client.storage
        .from('referti')
        .download(`${PREFIX}/${folder.name}/meta.json`);
      if (dlErr || !metaBlob) continue;
      const meta = JSON.parse(await metaBlob.text()) as SuspendedMeta;
      meta.id = folder.name; // authoritative
      items.push(meta);
    } catch (e) {
      console.warn('[Suspended] Bad meta for', folder.name, e);
    }
  }

  // Più recenti prima
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  return jsonResponse({ success: true, data: items, count: items.length });
}

// ── POST /api/reports/suspended — parcheggia un PDF ─────────────────────────

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;
  const authError = requireRole(ctx, ...STAFF_ROLES);
  if (authError) return authError;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta multipart non valida.' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({ success: false, error: 'File PDF mancante.' }, 400);
  }
  if (!validateFileSize(file.size, 10)) {
    return jsonResponse({ success: false, error: 'File troppo grande (max 10MB).' }, 400);
  }

  const buffer = await file.arrayBuffer();
  if (!validatePdfMagicBytes(buffer)) {
    return jsonResponse({ success: false, error: 'Il file non è un PDF valido.' }, 400);
  }

  const cfRaw = (form.get('cf') as string || '').toUpperCase().trim();
  const cf = cfRaw && validateFiscalCode(cfRaw) ? cfRaw : null;
  const pdfDate = (form.get('pdf_date') as string || '').trim();

  const id = crypto.randomUUID();
  const safeName = (file.name || 'referto.pdf').replace(/[^\w.\-]+/g, '_').slice(0, 120);
  const storagePath = `${PREFIX}/${id}/${safeName}`;

  const meta: SuspendedMeta = {
    id,
    file_name: safeName,
    storage_path: storagePath,
    cf,
    pdf_name: sanitizeInput(form.get('pdf_name') as string, 120) || null,
    pdf_date: pdfDate && validateDate(pdfDate) ? pdfDate : null,
    pdf_type: sanitizeInput(form.get('pdf_type') as string, 60) || null,
    category: sanitizeInput(form.get('category') as string, 40) || 'laboratorio',
    reason: sanitizeInput(form.get('reason') as string, 40) || 'manual',
    file_size: file.size,
    created_at: new Date().toISOString(),
    created_by: ctx.user!.id,
    created_by_name: null,
  };

  const client = db(env);

  const { error: upErr } = await client.storage
    .from('referti')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });
  if (upErr) {
    console.error('[Suspended] Upload error:', upErr.message);
    return jsonResponse({ success: false, error: 'Errore nel salvataggio del file.' }, 500);
  }

  const { error: metaErr } = await client.storage
    .from('referti')
    .upload(`${PREFIX}/${id}/meta.json`, new TextEncoder().encode(JSON.stringify(meta)), {
      contentType: 'application/json', upsert: true,
    });
  if (metaErr) {
    console.error('[Suspended] Meta upload error:', metaErr.message);
    await client.storage.from('referti').remove([storagePath]);
    return jsonResponse({ success: false, error: 'Errore nel salvataggio dei metadati.' }, 500);
  }

  await client.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'file_upload',
    target_type: 'suspended_report',
    target_id: id,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { suspended: true, file: safeName, cf: cf ? '***' : null, reason: meta.reason },
    risk_level: 'low',
  });

  return jsonResponse({ success: true, data: { id, storage_path: storagePath } }, 201);
}
