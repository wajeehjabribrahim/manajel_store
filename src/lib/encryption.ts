import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';

if (!ENCRYPTION_KEY) {
  console.warn('Warning: ENCRYPTION_KEY not set. Data encryption disabled.');
}

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export function encryptData(plaintext: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    return plaintext;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return plaintext;
  }
}

export function decryptData(encryptedData: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}
