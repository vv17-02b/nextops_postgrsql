import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { Category } from '@prisma/client';

@Controller('category')
export class CategoryController {
  constructor(
    @Inject(CategoryService)
    private readonly service: CategoryService
  ) {}

  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<Category> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<Category[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Category> { 
    return this.service.remove(id); 
  }
}
