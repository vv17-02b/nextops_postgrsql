import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Некоректний формат Email' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  @IsOptional()
  passwordHash?: string;

  @IsString()
  @IsOptional()
  role?: string;
}
