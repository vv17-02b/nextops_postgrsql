import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../prisma/tenant-context';
import type { Request } from 'express';
import { TokenRevocationService } from '../token-revocation.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    private readonly tenantContext;
    private readonly tokenRevocation;
    constructor(prisma: PrismaService, tenantContext: TenantContext, tokenRevocation: TokenRevocationService);
    validate(payload: {
        sub?: string;
        epoch?: number;
    } & Record<string, unknown>, request?: Request & {
        rawToken?: string;
    }): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        role: string;
    }>;
}
export {};
