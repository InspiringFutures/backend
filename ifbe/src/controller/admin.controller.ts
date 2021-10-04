import { Body, Get, Injectable, Post, Render } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Controller, Page } from '../util/autopage';
import { Admin, AdminLevel } from '../model/admin.model';
import { NeedsAdmin, NeedsSuperAdmin } from '../util/guard';
import { redirect } from '../util/redirect';
import { UserService } from '../service/user.service';
import { GroupService } from '../service/group.service';
import { getWithPermission } from '../util/functional';
import { SurveyService } from '../service/survey.service';

@Controller('admin')
@Injectable()
export class AdminController {
    constructor(
        @InjectModel(Admin)
        private adminModel: typeof Admin,
        private readonly userService: UserService,
        private readonly groupService: GroupService,
        private readonly surveyService: SurveyService,
    ) {}

    @Page()
    @NeedsAdmin
    async index() {
        const user = this.userService.currentUser()!;
        const groups = await this.groupService.groupsForUser(user);
        const surveys = await this.surveyService.surveysForUser(user);
        return {user, groups: getWithPermission(groups), surveys: getWithPermission(surveys)};
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
}
