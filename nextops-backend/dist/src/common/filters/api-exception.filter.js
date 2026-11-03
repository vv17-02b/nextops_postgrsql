"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApiExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
function getPrismaErrorCode(exception) {
    if (typeof exception !== 'object' || exception === null || !('code' in exception)) {
        return undefined;
    }
    const code = exception.code;
    return typeof code === 'string' ? code : undefined;
}
function getMappedStatus(code) {
    switch (code) {
        case 'P2002':
            return common_1.HttpStatus.CONFLICT;
        case 'P2003':
        case 'P2011':
        case 'P2012':
            return common_1.HttpStatus.BAD_REQUEST;
        case 'P2025':
            return common_1.HttpStatus.NOT_FOUND;
        case 'P1001':
        case 'P1002':
            return common_1.HttpStatus.SERVICE_UNAVAILABLE;
        default:
            return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
function getSafeMessage(statusCode) {
    if (statusCode === common_1.HttpStatus.BAD_REQUEST)
        return 'The request is invalid.';
    if (statusCode === common_1.HttpStatus.UNAUTHORIZED)
        return 'Authentication is required.';
    if (statusCode === common_1.HttpStatus.FORBIDDEN)
        return 'The request is not allowed.';
    if (statusCode === common_1.HttpStatus.NOT_FOUND)
        return 'The requested resource was not found.';
    if (statusCode === common_1.HttpStatus.CONFLICT)
        return 'The request conflicts with existing data.';
    if (statusCode === common_1.HttpStatus.SERVICE_UNAVAILABLE)
        return 'A required service is unavailable.';
    if (statusCode >= common_1.HttpStatus.INTERNAL_SERVER_ERROR)
        return 'An unexpected error occurred.';
    return 'The request could not be completed.';
}
let ApiExceptionFilter = ApiExceptionFilter_1 = class ApiExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(ApiExceptionFilter_1.name);
    }
    catch(exception, host) {
        const http = host.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const prismaCode = getPrismaErrorCode(exception);
        const statusCode = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : getMappedStatus(prismaCode);
        const exceptionResponse = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : null;
        const responseObject = typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? exceptionResponse
            : {};
        const errors = Array.isArray(responseObject.errors)
            ? responseObject.errors
            : [];
        const message = errors.length > 0
            ? 'Request validation failed.'
            : getSafeMessage(statusCode);
        const errorCode = typeof responseObject.errorCode === 'string'
            ? responseObject.errorCode
            : prismaCode
                ? `DATABASE_${prismaCode}`
                : statusCode === common_1.HttpStatus.BAD_REQUEST && errors.length > 0
                    ? 'VALIDATION_ERROR'
                    : `HTTP_${statusCode}`;
        const body = {
            statusCode,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
            errors,
        };
        if (statusCode >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`${request.method} ${request.path} failed`, exception instanceof Error ? exception.stack : undefined);
        }
        response.status(statusCode).json(body);
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = ApiExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], ApiExceptionFilter);
//# sourceMappingURL=api-exception.filter.js.map