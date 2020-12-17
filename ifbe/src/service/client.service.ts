import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';

import { Group } from '../model/group.model';
import { Client, ClientStatus } from '../model/client.model';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class ClientService {
    constructor(@InjectModel(Group) private groupModel: typeof Group,
                @InjectModel(Client) private clientModel: typeof Client,
    ) {}

    async register(group: Group, participantID: string) {
        const client = await this.clientModel.findOne({where: {
            participantID,
            groupId: group.id,}});
        if (client) {
            if (client.status !== ClientStatus.added) {
                throw new ForbiddenException('That participant is already registered.')
            }
            client.token = uuidv4();
            client.status = ClientStatus.registered;
            return client.save();
        } else {
            throw new NotFoundException('Unknown participant ID');
        }
    }

    async fetchRegisteredClient(clientId: number) {
        const client = await this.clientModel.findByPk(clientId);
        if (!client.token || client.token === '' || client.status !== ClientStatus.registered) {
            return null;
        }
        return client;
    }
}
