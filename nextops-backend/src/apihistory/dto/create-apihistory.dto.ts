import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class CreateApiHistoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Ендпоінт (endpoint) є обовʼязковим для логування' })
  endpoint: string;

  @IsString()
  @IsNotEmpty({ message: 'Метод запиту (method) є обовʼязковим' })
  method: string;

  @IsInt({ message: 'Статус-код має бути цілим числом' })
  @Min(100)
  @Max(599)
  statusCode: number;

  @IsInt({ message: 'Тривалість запиту (durationMs) має бути цілим числом' })
  @Min(0)
  durationMs: number;
}
