import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import type { Session } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    // 🌟 КУЛЕНЕПРОБИВНА ПЕРЕВІРКА ДАТИ: 
    // Якщо dto.expires порожній, або спроба створити з нього Date повертає Invalid Date —
    // примусово ставимо легальну дату на 7 днів вперед.
    let sessionExpires = dto.expires ? new Date(dto.expires) : null;

    if (!sessionExpires || isNaN(sessionExpires.getTime())) {
      sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return this.prisma.session.create({
      data: {
        sessionToken: dto.sessionToken,
        userId: dto.userId,
        expires: sessionExpires, // Тут тепер гарантовано валідний об'єкт Date
      },
    });
  }

  async findAll(): Promise<Session[]> {
    return this.prisma.session.findMany();
  }

  async findOne(id: string): Promise<Session> {
    const item = await this.prisma.session.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Сесію з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateSessionDto): Promise<Session> {
    await this.findOne(id);
    
    const updateData: Record<string, any> = {};
    if (dto.sessionToken) updateData.sessionToken = dto.sessionToken;
    if (dto.userId) updateData.userId = dto.userId;
    
    if (dto.expires) {
      const parsedDate = new Date(dto.expires);
      if (!isNaN(parsedDate.getTime())) {
        updateData.expires = parsedDate;
      }
    }

    return this.prisma.session.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Session> {
    await this.findOne(id);
    return this.prisma.session.delete({ where: { id } });
  }
}
