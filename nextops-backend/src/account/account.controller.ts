import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import type { Account } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('account')
export class AccountController {
  constructor(
    @Inject(AccountService)
    private readonly accountService: AccountService
  ) {}

  @Post()
  create(@Body() dto: CreateAccountDto): Promise<Account> { 
    return this.accountService.create(dto); 
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<Account>> {
    return this.accountService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Account> { 
    return this.accountService.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto): Promise<Account> {
    return this.accountService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Account> { 
    return this.accountService.remove(id); 
  }
}
