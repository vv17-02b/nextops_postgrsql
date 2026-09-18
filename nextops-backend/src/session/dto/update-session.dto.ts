import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  sessionToken?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsDateString({}, { message: 'Некоректний формат дати закінчення сесії (expires)' })
  @IsOptional()
  expires?: string;
}
