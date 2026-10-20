import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { OrderItemService } from './orderitem.service';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import type { OrderItem } from '@prisma/client';

@Controller('orderitem')
export class OrderItemController {
  // Використовуємо явний декоратор @Inject, щоб NestJS міг знайти сервіс,
  // навіть якщо Super-Script Engine зареєстрував його через кастомний токен
  constructor(
    @Inject(OrderItemService)
    private readonly service: OrderItemService,
  ) {
    this.create = this.create.bind(this);
    this.findAll = this.findAll.bind(this);
    this.findOne = this.findOne.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  @Post()
  async create(@Body() dto: CreateOrderItemDto): Promise<OrderItem> { 
    return this.service.create(dto); 
  }

  @Get()
  async findAll(): Promise<OrderItem[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderItem> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<OrderItem> { 
    return this.service.remove(id); 
  }
}
