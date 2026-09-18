import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    try {
      this.logger.log('Спроба видалення застарілого індексу Order_stripeId_key...');
      await this.$runCommandRaw({
        dropIndexes: 'Order',
        index: 'Order_stripeId_key',
      });
      
      this.logger.log('✔ Застарілий індекс Order_stripeId_key успішно видалено з MongoDB Atlas!');
    } catch (indexError) {
      this.logger.warn('Індекс Order_stripeId_key не знайдено або вже видалено, рушаємо далі.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
