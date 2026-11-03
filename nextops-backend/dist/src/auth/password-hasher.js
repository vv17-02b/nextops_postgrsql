"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const KEY_LENGTH = 64;
function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        (0, node_crypto_1.scrypt)(password, salt, KEY_LENGTH, (error, key) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(key);
        });
    });
}
function safeEqual(left, right) {
    return left.length === right.length && (0, node_crypto_1.timingSafeEqual)(left, right);
}
async function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const key = await deriveKey(password, salt);
    return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verifyPassword(password, storedPassword) {
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
//# sourceMappingURL=password-hasher.js.map