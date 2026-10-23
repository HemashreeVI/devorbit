import { useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';

export default function Settings({ settings, update, close, startTour }) {
  const [form, setForm] = useState({ name: settings.name, github: settings.github, leetcode: settings.leetcode });
  const save = (e) => {
    e.preventDefault();
    update({ name: form.name.trim(), github: form.github.trim().replace(/^@/, ''), leetcode: form.leetcode.trim() });
    Object.keys(sessionStorage).filter((k) => k.startsWith('gh:') || k.startsWith('lc:')).forEach((k) => sessionStorage.removeItem(k));
    close();
  };
  const wipe = () => {
    if (!confirm('Erase all DevOrbit data in this browser (links, todos, notes, git lab, settings)?')) return;
    Object.keys(localStorage).filter((k) => k.startsWith('devorbit.')).forEach((k) => localStorage.removeItem(k));
    location.hash = '';
    location.reload();
  };
  const field = (k, label, hint, ph) => (
    <label className="field">
      <span>{label}</span>
      <input value={form[k]} placeholder={ph} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  return (
    <Modal close={close} label="Settings" className="settings">
      <form onSubmit={save}>
        <header className="modal-head">
          <h2><Icon name="settings" /> Settings</h2>
          <button type="button" className="icon-btn ghost" onClick={close} aria-label="Close"><Icon name="x" /></button>
        </header>
        {field('name', 'Your name', 'Used in the greeting.', 'Hema')}
        {field('github', 'GitHub username', 'Public data only — no token needed.', 'HemashreeVI')}
        {field('leetcode', 'LeetCode username (optional)', 'Uses a community API that may be slow.', '')}
        <div className="field-row">
          <span>Theme</span>
          <div className="pomo-modes">
            {['dark', 'light'].map((t) => (
              <button type="button" key={t} className={`seg ${settings.theme === t ? 'on' : ''}`} onClick={() => update({ theme: t })}>
                <Icon name={t === 'dark' ? 'moon' : 'sun'} size={13} /> {t}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-link small danger" onClick={wipe}><Icon name="trash" size={14} /> Erase my data</button>
          <button type="button" className="btn btn-ghost" onClick={startTour}><Icon name="help" /> Replay tour</button>
          <button className="btn btn-primary"><Icon name="check" /> Save</button>
        </div>
      </form>
    </Modal>
  );
}
