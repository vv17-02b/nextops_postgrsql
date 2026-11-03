import { IsOptional, IsPositive, IsInt } from 'class-validator';

export class UpdateOrderItemDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

}
