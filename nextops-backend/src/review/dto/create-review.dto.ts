import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки відгуку' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Product ID є обовʼязковим для привʼязки відгуку' })
  productId: string;

  @IsInt({ message: 'Рейтинг має бути цілим числом' })
  @Min(1, { message: 'Мінімальний рейтинг — 1' })
  @Max(5, { message: 'Максимальний рейтинг — 5' })
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
