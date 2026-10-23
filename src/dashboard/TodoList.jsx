import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import useLocalStorage from '../hooks/useLocalStorage';
import { on } from '../lib/bus';
import { gsap } from '../lib/motion';

export default function TodoList() {
  const [todos, setTodos] = useLocalStorage('devorbit.todos', [
    { id: 1, text: 'Open the Git Lab and finish quest 1', done: false },
    { id: 2, text: 'Solve one LeetCode problem', done: false },
  ]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const list = useRef(null);

  const add = (t) => {
    if (!t.trim()) return;
    setTodos((ts) => [{ id: Date.now(), text: t.trim(), done: false }, ...ts]);
  };
  useEffect(() => on('todo', add), []);

  useEffect(() => {
    const first = list.current?.querySelector('li');
    if (first) gsap.fromTo(first, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
  }, [todos.length]);

  const remove = (id, el) =>
    gsap.to(el, { x: 40, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.3, ease: 'power2.in', onComplete: () => setTodos((ts) => ts.filter((t) => t.id !== id)) });

  const shown = todos.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done));
  const left = todos.filter((t) => !t.done).length;

  return (
    <div className="todo">
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); add(text); setText(''); }}>
        <input aria-label="New task" placeholder="What needs doing?" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary icon-btn" aria-label="Add task"><Icon name="plus" /></button>
      </form>
      <div className="todo-filters">
        {['all', 'active', 'done'].map((f) => (
          <button key={f} className={`seg ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <span className="muted small">{left} left</span>
      </div>
      <ul className="todo-list" ref={list} data-lenis-prevent>
        {shown.map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => setTodos((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
              <span className="check"><Icon name="check" size={12} strokeWidth={3} /></span>
              <span className="todo-text">{t.text}</span>
            </label>
            <button className="icon-btn ghost" aria-label={`Delete ${t.text}`} onClick={(e) => remove(t.id, e.currentTarget.closest('li'))}><Icon name="trash" size={15} /></button>
          </li>
        ))}
        {!shown.length && <li className="empty">Nothing here. Enjoy the void.</li>}
      </ul>
      {todos.some((t) => t.done) && (
        <button className="btn btn-link small" onClick={() => setTodos((ts) => ts.filter((t) => !t.done))}>Clear finished</button>
      )}
    </div>
  );
}
