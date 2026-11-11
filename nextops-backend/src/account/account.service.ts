import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Account } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateAccountDto, companyId?: string): Promise<Account> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.account.create({ data: { ...dto, companyId: activeCompanyId } });
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<Account>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.account.findMany({ where, skip, take }),
      () => this.prisma.account.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<Account> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.account.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Документ з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateAccountDto, companyId?: string): Promise<Account> {
    await this.findOne(id, companyId);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<Account> {
    await this.findOne(id, companyId);
    return this.prisma.account.delete({ where: { id } });
  }
}
