import { useState } from 'react';
import Icon from '../components/Icon';
import useLocalStorage from '../hooks/useLocalStorage';

const DEFAULTS = [
  { id: 1, name: 'GitHub', url: 'https://github.com/HemashreeVI' },
  { id: 2, name: 'LeetCode', url: 'https://leetcode.com/problemset/' },
  { id: 3, name: 'Portfolio', url: 'https://hemashreevi.github.io/' },
  { id: 4, name: 'MDN', url: 'https://developer.mozilla.org/' },
];

const host = (u) => { try { return new URL(u).hostname; } catch { return ''; } };

export default function QuickLinks() {
  const [links, setLinks] = useLocalStorage('devorbit.links', DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const add = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const full = /^https?:\/\//.test(url) ? url : `https://${url}`;
    setLinks([...links, { id: Date.now(), name: name.trim(), url: full }]);
    setName('');
    setUrl('');
  };

  return (
    <div className="links">
      <ul className="link-grid">
        {links.map((l) => (
          <li key={l.id}>
            <a className="link-tile" href={l.url} target="_blank" rel="noreferrer">
              <img src={`https://www.google.com/s2/favicons?domain=${host(l.url)}&sz=64`} alt="" width="22" height="22" loading="lazy" />
              <span>{l.name}</span>
            </a>
            {editing && (
              <button className="tile-x" aria-label={`Remove ${l.name}`} onClick={() => setLinks(links.filter((x) => x.id !== l.id))}><Icon name="x" size={12} /></button>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <form className="inline-form" onSubmit={add}>
          <input aria-label="Link name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input aria-label="Link URL" placeholder="github.com/you" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn btn-primary icon-btn" aria-label="Add link"><Icon name="plus" /></button>
        </form>
      )}
      <button className="btn btn-link small" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit links'}</button>
    </div>
  );
}
