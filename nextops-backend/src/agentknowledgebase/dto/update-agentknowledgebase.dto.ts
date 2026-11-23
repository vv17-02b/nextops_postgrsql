import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateAgentKnowledgeBaseDto {
  @IsString()
  @MaxLength(255, { message: 'Назва документа не може перевищувати 255 символів' })
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(50000, { message: 'Контент документа не може перевищувати 50 000 символів' })
  @IsOptional()
  content?: string;

  @IsUUID('4', { message: 'Некоректний формат projectId' })
  @IsOptional()
  projectId?: string;
}
