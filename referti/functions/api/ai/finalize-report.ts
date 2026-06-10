/**
 * ============================================================================
 * POST /api/ai/finalize-report
 * ============================================================================
 * Complete workflow: auto-register patient → create report → upload files →
 * validate → sign → release → send email notification.
 *
 * Auth: ostetrica, physician, admin, super_admin
 *
 * Body: multipart/form-data with:
 *   - report_pdf: The AI-generated report PDF (primary)
 *   - moc_pdf: The original MOC-DXA PDF (attachment)
 *   - patient_data: JSON string with patient info
 *   - report_data: JSON string with report metadata
 *
 * @version 1.0.0 — 2026-06-04
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { validateDate, sanitizeInput } from '../../../src/lib/validators';
import { deriveKey, encryptData, computeChecksum } from '../../../src/lib/encryption';
import { reportReleasedEmail } from '../../../src/lib/email-templates';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

interface PatientData {
  fiscal_code: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  gender?: 'F' | 'M' | 'ALTRO';
}

interface ReportData {
  report_type: string;
  category?: string;
  sample_date: string;
  doctor_name: string;
  is_urgent?: boolean;
  has_abnormal_values?: boolean;
  notes?: string;
}

// ── Allowed roles (ostetrica INCLUDED) ─────────────────────────────────────

const ALLOWED_ROLES = ['ostetrica', 'physician', 'admin', 'super_admin'];

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const env = data.env as Env;
  const ctx = data.ctx as RequestContext;

  // ── Auth ─────────────────────────────────────────────────────────────
  const authError = requireRole(ctx, 'ostetrica', 'physician', 'admin', 'super_admin');
  if (authError) return authError;

  // ── Parse multipart form ─────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ success: false, error: 'Formato richiesta non valido. Usare multipart/form-data.' }, 400);
  }

  const reportPdf = formData.get('report_pdf') as File | null;
  const mocPdf = formData.get('moc_pdf') as File | null;
  const patientDataStr = formData.get('patient_data') as string | null;
  const reportDataStr = formData.get('report_data') as string | null;

  // ── Validate inputs ──────────────────────────────────────────────────
  if (!reportPdf) {
    return jsonResponse({ success: false, error: 'File report_pdf obbligatorio.' }, 400);
  }
  if (!patientDataStr || !reportDataStr) {
    return jsonResponse({ success: false, error: 'Campi patient_data e report_data obbligatori.' }, 400);
  }

  let patientData: PatientData;
  let reportData: ReportData;
  try {
    patientData = JSON.parse(patientDataStr);
    reportData = JSON.parse(reportDataStr);
  } catch {
    return jsonResponse({ success: false, error: 'JSON non valido in patient_data o report_data.' }, 400);
  }

  if (!patientData.fiscal_code || !patientData.first_name || !patientData.last_name) {
    return jsonResponse({ success: false, error: 'Dati paziente incompleti: fiscal_code, first_name, last_name obbligatori.' }, 400);
  }
  if (!reportData.report_type || !reportData.sample_date) {
    return jsonResponse({ success: false, error: 'Dati referto incompleti: report_type e sample_date obbligatori.' }, 400);
  }
  if (!validateDate(reportData.sample_date)) {
    return jsonResponse({ success: false, error: 'Formato data non valido. Usare YYYY-MM-DD.' }, 400);
  }

  // Validate file sizes (max 10MB each)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (reportPdf.size > MAX_FILE_SIZE) {
    return jsonResponse({ success: false, error: 'Report PDF troppo grande (max 10 MB).' }, 400);
  }
  if (mocPdf && mocPdf.size > MAX_FILE_SIZE) {
    return jsonResponse({ success: false, error: 'MOC PDF troppo grande (max 10 MB).' }, 400);
  }

  // ── Supabase client ──────────────────────────────────────────────────
  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const fiscalCode = patientData.fiscal_code.toUpperCase().trim();
  const steps: string[] = [];

  try {
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Find or auto-register patient
    // ═══════════════════════════════════════════════════════════════════
    let patientId: string;
    let patientEmail: string | null = null;
    let patientName: string;

    const { data: existingPatient } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('fiscal_code', fiscalCode)
      .eq('role', 'patient')
      .eq('is_active', true)
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
      patientEmail = existingPatient.email;
      patientName = `${existingPatient.first_name} ${existingPatient.last_name}`;
      steps.push('patient_found');
    } else {
      // Auto-register patient
      // Create auth user via Supabase Auth Admin API
      const tempPassword = generateTempPassword();
      const email = patientData.email || `${fiscalCode.toLowerCase()}@referti.bio-clinic.it`;

      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Skip confirmation for auto-registered
        user_metadata: {
          first_name: patientData.first_name,
          last_name: patientData.last_name,
          fiscal_code: fiscalCode,
          role: 'patient',
        },
      });

      if (authError) {
        console.error('[Finalize] Auth user creation failed:', authError.message);
        // Try to find if user already exists with different status
        const { data: inactiveUser } = await adminClient
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('fiscal_code', fiscalCode)
          .single();

        if (inactiveUser) {
          // Reactivate existing user
          await adminClient.from('users').update({ is_active: true }).eq('id', inactiveUser.id);
          patientId = inactiveUser.id;
          patientEmail = inactiveUser.email;
          patientName = `${inactiveUser.first_name} ${inactiveUser.last_name}`;
          steps.push('patient_reactivated');
        } else {
          return jsonResponse({
            success: false,
            error: `Impossibile registrare il paziente: ${authError.message}`,
          }, 500);
        }
      } else {
        // Create user profile record
        const userId = authUser.user.id;
        const { error: profileError } = await adminClient.from('users').insert({
          id: userId,
          email,
          first_name: sanitizeInput(patientData.first_name, 100),
          last_name: sanitizeInput(patientData.last_name, 100),
          fiscal_code: fiscalCode,
          date_of_birth: patientData.date_of_birth || null,
          phone: patientData.phone || null,
          gender: patientData.gender || null,
          role: 'patient',
          is_active: true,
          must_change_password: true,
          preferred_notification_channel: 'email',
        });

        if (profileError) {
          console.error('[Finalize] Profile creation error:', profileError.message);
          // If profile insert fails, still continue — auth user exists
        }

        patientId = userId;
        patientEmail = email;
        patientName = `${patientData.first_name} ${patientData.last_name}`;
        steps.push('patient_registered');
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Create report record
    // ═══════════════════════════════════════════════════════════════════
    const { data: report, error: reportError } = await adminClient
      .from('reports')
      .insert({
        patient_id: patientId,
        patient_fiscal_code: fiscalCode,
        report_type: sanitizeInput(reportData.report_type, 100),
        category: reportData.category ? sanitizeInput(reportData.category, 50) : 'densitometria',
        department: 'laboratorio',
        sample_date: reportData.sample_date,
        status: 'pending',
        uploaded_by: ctx.user!.id,
        is_urgent: reportData.is_urgent || false,
        has_abnormal_values: reportData.has_abnormal_values || false,
        retention_expires: new Date(
          new Date(reportData.sample_date).getTime() + 10 * 365 * 24 * 60 * 60 * 1000
        ).toISOString().slice(0, 10),
      })
      .select('id, report_number, status')
      .single();

    if (reportError || !report) {
      console.error('[Finalize] Report creation error:', reportError?.message);
      return jsonResponse({ success: false, error: 'Errore nella creazione del referto.' }, 500);
    }
    steps.push('report_created');

    const reportId = report.id;

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Upload AI-generated report PDF (primary)
    // ═══════════════════════════════════════════════════════════════════
    const reportBuffer = await reportPdf.arrayBuffer();
    const reportChecksum = await computeChecksum(reportBuffer);
    const aad = `${reportId}:${patientId}`;
    const encKey = await deriveKey(env.MASTER_ENCRYPTION_KEY, reportId);
    const { ciphertext: reportCipher, iv: reportIv } = await encryptData(reportBuffer, encKey, aad);

    const reportFileName = `referto_${report.report_number}.pdf`;
    const reportStoragePath = `${patientId}/${reportId}/${reportFileName}`;

    const { error: reportUploadErr } = await adminClient.storage
      .from('referti')
      .upload(reportStoragePath, reportCipher, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (reportUploadErr) {
      console.error('[Finalize] Report upload error:', reportUploadErr.message);
      return jsonResponse({ success: false, error: 'Errore nel caricamento del referto PDF.' }, 500);
    }

    await adminClient.from('report_files').insert({
      report_id: reportId,
      storage_path: reportStoragePath,
      storage_bucket: 'referti',
      original_name: reportFileName,
      mime_type: 'application/pdf',
      file_size_bytes: reportPdf.size,
      checksum_sha256: reportChecksum,
      is_encrypted: true,
      encryption_key_id: 'v1',
      encryption_iv: reportIv,
      file_type: 'report_pdf',
      is_primary: true,
      uploaded_by: ctx.user!.id,
    });
    steps.push('report_pdf_uploaded');

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Upload MOC PDF original (attachment)
    // ═══════════════════════════════════════════════════════════════════
    if (mocPdf) {
      const mocBuffer = await mocPdf.arrayBuffer();
      const mocChecksum = await computeChecksum(mocBuffer);
      const { ciphertext: mocCipher, iv: mocIv } = await encryptData(mocBuffer, encKey, aad);

      const mocFileName = `moc_originale_${report.report_number}.pdf`;
      const mocStoragePath = `${patientId}/${reportId}/${mocFileName}`;

      const { error: mocUploadErr } = await adminClient.storage
        .from('referti')
        .upload(mocStoragePath, mocCipher, {
          contentType: 'application/octet-stream',
          upsert: false,
        });

      if (mocUploadErr) {
        console.error('[Finalize] MOC upload error:', mocUploadErr.message);
        // Non-fatal — report PDF was already uploaded
        steps.push('moc_upload_failed');
      } else {
        await adminClient.from('report_files').insert({
          report_id: reportId,
          storage_path: mocStoragePath,
          storage_bucket: 'referti',
          original_name: mocFileName,
          mime_type: 'application/pdf',
          file_size_bytes: mocPdf.size,
          checksum_sha256: mocChecksum,
          is_encrypted: true,
          encryption_key_id: 'v1',
          encryption_iv: mocIv,
          file_type: 'source_document',
          is_primary: false,
          uploaded_by: ctx.user!.id,
        });
        steps.push('moc_pdf_uploaded');
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Transition status: pending → validated → signed → released
    // ═══════════════════════════════════════════════════════════════════
    const now = new Date().toISOString();
    const operatorId = ctx.user!.id;

    // pending → validated
    await adminClient.from('reports').update({
      status: 'validated',
      validated_at: now,
      validated_by: operatorId,
    }).eq('id', reportId);
    steps.push('status_validated');

    // validated → signed
    await adminClient.from('reports').update({
      status: 'signed',
      signed_at: now,
      signed_by: operatorId,
      signer_name: reportData.doctor_name || 'Operatore',
    }).eq('id', reportId);
    steps.push('status_signed');

    // signed → released
    await adminClient.from('reports').update({
      status: 'released',
      released_at: now,
      released_by: operatorId,
      patient_notified: true,
      patient_notified_at: now,
    }).eq('id', reportId);
    steps.push('status_released');

    // ═══════════════════════════════════════════════════════════════════
    // STEP 6: Send email notification
    // ═══════════════════════════════════════════════════════════════════
    let emailSent = false;

    if (patientEmail && env.RESEND_API_KEY) {
      try {
        const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
        const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to: patientEmail,
            subject: `Referto disponibile — ${report.report_number}`,
            html: reportReleasedEmail(
              patientName,
              report.report_number,
              reportData.report_type,
              reportData.sample_date,
              appUrl
            ),
          }),
        });

        emailSent = emailResp.ok;
        if (!emailSent) {
          const errText = await emailResp.text();
          console.error('[Finalize] Email failed:', emailResp.status, errText);
        }

        // Record notification
        await adminClient.from('notifications').insert({
          user_id: patientId,
          channel: 'email',
          subject: `Referto disponibile — ${report.report_number}`,
          body: `Gentile ${patientName}, il suo referto ${reportData.report_type} del ${reportData.sample_date} è disponibile per la consultazione.`,
          report_id: reportId,
          action_url: `/dashboard/`,
          status: emailSent ? 'sent' : 'failed',
          provider: 'resend',
          sent_at: emailSent ? now : null,
        });

        steps.push(emailSent ? 'email_sent' : 'email_failed');
      } catch (err) {
        console.error('[Finalize] Email error:', err);
        steps.push('email_error');
      }
    } else {
      steps.push('email_skipped');
      if (!env.RESEND_API_KEY) {
        console.warn('[Finalize] RESEND_API_KEY not configured');
      }
    }

    // In-app notification
    await adminClient.from('notifications').insert({
      user_id: patientId,
      channel: 'in_app',
      subject: 'Nuovo referto disponibile',
      body: `Gentile ${patientName}, il suo referto ${reportData.report_type} del ${reportData.sample_date} è disponibile.`,
      report_id: reportId,
      action_url: `/dashboard/`,
      status: 'sent',
      sent_at: now,
    });

    // ── Audit log ────────────────────────────────────────────────────────
    await adminClient.from('audit_log').insert({
      user_id: operatorId,
      user_role: ctx.user!.role,
      action: 'ai_finalize_report',
      target_type: 'report',
      target_id: reportId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      request_id: ctx.requestId,
      details: {
        report_number: report.report_number,
        patient_id: patientId,
        patient_fiscal_code: fiscalCode,
        doctor_name: reportData.doctor_name,
        steps,
        email_sent: emailSent,
      },
      risk_level: 'medium',
    });

    // ═══════════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════════
    return jsonResponse({
      success: true,
      data: {
        report_id: reportId,
        report_number: report.report_number,
        patient_id: patientId,
        patient_name: patientName,
        status: 'released',
        email_sent: emailSent,
        steps,
      },
    }, 201);

  } catch (err) {
    console.error('[Finalize] Unexpected error:', err);
    return jsonResponse({
      success: false,
      error: 'Errore interno durante la finalizzazione del referto.',
      steps,
    }, 500);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}
