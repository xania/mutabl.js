import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { ListStore } from './list-store';
import { isMutation, ListMutation } from './list-mutation';

export function fromArray<T>(snapshot: T[]): ListStore<T> {
  const mutations = new Rx.Subject<ListMutation<T>>();

  return {
    peek(fn) {
      return fn(snapshot);
    },
    get length() {
      return snapshot.length;
    },
    add(values: T | ListMutation<T>) {
      if (isMutation(values)) {
        applyMutation(values);
      } else {
        applyMutation({
          type: 'push',
          values: values,
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
        'index' in mut ? mut.index : snapshot.findIndex(mut.predicate);
      if (index >= 0) {
        snapshot.splice(index, 1);
      }

      mutations.next({ type: 'remove', index });
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
