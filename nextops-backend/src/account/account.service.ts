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

  async create(dto: CreateAccountDto): Promise<Account> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.account.create({ data: { ...dto, companyId } });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Account>> {
    return paginate(
      query,
      (skip, take) => this.prisma.account.findMany({ skip, take }),
      () => this.prisma.account.count(),
    );
  }

  async findOne(id: string): Promise<Account> {
    const item = await this.prisma.account.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Документ з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }
}
