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

// produce non-state events
document.addEventListener('mousedown', () => emit('mousedown', Date.now()));
on('mousedown', time => console.log('mouse down', time));

function App() {
  let {newTodo, todos, lastEdit} = use();
  let add = () => set('newTodo', {name: '', done: false});
  let clear = () =>
    set(
      'todos',
      todos.filter(t => !t.done)
    );
  return (
    <div>
      <h1>Todos ({todos.length})</h1>
      <p>
        {todos.map((todo, i) => (
          <TodoItem key={todo.name + i} todo={todo} />
        ))}
      </p>
      <p>{(newTodo && <TodoInput />) || <button onClick={add}>Add</button>}</p>
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
    <>
      <input
        autoFocus
        type="text"
        onChange={({target: {value}}) => {
          set('newTodo', {name: value, done: false});
        }}
        value={newTodo?.name}
      />
      <br />
      <button
        onClick={() => {
          if (!newTodo) return;
          state.todos.push(newTodo);
          update('todos');
          set('newTodo', null);
        }}
      >
        Add
      </button>
      <button onClick={() => set('newTodo', null)}>Cancel</button>
    </>
  );
}

render(<App />, document.getElementById('root'));
