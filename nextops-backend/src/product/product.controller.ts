import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Product } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('product')
// Тимчасово вимкнено для локального наповнення бази даних PostgreSQL
// @UseGuards(JwtAuthGuard) 
export class ProductController {
  constructor(
    @Inject(ProductService)
    private readonly service: ProductService,
  ) {
    // Жорстка прив'язка контексту цього модуля для Zero-Any Production Standard
    this.create = this.create.bind(this);
    this.findAll = this.findAll.bind(this);
    this.findOne = this.findOne.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<Product> { 
    return this.service.create(dto); 
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<Product>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> { 
    return this.service.remove(id); 
  }
}
