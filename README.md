# minimal-state

Probably the only React state management library I ever want to use.

- 🚀 Optimized for fast development. API supports mutable + immutable code styles
- 💡 Perfect TypeScript support
- 🪶 758 bytes minzipped - so light-weight you can just drop it anywhere

```sh
yarn add use-minimal-state
```

```js
import React from 'react';
import State, {use, set, update} from 'use-minimal-state';

// define state (there can be many of these in your app)
const state = State({count: 0});

// read values
console.log('counter', state.count); // no magic proxy involved here

function App() {
  // hook which returns up to date values
  let count = use(state, 'count');
  return (
    <>
      <div>{count} </div>
      {/* setState-like API */}
      <button onClick={() => set(state, 'count', c => c + 1)}>+1</button>
      {/* more flexible, mutable API - call update() when you're ready */}
      <button
        onClick={() => {
          state.count = 9000;
          update(state, 'count');
        }}
      >
        9000
      </button>
    </>
  );
}
```

## Without React

There is an even smaller submodule (788 bytes) that does not depend on React and contains the reactive `State` API without the `use` hook:

```sh
yarn add minimal-state
```

```js
import State from 'minimal-state';

let state = State({count: 0});

state.on('count', c => console.log('The count is', c));

state.set('count', c => c + 1);
// "The count is 1"

state.count = 9000;
state.update('count');
// "The count is 9000"

state.clear(); // removes all event listeners
```

The API is written in a functional style `set(state, 'count', 1)` but for convenience the core methods are also tacked to the state object `state.set('count', 1)`.

## API Reference

_TODO_
