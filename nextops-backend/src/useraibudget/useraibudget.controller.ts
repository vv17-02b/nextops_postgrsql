import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserAiBudgetService } from './useraibudget.service';
import type { UserAiBudgetExtended } from './useraibudget.service';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import type { UserAiBudget } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('useraibudget')
@Roles('OWNER', 'ADMIN')
export class UserAiBudgetController {
  constructor(
    @Inject(UserAiBudgetService)
    private readonly service: UserAiBudgetService,
  ) {}

  @Post()
  create(@Body() dto: CreateUserAiBudgetDto, @Req() req: RequestWithUser): Promise<UserAiBudget> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<UserAiBudgetExtended>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<UserAiBudgetExtended> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserAiBudgetDto,
    @Req() req: RequestWithUser,
  ): Promise<UserAiBudget> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<UserAiBudget> {
    return this.service.remove(id, req.user?.companyId);
  }
}
