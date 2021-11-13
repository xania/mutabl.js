import { Value } from '../store';

type UpdateCallback<T> = (item: T) => T | void;

export class ListItem<T> extends Value<T> {
  constructor(private list: T[], public index: number, value?: T) {
    super(null, value);
  }

  update(newValue: T): void;
  update(callback: UpdateCallback<T>): void;
  update(newValueOrCallback: any) {
    const { list, index } = this;
    if (typeof newValueOrCallback === 'function') {
      Object.assign(list[index], newValueOrCallback(list[index]));
    } else list[index] = newValueOrCallback;
  }
}

export function swapItems<T>(arr: T[], from: number, to: number) {
  const tmp = arr[from];
  arr[from] = arr[to];
  arr[to] = tmp;
}
