import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import type { Review } from '@prisma/client';

@Controller('review')
export class ReviewController {
  constructor(
    @Inject(ReviewService)
    private readonly service: ReviewService
  ) {}

  @Post()
  create(@Body() dto: CreateReviewDto): Promise<Review> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<Review[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Review> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto): Promise<Review> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Review> { 
    return this.service.remove(id); 
  }
}
