import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { InterviewStatus, InterviewType } from '@prisma/client';

export class UpdateInterviewDto {
  @IsDateString()
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
