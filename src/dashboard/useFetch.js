import { useCallback, useEffect, useState } from 'react';

const cache = new Map();

/** Fetch JSON with a short in-memory + sessionStorage cache so tab switches don't burn API quota. */
export default function useFetch(key, loader, ttl = 10 * 60 * 1000) {
  const [state, setState] = useState({ data: null, error: null, loading: !!key });
  const load = useCallback(
    async (force = false) => {
      if (!key) return;
      const hit = cache.get(key) || JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!force && hit && Date.now() - hit.t < ttl) return setState({ data: hit.data, error: null, loading: false });
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await loader();
        const entry = { t: Date.now(), data };
        cache.set(key, entry);
        try { sessionStorage.setItem(key, JSON.stringify(entry)); } catch { /* quota */ }
        setState({ data, error: null, loading: false });
      } catch (e) {
        setState({ data: hit?.data ?? null, error: e.message || 'Request failed', loading: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: () => load(true) };
}

export async function getJSON(url) {
  const r = await fetch(url);
  if (r.status === 403) throw new Error('Rate limit reached — try again in a bit.');
  if (r.status === 404) throw new Error('Not found — check the username in Settings.');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const ago = (ms) => {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};
