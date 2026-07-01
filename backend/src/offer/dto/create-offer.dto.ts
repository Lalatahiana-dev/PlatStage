import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OfferStatus } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

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

  @IsInt()
  id_company!: number;
}
