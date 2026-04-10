import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  location?: string;
}