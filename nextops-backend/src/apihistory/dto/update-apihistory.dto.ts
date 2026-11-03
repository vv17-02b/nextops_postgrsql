import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpdateApiHistoryDto {
  @IsString()
  @MaxLength(2048)
  @IsOptional()
  endpoint?: string;

  @IsString()
  @MaxLength(16)
  @IsOptional()
  method?: string;

  @IsInt({ message: 'Статус-код має бути цілим числом' })
  @Min(100)
  @Max(599)
  @IsOptional()
  statusCode?: number;

  @IsInt({ message: 'Тривалість запиту (durationMs) має бути цілим числом' })
  @Min(0)
  @IsOptional()
  durationMs?: number;
}
