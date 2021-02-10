import { InjectModel } from "@nestjs/sequelize";

import { Admin, AdminLevel } from "../model/admin.model";
import { User } from "./user.service";
import { AccessLevel } from "../model/accessLevels";
import { Survey } from "../model/survey.model";
import { SurveyPermission } from "../model/surveyPermission.model";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { getOrElse } from "../util/functional";

type SurveyWithAccessLevel = Survey & { permission: AccessLevel };

export class SurveyService {
    constructor(@InjectModel(Survey) private surveyModel: typeof Survey,
                @InjectModel(Admin) private adminModel: typeof Admin,
                @InjectModel(SurveyPermission) private surveyPermissionModel: typeof SurveyPermission,
    ) {}

    async surveysForUser(admin: User) {
        const surveys = await this.surveyModel.findAll({
            include: [{model: Admin, as: 'admins', where: {id: admin.id}, required: admin.level !== AdminLevel.super }],
         });
        return surveys.map((s: SurveyWithAccessLevel) => {
            const {admins} = s;
            let permission = AccessLevel.view;
            if (admins.length === 0) {
                // Super-admin, so grant full permission
                permission = AccessLevel.owner;
            } else {
                // There can only be one by the where clause above
                if (admins[0].id !== admin.id) {
                    throw new Error("Unexpected admin id:" + admins[0].id);
                }
                permission = admins[0].SurveyPermission.level;
            }
            s.permission = permission;
            return s;
        });
    }

    async createSurvey(user: User, name: string) {
        return this.surveyModel.create({name, updaterId: user.id, permissions: [{adminId: user.id, level: AccessLevel.owner}]},
            {include: [{all: true}]});
    }

    async surveyForUser(admin: User, surveyId: number) {
        const survey = await this.surveyModel.findByPk(surveyId, {
            include: [
                {model: Admin, as: 'admins'},
                {model: Admin, as: 'updater'},
            ],
        }) as SurveyWithAccessLevel; // Fill this in a minute
        if (survey === null) {
            throw new NotFoundException("No such survey found");
        }
        // Check admin has access
        const permission = admin.level === AdminLevel.super ? AccessLevel.owner :
            getOrElse(survey.admins.find(a => a.id === admin.id), () => {
                throw new ForbiddenException("You do not have access to that survey");
            }).SurveyPermission.level;
        survey.permission = permission;
        return survey;
    }

    async addAdmin(survey: Survey, newUser: { permission: AccessLevel; email: string }) {
        const existing = survey.admins.find(a => a.email === newUser.email);
        if (existing) {
            // Check for at least one other owner
            if (existing.SurveyPermission.level === AccessLevel.owner) {
                if (survey.admins.filter(a => a.SurveyPermission.level === AccessLevel.owner).length === 1) {
                    throw new ForbiddenException("You cannot remove the only owner.")
                }
            }
            if (!newUser.permission) {
                await existing.SurveyPermission.destroy();
            } else {
                existing.SurveyPermission.level = newUser.permission;
                await existing.SurveyPermission.save();
            }
        } else {
            const user = await this.adminModel.findOne({where: {email: newUser.email}, rejectOnEmpty: true});
            await this.surveyPermissionModel.create({adminId: user.id, surveyId: survey.id, level: newUser.permission});
        }
    }
}
