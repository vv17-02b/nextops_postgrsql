import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateVerificationTokenDto {
  @IsString()
  @IsOptional()
  identifier?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsDateString({}, { message: 'Некоректний формат дати закінчення дії токена (expires)' })
  @IsOptional()
  expires?: string;
}
