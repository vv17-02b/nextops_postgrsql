import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformOwnerGuard } from './platform-owner.guard';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, PlatformOwnerGuard],
})
export class PlatformModule {}
