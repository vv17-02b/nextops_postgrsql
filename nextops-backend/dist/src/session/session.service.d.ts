import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Session } from '@prisma/client';
export declare class SessionService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateSessionDto): Promise<Session>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Session>>;
    findOne(id: string): Promise<Session>;
    update(id: string, dto: UpdateSessionDto): Promise<Session>;
    remove(id: string): Promise<Session>;
}
