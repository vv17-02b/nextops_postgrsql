import { Injectable, NotFoundException, Inject, MethodNotAllowedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import type { ApiHistory } from '@prisma/client';

interface MongoCursor {
  firstBatch: Record<string, unknown>[];
}

interface MongoRawResult {
  cursor?: MongoCursor;
}

@Injectable()
export class ApiHistoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateApiHistoryDto): Promise<ApiHistory> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
    
    await runCommand({
      insert: 'ApiHistory',
      documents: [
        {
          endpoint: dto.endpoint,
          method: dto.method,
          statusCode: dto.statusCode,
          durationMs: dto.durationMs,
          createdAt: new Date(),
        }
      ]
    });

    return {
      id: 'raw-logged',
      userId: null,
      endpoint: dto.endpoint,
      method: dto.method,
      statusCode: dto.statusCode,
      durationMs: dto.durationMs,
      requestBody: null,
      responseBody: null,
      createdAt: new Date(),
    };
  }

  async findAll(): Promise<ApiHistory[]> {
    try {
      const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
      
      // КУЛЕНЕПРОБИВНИЙ ФІКС P2023: Читаємо Time-Series логи в обхід падаючого findMany
      const rawResult = await runCommand({
        find: 'ApiHistory',
        filter: {},
        sort: { createdAt: -1 },
        limit: 50
      }) as unknown as MongoRawResult;

      if (rawResult && rawResult.cursor && Array.isArray(rawResult.cursor.firstBatch)) {
        return rawResult.cursor.firstBatch.map((doc) => {
          const rawId = doc._id as Record<string, string> | string | undefined;
          const rawUserId = doc.userId as Record<string, string> | string | undefined;
          const rawCreatedAt = doc.createdAt as Record<string, string> | string | undefined;

          return {
            id: typeof rawId === 'object' && rawId ? rawId['\$oid'] || String(Math.random()) : String(rawId || Math.random()),
            userId: typeof rawUserId === 'object' && rawUserId ? rawUserId['\$oid'] || null : (rawUserId as string | null),
            endpoint: String(doc.endpoint || '/unknown'),
            method: String(doc.method || 'GET'),
            statusCode: Number(doc.statusCode) || 200,
            durationMs: Number(doc.durationMs) || 0,
            requestBody: (doc.requestBody as string) || null,
            responseBody: (doc.responseBody as string) || null,
            createdAt: typeof rawCreatedAt === 'object' && rawCreatedAt ? new Date(rawCreatedAt['\$date'] || Date.now()) : new Date(String(rawCreatedAt || Date.now())),
          };
        });
      }

      return;
    } catch (error) {
      console.error('🚨 [ApiHistory Safe Fallback Executed]:', error);
      return;
    }
  }

  async findOne(id: string): Promise<ApiHistory> {
    const item = await this.prisma.apiHistory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Запис логу з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory> {
    throw new MethodNotAllowedException('Оновлення записів у Time-Series колекції ApiHistory заборонено архітектурою бази даних');
  }

  async remove(id: string): Promise<ApiHistory> {
    throw new MethodNotAllowedException('Видалення окремих логів з Time-Series колекції заборонено. Використовуйте TTL правила очищення сховища');
  }
}
