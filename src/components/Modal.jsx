import { useEffect, useRef } from 'react';
import { gsap } from '../lib/motion';
import { getLenis } from '../hooks/useLenis';

/** Accessible modal shell with a springy entrance; Esc / backdrop closes it. */
export default function Modal({ close, children, className = '', label }) {
  const box = useRef(null);
  const back = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    getLenis()?.stop();
    gsap.fromTo(back.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(box.current, { y: 30, scale: 0.94, opacity: 0, rotateX: 12 }, { y: 0, scale: 1, opacity: 1, rotateX: 0, duration: 0.55, ease: 'back.out(1.6)' });
    const prev = document.activeElement;
    box.current.querySelector('input, button')?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      getLenis()?.start();
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-back" ref={back} onMouseDown={(e) => e.target === back.current && close()}>
      <div className={`modal ${className}`} ref={box} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
