export type Take<T, K extends keyof T> = Pick<T, K>[K];
