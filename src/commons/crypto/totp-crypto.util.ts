import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Cifra en reposo el secreto TOTP de cada usuario (AES-256-GCM). La clave viene de
// TOTP_ENCRYPTION_KEY (32 bytes en hex, ver .env.app.example) — nunca se guarda el secreto
// en texto plano en la base de datos.
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('TOTP_ENCRYPTION_KEY no está configurada (debe ser un hex de 64 caracteres / 32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptTotpSecret(plainSecret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptTotpSecret(stored: string): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(':');
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
