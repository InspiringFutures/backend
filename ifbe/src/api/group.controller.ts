import { Controller, Get, HttpException, HttpStatus, Injectable, Param, Req } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Group } from "../model/group.model";

export function extractGroupJoinDTO(group: Group) {
    group.setApiURLfromRequestIfNotSet();
    return { name: group.name, apiURL: group.apiURL, code: group.code };
}

@Controller('api/group')
@Injectable()
export class GroupController {
    constructor(
        @InjectModel(Group)
        private groupModel: typeof Group,
    ) {}

    @Get('token/:group_code')
    async groupCode(@Param('group_code') group_code: string, @Req() request) {
        const group = await this.groupModel.findOne({where: {code: group_code}});
        if (!group) {
            throw new HttpException('Unknown group code', HttpStatus.NOT_FOUND);
        }
        return extractGroupJoinDTO(group);
    }
}
