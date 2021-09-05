export type ListMutation<T = unknown> =
  | PushItem<T>
  | InsertItem<T>
  | MoveItem
  | RemoveItem<T>
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

interface InsertItem<T> {
  type: 'insert';
  values: T;
  index: number;
}

interface RemoveItem<T> {
  type: 'remove';
  predicate;
}
interface ResetItems<T> {
  type: 'reset';
  items: T[];
}

interface UpdateItem<T> {
  type: 'update';
  index: number;
  callback(item: T);
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
  predicate: number | ((t: T) => boolean)
): RemoveItem<T> {
  return {
    type: 'remove',
    predicate,
  };
}

export function resetItems<T>(items: T[]): ResetItems<T> {
  return {
    type: 'reset',
    items,
  };
}

type Prop<T, K extends keyof T> = T[K];

export function isMutation<T = unknown>(
  m: any
): m is ListMutation<T> | RemoveItem<T> {
  if (!m) {
    return false;
  }
  const type: Prop<ListMutation, 'type'> = m.type;
  return (
    type === 'remove' ||
    type === 'push' ||
    type === 'insert' ||
    type === 'reset' ||
    type === 'move'
  );
}
