import { IsString, IsOptional, ValidateNested, IsInstance, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingAddressDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'PROCESSING', 'SHIPPED', 'CANCELLED'])
  status?: string;

  @IsInstance(ShippingAddressDto)
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}
