import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsInt()
  @IsOptional()
  destinationId?: number;

  @IsString()
  @IsOptional()
  homeAddress?: string;
}