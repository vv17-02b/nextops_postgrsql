import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail({}, { message: 'Некоректний формат Email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  password: string;
}
