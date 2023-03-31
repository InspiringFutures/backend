import { InjectModel } from '@nestjs/sequelize';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

import { Group } from '../model/group.model';
import { Client, ClientStatus } from '../model/client.model';
import { Token, TokenType } from '../model/token.model';
import { GroupService } from './group.service';
import { Journal } from '../model/journal.model';

const ONE_DAY = 1000 * 60 * 60 * 24;

// Bech32 without complex checksum
const ALPHABET = 'QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L';
const ALPHABET_MAP = {};
for (let z = 0; z < ALPHABET.length; z++) {
    const x = ALPHABET.charAt(z);
    ALPHABET_MAP[x] = z;
}

function generateCheckForToken(rest: {reduce: <T>(f: (acc: T, entry: number) => T, initial: T) => T}) {
    return rest.reduce((acc, x) => {
        return ((acc * 1057) ^ x) % 65521;
    }, 1) & 31;
}

function makeToken() {
    const fiveBitWords = crypto.randomBytes(18).map((x) => x & 31);
    const check = generateCheckForToken(fiveBitWords);
    return fiveBitWords.reduce((acc, n, index) => acc + (index % 5 === 4 ? '-' : '') + ALPHABET.charAt(n), 'R') + ALPHABET.charAt(check);
}

export function checkToken(token: string): string | false | undefined {
    const trimmed = token.trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/[1iIl]/g, 'L')
        .replace(/[oO0]/g, '0')
        .toUpperCase()
    ;
    if (trimmed.length !== 20) {
        return;
    }
    if (trimmed[0] !== 'R') {
        return;
    }
    const decoded = trimmed.substr(1).split('').map(char => ALPHABET_MAP[char]);
    const last = decoded.pop();
    const check = generateCheckForToken(decoded);
    if (last !== check) {
        return false;
    }
    const groups = [];
    for (let i = 0; i < 4; i++) {
        groups[i] = trimmed.substr(i * 5, 5);
    }
    return groups.join("-");
}

export class ClientService {
    constructor(@InjectModel(Group) private groupModel: typeof Group,
                @InjectModel(Client) private clientModel: typeof Client,
                @InjectModel(Token) private tokenModel: typeof Token,
                @InjectModel(Journal) private journalModel: typeof Journal,
                private groupService: GroupService,
    ) {}

    async check(group: Group, participantID: string) {
        const client = await this.clientModel.findOne({where: {
                participantID,
                groupId: group.id,}});
        if (client) {
            if (client.status !== ClientStatus.added) {
                throw new ForbiddenException('That participant is already registered.')
            }
            return client;
        } else {
            throw new NotFoundException('Unknown participant ID');
        }
    }

    async register(group: Group, participantID: string) {
        const client = await this.check(group, participantID);
        client.token = uuidv4();
        client.status = ClientStatus.registered;
        return client.save();
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
        const resetToken = makeToken();

        return this.tokenModel.create({
            type: TokenType.reset,
            code: resetToken,
            expiresAt: new Date(Date.now() + ONE_DAY),
            for: client.token,
        });
    }

    async viewResetToken(resetToken: string) {
        const token = await this.tokenModel.findOne({
            where: {
                type: TokenType.reset,
                code: resetToken,
            }
        });

        if (!token) return null;

        if (new Date() > token.expiresAt) {
            throw new ForbiddenException('That token has expired.');
        }

        return this.clientModel.findOne({where: {token: token.for}});
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

    async extractRegistrationToken(groupCode: string, participantId: string) {
        const group = await this.groupService.groupFromCode(groupCode);
        const client = await this.check(group, participantId);
        return {group, client};
    }

    async getJournalEntries(client: Client) {
        const journals: Journal[] = await this.journalModel.findAll({where: {clientId: client.id, answerId: null}, include: [{all: true}]});
        const raw = journals.map((journal) => {
            return {
                ...journal.get(),
                entries: journal.entries.map(je => je.get()),
            };
        });
        raw.sort((a, b) => {
            // @ts-ignore
            return a.createdAt - b.createdAt;
        });
        return raw;
    }
}
