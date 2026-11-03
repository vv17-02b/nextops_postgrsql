import type { LoggerService } from '@nestjs/common';
export declare class PinoLogger implements LoggerService {
    log(message: unknown, ...optionalParams: unknown[]): void;
    error(message: unknown, ...optionalParams: unknown[]): void;
    warn(message: unknown, ...optionalParams: unknown[]): void;
    debug(message: unknown, ...optionalParams: unknown[]): void;
    verbose(message: unknown, ...optionalParams: unknown[]): void;
}
