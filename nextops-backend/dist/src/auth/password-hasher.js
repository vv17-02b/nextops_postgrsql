"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const argon2_1 = require("@node-rs/argon2");
async function hashPassword(password) {
    return await (0, argon2_1.hash)(password);
}
async function verifyPassword(password, storedPassword) {
    try {
        if (!storedPassword || storedPassword.startsWith('scrypt$')) {
            return { valid: false, needsRehash: false };
        }
        const valid = await (0, argon2_1.verify)(storedPassword, password);
        return { valid, needsRehash: false };
    }
    catch (error) {
        return { valid: false, needsRehash: false };
    }
}
//# sourceMappingURL=password-hasher.js.map