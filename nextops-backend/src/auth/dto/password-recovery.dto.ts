import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// Properties are populated by ValidationPipe/class-transformer from the request
// body, hence the definite-assignment (`!:`) annotations.

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Некорректный формат Email' })
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль должен содержать минимум 12 символов' })
  @MaxLength(128)
  password!: string;
}
