import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

// Budget values are accepted and stored as integer minor units (cents).
export class CreateUserAiBudgetDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки бюджету' })
  userId!: string;

  @IsInt({ message: 'Загальний бюджет (totalBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Загальний бюджет не може бути відʼємним' })
  totalBudgetMinor!: number;

  @IsInt({ message: 'Використаний бюджет (usedBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Використаний бюджет не може бути відʼємним' })
  @IsOptional()
  usedBudgetMinor?: number;

  @IsString()
  @IsNotEmpty({ message: 'Валюта (currency) є обовʼязковою' })
  currency!: string;
}
