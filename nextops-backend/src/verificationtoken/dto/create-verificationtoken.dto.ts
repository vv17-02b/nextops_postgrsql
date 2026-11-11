import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateVerificationTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Ідентифікатор (identifier/email) є обовʼязковим' })
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Рядок токена (token) є обовʼязковим' })
  token!: string;

  @IsDateString({}, { message: 'Некоректний формат дати закінчення дії токена (expires)' })
  expires!: string;
}
