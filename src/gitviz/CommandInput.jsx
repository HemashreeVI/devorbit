import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const COMMANDS = ['git commit -m ""', 'git branch ', 'git checkout ', 'git checkout -b ', 'git switch -c ', 'git merge ', 'git rebase ', 'git cherry-pick ', 'git reset --hard ', 'git tag ', 'git log', 'git status', 'help', 'undo', 'redo', 'clear'];

/** Terminal-style input: history with ↑/↓, Tab completion for commands and branch names. */
const CommandInput = forwardRef(function CommandInput({ lines, onRun, refs }, ref) {
  const [value, setValue] = useState('');
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const input = useRef(null);
  const out = useRef(null);

  useImperativeHandle(ref, () => ({
    insert: (text) => {
      setValue((v) => (v.endsWith(' ') || !v ? v + text : `${v} ${text}`));
      input.current?.focus();
    },
    set: (text) => { setValue(text); input.current?.focus(); },
    focus: () => input.current?.focus(),
  }));

  useEffect(() => {
    out.current?.scrollTo({ top: out.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    const cmd = value.trim();
    if (!cmd) return;
    onRun(cmd);
    setHist((h) => [cmd, ...h.filter((x) => x !== cmd)].slice(0, 50));
    setHi(-1);
    setValue('');
  };

  const onKey = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(hi + 1, hist.length - 1);
      if (hist[n] !== undefined) { setHi(n); setValue(hist[n]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = hi - 1;
      setHi(Math.max(n, -1));
      setValue(n >= 0 ? hist[n] : '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = value.split(' ');
      const last = parts.at(-1);
      if (parts.length > 2 || (parts.length === 2 && value.endsWith(' '))) {
        const hit = refs.find((r) => r.startsWith(last));
        if (hit) setValue([...parts.slice(0, -1), hit].join(' '));
      } else {
        const hit = COMMANDS.find((c) => c.startsWith(value) && c !== value);
        if (hit) setValue(hit.replace('""', '"'));
      }
    }
  };

  return (
    <div className="terminal" onClick={() => input.current?.focus()} data-tour="terminal">
      <div className="term-bar">
        <i /><i /><i />
        <span className="mono">~/devorbit-lab — zsh</span>
      </div>
      <div className="term-out mono" ref={out} data-lenis-prevent aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.kind}`}>
            {l.kind === 'cmd' && <span className="prompt">❯ </span>}
            {l.text}
          </div>
        ))}
      </div>
      <form className="term-in mono" onSubmit={submit}>
        <span className="prompt">❯</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder='try: git commit -m "first"   (Tab completes, ↑ recalls)'
          aria-label="Git command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <button className="btn btn-primary small">Run ⏎</button>
      </form>
    </div>
  );
});

export default CommandInput;
