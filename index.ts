// simple and powerful implementation of react global state
import {useEffect, useState} from 'react';

export default function <T extends {}>(state: T) {
  type K = keyof T;
  let map = new Map<K | undefined, Set<() => void>>();

  function use<L extends K>(): T;
  function use<L extends K>(key: L): T[L];
  function use<L extends K>(key?: L): T[L] | T {
    let [, setState] = useState(0);
    useEffect(() => {
      let isOff = false;
      let updater = () => {
        if (!isOff) setState(n => n + 1);
      };
      self.on(key, updater);
      return () => {
        isOff = true;
        self.off(key, updater);
      };
    }, [key]);
    return key === undefined ? state : state[key];
  }

  let self = {
    // main API
    use,

    set<L extends K>(key: L, value: T[L]) {
      state[key] = value;
      self.update(key);
    },

    update(key?: K) {
      self.emit(key);
      if (key !== undefined) self.emit(undefined);
    },

    // lower level API, implements simple event emitter
    on(key: K | undefined, listener: () => void) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(listener);
    },

    off(key: K | undefined, listener: () => void) {
      let listeners = map.get(key);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) map.delete(key);
    },

    emit(key: K | undefined) {
      if (!map.has(key)) return;
      for (let listener of map.get(key)!) {
        try {
          listener();
        } catch (err) {
          console.error(err);
        }
      }
    },

    map,
  };

  return Object.assign(self, state);
}
