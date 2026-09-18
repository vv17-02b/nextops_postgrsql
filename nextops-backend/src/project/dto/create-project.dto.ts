import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки проєкту' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Назва проєкту (name) є обовʼязковою' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
