import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from './domain/interfaces/user-profile.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserProfile => {
    const request = context.switchToHttp().getRequest();

    // ✅ Type veilig casten (ESLint blij, TypeScript blij)
    const user = request.user as UserProfile | undefined;

    if (!user) {
      throw new Error('Geen gebruiker gevonden in het verzoek');
    }

    return user;
  },
);
