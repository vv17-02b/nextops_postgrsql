import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OrderItemService } from './orderitem.service';
import { CreateOrderItemDto } from './dto/create-orderitem.dto';
import { UpdateOrderItemDto } from './dto/update-orderitem.dto';
import type { OrderItem } from '@prisma/client';

@Controller('orderitem')
export class OrderItemController {
  constructor(private readonly service: OrderItemService) {}

  @Post()
  create(@Body() dto: CreateOrderItemDto): Promise<OrderItem> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<OrderItem[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OrderItem> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderItemDto): Promise<OrderItem> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<OrderItem> { 
    return this.service.remove(id); 
  }
}
