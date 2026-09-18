import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    @Inject(WarehouseService)
    private readonly service: WarehouseService
  ) {}

  @Post()
  create(@Body() dto: CreateWarehouseDto): Promise<Warehouse> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<Warehouse[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Warehouse> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto): Promise<Warehouse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Warehouse> { 
    return this.service.remove(id); 
  }
}
