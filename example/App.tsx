import {render} from 'react-dom';
import React from 'react';
import {use, set, update, on, next, merge} from 'use-minimal-state';

type Todo = {name: string; done: boolean};
const state = {
  todos: [] as Todo[],
  newTodo: null as Todo | null,
  lastEdit: null as Date | null,
};
// debug
on(state, (key, value) => console.log('update', key, value));

// computed properties
on(state, 'todos', () => set(state, 'lastEdit', new Date()));

// do something on next state change
(async () => {
  await next(state, 'todos');
  if (state.todos.length > 0) {
    alert('Congrats! You added your first todo!');
  }
})();

function App() {
  let [todos, lastEdit] = use(state, ['todos', 'lastEdit']);
  let clear = () => set(state, 'todos', todos => todos.filter(t => !t.done));
  return (
    <div>
      <h1>Todos ({todos.length})</h1>
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
          merge(state, {newTodo: null});
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
