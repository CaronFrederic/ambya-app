import { IsString } from 'class-validator';

export class UpdateClientNoteDto {
  @IsString()
  content!: string;
}