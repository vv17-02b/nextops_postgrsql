import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { Account } from '@prisma/client';

export type SafeAccount = Omit<
  Account,
  'refresh_token' | 'access_token' | 'id_token' | 'session_state'
>;

function toSafeAccount(account: Account): SafeAccount {
  const {
    refresh_token: _refresh,
    access_token: _access,
    id_token: _idToken,
    session_state: _sessionState,
    ...safe
  } = account;
  void _refresh;
  void _access;
  void _idToken;
  void _sessionState;
  return safe;
}

@Injectable()
export class AccountService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateAccountDto, companyId?: string): Promise<SafeAccount> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    const created = await this.prisma.account.create({
      data: { ...dto, companyId: activeCompanyId },
    });
    return toSafeAccount(created);
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<SafeAccount>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      async (skip, take) => {
        const items = await this.prisma.account.findMany({ where, skip, take });
        return items.map(toSafeAccount);
      },
      () => this.prisma.account.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<SafeAccount> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.account.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Документ з ID ${id} не знайдено`);
    return toSafeAccount(item);
  }

  async update(id: string, dto: UpdateAccountDto, companyId?: string): Promise<SafeAccount> {
    await this.findOne(id, companyId);
    const updated = await this.prisma.account.update({
      where: { id },
      data: dto,
    });
    return toSafeAccount(updated);
  }

  async remove(id: string, companyId?: string): Promise<SafeAccount> {
    await this.findOne(id, companyId);
    const deleted = await this.prisma.account.delete({ where: { id } });
    return toSafeAccount(deleted);
  }
}
