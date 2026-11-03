import { IsString, IsOptional, IsInt, Min } from 'class-validator';

// Budget values are accepted and stored as integer minor units (cents).
export class UpdateUserAiBudgetDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsInt({ message: 'Загальний бюджет (totalBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Загальний бюджет не може бути відʼємним' })
  @IsOptional()
  totalBudgetMinor?: number;

  @IsInt({ message: 'Використаний бюджет (usedBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Використаний бюджет не може бути відʼємним' })
  @IsOptional()
  usedBudgetMinor?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
