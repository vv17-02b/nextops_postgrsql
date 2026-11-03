import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { VerificationToken } from '@prisma/client';
export declare class VerificationTokenService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateVerificationTokenDto): Promise<VerificationToken>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<VerificationToken>>;
    findOne(id: string): Promise<VerificationToken>;
    update(id: string, dto: UpdateVerificationTokenDto): Promise<VerificationToken>;
    remove(id: string): Promise<VerificationToken>;
}
