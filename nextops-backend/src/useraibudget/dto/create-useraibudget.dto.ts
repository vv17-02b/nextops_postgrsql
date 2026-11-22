import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { MAX_MINOR_UNITS } from '../../common/money';

// Budget values are accepted and stored as integer minor units (cents).
export class CreateUserAiBudgetDto {
  @IsUUID('4', { message: 'User ID має бути коректним UUID' })
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки бюджету' })
  userId!: string;

  @IsInt({ message: 'Загальний бюджет (totalBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Загальний бюджет не може бути відʼємним' })
  @Max(MAX_MINOR_UNITS, { message: 'Загальний бюджет перевищує допустимий ліміт' })
  totalBudgetMinor!: number;

  @IsInt({ message: 'Використаний бюджет (usedBudgetMinor) має бути цілим числом копійок' })
  @Min(0, { message: 'Використаний бюджет не може бути відʼємним' })
  @Max(MAX_MINOR_UNITS, { message: 'Використаний бюджет перевищує допустимий ліміт' })
  @IsOptional()
  usedBudgetMinor?: number;

  @IsString()
  @IsNotEmpty({ message: 'Валюта (currency) є обовʼязковою' })
  currency!: string;
}
