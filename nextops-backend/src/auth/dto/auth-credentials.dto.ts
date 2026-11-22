import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail({}, { message: 'Некоректний формат Email' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль має містити щонайменше 12 символів' })
  @MaxLength(128)
  password!: string;
}
