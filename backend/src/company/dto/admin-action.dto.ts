import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNumber } from 'class-validator';

export class VerifyDto {
  @IsBoolean()
  is_verified!: boolean;
}

export class UpdateCompanyStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED'] as const)
  status!: 'ACTIVE' | 'SUSPENDED';
}

export class BulkVerifyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  companyIds!: number[];

  @IsBoolean()
  is_verified!: boolean;
}

export class BulkCompanyStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  companyIds!: number[];

  @IsEnum(['ACTIVE', 'SUSPENDED'] as const)
  status!: 'ACTIVE' | 'SUSPENDED';
}

export class BulkCompanyDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  companyIds!: number[];
}
