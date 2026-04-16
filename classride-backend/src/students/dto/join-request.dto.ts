import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleEntryDto {
  @IsInt()
  day_of_week!: number;

  @IsString()
  @IsNotEmpty()
  morning_time!: string;

  @IsString()
  @IsNotEmpty()
  return_time!: string;
}

export class JoinRequestDto {
  @IsString()
  @IsNotEmpty()
  ownerPhone!: string;

  @IsString()
  @IsNotEmpty()
  homeAddress!: string;

  @IsString()
  @IsNotEmpty()
  university!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleEntryDto)
  schedule!: ScheduleEntryDto[];

  @IsString()
  @IsOptional()
  message?: string;
}