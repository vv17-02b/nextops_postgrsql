import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
  provider: 'openai' | 'local-rag' | 'cache';
  chargedMinor: number;
  remainingBudgetMinor: number;
  sources: KnowledgeSourceRef[];
}

interface CachedAnswerEntry {
  answer: string;
  sources: KnowledgeSourceRef[];
  expiresAt: number;
}

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

const DEFAULT_QUERY_COST_MINOR = 5;
const DEFAULT_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_OUTPUT_TOKENS = 450;
const MAX_SNIPPET_LENGTH = 600;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const COMMON_SEARCH_STOPWORDS = new Set([
  'nextops',
  'товар',
  'товари',
  'товару',
  'документ',
  'документи',
  'який',
  'яка',
  'яке',
  'які',
  'також',
  'будь',
  'ласка',
  'чи',
  'або',
  'для',
  'при',
  'про',
  'від',
  'по',
  'на',
  'в',
  'у',
  'з',
  'і',
  'та',
]);

function normalizeSearchToken(token: string): string {
  if (token.length <= 4) {
    return token;
  }
  return token.replace(
    /(ями|ого|ому|ами|іми|них|вих|их|іх|ої|ій|єї|ах|ях|у|ю|і|ї|и|а|я|о|е)$/u,
    '',
  );
}

function tokenizeQuery(text: string): string[] {
  const rawTokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const expanded = new Set<string>();
  for (const token of rawTokens) {
    expanded.add(token);
    const stem = normalizeSearchToken(token);
    if (stem.length >= 3) {
      expanded.add(stem);
    }
  }

  return [...expanded].slice(0, 10);
}

function scoreTextMatch(haystack: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const lower = haystack.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (COMMON_SEARCH_STOPWORDS.has(token)) {
      continue;
    }
    if (lower.includes(token)) {
      score += token.length >= 6 ? 2 : 1;
    }
  }

  return score;
}

function resolveChatCompletionsUrl(): string {
  return process.env.OPENAI_API_URL?.trim() || DEFAULT_CHAT_COMPLETIONS_URL;
}

@Injectable()
export class AgentKnowledgeBaseService {
  private readonly logger = new Logger(AgentKnowledgeBaseService.name);
  private readonly answerCache = new Map<string, CachedAnswerEntry>();

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

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

  private async verifyProjectOwnership(projectId: string, companyId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) {
      throw new ForbiddenException(
        'Вказаний projectId не знайдено або він не належить вашому робочому простору.',
      );
    }
  }

  private buildCacheKey(companyId: string, projectId: string | undefined, question: string): string {
    const normalized = question.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${companyId}:${projectId ?? 'all'}:${normalized}`;
  }

  private getCachedAnswer(key: string): CachedAnswerEntry | null {
    const entry = this.answerCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.answerCache.delete(key);
      return null;
    }
    return entry;
  }

  private setCachedAnswer(key: string, answer: string, sources: KnowledgeSourceRef[]): void {
    if (this.answerCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.answerCache.keys().next().value;
      if (oldestKey) {
        this.answerCache.delete(oldestKey);
      }
    }
    this.answerCache.set(key, {
      answer,
      sources,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  private invalidateCompanyCache(companyId: string): void {
    const prefix = `${companyId}:`;
    for (const key of this.answerCache.keys()) {
      if (key.startsWith(prefix)) {
        this.answerCache.delete(key);
      }
    }
  }

  private selectModelByComplexity(question: string, sourcesCount: number): string {
    const configuredModel = process.env.OPENAI_MODEL?.trim();
    if (configuredModel) {
      return configuredModel;
    }
    const isComplex = question.length > 350 || sourcesCount >= 4;
    return isComplex ? 'gpt-4o' : 'gpt-4o-mini';
  }

  private async refundBudget(budgetId: string, amountMinor: number): Promise<void> {
    if (amountMinor <= 0) return;
    await this.prisma.userAiBudget.updateMany({
      where: {
        id: budgetId,
        currentUsageMinor: { gte: amountMinor },
      },
      data: {
        currentUsageMinor: { decrement: amountMinor },
      },
    });
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

    if (options.projectId) {
      await this.verifyProjectOwnership(options.projectId, activeCompanyId);
    }

    const isApiClient =
      options.userRole === 'API_CLIENT' ||
      !options.userId ||
      options.userId.startsWith('apikey:');

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

    const cacheKey = this.buildCacheKey(activeCompanyId, options.projectId, cleanQuestion);
    const cached = this.getCachedAnswer(cacheKey);
    if (cached) {
      return {
        answer: cached.answer,
        provider: 'cache',
        chargedMinor: 0,
        remainingBudgetMinor: Math.max(0, budget.monthlyLimitMinor - budget.currentUsageMinor),
        sources: cached.sources,
      };
    }

    const tokens = tokenizeQuery(cleanQuestion);
    const searchTokens = tokens.slice(0, 8);

    if (searchTokens.length === 0) {
      return {
        answer:
          'Будь ласка, уточніть запитання детальніше (використовуйте ключові слова довжиною від 3 символів).',
        provider: 'local-rag',
        chargedMinor: 0,
        remainingBudgetMinor: Math.max(0, budget.monthlyLimitMinor - budget.currentUsageMinor),
        sources: [],
      };
    }

    const [matchedDocs, matchedProducts] = await Promise.all([
      this.prisma.agentKnowledgeBase.findMany({
        where: {
          companyId: activeCompanyId,
          ...(options.projectId ? { projectId: options.projectId } : {}),
          OR: searchTokens.flatMap((token) => [
            { title: { contains: token, mode: 'insensitive' as const } },
            { content: { contains: token, mode: 'insensitive' as const } },
          ]),
        },
        take: 40,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.findMany({
        where: {
          companyId: activeCompanyId,
          isActive: true,
          OR: searchTokens.flatMap((token) => [
            { name: { contains: token, mode: 'insensitive' as const } },
            { description: { contains: token, mode: 'insensitive' as const } },
          ]),
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
          snippet: doc.content.slice(0, MAX_SNIPPET_LENGTH),
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
            snippet: text.slice(0, MAX_SNIPPET_LENGTH),
          },
        };
      })
      .sort((a, b) => b.score - a.score);

    const bestDocScore = rankedDocs.length > 0 ? (rankedDocs[0]?.score ?? 0) : 0;
    const minDocScore = bestDocScore > 0 ? Math.max(2, Math.ceil(bestDocScore * 0.5)) : 0;

    const bestProductScore = rankedProducts.length > 0 ? (rankedProducts[0]?.score ?? 0) : 0;
    const minProductScore =
      bestProductScore > 0 ? Math.max(2, Math.ceil(bestProductScore * 0.5)) : 0;

    const topSources: KnowledgeSourceRef[] = [
      ...rankedDocs
        .filter((d) => d.score >= minDocScore && d.score > 0)
        .slice(0, 2)
        .map((d) => d.source),
      ...rankedProducts
        .filter((p) => p.score >= minProductScore && p.score > 0)
        .slice(0, 2)
        .map((p) => p.source),
    ];

    if (topSources.length === 0) {
      return {
        answer:
          'У базі знань компанії поки немає релевантних документів або товарів за вашим запитом. Додайте інструкції або прайси у розділі AgentKnowledgeBase.',
        provider: 'local-rag',
        chargedMinor: 0,
        remainingBudgetMinor: Math.max(0, budget.monthlyLimitMinor - budget.currentUsageMinor),
        sources: [],
      };
    }

    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey) {
      this.logger.warn('OPENAI_API_KEY is not set; falling back to local-rag');
      const fallbackAnswer =
        `Знайдено релевантну інформацію в базі знань компанії (${topSources.length} дж.):\n\n` +
        topSources.map((s, i) => `${i + 1}. **${s.title}** — ${s.snippet}`).join('\n');

      return {
        answer: fallbackAnswer,
        provider: 'local-rag',
        chargedMinor: 0,
        remainingBudgetMinor: Math.max(0, budget.monthlyLimitMinor - budget.currentUsageMinor),
        sources: topSources,
      };
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

    const contextBlock = topSources
      .map((s, idx) => `[${idx + 1}] ${s.title}: ${s.snippet}`)
      .join('\n');
    const completionsUrl = resolveChatCompletionsUrl();
    const model = this.selectModelByComplexity(cleanQuestion, topSources.length);

    try {
      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: MAX_OUTPUT_TOKENS,
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
        const data = (await response.json()) as ChatCompletionResponse;
        const firstChoice = Array.isArray(data.choices) ? data.choices[0] : undefined;
        const generated = firstChoice?.message?.content?.trim();
        if (generated) {
          this.setCachedAnswer(cacheKey, generated, topSources);

          const updatedBudget = await this.prisma.userAiBudget.findUnique({
            where: { id: budget.id },
            select: { monthlyLimitMinor: true, currentUsageMinor: true },
          });
          const remainingBudgetMinor = updatedBudget
            ? Math.max(0, updatedBudget.monthlyLimitMinor - updatedBudget.currentUsageMinor)
            : Math.max(0, budget.monthlyLimitMinor - (budget.currentUsageMinor + costMinor));

          return {
            answer: generated,
            provider: 'openai',
            chargedMinor: costMinor,
            remainingBudgetMinor,
            sources: topSources,
          };
        }
      } else {
        const errorText = await response.text().catch(() => '');
        this.logger.warn(
          `LLM API responded with ${response.status} (${completionsUrl}): ${errorText.slice(0, 300)}`,
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`LLM request failed (${completionsUrl}): ${errorMessage}`);
    }

    await this.refundBudget(budget.id, costMinor);

    const fallbackAnswer =
      `Знайдено релевантну інформацію в базі знань компанії (${topSources.length} дж.):\n\n` +
      topSources.map((s, i) => `${i + 1}. **${s.title}** — ${s.snippet}`).join('\n');

    return {
      answer: fallbackAnswer,
      provider: 'local-rag',
      chargedMinor: 0,
      remainingBudgetMinor: Math.max(0, budget.monthlyLimitMinor - budget.currentUsageMinor),
      sources: topSources,
    };
  }

  async create(dto: CreateAgentKnowledgeBaseDto, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    await this.verifyProjectOwnership(dto.projectId, activeCompanyId);

    const created = await this.prisma.agentKnowledgeBase.create({
      data: { ...dto, companyId: activeCompanyId },
    });
    this.invalidateCompanyCache(activeCompanyId);
    return created;
  }

  async findAll(
    query: PaginationQueryDto,
    companyId?: string,
    projectId?: string,
  ): Promise<PaginatedResponse<AgentKnowledgeBase>> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const where = {
      companyId: activeCompanyId,
      ...(projectId ? { projectId } : {}),
    };

    return paginate(
      query,
      (skip, take) =>
        this.prisma.agentKnowledgeBase.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: 'desc' },
        }),
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
    const activeCompanyId = this.resolveCompanyId(companyId);
    await this.findOne(id, activeCompanyId);

    if (dto.projectId) {
      await this.verifyProjectOwnership(dto.projectId, activeCompanyId);
    }

    const updated = await this.prisma.agentKnowledgeBase.update({
      where: { id },
      data: dto,
    });
    this.invalidateCompanyCache(activeCompanyId);
    return updated;
  }

  async remove(id: string, companyId?: string): Promise<AgentKnowledgeBase> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    await this.findOne(id, activeCompanyId);

    const deleted = await this.prisma.agentKnowledgeBase.delete({ where: { id } });
    this.invalidateCompanyCache(activeCompanyId);
    return deleted;
  }
}