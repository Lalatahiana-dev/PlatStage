import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
