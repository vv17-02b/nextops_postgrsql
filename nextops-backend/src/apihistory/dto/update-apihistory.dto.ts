import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateApiHistoryDto {
  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
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
