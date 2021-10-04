import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { Admin, AdminLevel } from '../model/admin.model';

export interface User {
    id: number,
    name: string;
    level: AdminLevel;
}

const USER_SESSION_KEY = "cachedCurrentUser";

@Injectable({ scope: Scope.REQUEST })
export class UserService {
    private cachedCurrentUser: User|null;
    constructor(@Inject(REQUEST) private readonly request: Request) {}

    loginUser(admin: Admin) {
        this.request.session[USER_SESSION_KEY] = this.cachedCurrentUser = {
            id: admin.id,
            name: admin.name,
            level: admin.level,
        };
    }

    currentUser(): User|null {
        /*if (process.env.DB_USER === 'dev') {
            return {
                id: 1,
                name: 'Robin Dev',
                level: AdminLevel.super,
            };
        }*/
        if (this.cachedCurrentUser) return this.cachedCurrentUser;
        if (this.request.session[USER_SESSION_KEY]) {
            return this.cachedCurrentUser = this.request.session[USER_SESSION_KEY];
        }
        return null;
    }

    async logout() {
        this.cachedCurrentUser = null;
        await new Promise((resolve, reject) => {
            this.request.session.destroy((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
