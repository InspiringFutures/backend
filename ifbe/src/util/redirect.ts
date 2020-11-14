import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';


export class RedirectException extends HttpException {
    constructor(public readonly url: string, statusCode: number) {
        super('', statusCode);
    }
}

export function redirect(url: string, statusCode: number = HttpStatus.SEE_OTHER): never {
    throw new RedirectException(url, statusCode);
}

@Catch(RedirectException)
export class RedirectFilter implements ExceptionFilter {
    catch(exception: RedirectException, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();
        res.status(exception.getStatus()).redirect(exception.url);
        return;
    }
}
