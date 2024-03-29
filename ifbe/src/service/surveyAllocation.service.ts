import { Injectable } from '@nestjs/common';
import { Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectModel } from "@nestjs/sequelize";

import { fn, Op } from 'sequelize';

import { Survey } from "../model/survey.model";
import { SurveyAllocation } from '../model/surveyAllocation.model';
import { Client } from '../model/client.model';
import { PushNotificationService } from './pushNotification.service';
import { Answer } from '../model/answer.model';

const PUSH_NOTIFICATIONS_JOB = 'pushNotifications';
const PUSH_NOTIFICATIONS_DEFAULT_DELAY = 60 * 1000;

@Injectable()
export class SurveyAllocationService {
    constructor(private readonly schedulerRegistry: SchedulerRegistry,
                private readonly pushNotificationService: PushNotificationService,
                @InjectModel(Survey) private surveyModel: typeof Survey,
                @InjectModel(SurveyAllocation) private surveyAllocationModel: typeof SurveyAllocation,
                @InjectModel(Client) private clientModel: typeof Client,
                @InjectModel(Answer) private answerModel: typeof Answer,
    ) {}

    @Interval('pushNotificationsWatchdog', 60 * 15 * 1000)
    pushNotificationsWatchdog() {
        if (!this.schedulerRegistry.doesExists('timeout', PUSH_NOTIFICATIONS_JOB)) {
            console.log("WATCHDOG had to restart ", PUSH_NOTIFICATIONS_JOB);
            this.handlePushes();
        }
    }

    @Timeout(PUSH_NOTIFICATIONS_JOB, PUSH_NOTIFICATIONS_DEFAULT_DELAY)
    async handlePushes() {
        // Get the list of surveyAllocations that:
        //   started or have no start date;
        //   not ended or have no end date; and
        //   have
        //     no pushedAt date; or
        //     a pushedAt date before the dueAt date, a dueAt date, and a pushedAt date over 24 hours ago (for rate-limiting); and
        //   are a oneoff survey.
        const nowMinus24hours = new Date();
        nowMinus24hours.setDate(nowMinus24hours.getDate() - 1);
        const allocationsToPush = await this.surveyAllocationModel.findAll({
            where: {
                [Op.and]: [
                    {[Op.or]: [{openAt: null}, {openAt: {[Op.lt]: fn('NOW')}}]},
                    {[Op.or]: [{closeAt: null}, {closeAt: {[Op.gt]: fn('NOW')}}]},
                    {[Op.or]: [{pushedAt: null}, {[Op.and]: [
                        {pushedAt: {[Op.lt]: {[Op.col]: 'dueAt'}}},
                        {dueAt: {[Op.lt]: fn('NOW')}},
                        {pushedAt: {[Op.lt]: nowMinus24hours}},
                    ]}]},
                    {type: 'oneoff'},
                ],
            },
            limit: 100,
        });

        await Promise.all(allocationsToPush.map((allocation) => this.handleAllocation(allocation)));

        if (this.schedulerRegistry.doesExists('timeout', PUSH_NOTIFICATIONS_JOB)) {
            this.schedulerRegistry.deleteTimeout(PUSH_NOTIFICATIONS_JOB);
        }
        this.schedulerRegistry.addTimeout(PUSH_NOTIFICATIONS_JOB, setTimeout(() => this.handlePushes(), PUSH_NOTIFICATIONS_DEFAULT_DELAY));
    }

    private async handleAllocation(allocation: SurveyAllocation) {
        // Get the clients for allocation that have a pushToken...
        const clients = await this.clientModel.findAll({where: {groupId: allocation.groupId, pushToken: { [Op.ne]: null }}});

        // ...and haven't answered
        const answers = await this.answerModel.findAll({where: {surveyAllocationId: allocation.id}});
        const answeredClientIds = new Set(answers.filter(answer => answer.answer.complete).map(answer => answer.clientId));
        const unansweredClients = clients.filter(client => !answeredClientIds.has(client.id));

        const reminder = allocation.dueAt && allocation.dueAt.getTime() < new Date().getTime();

        const notification = {
            title: reminder ? 'Survey reminder' : 'New survey',
            body: 'Please do this survey for Inspiring Futures',
            custom: {
                customData: {
                    type: 'newSurvey',
                    surveyAllocationId: allocation.id,
                },
            },
        };

        const result = await this.pushNotificationService.send(unansweredClients.map((client) => client.pushToken), notification);

        if (result.some((r) => r.success > 0) || result.every((r) => r.failure === 0)) {
            // Log this was done
            allocation.pushedAt = new Date();
            await allocation.save();
            console.log('Push done for', allocation.id, JSON.stringify(result, null, 2), unansweredClients.map(c => [c.id, c.pushToken]));
            return true;
        } else {
            console.log('Push problem for', allocation.id, JSON.stringify(result, null, 2), unansweredClients.map(c => [c.id, c.pushToken]));
            console.log('Push will be retried for', allocation.id);
            return false;
        }
    }
}
