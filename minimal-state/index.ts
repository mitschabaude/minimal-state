export type MinimalStateType<T> = T & {
  _events: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
  _debug: boolean;
};

export type StateType<T> = T & {
  set<L extends keyof T>(
    key: L,
    valueOrFunction: T[L] | ((state: T[L]) => T[L])
  ): void;
  update(key?: keyof T): void;
  on(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  off(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  emit(key: keyof T | undefined, ...args: unknown[]): void;
  clear(): void;
  _events: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
  _debug: boolean;
};

export default function State<T extends {}>(
  initialState: T,
  options?: {debug: boolean}
): StateType<T> {
  type K = keyof T;
  let _events = new Map<K | undefined, Set<(...args: unknown[]) => void>>();
  let _debug = options?.debug || false;

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
      on(state, key, listener);
    },
    off(key: K | undefined, listener: (...args: unknown[]) => void) {
      off(state, key, listener);
    },
    emit(key: K | undefined, ...args: unknown[]) {
      emit(state, key, ...args);
    },
    clear() {
      clear(state);
    },
    _events,
    _debug,
  };

  let state = Object.assign({}, initialState, api);
  return state;
}

export {get, set, update, on, off, once, emit, clear};

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
  if (state._debug) console.log('update', key, value);
  emit(state, key, value, oldValue);
  emit(state, undefined, state);
}

function update<T>(state: MinimalStateType<T>, key?: keyof T) {
  if (key !== undefined) {
    if (state._debug) console.log('update', key, state[key]);
    emit(state, key, state[key]);
  }
  emit(state, undefined, state);
}

// lower level API, implements simple event emitter
function on<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  if (!state._events.has(key)) state._events.set(key, new Set());
  state._events.get(key)!.add(listener);
}

function off<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let listeners = state._events.get(key);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size === 0) state._events.delete(key);
}

function emit<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  ...args: unknown[]
) {
  if (!state._events.has(key)) return;
  for (let listener of state._events.get(key)!) {
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
function get<T, L extends keyof T>(state: MinimalStateType<T>): T;
function get<T, L extends keyof T>(state: MinimalStateType<T>, key: L): T[L];
function get<T, L extends keyof T>(
  state: MinimalStateType<T>,
  key?: L
): T[L] | T {
  return key === undefined ? state : state[key];
}

function once<T>(
  state: MinimalStateType<T>,
  key: keyof T | undefined,
  listener: (...args: unknown[]) => void
) {
  let listener_ = (...args: unknown[]) => {
    try {
      listener(...args);
    } catch (err) {
      console.error(err);
    }
    off(state, key, listener_);
  };
  on(state, key, listener_);
}
