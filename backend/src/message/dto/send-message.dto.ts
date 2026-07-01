import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @IsNotEmpty()
  id_conversation!: number;

  @IsInt()
  @IsNotEmpty()
  id_sender!: number;
}
