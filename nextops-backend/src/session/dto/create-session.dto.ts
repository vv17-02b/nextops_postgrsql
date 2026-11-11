import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Токен сесії (sessionToken) є обовʼязковим' })
  sessionToken!: string;

  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки сесії' })
  userId!: string;

  @IsDateString({}, { message: 'Некоректний формат дати закінчення сесії (expires)' })
  expires!: string;
}
