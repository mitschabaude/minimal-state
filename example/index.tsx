import {render} from 'react-dom';
import React from 'react';
import State from 'minimal-state/dist/index';

type Todo = {name: string; done: boolean};
let state = State({todos: [] as Todo[], newTodo: null as Todo | null});
let {use, set, update, on, off} = state;

on('todos', onFirstTodo);

function onFirstTodo() {
  alert('Congrats! You added your first todo!');
  off('todos', onFirstTodo);
}

function App() {
  let {newTodo, todos} = use();
  return (
    <div>
      <h1>Todos</h1>
      <p>
        {todos.map((todo, i) => (
          <TodoItem key={todo.name + i} todo={todo} />
        ))}
      </p>
      {(newTodo && <TodoInput />) || (
        <button onClick={() => set('newTodo', {name: '', done: false})}>
          Add
        </button>
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
      </span>{' '}
      <button
        onClick={() => {
          let i = state.todos.indexOf(todo);
          state.todos.splice(i, 1);
          update('todos');
        }}
      >
        x
      </button>
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
