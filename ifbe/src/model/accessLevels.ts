import { ForbiddenException } from "@nestjs/common";

export enum AccessLevel {
    'view' = 'view',
    'edit' = 'edit',
    'owner' = 'owner'
}

export const AccessLevels = [AccessLevel.view, AccessLevel.edit, AccessLevel.owner];

export function filterAccessLevel(neededLevel: AccessLevel, itemWithPermission: { permission: AccessLevel }) {
    for (let level of AccessLevels) {
        if (neededLevel === level) {
            return true;
        }
        if (level === itemWithPermission.permission) {
            return false;
        }
    }
    // Inaccessible
    return false;
}

export function checkAccessLevel(neededLevel: AccessLevel, itemWithPermission: { permission: AccessLevel }) {
    if (!filterAccessLevel(neededLevel, itemWithPermission)) {
        throw new ForbiddenException("You need at least " + neededLevel + " to do that");
    }
}
