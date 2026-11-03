import { IsEmail, IsString, IsOptional } from 'class-validator';

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

}
