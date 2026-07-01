import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsOptional()
  motivation?: string;

  @IsInt()
  @IsNotEmpty()
  id_student!: number;

  @IsInt()
  @IsNotEmpty()
  id_offer!: number;
}
