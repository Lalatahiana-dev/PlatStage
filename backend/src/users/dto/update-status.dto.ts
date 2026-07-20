import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE'] as const)
  @IsNotEmpty()
  status!: 'ACTIVE' | 'INACTIVE';
}
