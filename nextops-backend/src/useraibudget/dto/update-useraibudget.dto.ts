import { IsString, IsOptional, IsNumber, IsPositive, Min } from 'class-validator';

export class UpdateUserAiBudgetDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber({}, { message: 'Загальний бюджет (totalBudget) має бути числом' })
  @IsPositive({ message: 'Загальний budget має бути більшим за 0' })
  @IsOptional()
  totalBudget?: number;

  @IsNumber({}, { message: 'Використаний бюджет (usedBudget) має бути числом' })
  @Min(0, { message: 'Використаний бюджет не може бути меншим за 0' })
  @IsOptional()
  usedBudget?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
