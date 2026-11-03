import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import type { SafeUser } from './user.service';
import { Roles } from '../auth/roles.decorator';

@Controller('user')
@Roles('OWNER', 'ADMIN')
export class UserController {
  constructor(
    @Inject(UserService)
    private readonly service: UserService
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<SafeUser> {
    return this.service.create(dto); 
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<SafeUser>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SafeUser> {
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<SafeUser> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<SafeUser> {
    return this.service.remove(id); 
  }
}
