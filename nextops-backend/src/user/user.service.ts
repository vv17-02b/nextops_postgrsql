import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { User } from '@prisma/client';
import { TenantContext } from '../prisma/tenant-context';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';

export type SafeUser = Omit<User, 'passwordHash'>;

function withoutPassword(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

@Injectable()
export class UserService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(PlanEnforcementService)
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');

    await this.planEnforcement.assertUserSeatLimit(companyId);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...dto,
          role: 'MEMBER',
          companyId,
        },
      });

      await tx.userAiBudget.create({
        data: {
          userId: newUser.id,
          companyId,
          monthlyLimitMinor: 1000,
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
      });

      return newUser;
    });
    return withoutPassword(user);
  }

  async findAll(query: PaginationQueryDto, companyId?: string): Promise<PaginatedResponse<SafeUser>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    const page = await paginate(
      query,
      (skip, take) => this.prisma.user.findMany({ where, skip, take }),
      () => this.prisma.user.count({ where }),
    );
    return { ...page, data: page.data.map(withoutPassword) };
  }

  async findOne(id: string, companyId?: string): Promise<SafeUser> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.user.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Користувача не знайдено`);
    return withoutPassword(item);
  }

  async update(id: string, dto: UpdateUserDto, companyId?: string): Promise<SafeUser> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (activeCompanyId) {
      const existing = await this.prisma.user.findFirst({ where: { id, companyId: activeCompanyId } });
      if (!existing) throw new NotFoundException(`Користувача не знайдено`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { ...dto, role: undefined, companyId: undefined, passwordHash: undefined },
    });
    return withoutPassword(updatedUser);
  }

  async remove(id: string, companyId?: string): Promise<SafeUser> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (activeCompanyId) {
      const existing = await this.prisma.user.findFirst({ where: { id, companyId: activeCompanyId } });
      if (!existing) throw new NotFoundException(`Користувача не знайдено`);
    }

    const deletedUser = await this.prisma.user.delete({ where: { id } });
    return withoutPassword(deletedUser);
  }
}
