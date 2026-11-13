import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req, Header } from '@nestjs/common';
import type { Request } from 'express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import type { Product } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('product')
export class ProductController {
  constructor(
    @Inject(ProductService)
    private readonly service: ProductService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: RequestWithUser): Promise<Product> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Post('import/csv')
  async importCsv(
    @Body() dto: ImportProductsDto,
    @Req() req: RequestWithUser,
  ): Promise<{ imported: number }> {
    return this.service.bulkImport(dto.items, req.user?.companyId);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="nextops-products.csv"')
  async exportCsv(@Req() req: RequestWithUser): Promise<string> {
    return this.service.exportCsv(req.user?.companyId);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<Product>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Product> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: RequestWithUser,
  ): Promise<Product> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<Product> {
    return this.service.remove(id, req.user?.companyId);
  }
}
