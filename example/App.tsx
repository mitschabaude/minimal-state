import {render} from 'react-dom';
import React from 'react';
import State from 'minimal-state';

type Todo = {name: string; done: boolean};
let state = State({
  todos: [] as Todo[],
  newTodo: null as Todo | null,
  lastEdit: null as Date | null,
  mousedown: null,
});
let {use, set, update, on, off, emit} = state;

// computed properties
on('todos', () => set('lastEdit', new Date()));

// do something on state changes
on('todos', function onFirstTodo() {
  if (state.todos.length > 0) {
    alert('Congrats! You added your first todo!');
    off('todos', onFirstTodo);
  }
});

// emit arbitrary events
document.addEventListener('mousedown', () => emit('mousedown', Date.now()));
on('mousedown', time => console.log('mouse down', time));

function App() {
  let {todos, lastEdit} = use();
  let clear = () =>
    set(
      'todos',
      todos.filter(t => !t.done)
    );
  return (
    <div>
      <h1>Todos ({todos.length})</h1>
      <TodoInput />
      <p>
        {todos.map((todo, i) => (
          <TodoItem key={todo.name + i} todo={todo} />
        ))}
      </p>
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
      <input
        type="checkbox"
        checked={done}
        onChange={({target: {checked}}) => {
          todo.done = checked;
          update('todos');
        }}
      />
      <span style={done ? {textDecoration: 'line-through'} : undefined}>
        {name}
      </span>
    </div>
  );
}

function TodoInput() {
  let newTodo = use('newTodo');
  return (
    <input
      type="text"
      placeholder="Add Todo and press Enter"
      onChange={({target: {value}}) => {
        set('newTodo', {name: value, done: false});
      }}
      onKeyPress={({key}) => {
        if (key === 'Enter') {
          if (!newTodo) return;
          state.todos.push(newTodo);
          update('todos');
          set('newTodo', null);
        }
      }}
      value={newTodo?.name || ''}
    />
  );
}

render(<App />, document.getElementById('root'));
