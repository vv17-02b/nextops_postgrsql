import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import type { Review } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    return this.prisma.review.create({ data: dto });
  }

  async findAll(): Promise<Review[]> {
    return this.prisma.review.findMany();
  }

  async findOne(id: string): Promise<Review> {
    const item = await this.prisma.review.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Відгук з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateReviewDto): Promise<Review> {
    await this.findOne(id);
    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Review> {
    await this.findOne(id);
    return this.prisma.review.delete({ where: { id } });
  }
}
