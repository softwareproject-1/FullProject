import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRoles = (user.roles || []).map((r: string) => r.toLowerCase().trim());

    // Case-insensitive role matching
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role.toLowerCase().trim())
    );

    if (!hasRequiredRole) {
      console.warn(`Role mismatch - Required: [${requiredRoles.join(', ')}], User has: [${user.roles?.join(', ') || 'none'}]`);
      throw new UnauthorizedException('User does not have the required role');
    }

    return true;
  }
}

