import * as Rx from 'rxjs';
export interface Peekable<T> {
    peek<U>(project: (value: T) => U): U | void;
}
export declare type Updater<T> = T | ((a: T) => T | void);
export interface Updatable<T> {
    update(value: Updater<T>): boolean;
}
export interface Property<T> extends Expression<T>, Updatable<T> {
    name: string | number;
    valueFrom(parentValue: any, prevValue?: T): T;
}
export interface Expression<T = unknown> extends Rx.Subscribable<T>, Peekable<T>, Liftable<T> {
    property<K extends keyof T>(propertyName: K): Property<T[K]>;
    dispose(): any;
    value?: T;
}
export declare type Action<T> = (value: T) => void;
export declare function isExpression(o: any): o is Expression<unknown>;
export interface Liftable<T> {
    lift<U>(project: (value: T, prev?: U) => U): Expression<U>;
}
export declare function isLiftable(o: any): o is Expression<unknown>;
export declare function isSubscribable(o: any): o is Rx.Subscribable<unknown>;
export declare type StateView<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? T[K] : State<T[K]>;
} & Expression<T>;
export declare type State<T> = StateView<T> & Updatable<T> & Expression<T>;
export declare function isNextObserver<T>(value: any): value is Rx.NextObserver<T>;
/** Symbol.observable addition */
declare global {
    interface SymbolConstructor {
        readonly observable: symbol;
    }
}
export declare function toSubscriber(nextOrObserver: any, error: any, complete: any): Rx.Subscriber<any>;
