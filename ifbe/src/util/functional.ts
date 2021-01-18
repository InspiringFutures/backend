import { Model } from "sequelize-typescript";

export function getOrElse<T>(t: T | null, f: () => T): T {
    if (t === null) return f();
    return t;
}

export function getAll<T>(things: Array<Model<T>>, expand?: (m: Model<T>) => any) {
    return things.map(thing => {
        const result = thing.get();
        if (expand) {
            return {...result, ...expand(thing)};
        }
        return result;
    });
}
