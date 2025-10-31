import { IsString, IsBoolean, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsOptional()
  @IsArray()
  labels?: any[];

  @IsString()
  @IsOptional()
  labelsJson?: string;

  @IsBoolean()
  @IsOptional()
  parentalConsent?: boolean;
}
