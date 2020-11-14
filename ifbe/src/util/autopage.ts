import {
    HOST_METADATA,
    METHOD_METADATA,
    PATH_METADATA,
    RENDER_METADATA, SCOPE_OPTIONS_METADATA
} from "@nestjs/common/constants";
import { isUndefined, isString } from "@nestjs/common/utils/shared.utils";

const PAGE_CALLBACKS = '__LC_PAGE_CALLBACKS__';

type PageCallback = (controllerPrefix: string) => void;

/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /user/resume`
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param prefixOrOptions a `route path prefix` or a `ControllerOptions` object.
 * A `route path prefix` is pre-pended to the path specified in any request decorator
 * in the class. `ControllerOptions` is an options configuration object specifying:
 * - `scope` - symbol that determines the lifetime of a Controller instance.
 * [See Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage) for
 * more details.
 * - `prefix` - string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 * @see [Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage)
 *
 * @publicApi
 */
export function Controller(prefixOrOptions) {
    const defaultPath = '/';
    const [path, host, scopeOptions] = isUndefined(prefixOrOptions)
        ? [defaultPath, undefined, undefined]
        : isString(prefixOrOptions)
            ? [prefixOrOptions, undefined, undefined]
            : [
                prefixOrOptions.path || defaultPath,
                prefixOrOptions.host,
                { scope: prefixOrOptions.scope },
            ];
    const controllerPrefix = path !== '/' && path !== '' ? path : 'root';

    return (target) => {
        Reflect.defineMetadata(PATH_METADATA, path, target);
        Reflect.defineMetadata(HOST_METADATA, host, target);
        Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, scopeOptions, target);
        let pageCallbaks: PageCallback[] = Reflect.getMetadata(PAGE_CALLBACKS, target.prototype);
        if (pageCallbaks) {
            pageCallbaks.forEach(fn => fn(controllerPrefix));
        }
        return target;
    };
}

function defineIfNotSet(metadataKey: any, metadataValue: any, target: Object) {
    if (Reflect.hasMetadata(metadataKey, target)) return;
    Reflect.defineMetadata(metadataKey, metadataValue, target);
}

/**
 * Route handler method Decorator.  Defines a GET path and template name to be rendered by the controller.
 *
 * For example: `@Page('permissions')`
 * On the controller 'admin'
 * Is equivalent to: ```
 * @Render('admin/permissions')
 * @Get('permissions')
 * ```
 *
 * @param route GET path and template name of the render engine template file
 *
 * @see [Model-View-Controller](https://docs.nestjs.com/techniques.mvc)
 *
 * @publicApi
 */
export function Page(route: string = '') {
    return (target, key, descriptor) => {
        let pageCallbacks: PageCallback[] = Reflect.getMetadata(PAGE_CALLBACKS, target);
        if (!pageCallbacks) {
            Reflect.defineMetadata(PAGE_CALLBACKS, pageCallbacks = [], target);
        }

        pageCallbacks.push((controllerPrefix) => {
            const template = controllerPrefix + '/' + (route === '' ? 'index' : route);
            const path = route === '' ? '/' : route;
            defineIfNotSet(RENDER_METADATA, template, descriptor.value);
            defineIfNotSet(PATH_METADATA, path, descriptor.value);
            defineIfNotSet(METHOD_METADATA, 'GET', descriptor.value);
        });
        return descriptor;
    };
}
