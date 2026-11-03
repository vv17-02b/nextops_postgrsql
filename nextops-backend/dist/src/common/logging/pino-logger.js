"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoLogger = void 0;
const pino_1 = require("pino");
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
        paths: [
            'password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'webhookSecret',
            'cardNumber',
            '*.password',
            '*.passwordHash',
            '*.token',
            '*.accessToken',
            '*.refreshToken',
            '*.secret',
            '*.webhookSecret',
            '*.cardNumber',
            'req.headers.authorization',
            'req.headers.cookie',
            'headers.authorization',
            'headers.cookie',
        ],
        censor: '[REDACTED]',
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
function messageText(message) {
    return typeof message === 'string' ? message : 'NestJS structured log event';
}
class PinoLogger {
    log(message, ...optionalParams) {
        logger.info({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
    }
    error(message, ...optionalParams) {
        logger.error({ context: optionalParams[1], detail: optionalParams[0] }, messageText(message));
    }
    warn(message, ...optionalParams) {
        logger.warn({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
    }
    debug(message, ...optionalParams) {
        logger.debug({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
    }
    verbose(message, ...optionalParams) {
        logger.trace({ context: optionalParams[0], detail: typeof message === 'string' ? undefined : message }, messageText(message));
    }
}
exports.PinoLogger = PinoLogger;
//# sourceMappingURL=pino-logger.js.map