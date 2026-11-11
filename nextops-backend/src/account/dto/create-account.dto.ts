import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID є обовʼязковим для привʼязки акаунта' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Тип акаунта є обовʼязковим (наприклад, oauth)' })
  type!: string;

  @IsString()
  @IsNotEmpty({ message: 'Провайдер є обовʼязковим (наприклад, github, google)' })
  provider!: string;

  @IsString()
  @IsNotEmpty({ message: 'ID провайдера акаунта є обовʼязковим' })
  providerAccountId!: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;

  @IsString()
  @IsOptional()
  access_token?: string;

  @IsInt()
  @IsOptional()
  expires_at?: number;

  @IsString()
  @IsOptional()
  token_type?: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsString()
  @IsOptional()
  id_token?: string;

  @IsString()
  @IsOptional()
  session_state?: string;
}
