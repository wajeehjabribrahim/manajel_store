import crypto from 'crypto';

// Dedicated key preferred; NEXTAUTH_SECRET kept as fallback because existing
// rows may have been encrypted under it.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';

const GCM_IV_LENGTH = 12;
const LEGACY_ALGORITHM = 'aes-256-cbc';
const ALGORITHM = 'aes-256-gcm';
const V2_PREFIX = 'v2';

function hasUsableKey(): boolean {
  return ENCRYPTION_KEY.length >= 32;
}

function deriveKey(): Buffer {
  // Same derivation as the legacy implementation so old rows stay readable.
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

/**
 * Encrypts with AES-256-GCM (authenticated encryption — tampering is detected
 * on decrypt, unlike the old CBC mode). Format: "v2:iv:authTag:ciphertext".
 *
 * THROWS if no usable key is configured: silently storing PII in plaintext
 * (the old behavior) is worse than failing loudly. Set ENCRYPTION_KEY (32+
 * chars) in the environment.
 */
export function encryptData(plaintext: string): string {
  if (!hasUsableKey()) {
    throw new Error(
      'ENCRYPTION_KEY is missing or shorter than 32 characters — refusing to store data unencrypted. ' +
      'Set ENCRYPTION_KEY in the environment.'
    );
  }

  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return [V2_PREFIX, iv.toString('hex'), authTag.toString('hex'), encrypted].join(':');
}

/**
 * Decrypts both formats:
 *  - "v2:iv:tag:cipher"  → AES-256-GCM (current)
 *  - "iv:cipher"         → AES-256-CBC (legacy rows)
 * Anything else is returned unchanged (legacy plaintext rows from when the
 * key was missing).
 */
export function decryptData(encryptedData: string): string {
  if (!ENCRYPTION_KEY || !encryptedData) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');

  try {
    if (parts.length === 4 && parts[0] === V2_PREFIX) {
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(), iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(parts[3], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    if (parts.length === 2 && /^[a-fA-F0-9]{32}$/.test(parts[0])) {
      const iv = Buffer.from(parts[0], 'hex');
      const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, deriveKey(), iv);

      let decrypted = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    return encryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}
