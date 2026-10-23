import { useMemo, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { emit } from '../lib/bus';

export default function CommandPalette({ close, go, toggleTheme, openSettings, startTour }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);

  const actions = useMemo(() => {
    const base = [
      { icon: 'home', label: 'Go to Home', hint: '1', run: () => go('home') },
      { icon: 'grid', label: 'Go to Dashboard', hint: '2', run: () => go('dashboard') },
      { icon: 'branch', label: 'Go to Git Lab', hint: '3', run: () => go('gitlab') },
      { icon: 'play', label: 'Start / pause focus timer', run: async () => { await go('dashboard'); emit('pomodoro', 'toggle'); } },
      { icon: 'rotate', label: 'Reset focus timer', run: async () => { await go('dashboard'); emit('pomodoro', 'reset'); } },
      { icon: 'sun', label: 'Toggle light / dark theme', run: toggleTheme },
      { icon: 'settings', label: 'Open settings', run: openSettings },
      { icon: 'help', label: 'Replay the mission briefing (tour)', hint: '?', run: startTour },
      { icon: 'external', label: 'Open GitHub', run: () => window.open('https://github.com', '_blank') },
      { icon: 'external', label: 'Open LeetCode', run: () => window.open('https://leetcode.com/problemset/', '_blank') },
    ];
    const t = q.trim();
    const dynamic = [];
    if (/^todo\s+\S/i.test(t)) dynamic.push({ icon: 'plus', label: `Add to-do: “${t.slice(5).trim()}”`, run: async () => { await go('dashboard'); setTimeout(() => emit('todo', t.slice(5).trim()), 50); } });
    if (/^git\s+\S/i.test(t)) dynamic.push({ icon: 'terminal', label: `Run in Git Lab: ${t}`, run: async () => { await go('gitlab'); setTimeout(() => emit('git', t), 80); } });
    if (/^(https?:\/\/|www\.)/.test(t)) dynamic.push({ icon: 'external', label: `Open ${t}`, run: () => window.open(t.startsWith('http') ? t : `https://${t}`, '_blank') });
    const list = base.filter((a) => a.label.toLowerCase().includes(t.toLowerCase()));
    return [...dynamic, ...list];
  }, [q, go, toggleTheme, openSettings, startTour]);

  const choose = (a) => { close(); a?.run(); };

  return (
    <Modal close={close} label="Command palette" className="palette">
      <div className="palette-input">
        <Icon name="search" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setI(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, actions.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
            if (e.key === 'Enter') choose(actions[i]);
          }}
          placeholder='Search actions… or type "todo buy milk", "git commit", a URL'
          aria-label="Command"
        />
        <kbd>Esc</kbd>
      </div>
      <ul className="palette-list" role="listbox" data-lenis-prevent>
        {actions.map((a, k) => (
          <li key={a.label} role="option" aria-selected={k === i}>
            <button className={k === i ? 'on' : ''} onMouseEnter={() => setI(k)} onClick={() => choose(a)}>
              <Icon name={a.icon} size={16} /> <span>{a.label}</span> {a.hint && <kbd>{a.hint}</kbd>}
            </button>
          </li>
        ))}
        {!actions.length && <li className="empty">No match. Try “todo …” or “git …”.</li>}
      </ul>
    </Modal>
  );
}
