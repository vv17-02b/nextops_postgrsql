import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsInt, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}
