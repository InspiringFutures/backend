import { Reflector } from '@nestjs/core';

import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { AdminLevel } from "../model/admin.model";
import { UserService } from "../service/user.service";

const GUARD_ROLE_METADATA = 'GUARD_ROLE_METADATA';

export const NeedsAdmin = SetMetadata(GUARD_ROLE_METADATA, AdminLevel.normal);
export const NeedsSuperAdmin = SetMetadata(GUARD_ROLE_METADATA, AdminLevel.super);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const role = this.reflector.get<AdminLevel>(GUARD_ROLE_METADATA, context.getHandler());

        if (!role) {
            return true;
        }
        const userService = new UserService(context.switchToHttp().getRequest());
        const user = userService.currentUser();
        return user && (user.level === role || user.level === AdminLevel.super);
    }
}
