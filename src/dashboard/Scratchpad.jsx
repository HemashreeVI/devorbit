import useLocalStorage from '../hooks/useLocalStorage';

export default function Scratchpad() {
  const [text, setText] = useLocalStorage('devorbit.notes', '');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="scratch">
      <textarea aria-label="Scratchpad notes" data-lenis-prevent value={text} onChange={(e) => setText(e.target.value)} placeholder={'Paste a snippet, a link, a thought…\nAutosaves as you type.'} spellCheck="false" />
      <p className="muted small mono">{words} words · saved locally</p>
    </div>
  );
}
