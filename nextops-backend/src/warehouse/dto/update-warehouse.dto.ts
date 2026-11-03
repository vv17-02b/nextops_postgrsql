import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateWarehouseDto {
  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @Transform(({ value }) => value === undefined ? value : Number(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;
}
