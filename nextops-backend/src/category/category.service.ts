import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { Category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: dto });
  }

  // 🌟 Спрощено: прибираємо include для стабільного першого запуску NoSQL
  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  // 🌟 Спрощено: шукаємо документ суто за його унікальним ID
  async findOne(id: string): Promise<Category> {
    const item = await this.prisma.category.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Категорію з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
