// simple and powerful implementation of react global state
import {useEffect, useState} from 'react';

export default function <T extends {}>(initialState: T) {
  type K = keyof T;
  let map = new Map<K | undefined, Set<(...args: unknown[]) => void>>();

  let api = {
    // main API
    use: (<L extends K>(key?: L): T[L] | T => {
      let [, setState] = useState(0);
      useEffect(() => {
        let isOff = false;
        let updater = () => {
          if (!isOff) setState(n => n + 1);
        };
        state.on(key, updater);
        return () => {
          isOff = true;
          state.off(key, updater);
        };
      }, [key]);
      return key === undefined ? state : state[key];
    }) as {
      <L extends K>(): T;
      <L extends K>(key: L): T[L];
    },

    set<L extends K>(key: L, value: T[L]) {
      (state as T)[key] = value;
      state.update(key);
    },

    update(key?: K) {
      state.emit(key);
      if (key !== undefined) state.emit(undefined);
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

    map,
  };

  let state = Object.assign(initialState, api);
  return state;
}
