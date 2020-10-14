import { Controller, Get, Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import SwiftClient from 'openstack-swift-client-region';

import { Group } from "./group.model";

@Controller('')
@Injectable()
export class RootController {
    constructor(
        @InjectModel(Group)
        private groupModel: typeof Group,
    ) {}

    @Get('')
    async root() {
        const groupCount = await this.groupModel.count();
        const authenticator = new SwiftClient.SwiftAuthenticator('http://swift:8080/auth/v1.0', 'test:tester', 'testing');
        const swiftClient = new SwiftClient(authenticator);

        const swiftStatus = await swiftClient.info();
        return "<pre>" + "Group count: " + groupCount + "\r\n" + "Swift status: " + JSON.stringify(swiftStatus, null, 4) + "</pre>";
    }
}
