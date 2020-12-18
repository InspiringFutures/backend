import { PassThrough } from 'stream';

import {
    Controller,
    Get,
    Injectable,
    Query,
    Res,
} from '@nestjs/common';
import QRCode from 'qrcode';

@Controller('qr')
@Injectable()
export class QRController {
    constructor() {}

    @Get()
    async qrCode(@Query('url') url: string, @Res() res) {
        try{
            const qrStream = new PassThrough();
            await QRCode.toFileStream(qrStream, url,
              {
                  type: 'png',
                  width: 200,
                  errorCorrectionLevel: 'H'
              }
            );

            qrStream.pipe(res);
        } catch(err){
            console.error('Failed to return content', err);
        }
    }
}
