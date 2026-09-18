import { Controller, Get, Post, Body, Param, Delete, Patch, Inject } from '@nestjs/common';
import { VerificationTokenService } from './verificationtoken.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';

@Controller('verificationtoken')
export class VerificationTokenController {
  constructor(
    @Inject(VerificationTokenService)
    private readonly service: VerificationTokenService
  ) {}

  @Post()
  create(@Body() dto: CreateVerificationTokenDto): Promise<VerificationToken> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(): Promise<VerificationToken[]> { 
    return this.service.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<VerificationToken> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVerificationTokenDto): Promise<VerificationToken> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<VerificationToken> { 
    return this.service.remove(id); 
  }
}
