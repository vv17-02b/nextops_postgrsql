import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва складу (name) є обовʼязковою' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Локація або адреса складу (location) є обовʼязковою' })
  location: string;

  @IsString()
  @IsOptional()
  description?: string;
}
