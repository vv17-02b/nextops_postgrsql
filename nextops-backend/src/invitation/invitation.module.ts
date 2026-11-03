import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { QueueModule } from '../common/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
