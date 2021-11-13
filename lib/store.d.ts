import { Expression, Action, Updater, Property, State } from './observable';
import { PartialObserver, Unsubscribable } from 'rxjs/internal/types';
declare type Func<T, U> = (a: T) => U;
export interface Parent<T> {
    properties?: Expression<T[keyof T]>[];
    value?: T;
}
export declare abstract class Value<T> implements Expression<T> {
    parent: Parent<any> | null;
    value?: T | undefined;
    properties: Property<T[keyof T]>[];
    observers?: PartialObserver<T>[];
    constructor(parent: Parent<any> | null, value?: T | undefined);
    peek: <U>(project: Func<T, U>) => U | undefined;
    onChange(observer: PartialObserver<T> | Action<T>, skipCurrent: boolean): Unsubscribable;
    subscribe: (nextOrObserver?: any, error?: any, complete?: any) => Unsubscribable;
    get<K extends keyof T>(propertyName: K): Property<T[K]> | void;
    property<K extends keyof T>(propertyName: K): Property<T[K]>;
    toString(): string;
    lift<U>(valueFrom: (newValue: T, prevValue?: U) => U): Expression<U>;
    dispose(): void;
}
export declare class ObjectProperty<T> extends Value<T> implements Property<T> {
    readonly parent: Parent<any>;
    readonly name: string | number;
    constructor(parent: Parent<any>, name: string | number, value?: T);
    valueFrom(parentValue: any): any;
    update: (updater: Updater<T>, autoRefresh?: boolean) => boolean;
    asProxy(): State<T>;
}
export declare class Store<T> extends Value<T> {
    autoRefresh: boolean;
    constructor(value?: T, autoRefresh?: boolean);
    asProxy(): State<T>;
    update: (newValue: Updater<T>, autoRefresh?: boolean, partial?: boolean | undefined) => boolean;
    refresh(): boolean;
    next(values: T): void;
}
export declare function asProxy<T>(self: Expression<T>): State<T>;
export default Store;
export declare function refresh<T>(root: Value<T>): boolean;
export declare function digest(root: {
    properties?: Property<any>[];
    value?: any;
}): any[];
export declare function flush(dirty: any[]): void;
export { ListItem };
declare class ListItem<T> extends Value<T> {
    value: T;
    index: number;
    constructor(value: T, index: number);
    update: (newValue: T | Func<T, T>, autoRefresh?: boolean) => boolean;
}
export declare function updateValue<T>(target: {
    value?: T;
}, newValue: Updater<T>, partial?: boolean): boolean;
