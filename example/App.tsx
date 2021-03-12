import {render} from 'react-dom';
import React from 'react';
import {use, set, update, on, next} from 'use-minimal-state';

type Todo = {name: string; done: boolean};

// state
const state = {
  todos: [] as Todo[],
  newTodo: null as Todo | null,
  lastEdit: null as Date | null,
};
// atom (= wrap anything in an array)
const numberOfTodos = [5];

// debug
on(state, (key, value) => console.log('update', key, value));
on(numberOfTodos, n => console.log('number of todos', n));

// computed properties
on(state, 'todos', () => set(state, 'lastEdit', new Date()));
on(state, 'todos', () => set(numberOfTodos, state.todos.length));

set(state, {newTodo: {name: 'Write todos', done: false}});
set(numberOfTodos, () => 0);

// do something on next state change
(async () => {
  await next(state, 'todos');
  if (state.todos.length > 0) {
    alert('Congrats! You added your first todo!');
  }
})();

function App() {
  let {lastEdit} = use(state);
  let [todos] = use(state, ['todos']);
  let ntd = use(numberOfTodos);
  let clear = () => set(state, 'todos', todos => todos.filter(t => !t.done));
  return (
    <div>
      <h1>Todos ({ntd})</h1>
      <TodoInput />
      <Space />
      <div>
        {todos.map((todo, i) => (
          <TodoItem key={todo.name + i} todo={todo} />
        ))}
      </div>
      <p>
        <button onClick={clear}>Clear</button>
      </p>
      {lastEdit && (
        <p style={{color: '#aaa'}}>Last edited: {lastEdit.toLocaleString()}</p>
      )}
    </div>
  );
}

function TodoItem({todo}: {todo: Todo}) {
  let {name, done} = todo;
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={done}
          onChange={({target: {checked}}) => {
            todo.done = checked;
            update(state, 'todos');
          }}
        />
        <span style={done ? {textDecoration: 'line-through'} : undefined}>
          {name}
        </span>
      </label>
    </div>
  );
}

function TodoInput() {
  let newTodo = use(state, 'newTodo');
  return (
    <input
      type="text"
      placeholder="Add Todo and press Enter"
      onChange={({target: {value}}) => {
        set(state, 'newTodo', {name: value, done: false});
      }}
      onKeyPress={({key}) => {
        if (key === 'Enter') {
          if (!newTodo) return;
          state.todos.push(newTodo);
          update(state, 'todos');
          set(state, {newTodo: null});
        }
      }}
      value={newTodo?.name || ''}
    />
  );
}

function Space({rem = 1}) {
  return <div style={{height: `${rem}rem`}}></div>;
}

render(<App />, document.getElementById('root'));
