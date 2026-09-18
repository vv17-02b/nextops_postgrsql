import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common'; // ✅ Виправлено імпорт
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import type { Account } from '@prisma/client';

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
  findAll(): Promise<Account[]> { 
    return this.accountService.findAll(); 
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
