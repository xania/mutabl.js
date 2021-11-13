export declare type ListMutation<T = unknown> = PushItem<T> | MoveItem | RemoveItem<T> | RemoveItemAt | InsertItem<T> | ResetItems<T> | UpdateItem<T>;
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
export declare function updateItem<T>(index: number, callback: (item: T) => void): UpdateItem<T>;
export declare function pushItem<T>(values: T): PushItem<T>;
export declare function insertItem<T>(values: T, index: number): InsertItem<T>;
export declare function removeItem<T>(predicateOrIndex: number | ((t: T) => boolean)): RemoveItem<T> | RemoveItemAt;
export declare function resetItems<T>(items: T[]): ResetItems<T>;
export declare function isMutation<T = unknown>(mut: any): mut is ListMutation<T>;
export {};
