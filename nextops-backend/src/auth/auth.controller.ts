import { Controller, Post, Body, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(
    // 🌟 Примусово інжектуємо обидва сервіси через @Inject, щоб обійти баги компілятора
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  // 1. Ендпоінт реєстрації адміністратора/користувача
  @Post('register')
  async register(@Body() dto: AuthCredentialsDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new UnauthorizedException('Користувач з таким Email вже існує');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: dto.password, 
        role: 'ADMIN', 
      },
    });

    return { success: true, message: 'Користувача успішно створено', userId: user.id };
  }

  // 2. Ендпоінт входу та видачі JWT-токена
  @Post('login')
  async login(@Body() dto: AuthCredentialsDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    
    if (!user || user.passwordHash !== dto.password) {
      throw new UnauthorizedException('Невірний Email або пароль');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    // Тепер this.jwtService буде визначено ідеально!
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      accessToken: token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
