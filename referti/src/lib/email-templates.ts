/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Email Templates
 * ============================================================================
 * Centralized HTML email templates for all transactional emails.
 * Prevents template duplication across API endpoints.
 */

import { sanitizeInput } from './validators';

const BRAND_COLOR = '#00704A';
const CLINIC_NAME = 'Bio-Clinic Sassari';
const CLINIC_ADDRESS = 'Via Renzo Mossa 23, 07100 Sassari';
const CLINIC_PHONE = '079 956 1332';
const CLINIC_EMAIL = 'gestione@bio-clinic.it';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:${BRAND_COLOR};color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        ${CLINIC_NAME}
      </div>
    </div>
    ${content}
    <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      ${CLINIC_NAME} &mdash; ${CLINIC_ADDRESS}<br>
      Tel: ${CLINIC_PHONE} | <a href="mailto:${CLINIC_EMAIL}" style="color:${BRAND_COLOR}">${CLINIC_EMAIL}</a>
    </p>
  </div>
</body>
</html>`;
}

function button(href: string, text: string): string {
  return `<div style="text-align:center;margin:28px 0">
  <a href="${href}" style="background:${BRAND_COLOR};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">
    ${text}
  </a>
</div>`;
}

function infoRow(label: string, value: string, highlight = false): string {
  const bg = highlight ? 'background:#f0faf5;' : '';
  return `<tr style="${bg}">
    <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">${label}</td>
    <td style="padding:10px 14px;border:1px solid #e0e0e0">${value}</td>
  </tr>`;
}

function table(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">${rows}</table>`;
}

// ── Templates ─────────────────────────────────────────────────────────────

export function welcomeEmail(firstName: string, email: string, appUrl: string): string {
  return layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px">Benvenuto, ${sanitizeInput(firstName, 100)}!</h2>
    <p style="color:#444;line-height:1.6">
      Il suo account per il portale Referti Online di ${CLINIC_NAME} \u00e8 stato creato con successo.
    </p>
    <p style="color:#444;line-height:1.6">
      Da questo portale potr\u00e0 consultare e scaricare i suoi referti di laboratorio in modo sicuro e riservato.
    </p>
    <div style="background:#f0faf5;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid ${BRAND_COLOR}">
      <p style="margin:0;color:#333;font-size:14px"><strong>Le sue credenziali:</strong></p>
      <p style="margin:4px 0 0;color:#555;font-size:14px">Email: <strong>${sanitizeInput(email, 200)}</strong></p>
      <p style="margin:4px 0 0;color:#888;font-size:12px">Password: quella scelta durante la registrazione</p>
    </div>
    ${button(`${appUrl}/dashboard/`, 'Accedi al Portale')}
  `);
}

export function passwordResetEmail(firstName: string, resetUrl: string): string {
  return layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px">Gentile ${sanitizeInput(firstName, 100)},</h2>
    <p style="color:#444;line-height:1.6">
      Abbiamo ricevuto una richiesta per reimpostare la password del tuo account sul portale
      <strong>Referti Online</strong> di ${CLINIC_NAME}.
    </p>
    ${button(resetUrl, 'Reimposta Password')}
    <div style="background:#fef3cd;border-radius:8px;padding:14px;margin:20px 0;border-left:4px solid #f59e0b">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5">
        <strong>Attenzione:</strong> Il link \u00e8 valido per <strong>60 minuti</strong>.
        Se non hai richiesto il reset della password, puoi ignorare questa email in sicurezza.
      </p>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.5">
      Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
      <a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;font-size:12px">${resetUrl}</a>
    </p>
  `);
}

export function reportCreatedEmail(
  patientName: string, reportNumber: string, reportType: string,
  sampleDate: string, appUrl: string
): string {
  return layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px">Referto in lavorazione</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${sanitizeInput(patientName, 200)}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      Le comunichiamo che un nuovo referto \u00e8 stato registrato nel sistema e sar\u00e0 disponibile a breve.
    </p>
    ${table(
      infoRow('N. Referto', `<strong>${sanitizeInput(reportNumber, 30)}</strong>`, true) +
      infoRow('Tipo Esame', sanitizeInput(reportType, 100)) +
      infoRow('Data Prelievo', sanitizeInput(sampleDate, 10), true) +
      infoRow('Stato', '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">In lavorazione</span>')
    )}
    <p style="color:#666;line-height:1.6;font-size:14px">
      Ricever\u00e0 una seconda email quando il referto sar\u00e0 pronto per il download.
    </p>
    ${button(`${appUrl}/dashboard/`, 'Accedi al Portale Referti')}
    <p style="color:#888;font-size:12px">Questo messaggio \u00e8 stato inviato automaticamente dal sistema Referti Online.</p>
  `);
}

export function reportReleasedEmail(
  patientName: string, reportNumber: string, reportType: string,
  sampleDate: string, appUrl: string
): string {
  return layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px">Nuovo referto disponibile</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${sanitizeInput(patientName, 200)}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      Il suo referto \u00e8 ora disponibile per la consultazione e il download.
    </p>
    ${table(
      infoRow('N. Referto', `<strong>${sanitizeInput(reportNumber, 30)}</strong>`, true) +
      infoRow('Tipo Esame', sanitizeInput(reportType, 100)) +
      infoRow('Data Prelievo', sanitizeInput(sampleDate, 10), true)
    )}
    ${button(`${appUrl}/dashboard/`, 'Visualizza e Scarica Referto')}
    <p style="color:#888;font-size:12px">Questo messaggio \u00e8 stato inviato automaticamente dal sistema Referti Online.</p>
  `);
}

export function reportRevokedEmail(
  patientName: string, reportNumber: string, reason: string
): string {
  return layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px">Referto revocato</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${sanitizeInput(patientName, 200)}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      Il referto <strong>${sanitizeInput(reportNumber, 30)}</strong> \u00e8 stato revocato.
    </p>
    <div style="background:#fef3cd;border-radius:8px;padding:14px;margin:20px 0;border-left:4px solid #f59e0b">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5">
        <strong>Motivo:</strong> ${sanitizeInput(reason, 500)}
      </p>
    </div>
    <p style="color:#666;font-size:13px">
      Se ha domande, contatti il laboratorio al numero ${CLINIC_PHONE}.
    </p>
  `);
}
