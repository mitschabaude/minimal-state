// simple and powerful implementation of react global state
import {useEffect, useState} from 'react';

export type StateType<T> = {
  get: {
    (): T;
    <L extends keyof T>(key?: L): T[L];
  };
  on(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  off(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
};

function use<T>(state: StateType<T>): T;
function use<T, L extends keyof T>(state: StateType<T>, key: L): T[L];
function use<T, L extends keyof T>(state: StateType<T>, key?: L) {
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
  return state.get(key);
}

export {use};
