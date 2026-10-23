import { useLayoutEffect, useRef } from 'react';
import Icon from './Icon';
import { gsap } from '../lib/motion';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'gitlab', label: 'Git Lab', icon: 'branch' },
];

export default function Header({ view, go, theme, toggleTheme, openSettings, openPalette, startTour }) {
  const nav = useRef(null);
  const pill = useRef(null);

  // the active-tab pill glides between tabs
  useLayoutEffect(() => {
    const move = (instant) => {
      const btn = nav.current?.querySelector(`[data-tab="${view}"]`);
      if (!btn) return;
      gsap.to(pill.current, { x: btn.offsetLeft, width: btn.offsetWidth, duration: instant ? 0 : 0.6, ease: 'elastic.out(1, 0.75)' });
    };
    move(false);
    const onResize = () => move(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [view]);

  return (
    <header className="topbar">
      <button className="brand" onClick={(e) => go('home', { origin: { x: e.clientX, y: e.clientY } })} aria-label="DevOrbit home">
        <span className="brand-mark"><Icon name="orbit" size={22} /></span>
        <span className="brand-name">Dev<b>Orbit</b></span>
      </button>
      <nav className="tabs" ref={nav} aria-label="Main" data-tour="tabs">
        <span className="tab-pill" ref={pill} aria-hidden="true" />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            data-tab={t.id}
            className={`tab ${view === t.id ? 'on' : ''}`}
            aria-current={view === t.id ? 'page' : undefined}
            onClick={(e) => go(t.id, { origin: { x: e.clientX, y: e.clientY } })}
            title={`${t.label} (${i + 1})`}
          >
            <Icon name={t.icon} size={16} /> <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="top-actions">
        <button className="icon-btn palette-btn" onClick={openPalette} aria-label="Open command palette (Ctrl K)" data-tour="palette">
          <Icon name="search" size={16} /><span className="kbd-hint mono">Ctrl K</span>
        </button>
        <button className="icon-btn" onClick={startTour} aria-label="How to use DevOrbit" title="Mission briefing (?)"><Icon name="help" /></button>
        <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button className="icon-btn" onClick={openSettings} aria-label="Settings" data-tour="settings"><Icon name="settings" /></button>
      </div>
    </header>
  );
}
