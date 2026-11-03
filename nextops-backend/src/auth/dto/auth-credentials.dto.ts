import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail({}, { message: 'Некоректний формат Email' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  @MaxLength(128)
  password: string;
}
