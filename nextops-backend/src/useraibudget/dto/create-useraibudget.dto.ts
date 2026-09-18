import { IsString, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateUserAiBudgetDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки бюджету' })
  userId: string;

  @IsNumber({}, { message: 'Загальний бюджет (totalBudget) має бути числом' })
  @IsPositive({ message: 'Загальний бюджет має бути більшим за 0' })
  totalBudget: number;

  @IsNumber({}, { message: 'Використаний бюджет (usedBudget) має бути числом' })
  @Min(0, { message: 'Використаний бюджет не може бути меншим за 0' })
  usedBudget: number;

  @IsString()
  @IsNotEmpty({ message: 'Валюта (currency) є обовʼязковою' })
  currency: string;
}
