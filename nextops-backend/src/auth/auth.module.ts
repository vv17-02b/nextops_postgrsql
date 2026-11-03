import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller'; 
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { jwtSecret } from './jwt-secret';
import { RolesGuard } from './roles.guard';
import { TokenRevocationService } from './token-revocation.service';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '7d' }, 
    }),
  ],
  controllers: [AuthController], 
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    TokenRevocationService,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
  exports: [PassportModule, JwtModule, TokenRevocationService],
})
export class AuthModule {}
