# minimal-state

Probably the only React state management library I ever want to use.

- 🚀 Optimized for fast development. API supports mutable + immutable code styles
- ⚙️ Perfect TypeScript support
- 💡 Your state is a plain JS object. No bloated class, no magic proxy.
- 🪶 1 kB minzipped - just drop it anywhere

```sh
yarn add use-minimal-state
```

```js
import React from 'react';
import {use, set, update, on} from 'use-minimal-state';

// the state is just an object
const state = {count: 0};

function App() {
  // hook which returns fresh values
  let count = use(state, 'count');

  // there are two ways to update state:

  // 1. set() with a setState-like API
  let increment = () => set(state, 'count', c => c + 1);

  // 2. update() which just triggers component updates and is super flexible
  let setTo9000 = () => {
    state.count = 1000; // boring JS, no magic
    state.count *= 9;
    update(state, 'count'); // update when you're ready
  };

  return (
    <>
      <div>{count}</div>
      <button onClick={increment}>+1</button>
      <button onClick={setTo9000}>9000</button>
    </>
  );
}

// behind the use() hook is a simple event emitter API that you can use for other
// stuff as well, like logging:
on(state, 'count', c => console.log('The count is', c));

set(state, 'count', 10); // "The count is 10", updates component

// set() and update() are synchronous
console.log(state.count); // "10"
```

## Without React

A version of the library without the `use` hook is also available as separate npm package, which does not depend on React:

```sh
yarn add minimal-state
```

In fact, `minimal-state` has no external dependencies at all (and is only 800 bytes). It can be useful as a general-purpose reactive state / event-emitter. Other than `use`, the packages `use-minimal-state` and `minimal-state` are exactly equivalent.

## Functional API

The API of `minimal-state` adhers to the philosophy that...

> It is better to have 100 functions operate on one data structure than 10 functions on 10 data structures. — Alan Perlis

This is why we model `state` as a plain JS object and keep the complexity of reactivity hidden in a library of functions that operate on that object.

### API Reference

#### Core API

```js
// use one state attribute:
use(state, key) // == state[key]

// use list of attributes, in a list
use(state, [key1, key2, ...]) // == [state[key1], state[key2], ...]

// use entire state
use(state) // == shallow copy of state


// update attribute
update(state, key);


// set attribute (value)
set(state, key, value);

// set attribute (function)
set(state, key, (oldValue) => { return value });
```

To understand the difference between `update` and `set`, it is best to think of `set(state, key, value)` as a shortcut for

```js
state[key] = value;
update(state, key);
```

#### Event Emitter API

The core API builds on top of four functions `emit, on, off, clear` that implement a simple event emitter.
Every `emit` triggers a call to all listeners registered with `on`.

```js
// emit event
emit(state, key, ...args);

// listen to event with specific key
on(state, key, (...args) => {}); // (...args) are what is passed to emit

// listen to event with any key
on(state, (key, ...args) => {}); // (...args) are what is passed to emit

/* on() returns an unsubscribe function to stop listening */
let unsubscribe = on(state, key, () => {});
unsubscribe();

// or unsubscribe directly (needs reference to the listener function)
let listener = (...args) => {};
on(state, key, listener);
off(state, key, listener);

// unsubscribe all listeners, for all keys
clear(state);
/* TODO: clear(state, key) */
```

Internally, both `update(state, key)` and `set(state, key, value)` call `emit(state, key, ...args)` _twice_, but in slightly different ways:

```js
update(state, key);
// calls:
emit(state, key, state[key]);
emit(state, undefined, key, state[key]);

set(state, key, value);
// calls:
emit(state, key, value, state[key]); // state[key] is the previous value!
emit(state, undefined, key, value, state[key]);
```

That is, if your `on` listeners need access to the value _and_ the previous value, you have to always change the state with `set`.

Thus, the `undefined` event is a special "wildcard" event that gets triggered for every update.

Side note: `use` calls `on` internally but does not even look at the emitted value, so you can trigger `use(state, key)` either with `update(state, key)` or with `set(state, key, value)` or even with `emit(state, key)`.

#### Additional API / helper functions

This list of useful extensions may grow over time:

```js
once(state, key, listener);
```

Like `on`, but unsubscribes when called the first time.

```js
await next(state, key);
```

Promise that resolves on the next `emit` (= promisified `once`).

```js
merge(state, newState);
```

Like `set` for multiple key-value pairs, can be DRYer e.g. `set(state, "count", count)` is equivalent to `merge(state, {count})`.

## Object-oriented API

The main cost of the functional approach is that consumers of a `state` object have to import all the functions. This is a burden if you want your state to be encapsulated – e.g. you use `minimal-state` in a library/package and want to expose a `state` object to the outside to emit change events. Requiring your package consumers to import an additional peer dependency would be awkward.

This is where OO shines, and why we also provide an OO version with the core functions as _methods_ on your `state` object:

```js
const state = State({count: 0}); // call State() to add methods to state
state.set('count', 1);

// consumers don't need our library now:
export {state};
```

Comprehensive example:

```js
import State, {set, pure} from 'minimal-state';

let state = State({count: 0});

state.on('count', c => console.log('The count is', c));

state.set('count', c => c + 1);
// "The count is 1"

// the methods are merged into your object, so you can still
// read and write properties like always

console.log(state.count);
// "1"

state.count = 9000;
state.update('count');
// "The count is 9000"

// function library still works as well
set(state, 'count', 0);
// "The count is 0"

state.clear();

// get back a snapshot of the state without methods
let pureState = pure(state);
JSON.stringify(pureState); // "{\"count\": 0}"
```

The full list of methods on the object returned by `State` is
`set, update, on, emit, clear`, plus an internal `_events` property which holds attached listeners.

_TODO: `use` should be a method as well when `State` is imported from `use-minimal-state`._
