import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва товару є обовʼязковою' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug є обовʼязковим для SEO та роутингу' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Ціна має бути числом з максимум двома десятковими знаками' })
  @Min(0)
  price: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Порівняльна ціна має бути числом з максимум двома десятковими знаками' })
  @Min(0)
  @IsOptional()
  compareAtPrice?: number | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Необхідно вказати ID категорії' })
  categoryId: string;
}
