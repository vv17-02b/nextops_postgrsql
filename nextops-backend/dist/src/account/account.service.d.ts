import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Account } from '@prisma/client';
export declare class AccountService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateAccountDto): Promise<Account>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Account>>;
    findOne(id: string): Promise<Account>;
    update(id: string, dto: UpdateAccountDto): Promise<Account>;
    remove(id: string): Promise<Account>;
}
