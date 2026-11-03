import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    live(): {
        status: 'ok';
    };
    ready(): Promise<{
        status: 'ok';
    }>;
}
