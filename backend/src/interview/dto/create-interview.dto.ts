import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  @IsDate()
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
