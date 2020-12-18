import {
    Body,
    Controller,
    ForbiddenException, Get,
    Headers,
    Injectable,
    NotFoundException,
    Param,
    Post,
    Req, Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { RegisterClientDto } from '../dto/client.create.dto';
import { JournalContent, JournalService } from '../service/journal.service';
import { ClientService } from '../service/client.service';
import { GroupService } from '../service/group.service';
import { Client } from '../model/client.model';
import { extractGroupJoinDTO } from './group.controller';

function extractNewClientDTO(client: Client) {
    return {
        id: client.id,
        participantID: client.participantID,
        token: client.token,
    };
}

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
        return extractNewClientDTO(client);
    }

    @Get('reset/token/:token')
    async consumeResetToken(@Param('token') token: string, @Headers('X-Requested-With') requestedWith: string, @Res() res) {
        if (requestedWith && requestedWith.startsWith('Inspiring Futures App')) {
            // Process the reset
            const client = await this.clientService.processResetToken(token);
            if (client) {
                const group = await client.$get('group');
                res.json({
                    client: extractNewClientDTO(client),
                    group: extractGroupJoinDTO(group),
                });
            } else {
                res.status(400).json({
                    error: 'Couldn\'t understand that reset token',
                });
            }
        } else {
            // Tell the user they need to scan the token on their phone.
            res.render('client/resetTokenOutside', {resetURL: res.locals.url});
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
