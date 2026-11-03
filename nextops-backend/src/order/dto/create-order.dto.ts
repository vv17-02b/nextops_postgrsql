import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsInstance, IsInt, IsPositive, Matches, ArrayMinSize } from 'class-validator';
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

  @IsInt()
  @IsPositive()
  quantity: number;

}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsInstance(ShippingAddressDto)
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}
