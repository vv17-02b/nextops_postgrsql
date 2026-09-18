import { Injectable, NotFoundException, Inject } from '@nestjs/common'; // <-- Додано Inject
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Prisma } from '@prisma/client';
import type { Order } from '@prisma/client';

@Injectable()
export class OrderService {
  // Примусове впровадження через @Inject, щоб прибрати undefined на this.prisma
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.prisma.order.create({
      data: {
        userId: dto.userId,
        totalAmount: dto.totalAmount,
        currency: dto.currency || 'UAH',
        shippingAddress: dto.shippingAddress ? (dto.shippingAddress as unknown as Prisma.InputJsonValue) : {},
        status: dto.status || 'PENDING',
        paymentStatus: dto.status === 'PAID' ? 'PAID' : 'UNPAID',
        paymentMethod: 'CARD',
        items: dto.items ? {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        } : undefined,
      },
      include: {
        items: true,
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: { items: true },
    });
  }

  async findOne(id: string): Promise<Order> {
    const item = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!item) throw new NotFoundException(`Документ не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    await this.findOne(id);
    
    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;
    if (dto.shippingAddress) {
      updateData.shippingAddress = dto.shippingAddress as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async remove(id: string): Promise<Order> {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async updatePaymentStatus(id: string, paymentId: string,
     rawResponse: Prisma.InputJsonValue): Promise<Order> {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        paymentId,
        paymentRawResponse: rawResponse,
      },
    });
  }
}
