import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}
