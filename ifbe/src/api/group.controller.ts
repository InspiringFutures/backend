import { Controller, Get, HttpException, HttpStatus, Injectable, Param, Req } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Group } from "../model/group.model";

@Controller('group')
@Injectable()
export class GroupController {
    constructor(
        @InjectModel(Group)
        private groupModel: typeof Group,
    ) {}

    @Get('code/:group_code')
    async groupCode(@Param('group_code') group_code: string, @Req() request) {
        const group = await this.groupModel.findOne({where: {code: group_code}});
        if (!group) {
            throw new HttpException('Unknown group code', HttpStatus.NOT_FOUND);
        }
        if (group.apiUrl === null) {
            group.apiUrl = request.protocol + "://" + request.get('Host') + "/api/";
        }
        return {name: group.name, apiUrl: group.apiUrl};
    }
}
