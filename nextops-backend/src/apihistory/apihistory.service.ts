import { Injectable, NotFoundException, Inject, MethodNotAllowedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { ApiHistory } from '@prisma/client';

@Injectable()
export class ApiHistoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateApiHistoryDto, userId: string): Promise<ApiHistory> {
    return this.prisma.apiHistory.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        method: dto.method,
        statusCode: dto.statusCode,
        durationMs: dto.durationMs,
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<ApiHistory>> {
    return paginate(
      query,
      (skip, take) => this.prisma.apiHistory.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      () => this.prisma.apiHistory.count(),
    );
  }

  async findOne(id: string): Promise<ApiHistory> {
    const item = await this.prisma.apiHistory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Запис логу з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory> {
    void id;
    void dto;
    throw new MethodNotAllowedException('Оновлення записів ApiHistory заборонено політикою бази даних');
  }

  async remove(id: string): Promise<ApiHistory> {
    void id;
    throw new MethodNotAllowedException('Видалення окремих записів ApiHistory заборонено політикою бази даних');
  }
}
