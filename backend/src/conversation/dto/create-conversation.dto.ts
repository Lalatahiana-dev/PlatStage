import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  @IsNotEmpty()
  id_student!: number;

  @IsInt()
  @IsNotEmpty()
  id_company!: number;

  @IsInt()
  @IsNotEmpty()
  id_offer!: number;
}
