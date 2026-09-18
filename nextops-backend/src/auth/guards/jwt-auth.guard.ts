import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Суворий інтерфейс користувача, який ми витягуємо з розшифрованого токена
interface JwtPayloadUser {
  id: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Замінено any на суворі типи та безпечний unknown для помилок платформи
  handleRequest<TUser = JwtPayloadUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err || !user) {
      throw (err as Error) || new UnauthorizedException('Доступ заблоковано. Необхідно надати валідний JWT-токен');
    }
    return user;
  }
}
