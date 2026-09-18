import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data: dto });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: { category: true } // Автоматично підтягуємо повні дані про категорію
    });
  }

  async findOne(id: string): Promise<Product> {
    const item = await this.prisma.product.findUnique({ 
      where: { id },
      include: { category: true }
    });
    if (!item) throw new NotFoundException(`Товар з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
