import {
    Body,
    Controller,
    ForbiddenException, Get,
    Headers,
    Injectable,
    NotFoundException,
    Param,
    Post,
    Req, Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { RegisterClientDto } from '../dto/client.create.dto';
import { JournalContent, JournalService } from '../service/journal.service';
import { ClientService } from '../service/client.service';
import { GroupService } from '../service/group.service';
import { Client } from '../model/client.model';
import { extractGroupJoinDTO } from './group.controller';
import { Group } from '../model/group.model';
import { InjectModel } from '@nestjs/sequelize';
import { Answer } from '../model/answer.model';

function extractCheckClientDTO(client: Client) {
    return {
        participantID: client.participantID,
    };
}

@Controller('api/client')
@Injectable()
export class ClientController {
    constructor(
        private journalService: JournalService,
        private clientService: ClientService,
        private groupService: GroupService,
        @InjectModel(Answer)
        private answerModel: typeof Answer,
) {}

    @Post('check')
    async check(@Body() clientDto: RegisterClientDto) {
        const group = await this.groupService.groupFromCode(clientDto.groupCode);
        if (!group) {
            throw new NotFoundException(clientDto.groupCode, 'Unknown group code');
        }
        const client = await this.clientService.check(group, clientDto.participantID);
        return extractCheckClientDTO(client);
    }

    @Post('')
    async register(@Body() clientDto: RegisterClientDto) {
        const group = await this.groupService.groupFromCode(clientDto.groupCode);
        if (!group) {
            throw new NotFoundException(clientDto.groupCode, 'Unknown group code');
        }
        const client = await this.clientService.register(group, clientDto.participantID);
        return this.extractNewClientDTO(client, group);
    }

    @Get('reset/token/:token')
    async viewResetToken(@Param('token') token: string, @Headers('X-Requested-With') requestedWith: string, @Res() res) {
        if (requestedWith && requestedWith.startsWith('Inspiring Futures App')) {
            // Process the reset
            const client = await this.clientService.viewResetToken(token);
            if (client) {
                const group = await client.$get('group');
                res.json({
                    client: extractCheckClientDTO(client),
                    resetToken: token,
                    group: extractGroupJoinDTO(group),
                });
            } else {
                res.status(400).json({
                    error: 'Code already used or expired',
                });
            }
        } else {
            // Tell the user they need to scan the token on their phone.
            res.render('client/resetTokenOutside', {resetURL: res.locals.url});
        }
    }

    @Post('reset/token/:token')
    async consumeResetToken(@Param('token') token: string, @Res() res) {
        // Process the reset
        const client = await this.clientService.processResetToken(token);
        if (client) {
            const group = await client.$get('group');
            res.json({
                client: await this.extractNewClientDTO(client, group),
                group: extractGroupJoinDTO(group),
            });
        } else {
            res.status(400).json({
                error: 'Code already used or expired',
            });
        }
    }

    // Regexp has to be written this way (instead of just .*) to avoid some kind of filtering inside Express
    @Get('registration/token/:groupCode/:participantID([^]+)')
    async viewRegistrationToken(@Param('groupCode') groupCode: string, @Param('participantID') participantID: string, @Headers('X-Requested-With') requestedWith: string, @Res() res) {
        if (requestedWith && requestedWith.startsWith('Inspiring Futures App')) {
            // Process the reset
            const {client, group} = await this.clientService.extractRegistrationToken(groupCode, participantID);
            res.json({
                client: extractCheckClientDTO(client),
                group: extractGroupJoinDTO(group),
            });
        } else {
            // Tell the user they need to scan the token on their phone.
            res.render('client/resetTokenOutside', {resetURL: res.locals.url});
        }
    }

    @Post(':clientId/journal')
    async addJournal(@Param('clientId') clientId: number, @Body() journal: JournalContent, @Headers('X-Token') token: string) {
        const client = await this.authenticateClient(clientId, token);
        return await this.journalService.add(client, journal);
    }

    @Post(':clientId/journal/:journalId/media')
    @UseInterceptors(FileInterceptor('upload'))
    async uploadMedia(@Param('clientId') clientId: number, @Param('journalId') journalId: number, @Headers('X-Token') token: string, @UploadedFile() upload, @Body('url') url: string) {
        const client = await this.authenticateClient(clientId, token);
        const journal = await this.journalService.get(client, journalId);

        return this.journalService.updateEntry(journal, url, upload);
    }

    @Get(':clientId/incompleteSurveys')
    async getIncompleteSurveys(@Param('clientId') clientId: number, @Headers('X-Token') token: string) {
        const client = await this.authenticateClient(clientId, token);
        const surveys = await this.groupService.getOneOffSurveysForGroup(client.groupId);

        // Filter active surveys
        const now = new Date();
        const activeSurveys = surveys.filter(allocation => {
            return allocation.openAt === null || now >= allocation.openAt;

        });

        // Create answers for those that are missing
        const allocationIds = activeSurveys.map(allocation => allocation.id);
        const answers = await this.answerModel.findAll({where: {
            surveyAllocationId: allocationIds,
            clientId: client.id,
        }});
        const answerMap = {};
        answers.forEach(answer => {
            answerMap[answer.surveyAllocationId] = answer;
        });

        const toCreate = allocationIds.filter(id => !answerMap[id]);

        if (toCreate.length > 0) {
            const newAnswers = await this.answerModel.bulkCreate(toCreate.map(allocationId => ({
                surveyAllocationId: allocationId,
                clientId: client.id,
            })), {
                returning: true,
            });
            newAnswers.forEach(answer => {
                answerMap[answer.surveyAllocationId] = answer;
            });
        }

        const results = [];
        activeSurveys.forEach(allocation => {
            const answer = answerMap[allocation.id];
            if (answer.answer && answer.answer.complete) {
                return;
            }
            results.push({
                answerId: answer.id,
                closeAt: allocation.closeAt,
                content: allocation.survey.content.content,
            });
        });

        return results;
    }

    @Post(':clientId/answer/:answerId')
    async answerSurvey(@Param('clientId') clientId: number, @Param('answerId') answerId: number, @Headers('X-Token') token: string, @Body() answers: any, @Res() res) {
        const client = await this.authenticateClient(clientId, token);
        const answer = await this.answerModel.findByPk(answerId);
        if (answer.clientId !== client.id) {
            throw new ForbiddenException("Answer doesn't belong to this client.");
        }
        if (answer.answer.complete === true) {
            throw new ForbiddenException("Already answered this survey.");
        }
        answer.answer = {
            complete: true,
            answers,
        };
        await answer.save();
        res.sendStatus(201);
    }


    private async authenticateClient(clientId: number, token: string) {
        if (token === '' || !token) {
            throw new ForbiddenException("Token is missing.");
        }
        const client = await this.clientService.fetchRegisteredClient(clientId);
        if (!client || client.token !== token) {
            // If the client is not registered or there is some other problem, we just say the token
            // is incorrect to hide information from the client.
            throw new ForbiddenException("Token is incorrect.");
        }
        return client;
    }

    private async extractNewClientDTO(client: Client, group: Group) {
        const initialSurveyAllocation = await group.$get('initialSurvey', {include: ["survey"]});
        let answer: Answer | undefined;

        if (initialSurveyAllocation) {
            [answer] = await this.answerModel.findOrCreate({where: {clientId: client.id, surveyAllocationId: initialSurveyAllocation.id}});
        }

        return {
            id: client.id,
            participantID: client.participantID,
            token: client.token,
            initialSurveyToAnswer: initialSurveyAllocation ? {
                answerId: answer.id,
                content: initialSurveyAllocation.survey.content.content,
            } : undefined,
        };
    }
}
