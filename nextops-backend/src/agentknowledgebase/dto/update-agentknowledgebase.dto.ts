import { IsString, IsOptional } from 'class-validator';

export class UpdateAgentKnowledgeBaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}
