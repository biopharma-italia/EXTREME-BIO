/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Encryption Utilities
 * ============================================================================
 * AES-256-GCM encryption for PDF reports and sensitive data.
 * Uses Web Crypto API (available in Cloudflare Workers and browsers).
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;  // 96 bits recommended for GCM
const TAG_LENGTH = 128; // 128 bits auth tag

/**
 * Derive a per-file encryption key from the master key using HKDF.
 * @param masterKeyHex - Master key in hex (64 chars = 32 bytes)
 * @param salt - Unique salt (e.g., file_id or report_id)
 * @returns CryptoKey for AES-256-GCM
 */
export async function deriveKey(masterKeyHex: string, salt: string): Promise<CryptoKey> {
  const masterKeyBytes = hexToBytes(masterKeyHex);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    masterKeyBytes,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const saltBytes = new TextEncoder().encode(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBytes,
      info: new TextEncoder().encode('referti-bio-clinic-file-encryption'),
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM.
 * @param data - Plaintext data to encrypt
 * @param key - CryptoKey derived from master key
 * @param aad - Additional Authenticated Data (e.g., report_id + patient_id)
 * @returns { ciphertext, iv } where iv is hex-encoded
 */
export async function encryptData(
  data: ArrayBuffer,
  key: CryptoKey,
  aad?: string
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encryptParams: AesGcmParams = {
    name: ALGORITHM,
    iv,
    tagLength: TAG_LENGTH,
  };

  if (aad) {
    encryptParams.additionalData = new TextEncoder().encode(aad);
  }

  const ciphertext = await crypto.subtle.encrypt(encryptParams, key, data);

  return {
    ciphertext,
    iv: bytesToHex(iv),
  };
}

/**
 * Decrypt data using AES-256-GCM.
 * @param ciphertext - Encrypted data (includes auth tag)
 * @param key - CryptoKey derived from master key
 * @param ivHex - Initialization vector (hex-encoded)
 * @param aad - Additional Authenticated Data (must match encryption)
 * @returns Decrypted plaintext ArrayBuffer
 */
export async function decryptData(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  ivHex: string,
  aad?: string
): Promise<ArrayBuffer> {
  const iv = hexToBytes(ivHex);

  const decryptParams: AesGcmParams = {
    name: ALGORITHM,
    iv,
    tagLength: TAG_LENGTH,
  };

  if (aad) {
    decryptParams.additionalData = new TextEncoder().encode(aad);
  }

  return crypto.subtle.decrypt(decryptParams, key, ciphertext);
}

/**
 * Compute SHA-256 checksum of data.
 * @param data - Data to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function computeChecksum(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

/**
 * Encrypt a TOTP secret string for storage in the database.
 */
export async function encryptTotpSecret(
  secret: string,
  masterKeyHex: string,
  userId: string
): Promise<{ encrypted: string; iv: string }> {
  const key = await deriveKey(masterKeyHex, `totp-${userId}`);
  const data = new TextEncoder().encode(secret);
  const { ciphertext, iv } = await encryptData(data, key, `totp:${userId}`);
  return {
    encrypted: bytesToHex(new Uint8Array(ciphertext)),
    iv,
  };
}

/**
 * Decrypt a TOTP secret from the database.
 */
export async function decryptTotpSecret(
  encryptedHex: string,
  ivHex: string,
  masterKeyHex: string,
  userId: string
): Promise<string> {
  const key = await deriveKey(masterKeyHex, `totp-${userId}`);
  const ciphertext = hexToBytes(encryptedHex).buffer;
  const plaintext = await decryptData(ciphertext, key, ivHex, `totp:${userId}`);
  return new TextDecoder().decode(plaintext);
}

// ── Utility Functions ───────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random encryption key (for initial setup).
 * @returns 64-character hex string (32 bytes = 256 bits)
 */
export function generateMasterKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}
