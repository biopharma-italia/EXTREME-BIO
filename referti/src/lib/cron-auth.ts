/**
 * ============================================================================
 * Cron endpoint authentication — shared helper
 * ============================================================================
 * Authorizes scheduled/cron endpoints via:
 *   1. X-Cron-Secret header (or Bearer CRON_SECRET)
 *   2. GitHub Actions OIDC token (RS256, JWKS-verified, repo+branch pinned)
 *
 * Used by: send-reminders, delivery-stats, retry-failed-notifications.
 * (export-secrets keeps its own inline copy for isolation.)
 *
 * @version 1.0.0 — 2026-08-25
 */

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

export async function verifyGitHubOidcToken(token: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'malformed' };

    const header = b64urlToJson(parts[0]) as { alg?: string; kid?: string };
    const payload = b64urlToJson(parts[1]) as {
      iss?: string; aud?: string | string[]; exp?: number; nbf?: number;
      repository?: string; ref?: string;
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

/**
 * Full cron authorization check (X-Cron-Secret OR GitHub OIDC Bearer).
 * Returns true if the request is authorized.
 */
export async function isCronAuthorized(
  request: Request,
  env: { CRON_SECRET?: string },
  logTag = 'cron-auth',
): Promise<boolean> {
  const cronSecret = request.headers.get('X-Cron-Secret') || '';
  const authHeader = request.headers.get('Authorization') || '';

  if (env.CRON_SECRET && cronSecret === env.CRON_SECRET) return true;
  if (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`) return true;

  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7);
    if (bearer.split('.').length === 3) {
      const oidc = await verifyGitHubOidcToken(bearer);
      if (oidc.valid) return true;
      console.warn(`[${logTag}] OIDC rejected:`, oidc.reason);
    }
  }
  return false;
}
