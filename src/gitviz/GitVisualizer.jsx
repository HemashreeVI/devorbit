import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRepo, run, headCommit, isDetached, encodeState, decodeState } from './gitEngine';
import CommitGraph, { laneColor } from './CommitGraph';
import CommandInput from './CommandInput';
import { QUESTS } from './quests';
import useLocalStorage from '../hooks/useLocalStorage';
import Icon from '../components/Icon';
import ClickSpark from '../bits/ClickSpark';
import { gsap, useGSAP } from '../lib/motion';
import { on } from '../lib/bus';
import './gitlab.css';

const Graph3D = lazy(() => import('./Graph3D'));

const WELCOME = [
  { kind: 'sys', text: 'DevOrbit Git Lab — a safe sandbox. Nothing here touches a real repo.' },
  { kind: 'sys', text: 'Type "help" for every command, or follow the quest on the right.' },
];

function initialHistory() {
  const shared = decodeState(new URLSearchParams(window.location.hash.slice(1)).get('repo') || '');
  if (shared) return { past: [], present: shared, future: [] };
  try {
    const saved = JSON.parse(localStorage.getItem('devorbit.gitlab'));
    if (saved?.present?.commits) return saved;
  } catch { /* ignore */ }
  return { past: [], present: createRepo(), future: [] };
}

export default function GitVisualizer() {
  const [hist, setHist] = useState(initialHistory);
  const [lines, setLines] = useState(WELCOME);
  const [explain, setExplain] = useState({ text: 'One initial commit on main. Your move.', kind: 'info' });
  const [effect, setEffect] = useState(null);
  const [view, setView] = useLocalStorage('devorbit.gitview', '2d');
  const [done, setDone] = useLocalStorage('devorbit.quests', []);
  const [picked, setPicked] = useState(null);
  const [toast, setToast] = useState(null);
  const term = useRef(null);
  const svg = useRef(null);
  const spark = useRef(null);
  const root = useRef(null);
  const repo = hist.present;

  useEffect(() => {
    try { localStorage.setItem('devorbit.gitlab', JSON.stringify({ ...hist, past: hist.past.slice(-30), future: [] })); } catch { /* quota */ }
  }, [hist]);

  useGSAP(() => {
    gsap.from('.gl-anim', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' });
  }, { scope: root });

  const activeIdx = QUESTS.findIndex((q) => !done.includes(q.id));
  const quest = QUESTS[activeIdx];

  const celebrate = useCallback((q) => {
    setToast(q);
    const r = svg.current?.getBoundingClientRect();
    for (let i = 0; i < 4; i++) setTimeout(() => spark.current?.spark((r?.width || 400) * (0.2 + Math.random() * 0.6), 60 + Math.random() * 120), i * 140);
    setTimeout(() => setToast(null), 3800);
  }, []);

  const exec = useCallback(
    (cmd) => {
      const c = cmd.trim();
      if (c === 'undo' || c === 'redo') {
        setHist((h) => {
          if (c === 'undo' && h.past.length) return { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future] };
          if (c === 'redo' && h.future.length) return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
          return h;
        });
        setLines((l) => [...l, { kind: 'cmd', text: c }, { kind: 'sys', text: c === 'undo' ? '↶ stepped back one command' : '↷ stepped forward' }]);
        setExplain({ text: c === 'undo' ? 'Undo is a simulator superpower — real git would need the reflog.' : 'Redo re-applied the command.', kind: 'info' });
        setEffect(null);
        return;
      }
      const r = run(repo, c);
      if (r.error) {
        setLines((l) => [...l, { kind: 'cmd', text: c }, { kind: 'err', text: r.error }]);
        setExplain({ text: r.error, kind: 'err' });
        gsap.fromTo('.explain', { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        return;
      }
      setHist((h) => ({ past: [...h.past, h.present].slice(-60), present: r.state, future: [] }));
      setLines((l) => [...l, { kind: 'cmd', text: c }, ...r.output.map((t) => ({ kind: 'out', text: t }))].slice(-200));
      setExplain({ text: r.explanation, kind: 'ok' });
      setEffect(r.effect);
      gsap.fromTo('.explain', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      if (r.effect?.type === 'clear') setLines(WELCOME);
      if (quest && quest.check(r.state, r.effect)) {
        setDone((d) => [...d, quest.id]);
        celebrate(quest);
      }
    },
    [repo, quest, setDone, celebrate]
  );

  useEffect(() => on('git', (cmd) => exec(cmd)), [exec]);

  const share = async () => {
    const url = `${location.origin}${location.pathname}#view=gitlab&repo=${encodeState(repo)}`;
    try { await navigator.clipboard.writeText(url); setExplain({ text: 'Share link copied! Anyone who opens it sees this exact graph.', kind: 'ok' }); }
    catch { prompt('Copy this link:', url); }
  };

  const exportSvg = () => {
    const el = svg.current;
    if (!el) return setExplain({ text: 'Switch to the 2D view to export an SVG.', kind: 'info' });
    const css = getComputedStyle(document.documentElement);
    let src = new XMLSerializer().serializeToString(el).replace(/var\((--[\w-]+)\)/g, (_, v) => css.getPropertyValue(v).trim() || '#888');
    src = src.replace('<svg', `<svg style="background:${css.getPropertyValue('--bg')};font-family:JetBrains Mono,monospace"`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
    a.download = 'devorbit-graph.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const pick = (id) => {
    setPicked(id);
    term.current?.insert(id);
  };

  const refs = [...Object.keys(repo.branches), ...Object.keys(repo.tags), ...Object.keys(repo.commits)];
  const head = headCommit(repo);

  return (
    <div className="gitlab" ref={root}>
      <div className="gl-head gl-anim">
        <div>
          <p className="kicker mono">git lab · sandbox</p>
          <h1 className="page-title">Watch git think.</h1>
        </div>
        <div className="gl-tools" data-tour="gl-tools">
          <div className="pomo-modes" role="tablist" aria-label="Graph view">
            <button role="tab" aria-selected={view === '2d'} className={`seg ${view === '2d' ? 'on' : ''}`} onClick={() => setView('2d')}>2D</button>
            <button role="tab" aria-selected={view === '3d'} className={`seg ${view === '3d' ? 'on' : ''}`} onClick={() => setView('3d')}><Icon name="cube" size={13} /> 3D</button>
          </div>
          <button className="icon-btn" aria-label="Undo" title="Undo" disabled={!hist.past.length} onClick={() => exec('undo')}><Icon name="undo" /></button>
          <button className="icon-btn" aria-label="Redo" title="Redo" disabled={!hist.future.length} onClick={() => exec('redo')}><Icon name="redo" /></button>
          <button className="icon-btn" aria-label="Copy share link" title="Share link" onClick={share}><Icon name="share" /></button>
          <button className="icon-btn" aria-label="Export SVG" title="Export SVG" onClick={exportSvg}><Icon name="download" /></button>
          <button className="icon-btn" aria-label="Start over" title="Start over" onClick={() => exec('clear')}><Icon name="trash" /></button>
        </div>
      </div>

      <div className="gl-grid">
        <div className="gl-main">
          <div className="gl-stage gl-anim" data-tour="graph">
            <ClickSpark ref={spark} style={{ height: "auto" }} sparkColor="#3fb950" sparkCount={12} sparkRadius={50} shape="star" glow={0.8} duration={700}>
              {view === '3d' ? (
                <Suspense fallback={<div className="graph3d loading mono">warming up the 3D engine…</div>}>
                  <Graph3D repo={repo} onPick={pick} />
                </Suspense>
              ) : (
                <CommitGraph ref={svg} repo={repo} effect={effect} onPick={pick} selected={picked} />
              )}
            </ClickSpark>
            <p className={`explain ${explain.kind}`} role="status">
              <Icon name={explain.kind === 'err' ? 'x' : 'sparkle'} size={15} /> {explain.text}
            </p>
            {toast && (
              <div className="quest-toast">
                <span className="mono">QUEST {toast.badge} COMPLETE</span>
                <b>{toast.title}</b>
              </div>
            )}
          </div>
          <div className="gl-anim">
            <CommandInput ref={term} lines={lines} onRun={exec} refs={refs} />
          </div>
        </div>

        <aside className="gl-side">
          <section className="panel gl-anim" data-tour="quests">
            <h2 className="widget-title"><Icon name="target" size={15} /> Quests · {done.length}/{QUESTS.length}</h2>
            <div className="quest-track">
              {QUESTS.map((q, i) => (
                <span key={q.id} className={`q-pip ${done.includes(q.id) ? 'done' : i === activeIdx ? 'now' : ''}`} title={q.title} />
              ))}
            </div>
            {quest ? (
              <div className="quest" key={quest.id}>
                <p className="mono q-badge">QUEST {quest.badge}</p>
                <h3>{quest.title}</h3>
                <p className="muted">{quest.story}</p>
                <p className="q-goal"><Icon name="target" size={14} /> {quest.goal}</p>
                <details>
                  <summary>Need a hint?</summary>
                  <div className="q-hints">
                    {quest.hints.map((h) => (
                      <button key={h} className="q-hint mono" onClick={() => term.current?.set(h.includes('<') ? h.split(' ')[0] + ' ' + h.split(' ')[1] + ' ' : h)}>{h}</button>
                    ))}
                  </div>
                </details>
                <button className="btn btn-link small" onClick={() => setDone((d) => [...d, quest.id])}>Skip quest</button>
              </div>
            ) : (
              <div className="quest">
                <h3>All quests cleared 🎉</h3>
                <p className="muted">You now know more git than most bootcamps teach. Experiment freely, or replay.</p>
                <button className="btn btn-ghost small" onClick={() => setDone([])}>Replay quests</button>
              </div>
            )}
          </section>

          <section className="panel gl-anim" data-tour="branches">
            <h2 className="widget-title"><Icon name="branch" size={15} /> Branches</h2>
            <ul className="branch-list">
              {Object.entries(repo.branches).map(([b, id]) => (
                <li key={b} className={b === repo.HEAD ? 'cur' : ''}>
                  <button onClick={() => exec(`git checkout ${b}`)} title={`checkout ${b}`}>
                    <i style={{ background: laneColor(repo.lanes[b] ?? 0) }} />
                    <span className="mono">{b}</span>
                    <span className="muted mono small">{id}</span>
                    {b === repo.HEAD && <span className="head-pill mono">HEAD</span>}
                  </button>
                </li>
              ))}
            </ul>
            {isDetached(repo) && <p className="detached mono small">HEAD detached at {head}</p>}
            {Object.keys(repo.tags).length > 0 && (
              <p className="tags small">{Object.entries(repo.tags).map(([t, id]) => <span key={t} className="chip mono">⌂ {t} → {id}</span>)}</p>
            )}
          </section>

          <section className="panel gl-anim">
            <h2 className="widget-title"><Icon name="book" size={15} /> Cheat sheet</h2>
            <dl className="cheat">
              {[
                ['commit', 'save a snapshot; the branch moves'],
                ['branch', 'new label on this commit'],
                ['checkout', 'move HEAD'],
                ['merge', 'join histories'],
                ['rebase', 'replay on top of another'],
                ['reset', 'move the label back'],
              ].map(([k, v]) => (
                <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className="muted small">Click any commit dot to drop its id into the terminal.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
