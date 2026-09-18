import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import { Prisma } from '@prisma/client';
import type { UserAiBudget } from '@prisma/client';

// Інтерфейс розширення для ідеальної сумісності з преміальним графіком фронтенду
interface UserAiBudgetExtended extends UserAiBudget {
  totalBudget: number;
  usedBudget: number;
  currency: string;
}

@Injectable()
export class UserAiBudgetService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateUserAiBudgetDto): Promise<UserAiBudget> {
    // 🌟 АВТО-ДАТА СКИДАННЯ: Вираховуємо дату рівно на 30 днів вперед від сьогодні
    const autoResetDate = new Date();
    autoResetDate.setDate(autoResetDate.getDate() + 30);

    // 🌟 СИНХРОНІЗАЦІЯ NoSQL ЗІ СХЕМОЮ: Наповнюємо всі обов'язкові властивості моделі Prisma
    const budgetData: Prisma.UserAiBudgetUncheckedCreateInput = {
      userId: String(dto.userId).trim(),
      monthlyLimit: Number(dto.totalBudget || 0),
      currentUsage: Number(dto.usedBudget || 0), // Мапимо usedBudget в поле currentUsage схеми
      resetDate: autoResetDate, // Передаємо легальний обов'язковий об'єкт Date
    };

    return this.prisma.userAiBudget.create({
      data: budgetData,
    });
  }

  async findAll(): Promise<UserAiBudget[]> {
    const list = await this.prisma.userAiBudget.findMany();
    
    // 🌟 ЗВОРOТНИЙ МАПІНГ: Віртуально повертаємо поля totalBudget/usedBudget для нашого BudgetChart
    return list.map((item: UserAiBudget) => {
      const extended = item as unknown as UserAiBudgetExtended;
      
      const rawLimit = (item as unknown as { monthlyLimit: number }).monthlyLimit || 0;
      const rawUsage = (item as unknown as { currentUsage?: number }).currentUsage || 0;
      
      extended.totalBudget = rawLimit;
      extended.usedBudget = rawUsage;
      extended.currency = 'USD'; // Дефолтна валюта для відображення картки графіка
      return extended;
    });
  }

  async findOne(id: string): Promise<UserAiBudget> {
    const item = await this.prisma.userAiBudget.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Бюджет з ID ${id} не знайдено`);
    
    const extended = item as unknown as UserAiBudgetExtended;
    extended.totalBudget = (item as unknown as { monthlyLimit: number }).monthlyLimit || 0;
    extended.usedBudget = (item as unknown as { currentUsage?: number }).currentUsage || 0;
    extended.currency = 'USD';
    return extended;
  }

  async update(id: string, dto: UpdateUserAiBudgetDto): Promise<UserAiBudget> {
    await this.findOne(id);
    
    const updateData: Prisma.UserAiBudgetUncheckedUpdateInput = {};
    if (dto.userId) updateData.userId = dto.userId;
    if (dto.totalBudget) updateData.monthlyLimit = Number(dto.totalBudget);
    if (dto.usedBudget !== undefined) updateData.currentUsage = Number(dto.usedBudget);

    return this.prisma.userAiBudget.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<UserAiBudget> {
    await this.findOne(id);
    return this.prisma.userAiBudget.delete({ where: { id } });
  }
}
