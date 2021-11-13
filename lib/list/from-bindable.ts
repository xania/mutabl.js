import { Expression, Updatable } from '../observable';
import { ListItem, swapItems } from './list-item';
import { digest, flush } from '../store';
import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { ListMutation, pushItem } from './list-mutation';
import { ListStore } from './list-store';

export function fromBindable<T>(
  bindable: Expression<T[]> & Updatable<T[]>
): ListStore<T> {
  var snapshot: T[] = bindable.peek((e) => e) || [];
  var listItems: ListItem<T>[] = snapshot.map(createItem);
  const mutations = new Rx.Subject<ListMutation<ListItem<T>>>();

  return {
    peek(fn) {
      return fn(snapshot);
    },
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
    if (dirty.length > 0) flush([...dirty, bindable]);
  }

  function createItem(v: T, i: number) {
    const item = new ListItem<T>(snapshot, i, v);
    item.subscribe({ next: flushChanges });
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
      snapshot.push(values);

      const index = listItems.length;
      const item = createItem(values, index);
      listItems.push(item);
      mutations.next(pushItem(item));
    } else if (mut.type === 'remove') {
      const index =
        'predicate' in mut
          ? listItems.findIndex((li) => li.value && mut.predicate(li.value))
          : mut.index;
      if (index >= 0) {
        listItems.splice(index, 1);
        snapshot.splice(index, 1);
        for (let i = index; i < listItems.length; i++) {
          listItems[i].index = i;
        }
      }
      flushChanges();
      mutations.next({ type: 'remove', index });
    } else if (mut.type === 'move') {
      const { from, to } = mut;
      swapItems(listItems, from, to);
      swapItems(snapshot, from, to);
      mutations.next(mut);
    } else if (mut.type == 'update') {
      const { index } = mut;
      const listItem = listItems[index];
      listItem.update(mut.callback);

      const dirty = digest(listItem);
      if (dirty.length) {
        flush([...dirty, bindable]);
      }
    }
  }
}
