import crypto from 'crypto';

// New data is always written with the primary key. Older rows may have been
// written under a different secret (before ENCRYPTION_KEY existed the code fell
// back to NEXTAUTH_SECRET), so decryption tries every known secret in turn —
// otherwise those rows become unreadable the moment a new key is introduced.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';

const DECRYPTION_SECRETS: string[] = Array.from(
  new Set(
    [
      ENCRYPTION_KEY,
      process.env.NEXTAUTH_SECRET,
      process.env.ENCRYPTION_KEY_PREVIOUS, // set this when rotating keys
    ].filter((secret): secret is string => !!secret && secret.length >= 32)
  )
);

const GCM_IV_LENGTH = 12;
const LEGACY_ALGORITHM = 'aes-256-cbc';
const ALGORITHM = 'aes-256-gcm';
const V2_PREFIX = 'v2';

// scrypt is intentionally slow; derive each secret once.
const keyCache = new Map<string, Buffer>();

function hasUsableKey(): boolean {
  return ENCRYPTION_KEY.length >= 32;
}

function deriveKey(secret: string = ENCRYPTION_KEY): Buffer {
  // Same derivation as the legacy implementation so old rows stay readable.
  const cached = keyCache.get(secret);
  if (cached) return cached;

  const derived = crypto.scryptSync(secret, 'salt', 32);
  keyCache.set(secret, derived);
  return derived;
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
  if (!DECRYPTION_SECRETS.length || !encryptedData) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');
  const isGcm = parts.length === 4 && parts[0] === V2_PREFIX;
  const isCbc = parts.length === 2 && /^[a-fA-F0-9]{32}$/.test(parts[0]);

  if (!isGcm && !isCbc) {
    // Plaintext row from before encryption was active.
    return encryptedData;
  }

  for (const secret of DECRYPTION_SECRETS) {
    try {
      if (isGcm) {
        const decipher = crypto.createDecipheriv(
          ALGORITHM,
          deriveKey(secret),
          Buffer.from(parts[1], 'hex')
        );
        decipher.setAuthTag(Buffer.from(parts[2], 'hex'));

        let decrypted = decipher.update(parts[3], 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      const decipher = crypto.createDecipheriv(
        LEGACY_ALGORITHM,
        deriveKey(secret),
        Buffer.from(parts[0], 'hex')
      );

      let decrypted = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Wrong key for this row — try the next known secret.
    }
  }

  console.error('Decryption failed: no configured key matches this value.');
  return encryptedData;
}
