import {
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from 'class-validator';

export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

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

  // ✅ Voeg quiz toe
  @IsOptional()
  @IsArray()
  quiz?: QuizQuestion[];
}
