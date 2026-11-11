import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateApiHistoryDto {
  @IsString()
  @MaxLength(2048)
  @IsNotEmpty({ message: 'Ендпоінт (endpoint) є обовʼязковим для логування' })
  endpoint!: string;

  @IsString()
  @MaxLength(16)
  @IsNotEmpty({ message: 'Метод запиту (method) є обовʼязковим' })
  method!: string;

  @IsInt({ message: 'Статус-код має бути цілим числом' })
  @Min(100)
  @Max(599)
  statusCode!: number;

  @IsInt({ message: 'Тривалість запиту (durationMs) має бути цілим числом' })
  @Min(0)
  durationMs!: number;
}
