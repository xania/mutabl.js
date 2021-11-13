export type ListMutation<T = unknown> =
  | PushItem<T>
  | MoveItem
  | RemoveItem<T>
  | RemoveItemAt
  | InsertItem<T>
  | ResetItems<T>
  | UpdateItem<T>;

interface PushItem<T> {
  type: 'push';
  values: T;
}

interface MoveItem {
  type: 'move';
  from: number;
  to: number;
}

interface RemoveItem<T> {
  type: 'remove';
  predicate(t: T): boolean;
}

interface RemoveItemAt {
  type: 'remove';
  index: number;
}

interface InsertItem<T> {
  type: 'insert';
  values: T;
  index: number;
}

interface ResetItems<T> {
  type: 'reset';
  items: T[];
}

interface UpdateItem<T> {
  type: 'update';
  index: number;
  callback(item: T): void;
}

export function updateItem<T>(
  index: number,
  callback: (item: T) => void
): UpdateItem<T> {
  return {
    type: 'update',
    index,
    callback,
  };
}

export function pushItem<T>(values: T): PushItem<T> {
  return {
    type: 'push',
    values,
  };
}
export function insertItem<T>(values: T, index: number): InsertItem<T> {
  return {
    type: 'insert',
    values,
    index,
  };
}

export function removeItem<T>(
  predicateOrIndex: number | ((t: T) => boolean)
): RemoveItem<T> | RemoveItemAt {
  if (typeof predicateOrIndex === 'function')
    return {
      type: 'remove',
      predicate: predicateOrIndex,
    };

  return {
    type: 'remove',
    index: predicateOrIndex,
  };
}

export function resetItems<T>(items: T[]): ResetItems<T> {
  return {
    type: 'reset',
    items,
  };
}

type Prop<T, K extends keyof T> = T[K];

export function isMutation<T = unknown>(mut: any): mut is ListMutation<T> {
  if (!mut) {
    return false;
  }
  const type: Prop<ListMutation, 'type'> = mut.type;
  return (
    type === 'push' ||
    type === 'insert' ||
    type === 'reset' ||
    type === 'remove' ||
    type === 'move' ||
    type === 'update'
  );
}
