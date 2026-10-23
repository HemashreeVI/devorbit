import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Settings from './components/Settings';
import CommandPalette from './components/CommandPalette';
import Tour from './components/Tour';
import Dashboard from './dashboard/Dashboard';
import useLocalStorage from './hooks/useLocalStorage';
import useLenis, { getLenis } from './hooks/useLenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/motion';

// Home (Three.js) and the Git Lab load on demand so the daily dashboard opens fast.
const Home = lazy(() => import('./home/Home'));
const GitVisualizer = lazy(() => import('./gitviz/GitVisualizer'));

const VIEWS = ['home', 'dashboard', 'gitlab'];
const DEFAULT_SETTINGS = { name: 'Hema', github: 'HemashreeVI', leetcode: '', theme: 'dark', toured: false };

function initialView(settings) {
  const v = new URLSearchParams(window.location.hash.slice(1)).get('view');
  if (VIEWS.includes(v)) return v;
  return settings.toured ? localStorage.getItem('devorbit.view')?.replaceAll('"', '') || 'dashboard' : 'home';
}

export default function App() {
  const [settings, setSettings] = useLocalStorage('devorbit.settings', DEFAULT_SETTINGS);
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const [view, setView] = useState(() => initialView(s));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  const warp = useRef(null);
  const busy = useRef(false);
  useLenis();

  const update = useCallback((patch) => setSettings((old) => ({ ...DEFAULT_SETTINGS, ...old, ...patch })), [setSettings]);

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'light' ? '#ffffff' : '#0d1117');
  }, [s.theme]);

  useEffect(() => {
    localStorage.setItem('devorbit.view', view);
    const params = new URLSearchParams(window.location.hash.slice(1));
    params.set('view', view);
    if (view !== 'gitlab') params.delete('repo');
    history.replaceState(null, '', `#${params.toString()}`);
  }, [view]);

  // First-time visitors get the mission briefing automatically.
  useEffect(() => {
    if (!s.toured) {
      const id = setTimeout(() => setTouring(true), 1800);
      return () => clearTimeout(id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Switch views with a "warp" wipe. Returns a promise that resolves once the new view is mounted. */
  const go = useCallback(
    (next, { instant = false, origin } = {}) =>
      new Promise((resolve) => {
        if (next === view || busy.current) return resolve();
        const swap = () => {
          setView(next);
          getLenis()?.scrollTo(0, { immediate: true });
          window.scrollTo(0, 0);
          requestAnimationFrame(() => requestAnimationFrame(() => { ScrollTrigger.refresh(); resolve(); }));
        };
        if (instant || prefersReducedMotion()) return swap();
        busy.current = true;
        const el = warp.current;
        const x = origin?.x ?? window.innerWidth / 2;
        const y = origin?.y ?? 64;
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        gsap.timeline({ onComplete: () => { busy.current = false; } })
          .set(el, { display: 'block', clipPath: `circle(0px at ${x}px ${y}px)` })
          .to(el, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.55, ease: 'power3.in' })
          .add(swap)
          .to(el, { clipPath: `circle(0px at ${window.innerWidth / 2}px ${window.innerHeight}px)`, duration: 0.6, ease: 'power3.out', delay: 0.08 })
          .set(el, { display: 'none' });
      }),
    [view]
  );

  // Back/forward or a pasted link with #view=… switches views too
  useEffect(() => {
    const onHash = () => {
      const v = new URLSearchParams(window.location.hash.slice(1)).get('view');
      if (VIEWS.includes(v) && v !== view) go(v, { instant: true });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [go, view]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '?') setTouring(true);
        if (e.key === '1') go('home');
        if (e.key === '2') go('dashboard');
        if (e.key === '3') go('gitlab');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const finishTour = () => {
    setTouring(false);
    update({ toured: true });
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header
        view={view}
        go={go}
        theme={s.theme}
        toggleTheme={() => update({ theme: s.theme === 'dark' ? 'light' : 'dark' })}
        openSettings={() => setSettingsOpen(true)}
        openPalette={() => setPaletteOpen(true)}
        startTour={() => setTouring(true)}
      />
      <main id="main" key={view} className={`view view-${view}`}>
        <Suspense fallback={<div className="view-loading mono">entering orbit…</div>}>
        {view === 'home' && <Home go={go} theme={s.theme} startTour={() => setTouring(true)} />}
        {view === 'dashboard' && <Dashboard settings={s} openSettings={() => setSettingsOpen(true)} />}
        {view === 'gitlab' && <GitVisualizer />}
        </Suspense>
      </main>
      <div className="warp" ref={warp} aria-hidden="true">
        <div className="warp-inner"><span className="warp-logo">DevOrbit</span></div>
      </div>
      {settingsOpen && <Settings settings={s} update={update} close={() => setSettingsOpen(false)} startTour={() => { setSettingsOpen(false); setTouring(true); }} />}
      {paletteOpen && (
        <CommandPalette
          close={() => setPaletteOpen(false)}
          go={go}
          toggleTheme={() => update({ theme: s.theme === 'dark' ? 'light' : 'dark' })}
          openSettings={() => setSettingsOpen(true)}
          startTour={() => setTouring(true)}
        />
      )}
      {touring && <Tour go={go} view={view} settings={s} update={update} onDone={finishTour} />}
    </>
  );
}
