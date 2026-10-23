import { useEffect, useState } from 'react';
import DecryptedText from '../bits/DecryptedText';

const mood = (h) =>
  h < 5 ? ['Burning the midnight oil', 'Late-night commits hit different.']
  : h < 12 ? ['Good morning', 'Fresh day, clean working tree.']
  : h < 17 ? ['Good afternoon', 'Keep the streak alive.']
  : h < 21 ? ['Good evening', 'One more PR, then rest.']
  : ['Good night', 'Push, then sleep.'];

const TIPS = [
  'git switch -c <name> is the modern way to create and switch branches.',
  'git log --oneline --graph draws the same picture as the Git Lab — in your terminal.',
  'Small commits with clear messages are a gift to future you.',
  'git stash saves half-done work without committing it.',
  'git reflog can rescue commits you thought reset --hard destroyed.',
  'Pomodoro tip: write down the ONE thing before you press start.',
  'Read the error message twice before searching it.',
  'git commit --amend fixes the last commit message (before you push).',
];

export default function Clock({ name }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const [greet, sub] = mood(now.getHours());
  const tip = TIPS[(now.getDate() + now.getMonth()) % TIPS.length];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const dayPct = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

  return (
    <div className="clock">
      <p className="clock-greet">
        <DecryptedText text={`${greet}, ${name || 'friend'}`} animateOn="view" sequential speed={35} revealDirection="start" />
      </p>
      <p className="clock-sub">{sub}</p>
      <div className="clock-time mono" aria-label={`${hh}:${mm}`}>
        {hh}<span className="blink">:</span>{mm}<small>{ss}</small>
      </div>
      <p className="clock-date">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <div className="day-bar" title={`${Math.round(dayPct)}% of the day gone`}>
        <i style={{ width: `${dayPct}%` }} />
      </div>
      <p className="tip"><b>tip</b> {tip}</p>
    </div>
  );
}
