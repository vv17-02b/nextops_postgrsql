import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookConfigDto } from './dto/create-webhookconfig.dto';
import { UpdateWebhookConfigDto } from './dto/update-webhookconfig.dto';
import { Prisma } from '@prisma/client';
import type { WebhookConfig } from '@prisma/client';

@Injectable()
export class WebhookConfigService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateWebhookConfigDto): Promise<WebhookConfig> {
    return this.prisma.webhookConfig.create({ 
      data: dto as unknown as Prisma.WebhookConfigUncheckedCreateInput 
    });
  }

  async findAll(): Promise<WebhookConfig[]> {
    return this.prisma.webhookConfig.findMany();
  }

  async findOne(id: string): Promise<WebhookConfig> {
    const item = await this.prisma.webhookConfig.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Конфігурацію вебхука з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateWebhookConfigDto): Promise<WebhookConfig> {
    await this.findOne(id);
    return this.prisma.webhookConfig.update({
      where: { id },
      //  ФІКС ПОМИЛКИ: Використовуємо правильний тип Prisma для неперевіреного оновлення NoSQL документів
      data: dto as unknown as Prisma.WebhookConfigUncheckedUpdateInput,
    });
  }

  async remove(id: string): Promise<WebhookConfig> {
    await this.findOne(id);
    return this.prisma.webhookConfig.delete({ where: { id } });
  }
}
