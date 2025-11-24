import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Laat alles onder /uploads toe (publiek toegankelijk)
    if (url.startsWith('/uploads')) {
      return true;
    }

    // Laat ook /public of /docs-viewer etc. toe, indien gewenst
    if (url.startsWith('/public')) {
      return true;
    }

    // Voor alles anders: JWT blijft verplicht
    return super.canActivate(context);
  }
}
