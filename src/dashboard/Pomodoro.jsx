import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import useLocalStorage from '../hooks/useLocalStorage';
import { on } from '../lib/bus';

const MODES = { focus: 25 * 60, break: 5 * 60, long: 15 * 60 };
const today = () => new Date().toISOString().slice(0, 10);

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1);
    });
  } catch {
    /* audio blocked */
  }
}

export default function Pomodoro() {
  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(MODES.focus);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useLocalStorage('devorbit.focus', {});
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const rest = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(rest);
      if (rest === 0) {
        clearInterval(id);
        setRunning(false);
        chime();
        if (mode === 'focus') {
          setLog((l) => ({ ...l, [today()]: (l[today()] || 0) + 1 }));
          switchMode('break');
        } else switchMode('focus');
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    document.title = running ? `${fmt(left)} · ${mode === 'focus' ? 'Focus' : 'Break'} — DevOrbit` : 'DevOrbit — your dev universe in one tab';
  }, [left, running, mode]);

  useEffect(() => on('pomodoro', (cmd) => (cmd === 'reset' ? reset() : setRunning((r) => !r))));

  function switchMode(m) {
    setMode(m);
    setLeft(MODES[m]);
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setLeft(MODES[mode]);
  }

  const total = MODES[mode];
  const pct = 1 - left / total;
  const R = 74, C = 2 * Math.PI * R;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = d.toISOString().slice(0, 10);
    return { k, n: log[k] || 0 };
  });
  const color = mode === 'focus' ? 'var(--branch-4)' : 'var(--accent)';

  return (
    <div className="pomo">
      <div className="pomo-modes" role="tablist">
        {Object.keys(MODES).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} className={`seg ${mode === m ? 'on' : ''}`} onClick={() => switchMode(m)}>
            {m === 'long' ? 'long break' : m}
          </button>
        ))}
      </div>
      <div className="pomo-ring">
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={R} stroke="var(--border)" strokeWidth="8" fill="none" />
          <circle cx="90" cy="90" r={R} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset .3s linear', filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
        <div className="pomo-time mono">{fmt(left)}<span>{mode === 'focus' ? 'focus' : 'breathe'}</span></div>
      </div>
      <div className="pomo-ctrl">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)} data-tour="pomo-start">
          <Icon name={running ? 'pause' : 'play'} /> {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn btn-ghost icon-btn" onClick={reset} aria-label="Reset timer"><Icon name="rotate" /></button>
      </div>
      <div className="pomo-stats">
        <span>today <b>{log[today()] || 0}</b> sessions</span>
        <div className="heat" title="Focus sessions, last 14 days">
          {days.map((d) => <i key={d.k} title={`${d.k}: ${d.n}`} style={{ opacity: d.n ? 0.35 + Math.min(d.n, 6) * 0.11 : 0.12 }} />)}
        </div>
      </div>
    </div>
  );
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
