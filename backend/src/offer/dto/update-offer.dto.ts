import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OfferStatus } from '@prisma/client';

export class UpdateOfferDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsDateString()
  @IsOptional()
  deadline?: Date;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;
}
