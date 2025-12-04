// respond-to-review.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RespondToReviewDto {
  @IsNotEmpty()
  @IsEmail()
  userEmail: string; // Het e-mailadres van de reviewer

  @IsNotEmpty()
  @IsString()
  workshopTitle: string; // De titel van de workshop (voor in de mail)

  @IsNotEmpty()
  @IsString()
  adminResponse: string; // De reactietekst (de body van de mail)
}
