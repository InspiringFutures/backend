import {
    Body,
    Controller,
    ForbiddenException,
    Headers,
    Injectable,
    NotFoundException,
    Param,
    Post,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FileInterceptor } from '@nestjs/platform-express';

import { RegisterClientDto } from '../dto/client.create.dto';
import { JournalContent, JournalService } from '../service/journal.service';
import { ClientService } from '../service/client.service';
import { GroupService } from '../service/group.service';

@Controller('api/client')
@Injectable()
export class ClientController {
    constructor(
        private journalService: JournalService,
        private clientService: ClientService,
        private groupService: GroupService,
    ) {}

    @Post('')
    async register(@Body() clientDto: RegisterClientDto, @Req() request) {
        const group = await this.groupService.groupFromCode(clientDto.groupCode);
        if (!group) {
            throw new NotFoundException(clientDto.groupCode, 'Unknown group code');
        }
        const client = await this.clientService.register(group, clientDto.participantID);
        return {
            id: client.id,
            participantID: client.participantID,
            token: client.token,
        };
    }

    @Post(':id/journal')
    async addJournal(@Param('id') clientId: number, @Body() journal: JournalContent, @Headers('X-Token') token: string) {
        const client = await this.authenticateClient(clientId, token);
        return await this.journalService.add(client, journal);
    }

    @Post(':clientId/journal/:journalId/media')
    @UseInterceptors(FileInterceptor('upload'))
    async uploadMedia(@Param('clientId') clientId: number, @Param('journalId') journalId: number, @Headers('X-Token') token: string, @UploadedFile() upload, @Body('url') url: string) {
        console.log("Got upload", clientId, journalId, token, upload, url);
        const client = await this.authenticateClient(clientId, token);
        const journal = await this.journalService.get(client, journalId);

        return this.journalService.updateEntry(journal, url, upload);
    }

    private async authenticateClient(clientId: number, token: string) {
        if (token === '' || !token) {
            throw new ForbiddenException("Token is missing.");
        }
        const client = await this.clientService.fetchRegisteredClient(clientId);
        if (!client || client.token !== token) {
            // If the client is not registered or there is some other problem, we just say the token
            // is incorrect to hide information from the client.
            throw new ForbiddenException("Token is incorrect.");
        }
        return client;
    }
}
