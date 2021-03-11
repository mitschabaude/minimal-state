export {set, update, on, off, once, emit, clear, pure, next, merge};

// main API
function set<T, L extends keyof T>(
  state: T,
  key: L,
  value: T[L] | ((value: T[L]) => T[L])
): void;
function set<T extends unknown[], L extends keyof T>(
  state: T,
  value: T[0]
): void;
function set<T, L extends keyof T>(
  state: T,
  keyOrValue: L | T[L] | ((state: T[L]) => T[L]),
  valueOrUndefined?: T[L] | ((state: T[L]) => T[L])
) {
  let twoParam = state instanceof Array && valueOrUndefined === undefined;
  let key = twoParam ? (0 as L) : (keyOrValue as L);
  let valueOrFunction = twoParam
    ? (keyOrValue as T[L] | ((state: T[L]) => T[L]))
    : (valueOrUndefined as T[L] | ((state: T[L]) => T[L]));

  let oldValue = state[key];
  let value =
    typeof valueOrFunction === 'function'
      ? (valueOrFunction as (state: T[L]) => T[L])(oldValue)
      : valueOrFunction;
  state[key] = value;

  emit(state, key, value, oldValue);
  if (twoParam) {
    emit(state, undefined, value, oldValue);
  } else {
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
      let value = state[0];
      emit(state, 0, value);
      emit(state, undefined, value);
    } else {
      emit(state, undefined);
    }
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
  let key: keyof T | undefined, listener: (...args: unknown[]) => void;
  if (listenerOrNone === undefined) {
    key = undefined;
    listener = keyOrListener as (...args: unknown[]) => void;
  } else {
    key = keyOrListener as keyof T | undefined;
    listener = listenerOrNone as (...args: unknown[]) => void;
  }
  if (!events.has(key)) events.set(key, new Set());
  events.get(key)!.add(listener);
  return () => off(state, key, listener);
}

function off<T>(
  state: T,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let events = getEvents(state);
  let listeners = events.get(key);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size === 0) events.delete(key);
}

function emit<T>(state: T, key: keyof T | undefined, ...args: unknown[]) {
  let events = getEvents(state);
  if (!events.has(key)) return;
  for (let listener of events.get(key)!) {
    try {
      listener(...args);
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

function merge<T>(state: T, newState: Partial<T>) {
  let oldState: Partial<T> = {};
  for (let key in newState) {
    oldState[key] = state[key];
    (state as T)[key] = newState[key] as T[typeof key];
  }
  for (let key in newState) {
    emit(state, key, newState[key], oldState[key]);
    emit(state, undefined, key, newState[key], oldState[key]);
  }
}

// internal infra for pure state
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
