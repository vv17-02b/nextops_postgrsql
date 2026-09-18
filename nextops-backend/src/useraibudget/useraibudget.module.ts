import { Module } from '@nestjs/common';
import { UserAiBudgetService } from './useraibudget.service';
import { UserAiBudgetController } from './useraibudget.controller';

@Module({
  controllers: [UserAiBudgetController],
  providers: [UserAiBudgetService],
  exports: [UserAiBudgetService]
})
export class UserAiBudgetModule {}
