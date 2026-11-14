import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RateLimit } from '../auth/rate-limit.guard';
import { RequireScope } from '../auth/scope.guard';
import { ShippingAddressDto } from '../order/dto/create-order.dto';
import { StorefrontService, type StorefrontProductDto } from './storefront.service';

class StorefrontOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateStorefrontOrderDto {
  @IsString()
  @IsOptional()
  customerUserId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StorefrontOrderItemDto)
  items!: StorefrontOrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}

class CreateStorefrontReviewDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsOptional()
  customerUserId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

interface RequestWithCompany extends Request {
  user?: {
    id: string;
    companyId?: string;
  };
}

@Controller('public/v1')
export class StorefrontController {
  constructor(
    @Inject(StorefrontService)
    private readonly storefrontService: StorefrontService,
  ) {}

  @Get('products')
  @RateLimit(120, 60)
  @RequireScope('read:products')
  listCatalog(@Req() req: RequestWithCompany): Promise<{ products: StorefrontProductDto[] }> {
    return this.storefrontService.listCatalog(req.user?.companyId);
  }

  @Post('orders')
  @RateLimit(30, 60)
  @RequireScope('write:orders')
  createOrder(@Body() dto: CreateStorefrontOrderDto, @Req() req: RequestWithCompany) {
    return this.storefrontService.createOrder(dto, req.user?.companyId);
  }

  @Post('reviews')
  @RateLimit(30, 60)
  @RequireScope('write:reviews')
  createReview(@Body() dto: CreateStorefrontReviewDto, @Req() req: RequestWithCompany) {
    return this.storefrontService.createReview(dto, req.user?.companyId);
  }
}
