import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class JoinRequestDto {
  @IsString()
  @IsNotEmpty()
  ownerPhone!: string;

  @IsString()
  @IsOptional()
  message?: string;
}