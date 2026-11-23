import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAgentKnowledgeBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва документа (title) є обовʼязковою' })
  @MaxLength(255, { message: 'Назва документа не може перевищувати 255 символів' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Контент бази знань (content) не може бути порожнім' })
  @MaxLength(50000, { message: 'Контент документа не може перевищувати 50 000 символів' })
  content!: string;

  @IsUUID('4', { message: 'Некоректний формат projectId' })
  @IsNotEmpty({ message: 'projectId є обовʼязковим для привʼязки бази знань' })
  projectId!: string;
}
