import {
  Expression,
  Action,
  Updater,
  Property,
  State,
  isNextObserver,
} from './observable';

import {
  NextObserver,
  PartialObserver,
  Unsubscribable,
} from 'rxjs/internal/types';

type Func<T, U> = (a: T) => U;

const __emptySubscription: Unsubscribable = {
  unsubscribe() {},
};
const observable =
  (typeof Symbol === 'function' && Symbol.observable) || '@@observable';

const empty = '';

export interface Parent<T> {
  properties?: Expression<T[keyof T]>[];
  value?: T;
}

export abstract class Value<T> implements Expression<T> {
  public properties: Property<T[keyof T]>[] = [];
  public observers?: PartialObserver<T>[];

  constructor(public parent: Parent<any> | null, public value?: T) {}

  [observable]() {
    return this;
  }

  peek = <U>(project: Func<T, U>) => {
    const { value } = this;
    if (value !== undefined) {
      return project(value);
    }

    return;
  };

  onChange(
    observer: PartialObserver<T> | Action<T>,
    skipCurrent: boolean
  ): Unsubscribable {
    if (typeof observer === 'function') {
      return this.onChange({ next: observer }, skipCurrent) as Unsubscribable;
    }

    if (!isNextObserver(observer)) {
      return __emptySubscription;
    }

    if (!skipCurrent) {
      if (this.value !== undefined) {
        observer.next(this.value);
      }
    }

    var observers = this.observers;
    if (observers) {
      let length = observers.length;
      observers[length] = observer;
    } else {
      this.observers = observers = [observer];
    }

    return {
      unsubscribe() {
        if (observers) {
          var idx = observers.indexOf(observer);
          observers.splice(idx, 1);
        }
      },
    } as Unsubscribable;
  }

  subscribe = (nextObserver: NextObserver<T>) => {
    return this.onChange(nextObserver, false) as Unsubscribable;
  };

  get<K extends keyof T>(propertyName: K): Property<T[K]> | void {
    const { properties } = this;
    let i = properties.length;
    while (i--) {
      const prop: any = properties[i];
      if (prop.name === propertyName) {
        return prop;
      }
    }
  }

  property<K extends keyof T>(propertyName: K): Property<T[K]>;
  property<K extends keyof T>(propertyName: K) {
    const prop = this.get(propertyName);
    if (prop) return prop;

    var parentValue = this.value;
    var initValue = parentValue ? parentValue[propertyName] : void 0;

    const property = new ObjectProperty<T[K]>(
      this,
      propertyName as string,
      initValue
    );
    this.properties.push(property as any);
    return property;
  }

  toString(): string {
    var value = this.value;
    if (typeof value === 'string') return value;
    else if (value === void 0 || value === null) return empty;
    else return value + '';
  }

  lift<U>(valueFrom: (newValue: T, prevValue?: U) => U): Expression<U> {
    const { value } = this;
    const p = new ValueObserver(
      this,
      valueFrom,
      value === undefined ? undefined : valueFrom(value)
    );
    const { properties } = this;
    properties.push(p as any);
    return p;
  }

  dispose() {
    const { parent } = this;
    if (parent) {
      const { properties } = parent;
      if (properties) {
        var idx = properties.indexOf(this as any);
        if (idx >= 0) {
          properties.splice(idx, 1);
        }
      }
    }
  }
}

// type ArrayMutation =
//   | { type: 'insert'; index: number }
//   | { type: 'remove'; index: number }
//   | { type: 'move'; from: number; to: number };

// export interface ObservableArray<T> {
//   subscribe(observer: NextArrayMutationsObserver<T>): Rx.Subscription;
// }
// type ArrayMutationsCallback<T> = (array: T, mutations?: ArrayMutation[]) => any;

// type NextArrayMutationsObserver<T> = {
//   next: ArrayMutationsCallback<T>;
// };

export class ObjectProperty<T> extends Value<T> implements Property<T> {
  constructor(
    public readonly parent: Parent<any>,
    public readonly name: string | number,
    value?: T
  ) {
    super(parent, value);
  }

  valueFrom(parentValue: any) {
    return parentValue && parentValue[this.name];
  }

  update = (updater: Updater<T>, autoRefresh: boolean = true) => {
    if (!updateValue(this, updater)) return false;

    var parentValue = this.parent.value;
    if (parentValue) {
      parentValue[this.name] = this.value;
    } else {
      mergeParent(this.parent, { [this.name]: this.value });
    }

    if (autoRefresh) {
      const dirty = digest(this);
      let parent: any = this;
      while (parent) {
        dirty.push(parent);
        parent = parent.parent;
      }
      flush(dirty);
    }

    return true;

    function mergeParent(parent: any, value: any) {
      parent.update(value, false);
    }
  };

  asProxy(): State<T> {
    return asProxy(this);
  }
}

export class Store<T> extends Value<T> {
  constructor(value?: T, public autoRefresh: boolean = true) {
    super(null, value);
  }

  //   expr(expr: string) {
  //     var parts = expr.split('.');
  //     return (value: T) => {
  //       var obj = this.value;
  //       var len = parts.length - 1;
  //       for (var i = 0; i < len; i++) {
  //         var prop = parts[i];
  //         var child = obj[prop];
  //         if (!child) {
  //           obj[prop] = child = {};
  //         }
  //         obj = child;
  //       }
  //       var last = parts[len];
  //       obj[last] = value;
  //     };
  //   }

  asProxy(): State<T> {
    return asProxy(this);
  }

  update = (
    newValue: Updater<T>,
    autoRefresh: boolean = true,
    partial?: boolean
  ) => {
    if (!updateValue(this, newValue, partial)) {
      return false;
    }

    if (autoRefresh) {
      const dirty = digest(this);
      // TODO do we still need this?
      dirty.push(this);
      flush(dirty);
    }
    return true;
  };

  refresh() {
    return refresh(this);
  }

  next(values: T) {
    this.update(values);
  }
}

export function asProxy<T>(self: Expression<T>): State<T> {
  return new Proxy<any>(self, {
    get(parent: Expression<T>, name: string | symbol) {
      if (typeof name === 'symbol' || name in self) return (self as any)[name];

      var result = parent.property(name as keyof T);
      if (typeof result === 'function') return result;

      return asProxy(result);
    },
    set<K extends keyof T>(
      parent: Value<T>,
      name: string | symbol,
      value: Updater<T[K]>
    ) {
      return parent.property(name as K).update(value);
    },
  });

  // function subscribe(observer): Unsubscribable {
  //     return self.subscribe(observer);
  // }

  // function update(value: Updater<T>): boolean {
  //     return self.update(value);
  // }
}

export default Store;

class ValueObserver<T, U> extends Value<U> {
  constructor(
    parent: Value<any>,
    public valueFrom: (newValue: T, prevValue: U) => U,
    initValue?: U
  ) {
    super(parent, initValue);
  }
}

export function refresh<T>(root: Value<T>) {
  const dirty = digest(root);
  if (dirty.length) {
    flush(dirty);
    return true;
  }
  return false;
}

export function digest(root: {
  properties?: Property<any>[];
  value?: any;
}): any[] {
  if (!root) {
    return [];
  }
  var stack = [root];
  var stackLength: number = stack.length;
  var dirtyLength: number = 0;
  var dirty = [];

  while (stackLength--) {
    const parent = stack[stackLength];
    const parentValue = parent.value;

    var { properties } = parent;

    if (properties) {
      let propIdx: number = properties.length | 0;
      while (propIdx) {
        propIdx = (propIdx - 1) | 0;
        var prop = properties[propIdx];
        //recurse
        stack[stackLength] = prop;
        stackLength = (stackLength + 1) | 0;

        const prevValue = prop.value;
        const childValue =
          prevValue === null
            ? prop.valueFrom(parentValue)
            : prop.valueFrom(parentValue, prevValue);
        if (prevValue !== childValue) {
          prop.value = childValue;
          dirty[dirtyLength] = prop;
          dirtyLength = (dirtyLength + 1) | 0;
        }
      }
    }
  }

  // expand with parents
  return dirty;
}

// TODO refactor / merge with refreshStack
export function flush(dirty: any[]) {
  var listLength: number = dirty.length;

  while (listLength--) {
    const item = dirty[listLength];
    const itemValue = item.value;

    const { observers } = item;
    if (observers) {
      var e = observers.length | 0;
      while (e--) {
        let observer = observers[e];
        observer.next(itemValue);
      }
    }
  }
}

export { ListItem };

class ListItem<T> extends Value<T> {
  constructor(public value: T, public index: number) {
    super(null, value);
  }

  update = (newValue: T | Func<T, T>, autoRefresh: boolean = true) => {
    if (!updateValue(this, newValue)) {
      return false;
    }

    if (autoRefresh) {
      const dirty = digest(this);
      dirty.push(this);
      flush(dirty);
      return true;
    }
    return true;
  };
}

export function updateValue<T>(
  target: { value?: T },
  newValue: Updater<T>,
  partial?: boolean
): boolean {
  // ignore undefined
  if (newValue === undefined) return false;

  const targetValue = target.value;
  if (targetValue === newValue) {
    return false;
  } else if (isFunction(newValue)) {
    const retval = newValue.apply(null, [targetValue]);
    // when returned value is undefined
    if (retval === undefined) {
      // assume prevValue is being mutated (e.g a new item is pushed to list)
      return true;
    } else {
      return updateValue(target, retval);
    }
  } else if (
    partial === true &&
    !!targetValue &&
    typeof targetValue === 'object' &&
    !!newValue &&
    typeof newValue === 'object'
  ) {
    let b = false;
    const stack: any[] = [[targetValue, newValue]];
    const merged = new Set<any>();
    while (stack.length > 0) {
      const [targetValue, sourceValue] = stack.pop();
      if (!merged.add(targetValue))
        // stop recursion
        continue;

      for (let prop in sourceValue) {
        const sourcePropValue = sourceValue[prop];
        const targetPropValue = targetValue[prop];
        if (
          sourcePropValue === targetPropValue ||
          typeof targetPropValue === 'function'
        )
          continue;
        if (
          targetPropValue &&
          typeof targetPropValue === 'object' &&
          sourcePropValue &&
          typeof sourcePropValue === 'object'
        ) {
          stack.push([targetPropValue, sourcePropValue]);
        } else {
          if (targetPropValue !== sourcePropValue) {
            targetValue[prop] = sourcePropValue;
            b = true;
          }
        }
      }
    }
    return b;
  } else {
    target.value = newValue as any;
    return true;
  }
}

function isFunction(fn: any): fn is (a: any) => any {
  return typeof fn === 'function';
}
