import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion';
import Icon from '../components/Icon';

const STEPS = [
  { t: 'A commit is a snapshot.', d: 'Each dot is a saved photo of your project. It remembers its parent, so history is a chain you can walk backwards.', cmd: 'git commit -m "Add login"' },
  { t: 'A branch is a sticky note.', d: 'Creating a branch copies nothing. It is a tiny label pointing at a commit — which is why branches are free.', cmd: 'git branch feature' },
  { t: 'Work can diverge.', d: 'Commit on feature and on main, and the timeline splits into two lanes. Each label moves only when you commit on it.', cmd: 'git checkout feature && git commit' },
  { t: 'Merge joins the worlds.', d: 'When both lines have new work, git makes a merge commit with TWO parents. If one side is simply behind, it fast-forwards instead.', cmd: 'git merge feature' },
  { t: 'HEAD is "you are here".', d: 'HEAD points to the branch you are on. Checkout moves HEAD; commit moves the branch HEAD points to. That is the whole trick.', cmd: 'git checkout main' },
];

// Coordinates for the illustrative graph
const X = (i) => 60 + i * 92;
const Y0 = 70, Y1 = 170;

export default function GitStory({ go }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const lines = q('.gs-line');
      lines.forEach((l) => {
        const len = l.getTotalLength();
        gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(q('.gs-node'), { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(q('.gs-step'), { autoAlpha: 0, y: 30 });
      gsap.set(q('.gs-step')[0], { autoAlpha: 1, y: 0 });

      if (prefersReducedMotion()) {
        gsap.set(q('.gs-node'), { scale: 1 });
        gsap.set(lines, { strokeDashoffset: 0 });
        return;
      }

      const draw = (sel) => ({ strokeDashoffset: 0, duration: 0.5, ease: 'none', stagger: 0.1, targets: q(sel) });
      const pop = (sel) => ({ scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.12, targets: q(sel) });
      const step = (tl, i, at) => {
        tl.to(q('.gs-step'), { autoAlpha: 0, y: -30, duration: 0.3 }, at)
          .fromTo(q('.gs-step')[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.25)
          .to(q('.gs-dot'), { background: 'var(--border)', duration: 0.1 }, at)
          .to(q('.gs-dot')[i], { background: 'var(--accent)', duration: 0.1 }, at);
      };
      const add = (tl, o, at) => tl.to(o.targets, { ...o, targets: undefined }, at);

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=420%', pin: true, scrub: 1, snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' } },
      });
      tl.addLabel('s0');
      add(tl, pop('.n-m0, .n-m1, .n-m2'), 0);
      add(tl, draw('.l-m01, .l-m12'), 0.1);
      tl.fromTo(q('.lbl-main'), { x: X(0) - X(2) }, { x: 0, duration: 0.9, ease: 'none' }, 0);

      tl.addLabel('s1', 1.4);
      step(tl, 1, 1.4);
      tl.fromTo(q('.lbl-feature'), { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.7);

      tl.addLabel('s2', 2.8);
      step(tl, 2, 2.8);
      add(tl, draw('.l-f23'), 3.0);
      add(tl, pop('.n-f3'), 3.2);
      add(tl, draw('.l-f34'), 3.4);
      add(tl, pop('.n-f4'), 3.6);
      tl.to(q('.lbl-feature'), { x: X(4) - X(2), y: Y1 - Y0, duration: 0.8 }, 3.1);
      add(tl, draw('.l-m25'), 3.6);
      add(tl, pop('.n-m5'), 3.9);
      tl.to(q('.lbl-main'), { x: X(5) - X(2), duration: 0.5 }, 3.8);
      tl.to(q('.lbl-head'), { x: X(5) - X(2), duration: 0.5 }, 3.8);

      tl.addLabel('s3', 4.8);
      step(tl, 3, 4.8);
      add(tl, draw('.l-m56, .l-f46'), 5.0);
      add(tl, pop('.n-m6'), 5.4);
      tl.to(q('.lbl-main, .lbl-head'), { x: X(6) - X(2), duration: 0.5 }, 5.5);
      tl.fromTo(q('.gs-ring'), { scale: 0.4, autoAlpha: 1, transformOrigin: '50% 50%' }, { scale: 2.6, autoAlpha: 0, duration: 0.8, immediateRender: false }, 5.6);

      tl.addLabel('s4', 6.6);
      step(tl, 4, 6.6);
      tl.to(q('.lbl-head'), { x: X(4) - X(2), y: Y1 - Y0, duration: 0.6 }, 6.8)
        .to(q('.lbl-head'), { x: X(6) - X(2), y: 0, duration: 0.6 }, 7.6);
      tl.addLabel('end', 8.4);
    },
    { scope: root }
  );

  const node = (cls, x, y, c = 'var(--accent)') => <circle className={`gs-node ${cls}`} cx={x} cy={y} r="13" fill="var(--bg)" stroke={c} strokeWidth="4" />;
  const line = (cls, x1, y1, x2, y2, c = 'var(--accent)') => (
    <path className={`gs-line ${cls}`} d={y1 === y2 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} C ${x1 + 46} ${y1}, ${x2 - 46} ${y2}, ${x2} ${y2}`} stroke={c} strokeWidth="3.5" fill="none" />
  );
  const B = 'var(--branch-2)';

  return (
    <section className="gitstory" ref={root} data-orbit>
      <div className="gs-copy">
        <p className="kicker mono">03 — git in five ideas</p>
        <div className="gs-steps">
          {STEPS.map((s, i) => (
            <div className="gs-step" key={s.t}>
              <span className="gs-num mono">0{i + 1}</span>
              <h2 className="section-title">{s.t}</h2>
              <p className="lead">{s.d}</p>
              <code className="gs-cmd mono">$ {s.cmd}</code>
            </div>
          ))}
        </div>
        <div className="gs-dots">{STEPS.map((s) => <span className="gs-dot" key={s.t} />)}</div>
        <button className="btn btn-ghost" onClick={() => go('gitlab')}><Icon name="terminal" /> Try it for real in the Git Lab</button>
      </div>
      <div className="gs-visual">
        <svg viewBox="0 0 660 240" role="img" aria-label="Animated commit graph: main and feature branches diverge and merge">
          {line('l-m01', X(0), Y0, X(1), Y0)}
          {line('l-m12', X(1), Y0, X(2), Y0)}
          {line('l-m25', X(2), Y0, X(5), Y0)}
          {line('l-m56', X(5), Y0, X(6), Y0)}
          {line('l-f23', X(2), Y0, X(3), Y1, B)}
          {line('l-f34', X(3), Y1, X(4), Y1, B)}
          {line('l-f46', X(4), Y1, X(6), Y0, B)}
          {node('n-m0', X(0), Y0)}{node('n-m1', X(1), Y0)}{node('n-m2', X(2), Y0)}
          {node('n-f3', X(3), Y1, B)}{node('n-f4', X(4), Y1, B)}
          {node('n-m5', X(5), Y0)}{node('n-m6', X(6), Y0)}
          <circle className="gs-ring" cx={X(6)} cy={Y0} r="16" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0" />
          <g className="lbl-main">
            <g transform={`translate(${X(2) - 26} ${Y0 - 52})`}>
              <rect width="52" height="22" rx="6" fill="var(--accent)" /><text x="26" y="15" textAnchor="middle" className="gs-tag">main</text>
            </g>
          </g>
          <g className="lbl-head">
            <g transform={`translate(${X(2) - 24} ${Y0 - 80})`}>
              <rect width="48" height="20" rx="10" fill="none" stroke="var(--text)" strokeDasharray="3 3" /><text x="24" y="14" textAnchor="middle" className="gs-tag gs-tag-head">HEAD</text>
            </g>
          </g>
          <g className="lbl-feature" opacity="0">
            <g transform={`translate(${X(2) - 34} ${Y0 + 24})`}>
              <rect width="68" height="22" rx="6" fill={B} /><text x="34" y="15" textAnchor="middle" className="gs-tag">feature</text>
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}
