import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, orbitState, prefersReducedMotion } from '../lib/motion';
import OrbitScene from '../three/OrbitScene';
import SplitText from '../bits/SplitText';
import ShinyText from '../bits/ShinyText';
import GradientText from '../bits/GradientText';
import ScrollReveal from '../bits/ScrollReveal';
import CountUp from '../bits/CountUp';
import Magnet from '../bits/Magnet';
import ClickSpark from '../bits/ClickSpark';
import Icon from '../components/Icon';
import GitStory from './GitStory';
import './home.css';

const MOONS = [
  { icon: 'clock', name: 'Greeting & clock', color: 'var(--accent)', what: 'A greeting that knows the hour, a ticking clock, and the date.', deep: ['Reads the browser clock every second', 'Morning / afternoon / evening / late-night moods', 'Your name comes from Settings'], src: 'Browser Date' },
  { icon: 'target', name: 'Pomodoro', color: 'var(--branch-4)', what: '25 / 5 focus cycles with a progress ring and a soft chime.', deep: ['Start · pause · reset · skip', 'Counts focus sessions per day', '14-day focus heat strip', 'Chime made live with Web Audio — no files'], src: 'Browser timer + localStorage' },
  { icon: 'link', name: 'Quick links', color: 'var(--branch-2)', what: 'Your launchpad: GitHub, LeetCode, portfolio — editable.', deep: ['Add and delete in place', 'Auto favicons', 'Saved in devorbit.links'], src: 'localStorage' },
  { icon: 'check', name: 'To-do list', color: 'var(--accent)', what: 'Add, tick, delete. Survives refresh, filters by state.', deep: ['All / active / done filters', 'Clear finished in one click', 'Add from anywhere: Ctrl K → "todo …"'], src: 'localStorage' },
  { icon: 'users', name: 'GitHub card', color: 'var(--branch-3)', what: 'Avatar, repos, followers, latest repos and your language mix.', deep: ['Language breakdown bar from your repos', 'Total stars across repos', 'Recent public activity pulse', 'No key: 60 requests / hour'], src: 'GitHub REST API' },
  { icon: 'flame', name: 'Tech news', color: 'var(--branch-4)', what: 'Top 10 Hacker News stories with score, comments and source.', deep: ['Refresh on demand', 'Domain + age of each story', 'Opens in a new tab'], src: 'Hacker News API' },
  { icon: 'note', name: 'Scratchpad', color: 'var(--branch-2)', what: 'A quick notes pad for snippets, links and thoughts.', deep: ['Autosaves as you type', 'Word count', 'Lives only in your browser'], src: 'localStorage' },
  { icon: 'code', name: 'LeetCode', color: 'var(--branch-3)', what: 'Easy / Medium / Hard solved counts (community API).', deep: ['Optional: add a username in Settings', 'Falls back gracefully if the API sleeps'], src: 'Community API' },
];

const KEYFRAMES = (w) => {
  const m = w < 760; // phones keep the planet centred and smaller
  return [
    { x: m ? 0 : 2.5, y: m ? 1.3 : 0, z: 0, scale: m ? 0.55 : 0.82, spin: 0 },
    { x: 0, y: 0, z: 1.5, scale: m ? 0.9 : 1.35, spin: 1.6 },
    { x: m ? 0 : 3.2, y: m ? 2.4 : 1.9, z: -2, scale: 0.45, spin: 3.2 },
    { x: m ? 0 : 4.6, y: m ? -2.6 : 2.5, z: -2.5, scale: 0.42, spin: 4.6 },
    { x: m ? 0 : 2.6, y: m ? 1.4 : -0.6, z: 0, scale: 0.8, spin: 6 },
    { x: 0, y: 0.15, z: 0.5, scale: m ? 0.8 : 1.1, spin: 7.4 },
  ];
};

export default function Home({ go, startTour, theme = 'dark' }) {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      const sections = gsap.utils.toArray('[data-orbit]');
      const lerp = (a, b, t) => a + (b - a) * t;

      // 1) The planet travels between sections: each section's entrance blends from the previous keyframe.
      sections.forEach((sec, i) => {
        if (i === 0) return;
        ScrollTrigger.create({
          trigger: sec,
          start: 'top bottom',
          end: 'top top',
          onUpdate: (self) => {
            const kf = KEYFRAMES(window.innerWidth);
            const a = kf[i - 1], b = kf[i], t = self.progress;
            Object.assign(orbitState, { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), scale: lerp(a.scale, b.scale, t), spin: lerp(a.spin, b.spin, t) });
            orbitState.warp = Math.min(1, Math.abs(self.getVelocity()) / 4000);
          },
        });
      });
      Object.assign(orbitState, KEYFRAMES(window.innerWidth)[0]);

      // 2) Hero exit: content drifts up and blurs as you leave.
      gsap.to('.hero-inner', {
        yPercent: -30, opacity: 0, filter: 'blur(8px)', ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });

      // 3) Manifesto: pinned while the words light up.
      ScrollTrigger.create({ trigger: '.manifesto', start: 'top top', end: '+=120%', pin: true });

      // 4) Horizontal "moons" track with a curved 3D carousel feel.
      if (!reduce && window.innerWidth > 760) {
        const el = track.current;
        const distance = () => el.scrollWidth - window.innerWidth + 80;
        const slide = gsap.to(el, {
          x: () => -distance(),
          ease: 'none', // required for containerAnimation
          scrollTrigger: { trigger: '.moons', pin: true, start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set('.moons-progress i', { scaleX: self.progress }) },
        });
        gsap.utils.toArray('.moon-card').forEach((card) => {
          gsap.fromTo(card, { rotateY: -32, z: -220, opacity: 0.35 }, {
            rotateY: 0, z: 0, opacity: 1, ease: 'none',
            scrollTrigger: { containerAnimation: slide, trigger: card, start: 'left right', end: 'center 55%', scrub: true },
          });
          gsap.to(card, {
            rotateY: 28, z: -160, opacity: 0.4, ease: 'none',
            scrollTrigger: { containerAnimation: slide, trigger: card, start: 'center 40%', end: 'right left', scrub: true },
          });
          const depth = card.querySelectorAll('[data-depth]');
          if (depth.length) gsap.fromTo(depth, { x: (i, t) => 60 * t.dataset.depth }, {
            x: (i, t) => -60 * t.dataset.depth, ease: 'none',
            scrollTrigger: { containerAnimation: slide, trigger: card, start: 'left right', end: 'right left', scrub: true },
          });
        });
      } else {
        ScrollTrigger.batch('.moon-card', { start: 'top 88%', onEnter: (b) => gsap.from(b, { y: 50, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' }) });
      }

      // 5) Engine + stack chips rise in.
      ScrollTrigger.batch('.reveal-up', { start: 'top 85%', onEnter: (b) => gsap.fromTo(b, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', overwrite: true }) });

      // Child components (GitStory) create their triggers first; re-sort by page position so pins stack correctly.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      // Mouse parallax for the planet.
      const onMove = (e) => {
        orbitState.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        orbitState.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('pointermove', onMove);
      const calm = gsap.ticker.add(() => (orbitState.warp *= 0.94));
      return () => {
        window.removeEventListener('pointermove', onMove);
        gsap.ticker.remove(calm);
      };
    },
    { scope: root }
  );

  return (
    <div className="home" ref={root}>
      <div className="home-bg" aria-hidden="true" />
      <OrbitScene />

      {/* HERO */}
      <section className="hero" data-orbit>
        <div className="hero-inner">
          <p className="eyebrow mono">
            <span className="pulse-dot" /> <ShinyText text="v1.0 · runs 100% in your browser" speed={3} color="var(--muted)" shineColor="var(--text)" />
          </p>
          <h1 className="hero-title" aria-label="DevOrbit">
            <SplitText text="DevOrbit" tag="span" splitType="chars" effect="flip" delay={60} duration={1.1} textAlign="left" />
          </h1>
          <p className="hero-sub">
            Your developer universe in one tab. A <b>daily dashboard</b> for GitHub, focus and news — and a <b>Git Lab</b> where typed commands become a living, animated commit graph.
          </p>
          <div className="hero-ctas">
            <Magnet padding={60} magnetStrength={3}>
              <button className="btn btn-primary btn-lg" onClick={() => go('dashboard')}>
                <Icon name="rocket" /> Launch dashboard
              </button>
            </Magnet>
            <Magnet padding={60} magnetStrength={3}>
              <button className="btn btn-ghost btn-lg" onClick={() => go('gitlab')}>
                <Icon name="branch" /> Open Git Lab
              </button>
            </Magnet>
            <button className="btn btn-link" onClick={startTour}>
              <Icon name="help" /> New here? Take the 60-second mission
            </button>
          </div>
        </div>
        <a className="scroll-cue mono" href="#manifesto">
          <span>scroll to explore</span>
          <i />
        </a>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto" id="manifesto" data-orbit>
        <div className="manifesto-inner">
          <p className="kicker mono">01 — why</p>
          <ScrollReveal baseOpacity={0.08} enableBlur baseRotation={2} blurStrength={6} textClassName="manifesto-text" rotationEnd="bottom center" wordAnimationEnd="bottom center">
            Ten tabs every morning. GitHub, LeetCode, a timer, a to-do app, the news. DevOrbit pulls them into one orbit — and then teaches you git by letting you watch it think.
          </ScrollReveal>
        </div>
      </section>

      {/* MOONS (horizontal) */}
      <section className="moons" data-orbit>
        <header className="moons-head">
          <p className="kicker mono">02 — the dashboard</p>
          <h2 className="section-title">Eight moons, one orbit.</h2>
          <div className="moons-progress"><i /></div>
        </header>
        <div className="moons-track" ref={track}>
          {MOONS.map((m, i) => (
            <article className="moon-card" key={m.name} style={{ '--c': m.color }}>
              <span className="moon-index mono" data-depth="1.6">{String(i + 1).padStart(2, '0')}</span>
              <div className="moon-icon" data-depth="0.8"><Icon name={m.icon} size={26} /></div>
              <h3 data-depth="0.4">{m.name}</h3>
              <p className="moon-what">{m.what}</p>
              <ul className="moon-deep">
                {m.deep.map((d) => <li key={d}>{d}</li>)}
              </ul>
              <p className="moon-src mono">source → {m.src}</p>
            </article>
          ))}
          <article className="moon-card moon-cta">
            <h3>Ready?</h3>
            <p className="moon-what">Everything above is one click away.</p>
            <button className="btn btn-primary" onClick={() => go('dashboard')}><Icon name="grid" /> Open dashboard</button>
          </article>
        </div>
      </section>

      {/* GIT STORY (pinned scrollytelling) */}
      <GitStory go={go} />

      {/* ENGINE */}
      <section className="engine" data-orbit>
        <div className="engine-grid">
          <div className="reveal-up">
            <p className="kicker mono">04 — under the hood</p>
            <h2 className="section-title">A git brain in ~350 lines.</h2>
            <p className="lead">
              <code>gitEngine.js</code> knows nothing about React. It takes the repo state and a command and returns a brand-new state. That makes it easy to test, easy to reason about, and easy to explain in an interview.
            </p>
            <div className="stack-chips">
              {['React 19', 'Vite', 'GSAP + ScrollTrigger', 'Lenis', 'React Three Fiber', 'React Bits', 'SVG', 'localStorage', 'GitHub Pages'].map((t) => (
                <span className="chip reveal-up" key={t}>{t}</span>
              ))}
            </div>
          </div>
          <pre className="code-card reveal-up" data-lenis-prevent><code>{`const repo = {
  commits: {
    c0: { id: 'c0', parents: [],     message: 'Initial commit' },
    c1: { id: 'c1', parents: ['c0'], message: 'Add login' },
  },
  branches: { main: 'c1', feature: 'c0' },
  HEAD: 'main',
};

const { state, explanation } = run(repo, 'git merge feature');
// → "Fast-forward! Your branch was directly behind…"`}</code></pre>
        </div>
        <div className="stats">
          {[
            { n: 0, s: '', l: 'backends or servers' },
            { n: 12, s: '+', l: 'git commands simulated' },
            { n: 8, s: '', l: 'dashboard widgets' },
            { n: 60, s: '/hr', l: 'free GitHub API calls' },
          ].map((x) => (
            <div className="stat reveal-up" key={x.l}>
              <span className="stat-n"><CountUp to={x.n} duration={1.6} />{x.s}</span>
              <span className="stat-l">{x.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LAUNCH */}
      <section className="launch" data-orbit>
        <ClickSpark sparkColor="#3fb950" sparkCount={10} sparkRadius={40} shape="star" glow={0.6}>
          <div className="launch-inner">
            <p className="kicker mono">05 — liftoff</p>
            <h2 className="launch-title">
              <GradientText colors={['#3fb950', '#58a6ff', '#bc8cff', '#d29922', '#3fb950']} animationSpeed={6} variant="flow">
                Enter your orbit.
              </GradientText>
            </h2>
            <p className="lead">No sign-up. No keys. Click anywhere here for sparks, then pick a world.</p>
            <div className="hero-ctas center">
              <Magnet padding={70} magnetStrength={2.5}>
                <button className="btn btn-primary btn-lg" onClick={() => go('dashboard')}><Icon name="grid" /> Dashboard</button>
              </Magnet>
              <Magnet padding={70} magnetStrength={2.5}>
                <button className="btn btn-ghost btn-lg" onClick={() => go('gitlab')}><Icon name="branch" /> Git Lab</button>
              </Magnet>
            </div>
            <p className="footnote mono">Built by Hema · React + Vite · press <kbd>Ctrl</kbd> <kbd>K</kbd> anywhere</p>
          </div>
        </ClickSpark>
      </section>
    </div>
  );
}
