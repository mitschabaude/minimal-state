# minimal-state

Probably the only React state management library I ever want to use.

- 🚀 Optimized for fast development. API supports mutable + immutable code styles
- 💡 Perfect TypeScript support
- 😎 Your state is a plain JS object. No bloated class, no proxy magic.
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
  // hook which returns fresh values, like useState
  let count = use(state, 'count');

  // there are two ways to update state:

  // 1. set() with a setState-like API
  let increment = () => set(state, 'count', count + 1);

  // 2. update() which only triggers component updates, is more flexible
  let setTo9000 = () => {
    state.count = 1000; // no magic, state is just an object
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

// behind the use() hook is a flexible event emitter API that you can use for other
// stuff as well:
on(state, 'count', c => console.log('The count is', c));

set(state, 'count', 10); // "The count is 10", updates component

state.count = 11;
update(state, 'count'); // "The count is 11", updates component

// set() and update() are synchronous
console.log(state.count); // "11"
```

## Without React

A version of the library without the `use` hook is also available as separate npm package, which does not depend on React:

```sh
yarn add minimal-state
```

In fact, `minimal-state` has no external dependencies at all (and is only 800 bytes). It can be useful as a general-purpose reactive state / event-emitter. Other than `use`, the packages `use-minimal-state` and `minimal-state` are exactly equivalent.

## API

The API of `minimal-state` adhers to the philosophy that...

> It is better to have 100 functions operate on one data structure than 10 functions on 10 data structures. — Alan Perlis

In our case there are two data types, which we call _state_ and _atom_.

- A _state_ is any JS hashmap, like `{}` or `{users: []}`.
- An _atom_ is any value wrapped in a single-element array, like `[1]` or `["wow"]` or `[{users: []}]`.

Both of these types can be made **reactive** because they can be changed while still keeping a stable reference (unlike plain strings or numbers).

I worked hard to make a reactive API that is as simple and intuitive as possible.

### Core API

```js
// use one state attribute
use(state, key) // == state[key]

// use list of attributes, in a list
use(state, [key1, key2, ...]) // == [state[key1], state[key2], ...]

// use entire state
use(state) // == shallow copy of state

// use an atom
use(atom) // == atom[0], the atom's value


// update state attribute
update(state, key);

// update atom
update(atom)


// set attribute (value)
set(state, key, value);

// set attribute (function)
set(state, key, oldValue => value);

// set multiple values at once by merging
set(state, {key: value, otherKey: otherValue});

// set the value of an atom
set(atom, value)

// set the value of an atom (function)
set(atom, oldValue => value)
```

To understand `update` vs `set`, it is best to think of `set(state, key, value)` as a shortcut for

```js
state[key] = value;
update(state, key);
```

Similarly, `set(atom, value)` is just

```js
atom[0] = value;
update(atom);
```

### Event Emitter API

The core API builds on top of four functions `emit, on, off, clear` that implement a simple event emitter.
Every `emit` triggers a call to all listeners registered with `on`.

```js
// emit event
emit(state, key, ...args);

// atom events don't have keys
emit(atom, ...args);

// listen to event with specific key
on(state, key, (...args) => {}); // (...args) are what is passed to emit

// listen to event with any key
on(state, (key, ...args) => {}); // (...args) are what is passed to emit

// listen to atom event
on(atom, (...args) => {}); // (...args) are what is passed to emit

// on() returns an unsubscribe function to stop listening
let unsubscribe = on(state, key, () => {});
unsubscribe();

// or unsubscribe directly (needs reference to the listener function)
let listener = (...args) => {};
off(state, key, listener);
off(atom, listener);

// unsubscribe all listeners (for all keys)
clear(state);
clear(atom);
/* TODO: clear(state, key) */
```

Internally, both `update(state, key)` and `set(state, key, value)` call `emit(state, key, ...args)` _twice_, but in slightly different ways:

```js
update(state, key);
// calls:
emit(state, key, state[key]);
emit(state, undefined, key, state[key]);
// triggers:
on(state, key, value => {});
on(state, (key, value) => {});

set(state, key, value);
// calls:
emit(state, key, value, oldValue);
emit(state, undefined, key, value, oldValue);
// triggers:
on(state, key, (value, oldValue) => {});
on(state, (key, value, oldValue) => {});
```

That is, if `on` listeners need access to the value _and_ the previous value, you always have to use `set` for changing it.

The `undefined` event is an internal "wildcard" event that gets triggered for every update.

Atom updates are a bit simpler:

```js
update(atom);
// calls:
emit(atom, atom[0]);
// triggers:
on(atom, value => {});

set(atom, value);
// calls:
emit(atom, value, oldValue);
// triggers:
on(atom, (value, oldValue) => {});
```

Side note: `use` calls `on` internally but does not look at the emitted value, so you can trigger `use(state, key)` either with `update(state, key)` or with `set(state, key, value)` or even with `emit(state, key)`.

### Additional API / helper functions

```js
once(state, key, listener);
```

Like `on`, but unsubscribes when called the first time.

```js
await next(state, key);
```

Promise that resolves on the next `emit` (= promisified `once`).

### Object-oriented API

The main cost of the functional approach is that consumers of a `state` object have to import all the functions. This is a burden if you want your state to be encapsulated – e.g. you use `minimal-state` in a library/package and want to expose a `state` object to the outside to emit change events. Requiring your package consumers to import an additional peer dependency would be awkward.

This is where OO shines, and why we also provide an OO version with the core functions as _methods_ on your `state` object:

```js
const state = State({count: 0}); // call State() to add methods to state
state.set('count', 1);

// consumers don't need our library now:
export {state};
```

Full OO API:

```js
import State from 'use-minimal-state';

// create state instance (= shallow copy of initialState plus methods)
let state = State(initialState);

state.set(key, value); // set(state, key, value)
state.update(key); // update(state, key)
state.on(key, listener); // on(state, key, listener), returns unsubscribe
state.emit(key, ...args); // emit(state, key, ...args)
state.clear(); // clear(state)

// this is only available if State is imported from use-minimal-state
state.use(key); // use(state, key)

// get back a snapshot of the state without methods
pure(state);

// Example:
let state = State({count: 0});
state.set('count', 1);
JSON.stringify(pure(state)); // "{\"count\": 1}"
```
