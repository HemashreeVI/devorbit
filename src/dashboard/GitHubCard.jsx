import useFetch, { getJSON, ago } from './useFetch';
import Icon from '../components/Icon';
import CountUp from '../bits/CountUp';

const LANG = { JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26', CSS: '#563d7c', 'Jupyter Notebook': '#DA5B0B', Go: '#00ADD8', Rust: '#dea584', Shell: '#89e051', Kotlin: '#A97BFF', Dart: '#00B4AB', Swift: '#F05138', Vue: '#41b883' };
const EVENT = { PushEvent: 'pushed to', CreateEvent: 'created', WatchEvent: 'starred', ForkEvent: 'forked', PullRequestEvent: 'opened a PR in', IssuesEvent: 'opened an issue in', PublicEvent: 'open-sourced' };

export default function GitHubCard({ user }) {
  const { data, error, loading, reload } = useFetch(user ? `gh:${user}` : null, async () => {
    const base = `https://api.github.com/users/${encodeURIComponent(user)}`;
    const [profile, repos, events] = await Promise.all([
      getJSON(base),
      getJSON(`${base}/repos?per_page=100&sort=pushed`),
      getJSON(`${base}/events/public?per_page=30`).catch(() => []),
    ]);
    return { profile, repos, events };
  });

  if (!user) return <p className="muted">Add your GitHub username in Settings to see your card.</p>;
  if (loading && !data) return <div className="skeleton-stack"><i /><i /><i /></div>;
  if (error && !data) return <ErrorBox msg={error} retry={reload} />;

  const { profile: p, repos, events } = data;
  const own = repos.filter((r) => !r.fork);
  const stars = own.reduce((s, r) => s + r.stargazers_count, 0);
  const langs = {};
  own.forEach((r) => r.language && (langs[r.language] = (langs[r.language] || 0) + 1));
  const langList = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  const langTotal = langList.reduce((s, [, n]) => s + n, 0) || 1;
  const pulse = events.filter((e) => EVENT[e.type]).slice(0, 4);

  return (
    <div className="gh">
      <div className="gh-top">
        <img className="gh-avatar" src={p.avatar_url} alt="" width="64" height="64" />
        <div>
          <a className="gh-name" href={p.html_url} target="_blank" rel="noreferrer">{p.name || p.login} <Icon name="external" size={13} /></a>
          <p className="muted mono small">@{p.login}</p>
          {p.bio && <p className="gh-bio">{p.bio}</p>}
        </div>
      </div>
      <div className="gh-stats">
        <div><b><CountUp to={p.public_repos} duration={1.2} /></b><span>repos</span></div>
        <div><b><CountUp to={p.followers} duration={1.2} /></b><span>followers</span></div>
        <div><b><CountUp to={stars} duration={1.2} /></b><span>stars</span></div>
      </div>
      {langList.length > 0 && (
        <div className="gh-langs">
          <div className="lang-bar">
            {langList.map(([l, n]) => <i key={l} style={{ flex: n, background: LANG[l] || 'var(--muted)' }} title={`${l}: ${n} repos`} />)}
          </div>
          <ul className="lang-legend">
            {langList.slice(0, 5).map(([l, n]) => (
              <li key={l}><i style={{ background: LANG[l] || 'var(--muted)' }} />{l} <span className="muted">{Math.round((n / langTotal) * 100)}%</span></li>
            ))}
          </ul>
        </div>
      )}
      <h3 className="sub-h">Latest repos</h3>
      <ul className="gh-repos">
        {repos.slice(0, 4).map((r) => (
          <li key={r.id}>
            <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
            <span className="muted small">{r.language && <><i className="dot" style={{ background: LANG[r.language] || 'var(--muted)' }} />{r.language} · </>}★ {r.stargazers_count} · {ago(new Date(r.pushed_at).getTime())}</span>
          </li>
        ))}
      </ul>
      {pulse.length > 0 && (
        <>
          <h3 className="sub-h">Activity pulse</h3>
          <ul className="gh-pulse">
            {pulse.map((e) => (
              <li key={e.id}><span className="pulse-ping" /> {EVENT[e.type]} <b>{e.repo.name.split('/')[1]}</b> <span className="muted small">{ago(new Date(e.created_at).getTime())}</span></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ErrorBox({ msg, retry }) {
  return (
    <div className="error-box">
      <p>{msg}</p>
      {retry && <button className="btn btn-ghost small" onClick={retry}><Icon name="rotate" size={14} /> Retry</button>}
    </div>
  );
}
