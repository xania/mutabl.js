import { Expression, Updatable } from '../observable';
import { fromArray } from './from-array';
import { fromBindable } from './from-bindable';
import { ListMutation } from './list-mutation';
import * as Rx from 'rxjs';

export interface ListStore<T> extends Rx.Subscribable<ListMutation<T>> {
  add(m: ListMutation<T>): void;
  readonly length: number;
  peek<R>(fun: (snapshot: T[]) => R): R;
}

export function asListStore<T>(source: T[]): ListStore<T>;
export function asListStore<T>(
  source: Expression<T[]> & Updatable<T[]>
): ListStore<T>;
export function asListStore<T>(
  source: T[] | (Expression<T[]> & Updatable<T[]>)
): ListStore<T> {
  if (Array.isArray(source)) return fromArray(source);

  return fromBindable<T>(source);
}
