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

  handleRequest<TUser = JwtPayloadUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException('Доступ заблоковано. Необхідно надати валідний JWT-токен');
    }
    return user;
  }
}
