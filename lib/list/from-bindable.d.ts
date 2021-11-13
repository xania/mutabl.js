import { Expression, Updatable } from '../observable';
import { ListStore } from './list-store';
export declare function fromBindable<T>(bindable: Expression<T[]> & Updatable<T[]>): ListStore<T>;
