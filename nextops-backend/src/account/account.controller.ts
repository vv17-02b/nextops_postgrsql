import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AccountService, type SafeAccount } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
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

@Controller('account')
@Roles('OWNER', 'ADMIN')
export class AccountController {
  constructor(
    @Inject(AccountService)
    private readonly accountService: AccountService,
  ) {}

  @Post()
  create(@Body() dto: CreateAccountDto, @Req() req: RequestWithUser): Promise<SafeAccount> {
    return this.accountService.create(dto, req.user?.companyId);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<SafeAccount>> {
    return this.accountService.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeAccount> {
    return this.accountService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @Req() req: RequestWithUser,
  ): Promise<SafeAccount> {
    return this.accountService.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<SafeAccount> {
    return this.accountService.remove(id, req.user?.companyId);
  }
}
