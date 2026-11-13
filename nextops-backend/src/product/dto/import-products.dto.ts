import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class ImportProductsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'CSV-файл має містити щонайменше один товар' })
  @ArrayMaxSize(500, { message: 'За один імпорт дозволено завантажити не більше 500 товарів' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  items!: CreateProductDto[];
}
