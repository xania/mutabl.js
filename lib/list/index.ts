import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { Expression, Peekable, State, Updatable } from '../observable';
import { digest, flush, Value } from '../store';
import { ListMutation, isMutation, pushItem } from './list-mutation';

export interface ListSource<T> extends Rx.Subscribable<ListMutation<T>> {
  add(m: ListMutation<T>): void;
  readonly length: number;
}

export function asListSource<T>(
  source: T[] | (Expression<T[]> & Updatable<T[]>)
): ListSource<T> {
  if (Array.isArray(source)) return fromArray(source);

  return fromBindable<T>(source);
}

function fromBindable<T>(
  bindable: Expression<T[]> & Updatable<T[]>
): ListSource<T> {
  var snapshot: T[] = bindable.peek(e => e) || [];
  var listItems: ListItem<T>[] = snapshot.map(createItem);
  const mutations = new Rx.Subject<ListMutation<ListItem<T>>>();

  return {
    get length() {
      return listItems.length;
    },
    add(m: ListMutation<T>) {
      applyMutation(m);
    },
    subscribe(...args: any[]) {
      const result = mutations.pipe(Ro.startWith(resetItems(listItems)));
      return result.subscribe.apply(result, args as any);
    },
  };

  function flushChanges() {
    bindable.update(snapshot);
    const dirty = [];
    let parent: any = bindable;
    while (parent) {
      dirty.push(parent);
      parent = parent.parent;
    }
    flush(dirty);
  }

  function createItem(v, i) {
    const item = new ListItem<T>(null, i, v);
    item.subscribe(flushChanges);
    return item;
  }

  function resetItems(items: ListItem<T>[]): ListMutation<ListItem<T>> {
    return {
      type: 'reset',
      items,
    };
  }

  function applyMutation(mut: ListMutation<T>) {
    if (mut.type === 'insert') {
      const { index, values } = mut;
      const item = createItem(values, index);
      listItems.splice(index, 0, item);
      snapshot.splice(index, 0, values);
      mutations.next(pushItem(item));
    } else if (mut.type === 'push') {
      const { values } = mut;
      const index = listItems.length;
      const item = createItem(values, index);
      listItems.push(item);
      snapshot.push(values);
      mutations.next(pushItem(item));
    } else if (mut.type === 'remove') {
      const index =
        typeof mut.predicate === 'number'
          ? mut.predicate
          : listItems.findIndex(mut.predicate);
      if (index >= 0) {
        listItems.splice(index, 1);
        snapshot.splice(index, 1);
      }
      flushChanges();
      mutations.next({ type: 'remove', predicate: index });
    } else if (mut.type === 'move') {
      const { from, to } = mut;
      swapItems(listItems, from, to);
      swapItems(snapshot, from, to);
      mutations.next(mut);
    }
  }
}

function fromArray<T>(snapshot: T[]): ListSource<T> {
  const mutations = new Rx.Subject<ListMutation<T>>();

  return {
    get length() {
      return snapshot.length;
    },
    add(values: T | ListMutation<T>) {
      if (isMutation(values)) {
        applyMutation(values);
      } else {
        applyMutation({
          type: 'push',
          values,
        });
      }
    },
    subscribe(...args: any[]) {
      const result = mutations.pipe(Ro.startWith(resetItems(snapshot)));
      return result.subscribe.apply(result, args as any);
    },
  };

  function applyMutation(mut: ListMutation<T>) {
    if (mut.type === 'insert') {
      const { index, values } = mut;
      snapshot.splice(index, 0, values);
      mutations.next(mut);
    } else if (mut.type === 'push') {
      const { values } = mut;
      snapshot.push(values);
      mutations.next(mut);
    } else if (mut.type === 'remove') {
      const index =
        typeof mut.predicate === 'number'
          ? mut.predicate
          : snapshot.findIndex(mut.predicate);
      if (index >= 0) {
        snapshot.splice(index, 1);
      }
      mutations.next({ type: 'remove', predicate: index });
    } else if (mut.type === 'move') {
      const { from, to } = mut;
      const tmp = snapshot[from];
      snapshot[from] = snapshot[to];
      snapshot[to] = tmp;
      mutations.next(mut);
    }
  }

  function resetItems(items: T[]): ListMutation<T> {
    return {
      type: 'reset',
      items,
    };
  }
}

class ListItem<T> extends Value<T> {
  constructor(private list: T[], private index: number, value?: T) {
    super(undefined, value);
  }

  update(newValue: T) {
    const { list, index } = this;
    list[index] = newValue;
  }
}

function swapItems<T>(arr: T[], from: number, to: number) {
  const tmp = arr[from];
  arr[from] = arr[to];
  arr[to] = tmp;
}
