import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import { OrderService } from '../order/order.service';
import {
  AgentKnowledgeBaseService,
  type AskAssistantResponse,
} from '../agentknowledgebase/agentknowledgebase.service';
import type { ShippingAddressDto } from '../order/dto/create-order.dto';

export interface StorefrontProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  images: string[];
  availableStock: number;
}

export interface StorefrontOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateStorefrontOrderInput {
  customerUserId?: string;
  currency?: string;
  items: StorefrontOrderItemInput[];
  shippingAddress?: ShippingAddressDto;
}

export interface CreateStorefrontReviewInput {
  productId: string;
  customerUserId?: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class StorefrontService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(OrderService)
    private readonly orderService: OrderService,
    @Inject(AgentKnowledgeBaseService)
    private readonly knowledgeBaseService: AgentKnowledgeBaseService,
  ) {}
  private resolveCompanyId(companyId?: string): string {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('Workspace context is missing.');
    }
    return activeCompanyId;
  }

  private async resolveCustomerUserId(
    companyId: string,
    explicitUserId?: string,
  ): Promise<string> {
    const trimmed = explicitUserId?.trim();
    if (trimmed) {
      return trimmed;
    }

    const fallbackUser = await this.prisma.user.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!fallbackUser) {
      throw new BadRequestException(
        'У компанії не знайдено користувача для прив’язки клієнтської дії.',
      );
    }

    return fallbackUser.id;
  }

  async listCatalog(companyId?: string): Promise<{ products: StorefrontProductDto[] }> {
    const activeCompanyId = this.resolveCompanyId(companyId);

    const products = await this.prisma.product.findMany({
      where: { companyId: activeCompanyId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceMinor: true,
        compareAtPriceMinor: true,
        images: true,
        inventory: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceMinor: p.priceMinor,
        compareAtPriceMinor: p.compareAtPriceMinor,
        images: p.images,
        availableStock: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      })),
    };
  }

  async createOrder(input: CreateStorefrontOrderInput, companyId?: string) {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const resolvedUserId = await this.resolveCustomerUserId(
      activeCompanyId,
      input.customerUserId,
    );

    const resolvedAddress: ShippingAddressDto = input.shippingAddress ?? {
      country: 'UA',
      city: 'Online Storefront',
      street: 'API Checkout',
      zipCode: '00000',
    };

    return this.orderService.create(
      {
        currency: input.currency ?? 'USD',
        items: input.items,
        shippingAddress: resolvedAddress,
      },
      resolvedUserId,
      activeCompanyId,
    );
  }

  async createReview(input: CreateStorefrontReviewInput, companyId?: string) {
    const activeCompanyId = this.resolveCompanyId(companyId);
    const resolvedUserId = await this.resolveCustomerUserId(
      activeCompanyId,
      input.customerUserId,
    );

    return this.prisma.review.upsert({
      where: {
        userId_productId: {
          userId: resolvedUserId,
          productId: input.productId,
        },
      },
      create: {
        companyId: activeCompanyId,
        userId: resolvedUserId,
        productId: input.productId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      update: {
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });
  }

  async askAssistant(
    question: string,
    projectId?: string,
    companyId?: string,
  ): Promise<AskAssistantResponse> {
    const activeCompanyId = this.resolveCompanyId(companyId);
    return this.knowledgeBaseService.askAssistant(question, {
      companyId: activeCompanyId,
      projectId,
    });
  }
}
