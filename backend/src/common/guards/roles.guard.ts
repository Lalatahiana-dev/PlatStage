import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../../auth/types/user-request.type';

import { Request } from 'express';

interface TypedRequest extends Request {
  user?: JwtUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('REQUIRED ROLES:', requiredRoles);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<TypedRequest>();
    const user = request.user;

    console.log('USER FROM TOKEN:', JSON.stringify(user));

    if (!user?.roles) return false;

    console.log('USER ROLES:', user.roles);

    const result = user.roles.some((role) => requiredRoles.includes(role));
    console.log('RESULT:', result);

    return result;
  }
}
