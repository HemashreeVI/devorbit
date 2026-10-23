import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/motion';
import Widget from './Widget';
import Clock from './Clock';
import Pomodoro from './Pomodoro';
import QuickLinks from './QuickLinks';
import TodoList from './TodoList';
import GitHubCard from './GitHubCard';
import NewsFeed, { useNews } from './NewsFeed';
import Scratchpad from './Scratchpad';
import LeetCode from './LeetCode';
import Icon from '../components/Icon';
import './dashboard.css';

export default function Dashboard({ settings, openSettings }) {
  const root = useRef(null);
  const news = useNews();
  const theme = settings.theme === 'light' ? 'light' : 'dark';

  useGSAP(
    () => {
      gsap.from('.dash-head > *', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' });
      gsap.set('.widget', { opacity: 0, y: 60, rotateX: -14, transformPerspective: 900, transformOrigin: '50% 0%' });
      ScrollTrigger.batch('.widget', {
        start: 'top 92%',
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotateX: 0, stagger: 0.09, duration: 0.9, ease: 'expo.out', overwrite: true, clearProps: 'transform' }),
      });
    },
    { scope: root }
  );

  return (
    <div className="dashboard" ref={root}>
      <div className="dash-head">
        <p className="kicker mono">mission control</p>
        <h1 className="page-title">Today’s orbit</h1>
        <div className="dash-chips">
          <button className="chip chip-btn" onClick={openSettings}><Icon name="users" size={14} /> @{settings.github || 'set username'}</button>
          <span className="chip"><kbd>Ctrl</kbd> <kbd>K</kbd> command palette</span>
          <span className="chip"><kbd>?</kbd> replay the tour</span>
        </div>
      </div>

      <div className="bento">
        <Widget className="w-clock" title="Now" icon="clock" theme={theme} tour="clock" color="#3fb950"><Clock name={settings.name} /></Widget>
        <Widget className="w-pomo" title="Pomodoro" icon="target" theme={theme} tour="pomodoro" color="#d29922"><Pomodoro /></Widget>
        <Widget className="w-gh" title="GitHub" icon="users" theme={theme} tour="github" color="#bc8cff"><GitHubCard user={settings.github} /></Widget>
        <Widget className="w-todo" title="To-do" icon="check" theme={theme} tour="todo" color="#3fb950"><TodoList /></Widget>
        <Widget className="w-links" title="Quick links" icon="link" theme={theme} tour="links" color="#58a6ff"><QuickLinks /></Widget>
        <Widget
          className="w-news" title="Hacker News · top 10" icon="flame" theme={theme} tour="news" color="#d29922"
          actions={<button className="icon-btn ghost" aria-label="Refresh news" onClick={news.reload}><Icon name="rotate" size={15} /></button>}
        >
          <NewsFeed news={news} />
        </Widget>
        <Widget className="w-notes" title="Scratchpad" icon="note" theme={theme} color="#58a6ff"><Scratchpad /></Widget>
        <Widget className="w-lc" title="LeetCode" icon="code" theme={theme} color="#bc8cff"><LeetCode user={settings.leetcode} /></Widget>
      </div>
    </div>
  );
}
