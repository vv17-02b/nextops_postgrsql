import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

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

  @IsNumber({}, { message: 'Ціна має бути числом' })
  price: number;

  @IsNumber({}, { message: 'Порівняльна ціна має бути числом' })
  @IsOptional()
  compareAtPrice?: number;

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
