import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// Properties are populated by ValidationPipe/class-transformer from the request
// body, hence the definite-assignment (`!:`) annotations.

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Некоректний формат Email' })
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32, { message: 'Недійсний токен відновлення пароля' })
  token!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль має містити щонайменше 12 символів' })
  @MaxLength(128)
  password!: string;
}
