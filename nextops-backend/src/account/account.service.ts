import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import type { Account } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({ data: dto });
  }

  async findAll(): Promise<Account[]> {
    return this.prisma.account.findMany();
  }

  async findOne(id: string): Promise<Account> {
    const item = await this.prisma.account.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Документ з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }
}
