import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';

@Injectable()
export class VerificationTokenService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateVerificationTokenDto): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({
      data: {
        identifier: dto.identifier,
        token: dto.token,
        expires: new Date(dto.expires), // Трансформація в об'єкт Date для MongoDB Atlas
      },
    });
  }

  async findAll(): Promise<VerificationToken[]> {
    return this.prisma.verificationToken.findMany();
  }

  async findOne(id: string): Promise<VerificationToken> {
    const item = await this.prisma.verificationToken.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Токен верифікації не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateVerificationTokenDto): Promise<VerificationToken> {
    await this.findOne(id);

    const updateData: Record<string, any> = {};
    if (dto.identifier) updateData.identifier = dto.identifier;
    if (dto.token) updateData.token = dto.token;
    if (dto.expires) updateData.expires = new Date(dto.expires);

    return this.prisma.verificationToken.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<VerificationToken> {
    await this.findOne(id);
    return this.prisma.verificationToken.delete({ where: { id } });
  }
}
