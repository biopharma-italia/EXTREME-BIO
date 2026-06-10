/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — JWT Signing & Verification (HMAC-SHA256)
 * ============================================================================
 * Lightweight JWT implementation using Web Crypto API.
 * Used for short-lived tokens (2FA temp_token, session tokens).
 * Does NOT replace Supabase Auth JWTs — only for internal use.
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

/**
 * Import a secret string as a CryptoKey for HMAC signing.
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey('raw', keyData, ALGORITHM, false, ['sign', 'verify']);
}

/**
 * Base64url encode (RFC 7515).
 */
function base64url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64url decode.
 */
function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign a JWT payload with HMAC-SHA256.
 * @param payload - The claims object (must include `exp` for expiry)
 * @param secret - The signing secret (e.g., SUPABASE_SERVICE_KEY or dedicated secret)
 * @returns Signed JWT string (header.payload.signature)
 */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Verify and decode a JWT signed with HMAC-SHA256.
 * @param token - The JWT string
 * @param secret - The signing secret
 * @returns Decoded payload if valid, null if invalid or expired
 */
export async function verifyJwt<T extends Record<string, unknown> = Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  try {
    const key = await importKey(secret);
    const signatureBytes = base64urlDecode(signatureB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );

    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as T;

    // Check expiry
    if (payload.exp && typeof payload.exp === 'number') {
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }
    }

    return payload;
  } catch {
    return null;
  }
}
