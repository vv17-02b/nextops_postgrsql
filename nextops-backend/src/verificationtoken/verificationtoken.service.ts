import { Injectable, NotFoundException, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { VerificationToken } from '@prisma/client';

@Injectable()
export class VerificationTokenService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext) private readonly tenantContext: TenantContext,
  ) {}

  async create(dto: CreateVerificationTokenDto, companyId?: string): Promise<VerificationToken> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');

    let parsedDate = new Date(dto.expires);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
      parsedDate.setDate(parsedDate.getDate() + 1);
    }

    try {
      return await this.prisma.verificationToken.create({
        data: {
          companyId: activeCompanyId,
          identifier: dto.identifier.trim(),
          token: dto.token.trim(),
          expires: parsedDate,
        },
      });
    } catch {
      throw new BadRequestException('Could not save the verification token.');
    }
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<VerificationToken>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.verificationToken.findMany({ where, skip, take }),
      () => this.prisma.verificationToken.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<VerificationToken> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.verificationToken.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) {
      throw new NotFoundException('Токен верифікації не знайдено');
    }
    return item;
  }

  async update(
    id: string,
    dto: UpdateVerificationTokenDto,
    companyId?: string,
  ): Promise<VerificationToken> {
    await this.findOne(id, companyId);

    return this.prisma.verificationToken.update({
      where: { id },
      data: {
        identifier: dto.identifier,
        token: dto.token,
        expires: dto.expires ? new Date(dto.expires) : undefined,
      },
    });
  }

  async remove(id: string, companyId?: string): Promise<VerificationToken> {
    await this.findOne(id, companyId);
    return this.prisma.verificationToken.delete({ where: { id } });
  }
}
