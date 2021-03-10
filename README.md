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
      <div>{count} </div>
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

The entire API _except_ the `use` hook is also available as separate npm package which does not depend on React:

```sh
yarn add minimal-state
```

In fact, `minimal-state` has no external dependencies at all and is only 800 bytes minzipped. It can be useful as a general-purpose reactive state / event-emitter.

## Object-oriented API

The core, functional API of `use-minimal-state` adhers to the philosophy that...

> It is better to have 100 functions operate on one data structure than 10 functions on 10 data structures. — Alan Perlis

This is why we model `state` as a plain JS object and keep the complexity of reactivity hidden in a library of functions that operate on that object:

```js
const state = {count: 0};
set(state, 'count', 1);
```

The main cost of that approach is that all consumers of the `state` object have to import the functions. This is a burden if you want your state to be an encapsulated thing – e.g. you use `minimal-state` in a library/package and want to expose the `state` object to the outside to emit change events. Requiring your package consumers to import an additional peer dependency would be awkward.

Here is where OO shines, and why we also provide an OO version where the core functions are _methods_ on your `state` object:

```js
const state = State({count: 0}); // call State() to add methods to your state
state.set('count', 1);

// consumers don't need our library now:
export {state};
```

More comprehensive example:

```js
import State, {set} from 'minimal-state';

let state = State({count: 0});

state.on('count', c => console.log('The count is', c));

state.set('count', c => c + 1);
// "The count is 1"

// the methods are merged into your object, so you can still
// read and write like properties like always

console.log(state.count);
// "1"

state.count = 9000;
state.update('count');
// "The count is 9000"

// normal library functions still work as well
set(state, 'count', 0);
// "The count is 0"
```

_TODO: `.use()` is not on the State object yet._

## API Reference

_TODO_
