import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/role.decorator';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    console.log('🔐 Required roles:', requiredRoles);
    console.log('🔑 User roles from request:', user?.roles);

    if (!user) return false;

    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    if (!userRoles) return false;

    const allowed = requiredRoles.some(role => userRoles.includes(role));
    console.log('✅ Role check passed?', allowed);
    return allowed;
  }

}
