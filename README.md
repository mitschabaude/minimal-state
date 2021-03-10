# minimal-state

Probably the only React state management library I ever want to use.

- 🚀 Optimized for fast development. API supports mutable + immutable code styles
- 💡 Your state is a plain JS object. No magic, no proxies.
- ⚙️ Perfect TypeScript support
- 🪶 1 kB minzipped - just drop it anywhere

```sh
yarn add use-minimal-state
```

```js
import React from 'react';
import {use, set, update, on} from 'use-minimal-state';

// your state is just an object
const state = {count: 0};

function App() {
  // hook which returns up to date values
  let count = use(state, 'count');

  // there are two main ways to update the state:

  // 1. set() which has a setState-like API
  let increment = () => set(state, 'count', c => c + 1);

  // 2. update() which just triggers component updates
  // this enables flexible state mutating without magic
  let setTo9000 = () => {
    state.count = 9000; // boring JS, does nothing special
    update(state, 'count'); // updates use() hook
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
// concerns as well, like logging:
on(state, 'count', c => console.log('The count is', c));

set(state, 'count', 10); // logs "The count is 10", updates component

// set() and update() are synchronous
console.log(state.count); // logs "10"
```

## Without React

The entire API _except_ the `use` hook is available as a separate npm package, which does not depend on React:

```sh
yarn add minimal-state
```

In fact, `minimal-state` has no external dependencies at all and is only 800 bytes minzipped. It can very be useful as a general-purpose reactive state / event-emitter.

## Object-oriented state

The API of `use-minimal-state` adhers to the philosophy that...

> It is better to have 100 functions operate on one data structure than 10 functions on 10 data structures. — Alan Perlis

This is why we model `state` as a plain JS object and keep the complexity of reactivity hidden in a library of functions that operate on that object:

```js
const state = {count: 0};
set(state, 'count', 0);
```

You could call it "functional programming" if you like (although our library functions are entirely impure).

The main cost of that approach is that consumers of the `state` object have to include the function library to operate on it. This is a burden if you want your state to be an encapsulated thing – e.g. you use `minimal-state` in a library/package and want to expose the `state` object to the outside to emit change events. Requiring your package consumers to import an additional peer dependency would be awkward.

Here is where OO shines, and that is why we also provide an OO version where the core functions are _methods_ on your `state` object:

```js
const state = State({count: 0});
state.set('count', 1);

// consumers don't need our library now:
export {state};
```

More comprehensive example:

```js
import State, {set} from 'minimal-state';

let state = State({count: 0}); // call State to add methods to your state

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

## API Reference

_TODO_
