import { Get, Render } from '@nestjs/common';

import {redirect} from "./util/redirect";
import {Controller, Page} from "./util/autopage";
import {PushNotificationService} from './service/pushNotification.service';

@Controller('sample')
export class SampleController {
    constructor(
        private pushNotificationService: PushNotificationService,
    ) {}

    @Page()
    home() {
        return {index: "The index"};
    }

    @Page('page')
    async samplePage() {
        return {msg: "Sample Message"};
    }

    @Page('redirect')
    async doRedirect() {
        throw redirect('redirectTarget');
    }

    @Page('redirectTarget')
    @Render('sample/page')
    async redirectTarget() {
        return {msg: "Redirect target"};
    }

    @Get('push')
    async testPush() {
        try {
            const result = this.pushNotificationService.send('dZv7ifSISm6n5zG-HkOJAx:APA91bGTDJLiVD3I2EhDB28I-gt8cc-Z2FaVQ39W4-KF_6DPssuSggfRLjVF14pOYzhk2WDO1KTlBbIeXEkGAiq8RblHlVeKiUl-AgChqUXDGBCFwOrm0Wb9MCWxVNlRmogwoFCWpE-X', {
                title: 'New survey',
                body: 'Please fill out a new survey for the Inspiring Futures project',
                custom: {
                    customData: {
                        surveyId: 1,
                    },
                },
            });
            console.log('Push result', result);
        } catch (e) {
            console.log('Push error', e);
        }
    }
}
