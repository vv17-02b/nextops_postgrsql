import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { Prisma } from '@prisma/client';
import type { ApiHistory } from '@prisma/client';

@Injectable()
export class ApiHistoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateApiHistoryDto): Promise<ApiHistory> {
    //  ХАК ДЛЯ TIME-SERIES: Використовуємо сирий NoSQL insert запит, 
    // щоб обійти транзакції Prisma, які блокує MongoDB Atlas для логів
    const rawResult = await this.prisma.$runCommandRaw({
      insert: 'ApiHistory',
      documents: [
        {
          endpoint: dto.endpoint,
          method: dto.method,
          statusCode: dto.statusCode,
          durationMs: dto.durationMs,
          createdAt: new Date(), // Обов'язковий таймстамп для Time-Series
        }
      ]
    });

    // Повертаємо тимчасовий об'єкт для фронтенду, щоб не ламати інтерфейс сторінки
    return {
      id: 'raw-logged',
      ...dto,
      createdAt: new Date(),
    } as unknown as ApiHistory;
  }

  async findAll(): Promise<ApiHistory[]> {
    return this.prisma.apiHistory.findMany({
      orderBy: { createdAt: 'desc' } // Свіжі логи завжди зверху
    });
  }

  async findOne(id: string): Promise<ApiHistory> {
    const item = await this.prisma.apiHistory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Запис логу з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory> {
    await this.findOne(id);
    return this.prisma.apiHistory.update({
      where: { id },
      data: dto as unknown as Prisma.ApiHistoryUncheckedUpdateInput,
    });
  }

  async remove(id: string): Promise<ApiHistory> {
    await this.findOne(id);
    return this.prisma.apiHistory.delete({ where: { id } });
  }
}
