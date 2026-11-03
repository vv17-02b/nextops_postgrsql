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

  async create(dto: CreateProjectDto): Promise<Project> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.project.create({ data: { ...dto, companyId } });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Project>> {
    return paginate(
      query,
      (skip, take) => this.prisma.project.findMany({ skip, take }),
      () => this.prisma.project.count(),
    );
  }

  async findOne(id: string): Promise<Project> {
    const item = await this.prisma.project.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Проєкт з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Project> {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
