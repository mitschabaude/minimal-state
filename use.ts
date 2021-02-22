// simple and powerful implementation of react global state
import {useEffect, useState} from 'react';
import {StateType} from './state';

function use<T>(state: StateType<T>): T;
function use<T, L extends keyof T>(state: StateType<T>, key: L): T[L];
function use<T, L extends keyof T>(state: StateType<T>, key?: L): T[L] | T {
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
}

export {use};
