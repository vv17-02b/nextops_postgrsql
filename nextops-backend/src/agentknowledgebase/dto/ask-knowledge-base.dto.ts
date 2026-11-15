import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AskKnowledgeBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'Запитання до AI-асистента не може бути порожнім' })
  @MaxLength(2000)
  question!: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}
