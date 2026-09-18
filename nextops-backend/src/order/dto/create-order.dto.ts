import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, ValidateNested, IsInstance } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

export class OrderItemInputDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  totalAmount: number;

  @IsString()
  @IsOptional()
  status?: string; // <-- Тепер статус офіційно є в DTO для форми

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInstance(ShippingAddressDto)
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];
}
