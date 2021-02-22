export type StateType<T> = T & {
  get: {
    <L extends keyof T>(): T;
    <L extends keyof T>(key: L): T[L];
  };
  set<L extends keyof T>(
    key: L,
    valueOrFunction: T[L] | ((state: T[L]) => T[L])
  ): void;
  update(key?: keyof T | undefined): void;
  on(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  off(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  emit(key: keyof T | undefined, ...args: unknown[]): void;
  once(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  clear(): void;
  map: Map<keyof T | undefined, Set<(...args: unknown[]) => void>>;
};

export default function State<T extends {}>(initialState: T): StateType<T> {
  type K = keyof T;
  let map = new Map<K | undefined, Set<(...args: unknown[]) => void>>();

  let api = {
    // main API
    get: (<L extends K>(key?: L): T[L] | T => {
      return key === undefined ? state : state[key];
    }) as {
      <L extends K>(): T;
      <L extends K>(key: L): T[L];
    },

    set<L extends K>(key: L, valueOrFunction: T[L] | ((state: T[L]) => T[L])) {
      let value =
        typeof valueOrFunction === 'function'
          ? (valueOrFunction as (state: T[L]) => T[L])(state[key])
          : valueOrFunction;
      (state as T)[key] = value;
      api.update(key);
    },

    update(key?: K) {
      if (key !== undefined) {
        api.emit(key, state[key]);
      }
      api.emit(undefined, state);
    },

    // lower level API, implements simple event emitter
    on(key: K | undefined, listener: (...args: unknown[]) => void) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(listener);
    },

    off(key: K | undefined, listener: (...args: unknown[]) => void) {
      let listeners = map.get(key);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) map.delete(key);
    },

    emit(key: K | undefined, ...args: unknown[]) {
      if (!map.has(key)) return;
      for (let listener of map.get(key)!) {
        try {
          listener(...args);
        } catch (err) {
          console.error(err);
        }
      }
    },

    once(key: K | undefined, listener: (...args: unknown[]) => void) {
      let listener_ = (...args: unknown[]) => {
        try {
          listener(...args);
        } catch (err) {
          console.error(err);
        }
        api.off(key, listener_);
      };
      api.on(key, listener_);
    },

    clear() {
      map.clear();
    },

    map,
  };

  let state = Object.assign(initialState, api);
  return state;
}
