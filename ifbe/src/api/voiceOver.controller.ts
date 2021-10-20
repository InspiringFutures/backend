import {
    Controller,
    Get,
    Injectable,
    Param,
    Res,
} from '@nestjs/common';
import fetch from 'node-fetch';

import { VoiceOverService } from '../service/voiceOver.service';

@Controller('api/voiceOver')
@Injectable()
export class VoiceOverController {
    constructor(
        private voiceOverService: VoiceOverService,
    ) {}

    @Get(':id')
    async get(@Param('id') id: string, @Res() response) {
        const url = await this.voiceOverService.getSignedUrl(id);
        const data = await fetch(url);
        response.type(data.headers.get('Content-Type')).send(await data.buffer());
        //response.redirect(303, url);
    }
}
