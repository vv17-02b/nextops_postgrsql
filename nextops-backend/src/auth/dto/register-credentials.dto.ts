import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterCredentialsDto {
  @IsEmail({}, { message: 'Некоректний формат Email' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль має містити щонайменше 12 символів' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Назва компанії має містити щонайменше 2 символи' })
  @MaxLength(100)
  companyName?: string;
}
