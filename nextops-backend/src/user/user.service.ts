import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { User } from '@prisma/client';
import { TenantContext } from '../prisma/tenant-context';

export type SafeUser = Omit<User, 'passwordHash'>;

function withoutPassword(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

@Injectable( )
export class UserService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new ForbiddenException('A business workspace is required.');

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
          monthlyLimitMinor: 1000, // $10.00
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
      });

      return newUser;
    });
    return withoutPassword(user);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<SafeUser>> {
    const page = await paginate(
      query,
      (skip, take) => this.prisma.user.findMany({ skip, take }),
      () => this.prisma.user.count(),
    );
    return { ...page, data: page.data.map(withoutPassword) };
  }

  async findOne(id: string): Promise<SafeUser> {
    const item = await this.prisma.user.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Користувача не знайдено`);
    return withoutPassword(item);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { ...dto, role: undefined, companyId: undefined, passwordHash: undefined },
    });
    return withoutPassword(updatedUser);
  }

  async remove(id: string): Promise<SafeUser> {
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    return withoutPassword(deletedUser);
  }
}