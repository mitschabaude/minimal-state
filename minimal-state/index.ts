export type MinimalStateType<T> = T & {
  _events: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
};

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
  options?: {debug: boolean; minimal: M}
): MinimalStateType<T>;
function State<T extends {}, M extends false | undefined>(
  initialState: T,
  options?: {debug: boolean; minimal: M}
): StateType<T>;
function State<T extends {}, M extends boolean | undefined>(
  initialState: T,
  options?: {debug: boolean; minimal: M}
): StateType<T> | MinimalStateType<T> {
  type K = keyof T;
  let _events = new Map<K | undefined, Set<(...args: unknown[]) => void>>();

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
export {get, set, update, on, off, once, emit, clear, pure, next, merge};

// main API
function set<T, L extends keyof T>(
  state: MinimalStateType<T>,
  key: L,
  valueOrFunction: T[L] | ((state: T[L]) => T[L])
) {
  let oldValue = state[key];
  let value =
    typeof valueOrFunction === 'function'
      ? (valueOrFunction as (state: T[L]) => T[L])(state[key])
      : valueOrFunction;
  (state as T)[key] = value;
  emit(state, key, value, oldValue);
  emit(state, undefined, key, value, oldValue);
}

function update<T>(state: MinimalStateType<T>, key?: keyof T) {
  if (key !== undefined) {
    let value = state[key];
    emit(state, key, value);
    emit(state, undefined, key, value);
  } else {
    emit(state, undefined);
  }
}

// lower level API, implements simple event emitter
function on<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
): () => void;
function on<T>(
  state: MinimalStateType<T>,
  listener: (...args: unknown[]) => void
): () => void;
function on<T>(
  state: MinimalStateType<T>,
  keyOrListener: keyof T | undefined | ((...args: unknown[]) => void),
  listenerOrNone?: ((...args: unknown[]) => void) | undefined
) {
  let {_events} = state;
  let key: keyof T | undefined, listener: (...args: unknown[]) => void;
  if (listenerOrNone === undefined) {
    key = undefined;
    listener = keyOrListener as (...args: unknown[]) => void;
  } else {
    key = keyOrListener as keyof T | undefined;
    listener = listenerOrNone as (...args: unknown[]) => void;
  }
  if (!_events.has(key)) _events.set(key, new Set());
  _events.get(key)!.add(listener);
  return () => off(state, key, listener);
}

function off<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let {_events} = state;
  let listeners = _events.get(key);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size === 0) _events.delete(key);
}

function emit<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  ...args: unknown[]
) {
  let {_events} = state;
  if (!_events.has(key)) return;
  for (let listener of _events.get(key)!) {
    try {
      listener(...args);
    } catch (err) {
      console.error(err);
    }
  }
}

function clear<T>(state: MinimalStateType<T>) {
  state._events.clear();
}

// extensions
function pure<T>(state: MinimalStateType<T>): T {
  let {clear, emit, on, set, update, _events, ...rest} = state as StateType<T>;
  return rest as never;
}

function get<T, L extends keyof T>(state: MinimalStateType<T>, key: L): T[L];
function get<T, L extends keyof T>(state: MinimalStateType<T>): T;
function get<T, L extends keyof T>(
  state: MinimalStateType<T>,
  key?: L
): T[L] | T {
  return key === undefined ? pure(state) : state[key];
}

function once<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let listener_ = (...args: unknown[]) => {
    off(state, key, listener_);
    listener(...args);
  };
  return on(state, key, listener_);
}

function next<T>(state: MinimalStateType<T>, key: keyof T | undefined) {
  return new Promise(r => once(state, key, value => r(value)));
}

function merge<T>(state: MinimalStateType<T>, newState: Partial<T>) {
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
