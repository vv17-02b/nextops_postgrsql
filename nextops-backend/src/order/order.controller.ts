import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common'; // <-- Додано Inject
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Prisma } from '@prisma/client';
import type { Order } from '@prisma/client';

@Controller('order')
export class OrderController {
  // Примусове впровадження через декоратор @Inject
  constructor(
    @Inject(OrderService)
    private readonly service: OrderService
  ) {}

  @Post()
  create(@Body() dto: CreateOrderDto): Promise<Order> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<Order[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto): Promise<Order> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Order> { 
    return this.service.remove(id); 
  }

  @Patch(':id/pay')
  pay(
    @Param('id') id: string,
    @Body() body: { paymentId: string; rawResponse: Prisma.JsonObject },
  ): Promise<Order> {
    return this.service.updatePaymentStatus(id, body.paymentId, body.rawResponse);
  }
}
