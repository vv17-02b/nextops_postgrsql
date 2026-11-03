import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
export declare class TenantContext implements NestMiddleware {
    private readonly storage;
    use(_request: Request, _response: Response, next: NextFunction): void;
    getCompanyId(): string | null;
    setCompanyId(companyId: string): void;
}
