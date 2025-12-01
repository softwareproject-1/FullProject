import { UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface JwtPayload {
  sub: string;
  nationalId: string;
  employeeNumber: string;
  roles?: string[];
  permissions?: string[];
}

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export const isUserAuthorized = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): NextFunction | void => {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRoles = req.user.roles || [];

    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new UnauthorizedException('User does not have the required role');
    }

    next();
  };
};

export default isUserAuthorized;

