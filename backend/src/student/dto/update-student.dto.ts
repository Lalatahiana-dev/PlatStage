import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  university?: string;

  @IsString()
  @IsOptional()
  level?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  @IsOptional()
  photo_url?: string;

  @IsUrl()
  @IsOptional()
  cv_url?: string;
}
