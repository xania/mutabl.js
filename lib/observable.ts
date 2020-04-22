import * as Rx from 'rxjs';

export interface Peekable<T> {
  peek<U>(project: (value: T) => U): U | void;
}

export type Updater<T> = T | ((a: T) => T | void);

export interface Updatable<T> extends Peekable<T> {
  update(value: Updater<T>): boolean;
}

export interface Property<T> extends Expression<T>, Updatable<T> {
  name: string | number;
  valueFrom(parentValue: any, prevValue?: T): T;
}

export interface Expression<T = unknown>
  extends Rx.Subscribable<T>,
    Peekable<T>,
    Liftable<T> {
  property<K extends keyof T>(propertyName: K): Property<T[K]>;
  dispose(): any;
  value?: T;
}

export type Action<T> = (value: T) => void;

export function isExpression(o: any): o is Expression<unknown> {
  if (typeof o !== 'object') return false;

  if (typeof o.lift !== 'function') return false;

  return isSubscribable(o);
}

export interface Liftable<T> {
  lift<U>(project: (value: T, prev?: U) => U): Expression<U>;
}

export function isLiftable(o: any): o is Expression<unknown> {
  if (typeof o !== 'object') return false;

  return typeof o.lift === 'function';
}

export function isSubscribable(o: any): o is Rx.Subscribable<unknown> {
  if (o === null || typeof o !== 'object') return false;

  if (typeof o.subscribe !== 'function') return false;

  return true;
}

export type StateView<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? T[K] : State<T[K]>;
} &
  Expression<T>;

export type State<T> = StateView<T> & Updatable<T> & Expression<T>;

export function isNextObserver<T>(value: any): value is Rx.NextObserver<T> {
  if (value === null) return false;
  if (typeof value === 'object') return typeof value.next === 'function';

  return false;
}

/** Symbol.observable addition */
declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export function toSubscriber(nextOrObserver: any, error: any, complete: any) {
  if (nextOrObserver) {
    if (nextOrObserver instanceof Rx.Subscriber) {
      return nextOrObserver;
    }
  }
  if (!nextOrObserver && !error && !complete) {
    const emptyObserver = {
      closed: true,
      next() {},
      error(err: any) {
        console.error(err);
      },
      complete() {},
    };
    return new Rx.Subscriber(emptyObserver);
  }
  return new Rx.Subscriber(nextOrObserver, error, complete);
}
