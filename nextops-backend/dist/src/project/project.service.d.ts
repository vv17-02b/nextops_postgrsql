import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { Project } from '@prisma/client';
export declare class ProjectService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    create(dto: CreateProjectDto): Promise<Project>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Project>>;
    findOne(id: string): Promise<Project>;
    update(id: string, dto: UpdateProjectDto): Promise<Project>;
    remove(id: string): Promise<Project>;
}
