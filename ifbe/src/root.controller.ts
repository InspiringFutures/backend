import { Get, Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import SwiftClient from 'openstack-swift-client-region';

import { Group } from "./model/group.model";
import { Controller, Page } from './util/autopage';
import { UserService } from "./service/user.service";
import { redirect } from "./util/redirect";

@Controller('')
@Injectable()
export class RootController {
    constructor(
        @InjectModel(Group)
        private groupModel: typeof Group,
        private userService: UserService,
    ) {}

    @Get()
    async home() {
        const user = this.userService.currentUser();
        if (user) {
            throw redirect('/admin');
        }
        throw redirect('/login');
    }

    @Get('status')
    async root() {
        const groupCount = await this.groupModel.count();
        const authenticator = new SwiftClient.SwiftAuthenticator(process.env.SWIFT_URL, process.env.SWIFT_USER, process.env.SWIFT_PASSWORD);
        const swiftClient = new SwiftClient(authenticator);

        const swiftStatus = await swiftClient.info();
        return "<pre>" + "Group count: " + groupCount + "\r\n" + "Swift status: " + JSON.stringify(swiftStatus, null, 4) + "</pre>";
    }
}
