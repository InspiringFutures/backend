import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';

@Injectable()
export class AppMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => void) {
        if (req.path.match(/^\/survey\/[0-9]+\/edit$/)) {
            res.cookie('CSRF-TOKEN', req.csrfToken());
            res.sendFile(join(process.cwd(), '../iffe/build/index.html'));
        } else if (req.path.startsWith('/static/')) {
            // change the path to the correct html page path in your project
            res.sendFile(join(process.cwd(), '../iffe/build' + req.path));
        } else if (req.path.startsWith('/.well-known/')) {
            res.sendFile(join(process.cwd(), 'public' + req.path));
        } else {
            return next();
        }
    }
}
