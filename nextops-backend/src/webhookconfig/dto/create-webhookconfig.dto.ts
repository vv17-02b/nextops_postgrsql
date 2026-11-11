import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateWebhookConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'Project ID є обовʼязковим для привʼязки вебхука' })
  projectId!: string;

  @IsString()
  @IsNotEmpty({ message: 'URL-адреса призначення є обовʼязковою' })
  url!: string;

  @IsString()
  @IsOptional()
  secret?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Кожна подія в масиві має бути текстовим рядком' })
  events!: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
