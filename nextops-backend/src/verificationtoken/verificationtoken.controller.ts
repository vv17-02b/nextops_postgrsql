import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { VerificationTokenService } from './verificationtoken.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';

@Controller('verificationtoken')
export class VerificationTokenController {
  constructor(
    @Inject(VerificationTokenService)
    private readonly service: VerificationTokenService,
  ) {
    // Фіксуємо контекст методів, щоб унеможливити втрату "this" під час виконання запитів
    this.create = this.create.bind(this);
    this.findAll = this.findAll.bind(this);
    this.findOne = this.findOne.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  @Post()
  async create(@Body() dto: CreateVerificationTokenDto): Promise<VerificationToken> { 
    return this.service.create(dto); 
  }

  @Get()
  async findAll(): Promise<VerificationToken[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VerificationToken> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateVerificationTokenDto,
  ): Promise<VerificationToken> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<VerificationToken> { 
    return this.service.remove(id); 
  }
}
