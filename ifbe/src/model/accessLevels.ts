import { ForbiddenException } from "@nestjs/common";

export enum AccessLevel {
    'view' = 'view',
    'edit' = 'edit',
    'owner' = 'owner'
}

export const AccessLevels = [AccessLevel.view, AccessLevel.edit, AccessLevel.owner];

export function checkAccessLevel(neededLevel: AccessLevel, itemWithPermission: { permission: AccessLevel }) {
    AccessLevels.find(level => {
        if (neededLevel === level) {
            return true;
        }
        if (level === itemWithPermission.permission) {
            throw new ForbiddenException("You need at least " + neededLevel + " to do that");
        }
        return false;
    });
}
