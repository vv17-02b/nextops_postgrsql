import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва категорії є обовʼязковою' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug є обовʼязковим для категорій' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  parentId?: string; 
}
