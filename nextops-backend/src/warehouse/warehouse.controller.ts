import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    @Inject(WarehouseService)
    private readonly service: WarehouseService,
  ) {
    // Фіксуємо контекст, щоб уникнути падінь 500 на базі або сервісі
    this.create = this.create.bind(this);
    this.findAll = this.findAll.bind(this);
    this.findOne = this.findOne.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  @Post()
  async create(@Body() dto: CreateWarehouseDto): Promise<Warehouse> { 
    return this.service.create(dto); 
  }

  @Get()
  async findAll(): Promise<Warehouse[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Warehouse> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateWarehouseDto,
  ): Promise<Warehouse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Warehouse> { 
    return this.service.remove(id); 
  }
}
