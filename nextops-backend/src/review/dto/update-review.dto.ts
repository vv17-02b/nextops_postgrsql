import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsInt({ message: 'Рейтинг має бути цілим числом' })
  @Min(1, { message: 'Мінімальний рейтинг — 1' })
  @Max(5, { message: 'Максимальний рейтинг — 5' })
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
