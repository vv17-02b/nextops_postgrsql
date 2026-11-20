import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';
import type { AgentKnowledgeBase } from '@prisma/client';

export interface KnowledgeSourceRef {
  id: string;
  title: string;
  type: 'KNOWLEDGE_DOC' | 'PRODUCT';
  snippet: string;
}

export interface AskAssistantResponse {
  answer: string;
  provider: 'openai' | 'local-rag';
  chargedMinor: number;
  remainingBudgetMinor: number;
  sources: KnowledgeSourceRef[];
}

const DEFAULT_QUERY_COST_MINOR = 5; // $0.05 за запит

function tokenizeQuery(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3),
    ),
  ];
}

function scoreTextMatch(haystack: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const lower = haystack.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower.includes(token)) {
      score += 1;
    }
  }
  return score;
}

@Injectable()
export class AgentKnowledgeBaseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  async executeAiTask(
    userId: string,
    estimatedCostMinor: number,
    taskPayload: string,
  ): Promise<{ success: boolean; aiResponse: string }> {
    if (!Number.isSafeInteger(estimatedCostMinor) || estimatedCostMinor <= 0) {
      throw new BadRequestException('Estimated cost must be a positive integer number of minor units.');
    }

    const budget = await this.prisma.userAiBudget.findFirst({
      where: { userId },
    });

    if (!budget) {
      throw new NotFoundException(
        `FinOps Error: Для користувача з ID ${userId} не знайдено активного ШІ-гаманця`,
      );
    }

    const charged = await this.prisma.userAiBudget.updateMany({
      where: {
        id: budget.id,
        currentUsageMinor: { lte: budget.monthlyLimitMinor - estimatedCostMinor },
      },
      data: {
        currentUsageMinor: { increment: estimatedCostMinor },
      },
    });

    if (charged.count !== 1) {
      throw new ForbiddenException('The AI budget limit has been reached.');
    }

    const mockAiResponse = `Processed task: "${taskPayload}". AI tokens validated by NextOps engine core.`;
    return {
      success: true,
      aiResponse: mockAiResponse,
    };
  }

  async askAssistant(
    question: string,
    options: {
      companyId?: string;
      userId?: string;
      projectId?: string;
    },
  ): Promise<AskAssistantResponse> {
    const activeCompanyId = options.companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      throw new BadRequestException('Запитання не може бути порожнім.');
    }

    // 1. Знаходимо активний ШІ-гаманець користувача або компанії
    const isApiClient = !options.userId || options.userId.startsWith('apikey:');
    const budget = await this.prisma.userAiBudget.findFirst({
      where: {
        companyId: activeCompanyId,
        ...(!isApiClient && options.userId ? { userId: options.userId } : {}),
        ...(options.projectId ? { projectId: options.projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!budget) {
      throw new NotFoundException(
        'ШІ-бюджет для цього робочого простору ще не налаштовано. Створіть ліміт у розділі UserAiBudget.',
      );
    }

    const costMinor = DEFAULT_QUERY_COST_MINOR;
    const charged = await this.prisma.userAiBudget.updateMany({
      where: {
        id: budget.id,
        currentUsageMinor: { lte: budget.monthlyLimitMinor - costMinor },
      },
      data: {
        currentUsageMinor: { increment: costMinor },
      },
    });

    if (charged.count !== 1) {
      throw new ForbiddenException(
        'Місячний ліміт ШІ-бюджету вичерпано. Збільште monthlyLimitMinor у розділі UserAiBudget.',
      );
    }

    const remainingBudgetMinor = Math.max(
      0,
      budget.monthlyLimitMinor - (budget.currentUsageMinor + costMinor),
    );

    // 2. Вибірка релевантних документів із бази знань та каталогу товарів компанії (RLS ізоляція)
    const [docs, products] = await Promise.all([
      this.prisma.agentKnowledgeBase.findMany({
        where: {
          companyId: activeCompanyId,
          ...(options.projectId ? { projectId: options.projectId } : {}),
        },
        take: 40,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.findMany({
        where: { companyId: activeCompanyId, isActive: true },
        select: { id: true, name: true, description: true, priceMinor: true },
        take: 30,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const tokens = tokenizeQuery(cleanQuestion);

    const rankedDocs = docs
      .map((doc) => ({
        score: scoreTextMatch(`${doc.title} ${doc.content}`, tokens),
        source: {
          id: doc.id,
          title: doc.title,
          type: 'KNOWLEDGE_DOC' as const,
          snippet: doc.content.slice(0, 320),
        },
      }))
      .sort((a, b) => b.score - a.score);

    const rankedProducts = products
      .map((prod) => {
        const priceFormatted = `$${(prod.priceMinor / 100).toFixed(2)}`;
        const text = `${prod.name} (${priceFormatted})${prod.description ? `: ${prod.description}` : ''}`;
        return {
          score: scoreTextMatch(text, tokens),
          source: {
            id: prod.id,
            title: prod.name,
            type: 'PRODUCT' as const,
            snippet: text.slice(0, 320),
          },
        };
      })
      .sort((a, b) => b.score - a.score);

    const topSources: KnowledgeSourceRef[] = [
      ...rankedDocs.filter((d) => d.score > 0).slice(0, 3).map((d) => d.source),
      ...rankedProducts.filter((p) => p.score > 0).slice(0, 2).map((p) => p.source),
    ];

    if (topSources.length === 0) {
      topSources.push(...rankedDocs.slice(0, 2).map((d) => d.source));
    }

    // 3. Якщо задано OPENAI_API_KEY — генеруємо відповідь через LLM, інакше локальний RAG-синтез
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (openAiKey) {
      const contextBlock =
        topSources.length > 0
          ? topSources.map((s, idx) => `[${idx + 1}] ${s.title}: ${s.snippet}`).join('\n')
          : 'База знань компанії поки не містить документів.';

      try {
        const response = await fetch('https://openai.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
              {
                role: 'system',
                content:
                  'Ти корпоративний AI-асистент компанії в платформі NextOps. Відповідай стисло, точно й українською мовою, спираючись виключно на наданий контекст бази знань та каталогу товарів.',
              },
              {
                role: 'user',
                content: `Контекст компанії:\n${contextBlock}\n\nЗапитання: ${cleanQuestion}`,
              },
            ],
          }),
          signal: AbortSignal.timeout(15_000),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const generated = data.choices?.[0]?.message?.content?.trim();
          if (generated) {
            return {
              answer: generated,
              provider: 'openai',
              chargedMinor: costMinor,
              remainingBudgetMinor,
              sources: topSources,
            };
          }
        }
      } catch {
        // Fallback to deterministic local RAG synthesis if external LLM request times out
      }
    }

    const fallbackAnswer =
      topSources.length > 0
        ? `Знайдено релевантну інформацію в базі знань компанії (${topSources.length} дж.):\n\n` +
          topSources.map((s, i) => `${i + 1}. **${s.title}** — ${s.snippet}`).join('\n')
        : 'У базі знань компанії поки немає документів за вашим запитом. Додайте інструкції або прайси у розділі AgentKnowledgeBase.';

    return {
      answer: fallbackAnswer,
      provider: 'local-rag',
      chargedMinor: costMinor,
      remainingBudgetMinor,
      sources: topSources,
    };
  }

  async create(dto: CreateAgentKnowledgeBaseDto, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) throw new ForbiddenException('A business workspace is required.');
    return this.prisma.agentKnowledgeBase.create({ data: { ...dto, companyId: activeCompanyId } });
  }

    async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const where = activeCompanyId ? { companyId: activeCompanyId } : {};

    return paginate(
      query,
      (skip, take) => this.prisma.agentKnowledgeBase.findMany({ where, skip, take }),
      () => this.prisma.agentKnowledgeBase.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    const item = await this.prisma.agentKnowledgeBase.findFirst({
      where: activeCompanyId ? { id, companyId: activeCompanyId } : { id },
    });
    if (!item) throw new NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
    return item;
  }

  async update(
    id: string,
    dto: UpdateAgentKnowledgeBaseDto,
    companyId?: string,
  ): Promise<AgentKnowledgeBase> {
    await this.findOne(id, companyId);
    return this.prisma.agentKnowledgeBase.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    await this.findOne(id, companyId);
    return this.prisma.agentKnowledgeBase.delete({ where: { id } });
  }
}
