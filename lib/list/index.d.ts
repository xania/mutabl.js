import { Expression, Updatable } from '../observable';
import { ListMutation } from './list-mutation';
import * as Rx from 'rxjs';
export interface ListStore<T> extends Rx.Subscribable<ListMutation<T>> {
    add(m: ListMutation<T>): void;
    readonly length: number;
    peek<R>(fun: (snapshot: T[]) => R): R;
}
export declare function asListStore<T>(source: T[]): ListStore<T>;
export declare function asListStore<T>(source: Expression<T[]> & Updatable<T[]>): ListStore<T>;
