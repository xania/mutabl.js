import { Value } from '../store';
declare type UpdateCallback<T> = (item: T) => T | void;
export declare class ListItem<T> extends Value<T> {
    private list;
    index: number;
    constructor(list: T[], index: number, value?: T);
    update(newValue: T): void;
    update(callback: UpdateCallback<T>): void;
}
export declare function swapItems<T>(arr: T[], from: number, to: number): void;
export {};
