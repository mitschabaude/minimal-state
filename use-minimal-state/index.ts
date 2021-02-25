// simple and powerful implementation of react global state
import {useEffect, useRef, useState} from 'react';

export {
  default as default,
  get,
  set,
  update,
  on,
  off,
  once,
  emit,
  clear,
} from 'minimal-state';

export {use};

type StateType<T> = T & {
  on(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
  off(key: keyof T | undefined, listener: (...args: unknown[]) => void): void;
};

function use<T>(state: StateType<T>): T;
function use<T, L extends keyof T>(state: StateType<T>, key: L): T[L];
function use<
  T,
  K extends readonly [keyof T, ...(keyof T)[]] | readonly (keyof T)[]
>(
  state: StateType<T>,
  keys: K
): {[P in keyof K]: T[K[P] extends keyof T ? K[P] : never]};
function use<
  T,
  L extends keyof T | undefined,
  K extends readonly [keyof T, ...(keyof T)[]] | readonly (keyof T)[]
>(state: StateType<T>, key?: L | K) {
  let [, setState] = useState(0);
  let newKeys: K = key instanceof Array ? key : (([key] as unknown) as K);
  let keys = useStableArray(newKeys);

  useEffect(() => {
    let isOff = false;
    let updater = () => {
      if (!isOff) {
        setState(n => n + 1);
      }
    };
    for (let key of keys) {
      state.on(key, updater);
    }
    return () => {
      isOff = true;
      for (let key of keys) {
        state.off(key, updater);
      }
    };
  }, [keys]);

  return key instanceof Array
    ? (keys.map(key => state[key]) as never)
    : key === undefined
    ? state
    : state[key as keyof T];
}

// original, simple use
function useOne<T>(state: StateType<T>): T;
function useOne<T, L extends keyof T>(state: StateType<T>, key: L): T[L];
function useOne<T, L extends keyof T>(state: StateType<T>, key?: L) {
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
  return key === undefined ? state : state[key as keyof T];
}

// use with only array param
function useMany<
  T,
  K extends readonly [keyof T, ...(keyof T)[]] | readonly (keyof T)[]
>(
  state: StateType<T>,
  keys: K
): {[P in keyof K]: T[K[P] extends keyof T ? K[P] : never]} {
  let [, setState] = useState(0);
  let keys_ = useStableArray(keys);

  useEffect(() => {
    let isOff = false;
    let updater = () => {
      if (!isOff) setState(n => n + 1);
    };
    for (let key of keys_) {
      state.on(key, updater);
    }
    return () => {
      isOff = true;
      for (let key of keys_) {
        state.off(key, updater);
      }
    };
  }, [keys_]);
  return keys_.map(key => state[key]) as never;
}

function useStableArray<A extends readonly unknown[]>(newArray: A) {
  let oldArrayRef = useRef(newArray);
  let oldArray = oldArrayRef.current;
  let stableArray = arrayEqual(oldArray, newArray) ? oldArray : newArray;
  useEffect(() => {
    oldArrayRef.current = stableArray;
  }, [stableArray]);
  return stableArray;
}

function arrayEqual(a: readonly unknown[], b: readonly unknown[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// magic helper function which is the basis of the typing in useMany

// let a = mapKeysToValues({a: 1, b: 's', c: true}, ['a', 'c']);
// a: [number, boolean]

function mapKeysToValues<
  T,
  K extends readonly [keyof T, ...(keyof T)[]] | readonly (keyof T)[]
>(o: T, keys: K): {[P in keyof K]: T[K[P] extends keyof T ? K[P] : never]} {
  return keys.map(key => o[key]) as never;
}
