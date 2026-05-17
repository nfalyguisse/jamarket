import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightEnum } from '../../../generated/prisma/client';

export const REQUIRED_RIGHTS_KEY = 'requiredRights';
export const RequireRights = (...rights: RightEnum[]) =>
  SetMetadata(REQUIRED_RIGHTS_KEY, rights);

@Injectable()
export class RightsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRights = this.reflector.getAllAndOverride<RightEnum[]>(
      REQUIRED_RIGHTS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRights?.length) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: { role: { rights: RightEnum[] } } }>();

    const hasRight = requiredRights.some((right) =>
      user?.role?.rights?.includes(right),
    );

    if (!hasRight) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits nécessaires pour effectuer cette action",
      );
    }

    return true;
  }
}
