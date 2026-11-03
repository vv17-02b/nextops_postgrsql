import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import type { UserAiBudget } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
interface UserAiBudgetExtended extends UserAiBudget {
    totalBudgetMinor: number;
    usedBudgetMinor: number;
    currency: string;
}
export declare class UserAiBudgetService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateUserAiBudgetDto): Promise<UserAiBudget>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<UserAiBudgetExtended>>;
    findOne(id: string): Promise<UserAiBudgetExtended>;
    update(id: string, dto: UpdateUserAiBudgetDto): Promise<UserAiBudget>;
    remove(id: string): Promise<UserAiBudget>;
}
export {};
