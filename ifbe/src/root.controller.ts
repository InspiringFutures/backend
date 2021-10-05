import { Get, Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Group } from "./model/group.model";
import { Controller, Page } from './util/autopage';
import { UserService } from "./service/user.service";
import { redirect } from "./util/redirect";
import { StorageService } from './service/storage.service';

@Controller('')
@Injectable()
export class RootController {
    constructor(
        @InjectModel(Group)
        private groupModel: typeof Group,
        private userService: UserService,
        private storageService: StorageService,
    ) {}

    @Get()
    async home() {
        const user = this.userService.currentUser();
        if (user) {
            throw redirect('/admin');
        }
        throw redirect('/login?uncache=' + Date.now());
    }

    @Get('status')
    async root() {
        const groupCount = await this.groupModel.count();
        const status = await (await this.storageService.status()).promise();
        console.log(`Status: ${groupCount} groups\r\nS3:`, status);
        return "OK";
    }
}
