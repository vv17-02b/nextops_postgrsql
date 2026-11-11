import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Некоректний формат Email' })
  email!: string;

  @IsString()
  @IsOptional()
  image?: string;
}
