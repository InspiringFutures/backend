import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { Admin, AdminLevel } from "../model/admin.model";

export enum GroupAccessLevel {
    'view' = 'view',
    'edit' = 'edit',
    'owner' = 'owner'
}
export interface GroupPermission {
    level: GroupAccessLevel;
    groupId : number;
}

export interface User {
    name: string;
    level: AdminLevel;
    groups: GroupPermission[];
}

const USER_SESSION_KEY = "cachedCurrentUser";

@Injectable({ scope: Scope.REQUEST })
export class UserService {
    private cachedCurrentUser: User|null;
    constructor(@Inject(REQUEST) private readonly request: Request) {}

    loginUser(admin: Admin) {
        this.request.session[USER_SESSION_KEY] = this.cachedCurrentUser = {
            name: admin.name,
            level: admin.level,
            groups: []
        };
    }

    currentUser(): User|null {
        if (this.cachedCurrentUser) return this.cachedCurrentUser;
        if (this.request.session[USER_SESSION_KEY]) {
            return this.cachedCurrentUser = this.request.session[USER_SESSION_KEY];
        }
        return null;
    }
}
