import * as React from 'react';

export interface Props {
    _locals: {
        url: string
    }
}

interface WrapperContext {
    url: string;
    urlBuilder?: UrlBuilder;
}

const WrapperContext = React.createContext<WrapperContext>({
    url: 'unknown',
    urlBuilder: undefined,
});

export function wrap<T>(WrappedComponent: React.ComponentType<T>) {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

    const ComponentWithWrap = (props: T & Props) => {
        return  <WrapperContext.Provider value={props._locals}><WrappedComponent {...props} /></WrapperContext.Provider>;
    };

    ComponentWithWrap.displayName = `wrap(${displayName})`;
    return ComponentWithWrap;
}

export class UrlBuilder {
    constructor(private readonly url: string) {}
    build(path?: string, params?: {[key: string]: string}) {
        const url = this.generateUrl(path, params);
        return url.pathname + url.search;
    }

    absolute(path: string, params?: {[key: string]: string}) {
        const url = this.generateUrl(path, params);
        return url.href;
    }

    private generateUrl(path: string | undefined, params: { [p: string]: string }) {
        const url = new URL(this.url);
        if (path === undefined) {

        } else if (path[0] === '/') {
            url.pathname = path;
        } else if (path[0] === '.') {
            url.pathname += path;
        } else {
            url.pathname += '/' + path;
        }
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                url.searchParams.set(key, value);
            });
        }
        return url;
    }
}

export function useUrlBuilder() {
    const c = React.useContext(WrapperContext);
    return c.urlBuilder || (c.urlBuilder = new UrlBuilder(c.url));
}
