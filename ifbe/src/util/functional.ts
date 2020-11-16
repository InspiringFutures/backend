import { Model } from "sequelize-typescript";

export function getOrElse<T>(t: T | null, f: () => T): T {
    if (t === null) return f();
    return t;
}

export function getAll<T>(things: Array<Model<T>>) {
    return things.map(thing => thing.get());
}
