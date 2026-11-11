import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class PaymentResultDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsOptional()
  @IsObject()
  rawResponse?: Prisma.JsonObject;
}
