import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AgentKnowledgeBase } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { CreateAgentKnowledgeBaseDto } from './dto/create-agentknowledgebase.dto';
import { UpdateAgentKnowledgeBaseDto } from './dto/update-agentknowledgebase.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { paginate, type PaginatedResponse } from '../common/pagination/paginate';

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

const DEFAULT_QUERY_COST_MINOR = 5;

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
  ) { }

  private resolveCompanyId(companyId?: string): string {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }
    if (!this.tenantContext.getCompanyId()) {
      this.tenantContext.setCompanyId(activeCompanyId);
    }
    return activeCompanyId;
  }

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
      userRole?: string;
      projectId?: string;
    },
  ): Promise<AskAssistantResponse> {
    const activeCompanyId = this.resolveCompanyId(options.companyId);

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      throw new BadRequestException('Запитання не може бути порожнім.');
    }

    const isApiClient =
      options.userRole === 'API_CLIENT'
      || !options.userId
      || options.userId.startsWith('apikey:');

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

    const tokens = tokenizeQuery(cleanQuestion);
    const searchTokens = tokens.slice(0, 8);

    const [matchedDocs, matchedProducts] = await Promise.all([
      this.prisma.agentKnowledgeBase.findMany({
        where: {
          companyId: activeCompanyId,
          ...(options.projectId ? { projectId: options.projectId } : {}),
          ...(searchTokens.length > 0
            ? {
              OR: searchTokens.flatMap((token) => [
                { title: { contains: token, mode: 'insensitive' as const } },
                { content: { contains: token, mode: 'insensitive' as const } },
              ]),
            }
            : {}),
        },
        take: 40,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.findMany({
        where: {
          companyId: activeCompanyId,
          isActive: true,
          ...(searchTokens.length > 0
            ? {
              OR: searchTokens.flatMap((token) => [
                { name: { contains: token, mode: 'insensitive' as const } },
                { description: { contains: token, mode: 'insensitive' as const } },
              ]),
            }
            : {}),
        },
        select: { id: true, name: true, description: true, priceMinor: true },
        take: 30,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const rankedDocs = matchedDocs
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

    const rankedProducts = matchedProducts
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
      const fallbackDocs =
        matchedDocs.length > 0
          ? matchedDocs
          : await this.prisma.agentKnowledgeBase.findMany({
            where: {
              companyId: activeCompanyId,
              ...(options.projectId ? { projectId: options.projectId } : {}),
            },
            take: 2,
            orderBy: { updatedAt: 'desc' },
          });

      topSources.push(
        ...fallbackDocs.slice(0, 2).map((doc) => ({
          id: doc.id,
          title: doc.title,
          type: 'KNOWLEDGE_DOC' as const,
          snippet: doc.content.slice(0, 320),
        })),
      );
    }

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
                  'Ти корпоративний AI-асистент компанії в платформі NextOps. Відповідай стисло, точно й мовою запиту користувача, спираючись виключно на наданий контекст бази знань та каталогу товарів.',
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
          const firstChoice = Array.isArray(data.choices) ? data.choices[0] : undefined;
          const generated = firstChoice?.message?.content?.trim();
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
    const activeCompanyId = this.resolveCompanyId(companyId);
    return this.prisma.agentKnowledgeBase.create({
      data: { ...dto, companyId: activeCompanyId },
    });
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = { companyId: activeCompanyId };

    return paginate(
      query,
      (skip, take) => this.prisma.agentKnowledgeBase.findMany({ where, skip, take }),
      () => this.prisma.agentKnowledgeBase.count({ where }),
    );
  }

  async findOne(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const item = await this.prisma.agentKnowledgeBase.findFirst({
      where: { id, companyId: activeCompanyId },
    });
    if (!item) {
      throw new NotFoundException(`Документ бази знань з ID ${id} не знайдено`);
    }
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
