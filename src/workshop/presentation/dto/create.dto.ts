import { IsString, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

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

  @IsString()
  @IsOptional()
  labelsJson?: string;

  @IsBoolean()
  @IsOptional()
  parentalConsent?: boolean;
}
