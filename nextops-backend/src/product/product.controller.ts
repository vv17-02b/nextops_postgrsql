import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Product } from '@prisma/client';

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    @Inject(ProductService)
    private readonly service: ProductService
  ) {}

  @Post()
  create(@Body() dto: CreateProductDto): Promise<Product> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<Product[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<Product> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Product> { 
    return this.service.remove(id); 
  }
}
