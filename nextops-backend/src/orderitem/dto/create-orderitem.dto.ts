import { Transform } from 'class-transformer';
import { IsUUID, IsNotEmpty, IsPositive, IsInt, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  orderId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
