// src/security/presentation/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../domain/enums/role.enum'; // jouw enum

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
