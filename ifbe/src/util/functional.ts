import { Model } from 'sequelize-typescript';
import { AccessLevel } from '../model/accessLevels';

export function getOrElse<T>(t: T | null, f: () => T): T {
    if (t === null) return f();
    return t;
}

export function getAll<T extends Model<T>>(things: Array<T>, expand?: (m: T) => any) {
    return things.map(thing => {
        const result = thing.get();
        if (expand) {
            return {...result, ...expand(thing)};
        }
        return result;
    });
}

export function getWithPermission<T>(items: (Model<T> & { permission: AccessLevel })[]) {
    return getAll(items, item => ({ permission: item.permission }));
}
