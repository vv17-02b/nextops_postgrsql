import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER', 'VIEWER'])
  role?: 'ADMIN' | 'MEMBER' | 'VIEWER';
}
