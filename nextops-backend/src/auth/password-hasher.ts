import { hash, verify } from '@node-rs/argon2';

/**
 * Хешує пароль за допомогою алгоритму Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

/**
 * Перевіряє, чи збігається введений пароль із збереженим хешем Argon2
 */
export async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  try {
    // Якщо в базі чомусь залишився старий scrypt або пусте поле
    if (!storedPassword || storedPassword.startsWith('scrypt$')) {
      return { valid: false, needsRehash: false };
    }

    // Перевірка через native-бібліотеку
    const valid = await verify(storedPassword, password);
    return { valid, needsRehash: false };
  } catch (error) {
    // Будь-яка помилка формату не повинна викликати 500 помилку сервера
    return { valid: false, needsRehash: false };
  }
}
