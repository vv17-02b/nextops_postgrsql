import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { UserAiBudgetService } from './useraibudget.service';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import type { UserAiBudget } from '@prisma/client';

@Controller('useraibudget')
export class UserAiBudgetController {
  constructor(
    @Inject(UserAiBudgetService)
    private readonly service: UserAiBudgetService
  ) {}

  @Post()
  create(@Body() dto: CreateUserAiBudgetDto): Promise<UserAiBudget> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<UserAiBudget[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserAiBudget> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserAiBudgetDto): Promise<UserAiBudget> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<UserAiBudget> { 
    return this.service.remove(id); 
  }
}
