import {
    Body,
    Controller, ForbiddenException, Headers,
    HttpException,
    HttpStatus,
    Injectable,
    Param,
    Post,
    Req, UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import { FileInterceptor } from "@nestjs/platform-express";
import { UniqueConstraintError } from "sequelize";
import { v4 as uuidv4 } from 'uuid';

import { Group } from "../model/group.model";
import { Client } from "../model/client.model";
import { CreateClientDto } from "../dto/client.create.dto";
import { JournalContent, JournalService } from "../service/journal.service";

@Controller('api/client')
@Injectable()
export class ClientController {
    constructor(
        @InjectModel(Client)
        private clientModel: typeof Client,
        @InjectModel(Group)
        private groupModel: typeof Group,
        private journalService: JournalService,
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
            return {
                id: client.id,
                nickName: client.nickName,
                token: client.token,
            };
        } catch (e) {
            if (e instanceof UniqueConstraintError) {
                throw new HttpException('That nickname is already taken', HttpStatus.CONFLICT);
            }
            throw e;
        }
    }

    @Post(':id/journal')
    async addJournal(@Param('id') clientId: number, @Body() journal: JournalContent, @Headers('X-Token') token: string) {
        const client = await this.authenticateClient(clientId, token);
        return await this.journalService.add(client, journal);
    }

    @Post(':clientId/journal/:journalId/media')
    @UseInterceptors(FileInterceptor('upload'))
    async uploadMedia(@Param('clientId') clientId: number, @Param('journalId') journalId: number, @Headers('X-Token') token: string, @UploadedFile() upload, @Body('url') url: string) {
        const client = await this.authenticateClient(clientId, token);
        const journal = await this.journalService.get(client, journalId);

        return this.journalService.updateEntry(journal, url, upload);
    }

    private async authenticateClient(clientId: number, token: string) {
        const client = await this.clientModel.findByPk(clientId);
        if (client.token !== token) {
            throw new ForbiddenException("Token is incorrect.");
        }
        return client;
    }
}
