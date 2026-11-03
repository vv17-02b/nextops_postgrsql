import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import { Prisma } from '@prisma/client';
import type { UserAiBudget } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

const CENTS_PER_UNIT = 100;

function toMinor(value: number): number {
  if (!Number.isFinite(value)) {
    throw new ForbiddenException('Budget values must be finite numbers.');
  }
  const minor = Math.round(value * CENTS_PER_UNIT);
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new ForbiddenException('Budget value is out of the supported minor-unit range.');
  }
  return minor;
}

// Extension shape kept compatible with the frontend budget view.
interface UserAiBudgetExtended extends UserAiBudget {
  totalBudgetMinor: number;
  usedBudgetMinor: number;
  currency: string;
}

@Injectable()
export class UserAiBudgetService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) { }

  async create(dto: CreateUserAiBudgetDto): Promise<UserAiBudget> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');
    // Auto reset date: exactly 30 days ahead.
    const autoResetDate = new Date();
    autoResetDate.setDate(autoResetDate.getDate() + 30);

    const budgetData: Prisma.UserAiBudgetUncheckedCreateInput = {
      companyId,
      userId: String(dto.userId).trim(),
      monthlyLimitMinor: toMinor(dto.totalBudgetMinor),
      currentUsageMinor: toMinor(dto.usedBudgetMinor ?? 0),
      resetDate: autoResetDate,
    };

    return this.prisma.userAiBudget.create({
      data: budgetData,
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<UserAiBudgetExtended>> {
    return paginate(
      query,
      async (skip, take) => {
        const budgets = await this.prisma.userAiBudget.findMany({ skip, take });
        return budgets.map((item) => ({
          ...item,
          totalBudgetMinor: item.monthlyLimitMinor,
          usedBudgetMinor: item.currentUsageMinor,
          currency: 'USD',
        }));
      },
      () => this.prisma.userAiBudget.count(),
    );
  }

  async findOne(id: string): Promise<UserAiBudgetExtended> {
    const item = await this.prisma.userAiBudget.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Бюджет з ID ${id} не знайдено`);

    return {
      ...item,
      totalBudgetMinor: item.monthlyLimitMinor,
      usedBudgetMinor: item.currentUsageMinor,
      currency: 'USD',
    };
  }

  async update(id: string, dto: UpdateUserAiBudgetDto): Promise<UserAiBudget> {
    await this.findOne(id);

    const updateData: Prisma.UserAiBudgetUncheckedUpdateInput = {};
    if (dto.userId) updateData.userId = dto.userId;
    if (dto.totalBudgetMinor !== undefined) updateData.monthlyLimitMinor = toMinor(dto.totalBudgetMinor);
    if (dto.usedBudgetMinor !== undefined) updateData.currentUsageMinor = toMinor(dto.usedBudgetMinor);

    return this.prisma.userAiBudget.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<UserAiBudget> {
    await this.findOne(id);
    return this.prisma.userAiBudget.delete({ where: { id } });
  }
}
