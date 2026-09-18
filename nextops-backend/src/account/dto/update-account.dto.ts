import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  providerAccountId?: string;

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
