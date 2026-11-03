import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const [algorithm, salt, keyHex] = storedPassword.split('$');
  if (algorithm !== 'scrypt' || !salt || !keyHex) {
    const provided = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return { valid: safeEqual(provided, stored), needsRehash: true };
  }

  const expectedKey = Buffer.from(keyHex, 'hex');
  if (expectedKey.length !== KEY_LENGTH) {
    return { valid: false, needsRehash: false };
  }
  const actualKey = await deriveKey(password, salt);
  return { valid: safeEqual(actualKey, expectedKey), needsRehash: false };
}
