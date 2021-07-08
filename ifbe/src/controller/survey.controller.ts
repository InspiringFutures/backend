import {
    BadRequestException,
    Body,
    flatten,
    Get,
    Injectable,
    Param,
    ParseIntPipe,
    Post,
    Render, Res,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { createArrayCsvStringifier } from 'csv-writer';


import { Controller, Page } from '../util/autopage';
import { Admin } from '../model/admin.model';
import { NeedsAdmin } from '../util/guard';
import { redirect } from '../util/redirect';
import { UserService } from '../service/user.service';
import { getAll, getWithPermission } from '../util/functional';
import { AccessLevel, checkAccessLevel } from '../model/accessLevels';
import { SurveyService } from '../service/survey.service';
import { Survey } from '../model/survey.model';
import { Group } from '../model/group.model';
import { GroupService } from '../service/group.service';
import { SurveyAllocation, SurveyAllocationType } from '../model/surveyAllocation.model';
import { extractAnswer, formatDatetime, UnpackedQuestion, unpackQuestions } from '../util/survey';
import { Journal } from '../model/journal.model';

function parseDateOrNull(date: string, endOfDay: boolean) {
    return date && date !== '' ? new Date(`${date}${endOfDay ? 'T23:59:59Z' : 'T00:00:00Z'}`) : null;
}

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
        private readonly groupService: GroupService,
        @InjectModel(SurveyAllocation)
        private surveyAllocationModel: typeof SurveyAllocation,
        @InjectModel(Journal)
        private journalModel: typeof Journal,
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
        const user = this.userService.currentUser()!;
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.view);
        const allocations = await survey.$get('allocations', {include: [Admin, Group], order: ['groupId', ['openAt', 'asc NULLS FIRST'], 'id']});
        const groups = await this.groupService.groupsForUser(user, AccessLevel.edit);
        return {
            survey: {
                ...survey.get(),
                updater: survey.updater.get(),
                permission: survey.permission,
                admins: getAll(survey.admins),
                allocations: getAll(allocations, s => ({
                    group: s.group.get(),
                    creator: s.creator.get(),
                })),
            },
            groups: getWithPermission(groups),
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
            autoSave: survey.content.autoSave,
        };
    }

    @Post(':id/content')
    @NeedsAdmin
    async setContent(@Param('id') surveyId, @Body() content) {
        const admin = this.userService.currentUser()!;
        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.edit);

        await survey.$create('version', {content: content, creatorId: admin.id, autoSave: content.autoSave});

        survey.content = content;
        survey.updaterId = admin.id;
        await survey.save();

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

    @Post(':id/allocation')
    @NeedsAdmin
    async addAllocation(@Param('id') surveyId,
                        @Body('type') type: SurveyAllocationType,
                        @Body('openAt') openAt,
                        @Body('closeAt') closeAt,
                        @Body('note') note: string,
                        @Body('groupId', ParseIntPipe) groupId: number) {
        if (type === 'initial') {
            openAt = null;
            closeAt = null;
        } else if (type === 'oneoff') {
            openAt = parseDateOrNull(openAt, false);
            closeAt = parseDateOrNull(closeAt, true);
        } else {
            throw new BadRequestException("Unknown allocation type");
        }

        const admin = this.userService.currentUser()!;

        const survey = await this.hasSurveyAccess(surveyId, AccessLevel.view);
        const group = await this.hasGroupAccess(groupId, AccessLevel.edit);
        await this.surveyService.addAllocation(survey.id, group.id, type, openAt, closeAt, note, admin);
        throw redirect('/survey/' + surveyId);
    }

    @Post(':id/allocation/:allocationId')
    @NeedsAdmin
    async editAllocation(@Param('id', ParseIntPipe) surveyId: number,
                         @Param('allocationId', ParseIntPipe) allocationId:  number,
                         @Body('openAt') openAt,
                         @Body('closeAt') closeAt,
                         @Body('note') note: string) {
        const admin = this.userService.currentUser()!;

        const allocation = await this.surveyAllocationModel.findByPk(allocationId);
        if (allocation === null) {
            throw new BadRequestException("No such allocation");
        }
        if (allocation.surveyId !== surveyId) {
            throw new BadRequestException("Non-matching survey ID");
        }
        await this.hasSurveyAccess(allocation.surveyId, AccessLevel.view);
        await this.hasGroupAccess(allocation.groupId, AccessLevel.edit);

        allocation.note = note;
        if (allocation.type === 'oneoff') {
            allocation.openAt = parseDateOrNull(openAt, false);
            allocation.closeAt = parseDateOrNull(closeAt, true);
        }

        await allocation.save();
        throw redirect('/survey/' + surveyId);
    }

    @Post(':id/allocation/:allocationId/delete')
    @NeedsAdmin
    async deleteAllocation(@Param('id', ParseIntPipe) surveyId: number, @Param('allocationId', ParseIntPipe) allocationId: number) {
        const admin = this.userService.currentUser()!;

        const allocation = await this.surveyAllocationModel.findByPk(allocationId);
        if (allocation.surveyId !== surveyId) {
            throw new BadRequestException("Non-matching survey ID");
        }
        await this.hasSurveyAccess(allocation.surveyId, AccessLevel.view);
        await this.hasGroupAccess(allocation.groupId, AccessLevel.edit);

        await allocation.destroy();
        throw redirect('/survey/' + surveyId);
    }

    @Get('(:id/allocation/)?:allocationId/results')
    @NeedsAdmin
    @Page('viewResults')
    async viewResults(@Param('allocationId', ParseIntPipe) allocationId:  number) {
        const admin = this.userService.currentUser()!;

        const allocation = await this.surveyAllocationModel.findByPk(allocationId, {include: ["survey", "answers"]});
        if (allocation === null) {
            throw new BadRequestException("No such allocation");
        }
        await this.hasSurveyAccess(allocation.surveyId, AccessLevel.view);
        const group = await this.hasGroupAccess(allocation.groupId, AccessLevel.view);

        // Get group members
        const clients = await group.$get('clients');

        // Get journal answers
        const allJournals = await this.journalModel.findAll({where: {answerId: allocation.answers.map(a => a.id)}, include: ["entries"]});
        const journals: {[answerId: string]: {[questionId: string]: Journal[]}} = {};
        allJournals.forEach((journal) => {
            const answerId = journal.answerId;
            const journalAnswer = journals[answerId] ?? (journals[answerId] = {});
            const [questionId] = journal.clientJournalId.split('-', 1);
            const journalQuestion = journalAnswer[questionId] ?? (journalAnswer[questionId] = []);
            journalQuestion.push(journal);
        });

        // Render
        return {
            group,
            clients,
            allocation,
            journals,
            //answers: allocation.answers,
        };
    }

    @Get('(:id/allocation/)?:allocationId/results.csv')
    @NeedsAdmin
    async viewResultsCSV(@Param('allocationId', ParseIntPipe) allocationId:  number, @Res() res) {
        const {group, clients, allocation} = await this.viewResults(allocationId);

        const questions: UnpackedQuestion[] = unpackQuestions(allocation);

        const clientMap = {};
        clients.forEach(client => clientMap[client.id] = client);

        const cols = flatten(questions.map((q) => {
            if (q.colCount > 1) {
                let prefix = q.title ? q.title.trim() : "";
                if (prefix != '') {
                    if (!prefix.endsWith(':')) {
                        prefix += ':';
                    }
                    prefix += " ";
                }
                return [
                    ...(q.subQuestions || []).map((sub) => prefix + sub),
                    ...q.commentsPrompt ? [prefix + "Other comments"] : [],
                    ...q.allowOther ? [q.title, prefix + `Other (choice ${q.choices.length + 1})`] : [],
                ];
            } else {
                return [q.title];
            }
        }));
        cols.unshift('Participant ID', 'Completed', 'Completed at');

        const csvStringifier = createArrayCsvStringifier({
            header: cols,
            recordDelimiter: "\r\n",
        });

        let name = `${allocation.survey.name} - ${group.name}`;
        if (allocation.openAt) {
            name += ` - ${allocation.openAt.toLocaleDateString()}`;
        }
        if (allocation.closeAt) {
            name += ` - ${allocation.closeAt.toLocaleDateString()}`;
        }
        name += '.csv';
        name = name.replace(/[^a-zA-Z0-9-. _]/g, '.');

        res.attachment(name).send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(
            allocation.answers.map((answer) => {
                const answerMap = answer.answer.answers;
                const row = [
                    clientMap[answer.clientId].participantID,
                    answer.answer.complete ? 'yes' : 'no',
                ];
                if (answer.answer.complete) {
                    row.push(formatDatetime(answer.updatedAt));
                    questions.forEach((q) => {
                        const answer = answerMap[q.id];
                        row.push(...extractAnswer(q, answer));
                    });
                }
                return row;
            })
        ));
    }

    private async hasSurveyAccess(surveyId: number, neededLevel: AccessLevel) {
        const admin = this.userService.currentUser()!;
        const survey = await this.surveyService.surveyForUser(admin, surveyId);
        checkAccessLevel(neededLevel, survey);
        return survey;
    }

    private async hasGroupAccess(groupId: number, neededLevel: AccessLevel) {
        const admin = this.userService.currentUser()!;
        const group = await this.groupService.groupForUser(admin, groupId);
        checkAccessLevel(neededLevel, group);
        return group;
    }
}
