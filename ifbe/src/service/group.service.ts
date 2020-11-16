import { InjectModel } from "@nestjs/sequelize";
import { Model } from 'sequelize-typescript';
import { ForbiddenException } from "@nestjs/common";

import { Admin, AdminLevel } from "../model/admin.model";
import { User } from "./user.service";
import { Group } from "../model/group.model";
import { GroupAccessLevel, GroupPermission } from "../model/groupPermission.model";
import { Client } from "../model/client.model";
import { getOrElse } from "../util/functional";

type GroupWithAccessLevel = Group & { permission: GroupAccessLevel };

export class GroupService {
    constructor(@InjectModel(Group) private groupModel: typeof Group,
                @InjectModel(Client) private clientModel: typeof Client,
                @InjectModel(Admin) private adminModel: typeof Admin,
                @InjectModel(GroupPermission) private groupPermissionModel: typeof GroupPermission,
    ) {}

    async groupsForUser(admin: User) {
        const groups = await this.groupModel.findAll({
            include: [{model: Admin, where: {id: admin.id}, required: admin.level !== AdminLevel.super }],
         });
        return groups.map((g: GroupWithAccessLevel) => {
            const {admins} = g;
            let permission = GroupAccessLevel.view;
            if (admins.length === 0) {
                // Super-admin, so grant full permission
                permission = GroupAccessLevel.owner;
            } else {
                // There can only be one by the where clause above
                if (admins[0].id !== admin.id) {
                    throw new Error("Unexpected admin id:" + admins[0].id);
                }
                permission = admins[0].GroupPermission.level;
            }
            g.permission = permission;
            return g;
        })
    }

    async groupForUser(admin: User, groupId: number) {
        const group = await this.groupModel.findByPk(groupId, {
            include: [
                {model: Admin},
                {model: Client, separate: true}
            ],
            rejectOnEmpty: true,

        }) as GroupWithAccessLevel; // Fill this in a minute
        // Check admin has access
        const permission = admin.level === AdminLevel.super ? GroupAccessLevel.owner :
            getOrElse(group.admins.find(a => a.id === admin.id), () => {
                throw new ForbiddenException("You do not have access to that group");
            }).GroupPermission.level;
        group.permission = permission;
        return group;
    }

    async addAdmin(group: Group, newUser: { permission: GroupAccessLevel; email: string }) {
        //const user = await this.adminModel.findOne({where: {email: newUser.email}, rejectOnEmpty: true});
        //const groupPermission = this.groupPermissionModel.upsert({groupId: })
        const existing = group.admins.find(a => a.email === newUser.email);
        if (existing) {
            existing.GroupPermission.level = newUser.permission;
            await existing.GroupPermission.save();
        } else {
            const user = await this.adminModel.findOne({where: {email: newUser.email}, rejectOnEmpty: true});
            await this.groupPermissionModel.create({adminId: user.id, groupId: group.id, level: newUser.permission});
        }
    }
}
