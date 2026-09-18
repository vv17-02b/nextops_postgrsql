import { Module } from '@nestjs/common';
import { VerificationTokenService } from './verificationtoken.service';
import { VerificationTokenController } from './verificationtoken.controller';

@Module({
  controllers: [VerificationTokenController],
  providers: [VerificationTokenService],
  exports: [VerificationTokenService]
})
export class VerificationTokenModule {}
