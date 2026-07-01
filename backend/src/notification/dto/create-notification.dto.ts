import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsInt()
  @IsNotEmpty()
  id_user!: number;
}
