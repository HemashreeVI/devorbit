import useFetch, { getJSON, ago } from './useFetch';
import { ErrorBox } from './GitHubCard';
import Icon from '../components/Icon';

const HN = 'https://hacker-news.firebaseio.com/v0';
const domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'news.ycombinator.com'; } };

export function useNews() {
  return useFetch('hn:top', async () => {
    const ids = await getJSON(`${HN}/topstories.json`);
    return Promise.all(ids.slice(0, 10).map((id) => getJSON(`${HN}/item/${id}.json`)));
  }, 5 * 60 * 1000);
}

export default function NewsFeed({ news }) {
  const { data, error, loading } = news;
  if (loading && !data) return <div className="skeleton-stack"><i /><i /><i /><i /></div>;
  if (error && !data) return <ErrorBox msg={error} retry={news.reload} />;
  return (
    <ol className="news" data-lenis-prevent>
      {data.filter(Boolean).map((s, i) => (
        <li key={s.id}>
          <span className="news-rank mono">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <a href={s.url || `https://news.ycombinator.com/item?id=${s.id}`} target="_blank" rel="noreferrer">{s.title}</a>
            <p className="muted small">
              {domain(s.url)} · ▲ {s.score} ·{' '}
              <a className="muted" href={`https://news.ycombinator.com/item?id=${s.id}`} target="_blank" rel="noreferrer"><Icon name="message" size={12} /> {s.descendants ?? 0}</a> · {ago(s.time * 1000)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
