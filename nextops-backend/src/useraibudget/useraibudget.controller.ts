import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { UserAiBudgetService } from './useraibudget.service';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import type { UserAiBudget } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { Roles } from '../auth/roles.decorator';

@Controller('useraibudget')
@Roles('OWNER', 'ADMIN')
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
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<UserAiBudget>> {
    return this.service.findAll(query);
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
