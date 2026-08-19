/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — CI Secrets Bootstrap Endpoint
 * ============================================================================
 * POST /api/cron/export-secrets
 *
 * Scopo: permettere alla CI GitHub Actions (repo biopharma-italia/EXTREME-BIO,
 * branch main) di provisionare i secrets condivisi (WASENDER_API_KEY,
 * RESEND_API_KEY) sul progetto Cloudflare Pages del sito principale
 * "bio-clinic" SENZA che le chiavi transitino mai nel repository pubblico.
 *
 * Auth (stessa policy di send-reminders):
 *   - X-Cron-Secret: <CRON_SECRET>            (operatore)
 *   - Authorization: Bearer <CRON_SECRET>      (operatore)
 *   - Authorization: Bearer <GitHub OIDC JWT>  (CI, secretless)
 *     → verificato RS256 vs JWKS GitHub, issuer, audience
 *       'referti.bio-clinic.it/cron', repository e ref main.
 *
 * NOTA SICUREZZA: questo endpoint restituisce secrets in chiaro al chiamante
 * autenticato. La superficie è identica a quella del titolare di CRON_SECRET
 * o del workflow CI su main (che può già deployare codice arbitrario sui
 * progetti Pages). Rimuovere l'endpoint se il bootstrap non serve più.
 *
 * @version 1.0.0 — 2026-08-19
 */

// ── GitHub OIDC verification (duplicated from cron/send-reminders.ts v1.3.0
//    on purpose: zero-regression policy on the working reminders endpoint) ──

const GH_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const GH_OIDC_AUDIENCE = 'referti.bio-clinic.it/cron';
const GH_ALLOWED_REPO = 'biopharma-italia/EXTREME-BIO';

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlToJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function verifyGitHubOidcToken(token: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'malformed' };

    const header = b64urlToJson(parts[0]) as { alg?: string; kid?: string };
    const payload = b64urlToJson(parts[1]) as {
      iss?: string; aud?: string | string[]; exp?: number; nbf?: number;
      repository?: string; ref?: string; event_name?: string;
    };

    if (header.alg !== 'RS256' || !header.kid) return { valid: false, reason: 'bad alg/kid' };

    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== GH_OIDC_ISSUER) return { valid: false, reason: 'bad issuer' };
    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audList.includes(GH_OIDC_AUDIENCE)) return { valid: false, reason: 'bad audience' };
    if (!payload.exp || payload.exp < now) return { valid: false, reason: 'expired' };
    if (payload.nbf && payload.nbf > now + 60) return { valid: false, reason: 'not yet valid' };
    if (payload.repository !== GH_ALLOWED_REPO) return { valid: false, reason: 'wrong repository' };
    if (payload.ref && payload.ref !== 'refs/heads/main') return { valid: false, reason: 'wrong ref' };

    const jwksResp = await fetch(`${GH_OIDC_ISSUER}/.well-known/jwks`, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit);
    if (!jwksResp.ok) return { valid: false, reason: 'jwks fetch failed' };
    const jwks = await jwksResp.json() as { keys: Array<{ kid: string; kty: string; n: string; e: string }> };
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return { valid: false, reason: 'unknown kid' };

    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = b64urlToBytes(parts[2]);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig as unknown as BufferSource, data);
    return ok ? { valid: true } : { valid: false, reason: 'bad signature' };
  } catch (e) {
    return { valid: false, reason: `exception: ${(e as Error).message}` };
  }
}

interface Env {
  CRON_SECRET: string;
  WASENDER_API_KEY: string;
  WASENDER_BASE_URL: string;
  RESEND_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // ── Auth: X-Cron-Secret / Bearer CRON_SECRET / GitHub OIDC ──────────────
  const cronSecret = request.headers.get('X-Cron-Secret') || '';
  const authHeader = request.headers.get('Authorization') || '';

  let isAuthorized =
    (env.CRON_SECRET && cronSecret === env.CRON_SECRET) ||
    (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`);

  if (!isAuthorized && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7);
    if (bearer.split('.').length === 3) {
      const oidc = await verifyGitHubOidcToken(bearer);
      if (oidc.valid) {
        isAuthorized = true;
      } else {
        console.warn('[export-secrets] OIDC rejected:', oidc.reason);
      }
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('[export-secrets] Secrets exported to authorized caller');

  return new Response(JSON.stringify({
    success: true,
    secrets: {
      WASENDER_API_KEY: env.WASENDER_API_KEY || null,
      WASENDER_BASE_URL: env.WASENDER_BASE_URL || 'https://wasenderapi.com/api',
      RESEND_API_KEY: env.RESEND_API_KEY || null,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
