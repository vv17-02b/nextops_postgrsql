import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-nextops-2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Якщо токен валідний, NestJS автоматично запише дані користувача в request.user
    if (!payload.sub) {
      throw new UnauthorizedException('Невалідний авторизаційний токен');
    }
    return { id: payload.sub, email: payload.email };
  }
}
