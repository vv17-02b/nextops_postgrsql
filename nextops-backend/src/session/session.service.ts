import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Prisma, Session } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateSessionDto, companyId?: string): Promise<Session> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    let sessionExpires = dto.expires ? new Date(dto.expires) : null;
    if (!sessionExpires || isNaN(sessionExpires.getTime())) {
      sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return this.prisma.session.create({
      data: {
        sessionToken: dto.sessionToken,
        companyId: activeCompanyId,
        userId: dto.userId,
        expires: sessionExpires,
      },
    });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Session>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.session.findMany({ where, skip, take }),
      () => this.prisma.session.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Session> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.session.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Сесію з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateSessionDto, companyId?: string): Promise<Session> {
    await this.findOne(id, companyId);

    const updateData: Prisma.SessionUncheckedUpdateInput = {};
    if (dto.sessionToken) updateData.sessionToken = dto.sessionToken;
    if (dto.userId) updateData.userId = dto.userId;

    if (dto.expires) {
      const parsedDate = new Date(dto.expires);
      if (!isNaN(parsedDate.getTime())) {
        updateData.expires = parsedDate;
      }
    }

    return this.prisma.session.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, companyId?: string): Promise<Session> {
    await this.findOne(id, companyId);
    return this.prisma.session.delete({ where: { id } });
  }
}
