import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type UserAiBudget } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { MAX_MINOR_UNITS } from '../common/money';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

function assertSafeMinorUnits(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_MINOR_UNITS) {
    throw new BadRequestException('Budget value must be a valid non-negative integer in minor units.');
  }
  return value;
}

export interface UserAiBudgetExtended extends UserAiBudget {
  totalBudgetMinor: number;
  usedBudgetMinor: number;
  currency: string;
}

function toExtended(item: UserAiBudget, currency = 'USD'): UserAiBudgetExtended {
  return {
    ...item,
    totalBudgetMinor: item.monthlyLimitMinor,
    usedBudgetMinor: item.currentUsageMinor,
    currency,
  };
}

@Injectable()
export class UserAiBudgetService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  private resolveCompanyId(companyId?: string): string {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }
    if (!this.tenantContext.getCompanyId()) {
      this.tenantContext.setCompanyId(activeCompanyId);
    }
    return activeCompanyId;
  }

  private async assertUserBelongsToCompany(userId: string, companyId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Вказаного користувача не знайдено у вашому робочому просторі.');
    }
  }

  async create(dto: CreateUserAiBudgetDto, companyId?: string): Promise<UserAiBudgetExtended> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const normalizedUserId = dto.userId.trim();

    await this.assertUserBelongsToCompany(normalizedUserId, activeCompanyId);

    const autoResetDate = new Date();
    autoResetDate.setDate(autoResetDate.getDate() + 30);

    const budgetData: Prisma.UserAiBudgetUncheckedCreateInput = {
      companyId: activeCompanyId,
      userId: normalizedUserId,
      monthlyLimitMinor: assertSafeMinorUnits(dto.totalBudgetMinor),
      currentUsageMinor: assertSafeMinorUnits(dto.usedBudgetMinor ?? 0),
      resetDate: autoResetDate,
    };

    const created = await this.prisma.userAiBudget.create({
      data: budgetData,
    });

    return toExtended(created, dto.currency.trim().toUpperCase() || 'USD');
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<UserAiBudgetExtended>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

    return paginate(
      query,
      async (skip, take) => {
        const budgets = await this.prisma.userAiBudget.findMany({ where, skip, take });
        return budgets.map((item) => toExtended(item));
      },
      () => this.prisma.userAiBudget.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<UserAiBudgetExtended> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.userAiBudget.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!item) {
      throw new NotFoundException(`Бюджет з ID ${id} не знайдено`);
    }

    return toExtended(item);
  }

  async update(
    id: string,
    dto: UpdateUserAiBudgetDto,
    companyId?: string,
  ): Promise<UserAiBudgetExtended> {
    const existing = await this.findOne(id, companyId);

    const updateData: Prisma.UserAiBudgetUncheckedUpdateInput = {};
    if (dto.userId !== undefined) {
      const normalizedUserId = dto.userId.trim();
      await this.assertUserBelongsToCompany(normalizedUserId, existing.companyId);
      updateData.userId = normalizedUserId;
    }
    if (dto.totalBudgetMinor !== undefined) {
      updateData.monthlyLimitMinor = assertSafeMinorUnits(dto.totalBudgetMinor);
    }
    if (dto.usedBudgetMinor !== undefined) {
      updateData.currentUsageMinor = assertSafeMinorUnits(dto.usedBudgetMinor);
    }

    const updated = await this.prisma.userAiBudget.update({
      where: { id },
      data: updateData,
    });

    return toExtended(updated, dto.currency?.trim().toUpperCase() || existing.currency);
  }

  async remove(id: string, companyId?: string): Promise<UserAiBudget> {
    await this.findOne(id, companyId);
    return this.prisma.userAiBudget.delete({ where: { id } });
  }
}
