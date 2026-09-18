import { Module } from '@nestjs/common';
import { OrderItemService } from './orderitem.service';
import { OrderItemController } from './orderitem.controller';

@Module({
  controllers: [OrderItemController],
  providers: [OrderItemService],
  exports: [OrderItemService]
})
export class OrderItemModule {}
