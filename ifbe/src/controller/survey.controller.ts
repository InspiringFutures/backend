import {
    Body,
    Get,
    Injectable,
    Param,
    Post, Query,
    Render,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Controller, Page } from '../util/autopage';
import { Admin } from '../model/admin.model';
import { NeedsAdmin } from '../util/guard';
import { redirect } from '../util/redirect';
import { UserService } from '../service/user.service';
import { getAll } from '../util/functional';
import { AccessLevel, checkAccessLevel } from "../model/accessLevels";
import { SurveyService } from "../service/survey.service";
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

    @Get('list')
    @NeedsAdmin
    async list() {
        const user = this.userService.currentUser()!;
        const surveys = await this.surveyService.surveysForUser(user);
        return surveys.map(survey => ({
            id: survey.id,
            name: survey.name,
        }));
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
        return {
            id: survey.id,
            name: survey.name,
            updatedAt: survey.updatedAt,
            updatedBy: survey.updater.name,
            content: survey.content.content,
        };
    }

    @Post(':id/content')
    @NeedsAdmin
    async setContent(@Param('id') surveyId, @Query('autoSave') autoSaveStr, @Body() content) {
        const admin = this.userService.currentUser()!;
        const autoSave = autoSaveStr && autoSaveStr === 'true';
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.edit);

        await survey.$create('version', {content: content, creatorId: admin.id});

        if (!autoSave) {
            survey.content = content;
            await survey.save();
        }
        return {success: true, message: "Saved successfully"};
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
