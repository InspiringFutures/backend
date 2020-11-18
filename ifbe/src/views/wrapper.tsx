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
    constructor(private readonly url: string) {};
    build(path: string) {
        return this.url + '/' + path;
    }
}

export function useUrlBuilder() {
    const c = React.useContext(WrapperContext);
    return c.urlBuilder || (c.urlBuilder = new UrlBuilder(c.url));
}
