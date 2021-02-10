import {
    Body,
    ForbiddenException,
    Get,
    Injectable,
    Param,
    Post,
    Render,
    Req, Res,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ValidationError } from 'sequelize';

import { Controller, Page } from '../util/autopage';
import { Admin, AdminLevel } from '../model/admin.model';
import { NeedsAdmin, NeedsSuperAdmin } from '../util/guard';
import { redirect } from '../util/redirect';
import { UserService } from '../service/user.service';
import { GroupService } from '../service/group.service';
import { getAll } from '../util/functional';
import { ClientStatus } from '../model/client.model';
import { ClientService } from '../service/client.service';
import { JournalService } from '../service/journal.service';
import { AccessLevel, AccessLevels, checkAccessLevel } from "../model/accessLevels";
import { SurveyService } from "../service/survey.service";
import { Model } from "sequelize-typescript";
import { Survey } from "../model/survey.model";

@Controller('survey')
@Injectable()
export class SurveyController {
    constructor(
        @InjectModel(Admin)
        private adminModel: typeof Admin,
        @InjectModel(Survey)
        private surveyModel: typeof Survey,
        private readonly userService: UserService,
        private readonly surveyService: SurveyService,
    ) {}

    @Post()
    @NeedsAdmin
    async create(@Body('surveyName') surveyName: string) {
        const user = this.userService.currentUser()!;
        const survey = await this.surveyService.createSurvey(user, surveyName);
        return redirect('/survey/' + survey.id + '/edit');
    }

    @Page('view')
    @Get(':id')
    @NeedsAdmin
    async view(@Param('id') surveyId) {
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.view);
        return {
            survey: {...survey.get(), updater: survey.updater.get(), permission: survey.permission, admins: getAll(survey.admins)}
        };
    }

    @Get(':id/content')
    @NeedsAdmin
    async getContent(@Param('id') surveyId) {
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.view);
        return JSON.parse(survey.content);
    }

    @Post(':id/admins')
    @Render('admin/error')
    @NeedsAdmin
    async addAdmin(@Param('id') surveyId, @Body('email') email: string, @Body('permission') permission: AccessLevel) {
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.owner);

        await this.surveyService.addAdmin(survey,{email, permission});
        throw redirect('/survey/' + surveyId);
    }

    private async hasSurveyAccess(surveyId: number, neededLevel: AccessLevel) {
        const admin = this.userService.currentUser()!;
        const survey = await this.surveyService.surveyForUser(admin, surveyId);
        checkAccessLevel(neededLevel, survey);
        return survey;
    }
}
