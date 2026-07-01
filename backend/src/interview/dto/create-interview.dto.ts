import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @IsDateString()
  @IsNotEmpty()
  scheduled_at!: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(InterviewType)
  @IsNotEmpty()
  type!: InterviewType;

  @IsInt()
  @IsNotEmpty()
  id_application!: number;
}
