import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { VerificationTokenService } from './verificationtoken.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

@Controller('verificationtoken')
export class VerificationTokenController {
  constructor(
    @Inject(VerificationTokenService)
    private readonly service: VerificationTokenService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateVerificationTokenDto,
    @Req() req: RequestWithUser,
  ): Promise<VerificationToken> {
    return this.service.create(dto, req.user?.companyId);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<VerificationToken>> {
    return this.service.findAll(query, req.user?.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser): Promise<VerificationToken> {
    return this.service.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationTokenDto,
    @Req() req: RequestWithUser,
  ): Promise<VerificationToken> {
    return this.service.update(id, dto, req.user?.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<VerificationToken> {
    return this.service.remove(id, req.user?.companyId);
  }
}
