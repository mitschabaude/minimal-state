# use-minimal-state

Probably the only React state management library I ever want to use.

- 🚀 Optimized for fast development. API supports mutable + immutable code styles
- 💡 Perfect TypeScript support
- 🪶 667 bytes minzipped - so light-weight you can just drop it anywhere

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
