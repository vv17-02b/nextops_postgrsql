"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtSecret = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const configuredJwtSecret = process.env.JWT_SECRET;
const hasValidJwtSecret = Boolean(configuredJwtSecret && configuredJwtSecret.length >= 32);
if (!hasValidJwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must contain at least 32 characters before starting the API.');
}
exports.jwtSecret = hasValidJwtSecret
    ? configuredJwtSecret
    : (0, node_crypto_1.randomBytes)(48).toString('base64url');
if (!hasValidJwtSecret) {
    new common_1.Logger('AuthModule').warn('Using an ephemeral JWT secret for development; configure a stable JWT_SECRET.');
}
//# sourceMappingURL=jwt-secret.js.map