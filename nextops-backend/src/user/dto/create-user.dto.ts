import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Некоректний формат Email' })
  email: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  passwordHash?: string;

  @IsString()
  @IsOptional()
  role?: string; // USER або ADMIN (дефолт "USER")
}
