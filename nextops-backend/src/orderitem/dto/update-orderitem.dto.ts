import { IsNumber, IsOptional, IsPositive, IsInt } from 'class-validator';

export class UpdateOrderItemDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}
