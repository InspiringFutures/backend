import { Body, Get, Injectable, Param, Post, Render, Req, Res, } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ValidationError } from 'sequelize';

import { Controller, Page } from '../util/autopage';
import { Admin } from '../model/admin.model';
import { NeedsAdmin } from '../util/guard';
import { redirect } from '../util/redirect';
import { UserService } from '../service/user.service';
import { GroupService } from '../service/group.service';
import { getAll } from '../util/functional';
import { ClientStatus } from '../model/client.model';
import { ClientService } from '../service/client.service';
import { JournalService } from '../service/journal.service';
import { AccessLevel, checkAccessLevel } from "../model/accessLevels";
import { SurveyService } from "../service/survey.service";
import { Group } from '../model/group.model';
import { Survey } from '../model/survey.model';

@Controller('admin/group')
@Injectable()
export class GroupAdminController {
    constructor(
        @InjectModel(Admin)
        private adminModel: typeof Admin,
        private readonly userService: UserService,
        private readonly groupService: GroupService,
        private readonly clientService: ClientService,
        private readonly journalService: JournalService,
        private readonly surveyService: SurveyService,
    ) {}

    @Page('view')
    @Get(':id')
    @NeedsAdmin
    async group(@Param('id') groupId) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.view);
        const allocations = await group.$get('allocations', {attributes: {exclude: ['content']}, include: [Admin, Survey], order: [['openAt', 'asc NULLS FIRST'], 'id']});
        group.setApiURLfromRequestIfNotSet();
        return {
            group: {
                ...group.get(),
                permission: group.permission,
                clients: getAll(group.clients),
                admins: getAll(group.admins),
            },
            allocations: getAll(allocations, s => ({
                creator: s.creator.get(),
            })),
        };
    }

    @Post(':id')
    @NeedsAdmin
    async setGroupDescription(@Param('id') groupId, @Body('contactDetails') contactDetails) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.owner);
        group.contactDetails = contactDetails;
        await group.save();
        throw redirect('/admin/group/' + group.id);
    }

    @Get(':id/client/:clientId')
    @Render('admin/client')
    @NeedsAdmin
    async viewClient(@Param('id') groupId, @Param('clientId') clientId) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.view);
        const client = await this.groupService.getClientInGroup(group, clientId);
        const journals = await this.clientService.getJournalEntries(client);
        return {
            group: {...group.get()}, client: {...client.get(), journals},
        };
    }

    @Get(':id/client/:clientId/journal/:journalId/entry/:entryId/raw')
    @NeedsAdmin
    async viewEntry(@Param('id') groupId, @Param('clientId') clientId, @Param('journalId') journalId: number, @Param('entryId') entryId: number, @Res() response) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.view);
        const client = await this.groupService.getClientInGroup(group, clientId);
        const url = await this.journalService.getMediaUrl(client, journalId, entryId);
        response.redirect(303, url);
    }

    @Page('registrationSheet')
    @Get(':id/registrationSheet')
    @NeedsAdmin
    async registrationSheet(@Param('id') groupId) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.edit);
        return {
            group: {...group.get(), permission: group.permission, clients: getAll(group.clients)}};
    }

    @Post('')
    @Render('admin/error')
    @NeedsAdmin
    async createGroup(@Body('name') name: string, @Body('code') code: string) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.createGroupForUser(admin, {name, code});
        throw redirect('/admin/group/' + group.id);
    }

    @Post(':id/admins')
    @Render('admin/error')
    @NeedsAdmin
    async addAdmin(@Param('id') groupId, @Body('email') email: string, @Body('permission') permission: AccessLevel) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.owner);

        await this.groupService.addAdmin(group,{email, permission});
        throw redirect('/admin/group/' + groupId);
    }

    @Post(':id/clients')
    @Render('admin/error')
    @NeedsAdmin
    async addParticipants(@Param('id') groupId, @Body('participants') participants: string) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.edit);

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

    @Post(':id/client/:clientId/status')
    @Render('admin/error')
    @NeedsAdmin
    async setClientStatus(@Param('id') groupId, @Param('clientId') clientId, @Body('newStatus') newStatus: ClientStatus) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.edit);
        const client = await this.groupService.getClientInGroup(group, clientId);
        client.status = newStatus;
        await client.save();
        throw redirect('/admin/group/' + groupId);
    }

    @Post(':id/client/:clientId/reset')
    @Render('admin/reset')
    @NeedsAdmin
    async resetClient(@Param('id') groupId, @Param('clientId') clientId, @Body('confirmed') confirmed: boolean) {
        const group = await this.hasGroupAccess(groupId, AccessLevel.edit);
        const client = await this.groupService.getClientInGroup(group, clientId);
        if (!confirmed) {
            return {participantID: client.participantID, confirmationNeeded: true};
        }
        const resetToken = await this.clientService.resetClient(client);
        return {
            resetToken: {code: resetToken.code, expiresAt: resetToken.expiresAt},
            participantID: client.participantID,
            group: {id: group.id, name: group.name},
        };
    }

    private async hasGroupAccess(groupId: number, neededLevel: AccessLevel) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        checkAccessLevel(neededLevel, group);
        return group;
    }
}
