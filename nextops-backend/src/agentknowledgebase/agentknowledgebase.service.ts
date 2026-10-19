import { Injectable, NotFoundException, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import type { AgentKnowledgeBase } from '@prisma/client';

@Injectable()
export class AgentKnowledgeBaseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  // 1. Метод виконання ШІ-завдань із вбудованим FinOps-контролем бюджету
  async executeAiTask(userId: string, estimatedCost: number, taskPayload: string): Promise<{ success: boolean; aiResponse: string }> {
    // А. Шукаємо бюджет користувача через findFirst (оскільки userId не унікальний індекс на рівні Prisma)
    const budget = await this.prisma.userAiBudget.findFirst({
      where: { userId },
    });

    if (!budget) {
      throw new NotFoundException(`FinOps Error: Для користувача з ID ${userId} не знайдено активного ШІ-гаманця`);
    }

    // Б. Зчитуємо реальне поле currentUsage зі схеми NextOps
    const currentUsage = budget.currentUsage || 0;

    // В. 🔥 HARD-LOCKING ГВАРДІЯ: Захист від перевищення ліміту компанії
    if (currentUsage + estimatedCost > budget.monthlyLimit) {
      throw new ForbiddenException(
        `Запит заблоковано FinOps системою. Місячний ліміт ШІ-токенів вичерпано. Доступний баланс: \$${(budget.monthlyLimit - currentUsage).toFixed(4)}`
      );
    }

    // Г. Емуляція виконання запиту до нейромережі (OpenAI / Anthropic / Local LLM)
    const mockAiResponse = `Processed task: "${taskPayload}". AI tokens validated by NextOps engine core.`;

    // Д. АТОМАРНЕ СПИСАННЯ БАЛАНСУ: Оновлюємо за унікальним id самого бюджету budget.id
    await this.prisma.userAiBudget.update({
      where: { id: budget.id },
      data: {
        currentUsage: { increment: estimatedCost },
      },
    });

    return {
      success: true,
      aiResponse: mockAiResponse,
    };
  }

  // 2. Стандартні системні CRUD методи модуля
  async create(dto: CreateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    return this.prisma.agentKnowledgeBase.create({ data: dto });
  }

  async findAll(): Promise<AgentKnowledgeBase[]> {
    return this.prisma.agentKnowledgeBase.findMany();
  }

  async findOne(id: string): Promise<AgentKnowledgeBase> {
    const item = await this.prisma.agentKnowledgeBase.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateAgentKnowledgeBaseDto): Promise<AgentKnowledgeBase> {
    await this.findOne(id);
    return this.prisma.agentKnowledgeBase.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<AgentKnowledgeBase> {
    await this.findOne(id);
    return this.prisma.agentKnowledgeBase.delete({ where: { id } });
  }
}
