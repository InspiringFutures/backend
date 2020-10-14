import { Readable } from 'stream';

import { Body, Controller, HttpException, HttpStatus, Injectable, Post, Req } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import { UniqueConstraintError } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import SwiftClient from 'openstack-swift-client-region';

import { Group } from "./group.model";
import { Client } from "./client.model";
import { CreateClientDto } from "./client.create.dto";

@Controller('api/client')
@Injectable()
export class ClientController {
    constructor(
        @InjectModel(Client)
        private clientModel: typeof Client,
        @InjectModel(Group)
        private groupModel: typeof Group,
    ) {}

    @Post('')
    async create(@Body() clientDto: CreateClientDto, @Req() request) {
        const group = await this.groupModel.findOne({where: {code: clientDto.groupCode}});
        if (!group) {
            throw new HttpException('Unknown group code', HttpStatus.NOT_FOUND);
        }
        const token = uuidv4();
        try {
            const client = await this.clientModel.create({
                                                             nickName: clientDto.nickName,
                                                             groupId: group.id,
                                                             token,
                                                         });

            const authenticator = new SwiftClient.SwiftAuthenticator('http://swift:8080/auth/v1.0', 'test:tester', 'testing');

            const swiftClient = new SwiftClient(authenticator);
            const _c = await swiftClient.create('CLIENT_TOKENS');

            const container = swiftClient.container('CLIENT_TOKENS');

            const _cc = await container.create(token, Readable.from(JSON.stringify(client)));
            const listing = await container.list();

            return {
                nickName: client.nickName,
                token: client.token,
                response: listing,
            };
        } catch (e) {
            if (e instanceof UniqueConstraintError) {
                throw new HttpException('That nickname is already taken', HttpStatus.CONFLICT);
            }
            throw e;
        }
    }
}
