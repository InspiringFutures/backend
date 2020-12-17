import {
    BadRequestException,
    Body,
    ForbiddenException,
    Get,
    Injectable,
    Param,
    Post,
    Render,
} from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Controller, Page } from '../util/autopage';
import { Admin, AdminLevel } from "../model/admin.model";
import { NeedsAdmin, NeedsSuperAdmin } from "../util/guard";
import { redirect } from "../util/redirect";
import { UserService } from "../service/user.service";
import { GroupService } from "../service/group.service";
import { GroupAccessLevel } from "../model/groupPermission.model";
import { getAll } from "../util/functional";
import { ValidationError } from 'sequelize';
import { ClientStatus } from '../model/client.model';

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
        const user = this.userService.currentUser()!;
        const groups = await this.groupService.groupsForUser(user);
        return {user, groups: groups.map(group => ({...group.get(), permission: group.permission}))};
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

    @Post('group')
    @Render('admin/error')
    @NeedsAdmin
    async createGroup(@Body('name') name: string, @Body('code') code: string) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.createGroupForUser(admin, {name, code});
        throw redirect('/admin/group/' + group.id);
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
    @NeedsSuperAdmin
    async createAdmin(@Body('email') email: string, @Body('superuser') superuser: boolean) {

        const admin = await this.adminModel.create({
                                                       email: email,
                                                       level: superuser ? AdminLevel.super : AdminLevel.normal,
                                                   });
        if (admin !== null) {
            throw redirect('/admin');
        }
        return {msg: "There was a problem creating " + email};
    }

    @Post('group/:id/clients')
    @Render('admin/error')
    @NeedsAdmin
    async addParticipants(@Param('id') groupId, @Body('participants') participants: string) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        if (group.permission === GroupAccessLevel.view) {
            throw new ForbiddenException("You need to be a group owner or editor to modify participants");
        }
        const participantIDs = participants.split(/[\r\n]+/).map(p => p.trim());
        if (participantIDs.length === 0) {
            return {msg: "You must specify at least one participant ID"};
        }
        try {
            await this.groupService.addParticipants(group, participantIDs);
        } catch (e) {
            if (e instanceof ValidationError) {
                // We only get a validation error for the first participant that fails to insert
                const existing = e.errors.filter(e => e.path === 'participantID').map(e => e.value).join(', ');
                return {msg: "One or more of those participant IDs have already been used, such as: " + existing};
            }
            return {msg: "There was a problem adding those participants: " + e.message};
        }
        throw redirect('/admin/group/' + groupId);
    }

    @Post('group/:id/client/:clientId/status')
    @Render('admin/error')
    @NeedsAdmin
    async setClientStatus(@Param('id') groupId, @Param('clientId') clientId, @Body('newStatus') newStatus: ClientStatus) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        if (group.permission === GroupAccessLevel.view) {
            throw new ForbiddenException("You need to be a group owner or editor to modify participants");
        }
        const client = await this.groupService.getClientInGroup(group, clientId);
        client.status = newStatus;
        await client.save();
        throw redirect('/admin/group/' + groupId);
    }
}
