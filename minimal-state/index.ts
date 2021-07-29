export {set, update, on, off, once, emit, clear, pure, next, until, is};

// main API
function set<T, L extends keyof T>(
  state: T,
  key: L,
  value: T[L] | ((value: T[L]) => T[L])
): void;
function set<T extends unknown[], L extends keyof T>(
  state: T,
  value: T[0] | ((value: T[0]) => T[0])
): void;
function set<T extends {}, L extends keyof T>(
  state: T,
  value: Partial<T>
): void;
function set<T, L extends keyof T>(
  state: T,
  keyOrValue: L | T[L] | ((state: T[L]) => T[L]) | Partial<T>,
  valueOrUndefined?: T[L] | ((state: T[L]) => T[L]),
  noChangeNoop?: boolean
) {
  if (
    valueOrUndefined === undefined &&
    !(state instanceof Array) &&
    typeof keyOrValue === 'object'
  ) {
    return merge(state, keyOrValue as Partial<T>, noChangeNoop);
  }
  let isAtom = state instanceof Array && valueOrUndefined === undefined;
  let key = isAtom ? (0 as L) : (keyOrValue as L);
  let valueOrFunction = isAtom
    ? (keyOrValue as T[L] | ((state: T[L]) => T[L]))
    : (valueOrUndefined as T[L] | ((state: T[L]) => T[L]));

  let oldValue = state[key];
  let value =
    typeof valueOrFunction === 'function'
      ? (valueOrFunction as (state: T[L]) => T[L])(oldValue)
      : valueOrFunction;
  if (noChangeNoop && value === oldValue) return;
  state[key] = value;

  if (isAtom) {
    emit(state as T & any[], value, oldValue);
  } else {
    emit(state, key, value, oldValue);
    emit(state, undefined, key, value, oldValue);
  }
}

function update<T>(state: T, key?: keyof T) {
  if (key !== undefined) {
    let value = state[key];
    emit(state, key, value);
    emit(state, undefined, key, value);
  } else {
    if (state instanceof Array) {
      emit(state, state[0]);
    } else {
      emit(state, undefined);
    }
  }
}

function merge<T>(state: T, newState: Partial<T>, noChangeNoop?: boolean) {
  let oldState: Partial<T> = {};
  for (let key in newState) {
    oldState[key] = state[key];
    (state as T)[key] = newState[key] as T[typeof key];
  }
  for (let key in newState) {
    if (noChangeNoop && oldState[key] === newState[key]) continue;
    emit(state, key, newState[key], oldState[key]);
    emit(state, undefined, key, newState[key], oldState[key]);
  }
}

// lower level API, implements simple event emitter
function on<T>(
  state: T,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
): () => void;
function on<T>(state: T, listener: (...args: unknown[]) => void): () => void;
function on<T>(
  state: T,
  keyOrListener: keyof T | undefined | ((...args: unknown[]) => void),
  listenerOrNone?: ((...args: unknown[]) => void) | undefined
) {
  let events = getEvents(state);
  let [key, listener] = getKeyListener(keyOrListener, listenerOrNone);
  if (!events.has(key)) events.set(key, new Set());
  events.get(key)!.add(listener);
  return () => off(state, key, listener);
}

function off<T>(
  state: T,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
): void;
function off<T>(state: T, listener: (...args: unknown[]) => void): void;
function off<T>(
  state: T,
  keyOrListener: keyof T | undefined | ((...args: unknown[]) => void),
  listenerOrNone?: ((...args: unknown[]) => void) | undefined
) {
  let events = getEvents(state);
  let [key, listener] = getKeyListener(keyOrListener, listenerOrNone);
  let listeners = events.get(key);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size === 0) events.delete(key);
}

function emit<T>(state: T, key: keyof T | undefined, ...args: unknown[]): void;
function emit<T extends unknown[]>(state: T, ...args: unknown[]): void;
function emit<T>(
  state: T,
  keyOrArg: keyof T | undefined | unknown,
  ...args: unknown[]
) {
  let isAtom = state instanceof Array;
  let key = isAtom ? undefined : (keyOrArg as keyof T | undefined);
  let fullArgs = isAtom ? [keyOrArg, ...args] : args;
  let events = getEvents(state);
  if (!events.has(key)) return;
  for (let listener of events.get(key)!) {
    try {
      listener(...fullArgs);
    } catch (err) {
      console.error(err);
    }
  }
}

function clear<T>(state: T) {
  getEvents(state).clear();
}

// extensions
function pure<T>(
  state: T | MinimalStateType<T> | StateType<T>
): T extends unknown[] ? T[0] : T {
  if (state instanceof Array) return state[0];
  let {set, update, on, emit, clear, _events, ...rest} = state as StateType<T>;
  return rest as never;
}

// this could be useful if it replicated use semantics exactly
function get<T, L extends keyof T>(state: T, key: L): T[L];
function get<T, L extends keyof T>(state: T): T extends unknown[] ? T[0] : T;
function get<T, L extends keyof T>(
  state: T,
  key?: L
): T[L] | (T extends unknown[] ? T[0] : T) {
  return key === undefined ? pure(state) : state[key];
}

function once<T>(
  state: T,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let listener_ = (...args: unknown[]) => {
    off(state, key, listener_);
    listener(...args);
  };
  return on(state, key, listener_);
}

function next<T>(state: T, key: keyof T | undefined) {
  return new Promise(r => once(state, key, value => r(value)));
}

async function until<T extends {}, K extends keyof T>(
  state: T,
  key: K,
  condition?: (value: T[K]) => boolean
): Promise<void> {
  let value = state[key];
  if (condition ? condition(value) : value) {
    return;
  } else {
    return new Promise(resolve => {
      let off = on(state, key, value => {
        if (condition ? condition(value as T[K]) : value) {
          off();
          resolve();
        }
      });
    });
  }
}

function is<T, L extends keyof T>(state: T, key: L, value: T[L]): void;
function is<T extends unknown[], L extends keyof T>(
  state: T,
  value: T[0]
): void;
function is<T extends {}, L extends keyof T>(state: T, value: Partial<T>): void;
function is<T, L extends keyof T>(
  state: T,
  keyOrValue: L | T[L] | Partial<T>,
  valueOrUndefined?: T[L]
) {
  (set as any)(state, keyOrValue, valueOrUndefined, true);
}

// internal infra
const EV = new Map<Object, Map<unknown, Set<(...args: unknown[]) => void>>>();
type EventMap<T> = Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
export type MinimalStateType<T> = T & {
  _events: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
};

function getEvents<T>(state: T | MinimalStateType<T> | StateType<T>) {
  return (
    (state as MinimalStateType<T>)._events ||
    ((EV.get(state) || EV.set(state, new Map()).get(state)) as EventMap<T>)
  );
}

function getKeyListener<T>(
  keyOrListener: keyof T | undefined | ((...args: unknown[]) => void),
  listenerOrNone?: ((...args: unknown[]) => void) | undefined
) {
  let noKey = listenerOrNone === undefined;
  let key = noKey ? undefined : (keyOrListener as keyof T | undefined);
  let listener = (noKey ? keyOrListener : listenerOrNone) as (
    ...args: unknown[]
  ) => void;
  return [key, listener] as const;
}

// old OO API
export type StateType<T> = T & {
  set<L extends keyof T>(
    key: L,
    valueOrFunction: T[L] | ((state: T[L]) => T[L])
  ): void;
  update(key?: keyof T): void;
  on(
    key: keyof T | undefined,
    listener: (...args: unknown[]) => void
  ): () => void;
  emit(key: keyof T | undefined, ...args: unknown[]): void;
  clear(): void;
  _events: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
};

function State<T extends {}, M extends true>(
  initialState: T,
  options?: {debug?: boolean; minimal?: M}
): MinimalStateType<T>;
function State<T extends {}, M extends false | undefined>(
  initialState: T,
  options?: {debug?: boolean; minimal?: M}
): StateType<T>;
function State<T extends {}, M extends boolean | undefined>(
  initialState: T,
  options?: {debug?: boolean; minimal?: M}
): StateType<T> | MinimalStateType<T> {
  type K = keyof T;
  let _events: EventMap<T> = new Map();

  let api = {
    // main API
    set<L extends keyof T>(
      key: L,
      valueOrFunction: T[L] | ((state: T[L]) => T[L])
    ) {
      set(state, key, valueOrFunction);
    },
    update(key?: keyof T) {
      update(state, key);
    },
    // lower level API, implements simple event emitter
    on(key: K | undefined, listener: (...args: unknown[]) => void) {
      return on(state, key, listener);
    },
    emit(key: K | undefined, ...args: unknown[]) {
      emit(state, key, ...args);
    },
    clear() {
      clear(state);
    },
    _events,
  };

  let state = options?.minimal
    ? Object.assign({_events}, initialState)
    : Object.assign({}, initialState, api);

  if (options?.debug) {
    on(state, (key, value) => {
      console.log('update', key, value);
    });
  }

  return state;
}

export default State;
