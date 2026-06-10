/**
 * ============================================================================
 * POST /api/auth/2fa/setup
 * ============================================================================
 * Generates TOTP secret and QR code for 2FA setup.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import { encryptTotpSecret, bytesToHex } from '../../../../src/lib/encryption';
import type { RequestContext } from '../../../../src/lib/types';

// Hash a backup code with SHA-256 for secure storage
async function hashBackupCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim().toUpperCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if 2FA already enabled
  const { data: existing } = await adminClient
    .from('totp_secrets')
    .select('is_verified')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (existing?.is_verified) {
    return jsonResponse({
      success: false,
      error: '2FA già attivo. Disattivarlo prima di riconfigurarlo.',
    }, 409);
  }

  // Generate TOTP secret
  const { authenticator } = await import('otplib');
  const secret = authenticator.generateSecret(20); // 20 bytes = 160 bits

  // Generate QR code URI
  const otpauthUrl = authenticator.keyuri(
    ctx.user.email,
    'Bio-Clinic Referti',
    secret
  );

  // Generate 10 backup codes
  const backupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const code = bytesToHex(bytes).toUpperCase();
    backupCodes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }

  // Encrypt secret for storage
  const { encrypted, iv } = await encryptTotpSecret(
    secret,
    env.MASTER_ENCRYPTION_KEY,
    ctx.user.id
  );

  // Hash backup codes for secure storage (P1-2 fix: never store plaintext)
  const backupCodesHashes: string[] = [];
  for (const code of backupCodes) {
    backupCodesHashes.push(await hashBackupCode(code));
  }

  // Upsert TOTP record (not yet verified)
  await adminClient.from('totp_secrets').upsert({
    user_id: ctx.user.id,
    encrypted_secret: `${encrypted}:${iv}`,
    backup_codes_hashes: JSON.stringify(backupCodesHashes),
    backup_codes_remaining: 10,
    is_verified: false,
  }, { onConflict: 'user_id' });

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'totp_enable',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { step: 'setup_initiated' },
    risk_level: 'medium',
  });

  return jsonResponse({
    success: true,
    secret,
    qr_code_url: otpauthUrl,
    backup_codes: backupCodes,
  });
}
