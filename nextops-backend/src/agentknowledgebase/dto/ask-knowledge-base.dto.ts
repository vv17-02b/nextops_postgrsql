import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AskKnowledgeBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'Запитання до AI-асистента не може бути порожнім' })
  @MaxLength(2000, { message: 'Запитання не може перевищувати 2000 символів' })
  question!: string;

  @IsUUID('4', { message: 'Некоректний формат projectId' })
  @IsOptional()
  projectId?: string;
}
