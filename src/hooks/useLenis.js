import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion';

let instance = null;
export const getLenis = () => instance;

/** One Lenis instance for the whole page, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export default function useLenis() {
  const ref = useRef(null);
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      smoothWheel: !prefersReducedMotion(),
      anchors: true,
    });
    instance = ref.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      instance = null;
    };
  }, []);
  return ref;
}
