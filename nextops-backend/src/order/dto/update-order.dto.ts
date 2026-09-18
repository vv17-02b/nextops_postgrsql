import { IsString, IsOptional, ValidateNested, IsInstance } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingAddressDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @IsInstance(ShippingAddressDto)
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}
