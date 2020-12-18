import { InjectModel } from '@nestjs/sequelize';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Group } from '../model/group.model';
import { Client, ClientStatus } from '../model/client.model';
import { Token, TokenType } from '../model/token.model';

const ONE_DAY = 1000 * 60 * 60 * 24;

export class ClientService {
    constructor(@InjectModel(Group) private groupModel: typeof Group,
                @InjectModel(Client) private clientModel: typeof Client,
                @InjectModel(Token) private tokenModel: typeof Token,
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

    async resetClient(client: Client) {
        // Set a new token
        client.token = uuidv4();
        await client.save();

        // Make a reset token and put it in the tokens table for them to login
        const resetToken = uuidv4();

        return this.tokenModel.create({
            type: TokenType.reset,
            code: resetToken,
            expiresAt: new Date(Date.now() + ONE_DAY),
            for: client.token,
        });
    }

    async processResetToken(resetToken: string) {
        const token = await this.tokenModel.findOne({where: {
            type: TokenType.reset,
            code: resetToken,
        }});

        if (!token) return null;

        if (new Date() > token.expiresAt) {
            throw new ForbiddenException('That token has expired.');
        }

        await token.destroy();

        return this.clientModel.findOne({where: {token: token.for}});
    }
}
