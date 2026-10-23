import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/motion';
import { getLenis } from '../hooks/useLenis';
import DecryptedText from '../bits/DecryptedText';
import Icon from './Icon';

// "Mission briefing": ORBI, a little navigation satellite, flies you around the real UI.
const STEPS = [
  { id: 'hello', title: 'Incoming transmission…', body: "Hi! I'm ORBI, your navigation satellite. This is a 60-second flight through DevOrbit. First — who's flying today?", form: true },
  { target: 'tabs', title: 'Three worlds', body: 'Home tells the story. Dashboard is your daily launchpad. Git Lab teaches git by drawing it. Keys 1 · 2 · 3 jump between them.' },
  { view: 'dashboard', target: 'clock', title: 'Mission clock', body: 'Your greeting changes with the hour. The bar shows how much of the day is gone, and there is a fresh git tip daily.' },
  { view: 'dashboard', target: 'pomodoro', title: 'Focus thrusters', body: '25 minutes of focus, 5 of rest. Every finished session lights a square in your 14-day heat strip.' },
  { view: 'dashboard', target: 'github', title: 'Your GitHub planet', body: 'Avatar, repos, stars, your language mix and a live activity pulse. Change the username any time in Settings.' },
  { view: 'dashboard', target: 'todo', title: 'Cargo list', body: 'Tasks, links and notes are saved in this browser — they survive refresh. No account, no server.' },
  { view: 'gitlab', target: 'graph', title: 'The commit graph', body: 'Every dot is a commit, every colour a branch. Click a dot to drop its id into the terminal. Flip to 3D up top.' },
  { view: 'gitlab', target: 'terminal', title: 'Talk to git', body: 'Type real commands like git commit -m "hi" or git checkout -b feature. Tab autocompletes, ↑ recalls history, "help" lists everything.' },
  { view: 'gitlab', target: 'quests', title: 'Nine quests', body: 'Start here if git scares you. Each quest is a tiny story — finish it and the graph throws sparks.' },
  { target: 'palette', title: 'The secret weapon', body: 'Ctrl K (⌘K on Mac) opens the command palette. Type "todo buy milk" or "git commit" from anywhere. Press ? to replay this briefing.' },
  { id: 'bye', title: 'Mission accepted.', body: 'That’s the whole universe. Go build something — ORBI will be orbiting nearby.' },
];

function Orbi() {
  return (
    <svg className="orbi" viewBox="0 0 64 64" aria-hidden="true">
      <ellipse className="orbi-ring" cx="32" cy="32" rx="28" ry="9" fill="none" stroke="var(--branch-3)" strokeWidth="2" />
      <rect x="4" y="27" width="12" height="10" rx="2" fill="var(--branch-2)" opacity=".85" />
      <rect x="48" y="27" width="12" height="10" rx="2" fill="var(--branch-2)" opacity=".85" />
      <circle cx="32" cy="32" r="12" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
      <circle className="orbi-eye" cx="32" cy="32" r="4.5" fill="var(--accent)" />
      <line x1="32" y1="20" x2="32" y2="10" stroke="var(--muted)" strokeWidth="2" />
      <circle className="orbi-beacon" cx="32" cy="9" r="2.5" fill="var(--branch-4)" />
    </svg>
  );
}

export default function Tour({ go, view, settings, update, onDone }) {
  const [i, setI] = useState(0);
  const [name, setName] = useState(settings.name);
  const [gh, setGh] = useState(settings.github);
  const hole = useRef(null);
  const card = useRef(null);
  const target = useRef(null);
  const goRef = useRef(go);
  const viewRef = useRef(view);
  goRef.current = go;
  viewRef.current = view;
  const step = STEPS[i];

  // Move to the right view, scroll the target into place, then let the ticker follow it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      target.current = null;
      if (step.view && step.view !== viewRef.current) {
        await goRef.current(step.view);
        await new Promise((r) => setTimeout(r, 650));
      }
      if (cancelled) return;
      // lazy views may still be loading: poll briefly for the target
      let el = null;
      for (let t = 0; step.target && !el && t < 30 && !cancelled; t++) {
        el = document.querySelector(`[data-tour="${step.target}"]`);
        if (!el) await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight - 40) getLenis()?.scrollTo(el, { offset: -110, duration: 0.9 });
        target.current = el;
      }
      gsap.fromTo(card.current, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
    })();
    return () => { cancelled = true; };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hx = gsap.quickTo(hole.current, 'x', { duration: 0.5, ease: 'power3.out' });
    const hy = gsap.quickTo(hole.current, 'y', { duration: 0.5, ease: 'power3.out' });
    const hw = gsap.quickTo(hole.current, 'width', { duration: 0.5, ease: 'power3.out' });
    const hh = gsap.quickTo(hole.current, 'height', { duration: 0.5, ease: 'power3.out' });
    const cx = gsap.quickTo(card.current, 'left', { duration: 0.55, ease: 'power3.out' });
    const cy = gsap.quickTo(card.current, 'top', { duration: 0.55, ease: 'power3.out' });
    const tick = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const c = card.current.getBoundingClientRect();
      const el = target.current;
      if (!el) {
        hx(vw / 2); hy(vh / 2); hw(0); hh(0);
        cx((vw - c.width) / 2); cy((vh - c.height) / 2);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 10;
      hx(r.left - pad); hy(r.top - pad); hw(r.width + pad * 2); hh(r.height + pad * 2);
      if (vw < 640) { cx(12); cy(vh - c.height - 12); return; }
      const below = r.bottom + pad + 16;
      const top = below + c.height < vh ? below : Math.max(12, r.top - pad - 16 - c.height);
      const left = Math.min(Math.max(12, r.left + r.width / 2 - c.width / 2), vw - c.width - 12);
      cx(left); cy(top);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const next = () => {
    if (step.form) update({ name: name.trim() || 'friend', github: gh.trim().replace(/^@/, '') });
    if (i < STEPS.length - 1) setI(i + 1);
    else onDone();
  };
  const back = () => i > 0 && setI(i - 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onDone();
      if (/INPUT/.test(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Mission briefing">
      <div className="tour-hole" ref={hole} />
      <div className="tour-card" ref={card}>
        <div className="tour-top">
          <Orbi />
          <div>
            <p className="mono tour-meta">TRANSMISSION {String(i + 1).padStart(2, '0')}/{STEPS.length}</p>
            <h2 key={i}><DecryptedText text={step.id === 'bye' ? `Mission accepted, ${settings.name || 'friend'}.` : step.title} animateOn="view" sequential speed={28} /></h2>
          </div>
        </div>
        <p className="tour-body">{step.body}</p>
        {step.form && (
          <form className="tour-form" onSubmit={(e) => { e.preventDefault(); next(); }}>
            <label className="field"><span>Call me</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus /></label>
            <label className="field"><span>GitHub username</span><input value={gh} onChange={(e) => setGh(e.target.value)} placeholder="octocat" /></label>
            <button hidden />
          </form>
        )}
        <div className="tour-bar"><i style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="tour-actions">
          <button className="btn btn-link small" onClick={onDone}>Skip briefing</button>
          <span className="spacer" />
          {i > 0 && <button className="btn btn-ghost small" onClick={back}>Back</button>}
          <button className="btn btn-primary small" onClick={next}>
            {i === 0 ? 'Launch' : i === STEPS.length - 1 ? 'Start exploring' : 'Next'} <Icon name={i === STEPS.length - 1 ? 'rocket' : 'play'} size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
