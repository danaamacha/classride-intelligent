import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsOptional()
  homeTown?: string;
}