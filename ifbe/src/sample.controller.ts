import { Render } from '@nestjs/common';

import {redirect} from "./util/redirect";
import {Controller, Page} from "./util/autopage";

@Controller('sample')
export class SampleController {
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
}
