import useFetch, { getJSON } from './useFetch';
import { ErrorBox } from './GitHubCard';

// LeetCode has no official public API; this community API can sleep, so we fail gracefully.
export default function LeetCode({ user }) {
  const { data, error, loading, reload } = useFetch(user ? `lc:${user}` : null, () => getJSON(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(user)}/solved`), 30 * 60 * 1000);
  if (!user) return <p className="muted">Optional: add your LeetCode username in Settings. (Uses a free community API, so it can be slow to wake up.)</p>;
  if (loading && !data) return <div className="skeleton-stack"><i /><i /></div>;
  if (error && !data) return <ErrorBox msg="The community LeetCode API is asleep right now." retry={reload} />;
  const rows = [
    ['Easy', data.easySolved, 'var(--accent)'],
    ['Medium', data.mediumSolved, 'var(--branch-4)'],
    ['Hard', data.hardSolved, '#f85149'],
  ];
  const total = data.solvedProblem ?? rows.reduce((s, r) => s + (r[1] || 0), 0);
  return (
    <div className="lc">
      <p className="lc-total"><b>{total}</b> solved</p>
      {rows.map(([l, n, c]) => (
        <div className="lc-row" key={l}>
          <span>{l}</span>
          <div className="lc-bar"><i style={{ width: `${total ? ((n || 0) / total) * 100 : 0}%`, background: c }} /></div>
          <b className="mono">{n ?? 0}</b>
        </div>
      ))}
    </div>
  );
}
