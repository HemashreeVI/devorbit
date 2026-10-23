import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from '../lib/motion';
import { layout, headCommit, isDetached } from './gitEngine';

const SX = 84; // px between generations
const SY = 78; // px between lanes
const PAD_X = 60;
const PAD_Y = 74;
export const laneColor = (lane) => `var(--branch-${(lane % 4) + 1})`;

const pos = (n) => ({ x: PAD_X + n.x * SX, y: PAD_Y + n.y * SY });

/** Hand-written SVG commit graph. New commits slide in, edges draw themselves, labels glide. */
const CommitGraph = forwardRef(function CommitGraph({ repo, effect, onPick, selected }, svgRef) {
  const known = useRef(new Set());
  const wrap = useRef(null);
  const { nodes, edges, maxX, maxY } = useMemo(() => layout(repo), [repo]);
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const head = headCommit(repo);
  const W = PAD_X * 2 + maxX * SX + 80;
  const H = PAD_Y + maxY * SY + 70;

  // labels grouped per commit so several branches on one commit stack neatly
  const labels = useMemo(() => {
    const map = {};
    Object.entries(repo.branches).forEach(([b, id]) => (map[id] ||= []).push({ kind: 'branch', name: b, lane: repo.lanes[b] ?? 0 }));
    Object.entries(repo.tags).forEach(([t, id]) => (map[id] ||= []).push({ kind: 'tag', name: t }));
    return map;
  }, [repo]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const fresh = nodes.filter((n) => !known.current.has(n.id));
    const firstPaint = known.current.size === 0;
    known.current = new Set(nodes.map((n) => n.id));
    if (firstPaint || !fresh.length) return;
    // no cleanup kill: a quick second command must not freeze the previous commit mid-animation
    gsap.context(() => {
      fresh.forEach((n, i) => {
        const g = svg.querySelector(`[data-node="${n.id}"]`);
        const lines = svg.querySelectorAll(`[data-to="${n.id}"]`);
        lines.forEach((l) => {
          const len = l.getTotalLength();
          gsap.fromTo(l, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.55, delay: i * 0.12, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' });
        });
        gsap.fromTo(g, { x: -SX * 0.7, scale: 0, opacity: 0, transformOrigin: '50% 50%' }, { x: 0, scale: 1, opacity: 1, duration: 0.7, delay: 0.15 + i * 0.12, ease: 'back.out(2.2)' });
      });
      if (effect?.type === 'merge' || effect?.type === 'ff' || effect?.type === 'rebase') {
        const id = effect.ids?.at(-1);
        const n = byId[id];
        if (n) {
          const ring = svg.querySelector('.burst');
          const p = pos(n);
          gsap.fromTo(ring, { attr: { cx: p.x, cy: p.y, r: 10 }, opacity: 1 }, { attr: { r: 60 }, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.4 });
        }
      }
    }, svg);
    // keep the newest commit in view
    const last = byId[head];
    if (last && wrap.current) {
      const x = pos(last).x - wrap.current.clientWidth / 2;
      wrap.current.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
    }
  }, [nodes, effect, byId, head, svgRef]);

  const edgePath = (a, b) => {
    const p = pos(a), q = pos(b);
    if (p.y === q.y) return `M${p.x} ${p.y} L${q.x} ${q.y}`;
    const mx = p.x + SX * 0.55;
    return `M${p.x} ${p.y} C ${mx} ${p.y}, ${q.x - SX * 0.55} ${q.y}, ${q.x} ${q.y}`;
  };

  return (
    <div className="graph-wrap" ref={wrap} data-lenis-prevent>
      <svg ref={svgRef} className="graph" width={W} height={Math.max(H, 220)} viewBox={`0 0 ${W} ${Math.max(H, 220)}`} role="img" aria-label="Commit graph">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* lane guides */}
        {Array.from({ length: maxY + 1 }, (_, i) => (
          <line key={i} x1={20} x2={W - 20} y1={PAD_Y + i * SY} y2={PAD_Y + i * SY} className="lane-guide" />
        ))}
        {edges.map((e) => (
          <path key={`${e.from}-${e.to}`} data-to={e.to} d={edgePath(byId[e.from], byId[e.to])} className={`edge ${e.dead ? 'dead' : ''}`} stroke={laneColor(byId[e.to].lane)} />
        ))}
        <circle className="burst" cx="0" cy="0" r="0" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0" />
        {nodes.map((n) => {
          const p = pos(n);
          const isHead = n.id === head;
          const c = laneColor(n.lane);
          return (
            <g key={n.id} className={`node ${n.dead ? 'dead' : ''} ${selected === n.id ? 'sel' : ''}`} transform={`translate(${p.x} ${p.y})`} onClick={() => onPick?.(n.id)}>
              <g data-node={n.id}>
                {isHead && <circle r="22" fill="none" stroke={c} strokeOpacity="0.35" strokeWidth="2" className="head-halo" />}
                <circle r={n.parents.length > 1 ? 15 : 13} fill="var(--bg)" stroke={c} strokeWidth="4" filter={isHead ? 'url(#glow)' : undefined} />
                {n.parents.length > 1 && <circle r="5" fill={c} />}
                <text y="36" textAnchor="middle" className="node-id">{n.id}</text>
                <title>{`${n.id} — ${n.message}`}</title>
              </g>
            </g>
          );
        })}
        {/* branch / tag / HEAD labels: positioned with CSS transforms so they glide */}
        {Object.entries(labels).flatMap(([id, ls]) => {
          const n = byId[id];
          if (!n) return [];
          const p = pos(n);
          return ls.map((l, i) => {
            const isCur = l.kind === 'branch' && l.name === repo.HEAD;
            const w = l.name.length * 7.6 + (isCur ? 34 : 18);
            return (
              <g key={`${l.kind}:${l.name}`} className="ref-label" style={{ transform: `translate(${p.x - w / 2}px, ${p.y - 46 - i * 26}px)` }}>
                <rect width={w} height="21" rx={l.kind === 'tag' ? 10 : 6} fill={l.kind === 'tag' ? 'var(--surface-2)' : laneColor(l.lane)} stroke={l.kind === 'tag' ? 'var(--branch-4)' : 'none'} />
                <text x={w / 2} y="15" textAnchor="middle" className={`ref-text ${l.kind}`}>{isCur ? `● ${l.name}` : l.kind === 'tag' ? `⌂ ${l.name}` : l.name}</text>
              </g>
            );
          });
        })}
        {isDetached(repo) && byId[head] && (
          <g className="ref-label" style={{ transform: `translate(${pos(byId[head]).x - 34}px, ${pos(byId[head]).y + 44}px)` }}>
            <rect width="68" height="21" rx="10" fill="none" stroke="var(--text)" strokeDasharray="4 3" />
            <text x="34" y="15" textAnchor="middle" className="ref-text head">HEAD</text>
          </g>
        )}
      </svg>
    </div>
  );
});

export default CommitGraph;
