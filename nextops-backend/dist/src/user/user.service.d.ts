import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { User } from '@prisma/client';
import { TenantContext } from '../prisma/tenant-context';
export type SafeUser = Omit<User, 'passwordHash'>;
export declare class UserService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateUserDto): Promise<SafeUser>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<SafeUser>>;
    findOne(id: string): Promise<SafeUser>;
    update(id: string, dto: UpdateUserDto): Promise<SafeUser>;
    remove(id: string): Promise<SafeUser>;
}
