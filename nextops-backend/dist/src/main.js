"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const node_crypto_1 = require("node:crypto");
const logging_interceptor_1 = require("./prisma/logging.interceptor");
const prisma_service_1 = require("./prisma/prisma.service");
const api_exception_filter_1 = require("./common/filters/api-exception.filter");
const cookie_session_1 = require("./auth/cookie-session");
const pino_logger_1 = require("./common/logging/pino-logger");
function flattenValidationErrors(validationErrors, parent = '') {
    return validationErrors.flatMap((error) => {
        const field = parent ? `${parent}.${error.property}` : error.property;
        const current = error.constraints
            ? [{ field, messages: Object.values(error.constraints) }]
            : [];
        return [...current, ...flattenValidationErrors(error.children ?? [], field)];
    });
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.useLogger(new pino_logger_1.PinoLogger());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        exceptionFactory: (errors) => new common_1.BadRequestException({
            message: 'Request validation failed.',
            errorCode: 'VALIDATION_ERROR',
            errors: flattenValidationErrors(errors),
        }),
    }));
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean));
    const allowLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production';
    app.enableCors({
        origin: (origin, callback) => {
            const isLocalDevelopmentOrigin = allowLocalDevelopmentOrigin
                && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '');
            callback(null, !origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin);
        },
        credentials: true,
    });
    app.use((request, response, next) => {
        const csrfCookie = (0, cookie_session_1.readCookie)(request, cookie_session_1.CSRF_COOKIE);
        if (!csrfCookie) {
            request.csrfToken = (0, node_crypto_1.randomBytes)(32).toString('base64url');
            response.cookie(cookie_session_1.CSRF_COOKIE, request.csrfToken, (0, cookie_session_1.csrfCookieOptions)());
        }
        const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
        const origin = request.get('origin');
        const isLocalDevelopmentOrigin = allowLocalDevelopmentOrigin
            && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '');
        if (isUnsafeMethod
            && (origin || (0, cookie_session_1.readCookie)(request, cookie_session_1.SESSION_COOKIE))
            && (!csrfCookie
                || !origin
                || (!allowedOrigins.has(origin) && !isLocalDevelopmentOrigin)
                || !matchesCsrfToken(csrfCookie, request.get(cookie_session_1.CSRF_HEADER)))) {
            response.status(403).json({
                statusCode: 403,
                message: 'A valid CSRF token and trusted origin are required.',
                errorCode: 'CSRF_VALIDATION_FAILED',
            });
            return;
        }
        next();
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads',
    });
    const prismaService = app.get(prisma_service_1.PrismaService);
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(prismaService));
    const port = Number(process.env.PORT ?? 3001);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535');
    }
    app.enableShutdownHooks();
    await app.listen(port, process.env.HOST ?? '0.0.0.0');
    new pino_logger_1.PinoLogger().log(`NextOps backend listening on port ${port}`);
}
bootstrap();
function matchesCsrfToken(cookie, header) {
    if (!header)
        return false;
    const cookieBuffer = Buffer.from(cookie);
    const headerBuffer = Buffer.from(header);
    return cookieBuffer.length === headerBuffer.length
        && (0, node_crypto_1.timingSafeEqual)(cookieBuffer, headerBuffer);
}
//# sourceMappingURL=main.js.map