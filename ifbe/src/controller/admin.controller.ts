import { Body, ForbiddenException, Get, Injectable, Param, Post, Render, } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Controller, Page } from '../util/autopage';
import { Admin, AdminLevel } from "../model/admin.model";
import { NeedsAdmin } from "../util/guard";
import { redirect } from "../util/redirect";
import { UserService } from "../service/user.service";
import { GroupService } from "../service/group.service";
import { GroupAccessLevel } from "../model/groupPermission.model";
import { getAll } from "../util/functional";

@Controller('admin')
@Injectable()
export class AdminController {
    constructor(
        @InjectModel(Admin)
        private adminModel: typeof Admin,
        private readonly userService: UserService,
        private readonly groupService: GroupService,
    ) {}

    @Page()
    @NeedsAdmin
    async index() {
        const admin = this.userService.currentUser()!;
        const groups = await this.groupService.groupsForUser(admin);
        return {groups: groups.map(group => ({...group.get(), permission: group.permission}))};
    }

    @Page('group')
    @Get('group/:id')
    @NeedsAdmin
    async group(@Param('id') groupId) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        return {
            group: {...group.get(), permission: group.permission, clients: getAll(group.clients), admins: getAll(group.admins)},
            protocol: 'foo'};
    }

    @Post('group/:id/admins')
    @Render('admin/error')
    @NeedsAdmin
    async addAdmin(@Param('id') groupId, @Body('email') email: string, @Body('permission') permission: GroupAccessLevel) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        if (group.permission !== GroupAccessLevel.owner) {
            throw new ForbiddenException("You need to be a group owner to modify admins");
        }
        await this.groupService.addAdmin(group,{email, permission});
        if (admin !== null) {
            throw redirect('/admin/group/' + groupId);
        }
        return {msg: "There was a problem adding " + email};
    }

    @Post('add')
    @Render('admin/error')
    //@NeedsSuperAdmin
    async add(@Body('email') email: string, @Body('superuser') superuser: boolean) {

        const admin = await this.adminModel.create({
                                                       email: email,
                                                       level: superuser ? AdminLevel.super : AdminLevel.normal,
                                                   });
        if (admin !== null) {
            throw redirect('/admin');
        }
        return {msg: "There was a problem creating " + email};
    }
}
