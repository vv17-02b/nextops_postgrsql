import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import type { SafeUser } from './user.service';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('user')
@Roles('OWNER', 'ADMIN')
export class UserController {
  constructor(
    @Inject(UserService)
    private readonly service: UserService,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<SafeUser> {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<SafeUser>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<SafeUser> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<SafeUser> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<SafeUser> {
    return this.service.remove(id, req.user?.companyId);
  }
}
