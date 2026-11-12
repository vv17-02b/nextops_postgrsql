import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';

export interface WorkspaceBillingSnapshot {
  companyId: string;
  companyName: string;
  planCode: string;
  planName: string;
  priceMinor: number;
  currency: string;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  maxUsers: number;
  usedSeats: number;
  maxProducts: number;
  usedProducts: number;
}

@Injectable()
export class PlanEnforcementService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
  ) {}

  async getBillingSnapshot(companyId?: string): Promise<WorkspaceBillingSnapshot> {
    const activeCompanyId = companyId ?? this.tenantContext.getCompanyId();
    if (!activeCompanyId) {
      throw new ForbiddenException('A business workspace is required.');
    }

    const company = await this.prisma.runSystemQuery(() =>
      this.prisma.company.findUnique({
        where: { id: activeCompanyId },
        include: { plan: true },
      }),
    );

    if (!company) {
      throw new ForbiddenException('Workspace not found.');
    }

    const { usersCount, pendingInvitesCount, productsCount } = await this.prisma.$transaction(
      async (tx) => {
        const users = await tx.user.count({ where: { companyId: activeCompanyId } });
        const pendingInvites = await tx.invitation.count({
          where: {
            companyId: activeCompanyId,
            acceptedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        const products = await tx.product.count({ where: { companyId: activeCompanyId } });
        return {
          usersCount: users,
          pendingInvitesCount: pendingInvites,
          productsCount: products,
        };
      },
    );

    return {
      companyId: company.id,
      companyName: company.name,
      planCode: company.plan.code,
      planName: company.plan.name,
      priceMinor: company.plan.priceMinor,
      currency: company.plan.currency,
      subscriptionStatus: company.subscriptionStatus,
      currentPeriodEnd: company.currentPeriodEnd,
      maxUsers: company.plan.maxUsers,
      usedSeats: usersCount + pendingInvitesCount,
      maxProducts: company.plan.maxProducts,
      usedProducts: productsCount,
    };
  }

  async assertActiveSubscription(companyId?: string): Promise<void> {
    const snapshot = await this.getBillingSnapshot(companyId);

    if (snapshot.subscriptionStatus === 'CANCELED') {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'SUBSCRIPTION_CANCELED',
          message: 'Workspace subscription is canceled. Renew your plan to create or modify records.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (
      snapshot.subscriptionStatus === 'PAST_DUE' &&
      snapshot.currentPeriodEnd &&
      snapshot.currentPeriodEnd.getTime() < Date.now()
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'SUBSCRIPTION_PAST_DUE',
          message: 'Workspace subscription payment is past due. Please update your billing method.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async assertUserSeatLimit(companyId?: string): Promise<void> {
    const snapshot = await this.getBillingSnapshot(companyId);

    if (snapshot.subscriptionStatus === 'CANCELED') {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'SUBSCRIPTION_CANCELED',
          message: 'Workspace subscription is canceled. Renew your plan to invite team members.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (snapshot.usedSeats >= snapshot.maxUsers) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'PLAN_SEAT_LIMIT_REACHED',
          message: `Your ${snapshot.planName} plan allows up to ${snapshot.maxUsers} team members (${snapshot.usedSeats}/${snapshot.maxUsers} seats used). Upgrade your plan to invite more users.`,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async assertProductLimit(companyId?: string): Promise<void> {
    const snapshot = await this.getBillingSnapshot(companyId);

    if (snapshot.subscriptionStatus === 'CANCELED') {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'SUBSCRIPTION_CANCELED',
          message: 'Workspace subscription is canceled. Renew your plan to add products.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (snapshot.usedProducts >= snapshot.maxProducts) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          errorCode: 'PLAN_PRODUCT_LIMIT_REACHED',
          message: `Your ${snapshot.planName} plan allows up to ${snapshot.maxProducts} products (${snapshot.usedProducts}/${snapshot.maxProducts} used). Upgrade your plan to add more products.`,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }
}
