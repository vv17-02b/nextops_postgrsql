import { Module } from '@nestjs/common';
import { ApiHistoryService } from './apihistory.service';
import { ApiHistoryController } from './apihistory.controller';

@Module({
  controllers: [ApiHistoryController],
  providers: [ApiHistoryService],
  exports: [ApiHistoryService]
})
export class ApiHistoryModule {}
