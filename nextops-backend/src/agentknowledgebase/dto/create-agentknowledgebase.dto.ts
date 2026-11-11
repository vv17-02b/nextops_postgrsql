import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAgentKnowledgeBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва документа (title) є обовʼязковою' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Контент бази знань (content) не може бути порожнім' })
  content!: string;

  @IsString()
  @IsNotEmpty({ message: 'projectId є обовʼязковим для привʼязки бази знань' })
  projectId!: string;
}
