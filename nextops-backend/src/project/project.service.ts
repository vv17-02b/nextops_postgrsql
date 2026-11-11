import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Project } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateProjectDto, companyId?: string): Promise<Project> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.project.create({ data: { ...dto, companyId: activeCompanyId } });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Project>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.project.findMany({ where, skip, take }),
      () => this.prisma.project.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Project> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.project.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Проєкт з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateProjectDto, companyId?: string): Promise<Project> {
    await this.findOne(id, companyId);
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<Project> {
    await this.findOne(id, companyId);
    return this.prisma.project.delete({ where: { id } });
  }
}
