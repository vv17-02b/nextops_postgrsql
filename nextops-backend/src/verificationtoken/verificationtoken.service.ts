import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';

@Injectable()
export class VerificationTokenService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateVerificationTokenDto): Promise<VerificationToken> {
    if (!this.prisma || !this.prisma.verificationToken) {
      throw new Error('Критична помилка: PrismaService не ініціалізовано.');
    }

    // Безпечний парсинг дати: якщо з форми прийшла Invalid Date, ставимо дефолт (+1 день)
    let parsedDate = new Date(dto.expires);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
      parsedDate.setDate(parsedDate.getDate() + 1);
    }

    try {
      return await this.prisma.verificationToken.create({
        data: {
          identifier: dto.identifier.trim(),
          token: dto.token.trim(),
          expires: parsedDate,
        },
      });
    } catch (dbError: unknown) {
      throw new BadRequestException(
        `Помилка унікальності індексу в MongoDB Atlas. Можливо, такий токен вже існує. Details: ${
          dbError instanceof Error ? dbError.message : 'Unknown'
        }`,
      );
    }
  }

  async findAll(): Promise<VerificationToken[]> {
    if (!this.prisma || !this.prisma.verificationToken) {
      throw new Error('Критична помилка: PrismaService не ініціалізовано.');
    }
    return this.prisma.verificationToken.findMany();
  }

  async findOne(id: string): Promise<VerificationToken> {
    const item = await this.prisma.verificationToken.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Токен верифікації не знайдено');
    }
    return item;
  }

  async update(id: string, dto: UpdateVerificationTokenDto): Promise<VerificationToken> {
    await this.findOne(id);

    // Prisma сам перевіряє типи полів оновлення
    return this.prisma.verificationToken.update({
      where: { id },
      data: {
        identifier: dto.identifier,
        token: dto.token,
        expires: dto.expires ? new Date(dto.expires) : undefined,
      },
    });
  }

  async remove(id: string): Promise<VerificationToken> {
    await this.findOne(id);
    return this.prisma.verificationToken.delete({ where: { id } });
  }
}
