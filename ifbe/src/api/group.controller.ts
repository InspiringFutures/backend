import { Controller, Get, HttpException, HttpStatus, Injectable, Param, Req } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Group } from "../model/group.model";
import { checkToken, ClientService } from '../service/client.service';
import { extractCheckClientDTO } from './client.controller';

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
        private clientService: ClientService,
    ) {}

    @Get('token/:group_code')
    async groupCode(@Param('group_code') group_code: string, @Req() request) {
        const group = await this.groupModel.findOne({where: {code: group_code}});
        if (!group) {
            const tidyToken = checkToken(group_code);
            if (tidyToken !== undefined) {
                if (tidyToken !== false) {
                    const client = await this.clientService.viewResetToken(tidyToken);
                    if (client) {
                        const group = await client.$get('group');
                        return {
                            client: extractCheckClientDTO(client),
                            resetToken: tidyToken,
                            group: extractGroupJoinDTO(group),
                        };
                    }
                }
                throw new HttpException({error: 'Incorrect reset code.'}, HttpStatus.NOT_FOUND);
            }
            throw new HttpException({error: 'No group with that code found.'}, HttpStatus.NOT_FOUND);
        }
        return {
            group: extractGroupJoinDTO(group),
        };
    }
}
