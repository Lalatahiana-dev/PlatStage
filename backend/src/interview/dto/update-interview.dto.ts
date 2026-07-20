import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InterviewStatus, InterviewType } from '@prisma/client';

export class UpdateInterviewDto {
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduled_at?: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;

  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;
}
