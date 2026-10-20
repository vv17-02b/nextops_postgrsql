import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import type { OrderItem } from '@prisma/client';

@Injectable()
export class OrderItemService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateOrderItemDto): Promise<OrderItem> {
    return this.prisma.orderItem.create({
      data: {
        orderId: dto.orderId,
        productId: dto.productId,
        quantity: dto.quantity,
        price: dto.price,
      },
    });
  }

  async findAll(): Promise<OrderItem[]> {
    if (!this.prisma || !this.prisma.orderItem) {
      throw new Error('Критична помилка: PrismaService або колекція orderItem не ініціалізовані.');
    }
    return this.prisma.orderItem.findMany();
  }

  async findOne(id: string): Promise<OrderItem> {
    const item = await this.prisma.orderItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Елемент замовлення не знайдено');
    }
    return item;
  }

  async update(id: string, dto: UpdateOrderItemDto): Promise<OrderItem> {
    await this.findOne(id);
    return this.prisma.orderItem.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string): Promise<OrderItem> {
    await this.findOne(id);
    return this.prisma.orderItem.delete({ where: { id } });
  }
}
