import { UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export const isUserAuthorized = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction | void => {
    if (!req['user']) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRoles = (req['user'] as any).roles || [];
    
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      throw new UnauthorizedException('User does not have the required role');
    }
    
    next();
  };
};

export default isUserAuthorized;

