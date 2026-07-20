import { ArrayNotEmpty, IsArray, IsEnum, IsNumber } from 'class-validator';
import { OfferStatus } from '@prisma/client';

export class BulkOfferStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  offerIds!: number[];

  @IsEnum(OfferStatus)
  status!: OfferStatus;
}

export class BulkOfferDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  offerIds!: number[];
}
