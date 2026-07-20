import { ArrayNotEmpty, IsArray, IsEnum, IsNumber } from 'class-validator';

export class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  userIds!: number[];

  @IsEnum(['ACTIVE', 'INACTIVE'] as const)
  status!: 'ACTIVE' | 'INACTIVE';
}

export class BulkDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  userIds!: number[];
}
